import { CONFIG } from '../config/ConfigurationManager.js';

export class GameStateManager {
    constructor(config = {}) {
        this.config = config;
        this.players = [];
        this.entities = new Map();
        this.currentTick = 0;
        this.gameSpeed = CONFIG.get('time.baseGameSpeed');
        this.isPaused = false;
        this.winner = null;
        this.pausedSystems = null;
        this.gameStartTime = Date.now();
    }
    
    update(delta) {
        if (this.isPaused) {
            return; // Skip all updates when paused
        }
        
        // Apply game speed modifier
        const adjustedDelta = delta * this.gameSpeed;
        
        // Update game tick
        this.currentTick += adjustedDelta;
        
        // Process resource generation for alive players
        this.players.forEach(player => {
            if (player.isAlive) {
                player.resourceManager.update(adjustedDelta);
            }
        });
        
        // Update entities
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(adjustedDelta);
            }
        });
        
        // Check victory conditions
        this.checkVictoryConditions();
    }
    
    pause() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        
        // Store state of time-sensitive systems
        this.pausedSystems = {
            magicSystemTime: this.magicSystem?.lastSelectionTime,
            productionQueues: new Map(),
            movingArmies: [],
            pauseTime: Date.now()
        };
        
        // Freeze all active moving entities
        this.entities.forEach(entity => {
            if (entity.type === 'army') {
                const movement = entity.getComponent('movement');
                if (movement?.isMoving) {
                    this.pausedSystems.movingArmies.push({
                        entity: entity,
                        progress: movement.movementProgress
                    });
                }
            }
        });
    }
    
    unpause() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        
        // Restore time-sensitive systems
        if (this.pausedSystems) {
            if (this.magicSystem) {
                this.magicSystem.lastSelectionTime = this.pausedSystems.magicSystemTime;
            }
            
            // Restore movement progress
            this.pausedSystems.movingArmies.forEach(({ entity, progress }) => {
                const movement = entity.getComponent('movement');
                if (movement) {
                    movement.movementProgress = progress;
                }
            });
        }
        
        this.pausedSystems = null;
    }
    
    addPlayer(player) {
        if (!this.players.find(p => p.id === player.id)) {
            this.players.push(player);
        }
    }
    
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }
    
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    getAlivePlayers() {
        return this.players.filter(p => p.isAlive);
    }
    
    addEntity(entity) {
        this.entities.set(entity.id, entity);
    }
    
    removeEntity(entityId) {
        return this.entities.delete(entityId);
    }
    
    getEntity(entityId) {
        return this.entities.get(entityId);
    }
    
    getEntitiesByType(type) {
        return Array.from(this.entities.values()).filter(entity => entity.type === type);
    }
    
    getEntitiesByOwner(ownerId) {
        return Array.from(this.entities.values()).filter(entity => entity.owner === ownerId);
    }
    
    checkVictoryConditions() {
        if (this.winner) return; // Game already won
        
        const alivePlayers = this.getAlivePlayers();
        
        // Check castle elimination victory
        alivePlayers.forEach(player => {
            const playerCastles = this.getEntitiesByOwner(player.id)
                .filter(entity => entity.type === 'castle');
            
            if (playerCastles.length === 0) {
                player.isAlive = false;
            }
        });
        
        // Recheck alive players after elimination
        const remainingPlayers = this.getAlivePlayers();
        
        if (remainingPlayers.length === 1) {
            this.winner = remainingPlayers[0];
        } else if (remainingPlayers.length === 0) {
            this.winner = 'draw'; // All players eliminated simultaneously
        }
        
        // Check economic victory
        remainingPlayers.forEach(player => {
            const resources = player.resourceManager.resources;
            const economicGoal = CONFIG.get('resources.economicVictory');
            
            if (resources.gold >= economicGoal.gold &&
                resources.mercury >= economicGoal.rareResourceAmount &&
                resources.sulfur >= economicGoal.rareResourceAmount &&
                resources.crystal >= economicGoal.rareResourceAmount) {
                this.winner = player;
            }
        });
    }
    
    isGameOver() {
        return this.winner !== null;
    }
    
    getGameDuration() {
        return Date.now() - this.gameStartTime;
    }
    
    setGameSpeed(speed) {
        this.gameSpeed = Math.max(0.1, Math.min(5.0, speed));
    }
    
    reset() {
        this.players = [];
        this.entities.clear();
        this.currentTick = 0;
        this.gameSpeed = CONFIG.get('time.baseGameSpeed');
        this.isPaused = false;
        this.winner = null;
        this.pausedSystems = null;
        this.gameStartTime = Date.now();
    }
}