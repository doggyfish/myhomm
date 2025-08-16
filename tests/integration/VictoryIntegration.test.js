/**
 * Integration tests for Victory System
 * Tests complete victory flow with real game systems
 */

import { VictorySystem } from '../../src/systems/VictorySystem.js';
import { EndGameManager } from '../../src/managers/EndGameManager.js';
import { GameStateManager } from '../../src/game/GameStateManager.js';
import { Castle } from '../../src/entities/Castle.js';
import { Player } from '../../src/game/Player.js';
import { VICTORY_EVENTS } from '../../src/events/VictoryEvents.js';

// Mock Phaser scene for integration testing
class MockScene {
    constructor() {
        this.scale = { width: 1024, height: 768 };
        this.add = {
            existing: jest.fn(),
            container: jest.fn(() => ({
                add: jest.fn(),
                setDepth: jest.fn(),
                destroy: jest.fn(),
                setVisible: jest.fn()
            })),
            rectangle: jest.fn(() => ({ 
                setStrokeStyle: jest.fn(),
                setOrigin: jest.fn()
            })),
            text: jest.fn(() => ({ 
                setOrigin: jest.fn(),
                setScale: jest.fn(),
                on: jest.fn()
            })),
            particles: jest.fn(() => ({
                setDepth: jest.fn(),
                stop: jest.fn()
            }))
        };
        this.time = {
            delayedCall: jest.fn((delay, callback) => setTimeout(callback, delay))
        };
        this.events = {
            emit: jest.fn()
        };
        this.sound = {
            play: jest.fn()
        };
        this.input = {
            keyboard: {
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn()
            }
        };
        this.tweens = {
            add: jest.fn(config => {
                if (config.onComplete) {
                    setTimeout(config.onComplete, 100);
                }
            })
        };
    }
}

// Mock configuration
const mockConfig = {
    data: {
        'victory.checkIntervalMs': 50, // Faster for testing
        'victory.economicVictoryEnabled': false,
        'victory.timeLimitEnabled': false,
        'victory.economicTarget.gold': 10000,
        'victory.economicTarget.rareResourceAmount': 1000,
        'victory.endGameReviewEnabled': true,
        'victory.celebrationDuration': 1000
    },
    get(key) {
        return this.data[key];
    }
};

describe('Victory System Integration', () => {
    let gameStateManager;
    let victorySystem;
    let endGameManager;
    let scene;
    let player1, player2;
    
    beforeEach(() => {
        scene = new MockScene();
        gameStateManager = new GameStateManager(mockConfig);
        victorySystem = new VictorySystem(mockConfig, gameStateManager);
        endGameManager = new EndGameManager(scene, victorySystem, gameStateManager);
        
        // Create test players
        player1 = new Player('player1', 'Human Player', 'human', false);
        player2 = new Player('player2', 'AI Player', 'orc', true);
        
        gameStateManager.addPlayer(player1);
        gameStateManager.addPlayer(player2);
    });
    
    afterEach(() => {
        if (victorySystem) {
            victorySystem.removeAllListeners();
        }
        if (endGameManager) {
            endGameManager.cleanup();
        }
    });
    
    describe('complete victory flow', () => {
        test('should detect victory when player destroys enemy castle', (done) => {
            // Setup: Give each player a castle
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            // Listen for game end event
            let gameEnded = false;
            endGameManager.victorySystem.on(VICTORY_EVENTS.GAME_ENDED, (data) => {
                gameEnded = true;
                expect(data.winner).toBe(player1);
                expect(data.reason).toBe('castle_elimination');
                expect(gameStateManager.winner).toBe(player1);
                expect(endGameManager.isEndGameActive).toBe(true);
                done();
            });
            
            // Simulate castle destruction
            castle2.destroy(player1);
            
            // Run victory system update to detect victory
            victorySystem.update(100);
            
            if (!gameEnded) {
                done.fail('Victory not detected within timeout');
            }
        }, 5000);
        
        test('should handle simultaneous castle destruction (draw)', (done) => {
            // Setup: Single castle for each player
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            endGameManager.victorySystem.on(VICTORY_EVENTS.GAME_ENDED, (data) => {
                expect(data.winner).toBe(null);
                expect(data.reason).toBe('castle_elimination');
                expect(player1.isAlive).toBe(false);
                expect(player2.isAlive).toBe(false);
                done();
            });
            
            // Simulate simultaneous destruction
            castle1.destroy(player2);
            castle2.destroy(player1);
            
            victorySystem.update(100);
        }, 5000);
        
        test('should handle player elimination correctly', (done) => {
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            let playerEliminated = false;
            let gameEnded = false;
            
            victorySystem.on(VICTORY_EVENTS.PLAYER_ELIMINATED, (data) => {
                playerEliminated = true;
                expect(data.player).toBe(player2);
                expect(data.destroyer).toBe(player1);
                expect(player2.isAlive).toBe(false);
            });
            
            victorySystem.on(VICTORY_EVENTS.GAME_ENDED, (data) => {
                gameEnded = true;
                expect(playerEliminated).toBe(true);
                expect(data.winner).toBe(player1);
                done();
            });
            
            castle2.destroy(player1);
            victorySystem.update(100);
        }, 5000);
    });
    
    describe('economic victory integration', () => {
        beforeEach(() => {
            mockConfig.data['victory.economicVictoryEnabled'] = true;
            victorySystem = new VictorySystem(mockConfig, gameStateManager);
            endGameManager = new EndGameManager(scene, victorySystem, gameStateManager);
        });
        
        test('should detect economic victory with sufficient resources', (done) => {
            // Give player1 economic victory resources
            player1.resourceManager.setResource('gold', 15000);
            player1.resourceManager.setResource('mercury', 1500);
            player1.resourceManager.setResource('sulfur', 1500);
            player1.resourceManager.setResource('crystal', 1500);
            
            victorySystem.on(VICTORY_EVENTS.VICTORY_DETECTED, (data) => {
                expect(data.condition.type).toBe('economic');
                expect(gameStateManager.winner).toBe(player1);
                done();
            });
            
            victorySystem.update(100);
        }, 5000);
    });
    
    describe('pause system integration', () => {
        test('should pause game on end game and allow review', (done) => {
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            victorySystem.on(VICTORY_EVENTS.GAME_ENDED, () => {
                // Game should be paused automatically
                expect(gameStateManager.isPaused).toBe(true);
                expect(gameStateManager.pauseReason).toBe('game_ended');
                
                // Test review pause functionality
                endGameManager.pauseForReview();
                expect(gameStateManager.pauseReason).toBe('end_game_review');
                
                done();
            });
            
            castle2.destroy(player1);
            victorySystem.update(100);
        }, 5000);
        
        test('should not run victory checks when paused', () => {
            gameStateManager.pause('user');
            
            const checkSpy = jest.spyOn(victorySystem, 'checkCastleElimination');
            victorySystem.update(200); // Well above check interval
            
            expect(checkSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('performance integration', () => {
        test('should maintain performance with many entities', () => {
            // Create many entities to test performance
            for (let i = 0; i < 50; i++) {
                const castle = new Castle(`castle${i}`, i * 10, 100, i < 25 ? player1 : player2);
                gameStateManager.addEntity(castle);
            }
            
            const startTime = performance.now();
            
            // Run multiple victory checks
            for (let i = 0; i < 10; i++) {
                victorySystem.update(100);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Should complete all checks within reasonable time
            expect(totalTime).toBeLessThan(1000); // 1 second for 10 checks with 50 entities
        });
        
        test('should throttle victory checks properly', () => {
            const checkSpy = jest.spyOn(victorySystem, 'checkCastleElimination');
            
            // Multiple rapid updates
            victorySystem.update(20);
            victorySystem.update(20);
            victorySystem.update(20);
            
            // Should only check once due to throttling
            expect(checkSpy).toHaveBeenCalledTimes(1);
            
            // Update that exceeds interval should trigger another check
            victorySystem.update(50); // Total 110ms, exceeds 50ms test interval
            expect(checkSpy).toHaveBeenCalledTimes(2);
        });
    });
    
    describe('event flow integration', () => {
        test('should emit events in correct order', (done) => {
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            const eventOrder = [];
            
            gameStateManager.on(VICTORY_EVENTS.CASTLE_DESTROYED, () => {
                eventOrder.push('castle_destroyed');
            });
            
            victorySystem.on(VICTORY_EVENTS.PLAYER_ELIMINATED, () => {
                eventOrder.push('player_eliminated');
            });
            
            victorySystem.on(VICTORY_EVENTS.VICTORY_DETECTED, () => {
                eventOrder.push('victory_detected');
            });
            
            victorySystem.on(VICTORY_EVENTS.GAME_ENDED, () => {
                eventOrder.push('game_ended');
                
                // Verify correct event order
                expect(eventOrder).toEqual([
                    'castle_destroyed',
                    'player_eliminated',
                    'victory_detected',
                    'game_ended'
                ]);
                done();
            });
            
            castle2.destroy(player1);
            victorySystem.update(100);
        }, 5000);
    });
    
    describe('game summary integration', () => {
        test('should generate accurate game summary with real data', (done) => {
            gameStateManager.battleCount = 3;
            const startTime = Date.now() - 120000; // 2 minutes ago
            gameStateManager.gameStartTime = startTime;
            
            // Add some game state
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            victorySystem.on(VICTORY_EVENTS.GAME_ENDED, (data) => {
                const summary = data.summary;
                
                expect(summary.totalBattles).toBe(3);
                expect(summary.duration).toBeGreaterThan(100000); // Around 2 minutes
                expect(summary.players).toHaveLength(2);
                expect(summary.finalMap.castlesRemaining).toBe(1); // Only winner's castle
                expect(summary.winner).toBe(player1);
                
                done();
            });
            
            castle2.destroy(player1);
            victorySystem.update(100);
        }, 5000);
    });
    
    describe('error handling integration', () => {
        test('should handle missing castle owners gracefully', () => {
            const castle = new Castle('castle1', 100, 100, null); // No owner
            gameStateManager.addEntity(castle);
            
            expect(() => {
                castle.destroy(player1);
                victorySystem.update(100);
            }).not.toThrow();
        });
        
        test('should handle victory system without end game manager', () => {
            endGameManager.cleanup();
            endGameManager = null;
            
            const castle1 = new Castle('castle1', 100, 100, player1);
            const castle2 = new Castle('castle2', 200, 200, player2);
            gameStateManager.addEntity(castle1);
            gameStateManager.addEntity(castle2);
            
            expect(() => {
                castle2.destroy(player1);
                victorySystem.update(100);
            }).not.toThrow();
        });
    });
});