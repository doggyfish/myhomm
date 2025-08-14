import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { PauseSystem } from '../../src/systems/PauseSystem.js';
import { MovementSystem } from '../../src/systems/MovementSystem.js';
import { GameStateManager } from '../../src/game/GameStateManager.js';
import { PauseEvents } from '../../src/events/PauseEvents.js';

// Mock ConfigurationManager
jest.mock('../../src/config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn().mockImplementation((key: string) => {
            const config: any = {
                'pause.inputCooldown': 100,
                'pause.maxResponseTime': 200,
                'time.baseGameSpeed': 1.0,
                'movement.baseTimePerTile': 1000
            };
            return config[key] || null;
        })
    }
}));

// Mock TerrainConfig
jest.mock('../../src/config/TerrainConfig.js', () => ({
    TERRAIN_CONFIG: {
        grassland: { movementModifier: 1.0 },
        forest: { movementModifier: 0.8 },
        mountain: { movementModifier: 0.5 }
    }
}));

// Mock Pathfinding
jest.mock('../../src/systems/Pathfinding.js', () => ({
    Pathfinding: jest.fn().mockImplementation(() => ({
        findPath: jest.fn().mockReturnValue([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 }
        ])
    }))
}));

// Mock Army and Components
const createMockArmy = (id: string) => ({
    id,
    calculateSpeed: jest.fn().mockReturnValue(1.0),
    getComponent: jest.fn().mockImplementation((type: string) => {
        if (type === 'position') {
            return { tileX: 0, tileY: 0, x: 0, y: 0 };
        }
        if (type === 'movement') {
            return {
                startMovement: jest.fn(),
                updateMovement: jest.fn().mockReturnValue(false),
                stopMovement: jest.fn(),
                isMoving: true,
                movementProgress: 0.5
            };
        }
        if (type === 'pausable') {
            return {
                pause: jest.fn(),
                unpause: jest.fn(),
                shouldUpdate: jest.fn().mockReturnValue(true)
            };
        }
        return null;
    })
});

describe('Pause System Integration', () => {
    let pauseSystem: PauseSystem;
    let movementSystem: MovementSystem;
    let gameStateManager: GameStateManager;
    let mockMapData: any;

    beforeEach(() => {
        // Create mock map data
        mockMapData = {
            width: 10,
            height: 10,
            tiles: Array(10).fill(null).map(() =>
                Array(10).fill(null).map(() => ({ terrain: 'grassland' }))
            )
        };

        // Create systems
        gameStateManager = new GameStateManager();
        movementSystem = new MovementSystem(mockMapData, gameStateManager);
        pauseSystem = new PauseSystem(gameStateManager);

        // Connect systems
        gameStateManager.setPauseSystem(pauseSystem);
        gameStateManager.registerSystem(movementSystem, 'MovementSystem');
        pauseSystem.registerPausableSystem(movementSystem, 'MovementSystem');
    });

    afterEach(() => {
        if (pauseSystem) {
            pauseSystem.destroy();
        }
        jest.clearAllMocks();
    });

    describe('System Coordination', () => {
        test('should coordinate pause across all systems', () => {
            // Start with systems running
            expect(gameStateManager.isPaused).toBe(false);
            expect(movementSystem.isPaused()).toBe(false);
            expect(pauseSystem.isPaused()).toBe(false);

            // Pause through pause system
            pauseSystem.pause('user');

            // All systems should be paused
            expect(gameStateManager.isPaused).toBe(true);
            expect(movementSystem.isPaused()).toBe(true);
            expect(pauseSystem.isPaused()).toBe(true);
        });

        test('should coordinate unpause across all systems', () => {
            // Start paused
            pauseSystem.pause('user');
            
            // Unpause through pause system
            pauseSystem.unpause();

            // All systems should be unpaused
            expect(gameStateManager.isPaused).toBe(false);
            expect(movementSystem.isPaused()).toBe(false);
            expect(pauseSystem.isPaused()).toBe(false);
        });

        test('should handle pause initiated from GameStateManager', () => {
            // Pause through GameStateManager
            gameStateManager.pause('system');

            // Both systems should be paused
            expect(gameStateManager.isPaused).toBe(true);
            expect(movementSystem.isPaused()).toBe(true);
        });
    });

    describe('Movement System Integration', () => {
        test('should pause army movement when system pauses', () => {
            const mockArmy = createMockArmy('army1');
            gameStateManager.addEntity(mockArmy);

            // Start movement
            movementSystem.startMovement(mockArmy, { x: 5, y: 0 });
            expect(movementSystem.isMoving('army1')).toBe(true);

            // Pause system
            pauseSystem.pause('user');

            // Movement should be paused but army still tracked
            expect(movementSystem.isMoving('army1')).toBe(true);
            expect(mockArmy.getComponent('pausable').pause).toHaveBeenCalled();
        });

        test('should resume army movement when system unpauses', () => {
            const mockArmy = createMockArmy('army1');
            gameStateManager.addEntity(mockArmy);

            // Start movement and pause
            movementSystem.startMovement(mockArmy, { x: 5, y: 0 });
            pauseSystem.pause('user');
            pauseSystem.unpause();

            // Movement should resume
            expect(mockArmy.getComponent('pausable').unpause).toHaveBeenCalled();
        });

        test('should preserve movement progress during pause', () => {
            const mockArmy = createMockArmy('army1');
            gameStateManager.addEntity(mockArmy);

            // Start movement
            movementSystem.startMovement(mockArmy, { x: 5, y: 0 });
            const initialProgress = movementSystem.getMovementProgress('army1');

            // Pause and unpause
            pauseSystem.pause('user');
            pauseSystem.unpause();

            // Progress should be preserved
            const resumedProgress = movementSystem.getMovementProgress('army1');
            expect(resumedProgress?.elapsedTime).toBe(initialProgress?.elapsedTime);
        });

        test('should not update movement during pause', () => {
            const mockArmy = createMockArmy('army1');
            gameStateManager.addEntity(mockArmy);
            movementSystem.startMovement(mockArmy, { x: 5, y: 0 });

            // Pause system
            pauseSystem.pause('user');

            // Update movement system (should not process updates)
            movementSystem.update(100);

            // Movement component should not be updated
            expect(mockArmy.getComponent('movement').updateMovement).not.toHaveBeenCalled();
        });
    });

    describe('Game State Manager Integration', () => {
        test('should pause resource generation', () => {
            const mockPlayer = {
                id: 'player1',
                isAlive: true,
                resourceManager: {
                    update: jest.fn()
                }
            };
            gameStateManager.addPlayer(mockPlayer);

            // Pause system
            pauseSystem.pause('user');

            // Update game state (should skip resource updates)
            gameStateManager.update(100);

            // Resource manager should not be updated
            expect(mockPlayer.resourceManager.update).not.toHaveBeenCalled();
        });

        test('should preserve game tick during pause', () => {
            const initialTick = gameStateManager.currentTick;
            
            // Pause system
            pauseSystem.pause('user');
            gameStateManager.update(100);

            // Tick should not advance
            expect(gameStateManager.currentTick).toBe(initialTick);
        });

        test('should handle system registration after pause', () => {
            // Pause first
            pauseSystem.pause('user');

            // Register new system
            const newSystem = {
                pause: jest.fn(),
                unpause: jest.fn(),
                isPaused: jest.fn().mockReturnValue(false),
                getState: jest.fn().mockReturnValue({}),
                setState: jest.fn()
            };

            gameStateManager.registerSystem(newSystem, 'NewSystem');

            // New system should be immediately paused
            expect(newSystem.pause).toHaveBeenCalled();
        });
    });

    describe('Event Flow Integration', () => {
        test('should propagate pause events through system hierarchy', (done) => {
            let eventCount = 0;
            const expectedEvents = 1;

            pauseSystem.on(PauseEvents.PAUSE_ACTIVATED, (eventData) => {
                expect(eventData.reason).toBe('user');
                eventCount++;
                if (eventCount === expectedEvents) {
                    done();
                }
            });

            pauseSystem.pause('user');
        });

        test('should handle concurrent pause requests', () => {
            // Multiple systems trying to pause simultaneously
            const result1 = pauseSystem.pause('user');
            const result2 = gameStateManager.pause('system');
            
            expect(result1).toBe(true);
            expect(result2).toBe(false); // Should fail because already paused

            // All should be in paused state
            expect(pauseSystem.isPaused()).toBe(true);
            expect(gameStateManager.isPaused).toBe(true);
        });
    });

    describe('State Preservation Integration', () => {
        test('should preserve complex system state across pause/unpause', () => {
            const mockArmy1 = createMockArmy('army1');
            const mockArmy2 = createMockArmy('army2');
            
            gameStateManager.addEntity(mockArmy1);
            gameStateManager.addEntity(mockArmy2);

            // Start multiple movements
            movementSystem.startMovement(mockArmy1, { x: 3, y: 0 });
            movementSystem.startMovement(mockArmy2, { x: 0, y: 3 });

            // Get initial state
            const initialMovementStats = movementSystem.getMovementStats();
            const initialGameState = gameStateManager.getState();

            // Pause, wait, and unpause
            pauseSystem.pause('user');
            
            setTimeout(() => {
                pauseSystem.unpause();

                // State should be preserved
                const resumedMovementStats = movementSystem.getMovementStats();
                const resumedGameState = gameStateManager.getState();

                expect(resumedMovementStats.movingArmiesCount).toBe(initialMovementStats.movingArmiesCount);
                expect(resumedGameState.entitiesCount).toBe(initialGameState.entitiesCount);
            }, 50);
        });

        test('should handle state corruption gracefully', () => {
            // Simulate corrupted state
            pauseSystem.pause('user');
            
            // Manually corrupt pause state
            const corruptState = pauseSystem.getState();
            corruptState.systemStates = null as any;
            pauseSystem.setState(corruptState);

            // Should not crash when unpausing
            expect(() => {
                pauseSystem.unpause();
            }).not.toThrow();
        });
    });

    describe('Performance Integration', () => {
        test('should meet performance requirements with multiple systems', () => {
            // Register multiple mock systems
            const systems = [];
            for (let i = 0; i < 10; i++) {
                const system = {
                    pause: jest.fn(),
                    unpause: jest.fn(),
                    isPaused: jest.fn().mockReturnValue(false),
                    getState: jest.fn().mockReturnValue({ id: i }),
                    setState: jest.fn()
                };
                systems.push(system);
                pauseSystem.registerPausableSystem(system, `System${i}`);
            }

            // Add multiple moving armies
            for (let i = 0; i < 20; i++) {
                const army = createMockArmy(`army${i}`);
                gameStateManager.addEntity(army);
                movementSystem.startMovement(army, { x: i % 5, y: Math.floor(i / 5) });
            }

            // Measure pause performance
            const startTime = performance.now();
            pauseSystem.pause('user');
            const pauseTime = performance.now() - startTime;

            // Measure unpause performance
            const unpauseStartTime = performance.now();
            pauseSystem.unpause();
            const unpauseTime = performance.now() - unpauseStartTime;

            // Should meet 200ms requirement
            expect(pauseTime).toBeLessThan(200);
            expect(unpauseTime).toBeLessThan(200);

            // All systems should be coordinated
            systems.forEach(system => {
                expect(system.pause).toHaveBeenCalled();
                expect(system.unpause).toHaveBeenCalled();
            });
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle system errors during pause coordination', () => {
            const faultySystem = {
                pause: jest.fn().mockImplementation(() => {
                    throw new Error('System fault');
                }),
                unpause: jest.fn(),
                isPaused: jest.fn().mockReturnValue(false),
                getState: jest.fn().mockReturnValue({}),
                setState: jest.fn()
            };

            pauseSystem.registerPausableSystem(faultySystem, 'FaultySystem');

            // Should not crash entire pause operation
            expect(() => {
                pauseSystem.pause('user');
            }).not.toThrow();

            // Other systems should still be paused
            expect(movementSystem.isPaused()).toBe(true);
            expect(gameStateManager.isPaused).toBe(true);
        });

        test('should handle GameStateManager errors gracefully', () => {
            // Mock GameStateManager to throw error
            jest.spyOn(gameStateManager, 'pause').mockImplementationOnce(() => {
                throw new Error('GameState error');
            });

            // Should handle error and continue with other systems
            expect(() => {
                pauseSystem.pause('user');
            }).not.toThrow();

            // Pause system itself should still be paused
            expect(pauseSystem.isPaused()).toBe(true);
        });
    });

    describe('Real-world Scenarios', () => {
        test('should handle pause during active combat', () => {
            // Setup combat scenario
            const attacker = createMockArmy('attacker');
            const defender = createMockArmy('defender');
            
            gameStateManager.addEntity(attacker);
            gameStateManager.addEntity(defender);

            // Start movement that would lead to combat
            movementSystem.startMovement(attacker, { x: 0, y: 0 }); // Same position as defender

            // Pause during movement/combat
            pauseSystem.pause('user');

            // Both armies should be paused
            expect(attacker.getComponent('pausable').pause).toHaveBeenCalled();
            expect(defender.getComponent('pausable').pause).toHaveBeenCalled();

            // Resume and verify state
            pauseSystem.unpause();
            expect(attacker.getComponent('pausable').unpause).toHaveBeenCalled();
        });

        test('should handle emergency pause scenarios', () => {
            // Setup active game state
            const armies = [];
            for (let i = 0; i < 5; i++) {
                const army = createMockArmy(`emergency_army_${i}`);
                armies.push(army);
                gameStateManager.addEntity(army);
                movementSystem.startMovement(army, { x: i, y: i });
            }

            // Emergency pause
            pauseSystem.emergencyPause();

            // All systems should be immediately paused
            expect(pauseSystem.isPaused()).toBe(true);
            expect(movementSystem.isPaused()).toBe(true);
            expect(gameStateManager.isPaused).toBe(true);

            // All armies should be paused
            armies.forEach(army => {
                expect(army.getComponent('pausable').pause).toHaveBeenCalled();
            });
        });

        test('should handle pause during system shutdown', () => {
            // Pause system
            pauseSystem.pause('user');

            // Simulate system shutdown
            pauseSystem.destroy();

            // Should automatically unpause during shutdown
            expect(pauseSystem.isPaused()).toBe(false);
        });
    });

    describe('Long-running Integration', () => {
        test('should handle extended pause sessions without memory leaks', () => {
            const initialMemory = process.memoryUsage();
            
            // Create many entities and pause/unpause cycles
            for (let cycle = 0; cycle < 100; cycle++) {
                const army = createMockArmy(`stress_army_${cycle}`);
                gameStateManager.addEntity(army);
                
                pauseSystem.pause('user');
                pauseSystem.unpause();
                
                // Cleanup every 10 cycles to prevent test memory issues
                if (cycle % 10 === 0) {
                    gameStateManager.entities.clear();
                }
            }

            const finalMemory = process.memoryUsage();
            
            // Memory should not increase dramatically (allowing for reasonable growth)
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
        });
    });
});