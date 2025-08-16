/**
 * Unit tests for VictorySystem
 * Tests victory detection logic, event emission, and performance requirements
 */

import { VictorySystem } from './VictorySystem.js';
import { VictoryCondition, GameSummary, VICTORY_EVENTS } from '../events/VictoryEvents.js';

// Mock configuration manager
const mockConfig = {
    data: {
        'victory.checkIntervalMs': 100,
        'victory.economicVictoryEnabled': false,
        'victory.timeLimitEnabled': false,
        'victory.economicTarget.gold': 10000,
        'victory.economicTarget.rareResourceAmount': 1000,
        'victory.timeLimit': 3600000
    },
    get(key) {
        return this.data[key];
    }
};

// Mock game state
class MockGameState {
    constructor() {
        this.players = [];
        this.entities = new Map();
        this.isPaused = false;
        this.winner = null;
        this.gameStartTime = Date.now() - 300000; // 5 minutes ago
        this.battleCount = 0;
        this.events = new Map();
    }
    
    addPlayer(player) {
        this.players.push(player);
    }
    
    addEntity(entity) {
        this.entities.set(entity.id, entity);
    }
    
    getEntitiesByType(type) {
        return Array.from(this.entities.values()).filter(e => e.type === type);
    }
    
    getEntitiesByOwner(ownerId) {
        return Array.from(this.entities.values()).filter(e => e.owner?.id === ownerId);
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }
    
    emit(event, data) {
        const callbacks = this.events.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }
}

// Mock player
class MockPlayer {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;
        this.isAlive = true;
        this.faction = 'human';
        this.resourceManager = {
            resources: {
                gold: 1000,
                wood: 500,
                stone: 300,
                mercury: 50,
                sulfur: 50,
                crystal: 50
            }
        };
        this.armiesCreated = 0;
        this.buildingsConstructed = 0;
        this.battlesWon = 0;
    }
}

// Mock castle entity
class MockCastle {
    constructor(id, owner) {
        this.id = id;
        this.type = 'castle';
        this.owner = owner;
    }
}

// Mock army entity
class MockArmy {
    constructor(id, owner) {
        this.id = id;
        this.type = 'army';
        this.owner = owner;
        this.getTotalPower = () => 100;
    }
}

describe('VictorySystem', () => {
    let victorySystem;
    let gameState;
    let player1, player2, player3;
    
    beforeEach(() => {
        gameState = new MockGameState();
        victorySystem = new VictorySystem(mockConfig, gameState);
        
        player1 = new MockPlayer('player1', 'Human Player');
        player2 = new MockPlayer('player2', 'AI Player 1', true);
        player3 = new MockPlayer('player3', 'AI Player 2', true);
        
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        gameState.addPlayer(player3);
    });
    
    afterEach(() => {
        if (victorySystem) {
            victorySystem.removeAllListeners();
        }
    });
    
    describe('castle elimination victory', () => {
        test('should detect victory when only one player has castles', () => {
            const castle1 = new MockCastle('castle1', player1);
            gameState.addEntity(castle1);
            
            // Player 2 and 3 have no castles (eliminated)
            player2.isAlive = false;
            player3.isAlive = false;
            
            let victoryDetected = false;
            victorySystem.on(VICTORY_EVENTS.VICTORY_DETECTED, () => {
                victoryDetected = true;
            });
            
            victorySystem.checkCastleElimination();
            
            expect(victoryDetected).toBe(true);
            expect(gameState.winner).toBe(player1);
            expect(victorySystem.isGameEnded).toBe(true);
        });
        
        test('should detect draw when all players eliminated', () => {
            player1.isAlive = false;
            player2.isAlive = false;
            player3.isAlive = false;
            
            let gameEnded = false;
            victorySystem.on(VICTORY_EVENTS.GAME_ENDED, (data) => {
                gameEnded = true;
                expect(data.winner).toBe(null);
            });
            
            victorySystem.checkCastleElimination();
            
            expect(gameEnded).toBe(true);
            expect(victorySystem.isGameEnded).toBe(true);
        });
        
        test('should not detect victory when multiple players alive', () => {
            const castle1 = new MockCastle('castle1', player1);
            const castle2 = new MockCastle('castle2', player2);
            gameState.addEntity(castle1);
            gameState.addEntity(castle2);
            
            let victoryDetected = false;
            victorySystem.on(VICTORY_EVENTS.VICTORY_DETECTED, () => {
                victoryDetected = true;
            });
            
            victorySystem.checkCastleElimination();
            
            expect(victoryDetected).toBe(false);
            expect(victorySystem.isGameEnded).toBe(false);
        });
    });
    
    describe('economic victory', () => {
        beforeEach(() => {
            mockConfig.data['victory.economicVictoryEnabled'] = true;
            victorySystem = new VictorySystem(mockConfig, gameState);
        });
        
        test('should detect economic victory when player meets resource targets', () => {
            player1.resourceManager.resources = {
                gold: 15000,
                mercury: 1500,
                sulfur: 1500,
                crystal: 1500
            };
            
            let victoryDetected = false;
            victorySystem.on(VICTORY_EVENTS.VICTORY_DETECTED, () => {
                victoryDetected = true;
            });
            
            victorySystem.checkEconomicVictory();
            
            expect(victoryDetected).toBe(true);
            expect(gameState.winner).toBe(player1);
        });
        
        test('should not detect economic victory when resources insufficient', () => {
            player1.resourceManager.resources = {
                gold: 5000, // Below threshold
                mercury: 1500,
                sulfur: 1500,
                crystal: 1500
            };
            
            let victoryDetected = false;
            victorySystem.on(VICTORY_EVENTS.VICTORY_DETECTED, () => {
                victoryDetected = true;
            });
            
            victorySystem.checkEconomicVictory();
            
            expect(victoryDetected).toBe(false);
        });
    });
    
    describe('castle destruction handling', () => {
        test('should eliminate player when last castle destroyed', () => {
            const castle = new MockCastle('castle1', player1);
            gameState.addEntity(castle);
            
            let playerEliminated = false;
            victorySystem.on(VICTORY_EVENTS.PLAYER_ELIMINATED, (data) => {
                playerEliminated = true;
                expect(data.player).toBe(player1);
            });
            
            // Simulate castle destruction
            const eventData = { castle, destroyer: player2 };
            victorySystem.onCastleDestroyed(eventData);
            
            expect(playerEliminated).toBe(true);
            expect(player1.isAlive).toBe(false);
        });
        
        test('should not eliminate player when other castles remain', () => {
            const castle1 = new MockCastle('castle1', player1);
            const castle2 = new MockCastle('castle2', player1);
            gameState.addEntity(castle1);
            gameState.addEntity(castle2);
            
            let playerEliminated = false;
            victorySystem.on(VICTORY_EVENTS.PLAYER_ELIMINATED, () => {
                playerEliminated = true;
            });
            
            // Simulate one castle destruction
            const eventData = { castle: castle1, destroyer: player2 };
            victorySystem.onCastleDestroyed(eventData);
            
            expect(playerEliminated).toBe(false);
            expect(player1.isAlive).toBe(true);
        });
        
        test('should remove eliminated player armies', () => {
            const castle = new MockCastle('castle1', player1);
            const army1 = new MockArmy('army1', player1);
            const army2 = new MockArmy('army2', player1);
            
            gameState.addEntity(castle);
            gameState.addEntity(army1);
            gameState.addEntity(army2);
            
            const removeArmySpy = jest.fn();
            gameState.removeArmy = removeArmySpy;
            
            // Simulate castle destruction
            const eventData = { castle, destroyer: player2 };
            victorySystem.onCastleDestroyed(eventData);
            
            expect(removeArmySpy).toHaveBeenCalledWith('army1');
            expect(removeArmySpy).toHaveBeenCalledWith('army2');
        });
    });
    
    describe('performance requirements', () => {
        test('should complete victory detection within 100ms', () => {
            // Setup scenario with many entities
            for (let i = 0; i < 100; i++) {
                const castle = new MockCastle(`castle${i}`, i < 50 ? player1 : player2);
                gameState.addEntity(castle);
            }
            
            const startTime = performance.now();
            victorySystem.checkCastleElimination();
            const endTime = performance.now();
            
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(100); // Must complete within 100ms
        });
        
        test('should throttle victory checks based on interval', () => {
            const checkSpy = jest.spyOn(victorySystem, 'checkCastleElimination');
            
            // First update should check
            victorySystem.update(50); // 50ms
            expect(checkSpy).toHaveBeenCalledTimes(1);
            
            // Second update within interval should not check
            victorySystem.update(30); // Total 80ms, below 100ms interval
            expect(checkSpy).toHaveBeenCalledTimes(1);
            
            // Third update exceeding interval should check
            victorySystem.update(50); // Total 130ms, exceeds 100ms interval
            expect(checkSpy).toHaveBeenCalledTimes(2);
        });
        
        test('should skip updates when game is paused', () => {
            gameState.isPaused = true;
            
            const checkSpy = jest.spyOn(victorySystem, 'checkCastleElimination');
            victorySystem.update(200); // Well above interval
            
            expect(checkSpy).not.toHaveBeenCalled();
        });
        
        test('should skip updates when game already ended', () => {
            victorySystem.isGameEnded = true;
            
            const checkSpy = jest.spyOn(victorySystem, 'checkCastleElimination');
            victorySystem.update(200);
            
            expect(checkSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('game summary generation', () => {
        test('should generate accurate game summary', () => {
            gameState.battleCount = 15;
            gameState.gameStartTime = Date.now() - 600000; // 10 minutes ago
            
            player1.resourceManager.resources.gold = 5000;
            player1.armiesCreated = 3;
            player1.buildingsConstructed = 8;
            
            const summary = new GameSummary(gameState);
            
            expect(summary.totalBattles).toBe(15);
            expect(summary.duration).toBeGreaterThan(500000); // Around 10 minutes
            expect(summary.players).toHaveLength(3);
            expect(summary.players[0].finalResources.gold).toBe(5000);
            expect(summary.players[0].armiesCreated).toBe(3);
            expect(summary.players[0].buildingsConstructed).toBe(8);
        });
        
        test('should format duration correctly', () => {
            const summary = new GameSummary(gameState);
            summary.duration = 125000; // 2 minutes 5 seconds
            
            const formatted = summary.formatDuration();
            expect(formatted).toBe('2:05');
        });
    });
    
    describe('victory system reset', () => {
        test('should reset all victory state', () => {
            victorySystem.isGameEnded = true;
            victorySystem.endGameReason = 'castle_elimination';
            victorySystem.victoryConditions.set('test', 'value');
            
            victorySystem.reset();
            
            expect(victorySystem.isGameEnded).toBe(false);
            expect(victorySystem.endGameReason).toBe(null);
            expect(victorySystem.victoryConditions.size).toBe(0);
            expect(victorySystem.lastVictoryCheck).toBe(0);
        });
    });
    
    describe('victory status reporting', () => {
        test('should return correct victory status', () => {
            victorySystem.isGameEnded = true;
            victorySystem.endGameReason = 'economic';
            gameState.winner = player1;
            
            const status = victorySystem.getVictoryStatus();
            
            expect(status.isGameEnded).toBe(true);
            expect(status.endGameReason).toBe('economic');
            expect(status.winner).toBe(player1);
        });
    });
});