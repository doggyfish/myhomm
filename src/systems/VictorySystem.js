/**
 * VictorySystem - Core victory condition monitoring and detection logic
 * Handles real-time victory detection with event-driven architecture
 */

import { VictoryCondition, GameSummary, VictoryEventFactory, VICTORY_EVENTS } from '../events/VictoryEvents.js';

export class VictorySystem extends Phaser.Events.EventEmitter {
    constructor(config, gameState) {
        super();
        this.config = config;
        this.gameState = gameState;
        this.victoryConditions = new Map();
        this.isGameEnded = false;
        this.endGameReason = null;
        this.lastVictoryCheck = 0;
        this.victoryCheckInterval = this.config.get('victory.checkIntervalMs') || 100;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for castle destruction events
        this.gameState.on(VICTORY_EVENTS.CASTLE_DESTROYED, this.onCastleDestroyed.bind(this));
        
        // Listen for resource changes if economic victory is enabled
        if (this.config.get('victory.economicVictoryEnabled')) {
            this.gameState.on(VICTORY_EVENTS.PLAYER_RESOURCE_CHANGED, this.onResourceChanged.bind(this));
        }
    }

    update(deltaTime) {
        if (this.isGameEnded || this.gameState.isPaused) {
            return;
        }

        // Throttle victory checks for performance
        this.lastVictoryCheck += deltaTime;
        if (this.lastVictoryCheck < this.victoryCheckInterval) {
            return;
        }
        this.lastVictoryCheck = 0;

        // Check for castle elimination victory
        this.checkCastleElimination();
        
        // Check for economic victory (if enabled)
        if (this.config.get('victory.economicVictoryEnabled')) {
            this.checkEconomicVictory();
        }
        
        // Check for time limit victory (if enabled)
        if (this.config.get('victory.timeLimitEnabled')) {
            this.checkTimeLimit();
        }
    }

    checkCastleElimination() {
        const alivePlayers = this.gameState.players.filter(player => player.isAlive);
        
        if (alivePlayers.length <= 1) {
            const winner = alivePlayers.length === 1 ? alivePlayers[0] : null;
            this.triggerVictory('castle_elimination', winner);
        }
    }

    checkEconomicVictory() {
        const economicTarget = {
            gold: this.config.get('victory.economicTarget.gold'),
            mercury: this.config.get('victory.economicTarget.rareResourceAmount'),
            sulfur: this.config.get('victory.economicTarget.rareResourceAmount'),
            crystal: this.config.get('victory.economicTarget.rareResourceAmount')
        };
        
        for (const player of this.gameState.players) {
            if (player.isAlive && this.hasEconomicVictory(player, economicTarget)) {
                this.triggerVictory('economic', player);
                break;
            }
        }
    }

    hasEconomicVictory(player, target) {
        const resources = player.resourceManager.resources;
        return resources.gold >= target.gold &&
               resources.mercury >= target.mercury &&
               resources.sulfur >= target.sulfur &&
               resources.crystal >= target.crystal;
    }

    checkTimeLimit() {
        const timeLimit = this.config.get('victory.timeLimit');
        const currentTime = Date.now() - this.gameState.gameStartTime;
        
        if (currentTime >= timeLimit) {
            // Find player with highest score for time limit victory
            const winner = this.calculateTimeLimitWinner();
            this.triggerVictory('time_limit', winner);
        }
    }

    calculateTimeLimitWinner() {
        let highestScore = -1;
        let winner = null;
        
        this.gameState.players.forEach(player => {
            if (!player.isAlive) return;
            
            const score = this.calculatePlayerScore(player);
            if (score > highestScore) {
                highestScore = score;
                winner = player;
            }
        });
        
        return winner;
    }

    calculatePlayerScore(player) {
        const resources = player.resourceManager.resources;
        const castles = this.gameState.getEntitiesByOwner(player.id)
            .filter(entity => entity.type === 'castle').length;
        const armies = this.gameState.getEntitiesByOwner(player.id)
            .filter(entity => entity.type === 'army').length;
        
        return resources.gold + 
               (resources.mercury + resources.sulfur + resources.crystal) * 10 +
               castles * 1000 +
               armies * 100;
    }

    triggerVictory(type, winner) {
        if (this.isGameEnded) return;
        
        this.isGameEnded = true;
        this.endGameReason = type;
        this.gameState.winner = winner;
        
        const victoryCondition = new VictoryCondition(
            type, 
            winner ? [winner.id] : [], 
            this.getVictoryDescription(type, winner)
        );
        
        // Generate comprehensive game summary
        const gameSummary = new GameSummary(this.gameState);
        
        // Emit victory events
        this.emit(VICTORY_EVENTS.VICTORY_DETECTED, 
            VictoryEventFactory.createVictoryDetected(victoryCondition, gameSummary));
        this.emit(VICTORY_EVENTS.GAME_ENDED, 
            VictoryEventFactory.createGameEnded(winner, type, gameSummary));
    }

    getVictoryDescription(type, winner) {
        switch (type) {
            case 'castle_elimination':
                return winner ? 
                    `${winner.name} achieved victory by eliminating all enemy castles` :
                    'Game ended in a draw - all players eliminated';
            case 'economic':
                return `${winner.name} achieved economic victory through resource accumulation`;
            case 'time_limit':
                return winner ?
                    `${winner.name} achieved victory by highest score at time limit` :
                    'Game ended at time limit with no clear winner';
            default:
                return 'Game ended';
        }
    }

    onCastleDestroyed(eventData) {
        const { castle, destroyer } = eventData;
        const castleOwner = castle.owner;
        
        // Check if this was the player's last castle
        const remainingCastles = this.gameState.getEntitiesByOwner(castleOwner.id)
            .filter(entity => entity.type === 'castle' && entity.id !== castle.id);
        
        if (remainingCastles.length === 0) {
            castleOwner.isAlive = false;
            this.emit(VICTORY_EVENTS.PLAYER_ELIMINATED, 
                VictoryEventFactory.createPlayerEliminated(castleOwner, destroyer));
            
            // Remove all remaining armies of eliminated player
            const playerArmies = this.gameState.getEntitiesByOwner(castleOwner.id)
                .filter(entity => entity.type === 'army');
            
            playerArmies.forEach(army => {
                this.gameState.removeArmy(army.id);
            });
            
            console.log(`Player ${castleOwner.id} eliminated - no castles remaining`);
        }
    }

    onResourceChanged(eventData) {
        // Economic victory is checked in the main update loop
        // This event could be used for real-time UI updates
    }

    reset() {
        this.isGameEnded = false;
        this.endGameReason = null;
        this.victoryConditions.clear();
        this.lastVictoryCheck = 0;
    }

    getVictoryStatus() {
        return {
            isGameEnded: this.isGameEnded,
            endGameReason: this.endGameReason,
            winner: this.gameState.winner
        };
    }
}