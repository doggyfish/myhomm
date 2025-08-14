import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { PauseSystem } from '../../src/systems/PauseSystem.js';
import { MovementSystem } from '../../src/systems/MovementSystem.js';
import { GameStateManager } from '../../src/game/GameStateManager.js';
import { PauseOverlay } from '../../src/ui/PauseOverlay.js';

// Mock performance.now if not available in test environment
if (!global.performance) {
    global.performance = { now: () => Date.now() } as any;
}

// Mock ConfigurationManager
jest.mock('../../src/config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn().mockImplementation((key: string) => {
            const config: any = {
                'pause.maxResponseTime': 200,
                'pause.inputCooldown': 100,
                'pause.overlay.transitionTime': 300,
                'time.baseGameSpeed': 1.0,
                'movement.baseTimePerTile': 1000
            };
            return config[key] || null;
        })
    }
}));

// Mock Phaser scene for PauseOverlay
const mockScene = {
    game: { config: { width: 1024, height: 768 } },
    add: {
        existing: jest.fn(),
        rectangle: jest.fn().mockReturnValue({ setInteractive: jest.fn().mockReturnThis(), on: jest.fn() }),
        text: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis(), setText: jest.fn(), setVisible: jest.fn() })
    },
    tweens: { add: jest.fn().mockReturnValue({ stop: jest.fn() }) }
};

// Mock other dependencies
jest.mock('../../src/config/TerrainConfig.js', () => ({
    TERRAIN_CONFIG: { grassland: { movementModifier: 1.0 } }
}));

jest.mock('../../src/systems/Pathfinding.js', () => ({
    Pathfinding: jest.fn().mockImplementation(() => ({
        findPath: jest.fn().mockReturnValue([{ x: 0, y: 0 }, { x: 1, y: 0 }])
    }))
}));

// Create performance testing utilities
class PerformanceMeasure {
    private measurements: number[] = [];
    
    measure(fn: () => void): number {
        const start = performance.now();
        fn();
        const end = performance.now();
        const duration = end - start;
        this.measurements.push(duration);
        return duration;
    }
    
    getAverageDuration(): number {
        return this.measurements.reduce((sum, duration) => sum + duration, 0) / this.measurements.length;
    }
    
    getMaxDuration(): number {
        return Math.max(...this.measurements);
    }
    
    getMinDuration(): number {
        return Math.min(...this.measurements);
    }
    
    getPercentile(percentile: number): number {
        const sorted = [...this.measurements].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
        return sorted[Math.max(0, index)];
    }
    
    reset(): void {
        this.measurements = [];
    }
}

describe('Pause System Performance Tests', () => {
    let pauseSystem: PauseSystem;
    let gameStateManager: GameStateManager;
    let performanceMeasure: PerformanceMeasure;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
        pauseSystem = new PauseSystem(gameStateManager);
        performanceMeasure = new PerformanceMeasure();
    });

    afterEach(() => {
        if (pauseSystem) {
            pauseSystem.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Basic Pause/Unpause Performance', () => {
        test('should pause within 200ms requirement - single iteration', () => {
            const duration = performanceMeasure.measure(() => {
                pauseSystem.pause('user');
            });

            expect(duration).toBeLessThan(200);
            console.log(`Single pause duration: ${duration.toFixed(2)}ms`);
        });

        test('should unpause within 200ms requirement - single iteration', () => {
            pauseSystem.pause('user');
            
            const duration = performanceMeasure.measure(() => {
                pauseSystem.unpause();
            });

            expect(duration).toBeLessThan(200);
            console.log(`Single unpause duration: ${duration.toFixed(2)}ms`);
        });

        test('should consistently meet 200ms requirement over multiple iterations', () => {
            const iterations = 100;
            
            for (let i = 0; i < iterations; i++) {
                performanceMeasure.measure(() => {
                    pauseSystem.pause('user');
                });
                
                performanceMeasure.measure(() => {
                    pauseSystem.unpause();
                });
                
                // Small delay to avoid cooldown issues
                if (i % 10 === 0) {
                    // Reset pause system to avoid accumulated state
                    pauseSystem.destroy();
                    pauseSystem = new PauseSystem(gameStateManager);
                }
            }
            
            const avgDuration = performanceMeasure.getAverageDuration();
            const maxDuration = performanceMeasure.getMaxDuration();
            const p95Duration = performanceMeasure.getPercentile(95);
            
            expect(avgDuration).toBeLessThan(50); // Average should be much faster
            expect(maxDuration).toBeLessThan(200); // Max should meet requirement
            expect(p95Duration).toBeLessThan(100); // 95th percentile should be well under limit
            
            console.log(`Performance over ${iterations} iterations:`);
            console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
            console.log(`  Maximum: ${maxDuration.toFixed(2)}ms`);
            console.log(`  95th percentile: ${p95Duration.toFixed(2)}ms`);
        });
    });

    describe('System Registration Performance', () => {
        test('should handle large numbers of registered systems efficiently', () => {
            const systemCounts = [10, 50, 100, 200];
            
            systemCounts.forEach(count => {
                // Clean setup for each test
                pauseSystem.destroy();
                pauseSystem = new PauseSystem(gameStateManager);
                performanceMeasure.reset();
                
                // Create and register systems
                const systems = Array.from({ length: count }, (_, i) => ({
                    pause: jest.fn(),
                    unpause: jest.fn(),
                    isPaused: jest.fn().mockReturnValue(false),
                    getState: jest.fn().mockReturnValue({ id: i }),
                    setState: jest.fn()
                }));
                
                systems.forEach((system, i) => {
                    pauseSystem.registerPausableSystem(system, `System${i}`);
                });
                
                // Measure pause performance
                const pauseDuration = performanceMeasure.measure(() => {
                    pauseSystem.pause('user');
                });
                
                // Measure unpause performance  
                const unpauseDuration = performanceMeasure.measure(() => {
                    pauseSystem.unpause();
                });
                
                expect(pauseDuration).toBeLessThan(200);
                expect(unpauseDuration).toBeLessThan(200);
                
                console.log(`${count} systems - Pause: ${pauseDuration.toFixed(2)}ms, Unpause: ${unpauseDuration.toFixed(2)}ms`);
                
                // Verify all systems were called
                systems.forEach(system => {
                    expect(system.pause).toHaveBeenCalled();
                    expect(system.unpause).toHaveBeenCalled();
                });
            });
        });
    });

    describe('Complex System Integration Performance', () => {
        test('should maintain performance with MovementSystem integration', () => {
            const mockMapData = {
                width: 50,
                height: 50,
                tiles: Array(50).fill(null).map(() =>
                    Array(50).fill(null).map(() => ({ terrain: 'grassland' }))
                )
            };
            
            const movementSystem = new MovementSystem(mockMapData, gameStateManager);
            pauseSystem.registerPausableSystem(movementSystem, 'MovementSystem');
            
            // Create mock armies
            const armyCount = 100;
            const armies = Array.from({ length: armyCount }, (_, i) => ({
                id: `army${i}`,
                calculateSpeed: jest.fn().mockReturnValue(1.0),
                getComponent: jest.fn().mockImplementation((type: string) => {
                    if (type === 'position') return { tileX: i % 10, tileY: Math.floor(i / 10), x: 0, y: 0 };
                    if (type === 'movement') return {
                        startMovement: jest.fn(),
                        updateMovement: jest.fn().mockReturnValue(false),
                        stopMovement: jest.fn(),
                        isMoving: false,
                        movementProgress: 0
                    };
                    if (type === 'pausable') return {
                        pause: jest.fn(),
                        unpause: jest.fn(),
                        shouldUpdate: jest.fn().mockReturnValue(true)
                    };
                    return null;
                })
            }));
            
            // Add armies to game state and start movements
            armies.forEach(army => {
                gameStateManager.addEntity(army);
                movementSystem.startMovement(army, { x: (army.id.length % 10), y: Math.floor(army.id.length / 10) });
            });
            
            // Measure performance with active movements
            const pauseDuration = performanceMeasure.measure(() => {
                pauseSystem.pause('user');
            });
            
            const unpauseDuration = performanceMeasure.measure(() => {
                pauseSystem.unpause();
            });
            
            expect(pauseDuration).toBeLessThan(200);
            expect(unpauseDuration).toBeLessThan(200);
            
            console.log(`${armyCount} armies - Pause: ${pauseDuration.toFixed(2)}ms, Unpause: ${unpauseDuration.toFixed(2)}ms`);
        });
    });

    describe('Memory Performance', () => {
        test('should not cause memory leaks during extended pause sessions', () => {
            if (!process || !process.memoryUsage) {
                console.log('Memory testing not available in this environment');
                return;
            }
            
            const initialMemory = process.memoryUsage();
            
            // Simulate extended pause session with many pause/unpause cycles
            for (let i = 0; i < 1000; i++) {
                pauseSystem.pause('user');
                pauseSystem.unpause();
                
                // Periodically check memory usage
                if (i % 100 === 0) {
                    const currentMemory = process.memoryUsage();
                    const heapIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
                    
                    // Allow some memory growth but not excessive
                    expect(heapIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
                    
                    if (i % 500 === 0) {
                        console.log(`Iteration ${i}: Heap increase: ${(heapIncrease / 1024 / 1024).toFixed(2)}MB`);
                    }
                }
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage();
            const totalIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            
            console.log(`Final memory increase: ${(totalIncrease / 1024 / 1024).toFixed(2)}MB`);
            expect(totalIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB total
        });
    });

    describe('UI Performance Integration', () => {
        test('should maintain performance with PauseOverlay', () => {
            const pauseOverlay = new PauseOverlay(mockScene as any);
            
            // Test pause with UI overlay
            const pauseWithUIStart = performance.now();
            pauseSystem.pause('user');
            pauseOverlay.show('user', true);
            const pauseWithUIDuration = performance.now() - pauseWithUIStart;
            
            // Test unpause with UI overlay
            const unpauseWithUIStart = performance.now();
            pauseOverlay.hide();
            pauseSystem.unpause();
            const unpauseWithUIDuration = performance.now() - unpauseWithUIStart;
            
            // UI operations should not significantly impact pause performance
            expect(pauseWithUIDuration).toBeLessThan(250); // Allow 50ms extra for UI
            expect(unpauseWithUIDuration).toBeLessThan(250);
            
            console.log(`With UI - Pause: ${pauseWithUIDuration.toFixed(2)}ms, Unpause: ${unpauseWithUIDuration.toFixed(2)}ms`);
            
            pauseOverlay.destroy();
        });
    });

    describe('Concurrent Operations Performance', () => {
        test('should handle rapid toggle operations efficiently', () => {
            // Test rapid pause/unpause toggles (simulating user spam-clicking)
            const toggleCount = 50;
            const toggleTimes: number[] = [];
            
            for (let i = 0; i < toggleCount; i++) {
                const start = performance.now();
                pauseSystem.toggle('user');
                const duration = performance.now() - start;
                toggleTimes.push(duration);
                
                // Wait for cooldown to expire occasionally to allow actual toggles
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 110)); // Just over cooldown
                }
            }
            
            const avgToggleTime = toggleTimes.reduce((sum, time) => sum + time, 0) / toggleTimes.length;
            const maxToggleTime = Math.max(...toggleTimes);
            
            expect(avgToggleTime).toBeLessThan(100); // Should be very fast
            expect(maxToggleTime).toBeLessThan(200); // Even worst case should be under limit
            
            console.log(`Toggle performance - Average: ${avgToggleTime.toFixed(2)}ms, Max: ${maxToggleTime.toFixed(2)}ms`);
        });
    });

    describe('Error Handling Performance', () => {
        test('should maintain performance when handling system errors', () => {
            // Create systems that throw errors
            const errorSystems = Array.from({ length: 20 }, (_, i) => ({
                pause: jest.fn().mockImplementation(() => {
                    if (i % 3 === 0) throw new Error(`Error in system ${i}`);
                }),
                unpause: jest.fn().mockImplementation(() => {
                    if (i % 4 === 0) throw new Error(`Error in system ${i}`);
                }),
                isPaused: jest.fn().mockReturnValue(false),
                getState: jest.fn().mockReturnValue({ id: i }),
                setState: jest.fn()
            }));
            
            errorSystems.forEach((system, i) => {
                pauseSystem.registerPausableSystem(system, `ErrorSystem${i}`);
            });
            
            // Measure performance with error handling
            const pauseDuration = performanceMeasure.measure(() => {
                pauseSystem.pause('user');
            });
            
            const unpauseDuration = performanceMeasure.measure(() => {
                pauseSystem.unpause();
            });
            
            // Should still meet performance requirements despite errors
            expect(pauseDuration).toBeLessThan(200);
            expect(unpauseDuration).toBeLessThan(200);
            
            console.log(`With errors - Pause: ${pauseDuration.toFixed(2)}ms, Unpause: ${unpauseDuration.toFixed(2)}ms`);
        });
    });

    describe('Stress Testing', () => {
        test('should maintain performance under high load', () => {
            // Create a high-load scenario
            const systemCount = 500;
            const systems = Array.from({ length: systemCount }, (_, i) => {
                const system = {
                    pause: jest.fn(),
                    unpause: jest.fn(),
                    isPaused: jest.fn().mockReturnValue(false),
                    getState: jest.fn().mockReturnValue({ 
                        id: i,
                        data: new Array(100).fill(i) // Some state data
                    }),
                    setState: jest.fn()
                };
                
                pauseSystem.registerPausableSystem(system, `StressSystem${i}`);
                return system;
            });
            
            // Measure under stress
            const stressResults: number[] = [];
            
            for (let iteration = 0; iteration < 10; iteration++) {
                const duration = performanceMeasure.measure(() => {
                    pauseSystem.pause('user');
                    pauseSystem.unpause();
                });
                stressResults.push(duration);
            }
            
            const avgStressTime = stressResults.reduce((sum, time) => sum + time, 0) / stressResults.length;
            const maxStressTime = Math.max(...stressResults);
            
            expect(avgStressTime).toBeLessThan(400); // Allow more time for stress test
            expect(maxStressTime).toBeLessThan(500);
            
            console.log(`Stress test (${systemCount} systems):`);
            console.log(`  Average: ${avgStressTime.toFixed(2)}ms`);
            console.log(`  Maximum: ${maxStressTime.toFixed(2)}ms`);
            
            // Verify all systems were called
            systems.forEach(system => {
                expect(system.pause).toHaveBeenCalledTimes(10);
                expect(system.unpause).toHaveBeenCalledTimes(10);
            });
        });
    });
});

// Helper function for async operations in tests
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}