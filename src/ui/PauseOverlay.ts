import { CONFIG } from '../config/ConfigurationManager.js';

/**
 * Visual pause indicator overlay with resume instructions
 */
export class PauseOverlay extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private pauseText: Phaser.GameObjects.Text;
    private instructionText: Phaser.GameObjects.Text;
    private reasonText: Phaser.GameObjects.Text;
    private statsText: Phaser.GameObjects.Text;
    private isVisible: boolean;
    private config: typeof CONFIG;
    private fadeInTween?: Phaser.Tweens.Tween;
    private fadeOutTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);
        this.config = CONFIG;
        this.isVisible = false;
        this.createOverlayElements();
        this.setupInteractivity();
        
        // Add to scene
        scene.add.existing(this);
        this.setVisible(false);
    }

    /**
     * Create all overlay UI elements
     */
    private createOverlayElements(): void {
        const { width, height } = this.scene.game.config;
        const gameWidth = typeof width === 'number' ? width : 1024;
        const gameHeight = typeof height === 'number' ? height : 768;

        // Semi-transparent background
        this.background = this.scene.add.rectangle(
            gameWidth / 2, 
            gameHeight / 2,
            gameWidth, 
            gameHeight,
            0x000000,
            this.config.get('pause.overlay.backgroundAlpha') || 0.5
        );
        this.add(this.background);

        // Main pause text
        const pauseTextStyle = {
            fontSize: this.config.get('pause.overlay.mainTextSize') || '48px',
            fill: this.config.get('pause.overlay.mainTextColor') || '#FFFFFF',
            fontFamily: this.config.get('ui.fontFamily') || 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        };

        this.pauseText = this.scene.add.text(
            gameWidth / 2,
            gameHeight / 2 - 80,
            'GAME PAUSED',
            pauseTextStyle
        );
        this.pauseText.setOrigin(0.5);
        this.add(this.pauseText);

        // Instruction text
        const instructionTextStyle = {
            fontSize: this.config.get('pause.overlay.instructionTextSize') || '24px',
            fill: this.config.get('pause.overlay.instructionTextColor') || '#CCCCCC',
            fontFamily: this.config.get('ui.fontFamily') || 'Arial',
            align: 'center',
            lineSpacing: 8
        };

        const instructions = [
            'Press SPACEBAR or ESC to resume',
            'Press P to pause/unpause',
            'UI remains viewable for information gathering'
        ].join('\n');

        this.instructionText = this.scene.add.text(
            gameWidth / 2,
            gameHeight / 2 + 20,
            instructions,
            instructionTextStyle
        );
        this.instructionText.setOrigin(0.5);
        this.add(this.instructionText);

        // Reason text (hidden by default)
        const reasonTextStyle = {
            fontSize: this.config.get('pause.overlay.reasonTextSize') || '18px',
            fill: this.config.get('pause.overlay.reasonTextColor') || '#FFCC00',
            fontFamily: this.config.get('ui.fontFamily') || 'Arial',
            align: 'center'
        };

        this.reasonText = this.scene.add.text(
            gameWidth / 2,
            gameHeight / 2 - 120,
            '',
            reasonTextStyle
        );
        this.reasonText.setOrigin(0.5);
        this.reasonText.setVisible(false);
        this.add(this.reasonText);

        // Stats text (for debugging/development)
        const statsTextStyle = {
            fontSize: this.config.get('pause.overlay.statsTextSize') || '14px',
            fill: this.config.get('pause.overlay.statsTextColor') || '#999999',
            fontFamily: this.config.get('ui.fontFamily') || 'Arial',
            align: 'center'
        };

        this.statsText = this.scene.add.text(
            gameWidth / 2,
            gameHeight / 2 + 120,
            '',
            statsTextStyle
        );
        this.statsText.setOrigin(0.5);
        this.statsText.setVisible(false);
        this.add(this.statsText);

        // Set depth to ensure it's on top of everything
        this.setDepth(this.config.get('pause.overlay.depth') || 10000);
    }

    /**
     * Setup overlay interactivity (prevent interaction with game elements)
     */
    private setupInteractivity(): void {
        // Make background interactive to block clicks to game elements
        this.background.setInteractive();
        
        // Consume all pointer events to prevent them from reaching game objects
        this.background.on('pointerdown', (event: Phaser.Input.Pointer) => {
            event.stopPropagation();
        });

        this.background.on('pointerup', (event: Phaser.Input.Pointer) => {
            event.stopPropagation();
        });

        this.background.on('pointermove', (event: Phaser.Input.Pointer) => {
            event.stopPropagation();
        });
    }

    /**
     * Show the pause overlay with optional customization
     * @param pauseReason Reason for the pause
     * @param showStats Whether to show debug statistics
     * @param customMessage Custom message to display
     */
    public show(pauseReason?: string, showStats?: boolean, customMessage?: string): void {
        if (this.isVisible) {
            return; // Already visible
        }

        this.isVisible = true;

        // Stop any existing fade out tween
        if (this.fadeOutTween) {
            this.fadeOutTween.stop();
            this.fadeOutTween = undefined;
        }

        // Update reason text if provided
        if (pauseReason) {
            let reasonMessage = '';
            switch (pauseReason) {
                case 'user':
                    reasonMessage = 'Paused by user';
                    break;
                case 'system':
                    reasonMessage = 'Paused by system';
                    break;
                case 'emergency':
                    reasonMessage = 'Emergency pause activated';
                    break;
                default:
                    reasonMessage = `Paused: ${pauseReason}`;
            }
            
            this.reasonText.setText(reasonMessage);
            this.reasonText.setVisible(true);
        } else {
            this.reasonText.setVisible(false);
        }

        // Update main text if custom message provided
        if (customMessage) {
            this.pauseText.setText(customMessage);
        } else {
            this.pauseText.setText('GAME PAUSED');
        }

        // Show/hide stats
        this.statsText.setVisible(showStats || false);

        // Set initial alpha for fade-in
        this.setAlpha(0);
        this.setVisible(true);

        // Animate fade-in
        const transitionTime = this.config.get('pause.overlay.transitionTime') || 300;
        this.fadeInTween = this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: transitionTime,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.fadeInTween = undefined;
            }
        });
    }

    /**
     * Hide the pause overlay
     */
    public hide(): void {
        if (!this.isVisible) {
            return; // Already hidden
        }

        this.isVisible = false;

        // Stop any existing fade in tween
        if (this.fadeInTween) {
            this.fadeInTween.stop();
            this.fadeInTween = undefined;
        }

        // Animate fade-out
        const transitionTime = this.config.get('pause.overlay.transitionTime') || 300;
        this.fadeOutTween = this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: transitionTime,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.fadeOutTween = undefined;
            }
        });
    }

    /**
     * Update stats display (for debugging)
     * @param stats Pause statistics to display
     */
    public updateStats(stats: {
        isPaused: boolean;
        totalPausedTime: number;
        currentPauseDuration: number;
        systemCount: number;
        pauseReason: string;
    }): void {
        if (!this.statsText.visible) {
            return;
        }

        const statsLines = [
            `Systems: ${stats.systemCount}`,
            `Total Paused: ${Math.round(stats.totalPausedTime / 1000)}s`,
            `Current: ${Math.round(stats.currentPauseDuration / 1000)}s`,
            `Reason: ${stats.pauseReason}`
        ];

        this.statsText.setText(statsLines.join('\n'));
    }

    /**
     * Toggle stats visibility
     */
    public toggleStats(): void {
        this.statsText.setVisible(!this.statsText.visible);
    }

    /**
     * Check if overlay is currently visible
     */
    public getVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Update overlay for dynamic screen size
     */
    public updateLayout(): void {
        const { width, height } = this.scene.game.config;
        const gameWidth = typeof width === 'number' ? width : 1024;
        const gameHeight = typeof height === 'number' ? height : 768;

        // Update background size and position
        this.background.setSize(gameWidth, gameHeight);
        this.background.setPosition(gameWidth / 2, gameHeight / 2);

        // Update text positions
        this.pauseText.setPosition(gameWidth / 2, gameHeight / 2 - 80);
        this.instructionText.setPosition(gameWidth / 2, gameHeight / 2 + 20);
        this.reasonText.setPosition(gameWidth / 2, gameHeight / 2 - 120);
        this.statsText.setPosition(gameWidth / 2, gameHeight / 2 + 120);
    }

    /**
     * Clean up and destroy the overlay
     */
    public destroy(): void {
        // Stop any running tweens
        if (this.fadeInTween) {
            this.fadeInTween.stop();
        }
        if (this.fadeOutTween) {
            this.fadeOutTween.stop();
        }

        // Destroy all child elements
        this.removeAll(true);

        // Call parent destroy
        super.destroy();
    }
}