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
        
        // Enhanced pause system integration
        this.pauseSystem = null;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.pauseReason = 'user';
        this.registeredSystems = new Set();
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
                // Update AI players
                player.updateAI(this.getGameState(), adjustedDelta);
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
    
    pause(reason = 'user') {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        this.pauseReason = reason;
        
        // Store state of time-sensitive systems
        this.pausedSystems = {
            magicSystemTime: this.magicSystem?.lastSelectionTime,
            productionQueues: new Map(),
            movingArmies: [],
            pauseTime: this.pauseStartTime,
            gameSpeed: this.gameSpeed,
            currentTick: this.currentTick
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
                
                // Pause army's pausable component if available
                const pausableComponent = entity.getComponent('pausable');
                if (pausableComponent && typeof pausableComponent.pause === 'function') {
                    pausableComponent.pause(this.pauseStartTime);
                }
            }
        });

        // Pause all registered systems
        this.registeredSystems.forEach(system => {
            try {
                if (system.pause && typeof system.pause === 'function') {
                    system.pause();
                }
            } catch (error) {
                console.error('Error pausing registered system:', error);
            }
        });

        // Notify pause system if available
        if (this.pauseSystem && this.pauseSystem.emit) {
            this.pauseSystem.emit('pause:activated', {
                reason: this.pauseReason,
                timestamp: this.pauseStartTime
            });
        }
    }
    
    unpause() {
        if (!this.isPaused) return;
        
        const pauseDuration = Date.now() - this.pauseStartTime;
        this.totalPausedTime += pauseDuration;
        const previousReason = this.pauseReason;
        
        this.isPaused = false;
        this.pauseReason = 'user';
        
        // Restore time-sensitive systems
        if (this.pausedSystems) {
            if (this.magicSystem) {
                this.magicSystem.lastSelectionTime = this.pausedSystems.magicSystemTime;
            }
            
            // Restore movement progress and unpause entities
            this.pausedSystems.movingArmies.forEach(({ entity, progress }) => {
                const movement = entity.getComponent('movement');
                if (movement) {
                    movement.movementProgress = progress;
                }
                
                // Unpause army's pausable component if available
                const pausableComponent = entity.getComponent('pausable');
                if (pausableComponent && typeof pausableComponent.unpause === 'function') {
                    pausableComponent.unpause(Date.now());
                }
            });
        }

        // Unpause all registered systems
        this.registeredSystems.forEach(system => {
            try {
                if (system.unpause && typeof system.unpause === 'function') {
                    system.unpause();
                }
            } catch (error) {
                console.error('Error unpausing registered system:', error);
            }
        });

        // Notify pause system if available
        if (this.pauseSystem && this.pauseSystem.emit) {
            this.pauseSystem.emit('pause:deactivated', {
                reason: previousReason,
                timestamp: Date.now(),
                pauseDuration: pauseDuration
            });
        }
        
        this.pausedSystems = null;
        this.pauseStartTime = 0;
    }
    
    addPlayer(player) {
        if (!this.players.find(p => p.id === player.id)) {
            this.players.push(player);
            
            // Initialize AI controller if this is an AI player
            if (player.isAI && !player.aiController) {
                this.initializeAIPlayer(player);
            }
        }
    }

    initializeAIPlayer(player, difficulty = 'medium') {
        // Import AI classes - needs to be dynamic to avoid circular imports
        import('../ai/AIController.js').then(({ AIController }) => {
            const aiController = new AIController(player, difficulty);
            player.setAIController(aiController);
        }).catch(error => {
            console.error(`Failed to initialize AI for player ${player.id}:`, error);
        });
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

    /**
     * Get all armies in the game
     * @returns {Array} Array of army entities
     */
    getAllArmies() {
        return this.getEntitiesByType('army');
    }

    /**
     * Get all castles in the game
     * @returns {Array} Array of castle entities
     */
    getAllCastles() {
        return this.getEntitiesByType('castle');
    }

    /**
     * Remove army from game state (used when army is eliminated in combat)
     * @param {string} armyId - ID of army to remove
     * @returns {boolean} True if army was removed
     */
    removeArmy(armyId) {
        const army = this.getEntity(armyId);
        if (army && army.type === 'army') {
            return this.removeEntity(armyId);
        }
        return false;
    }

    /**
     * Handle combat event - update entity states based on combat results
     * @param {CombatResult} combatResult - Result of combat resolution
     */
    handleCombatResult(combatResult) {
        // Apply losses to attacker
        if (combatResult.attackerLosses > 0) {
            const attacker = combatResult.winner === combatResult.attacker ? 
                combatResult.winner : combatResult.loser;
            
            if (attacker && attacker.type === 'army' && attacker.applyCombatLosses) {
                attacker.applyCombatLosses(combatResult.attackerLosses);
            }
        }

        // Apply losses to defender
        if (combatResult.defenderLosses > 0) {
            const defender = combatResult.winner === combatResult.defender ? 
                combatResult.winner : combatResult.loser;
            
            if (defender) {
                if (defender.type === 'army' && defender.applyCombatLosses) {
                    defender.applyCombatLosses(combatResult.defenderLosses);
                } else if (defender.type === 'castle' && defender.applySiegeDamage) {
                    defender.applySiegeDamage(combatResult.defenderLosses);
                }
            }
        }

        // Remove eliminated entities
        if (combatResult.loser) {
            if (combatResult.loser.type === 'army') {
                const combatComponent = combatResult.loser.getComponent('combat');
                if (combatComponent && combatComponent.power <= 0) {
                    this.removeArmy(combatResult.loser.id);
                }
            }
            // Note: Castles are not removed when defeated, they change ownership or become neutral
        }

        // Check for player elimination after combat
        this.checkPlayerElimination();
    }

    /**
     * Check if any players have been eliminated (no armies or castles left)
     */
    checkPlayerElimination() {
        const alivePlayers = this.getAlivePlayers();
        
        alivePlayers.forEach(player => {
            const playerArmies = this.getEntitiesByOwner(player.id).filter(e => e.type === 'army');
            const playerCastles = this.getEntitiesByOwner(player.id).filter(e => e.type === 'castle');
            
            // Player is eliminated if they have no castles (armies alone don't keep player alive)
            if (playerCastles.length === 0) {
                player.isAlive = false;
                console.log(`Player ${player.id} eliminated - no castles remaining`);
                
                // Remove all remaining armies of eliminated player
                playerArmies.forEach(army => {
                    this.removeArmy(army.id);
                });
            }
        });
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
    
    getGameState() {
        return {
            players: this.players,
            entities: this.entities,
            currentTick: this.currentTick,
            gameSpeed: this.gameSpeed,
            isPaused: this.isPaused,
            winner: this.winner,
            gameStartTime: this.gameStartTime,
            totalPausedTime: this.totalPausedTime
        };
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
        
        // Reset pause system state
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.pauseReason = 'user';
        this.registeredSystems.clear();
    }

    // Enhanced pause system integration methods

    /**
     * Set the pause system for coordination
     * @param {PauseSystem} pauseSystem - The pause system instance
     */
    setPauseSystem(pauseSystem) {
        this.pauseSystem = pauseSystem;
    }

    /**
     * Register a system for pause coordination
     * @param {Object} system - System that implements IPausableSystem interface
     * @param {string} systemId - Optional ID for the system
     */
    registerSystem(system, systemId = null) {
        if (system && typeof system.pause === 'function' && typeof system.unpause === 'function') {
            this.registeredSystems.add(system);
            
            // If currently paused, immediately pause the new system
            if (this.isPaused) {
                try {
                    system.pause();
                } catch (error) {
                    console.error('Error pausing newly registered system:', error);
                }
            }

            console.log(`Registered pausable system: ${systemId || system.constructor.name}`);
        } else {
            console.warn('Attempted to register system without required pause interface methods');
        }
    }

    /**
     * Unregister a system from pause coordination
     * @param {Object} system - System to unregister
     */
    unregisterSystem(system) {
        this.registeredSystems.delete(system);
    }

    /**
     * Get pause statistics
     * @returns {Object} Pause statistics
     */
    getPauseStats() {
        const currentTime = Date.now();
        const currentPauseDuration = this.isPaused ? currentTime - this.pauseStartTime : 0;

        return {
            isPaused: this.isPaused,
            pauseReason: this.pauseReason,
            currentPauseDuration: currentPauseDuration,
            totalPausedTime: this.totalPausedTime + currentPauseDuration,
            registeredSystemsCount: this.registeredSystems.size,
            pauseStartTime: this.pauseStartTime
        };
    }

    /**
     * Toggle pause state
     * @param {string} reason - Reason for toggling pause
     * @returns {boolean} New pause state
     */
    togglePause(reason = 'user') {
        if (this.isPaused) {
            this.unpause();
            return false;
        } else {
            this.pause(reason);
            return true;
        }
    }

    /**
     * Get adjusted game time accounting for pause duration
     * @returns {number} Game time with pause duration subtracted
     */
    getAdjustedGameTime() {
        const currentTime = Date.now();
        let adjustedTime = currentTime - this.gameStartTime - this.totalPausedTime;
        
        // If currently paused, subtract current pause duration
        if (this.isPaused) {
            adjustedTime -= currentTime - this.pauseStartTime;
        }

        return Math.max(0, adjustedTime);
    }

    /**
     * Emergency pause for critical situations
     * @param {string} emergencyReason - Specific reason for emergency pause
     */
    emergencyPause(emergencyReason = 'emergency') {
        console.warn(`Emergency pause triggered: ${emergencyReason}`);
        this.pause('emergency');
    }

    // IPausableSystem interface implementation for GameStateManager

    /**
     * Get current system state
     * @returns {Object} Current system state
     */
    getState() {
        return {
            isPaused: this.isPaused,
            pauseStartTime: this.pauseStartTime,
            totalPausedTime: this.totalPausedTime,
            pauseReason: this.pauseReason,
            currentTick: this.currentTick,
            gameSpeed: this.gameSpeed,
            playersCount: this.players.length,
            entitiesCount: this.entities.size,
            registeredSystemsCount: this.registeredSystems.size
        };
    }

    /**
     * Set system state (for restoration)
     * @param {Object} state - State to restore
     */
    setState(state) {
        if (state && typeof state === 'object') {
            this.isPaused = state.isPaused || false;
            this.pauseStartTime = state.pauseStartTime || 0;
            this.totalPausedTime = state.totalPausedTime || 0;
            this.pauseReason = state.pauseReason || 'user';
            this.currentTick = state.currentTick || this.currentTick;
            this.gameSpeed = state.gameSpeed || this.gameSpeed;
        }
    }

    /**
     * Check if the game state manager is paused
     * @returns {boolean} True if paused
     */
    isPausedState() {
        return this.isPaused;
    }
}