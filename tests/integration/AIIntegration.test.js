import { jest } from '@jest/globals';
import { AIController } from '../../src/ai/AIController.js';
import { Player } from '../../src/game/Player.js';
import { GameStateManager } from '../../src/game/GameStateManager.js';
import { ConfigurationManager } from '../../src/config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

describe('AI Integration Tests', () => {
    let gameStateManager;
    let humanPlayer;
    let aiPlayer;
    let aiController;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
        
        // Create human and AI players
        humanPlayer = new Player('human_1', 'Human Player', 'human', false);
        aiPlayer = new Player('ai_1', 'AI Player', 'orc', true);
        
        // Add players to game state
        gameStateManager.addPlayer(humanPlayer);
        gameStateManager.addPlayer(aiPlayer);
        
        // Manually create AI controller for testing
        aiController = new AIController(aiPlayer, 'medium');
        aiPlayer.setAIController(aiController);

        // Reset configuration
        CONFIG.reset();
        CONFIG.set('ai.debugMode', true); // Enable debug for testing
    });

    afterEach(() => {
        if (aiController) {
            aiController.destroy();
        }
    });

    describe('Player Integration', () => {
        test('should integrate AI controller with player', () => {
            expect(aiPlayer.isAI).toBe(true);
            expect(aiPlayer.aiController).toBe(aiController);
            expect(aiController.player).toBe(aiPlayer);
        });

        test('should update AI through player update method', () => {
            const updateSpy = jest.spyOn(aiController, 'update');
            const gameState = gameStateManager.getGameState();
            
            aiPlayer.updateAI(gameState, 1000);
            
            expect(updateSpy).toHaveBeenCalledWith(gameState, 1000);
            
            updateSpy.mockRestore();
        });

        test('should not update AI for human players', () => {
            expect(humanPlayer.aiController).toBeNull();
            
            // Should not throw error when calling updateAI on human player
            expect(() => {
                const gameState = gameStateManager.getGameState();
                humanPlayer.updateAI(gameState, 1000);
            }).not.toThrow();
        });
    });

    describe('GameStateManager Integration', () => {
        test('should update AI players during game state update', () => {
            const aiUpdateSpy = jest.spyOn(aiPlayer, 'updateAI');
            
            gameStateManager.update(1000);
            
            expect(aiUpdateSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    players: expect.arrayContaining([humanPlayer, aiPlayer]),
                    isPaused: false
                }),
                1000
            );
            
            aiUpdateSpy.mockRestore();
        });

        test('should not update AI when game is paused', () => {
            const aiUpdateSpy = jest.spyOn(aiController, 'update');
            
            gameStateManager.pause('user');
            gameStateManager.update(1000);
            
            // AI update is called but with paused game state
            expect(aiUpdateSpy).toHaveBeenCalledWith(
                expect.objectContaining({ isPaused: true }),
                expect.any(Number)
            );
            
            aiUpdateSpy.mockRestore();
        });

        test('should handle multiple AI players', () => {
            // Add second AI player
            const aiPlayer2 = new Player('ai_2', 'AI Player 2', 'human', true);
            const aiController2 = new AIController(aiPlayer2, 'hard');
            aiPlayer2.setAIController(aiController2);
            
            gameStateManager.addPlayer(aiPlayer2);
            
            const ai1UpdateSpy = jest.spyOn(aiPlayer, 'updateAI');
            const ai2UpdateSpy = jest.spyOn(aiPlayer2, 'updateAI');
            
            gameStateManager.update(1000);
            
            expect(ai1UpdateSpy).toHaveBeenCalled();
            expect(ai2UpdateSpy).toHaveBeenCalled();
            
            ai1UpdateSpy.mockRestore();
            ai2UpdateSpy.mockRestore();
            aiController2.destroy();
        });
    });

    describe('Pause System Integration', () => {
        test('should pause AI when game is paused', () => {
            const aiPauseSpy = jest.spyOn(aiController, 'pause');
            
            // Simulate pause event
            aiController.pause();
            
            expect(aiPauseSpy).toHaveBeenCalled();
            expect(aiController.isActive).toBe(false);
            
            aiPauseSpy.mockRestore();
        });

        test('should resume AI when game is unpaused', () => {
            aiController.pause();
            const aiResumeSpy = jest.spyOn(aiController, 'resume');
            
            aiController.resume();
            
            expect(aiResumeSpy).toHaveBeenCalled();
            expect(aiController.isActive).toBe(true);
            
            aiResumeSpy.mockRestore();
        });

        test('should not make decisions when paused', () => {
            const makeDecisionsSpy = jest.spyOn(aiController, 'makeDecisions');
            
            aiController.pause();
            aiController.lastDecisionTime = 0; // Force decision timing
            
            const gameState = gameStateManager.getGameState();
            gameState.isPaused = true;
            
            aiController.update(gameState, 1000);
            
            expect(makeDecisionsSpy).not.toHaveBeenCalled();
            
            makeDecisionsSpy.mockRestore();
        });
    });

    describe('Resource System Integration', () => {
        test('should consider player resources in AI decisions', () => {
            // Set specific resource levels
            aiPlayer.resourceManager.resources = {
                gold: 500,  // Below threshold
                wood: 1000, // Above threshold
                stone: 200, // Below threshold
                mana: 300   // Above threshold
            };
            
            const economicStrategy = aiController.getStrategy('economic');
            const evaluateSpy = jest.spyOn(economicStrategy, 'evaluate');
            
            const gameState = gameStateManager.getGameState();
            economicStrategy.evaluate(gameState);
            
            expect(evaluateSpy).toHaveBeenCalledWith(gameState);
            
            evaluateSpy.mockRestore();
        });

        test('should update resource manager during game updates', () => {
            const resourceUpdateSpy = jest.spyOn(aiPlayer.resourceManager, 'update');
            
            gameStateManager.update(1000);
            
            expect(resourceUpdateSpy).toHaveBeenCalledWith(1000);
            
            resourceUpdateSpy.mockRestore();
        });
    });

    describe('Event System Integration', () => {
        test('should emit AI events during decision making', () => {
            const events = [];
            
            // Mock event emission
            aiController.emitEvent = jest.fn((eventName, data) => {
                events.push({ eventName, data });
            });
            
            // Force decision making
            aiController.lastDecisionTime = 0;
            const gameState = gameStateManager.getGameState();
            aiController.update(gameState, 1000);
            
            // Check that events were emitted
            const aiEvents = events.filter(e => e.eventName.startsWith('ai:'));
            expect(aiEvents.length).toBeGreaterThan(0);
            
            const decisionEvent = events.find(e => e.eventName === 'ai:decision-made');
            expect(decisionEvent).toBeDefined();
            expect(decisionEvent.data.playerId).toBe(aiPlayer.id);
        });

        test('should handle event system errors gracefully', () => {
            // Mock failing event emission
            aiController.emitEvent = jest.fn(() => {
                throw new Error('Event system error');
            });
            
            // Should not crash when event emission fails
            expect(() => {
                const gameState = gameStateManager.getGameState();
                aiController.makeDecisions(gameState);
            }).not.toThrow();
        });
    });

    describe('Performance Integration', () => {
        test('should complete decision cycles within time budget', (done) => {
            const startTime = performance.now();
            const maxDecisionTime = CONFIG.get('ai.maxDecisionTime') || 500;
            
            // Run multiple decision cycles
            const gameState = gameStateManager.getGameState();
            
            for (let i = 0; i < 5; i++) {
                aiController.lastDecisionTime = 0; // Force decisions
                aiController.update(gameState, 1000);
            }
            
            const totalTime = performance.now() - startTime;
            const averageTime = totalTime / 5;
            
            expect(averageTime).toBeLessThan(maxDecisionTime);
            done();
        }, 10000);

        test('should handle large game states efficiently', () => {
            // Create a larger game state with many entities
            for (let i = 0; i < 100; i++) {
                const entity = {
                    id: `entity_${i}`,
                    type: i % 2 === 0 ? 'army' : 'castle',
                    owner: i % 2 === 0 ? aiPlayer.id : humanPlayer.id
                };
                gameStateManager.addEntity(entity);
            }
            
            const startTime = performance.now();
            const gameState = gameStateManager.getGameState();
            
            aiController.lastDecisionTime = 0;
            aiController.update(gameState, 1000);
            
            const executionTime = performance.now() - startTime;
            expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
        });
    });

    describe('Configuration Integration', () => {
        test('should respect configuration changes', () => {
            const newDecisionInterval = 1500;
            CONFIG.set('ai.decisionInterval', newDecisionInterval);
            
            // Create new AI controller with updated config
            const newAiController = new AIController(aiPlayer, 'medium');
            
            expect(newAiController.decisionInterval).toBe(newDecisionInterval);
            
            newAiController.destroy();
        });

        test('should adapt to difficulty configuration changes', () => {
            CONFIG.set('ai.difficulty.test.decisionInterval', 800);
            
            aiController.setDifficulty('test');
            
            expect(aiController.difficulty).toBe('test');
            expect(aiController.decisionInterval).toBe(800);
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle strategy evaluation errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Mock strategy to throw error
            const economicStrategy = aiController.getStrategy('economic');
            economicStrategy.evaluate = jest.fn(() => {
                throw new Error('Strategy evaluation failed');
            });
            
            const gameState = gameStateManager.getGameState();
            
            // Should not crash the AI controller
            expect(() => {
                aiController.gatherDecisions(gameState);
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Strategy economic evaluation error'),
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });

        test('should handle missing game state gracefully', () => {
            expect(() => {
                aiController.update(null, 1000);
            }).not.toThrow();
            
            expect(() => {
                aiController.update(undefined, 1000);
            }).not.toThrow();
        });
    });
});