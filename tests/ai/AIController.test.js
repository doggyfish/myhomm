import { jest } from '@jest/globals';
import { AIController } from '../../src/ai/AIController.js';
import { Player } from '../../src/game/Player.js';
import { AIDecision } from '../../src/ai/AIDecision.js';
import { ConfigurationManager } from '../../src/config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

describe('AIController', () => {
    let player;
    let aiController;
    let mockGameState;

    beforeEach(() => {
        player = new Player('ai_player_1', 'AI Test Player', 'human', true);
        aiController = new AIController(player, 'medium');
        
        mockGameState = {
            isPaused: false,
            players: [player],
            entities: new Map(),
            currentTick: 0
        };

        // Reset configuration
        CONFIG.reset();
    });

    afterEach(() => {
        if (aiController) {
            aiController.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with correct player and difficulty', () => {
            expect(aiController.player).toBe(player);
            expect(aiController.difficulty).toBe('medium');
            expect(aiController.isActive).toBe(true);
        });

        test('should initialize with default strategies', () => {
            expect(aiController.strategies.size).toBe(3);
            expect(aiController.getStrategy('economic')).toBeDefined();
            expect(aiController.getStrategy('military')).toBeDefined();
            expect(aiController.getStrategy('movement')).toBeDefined();
        });

        test('should use configuration values', () => {
            const expectedInterval = CONFIG.get('ai.decisionInterval') || 2000;
            const expectedMaxTime = CONFIG.get('ai.maxDecisionTime') || 500;
            
            expect(aiController.decisionInterval).toBe(expectedInterval);
            expect(aiController.maxDecisionTime).toBe(expectedMaxTime);
        });
    });

    describe('Decision Making', () => {
        test('should make decisions when interval is reached', () => {
            // Set last decision time to force decision making
            aiController.lastDecisionTime = Date.now() - aiController.decisionInterval - 100;
            
            const gatherDecisionsSpy = jest.spyOn(aiController, 'gatherDecisions').mockReturnValue([]);
            
            aiController.update(mockGameState, 1000);
            
            expect(gatherDecisionsSpy).toHaveBeenCalledWith(mockGameState);
            
            gatherDecisionsSpy.mockRestore();
        });

        test('should not make decisions when paused', () => {
            mockGameState.isPaused = true;
            aiController.lastDecisionTime = 0; // Force decision timing
            
            const makeDecisionsSpy = jest.spyOn(aiController, 'makeDecisions');
            
            aiController.update(mockGameState, 1000);
            
            expect(makeDecisionsSpy).not.toHaveBeenCalled();
            
            makeDecisionsSpy.mockRestore();
        });

        test('should not make decisions when inactive', () => {
            aiController.isActive = false;
            aiController.lastDecisionTime = 0; // Force decision timing
            
            const makeDecisionsSpy = jest.spyOn(aiController, 'makeDecisions');
            
            aiController.update(mockGameState, 1000);
            
            expect(makeDecisionsSpy).not.toHaveBeenCalled();
            
            makeDecisionsSpy.mockRestore();
        });

        test('should respect decision time budget', (done) => {
            const startTime = performance.now();
            
            // Mock strategies to return many decisions
            const mockDecisions = Array.from({ length: 100 }, (_, i) => 
                new AIDecision('build', 50, `action_${i}`, null, 0, 10)
            );
            
            jest.spyOn(aiController, 'gatherDecisions').mockReturnValue(mockDecisions);
            jest.spyOn(aiController, 'executeDecision').mockImplementation(() => {
                // Simulate some processing time
                const delay = 10;
                const start = Date.now();
                while (Date.now() - start < delay) {
                    // Busy wait
                }
                return true;
            });

            aiController.makeDecisions(mockGameState);
            
            const executionTime = performance.now() - startTime;
            expect(executionTime).toBeLessThan(aiController.maxDecisionTime + 100); // Small buffer for test overhead
            
            done();
        }, 10000);
    });

    describe('Strategy Management', () => {
        test('should add and retrieve strategies', () => {
            const mockStrategy = {
                enabled: true,
                evaluate: jest.fn(() => []),
                shouldEvaluate: jest.fn(() => true),
                markEvaluated: jest.fn()
            };
            
            aiController.addStrategy('test', mockStrategy);
            
            expect(aiController.getStrategy('test')).toBe(mockStrategy);
            expect(aiController.strategies.size).toBe(4); // 3 default + 1 test
        });

        test('should remove strategies', () => {
            expect(aiController.removeStrategy('economic')).toBe(true);
            expect(aiController.getStrategy('economic')).toBeUndefined();
            expect(aiController.strategies.size).toBe(2);
        });

        test('should gather decisions from enabled strategies', () => {
            const mockDecision = new AIDecision('test', 50, 'test_action', null, 0, 10);
            
            // Mock all strategies to return decisions
            aiController.strategies.forEach(strategy => {
                strategy.enabled = true;
                strategy.shouldEvaluate = jest.fn(() => true);
                strategy.evaluate = jest.fn(() => [mockDecision]);
                strategy.markEvaluated = jest.fn();
            });
            
            const decisions = aiController.gatherDecisions(mockGameState);
            
            expect(decisions).toHaveLength(3); // One from each strategy
            expect(decisions[0]).toBeInstanceOf(AIDecision);
        });
    });

    describe('Decision Prioritization', () => {
        test('should sort decisions by priority (highest first)', () => {
            const decisions = [
                new AIDecision('build', 30, 'low_priority', null, 0, 10),
                new AIDecision('attack', 90, 'high_priority', null, 0, 20),
                new AIDecision('move', 60, 'medium_priority', null, 0, 15)
            ];
            
            const prioritized = aiController.prioritizeDecisions(decisions);
            
            expect(prioritized[0].priority).toBe(90);
            expect(prioritized[1].priority).toBe(60);
            expect(prioritized[2].priority).toBe(30);
        });

        test('should sort by expected benefit when priorities are equal', () => {
            const decisions = [
                new AIDecision('build', 50, 'action1', null, 0, 10),
                new AIDecision('attack', 50, 'action2', null, 0, 30),
                new AIDecision('move', 50, 'action3', null, 0, 20)
            ];
            
            const prioritized = aiController.prioritizeDecisions(decisions);
            
            expect(prioritized[0].expectedBenefit).toBe(30);
            expect(prioritized[1].expectedBenefit).toBe(20);
            expect(prioritized[2].expectedBenefit).toBe(10);
        });

        test('should filter out invalid decisions', () => {
            const decisions = [
                new AIDecision('build', 50, 'valid_action', null, 0, 10),
                new AIDecision('', 50, 'invalid_action', null, 0, 10), // Invalid type
                new AIDecision('move', -10, 'invalid_priority', null, 0, 10) // Invalid priority
            ];
            
            const prioritized = aiController.prioritizeDecisions(decisions);
            
            expect(prioritized).toHaveLength(1);
            expect(prioritized[0].action).toBe('valid_action');
        });
    });

    describe('Pause System Integration', () => {
        test('should pause correctly', () => {
            const emitEventSpy = jest.spyOn(aiController, 'emitEvent');
            
            aiController.pause();
            
            expect(aiController.isActive).toBe(false);
            expect(emitEventSpy).toHaveBeenCalledWith('ai:paused', {
                playerId: player.id,
                timestamp: expect.any(Number)
            });
            
            emitEventSpy.mockRestore();
        });

        test('should resume correctly', () => {
            aiController.pause();
            const emitEventSpy = jest.spyOn(aiController, 'emitEvent');
            
            aiController.resume();
            
            expect(aiController.isActive).toBe(true);
            expect(emitEventSpy).toHaveBeenCalledWith('ai:resumed', {
                playerId: player.id,
                timestamp: expect.any(Number)
            });
            
            emitEventSpy.mockRestore();
        });

        test('should pause all strategies when paused', () => {
            const strategy = aiController.getStrategy('economic');
            const pauseSpy = jest.spyOn(strategy, 'pause');
            
            aiController.pause();
            
            expect(pauseSpy).toHaveBeenCalled();
            
            pauseSpy.mockRestore();
        });
    });

    describe('Difficulty Settings', () => {
        test('should update decision interval based on difficulty', () => {
            CONFIG.set('ai.difficulty.hard.decisionInterval', 1500);
            
            aiController.setDifficulty('hard');
            
            expect(aiController.difficulty).toBe('hard');
            expect(aiController.decisionInterval).toBe(1500);
        });

        test('should update strategies when difficulty changes', () => {
            const strategy = aiController.getStrategy('economic');
            const setDifficultySpy = jest.spyOn(strategy, 'setDifficulty');
            
            aiController.setDifficulty('expert');
            
            expect(setDifficultySpy).toHaveBeenCalledWith('expert');
            
            setDifficultySpy.mockRestore();
        });
    });

    describe('Performance Monitoring', () => {
        test('should warn when decision cycle exceeds time limit', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock slow decision execution
            jest.spyOn(aiController, 'gatherDecisions').mockImplementation(() => {
                // Simulate slow processing
                const start = Date.now();
                while (Date.now() - start < 600) {
                    // Busy wait to exceed 500ms limit
                }
                return [];
            });
            
            aiController.makeDecisions(mockGameState);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('AI decision cycle took')
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Event Emission', () => {
        test('should emit decision-made event after making decisions', () => {
            const emitEventSpy = jest.spyOn(aiController, 'emitEvent');
            
            aiController.makeDecisions(mockGameState);
            
            expect(emitEventSpy).toHaveBeenCalledWith('ai:decision-made', {
                playerId: player.id,
                decisionsCount: expect.any(Number),
                decisionTime: expect.any(Number)
            });
            
            emitEventSpy.mockRestore();
        });

        test('should emit strategy-evaluation event after gathering decisions', () => {
            const emitEventSpy = jest.spyOn(aiController, 'emitEvent');
            
            aiController.gatherDecisions(mockGameState);
            
            expect(emitEventSpy).toHaveBeenCalledWith('ai:strategy-evaluation', {
                playerId: player.id,
                strategiesEvaluated: expect.any(Number),
                decisionsGenerated: expect.any(Number)
            });
            
            emitEventSpy.mockRestore();
        });
    });

    describe('Status and Cleanup', () => {
        test('should return correct status', () => {
            const status = aiController.getStatus();
            
            expect(status).toEqual({
                playerId: player.id,
                isActive: true,
                difficulty: 'medium',
                strategiesCount: 3,
                lastDecisionTime: expect.any(Number),
                decisionInterval: expect.any(Number)
            });
        });

        test('should clean up correctly when destroyed', () => {
            aiController.destroy();
            
            expect(aiController.isActive).toBe(false);
            expect(aiController.strategies.size).toBe(0);
            expect(aiController.decisionQueue).toHaveLength(0);
        });
    });
});