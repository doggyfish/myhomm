/**
 * Unit tests for EndGameManager
 * Tests end game state management and screen coordination
 */

import { EndGameManager } from './EndGameManager.js';
import { VICTORY_EVENTS } from '../events/VictoryEvents.js';

// Mock Phaser scene
class MockScene {
    constructor() {
        this.scale = { width: 1024, height: 768 };
        this.add = {
            existing: jest.fn(),
            container: jest.fn(() => ({
                add: jest.fn(),
                setDepth: jest.fn(),
                destroy: jest.fn()
            })),
            rectangle: jest.fn(() => ({ setStrokeStyle: jest.fn() })),
            text: jest.fn(() => ({ setOrigin: jest.fn() }))
        };
        this.time = {
            delayedCall: jest.fn()
        };
        this.events = {
            emit: jest.fn()
        };
        this.sound = {
            play: jest.fn()
        };
    }
}

// Mock victory system
class MockVictorySystem {
    constructor() {
        this.events = new Map();
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }
    
    off(event, callback) {
        const callbacks = this.events.get(event) || [];
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
            callbacks.splice(index, 1);
        }
    }
    
    emit(event, data) {
        const callbacks = this.events.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }
}

// Mock game state
class MockGameState {
    constructor() {
        this.players = [];
        this.isPaused = false;
        this.pauseCallCount = 0;
    }
    
    pause(reason) {
        this.isPaused = true;
        this.pauseReason = reason;
        this.pauseCallCount++;
    }
    
    addPlayer(player) {
        this.players.push(player);
    }
}

// Mock player
class MockPlayer {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;
    }
}

// Mock end game data
const createMockEndGameData = (winner, reason = 'castle_elimination') => ({
    winner,
    reason,
    summary: {
        duration: 300000,
        totalBattles: 5,
        players: [
            { id: 'player1', name: 'Human Player', isAlive: true },
            { id: 'player2', name: 'AI Player', isAlive: false }
        ],
        formatDuration: () => '5:00'
    }
});

describe('EndGameManager', () => {
    let endGameManager;
    let scene;
    let victorySystem;
    let gameState;
    let humanPlayer, aiPlayer;
    
    beforeEach(() => {
        scene = new MockScene();
        victorySystem = new MockVictorySystem();
        gameState = new MockGameState();
        
        humanPlayer = new MockPlayer('player1', 'Human Player');
        aiPlayer = new MockPlayer('player2', 'AI Player', true);
        
        gameState.addPlayer(humanPlayer);
        gameState.addPlayer(aiPlayer);
        
        endGameManager = new EndGameManager(scene, victorySystem, gameState);
    });
    
    afterEach(() => {
        if (endGameManager) {
            endGameManager.cleanup();
        }
    });
    
    describe('initialization', () => {
        test('should initialize with correct properties', () => {
            expect(endGameManager.scene).toBe(scene);
            expect(endGameManager.victorySystem).toBe(victorySystem);
            expect(endGameManager.gameState).toBe(gameState);
            expect(endGameManager.isEndGameActive).toBe(false);
            expect(endGameManager.currentScreen).toBe(null);
        });
        
        test('should setup event listeners on victory system', () => {
            expect(victorySystem.events.has(VICTORY_EVENTS.GAME_ENDED)).toBe(true);
            expect(victorySystem.events.has(VICTORY_EVENTS.PLAYER_ELIMINATED)).toBe(true);
        });
    });
    
    describe('game end handling', () => {
        test('should handle victory for human player', async () => {
            const endGameData = createMockEndGameData(humanPlayer);
            
            // Mock dynamic import for VictoryScreen
            jest.doMock('../ui/VictoryScreen.js', () => ({
                VictoryScreen: class MockVictoryScreen {
                    constructor() {
                        this.show = jest.fn();
                    }
                }
            }), { virtual: true });
            
            victorySystem.emit(VICTORY_EVENTS.GAME_ENDED, endGameData);
            
            expect(endGameManager.isEndGameActive).toBe(true);
            expect(endGameManager.endGameState).toBe(endGameData);
            expect(gameState.isPaused).toBe(true);
            expect(gameState.pauseReason).toBe('game_ended');
        });
        
        test('should handle defeat for human player', async () => {
            const endGameData = createMockEndGameData(aiPlayer);
            
            // Mock dynamic import for DefeatScreen
            jest.doMock('../ui/DefeatScreen.js', () => ({
                DefeatScreen: class MockDefeatScreen {
                    constructor() {
                        this.show = jest.fn();
                    }
                }
            }), { virtual: true });
            
            victorySystem.emit(VICTORY_EVENTS.GAME_ENDED, endGameData);
            
            expect(endGameManager.isEndGameActive).toBe(true);
            expect(gameState.isPaused).toBe(true);
        });
        
        test('should prevent multiple end game triggers', () => {
            const endGameData = createMockEndGameData(humanPlayer);
            
            // First trigger
            victorySystem.emit(VICTORY_EVENTS.GAME_ENDED, endGameData);
            expect(gameState.pauseCallCount).toBe(1);
            
            // Second trigger should be ignored
            victorySystem.emit(VICTORY_EVENTS.GAME_ENDED, endGameData);
            expect(gameState.pauseCallCount).toBe(1);
        });
        
        test('should show fallback message if screen loading fails', (done) => {
            const endGameData = createMockEndGameData(humanPlayer);
            
            // Mock failed import
            jest.doMock('../ui/VictoryScreen.js', () => {
                throw new Error('Module not found');
            }, { virtual: true });
            
            const showFallbackSpy = jest.spyOn(endGameManager, 'showFallbackEndGameMessage');
            
            victorySystem.emit(VICTORY_EVENTS.GAME_ENDED, endGameData);
            
            // Give time for async import to fail
            setTimeout(() => {
                expect(showFallbackSpy).toHaveBeenCalledWith('Victory!', endGameData);
                done();
            }, 200);
        });
    });
    
    describe('player elimination notifications', () => {
        test('should show notification for AI player elimination', () => {
            const eliminationData = {
                player: aiPlayer,
                destroyer: humanPlayer
            };
            
            victorySystem.emit(VICTORY_EVENTS.PLAYER_ELIMINATED, eliminationData);
            
            expect(scene.add.container).toHaveBeenCalled();
            expect(scene.time.delayedCall).toHaveBeenCalledWith(3000, expect.any(Function));
        });
        
        test('should not show notification for human player elimination', () => {
            const eliminationData = {
                player: humanPlayer,
                destroyer: aiPlayer
            };
            
            const containerSpy = jest.spyOn(scene.add, 'container');
            
            victorySystem.emit(VICTORY_EVENTS.PLAYER_ELIMINATED, eliminationData);
            
            expect(containerSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('fallback end game message', () => {
        test('should create fallback victory message', () => {
            const endGameData = createMockEndGameData(humanPlayer);
            
            endGameManager.showFallbackEndGameMessage('Victory!', endGameData);
            
            expect(scene.add.container).toHaveBeenCalled();
            expect(scene.add.rectangle).toHaveBeenCalled();
            expect(scene.add.text).toHaveBeenCalledTimes(3); // Title, summary, restart button
            expect(endGameManager.currentScreen).not.toBe(null);
        });
        
        test('should generate correct fallback summary', () => {
            const endGameData = createMockEndGameData(humanPlayer);
            
            const summary = endGameManager.generateFallbackSummary(endGameData);
            
            expect(summary).toContain('Winner: Human Player');
            expect(summary).toContain('Duration: 5:00');
            expect(summary).toContain('Total Battles: 5');
            expect(summary).toContain('Victory Type: CASTLE ELIMINATION');
        });
    });
    
    describe('game restart and menu navigation', () => {
        test('should restart game correctly', () => {
            const mockScreen = { destroy: jest.fn() };
            endGameManager.currentScreen = mockScreen;
            endGameManager.isEndGameActive = true;
            
            endGameManager.restartGame();
            
            expect(mockScreen.destroy).toHaveBeenCalled();
            expect(endGameManager.currentScreen).toBe(null);
            expect(endGameManager.isEndGameActive).toBe(false);
            expect(endGameManager.endGameState).toBe(null);
            expect(scene.events.emit).toHaveBeenCalledWith('endgame:restart-requested');
        });
        
        test('should return to main menu correctly', () => {
            const mockScreen = { destroy: jest.fn() };
            endGameManager.currentScreen = mockScreen;
            endGameManager.isEndGameActive = true;
            
            endGameManager.returnToMainMenu();
            
            expect(mockScreen.destroy).toHaveBeenCalled();
            expect(endGameManager.isEndGameActive).toBe(false);
            expect(scene.events.emit).toHaveBeenCalledWith('endgame:mainmenu-requested');
        });
    });
    
    describe('pause for review functionality', () => {
        test('should pause game for review', () => {
            const mockScreen = { setVisible: jest.fn() };
            endGameManager.currentScreen = mockScreen;
            
            endGameManager.pauseForReview();
            
            expect(gameState.isPaused).toBe(true);
            expect(gameState.pauseReason).toBe('end_game_review');
            expect(mockScreen.setVisible).toHaveBeenCalledWith(false);
        });
        
        test('should resume end game screen after review', () => {
            const mockScreen = { setVisible: jest.fn() };
            endGameManager.currentScreen = mockScreen;
            
            endGameManager.resumeEndGameScreen();
            
            expect(mockScreen.setVisible).toHaveBeenCalledWith(true);
        });
        
        test('should handle pause/resume with no screen gracefully', () => {
            endGameManager.currentScreen = null;
            
            expect(() => {
                endGameManager.pauseForReview();
                endGameManager.resumeEndGameScreen();
            }).not.toThrow();
        });
    });
    
    describe('state reporting', () => {
        test('should return correct end game state', () => {
            const endGameData = createMockEndGameData(humanPlayer);
            const mockScreen = { destroy: jest.fn() };
            
            endGameManager.isEndGameActive = true;
            endGameManager.endGameState = endGameData;
            endGameManager.currentScreen = mockScreen;
            
            const state = endGameManager.getEndGameState();
            
            expect(state.isActive).toBe(true);
            expect(state.endGameData).toBe(endGameData);
            expect(state.hasScreen).toBe(true);
        });
        
        test('should return correct state when inactive', () => {
            const state = endGameManager.getEndGameState();
            
            expect(state.isActive).toBe(false);
            expect(state.endGameData).toBe(null);
            expect(state.hasScreen).toBe(false);
        });
    });
    
    describe('cleanup', () => {
        test('should clean up all resources', () => {
            const mockScreen = { destroy: jest.fn() };
            endGameManager.currentScreen = mockScreen;
            endGameManager.isEndGameActive = true;
            endGameManager.endGameState = { test: 'data' };
            
            endGameManager.cleanup();
            
            expect(mockScreen.destroy).toHaveBeenCalled();
            expect(endGameManager.currentScreen).toBe(null);
            expect(endGameManager.isEndGameActive).toBe(false);
            expect(endGameManager.endGameState).toBe(null);
        });
        
        test('should remove event listeners on cleanup', () => {
            const offSpy = jest.spyOn(victorySystem, 'off');
            
            endGameManager.cleanup();
            
            expect(offSpy).toHaveBeenCalledWith(VICTORY_EVENTS.GAME_ENDED, expect.any(Function));
            expect(offSpy).toHaveBeenCalledWith(VICTORY_EVENTS.PLAYER_ELIMINATED, expect.any(Function));
        });
    });
});