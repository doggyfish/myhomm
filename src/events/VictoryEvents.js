/**
 * Victory-related event definitions and interfaces
 * Handles event communication for victory detection and end game states
 */

/**
 * Victory condition data structure for tracking game ending conditions
 */
export class VictoryCondition {
    constructor(type, playerIds, description) {
        this.type = type; // 'castle_elimination', 'economic', 'time_limit'
        this.playerIds = playerIds; // Array of player IDs affected
        this.description = description;
        this.timestamp = Date.now();
    }
}

/**
 * Comprehensive game summary for end game display
 */
export class GameSummary {
    constructor(gameState) {
        this.duration = Date.now() - gameState.gameStartTime;
        this.winner = gameState.winner;
        this.players = this.generatePlayerSummary(gameState.players);
        this.totalBattles = gameState.battleCount || 0;
        this.finalMap = this.captureMapState(gameState);
    }

    generatePlayerSummary(players) {
        return players.map(player => ({
            id: player.id,
            name: player.name,
            faction: player.faction,
            isAlive: player.isAlive,
            finalResources: { ...player.resourceManager.resources },
            armiesCreated: player.armiesCreated || 0,
            buildingsConstructed: player.buildingsConstructed || 0,
            battlesWon: player.battlesWon || 0
        }));
    }

    captureMapState(gameState) {
        return {
            castlesRemaining: gameState.getEntitiesByType('castle').length,
            armiesRemaining: gameState.getEntitiesByType('army').length,
            controlledTerritory: this.calculateControlledTerritory(gameState)
        };
    }

    calculateControlledTerritory(gameState) {
        // Calculate territory control based on castle positions and influence
        const castles = gameState.getEntitiesByType('castle');
        const territoryMap = new Map();
        
        gameState.players.forEach(player => {
            const playerCastles = castles.filter(castle => castle.owner === player);
            territoryMap.set(player.id, playerCastles.length);
        });
        
        return territoryMap;
    }

    formatDuration() {
        const minutes = Math.floor(this.duration / 60000);
        const seconds = Math.floor((this.duration % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/**
 * Victory event type constants
 */
export const VICTORY_EVENTS = {
    VICTORY_DETECTED: 'victory:detected',
    GAME_ENDED: 'game:ended',
    PLAYER_ELIMINATED: 'player:eliminated',
    ENDGAME_RESTART_REQUESTED: 'endgame:restart-requested',
    CASTLE_DESTROYED: 'castle:destroyed',
    PLAYER_RESOURCE_CHANGED: 'player:resource-changed'
};

/**
 * Victory event data factory
 */
export class VictoryEventFactory {
    static createVictoryDetected(condition, summary) {
        return {
            type: VICTORY_EVENTS.VICTORY_DETECTED,
            condition,
            summary,
            timestamp: Date.now()
        };
    }

    static createGameEnded(winner, reason, summary) {
        return {
            type: VICTORY_EVENTS.GAME_ENDED,
            winner,
            reason,
            summary,
            timestamp: Date.now()
        };
    }

    static createPlayerEliminated(player, destroyer) {
        return {
            type: VICTORY_EVENTS.PLAYER_ELIMINATED,
            player,
            destroyer,
            timestamp: Date.now()
        };
    }

    static createCastleDestroyed(castle, destroyer) {
        return {
            type: VICTORY_EVENTS.CASTLE_DESTROYED,
            castle,
            destroyer,
            timestamp: Date.now()
        };
    }
}