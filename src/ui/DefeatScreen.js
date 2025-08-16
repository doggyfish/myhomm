/**
 * DefeatScreen - Defeat screen UI with game review and restart options
 * Shows defeat message and provides options for learning and recovery
 */

export class DefeatScreen extends Phaser.GameObjects.Container {
    constructor(scene, endGameData, endGameManager) {
        super(scene);
        this.endGameData = endGameData;
        this.endGameManager = endGameManager;
        this.isVisible = false;
        
        this.createDefeatElements();
        this.setupInputHandlers();
        
        // Set initial position and depth
        this.setPosition(scene.scale.width / 2, scene.scale.height / 2);
        this.setDepth(2000);
    }

    createDefeatElements() {
        // Semi-transparent background overlay
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        const background = this.scene.add.rectangle(
            -screenWidth / 2, -screenHeight / 2, 
            screenWidth, screenHeight, 
            0x000000, 0.85
        );
        
        // Defeat panel with red accent
        const panelWidth = Math.min(800, screenWidth * 0.9);
        const panelHeight = Math.min(600, screenHeight * 0.8);
        
        const panel = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.95);
        panel.setStrokeStyle(4, 0xFF6B6B);
        
        // Defeat title
        const defeatTitle = this.scene.add.text(0, -panelHeight / 2 + 60, 'DEFEAT', {
            fontSize: '64px',
            fill: '#FF6B6B',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Subtitle with defeat reason
        const defeatReason = this.scene.add.text(0, -panelHeight / 2 + 120, 
            this.getDefeatReasonText(), {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
        
        // Game analysis section
        const analysisContainer = this.createGameAnalysis(panelWidth - 80, panelHeight - 300);
        analysisContainer.setPosition(0, -50);
        
        // Action buttons
        const buttonsContainer = this.createActionButtons();
        buttonsContainer.setPosition(0, panelHeight / 2 - 80);
        
        // Add all elements to container
        this.add([
            background, 
            panel, 
            defeatTitle, 
            defeatReason, 
            analysisContainer, 
            buttonsContainer
        ]);
        
        // Initially hidden for entrance animation
        this.setAlpha(0);
    }

    getDefeatReasonText() {
        const reason = this.endGameData.reason;
        const winner = this.endGameData.winner;
        
        switch (reason) {
            case 'castle_elimination':
                return winner ? 
                    `${winner.name} destroyed your castle and claimed victory!` :
                    'All players were eliminated in a final battle!';
            case 'economic':
                return `${winner.name} achieved economic victory through superior resource management!`;
            case 'time_limit':
                return `${winner.name} held the strategic advantage when time expired!`;
            default:
                return winner ? 
                    `${winner.name} outmaneuvered you and achieved victory!` :
                    'The game ended without a clear victor!';
        }
    }

    createGameAnalysis(maxWidth, maxHeight) {
        const container = this.scene.add.container(0, 0);
        const summary = this.endGameData.summary;
        
        // Analysis title
        const analysisTitle = this.scene.add.text(0, -maxHeight / 2 + 20, 'Battle Analysis', {
            fontSize: '28px',
            fill: '#FF6B6B',
            fontFamily: 'Arial Bold'
        }).setOrigin(0.5);
        
        // Create analysis sections
        const leftColumn = this.createAnalysisColumn('performance', summary, maxWidth / 2 - 40);
        const rightColumn = this.createAnalysisColumn('lessons', summary, maxWidth / 2 - 40);
        
        leftColumn.setPosition(-maxWidth / 4, 20);
        rightColumn.setPosition(maxWidth / 4, 20);
        
        // Final standings
        const standings = this.createFinalStandings(summary.players, maxWidth - 40);
        standings.setPosition(0, maxHeight / 2 - 120);
        
        container.add([analysisTitle, leftColumn, rightColumn, standings]);
        return container;
    }

    createAnalysisColumn(type, summary, columnWidth) {
        const container = this.scene.add.container(0, 0);
        
        if (type === 'performance') {
            // Performance metrics
            const humanPlayer = summary.players.find(p => p.name === 'Player'); // Assuming human player name
            const performanceStats = [
                `Your Performance:`,
                `Duration Survived: ${summary.formatDuration()}`,
                `Battles Fought: ${summary.totalBattles}`,
                `Final Gold: ${humanPlayer?.finalResources.gold || 0}`,
                `Buildings Built: ${humanPlayer?.buildingsConstructed || 0}`,
                `Armies Created: ${humanPlayer?.armiesCreated || 0}`
            ];
            
            performanceStats.forEach((stat, index) => {
                const color = index === 0 ? '#FFD700' : '#FFFFFF';
                const fontSize = index === 0 ? '20px' : '16px';
                
                const text = this.scene.add.text(0, index * 22, stat, {
                    fontSize: fontSize,
                    fill: color,
                    fontFamily: index === 0 ? 'Arial Bold' : 'Arial'
                }).setOrigin(0.5, 0);
                container.add(text);
            });
        } else {
            // Strategic lessons
            const lessons = this.generateStrategicLessons(summary);
            
            lessons.forEach((lesson, index) => {
                const color = index === 0 ? '#FFD700' : '#CCCCCC';
                const fontSize = index === 0 ? '20px' : '16px';
                
                const text = this.scene.add.text(0, index * 22, lesson, {
                    fontSize: fontSize,
                    fill: color,
                    fontFamily: index === 0 ? 'Arial Bold' : 'Arial',
                    wordWrap: { width: columnWidth - 20 }
                }).setOrigin(0.5, 0);
                container.add(text);
            });
        }
        
        return container;
    }

    generateStrategicLessons(summary) {
        const lessons = ['Strategic Insights:'];
        const winner = this.endGameData.winner;
        
        if (winner) {
            const winnerStats = summary.players.find(p => p.id === winner.id);
            const humanPlayer = summary.players.find(p => p.name === 'Player');
            
            if (winnerStats && humanPlayer) {
                // Compare resources
                if (winnerStats.finalResources.gold > humanPlayer.finalResources.gold * 1.5) {
                    lessons.push('• Focus on economic development');
                    lessons.push('• Build more resource buildings');
                }
                
                // Compare military
                if (winnerStats.armiesCreated > humanPlayer.armiesCreated) {
                    lessons.push('• Increase military production');
                    lessons.push('• Balance offense and defense');
                }
                
                // Compare expansion
                if (winnerStats.buildingsConstructed > humanPlayer.buildingsConstructed) {
                    lessons.push('• Expand your infrastructure');
                    lessons.push('• Utilize all building slots');
                }
            }
        }
        
        // Add general tips if no specific lessons
        if (lessons.length === 1) {
            lessons.push('• Scout enemy positions early');
            lessons.push('• Defend your castle');
            lessons.push('• Manage resources carefully');
            lessons.push('• Strike when advantage is clear');
        }
        
        return lessons;
    }

    createFinalStandings(players, tableWidth) {
        const container = this.scene.add.container(0, 0);
        
        // Sort players by final score (alive first, then by resources)
        const sortedPlayers = [...players].sort((a, b) => {
            if (a.isAlive !== b.isAlive) return b.isAlive - a.isAlive;
            return b.finalResources.gold - a.finalResources.gold;
        });
        
        // Table header
        const headerText = this.scene.add.text(0, -40, 'Final Standings', {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial Bold'
        }).setOrigin(0.5);
        
        // Player rankings
        sortedPlayers.forEach((player, index) => {
            const y = index * 22;
            const rank = index + 1;
            const statusColor = player.isAlive ? '#00FF00' : '#FF6B6B';
            const rankColor = rank === 1 ? '#FFD700' : '#FFFFFF';
            
            const rankingText = this.scene.add.text(0, y, 
                `${rank}. ${player.name} - ${player.isAlive ? 'Victor' : 'Eliminated'} (${player.finalResources.gold} gold)`, {
                fontSize: '16px',
                fill: rank === 1 ? rankColor : statusColor,
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0);
            
            container.add(rankingText);
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
        
        // Try again button (primary action)
        const retryButton = this.scene.add.text(-120, 0, 'Try Again', {
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
        
        // Review game button (for detailed analysis)
        const reviewButton = this.scene.add.text(0, 50, 'Review Battle (ESC)', {
            fontSize: '18px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        // Encouragement text
        const encouragementText = this.scene.add.text(0, 85, 
            'Every defeat is a lesson. Strike back stronger!', {
            fontSize: '16px',
            fill: '#FFD700',
            fontFamily: 'Arial Italic',
            alpha: 0.8
        }).setOrigin(0.5);
        
        // Button hover effects
        [retryButton, menuButton, reviewButton].forEach(button => {
            button.on('pointerover', () => {
                button.setScale(1.1);
                this.scene.sound.play('ui_hover', { volume: 0.3 });
            });
            
            button.on('pointerout', () => {
                button.setScale(1.0);
            });
        });
        
        // Button click handlers
        retryButton.on('pointerdown', () => {
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
        
        container.add([retryButton, menuButton, reviewButton, encouragementText]);
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
        
        // Entrance animation with somber tone
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.9, to: 1 },
            duration: 600,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // Play defeat sound
                this.scene.sound.play('defeat_theme', { volume: 0.6 });
                
                // Add subtle visual effects
                this.addDefeatEffects();
            }
        });
    }

    hide() {
        if (!this.isVisible) return;
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.9,
            duration: 400,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.isVisible = false;
            }
        });
    }

    addDefeatEffects() {
        // Add subtle red particle effects to reinforce defeat theme
        const emitter = this.scene.add.particles(0, -200, 'particle_red', {
            scale: { start: 0.2, end: 0 },
            speed: { min: 20, max: 80 },
            lifespan: 3000,
            frequency: 100,
            alpha: { start: 0.6, end: 0 },
            emitZone: { type: 'edge', source: new Phaser.Geom.Rectangle(-150, -30, 300, 60) }
        });
        
        emitter.setDepth(2001);
        this.add(emitter);
        
        // Stop particles after 4 seconds
        this.scene.time.delayedCall(4000, () => {
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