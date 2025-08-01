import { GameStateManager } from './GameStateManager.js';
import { CONFIG } from '../config/ConfigurationManager.js';

// Mock the CONFIG
jest.mock('../config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn()
    }
}));

// Mock Player class
class MockPlayer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.isAlive = true;
        this.resourceManager = {
            update: jest.fn(),
            resources: {
                gold: 0,
                mercury: 0,
                sulfur: 0,
                crystal: 0
            }
        };
    }
}

// Mock Entity class
class MockEntity {
    constructor(id, type, owner) {
        this.id = id;
        this.type = type;
        this.owner = owner;
        this.components = new Map();
        this.update = jest.fn();
    }
    
    getComponent(name) {
        return this.components.get(name);
    }
    
    addComponent(name, component) {
        this.components.set(name, component);
    }
}

describe('GameStateManager', () => {
    let gameState;
    
    beforeEach(() => {
        CONFIG.get.mockImplementation((path) => {
            const configValues = {
                'time.baseGameSpeed': 1.0,
                'resources.economicVictory': {
                    gold: 10000,
                    rareResourceAmount: 1000
                }
            };
            return configValues[path];
        });
        
        gameState = new GameStateManager();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('constructor', () => {
        test('should initialize with correct default values', () => {
            expect(gameState.players).toEqual([]);
            expect(gameState.entities).toBeInstanceOf(Map);
            expect(gameState.currentTick).toBe(0);
            expect(gameState.gameSpeed).toBe(1.0);
            expect(gameState.isPaused).toBe(false);
            expect(gameState.winner).toBeNull();
            expect(gameState.pausedSystems).toBeNull();
        });
    });
    
    describe('player management', () => {
        test('should add player', () => {
            const player = new MockPlayer('player1', 'Player 1');
            gameState.addPlayer(player);
            
            expect(gameState.players).toContain(player);
            expect(gameState.getPlayer('player1')).toBe(player);
        });
        
        test('should not add duplicate player', () => {
            const player = new MockPlayer('player1', 'Player 1');
            gameState.addPlayer(player);
            gameState.addPlayer(player);
            
            expect(gameState.players).toHaveLength(1);
        });
        
        test('should remove player', () => {
            const player = new MockPlayer('player1', 'Player 1');
            gameState.addPlayer(player);
            gameState.removePlayer('player1');
            
            expect(gameState.players).toHaveLength(0);
            expect(gameState.getPlayer('player1')).toBeUndefined();
        });
        
        test('should get alive players', () => {
            const player1 = new MockPlayer('player1', 'Player 1');
            const player2 = new MockPlayer('player2', 'Player 2');
            player2.isAlive = false;
            
            gameState.addPlayer(player1);
            gameState.addPlayer(player2);
            
            const alivePlayers = gameState.getAlivePlayers();
            expect(alivePlayers).toHaveLength(1);
            expect(alivePlayers[0]).toBe(player1);
        });
    });
    
    describe('entity management', () => {
        test('should add and get entity', () => {
            const entity = new MockEntity('entity1', 'castle', 'player1');
            gameState.addEntity(entity);
            
            expect(gameState.getEntity('entity1')).toBe(entity);
        });
        
        test('should remove entity', () => {
            const entity = new MockEntity('entity1', 'castle', 'player1');
            gameState.addEntity(entity);
            
            const removed = gameState.removeEntity('entity1');
            expect(removed).toBe(true);
            expect(gameState.getEntity('entity1')).toBeUndefined();
        });
        
        test('should get entities by type', () => {
            const castle = new MockEntity('castle1', 'castle', 'player1');
            const army = new MockEntity('army1', 'army', 'player1');
            
            gameState.addEntity(castle);
            gameState.addEntity(army);
            
            const castles = gameState.getEntitiesByType('castle');
            expect(castles).toHaveLength(1);
            expect(castles[0]).toBe(castle);
        });
        
        test('should get entities by owner', () => {
            const castle1 = new MockEntity('castle1', 'castle', 'player1');
            const castle2 = new MockEntity('castle2', 'castle', 'player2');
            
            gameState.addEntity(castle1);
            gameState.addEntity(castle2);
            
            const player1Entities = gameState.getEntitiesByOwner('player1');
            expect(player1Entities).toHaveLength(1);
            expect(player1Entities[0]).toBe(castle1);
        });
    });
    
    describe('game updates', () => {
        test('should update game state', () => {
            const player = new MockPlayer('player1', 'Player 1');
            const entity = new MockEntity('entity1', 'castle', 'player1');
            
            gameState.addPlayer(player);
            gameState.addEntity(entity);
            
            gameState.update(100);
            
            expect(gameState.currentTick).toBe(100);
            expect(player.resourceManager.update).toHaveBeenCalledWith(100);
            expect(entity.update).toHaveBeenCalledWith(100);
        });
        
        test('should apply game speed modifier', () => {
            const player = new MockPlayer('player1', 'Player 1');
            gameState.addPlayer(player);
            gameState.setGameSpeed(2.0);
            
            gameState.update(100);
            
            expect(gameState.currentTick).toBe(200); // 100 * 2.0
            expect(player.resourceManager.update).toHaveBeenCalledWith(200);
        });
        
        test('should skip updates when paused', () => {
            const player = new MockPlayer('player1', 'Player 1');
            gameState.addPlayer(player);
            gameState.pause();
            
            gameState.update(100);
            
            expect(gameState.currentTick).toBe(0);
            expect(player.resourceManager.update).not.toHaveBeenCalled();
        });
    });
    
    describe('pause/unpause functionality', () => {
        test('should pause game', () => {
            gameState.pause();
            
            expect(gameState.isPaused).toBe(true);
            expect(gameState.pausedSystems).toBeDefined();
            expect(gameState.pausedSystems.pauseTime).toBeDefined();
        });
        
        test('should not double pause', () => {
            gameState.pause();
            const firstPauseTime = gameState.pausedSystems.pauseTime;
            
            gameState.pause();
            
            expect(gameState.pausedSystems.pauseTime).toBe(firstPauseTime);
        });
        
        test('should unpause game', () => {
            gameState.pause();
            gameState.unpause();
            
            expect(gameState.isPaused).toBe(false);
            expect(gameState.pausedSystems).toBeNull();
        });
        
        test('should not unpause when not paused', () => {
            gameState.unpause();
            
            expect(gameState.isPaused).toBe(false);
            expect(gameState.pausedSystems).toBeNull();
        });
        
        test('should preserve movement progress during pause', () => {
            const army = new MockEntity('army1', 'army', 'player1');
            const movement = { isMoving: true, movementProgress: 0.7 };
            army.addComponent('movement', movement);
            
            gameState.addEntity(army);
            gameState.pause();
            
            expect(gameState.pausedSystems.movingArmies).toHaveLength(1);
            expect(gameState.pausedSystems.movingArmies[0].progress).toBe(0.7);
            
            // Simulate progress change during pause
            movement.movementProgress = 0.3;
            
            gameState.unpause();
            
            expect(movement.movementProgress).toBe(0.7); // Restored
        });
    });
    
    describe('victory conditions', () => {
        test('should detect castle elimination victory', () => {
            const player1 = new MockPlayer('player1', 'Player 1');
            const player2 = new MockPlayer('player2', 'Player 2');
            
            // Player 1 has a castle, player 2 does not
            const castle = new MockEntity('castle1', 'castle', 'player1');
            
            gameState.addPlayer(player1);
            gameState.addPlayer(player2);
            gameState.addEntity(castle);
            
            gameState.checkVictoryConditions();
            
            expect(player2.isAlive).toBe(false);
            expect(gameState.winner).toBe(player1);
        });
        
        test('should detect economic victory', () => {
            const player = new MockPlayer('player1', 'Player 1');
            player.resourceManager.resources = {
                gold: 15000,
                mercury: 1500,
                sulfur: 1500,
                crystal: 1500
            };
            
            const castle = new MockEntity('castle1', 'castle', 'player1');
            
            gameState.addPlayer(player);
            gameState.addEntity(castle);
            
            gameState.checkVictoryConditions();
            
            expect(gameState.winner).toBe(player);
        });
        
        test('should detect draw when all players eliminated', () => {
            const player1 = new MockPlayer('player1', 'Player 1');
            const player2 = new MockPlayer('player2', 'Player 2');
            
            gameState.addPlayer(player1);
            gameState.addPlayer(player2);
            // No castles for either player
            
            gameState.checkVictoryConditions();
            
            expect(player1.isAlive).toBe(false);
            expect(player2.isAlive).toBe(false);
            expect(gameState.winner).toBe('draw');
        });
        
        test('should not change winner once set', () => {
            const player1 = new MockPlayer('player1', 'Player 1');
            const player2 = new MockPlayer('player2', 'Player 2');
            
            gameState.addPlayer(player1);
            gameState.addPlayer(player2);
            gameState.winner = player1;
            
            gameState.checkVictoryConditions();
            
            expect(gameState.winner).toBe(player1);
        });
    });
    
    describe('utility methods', () => {
        test('should check if game is over', () => {
            expect(gameState.isGameOver()).toBe(false);
            
            gameState.winner = new MockPlayer('player1', 'Player 1');
            expect(gameState.isGameOver()).toBe(true);
        });
        
        test('should get game duration', () => {
            const duration = gameState.getGameDuration();
            expect(duration).toBeGreaterThanOrEqual(0);
        });
        
        test('should set game speed with clamping', () => {
            gameState.setGameSpeed(0.05); // Below minimum
            expect(gameState.gameSpeed).toBe(0.1);
            
            gameState.setGameSpeed(10.0); // Above maximum
            expect(gameState.gameSpeed).toBe(5.0);
            
            gameState.setGameSpeed(2.0); // Valid value
            expect(gameState.gameSpeed).toBe(2.0);
        });
        
        test('should reset game state', () => {
            const player = new MockPlayer('player1', 'Player 1');
            const entity = new MockEntity('entity1', 'castle', 'player1');
            
            gameState.addPlayer(player);
            gameState.addEntity(entity);
            gameState.currentTick = 1000;
            gameState.winner = player;
            
            gameState.reset();
            
            expect(gameState.players).toHaveLength(0);
            expect(gameState.entities.size).toBe(0);
            expect(gameState.currentTick).toBe(0);
            expect(gameState.winner).toBeNull();
        });
    });
});