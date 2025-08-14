import { describe, expect, test, beforeEach } from '@jest/globals';
import { PausableComponent } from '../../src/components/PausableComponent.js';

describe('PausableComponent', () => {
    let pausableComponent: PausableComponent;

    beforeEach(() => {
        pausableComponent = new PausableComponent();
    });

    describe('Initialization', () => {
        test('should initialize in unpaused state', () => {
            expect(pausableComponent.isPaused).toBe(false);
            expect(pausableComponent.pausedState).toBeNull();
            expect(pausableComponent.lastUpdateTime).toBe(0);
            expect(pausableComponent.totalPausedTime).toBe(0);
            expect(pausableComponent.pauseHistory).toEqual([]);
        });
    });

    describe('Basic Pause/Unpause', () => {
        test('should pause successfully', () => {
            const currentTime = Date.now();
            pausableComponent.pause(currentTime);
            
            expect(pausableComponent.isPaused).toBe(true);
            expect(pausableComponent.pauseStartTime).toBe(currentTime);
            expect(pausableComponent.pauseHistory).toHaveLength(1);
            expect(pausableComponent.pauseHistory[0].startTime).toBe(currentTime);
        });

        test('should unpause successfully', () => {
            const startTime = Date.now();
            const endTime = startTime + 1000;
            
            pausableComponent.pause(startTime);
            const restoredState = pausableComponent.unpause(endTime);
            
            expect(pausableComponent.isPaused).toBe(false);
            expect(pausableComponent.pauseStartTime).toBe(0);
            expect(pausableComponent.totalPausedTime).toBe(1000);
            expect(pausableComponent.pauseHistory[0].endTime).toBe(endTime);
            expect(pausableComponent.pauseHistory[0].duration).toBe(1000);
        });

        test('should not pause if already paused', () => {
            const currentTime = Date.now();
            pausableComponent.pause(currentTime);
            const initialHistoryLength = pausableComponent.pauseHistory.length;
            
            pausableComponent.pause(currentTime + 100);
            
            expect(pausableComponent.pauseHistory).toHaveLength(initialHistoryLength);
        });

        test('should not unpause if not paused', () => {
            const result = pausableComponent.unpause(Date.now());
            
            expect(result).toBeNull();
            expect(pausableComponent.isPaused).toBe(false);
        });
    });

    describe('State Preservation', () => {
        test('should preserve state when pausing', () => {
            const testState = { position: { x: 10, y: 20 }, health: 100 };
            const currentTime = Date.now();
            
            pausableComponent.pause(currentTime, testState);
            
            expect(pausableComponent.pausedState).toEqual(testState);
            expect(pausableComponent.pausedState).not.toBe(testState); // Should be a copy
        });

        test('should restore state when unpausing', () => {
            const testState = { position: { x: 10, y: 20 }, health: 100 };
            const startTime = Date.now();
            
            pausableComponent.pause(startTime, testState);
            const restoredState = pausableComponent.unpause(startTime + 500);
            
            expect(restoredState).toEqual(testState);
            expect(pausableComponent.pausedState).toBeNull(); // Should be cleared
        });

        test('should deep clone preserved state', () => {
            const testState = {
                nested: { value: 42 },
                array: [1, 2, 3],
                date: new Date()
            };
            
            pausableComponent.pause(Date.now(), testState);
            
            // Modify original
            testState.nested.value = 999;
            testState.array.push(4);
            
            // Preserved state should be unchanged
            expect(pausableComponent.pausedState.nested.value).toBe(42);
            expect(pausableComponent.pausedState.array).toEqual([1, 2, 3]);
        });
    });

    describe('Time Adjustment', () => {
        test('should calculate adjusted time correctly', () => {
            const baseTime = 10000;
            pausableComponent.totalPausedTime = 2000;
            
            const adjustedTime = pausableComponent.getAdjustedTime(baseTime);
            
            expect(adjustedTime).toBe(8000); // 10000 - 2000
        });

        test('should include current pause in adjusted time', () => {
            const baseTime = 10000;
            const pauseStartTime = 8000;
            const currentTime = 10000;
            
            pausableComponent.totalPausedTime = 1000;
            pausableComponent.isPaused = true;
            pausableComponent.pauseStartTime = pauseStartTime;
            
            const adjustedTime = pausableComponent.getAdjustedTime(currentTime);
            
            expect(adjustedTime).toBe(7000); // 10000 - 1000 - (10000 - 8000)
        });

        test('should get total paused time including current pause', () => {
            const currentTime = 10000;
            pausableComponent.totalPausedTime = 2000;
            pausableComponent.isPaused = true;
            pausableComponent.pauseStartTime = 8000;
            
            const totalPaused = pausableComponent.getTotalPausedTime(currentTime);
            
            expect(totalPaused).toBe(4000); // 2000 + (10000 - 8000)
        });
    });

    describe('Update Control', () => {
        test('should allow updates when not paused', () => {
            expect(pausableComponent.shouldUpdate()).toBe(true);
        });

        test('should block updates when paused', () => {
            pausableComponent.pause(Date.now());
            expect(pausableComponent.shouldUpdate()).toBe(false);
        });
    });

    describe('Statistics', () => {
        test('should provide accurate pause statistics', () => {
            const startTime1 = 1000;
            const endTime1 = 2000;
            const startTime2 = 3000;
            const currentTime = 4000;
            
            // First pause session
            pausableComponent.pause(startTime1);
            pausableComponent.unpause(endTime1);
            
            // Second pause session (ongoing)
            pausableComponent.pause(startTime2);
            
            const stats = pausableComponent.getPauseStats(currentTime);
            
            expect(stats.isPaused).toBe(true);
            expect(stats.pauseCount).toBe(2);
            expect(stats.totalPausedTime).toBe(2000); // 1000 + 1000
            expect(stats.currentPauseDuration).toBe(1000); // 4000 - 3000
            expect(stats.lastPauseStartTime).toBe(startTime2);
        });
    });

    describe('Multiple Pause Sessions', () => {
        test('should handle multiple pause/unpause cycles', () => {
            const sessions = [
                { start: 1000, end: 2000 },
                { start: 3000, end: 4500 },
                { start: 5000, end: 6000 }
            ];
            
            sessions.forEach(session => {
                pausableComponent.pause(session.start);
                pausableComponent.unpause(session.end);
            });
            
            expect(pausableComponent.pauseHistory).toHaveLength(3);
            expect(pausableComponent.totalPausedTime).toBe(3500); // 1000 + 1500 + 1000
            
            pausableComponent.pauseHistory.forEach((entry, index) => {
                expect(entry.startTime).toBe(sessions[index].start);
                expect(entry.endTime).toBe(sessions[index].end);
                expect(entry.duration).toBe(sessions[index].end - sessions[index].start);
            });
        });
    });

    describe('Reset Functionality', () => {
        test('should reset all pause state', () => {
            // Set up some pause state
            pausableComponent.pause(1000, { test: 'data' });
            pausableComponent.unpause(2000);
            pausableComponent.pause(3000);
            
            pausableComponent.reset();
            
            expect(pausableComponent.isPaused).toBe(false);
            expect(pausableComponent.pausedState).toBeNull();
            expect(pausableComponent.lastUpdateTime).toBe(0);
            expect(pausableComponent.pauseStartTime).toBe(0);
            expect(pausableComponent.totalPausedTime).toBe(0);
            expect(pausableComponent.pauseHistory).toEqual([]);
        });
    });

    describe('Deep Cloning', () => {
        test('should handle null and primitive values', () => {
            const testCases = [null, undefined, 42, 'string', true, false];
            
            testCases.forEach(value => {
                pausableComponent.pause(Date.now(), value);
                expect(pausableComponent.pausedState).toEqual(value);
            });
        });

        test('should clone Date objects correctly', () => {
            const date = new Date('2024-01-01');
            pausableComponent.pause(Date.now(), { date });
            
            expect(pausableComponent.pausedState.date).toBeInstanceOf(Date);
            expect(pausableComponent.pausedState.date.getTime()).toBe(date.getTime());
            expect(pausableComponent.pausedState.date).not.toBe(date);
        });

        test('should clone arrays recursively', () => {
            const array = [1, { nested: 2 }, [3, 4]];
            pausableComponent.pause(Date.now(), { array });
            
            expect(pausableComponent.pausedState.array).toEqual(array);
            expect(pausableComponent.pausedState.array).not.toBe(array);
            expect(pausableComponent.pausedState.array[1]).not.toBe(array[1]);
            expect(pausableComponent.pausedState.array[2]).not.toBe(array[2]);
        });

        test('should handle complex nested objects', () => {
            const complex = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep',
                            array: [1, 2, { nested: true }]
                        }
                    }
                },
                otherProp: 'test'
            };
            
            pausableComponent.pause(Date.now(), complex);
            
            expect(pausableComponent.pausedState).toEqual(complex);
            expect(pausableComponent.pausedState).not.toBe(complex);
            expect(pausableComponent.pausedState.level1.level2.level3).not.toBe(complex.level1.level2.level3);
        });
    });

    describe('Edge Cases', () => {
        test('should handle rapid pause/unpause cycles', () => {
            const baseTime = Date.now();
            
            for (let i = 0; i < 10; i++) {
                pausableComponent.pause(baseTime + i * 100);
                pausableComponent.unpause(baseTime + i * 100 + 50);
            }
            
            expect(pausableComponent.pauseHistory).toHaveLength(10);
            expect(pausableComponent.totalPausedTime).toBe(500); // 10 * 50ms
        });

        test('should handle zero duration pauses', () => {
            const time = Date.now();
            pausableComponent.pause(time);
            pausableComponent.unpause(time);
            
            expect(pausableComponent.pauseHistory[0].duration).toBe(0);
            expect(pausableComponent.totalPausedTime).toBe(0);
        });

        test('should handle large time values', () => {
            const largeTime = Number.MAX_SAFE_INTEGER - 1000;
            pausableComponent.pause(largeTime);
            pausableComponent.unpause(largeTime + 500);
            
            expect(pausableComponent.totalPausedTime).toBe(500);
        });
    });
});