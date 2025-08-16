import { CONFIG } from '../config/ConfigurationManager.js';

/**
 * Visual pause indicator overlay with resume instructions
 */
export class PauseOverlay extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        this.config = CONFIG;
        this.isVisible = false;
        this.fadeInTween = null;
        this.fadeOutTween = null;
        
        this.createOverlayElements();
        this.setupInteractivity();
        
        // Add to scene
        scene.add.existing(this);
        this.setVisible(false);
    }

    /**
     * Create all overlay UI elements
     */
    createOverlayElements() {
        // Create elements with default positions (will be updated when shown)
        // Semi-transparent background
        this.background = this.scene.add.rectangle(
            0, 0, 1024, 768, 0x000000, 0.6
        ).setScrollFactor(0);
        this.add(this.background);

        // Main pause text
        this.pauseText = this.scene.add.text(
            0, -60, 'GAME PAUSED',
            {
                fontSize: '48px',
                fill: '#FFD700',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0);
        this.add(this.pauseText);

        // Instruction text
        this.instructionText = this.scene.add.text(
            0, 0, 'Press ESC or P to resume',
            {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        this.add(this.instructionText);

        // Reason text (why game was paused)
        this.reasonText = this.scene.add.text(
            0, 40, '',
            {
                fontSize: '18px',
                fill: '#CCCCCC',
                fontFamily: 'Arial',
                alpha: 0.8
            }
        ).setOrigin(0.5).setScrollFactor(0);
        this.add(this.reasonText);

        // Stats text (pause duration, etc.)
        this.statsText = this.scene.add.text(
            0, 80, '',
            {
                fontSize: '16px',
                fill: '#999999',
                fontFamily: 'Arial Mono',
                alpha: 0.7
            }
        ).setOrigin(0.5).setScrollFactor(0);
        this.add(this.statsText);

        // Set container properties
        this.setDepth(1000);
        this.setScrollFactor(0);
    }

    /**
     * Setup input handling
     */
    setupInteractivity() {
        // Make background clickable to prevent clicks going through
        this.background.setInteractive();
        
        // Pulsing animation for pause text
        this.scene.tweens.add({
            targets: this.pauseText,
            alpha: { from: 1, to: 0.7 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Power2.easeInOut'
        });
    }

    /**
     * Center the pause overlay on the current screen view
     */
    centerOnScreen() {
        const camera = this.scene.cameras.main;
        const screenCenterX = camera.width / 2;
        const screenCenterY = camera.height / 2;
        
        // Position the container at screen center
        this.setPosition(screenCenterX, screenCenterY);
        
        // Update background size to cover the entire screen
        this.background.setSize(camera.width, camera.height);
    }

    /**
     * Show the pause overlay with fade-in effect
     */
    show(reason = 'user', pauseData = null) {
        if (this.isVisible) return;

        // Center on current screen view
        this.centerOnScreen();

        this.isVisible = true;
        this.setVisible(true);
        this.setAlpha(0);

        // Update reason text
        this.updateReasonText(reason);
        
        // Update stats if provided
        if (pauseData) {
            this.updateStatsText(pauseData);
        }

        // Stop any existing fade out tween
        if (this.fadeOutTween) {
            this.fadeOutTween.stop();
        }

        // Fade in animation
        this.fadeInTween = this.scene.tweens.add({
            targets: this,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Power2.easeOut'
        });

        // Play pause sound
        if (this.scene.sound && this.scene.sound.play) {
            this.scene.sound.play('pause_sound', { volume: 0.5 });
        }
    }

    /**
     * Hide the pause overlay with fade-out effect
     */
    hide() {
        if (!this.isVisible) return;

        // Stop any existing fade in tween
        if (this.fadeInTween) {
            this.fadeInTween.stop();
        }

        // Fade out animation
        this.fadeOutTween = this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0 },
            duration: 200,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.isVisible = false;
            }
        });

        // Play unpause sound
        if (this.scene.sound && this.scene.sound.play) {
            this.scene.sound.play('unpause_sound', { volume: 0.3 });
        }
    }

    /**
     * Update the reason text based on pause reason
     */
    updateReasonText(reason) {
        const reasonTexts = {
            'user': 'Paused by player',
            'system': 'Paused by system',
            'emergency': 'Emergency pause',
            'game_ended': 'Game ended - reviewing final state',
            'end_game_review': 'End game review mode',
            'scene_transition': 'Loading...'
        };

        const text = reasonTexts[reason] || `Paused: ${reason}`;
        this.reasonText.setText(text);
    }

    /**
     * Update stats text with pause duration and other info
     */
    updateStatsText(pauseData) {
        if (!pauseData) return;

        const lines = [];
        
        if (pauseData.duration !== undefined) {
            const seconds = Math.floor(pauseData.duration / 1000);
            lines.push(`Pause duration: ${seconds}s`);
        }
        
        if (pauseData.totalPaused !== undefined) {
            const totalSeconds = Math.floor(pauseData.totalPaused / 1000);
            lines.push(`Total paused time: ${totalSeconds}s`);
        }
        
        if (pauseData.systemsCount !== undefined) {
            lines.push(`Systems paused: ${pauseData.systemsCount}`);
        }

        this.statsText.setText(lines.join('\n'));
    }

    /**
     * Update overlay with current pause information
     */
    updatePauseInfo(reason, pauseData) {
        if (this.isVisible) {
            this.updateReasonText(reason);
            this.updateStatsText(pauseData);
        }
    }

    /**
     * Get visibility state
     */
    getIsVisible() {
        return this.isVisible;
    }

    /**
     * Cleanup overlay
     */
    cleanup() {
        if (this.fadeInTween) {
            this.fadeInTween.stop();
        }
        if (this.fadeOutTween) {
            this.fadeOutTween.stop();
        }
        
        this.destroy();
    }
}