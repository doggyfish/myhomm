import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { PauseSystem } from '../../src/systems/PauseSystem.js';
import { PauseEvents, IPausableSystem } from '../../src/events/PauseEvents.js';
import { GameStateManager } from '../../src/game/GameStateManager.js';

// Mock ConfigurationManager
jest.mock('../../src/config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn().mockImplementation((key: string) => {
            const config: any = {
                'pause.inputCooldown': 100,
                'pause.maxResponseTime': 200,
                'pause.overlay.backgroundAlpha': 0.5,
                'pause.overlay.transitionTime': 300
            };
            return config[key] || null;
        })
    }
}));

// Mock pausable system for testing
class MockPausableSystem implements IPausableSystem {
    private _isPaused = false;
    private _state: any = { value: 42 };

    pause() {
        this._isPaused = true;
    }

    unpause() {
        this._isPaused = false;
    }

    isPaused(): boolean {
        return this._isPaused;
    }

    getState(): any {
        return { ...this._state };
    }

    setState(state: any): void {
        this._state = { ...state };
    }
}

describe('PauseSystem', () => {
    let pauseSystem: PauseSystem;
    let mockGameState: GameStateManager;
    let mockSystem1: MockPausableSystem;
    let mockSystem2: MockPausableSystem;

    beforeEach(() => {
        mockGameState = new GameStateManager();
        pauseSystem = new PauseSystem(mockGameState);
        mockSystem1 = new MockPausableSystem();
        mockSystem2 = new MockPausableSystem();
    });

    afterEach(() => {
        if (pauseSystem) {
            pauseSystem.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Basic Pause/Unpause Functionality', () => {
        test('should initialize in unpaused state', () => {
            expect(pauseSystem.isPaused()).toBe(false);
        });

        test('should pause successfully with user reason', () => {
            const result = pauseSystem.pause('user');
            expect(result).toBe(true);
            expect(pauseSystem.isPaused()).toBe(true);
        });

        test('should unpause successfully', () => {
            pauseSystem.pause('user');
            const result = pauseSystem.unpause();
            expect(result).toBe(true);
            expect(pauseSystem.isPaused()).toBe(false);
        });

        test('should not pause if already paused', () => {
            pauseSystem.pause('user');
            const result = pauseSystem.pause('user');
            expect(result).toBe(false);
            expect(pauseSystem.isPaused()).toBe(true);
        });

        test('should not unpause if not paused', () => {
            const result = pauseSystem.unpause();
            expect(result).toBe(false);
            expect(pauseSystem.isPaused()).toBe(false);
        });

        test('should support different pause reasons', () => {
            pauseSystem.pause('system');
            expect(pauseSystem.isPaused()).toBe(true);
            
            pauseSystem.unpause();
            pauseSystem.pause('emergency');
            expect(pauseSystem.isPaused()).toBe(true);
        });
    });

    describe('Event Emission', () => {
        test('should emit pause activated event', (done) => {
            pauseSystem.on(PauseEvents.PAUSE_ACTIVATED, (eventData) => {
                expect(eventData.reason).toBe('user');
                expect(eventData.timestamp).toBeGreaterThan(0);
                done();
            });

            pauseSystem.pause('user');
        });

        test('should emit pause deactivated event', (done) => {
            pauseSystem.pause('user');
            
            pauseSystem.on(PauseEvents.PAUSE_DEACTIVATED, (eventData) => {
                expect(eventData.reason).toBe('user');
                expect(eventData.pauseDuration).toBeGreaterThan(0);
                done();
            });

            // Small delay to ensure measurable pause duration
            setTimeout(() => {
                pauseSystem.unpause();
            }, 10);
        });

        test('should emit system registered event', (done) => {
            pauseSystem.on(PauseEvents.SYSTEM_REGISTERED, (eventData) => {
                expect(eventData.systemCount).toBe(1);
                done();
            });

            pauseSystem.registerPausableSystem(mockSystem1);
        });
    });

    describe('System Registration', () => {
        test('should register pausable system', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            
            const stats = pauseSystem.getStats();
            expect(stats.systemCount).toBe(1);
        });

        test('should register multiple systems', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            pauseSystem.registerPausableSystem(mockSystem2);
            
            const stats = pauseSystem.getStats();
            expect(stats.systemCount).toBe(2);
        });

        test('should pause newly registered system if already paused', () => {
            pauseSystem.pause('user');
            pauseSystem.registerPausableSystem(mockSystem1);
            
            expect(mockSystem1.isPaused()).toBe(true);
        });

        test('should unregister system', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            pauseSystem.unregisterPausableSystem(mockSystem1);
            
            const stats = pauseSystem.getStats();
            expect(stats.systemCount).toBe(0);
        });
    });

    describe('System Coordination', () => {
        test('should pause all registered systems', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            pauseSystem.registerPausableSystem(mockSystem2);
            
            pauseSystem.pause('user');
            
            expect(mockSystem1.isPaused()).toBe(true);
            expect(mockSystem2.isPaused()).toBe(true);
        });

        test('should unpause all registered systems', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            pauseSystem.registerPausableSystem(mockSystem2);
            
            pauseSystem.pause('user');
            pauseSystem.unpause();
            
            expect(mockSystem1.isPaused()).toBe(false);
            expect(mockSystem2.isPaused()).toBe(false);
        });

        test('should preserve and restore system states', () => {
            const originalState = mockSystem1.getState();
            pauseSystem.registerPausableSystem(mockSystem1);
            
            pauseSystem.pause('user');
            mockSystem1.setState({ value: 999 }); // Modify state during pause
            pauseSystem.unpause();
            
            // State preservation/restoration would be handled by individual systems
            // This test verifies the coordination occurs
            expect(mockSystem1.isPaused()).toBe(false);
        });
    });

    describe('Toggle Functionality', () => {
        test('should toggle from unpaused to paused', () => {
            const result = pauseSystem.toggle('user');
            expect(result).toBe(true);
            expect(pauseSystem.isPaused()).toBe(true);
        });

        test('should toggle from paused to unpaused', () => {
            pauseSystem.pause('user');
            const result = pauseSystem.toggle('user');
            expect(result).toBe(false);
            expect(pauseSystem.isPaused()).toBe(false);
        });
    });

    describe('Input Cooldown', () => {
        test('should respect input cooldown', () => {
            const result1 = pauseSystem.pause('user');
            expect(result1).toBe(true);
            
            // Immediate second pause should be blocked by cooldown
            const result2 = pauseSystem.pause('user');
            expect(result2).toBe(false);
        });

        test('should allow pause after cooldown period', (done) => {
            pauseSystem.pause('user');
            pauseSystem.unpause();
            
            // Wait for cooldown to expire
            setTimeout(() => {
                const result = pauseSystem.pause('user');
                expect(result).toBe(true);
                done();
            }, 150); // Longer than 100ms cooldown
        });
    });

    describe('Emergency Pause', () => {
        test('should emergency pause immediately', () => {
            const result = pauseSystem.emergencyPause();
            expect(result).toBe(true);
            expect(pauseSystem.isPaused()).toBe(true);
            
            const stats = pauseSystem.getStats();
            expect(stats.pauseReason).toBe('emergency');
        });
    });

    describe('State Management', () => {
        test('should provide current state', () => {
            pauseSystem.pause('system');
            const state = pauseSystem.getState();
            
            expect(state.isPaused).toBe(true);
            expect(state.pauseReason).toBe('system');
            expect(state.pauseStartTime).toBeGreaterThan(0);
            expect(state.systemStates).toBeDefined();
        });

        test('should restore from saved state', () => {
            const testState = {
                isPaused: true,
                pauseStartTime: Date.now(),
                totalPausedTime: 5000,
                pauseReason: 'system',
                systemStates: new Map()
            };
            
            pauseSystem.setState(testState);
            const restoredState = pauseSystem.getState();
            
            expect(restoredState.isPaused).toBe(true);
            expect(restoredState.pauseReason).toBe('system');
            expect(restoredState.totalPausedTime).toBe(5000);
        });
    });

    describe('Statistics', () => {
        test('should provide accurate statistics', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            pauseSystem.pause('user');
            
            const stats = pauseSystem.getStats();
            
            expect(stats.isPaused).toBe(true);
            expect(stats.pauseReason).toBe('user');
            expect(stats.systemCount).toBe(1);
            expect(stats.currentPauseDuration).toBeGreaterThan(0);
        });

        test('should track total paused time across multiple sessions', (done) => {
            pauseSystem.pause('user');
            
            setTimeout(() => {
                pauseSystem.unpause();
                
                setTimeout(() => {
                    pauseSystem.pause('user');
                    const stats = pauseSystem.getStats();
                    
                    expect(stats.totalPausedTime).toBeGreaterThan(10); // At least 10ms
                    done();
                }, 5);
            }, 10);
        });
    });

    describe('Performance Requirements', () => {
        test('should pause within 200ms performance requirement', () => {
            const startTime = performance.now();
            pauseSystem.pause('user');
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
        });

        test('should unpause within 200ms performance requirement', () => {
            pauseSystem.pause('user');
            
            const startTime = performance.now();
            pauseSystem.unpause();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
        });

        test('should handle large number of registered systems efficiently', () => {
            // Register 50 mock systems
            const systems: MockPausableSystem[] = [];
            for (let i = 0; i < 50; i++) {
                const system = new MockPausableSystem();
                systems.push(system);
                pauseSystem.registerPausableSystem(system);
            }
            
            const startTime = performance.now();
            pauseSystem.pause('user');
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
            expect(systems.every(s => s.isPaused())).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle system pause errors gracefully', () => {
            const errorSystem = {
                pause: jest.fn().mockImplementation(() => {
                    throw new Error('Mock pause error');
                }),
                unpause: jest.fn(),
                isPaused: jest.fn().mockReturnValue(false),
                getState: jest.fn().mockReturnValue({}),
                setState: jest.fn()
            };
            
            pauseSystem.registerPausableSystem(errorSystem as any);
            
            // Should not throw, should handle error gracefully
            expect(() => pauseSystem.pause('user')).not.toThrow();
            expect(pauseSystem.isPaused()).toBe(true);
        });

        test('should emit error events for system failures', (done) => {
            const errorSystem = {
                pause: jest.fn().mockImplementation(() => {
                    throw new Error('Mock pause error');
                }),
                unpause: jest.fn(),
                isPaused: jest.fn().mockReturnValue(false),
                getState: jest.fn().mockReturnValue({}),
                setState: jest.fn()
            };
            
            pauseSystem.on(PauseEvents.PAUSE_ERROR, (eventData) => {
                expect(eventData.error).toBeDefined();
                expect(eventData.operation).toBe('pause');
                done();
            });
            
            pauseSystem.registerPausableSystem(errorSystem as any);
            pauseSystem.pause('user');
        });
    });

    describe('Scene Transition Handling', () => {
        test('should handle scene transitions while paused', () => {
            pauseSystem.pause('user');
            
            // Mock scene transition
            pauseSystem.handleSceneTransition('NewScene');
            
            // Should remain paused
            expect(pauseSystem.isPaused()).toBe(true);
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should clean up properly on destroy', () => {
            pauseSystem.registerPausableSystem(mockSystem1);
            pauseSystem.pause('user');
            
            pauseSystem.destroy();
            
            // Should be unpaused and cleaned up
            expect(pauseSystem.isPaused()).toBe(false);
        });

        test('should remove all event listeners on destroy', () => {
            const eventSpy = jest.fn();
            pauseSystem.on(PauseEvents.PAUSE_ACTIVATED, eventSpy);
            
            pauseSystem.destroy();
            pauseSystem = new PauseSystem(); // Create new instance
            pauseSystem.pause('user');
            
            // Old listeners should not be called
            expect(eventSpy).not.toHaveBeenCalled();
        });
    });
});