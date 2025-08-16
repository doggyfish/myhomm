/**
 * VictoryScreen - Victory screen UI with comprehensive game summary display
 * Shows victory celebration and detailed game statistics
 */

export class VictoryScreen extends Phaser.GameObjects.Container {
    constructor(scene, endGameData, endGameManager) {
        super(scene);
        this.endGameData = endGameData;
        this.endGameManager = endGameManager;
        this.isVisible = false;
        
        this.createVictoryElements();
        this.setupInputHandlers();
        
        // Set initial position and depth
        this.setPosition(scene.scale.width / 2, scene.scale.height / 2);
        this.setDepth(2000);
    }

    createVictoryElements() {
        // Semi-transparent background overlay
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        const background = this.scene.add.rectangle(
            -screenWidth / 2, -screenHeight / 2, 
            screenWidth, screenHeight, 
            0x000000, 0.85
        );
        
        // Victory celebration panel
        const panelWidth = Math.min(800, screenWidth * 0.9);
        const panelHeight = Math.min(600, screenHeight * 0.8);
        
        const panel = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.95);
        panel.setStrokeStyle(4, 0xFFD700);
        
        // Victory title with animation
        const victoryTitle = this.scene.add.text(0, -panelHeight / 2 + 60, 'VICTORY!', {
            fontSize: '64px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Subtitle with victory reason
        const victoryReason = this.scene.add.text(0, -panelHeight / 2 + 120, 
            this.getVictoryReasonText(), {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
        
        // Game summary section
        const summaryContainer = this.createGameSummary(panelWidth - 80, panelHeight - 300);
        summaryContainer.setPosition(0, -50);
        
        // Action buttons
        const buttonsContainer = this.createActionButtons();
        buttonsContainer.setPosition(0, panelHeight / 2 - 80);
        
        // Add all elements to container
        this.add([
            background, 
            panel, 
            victoryTitle, 
            victoryReason, 
            summaryContainer, 
            buttonsContainer
        ]);
        
        // Initially hidden for entrance animation
        this.setAlpha(0);
    }

    getVictoryReasonText() {
        const reason = this.endGameData.reason;
        const winner = this.endGameData.winner;
        
        switch (reason) {
            case 'castle_elimination':
                return `${winner.name} conquered all enemy castles!`;
            case 'economic':
                return `${winner.name} achieved economic dominance!`;
            case 'time_limit':
                return `${winner.name} led at the time limit!`;
            default:
                return `${winner.name} achieved victory!`;
        }
    }

    createGameSummary(maxWidth, maxHeight) {
        const container = this.scene.add.container(0, 0);
        const summary = this.endGameData.summary;
        
        // Summary title
        const summaryTitle = this.scene.add.text(0, -maxHeight / 2 + 20, 'Game Summary', {
            fontSize: '28px',
            fill: '#FFD700',
            fontFamily: 'Arial Bold'
        }).setOrigin(0.5);
        
        // Create two columns for statistics
        const leftColumn = this.createSummaryColumn('left', summary, maxWidth / 2 - 40);
        const rightColumn = this.createSummaryColumn('right', summary, maxWidth / 2 - 40);
        
        leftColumn.setPosition(-maxWidth / 4, 20);
        rightColumn.setPosition(maxWidth / 4, 20);
        
        // Player statistics table
        const playerStats = this.createPlayerStatsTable(summary.players, maxWidth - 40);
        playerStats.setPosition(0, maxHeight / 2 - 120);
        
        container.add([summaryTitle, leftColumn, rightColumn, playerStats]);
        return container;
    }

    createSummaryColumn(side, summary, columnWidth) {
        const container = this.scene.add.container(0, 0);
        
        if (side === 'left') {
            const leftStats = [
                `Duration: ${summary.formatDuration()}`,
                `Total Battles: ${summary.totalBattles}`,
                `Victory Type: ${this.endGameData.reason.replace('_', ' ').toUpperCase()}`,
                `Castles Remaining: ${summary.finalMap.castlesRemaining}`,
                `Armies Remaining: ${summary.finalMap.armiesRemaining}`
            ];
            
            leftStats.forEach((stat, index) => {
                const text = this.scene.add.text(0, index * 25, stat, {
                    fontSize: '18px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial'
                }).setOrigin(0.5, 0);
                container.add(text);
            });
        } else {
            // Right column - resource statistics
            const winner = this.endGameData.winner;
            if (winner) {
                const resources = winner.resourceManager?.resources || {};
                const rightStats = [
                    `Winner: ${winner.name}`,
                    `Faction: ${winner.faction || 'Unknown'}`,
                    `Final Gold: ${resources.gold || 0}`,
                    `Final Wood: ${resources.wood || 0}`,
                    `Final Stone: ${resources.stone || 0}`
                ];
                
                rightStats.forEach((stat, index) => {
                    const text = this.scene.add.text(0, index * 25, stat, {
                        fontSize: '18px',
                        fill: '#FFFFFF',
                        fontFamily: 'Arial'
                    }).setOrigin(0.5, 0);
                    container.add(text);
                });
            }
        }
        
        return container;
    }

    createPlayerStatsTable(players, tableWidth) {
        const container = this.scene.add.container(0, 0);
        
        // Table header
        const headerText = this.scene.add.text(0, -40, 'Final Player Rankings', {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial Bold'
        }).setOrigin(0.5);
        
        // Player rows
        players.forEach((player, index) => {
            const y = index * 25;
            const statusColor = player.isAlive ? '#00FF00' : '#FF6B6B';
            const statusText = player.isAlive ? 'Alive' : 'Eliminated';
            
            const playerRow = this.scene.add.text(0, y, 
                `${player.name} (${player.faction}): ${statusText} - Gold: ${player.finalResources.gold}`, {
                fontSize: '16px',
                fill: statusColor,
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0);
            
            container.add(playerRow);
        });
        
        container.add(headerText);
        return container;
    }

    createActionButtons() {
        const container = this.scene.add.container(0, 0);
        
        // Button styling
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: 'Arial Bold',
            padding: { x: 20, y: 10 }
        };
        
        // Restart button
        const restartButton = this.scene.add.text(-120, 0, 'Play Again', {
            ...buttonStyle,
            fill: '#FFD700',
            backgroundColor: '#2a2a2a'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        // Main menu button
        const menuButton = this.scene.add.text(120, 0, 'Main Menu', {
            ...buttonStyle,
            fill: '#FFFFFF',
            backgroundColor: '#2a2a2a'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        // Review button (for pause system integration)
        const reviewButton = this.scene.add.text(0, 50, 'Review Game (ESC)', {
            fontSize: '18px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        // Button hover effects
        [restartButton, menuButton, reviewButton].forEach(button => {
            button.on('pointerover', () => {
                button.setScale(1.1);
                this.scene.sound.play('ui_hover', { volume: 0.3 });
            });
            
            button.on('pointerout', () => {
                button.setScale(1.0);
            });
        });
        
        // Button click handlers
        restartButton.on('pointerdown', () => {
            this.scene.sound.play('ui_click', { volume: 0.5 });
            this.endGameManager.restartGame();
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.sound.play('ui_click', { volume: 0.5 });
            this.endGameManager.returnToMainMenu();
        });
        
        reviewButton.on('pointerdown', () => {
            this.scene.sound.play('ui_click', { volume: 0.5 });
            this.endGameManager.pauseForReview();
        });
        
        container.add([restartButton, menuButton, reviewButton]);
        return container;
    }

    setupInputHandlers() {
        // Keyboard shortcuts
        this.scene.input.keyboard.on('keydown-ESC', () => {
            this.endGameManager.pauseForReview();
        });
        
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            this.endGameManager.restartGame();
        });
        
        this.scene.input.keyboard.on('keydown-ENTER', () => {
            this.endGameManager.returnToMainMenu();
        });
    }

    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.setVisible(true);
        
        // Entrance animation
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.8, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Play victory sound
                this.scene.sound.play('victory_fanfare', { volume: 0.7 });
                
                // Add particle effects or screen flash
                this.addCelebrationEffects();
            }
        });
    }

    hide() {
        if (!this.isVisible) return;
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.8,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.isVisible = false;
            }
        });
    }

    addCelebrationEffects() {
        // Add golden particle effects around the victory title
        const emitter = this.scene.add.particles(0, -200, 'particle_gold', {
            scale: { start: 0.3, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 2000,
            frequency: 50,
            emitZone: { type: 'edge', source: new Phaser.Geom.Rectangle(-100, -20, 200, 40) }
        });
        
        emitter.setDepth(2001);
        this.add(emitter);
        
        // Stop particles after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            emitter.stop();
        });
    }

    destroy() {
        // Clean up input handlers
        this.scene.input.keyboard.off('keydown-ESC');
        this.scene.input.keyboard.off('keydown-SPACE');
        this.scene.input.keyboard.off('keydown-ENTER');
        
        // Call parent destroy
        super.destroy();
    }
}