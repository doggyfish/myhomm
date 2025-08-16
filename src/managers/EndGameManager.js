/**
 * EndGameManager - Manages end game state transitions and screen coordination
 * Handles victory/defeat screen display and game state cleanup
 */

import { VICTORY_EVENTS } from '../events/VictoryEvents.js';

export class EndGameManager {
    constructor(scene, victorySystem, gameState) {
        this.scene = scene;
        this.victorySystem = victorySystem;
        this.gameState = gameState;
        this.endGameState = null;
        this.currentScreen = null;
        this.isEndGameActive = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.victorySystem.on(VICTORY_EVENTS.GAME_ENDED, this.handleGameEnd.bind(this));
        this.victorySystem.on(VICTORY_EVENTS.PLAYER_ELIMINATED, this.handlePlayerEliminated.bind(this));
    }

    handleGameEnd(endGameData) {
        if (this.isEndGameActive) return; // Prevent multiple end game triggers
        
        this.isEndGameActive = true;
        this.endGameState = endGameData;
        
        // Pause the game to prevent further state changes
        this.gameState.pause('game_ended');
        
        // Determine which screen to show
        const humanPlayer = this.gameState.players.find(p => !p.isAI);
        const isVictory = endGameData.winner === humanPlayer;
        
        // Delay screen show slightly to ensure game state is stable
        setTimeout(() => {
            if (isVictory) {
                this.showVictoryScreen(endGameData);
            } else {
                this.showDefeatScreen(endGameData);
            }
        }, 100);
    }

    handlePlayerEliminated(eliminationData) {
        const { player, destroyer } = eliminationData;
        
        // Show elimination notification for non-human players
        const humanPlayer = this.gameState.players.find(p => !p.isAI);
        if (player !== humanPlayer) {
            this.showPlayerEliminatedNotification(player, destroyer);
        }
    }

    showVictoryScreen(endGameData) {
        if (this.currentScreen) {
            this.currentScreen.destroy();
        }
        
        // Import VictoryScreen dynamically to avoid circular dependencies
        import('../ui/VictoryScreen.js').then(({ VictoryScreen }) => {
            this.currentScreen = new VictoryScreen(this.scene, endGameData, this);
            this.scene.add.existing(this.currentScreen);
            this.currentScreen.show();
        }).catch(error => {
            console.error('Failed to load VictoryScreen:', error);
            this.showFallbackEndGameMessage('Victory!', endGameData);
        });
    }

    showDefeatScreen(endGameData) {
        if (this.currentScreen) {
            this.currentScreen.destroy();
        }
        
        // Import DefeatScreen dynamically to avoid circular dependencies
        import('../ui/DefeatScreen.js').then(({ DefeatScreen }) => {
            this.currentScreen = new DefeatScreen(this.scene, endGameData, this);
            this.scene.add.existing(this.currentScreen);
            this.currentScreen.show();
        }).catch(error => {
            console.error('Failed to load DefeatScreen:', error);
            this.showFallbackEndGameMessage('Defeat', endGameData);
        });
    }

    showPlayerEliminatedNotification(player, destroyer) {
        // Create a temporary notification for player elimination
        const notification = this.scene.add.container(
            this.scene.scale.width / 2,
            100
        );
        
        const background = this.scene.add.rectangle(0, 0, 400, 80, 0x000000, 0.8);
        const text = this.scene.add.text(0, 0, 
            `${player.name} has been eliminated by ${destroyer?.name || 'unknown'}!`, {
            fontSize: '18px',
            fill: '#FF6B6B',
            align: 'center',
            wordWrap: { width: 380 }
        }).setOrigin(0.5);
        
        notification.add([background, text]);
        notification.setDepth(1000);
        
        // Auto-hide after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            notification.destroy();
        });
    }

    showFallbackEndGameMessage(title, endGameData) {
        // Simple fallback message if UI screens fail to load
        const message = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );
        
        const background = this.scene.add.rectangle(0, 0, 600, 400, 0x000000, 0.9);
        const titleText = this.scene.add.text(0, -100, title, {
            fontSize: '48px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        const summaryText = this.scene.add.text(0, 0, 
            this.generateFallbackSummary(endGameData), {
            fontSize: '20px',
            fill: '#FFFFFF',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        const restartButton = this.scene.add.text(0, 150, 'Press SPACE to restart', {
            fontSize: '24px',
            fill: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        message.add([background, titleText, summaryText, restartButton]);
        message.setDepth(2000);
        
        this.currentScreen = message;
        
        // Handle restart input
        this.scene.input.keyboard.once('keydown-SPACE', () => {
            this.restartGame();
        });
    }

    generateFallbackSummary(endGameData) {
        const summary = endGameData.summary;
        return [
            `Winner: ${endGameData.winner?.name || 'None'}`,
            `Duration: ${summary.formatDuration()}`,
            `Total Battles: ${summary.totalBattles}`,
            `Victory Type: ${endGameData.reason.replace('_', ' ').toUpperCase()}`
        ].join('\n');
    }

    restartGame() {
        // Clean up current screen
        if (this.currentScreen) {
            this.currentScreen.destroy();
            this.currentScreen = null;
        }
        
        // Reset end game state
        this.isEndGameActive = false;
        this.endGameState = null;
        
        // Emit restart event for scene handling
        this.scene.events.emit('endgame:restart-requested');
    }

    returnToMainMenu() {
        // Clean up current screen
        if (this.currentScreen) {
            this.currentScreen.destroy();
            this.currentScreen = null;
        }
        
        // Reset end game state
        this.isEndGameActive = false;
        this.endGameState = null;
        
        // Emit main menu event for scene handling
        this.scene.events.emit('endgame:mainmenu-requested');
    }

    pauseForReview() {
        // Ensure game remains paused for strategic review
        this.gameState.pause('end_game_review');
        
        // Hide current screen temporarily
        if (this.currentScreen) {
            this.currentScreen.setVisible(false);
        }
    }

    resumeEndGameScreen() {
        // Show end game screen again after review
        if (this.currentScreen) {
            this.currentScreen.setVisible(true);
        }
    }

    getEndGameState() {
        return {
            isActive: this.isEndGameActive,
            endGameData: this.endGameState,
            hasScreen: this.currentScreen !== null
        };
    }

    cleanup() {
        // Clean up event listeners
        this.victorySystem.off(VICTORY_EVENTS.GAME_ENDED, this.handleGameEnd.bind(this));
        this.victorySystem.off(VICTORY_EVENTS.PLAYER_ELIMINATED, this.handlePlayerEliminated.bind(this));
        
        // Destroy current screen
        if (this.currentScreen) {
            this.currentScreen.destroy();
            this.currentScreen = null;
        }
        
        this.isEndGameActive = false;
        this.endGameState = null;
    }
}