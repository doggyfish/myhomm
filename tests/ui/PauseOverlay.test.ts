import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { PauseOverlay } from '../../src/ui/PauseOverlay.js';

// Mock Phaser
const mockScene = {
    game: {
        config: {
            width: 1024,
            height: 768
        }
    },
    add: {
        existing: jest.fn(),
        rectangle: jest.fn().mockReturnValue({
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis()
        }),
        text: jest.fn().mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setText: jest.fn(),
            setVisible: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis(),
            visible: true
        })
    },
    tweens: {
        add: jest.fn().mockReturnValue({
            stop: jest.fn()
        })
    }
};

// Mock ConfigurationManager
jest.mock('../../src/config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn().mockImplementation((key: string) => {
            const config: any = {
                'pause.overlay.backgroundAlpha': 0.5,
                'pause.overlay.mainTextSize': '48px',
                'pause.overlay.mainTextColor': '#FFFFFF',
                'pause.overlay.instructionTextSize': '24px',
                'pause.overlay.instructionTextColor': '#CCCCCC',
                'pause.overlay.reasonTextSize': '18px',
                'pause.overlay.reasonTextColor': '#FFCC00',
                'pause.overlay.statsTextSize': '14px',
                'pause.overlay.statsTextColor': '#999999',
                'pause.overlay.transitionTime': 300,
                'pause.overlay.depth': 10000,
                'ui.fontFamily': 'Arial',
                'debug.showPauseStats': false
            };
            return config[key] || null;
        })
    }
}));

describe('PauseOverlay', () => {
    let pauseOverlay: PauseOverlay;

    beforeEach(() => {
        jest.clearAllMocks();
        pauseOverlay = new PauseOverlay(mockScene as any);
    });

    afterEach(() => {
        if (pauseOverlay) {
            pauseOverlay.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with correct default state', () => {
            expect(pauseOverlay.getVisible()).toBe(false);
        });

        test('should create all required UI elements', () => {
            expect(mockScene.add.rectangle).toHaveBeenCalled();
            expect(mockScene.add.text).toHaveBeenCalledTimes(4); // Main, instruction, reason, stats text
            expect(mockScene.add.existing).toHaveBeenCalled();
        });

        test('should set correct depth for overlay', () => {
            // Verify overlay is created with high depth to appear on top
            expect(pauseOverlay.depth).toBe(10000);
        });
    });

    describe('Show Functionality', () => {
        test('should show overlay with default settings', () => {
            pauseOverlay.show();
            
            expect(pauseOverlay.getVisible()).toBe(true);
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: pauseOverlay,
                    alpha: 1,
                    duration: 300,
                    ease: 'Power2.easeOut'
                })
            );
        });

        test('should show overlay with reason', () => {
            pauseOverlay.show('system');
            
            expect(pauseOverlay.getVisible()).toBe(true);
        });

        test('should show overlay with stats enabled', () => {
            pauseOverlay.show('user', true);
            
            expect(pauseOverlay.getVisible()).toBe(true);
        });

        test('should show overlay with custom message', () => {
            pauseOverlay.show(undefined, false, 'Custom Pause Message');
            
            expect(pauseOverlay.getVisible()).toBe(true);
        });

        test('should not show if already visible', () => {
            pauseOverlay.show();
            const initialTweenCalls = (mockScene.tweens.add as jest.Mock).mock.calls.length;
            
            pauseOverlay.show();
            
            expect((mockScene.tweens.add as jest.Mock).mock.calls.length).toBe(initialTweenCalls);
        });

        test('should stop existing fade out tween when showing', () => {
            const mockTween = { stop: jest.fn() };
            (mockScene.tweens.add as jest.Mock).mockReturnValueOnce(mockTween);
            
            pauseOverlay.hide(); // Start fade out
            pauseOverlay.show(); // Should stop fade out and start fade in
            
            expect(mockTween.stop).toHaveBeenCalled();
        });
    });

    describe('Hide Functionality', () => {
        test('should hide overlay', () => {
            pauseOverlay.show();
            pauseOverlay.hide();
            
            expect(pauseOverlay.getVisible()).toBe(false);
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: pauseOverlay,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2.easeIn'
                })
            );
        });

        test('should not hide if already hidden', () => {
            const initialTweenCalls = (mockScene.tweens.add as jest.Mock).mock.calls.length;
            
            pauseOverlay.hide();
            
            expect((mockScene.tweens.add as jest.Mock).mock.calls.length).toBe(initialTweenCalls);
        });

        test('should stop existing fade in tween when hiding', () => {
            const mockTween = { stop: jest.fn() };
            (mockScene.tweens.add as jest.Mock).mockReturnValueOnce(mockTween);
            
            pauseOverlay.show(); // Start fade in
            pauseOverlay.hide(); // Should stop fade in and start fade out
            
            expect(mockTween.stop).toHaveBeenCalled();
        });
    });

    describe('Reason Display', () => {
        test('should display user pause reason', () => {
            pauseOverlay.show('user');
            
            // Verify reason text is set and made visible
            expect(pauseOverlay['reasonText'].setText).toHaveBeenCalledWith('Paused by user');
            expect(pauseOverlay['reasonText'].setVisible).toHaveBeenCalledWith(true);
        });

        test('should display system pause reason', () => {
            pauseOverlay.show('system');
            
            expect(pauseOverlay['reasonText'].setText).toHaveBeenCalledWith('Paused by system');
            expect(pauseOverlay['reasonText'].setVisible).toHaveBeenCalledWith(true);
        });

        test('should display emergency pause reason', () => {
            pauseOverlay.show('emergency');
            
            expect(pauseOverlay['reasonText'].setText).toHaveBeenCalledWith('Emergency pause activated');
            expect(pauseOverlay['reasonText'].setVisible).toHaveBeenCalledWith(true);
        });

        test('should hide reason text when no reason provided', () => {
            pauseOverlay.show();
            
            expect(pauseOverlay['reasonText'].setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('Custom Messages', () => {
        test('should display custom message', () => {
            const customMessage = 'Game Temporarily Paused';
            pauseOverlay.show(undefined, false, customMessage);
            
            expect(pauseOverlay['pauseText'].setText).toHaveBeenCalledWith(customMessage);
        });

        test('should revert to default message when no custom message', () => {
            pauseOverlay.show();
            
            expect(pauseOverlay['pauseText'].setText).toHaveBeenCalledWith('GAME PAUSED');
        });
    });

    describe('Statistics Display', () => {
        test('should show stats when enabled', () => {
            pauseOverlay.show('user', true);
            
            expect(pauseOverlay['statsText'].setVisible).toHaveBeenCalledWith(true);
        });

        test('should hide stats when disabled', () => {
            pauseOverlay.show('user', false);
            
            expect(pauseOverlay['statsText'].setVisible).toHaveBeenCalledWith(false);
        });

        test('should update stats display', () => {
            const mockStats = {
                isPaused: true,
                totalPausedTime: 5000,
                currentPauseDuration: 1000,
                systemCount: 3,
                pauseReason: 'user'
            };
            
            pauseOverlay.show('user', true);
            pauseOverlay.updateStats(mockStats);
            
            expect(pauseOverlay['statsText'].setText).toHaveBeenCalledWith(
                expect.stringContaining('Systems: 3')
            );
            expect(pauseOverlay['statsText'].setText).toHaveBeenCalledWith(
                expect.stringContaining('Total Paused: 5s')
            );
        });

        test('should not update stats if not visible', () => {
            const mockStats = {
                isPaused: true,
                totalPausedTime: 5000,
                currentPauseDuration: 1000,
                systemCount: 3,
                pauseReason: 'user'
            };
            
            pauseOverlay['statsText'].visible = false;
            pauseOverlay.updateStats(mockStats);
            
            // Should not call setText when stats are not visible
            expect(pauseOverlay['statsText'].setText).not.toHaveBeenCalledWith(
                expect.stringContaining('Systems:')
            );
        });

        test('should toggle stats visibility', () => {
            pauseOverlay['statsText'].visible = false;
            pauseOverlay.toggleStats();
            expect(pauseOverlay['statsText'].setVisible).toHaveBeenCalledWith(true);
            
            pauseOverlay['statsText'].visible = true;
            pauseOverlay.toggleStats();
            expect(pauseOverlay['statsText'].setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('Layout Updates', () => {
        test('should update layout for different screen sizes', () => {
            mockScene.game.config.width = 1920;
            mockScene.game.config.height = 1080;
            
            pauseOverlay.updateLayout();
            
            // Verify elements are repositioned for new screen size
            expect(pauseOverlay['background'].setSize).toHaveBeenCalledWith(1920, 1080);
            expect(pauseOverlay['background'].setPosition).toHaveBeenCalledWith(960, 540);
            expect(pauseOverlay['pauseText'].setPosition).toHaveBeenCalledWith(960, 460);
        });
    });

    describe('Interactivity', () => {
        test('should block pointer events from reaching game elements', () => {
            // Verify background is interactive and consumes events
            expect(pauseOverlay['background'].setInteractive).toHaveBeenCalled();
            expect(pauseOverlay['background'].on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
            expect(pauseOverlay['background'].on).toHaveBeenCalledWith('pointerup', expect.any(Function));
            expect(pauseOverlay['background'].on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        });
    });

    describe('Animation Handling', () => {
        test('should handle animation completion properly', () => {
            let onCompleteCallback: Function;
            (mockScene.tweens.add as jest.Mock).mockImplementation((config) => {
                onCompleteCallback = config.onComplete;
                return { stop: jest.fn() };
            });
            
            pauseOverlay.show();
            
            // Simulate animation completion
            if (onCompleteCallback) {
                onCompleteCallback();
            }
            
            // Verify fade in tween is cleared
            expect(pauseOverlay['fadeInTween']).toBeUndefined();
        });

        test('should handle hide animation completion', () => {
            pauseOverlay.show();
            
            let onCompleteCallback: Function;
            (mockScene.tweens.add as jest.Mock).mockImplementation((config) => {
                if (config.alpha === 0) { // Hide animation
                    onCompleteCallback = config.onComplete;
                }
                return { stop: jest.fn() };
            });
            
            pauseOverlay.hide();
            
            // Simulate hide animation completion
            if (onCompleteCallback) {
                onCompleteCallback();
            }
            
            expect(pauseOverlay.visible).toBe(false);
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should stop running tweens on destroy', () => {
            const mockFadeInTween = { stop: jest.fn() };
            const mockFadeOutTween = { stop: jest.fn() };
            
            pauseOverlay['fadeInTween'] = mockFadeInTween as any;
            pauseOverlay['fadeOutTween'] = mockFadeOutTween as any;
            
            pauseOverlay.destroy();
            
            expect(mockFadeInTween.stop).toHaveBeenCalled();
            expect(mockFadeOutTween.stop).toHaveBeenCalled();
        });

        test('should clean up all child elements', () => {
            const removeAllSpy = jest.spyOn(pauseOverlay, 'removeAll');
            
            pauseOverlay.destroy();
            
            expect(removeAllSpy).toHaveBeenCalledWith(true);
        });
    });

    describe('Configuration Integration', () => {
        test('should use configuration values for styling', () => {
            // Verify CONFIG.get calls were made during initialization
            expect(require('../../src/config/ConfigurationManager.js').CONFIG.get).toHaveBeenCalledWith('pause.overlay.backgroundAlpha');
            expect(require('../../src/config/ConfigurationManager.js').CONFIG.get).toHaveBeenCalledWith('pause.overlay.mainTextSize');
            expect(require('../../src/config/ConfigurationManager.js').CONFIG.get).toHaveBeenCalledWith('pause.overlay.transitionTime');
        });
    });

    describe('Edge Cases', () => {
        test('should handle show/hide rapid alternation', () => {
            for (let i = 0; i < 5; i++) {
                pauseOverlay.show();
                pauseOverlay.hide();
            }
            
            // Should not crash and should handle state correctly
            expect(pauseOverlay.getVisible()).toBe(false);
        });

        test('should handle stats update with undefined values', () => {
            const invalidStats = {
                isPaused: true,
                totalPausedTime: undefined,
                currentPauseDuration: null,
                systemCount: NaN,
                pauseReason: undefined
            } as any;
            
            pauseOverlay.show('user', true);
            
            expect(() => {
                pauseOverlay.updateStats(invalidStats);
            }).not.toThrow();
        });

        test('should handle very long custom messages', () => {
            const longMessage = 'A'.repeat(1000);
            
            expect(() => {
                pauseOverlay.show(undefined, false, longMessage);
            }).not.toThrow();
            
            expect(pauseOverlay['pauseText'].setText).toHaveBeenCalledWith(longMessage);
        });
    });
});