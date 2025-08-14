import { CONFIG } from '../config/ConfigurationManager.js';
import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';
import { Pathfinding } from './Pathfinding.js';

/**
 * System for handling army movement with terrain modifiers
 * Implements IPausableSystem for comprehensive pause support
 */
export class MovementSystem {
    constructor(mapData, gameStateManager = null, combatEngine = null) {
        this.mapData = mapData;
        this.pathfinding = new Pathfinding(mapData);
        this.movingArmies = new Map(); // armyId -> movement data
        this.gameState = gameStateManager;
        this.combatEngine = combatEngine;
        
        // Pause state management
        this.isPausedState = false;
        this.pauseStartTime = 0;
        this.pausedSystemState = null;
        this.totalPausedTime = 0;
    }
    
    /**
     * Start army movement to target position
     * @param {Army} army - The army to move
     * @param {Object} target - {x, y} target position
     * @returns {Object} Movement result with path and estimated time
     */
    startMovement(army, target) {
        const position = army.getComponent('position');
        if (!position) {
            return { success: false, reason: 'No position component' };
        }
        
        const start = { x: position.tileX, y: position.tileY };
        const path = this.pathfinding.findPath(start, target);
        
        if (path.length === 0) {
            return { success: false, reason: 'No valid path' };
        }
        
        // Remove starting position from path
        if (path.length > 1) {
            path.shift();
        }
        
        const armySpeed = army.calculateSpeed();
        const totalTime = this.calculatePathTime(path, armySpeed);
        
        // Initialize movement for the army
        const movementComponent = army.getComponent('movement');
        if (movementComponent) {
            movementComponent.startMovement(path);
        }
        
        // Store movement data
        this.movingArmies.set(army.id, {
            army,
            path,
            currentIndex: 0,
            elapsedTime: 0,
            totalTime,
            armySpeed
        });
        
        return {
            success: true,
            path,
            estimatedTime: totalTime,
            distance: path.length
        };
    }
    
    /**
     * Update all moving armies
     * @param {number} deltaTime - Time elapsed in milliseconds
     */
    update(deltaTime) {
        // Skip updates if paused
        if (this.isPausedState) {
            return;
        }

        // Apply pause time adjustment to delta
        const adjustedDelta = this.getAdjustedDelta(deltaTime);

        for (const [armyId, movementData] of this.movingArmies) {
            this.updateArmyMovement(movementData, adjustedDelta);
        }
    }
    
    /**
     * Update individual army movement
     */
    updateArmyMovement(movementData, deltaTime) {
        const { army, path, currentIndex } = movementData;
        
        if (currentIndex >= path.length) {
            this.completeMovement(army.id);
            return;
        }
        
        const movementComponent = army.getComponent('movement');
        const positionComponent = army.getComponent('position');
        
        if (!movementComponent || !positionComponent) {
            this.completeMovement(army.id);
            return;
        }
        
        // Get current terrain
        const currentTile = path[currentIndex];
        const terrain = this.getTerrain(currentTile.x, currentTile.y);
        
        // Update movement progress
        const movementComplete = movementComponent.updateMovement(deltaTime, terrain);
        
        if (movementComplete) {
            // Move to next tile
            positionComponent.setTilePosition(currentTile.x, currentTile.y);
            
            // Check for tile occupation events (combat)
            this.checkTileOccupation(army, currentTile);
            
            movementData.currentIndex++;
            
            if (movementData.currentIndex >= path.length) {
                this.completeMovement(army.id);
            }
        }
        
        movementData.elapsedTime += deltaTime;
    }
    
    /**
     * Complete army movement
     */
    completeMovement(armyId) {
        const movementData = this.movingArmies.get(armyId);
        if (movementData) {
            const movementComponent = movementData.army.getComponent('movement');
            if (movementComponent) {
                movementComponent.stopMovement();
            }
            this.movingArmies.delete(armyId);
        }
    }
    
    /**
     * Stop army movement
     */
    stopMovement(armyId) {
        this.completeMovement(armyId);
    }
    
    /**
     * Check if army is currently moving
     */
    isMoving(armyId) {
        return this.movingArmies.has(armyId);
    }
    
    /**
     * Get movement progress for army
     */
    getMovementProgress(armyId) {
        const movementData = this.movingArmies.get(armyId);
        if (!movementData) {
            return null;
        }
        
        return {
            currentIndex: movementData.currentIndex,
            totalSteps: movementData.path.length,
            elapsedTime: movementData.elapsedTime,
            estimatedTime: movementData.totalTime,
            percentComplete: movementData.path.length > 0 ? 
                (movementData.currentIndex / movementData.path.length) * 100 : 0
        };
    }
    
    /**
     * Calculate time to move along a path
     * @param {Array} path - Array of {x, y} positions
     * @param {number} armySpeed - Army speed in tiles per second
     * @returns {number} Total time in milliseconds
     */
    calculatePathTime(path, armySpeed) {
        if (!path || path.length === 0 || armySpeed <= 0) {
            return 0;
        }
        
        let totalTime = 0;
        const baseTimePerTile = CONFIG.get('movement.baseTimePerTile');
        
        for (const position of path) {
            const terrain = this.getTerrain(position.x, position.y);
            if (!terrain) {
                continue;
            }
            
            const terrainModifier = terrain.movementModifier || 1.0;
            // timePerTile = baseTimePerTile / (armySpeed * terrainModifier)
            const timePerTile = baseTimePerTile / (armySpeed * terrainModifier);
            totalTime += timePerTile;
        }
        
        return totalTime;
    }
    
    /**
     * Calculate time for single tile movement
     * @param {number} armySpeed - Army speed in tiles per second
     * @param {Object} terrain - Terrain configuration
     * @returns {number} Time in milliseconds
     */
    calculateTileTime(armySpeed, terrain) {
        const baseTimePerTile = CONFIG.get('movement.baseTimePerTile');
        const terrainModifier = terrain && terrain.movementModifier !== undefined ? 
                                terrain.movementModifier : 1.0;
        
        if (armySpeed <= 0 || terrainModifier <= 0) {
            return Infinity;
        }
        
        return baseTimePerTile / (armySpeed * terrainModifier);
    }
    
    /**
     * Get terrain at position
     */
    getTerrain(x, y) {
        if (x < 0 || x >= this.mapData.width || y < 0 || y >= this.mapData.height) {
            return null;
        }
        
        const tile = this.mapData.tiles[y][x];
        return TERRAIN_CONFIG[tile.terrain];
    }
    
    /**
     * Get interpolated position for smooth movement
     * @param {Army} army - The moving army
     * @returns {Object} {x, y} world position
     */
    getInterpolatedPosition(army) {
        const movementData = this.movingArmies.get(army.id);
        if (!movementData) {
            const position = army.getComponent('position');
            return position ? { x: position.x, y: position.y } : { x: 0, y: 0 };
        }
        
        const movementComponent = army.getComponent('movement');
        const positionComponent = army.getComponent('position');
        
        if (!movementComponent || !positionComponent) {
            return { x: positionComponent.x, y: positionComponent.y };
        }
        
        // Get current and target positions
        const currentPos = { x: positionComponent.x, y: positionComponent.y };
        
        if (movementData.currentIndex >= movementData.path.length) {
            return currentPos;
        }
        
        const targetTile = movementData.path[movementData.currentIndex];
        const tileSize = CONFIG.get('map.tileSize');
        const targetPos = {
            x: targetTile.x * tileSize,
            y: targetTile.y * tileSize
        };
        
        return movementComponent.getInterpolatedPosition(currentPos, targetPos);
    }
    
    /**
     * Check if position is reachable from start
     * @param {Object} start - {x, y} start position
     * @param {Object} target - {x, y} target position
     * @returns {boolean} True if reachable
     */
    isReachable(start, target) {
        const path = this.pathfinding.findPath(start, target);
        return path.length > 0;
    }

    /**
     * Check for tile occupation and trigger combat if necessary
     * @param {Army} army - The army that moved to the tile
     * @param {Object} tile - {x, y} tile position
     */
    checkTileOccupation(army, tile) {
        if (!this.gameState || !this.combatEngine) {
            return; // Combat system not initialized
        }

        // Get all entities at this position
        const entitiesAtPosition = this.getEntitiesAtPosition(tile.x, tile.y);
        
        // Check for enemy armies
        const enemyArmies = entitiesAtPosition.filter(entity => 
            entity.type === 'army' && 
            entity.owner !== army.owner &&
            entity.id !== army.id
        );

        // Check for enemy castles
        const enemyCastles = entitiesAtPosition.filter(entity =>
            entity.type === 'castle' &&
            entity.owner !== army.owner
        );

        // Trigger combat with first enemy found
        if (enemyArmies.length > 0) {
            const enemyArmy = enemyArmies[0];
            if (this.combatEngine.canCombat(army, enemyArmy)) {
                const terrain = this.getTerrain(tile.x, tile.y);
                const terrainType = terrain ? Object.keys(TERRAIN_CONFIG).find(key => 
                    TERRAIN_CONFIG[key] === terrain
                ) : 'grassland';

                // Stop movement for combat
                this.stopMovement(army.id);
                this.stopMovement(enemyArmy.id);

                // Resolve combat
                this.combatEngine.resolveCombat(army, enemyArmy, tile, terrainType);
            }
        } else if (enemyCastles.length > 0) {
            const enemyCastle = enemyCastles[0];
            if (this.combatEngine.canCombat(army, enemyCastle)) {
                const terrain = this.getTerrain(tile.x, tile.y);
                const terrainType = terrain ? Object.keys(TERRAIN_CONFIG).find(key => 
                    TERRAIN_CONFIG[key] === terrain
                ) : 'grassland';

                // Stop movement for siege combat
                this.stopMovement(army.id);

                // Resolve siege combat
                this.combatEngine.resolveCombat(army, enemyCastle, tile, terrainType);
            }
        }
    }

    /**
     * Get all entities at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @returns {Array} Array of entities at position
     */
    getEntitiesAtPosition(x, y) {
        const entitiesAtPosition = [];

        if (!this.gameState) {
            return entitiesAtPosition;
        }

        // Check armies
        const armies = this.gameState.getAllArmies();
        for (const army of armies) {
            const position = army.getComponent('position');
            if (position && position.tileX === x && position.tileY === y) {
                entitiesAtPosition.push(army);
            }
        }

        // Check castles
        const castles = this.gameState.getAllCastles();
        for (const castle of castles) {
            const position = castle.getComponent('position');
            if (position && position.tileX === x && position.tileY === y) {
                entitiesAtPosition.push(castle);
            }
        }

        return entitiesAtPosition;
    }

    /**
     * Set combat engine for combat integration
     * @param {CombatEngine} combatEngine - The combat engine instance
     */
    setCombatEngine(combatEngine) {
        this.combatEngine = combatEngine;
    }

    /**
     * Set game state manager for entity queries
     * @param {GameStateManager} gameStateManager - The game state manager instance
     */
    setGameStateManager(gameStateManager) {
        this.gameState = gameStateManager;
    }

    // IPausableSystem interface implementation

    /**
     * Pause the movement system
     */
    pause() {
        if (this.isPausedState) {
            return; // Already paused
        }

        this.isPausedState = true;
        this.pauseStartTime = Date.now();

        // Preserve current system state
        this.pausedSystemState = {
            movingArmies: new Map(),
            totalPausedTime: this.totalPausedTime
        };

        // Store movement data for each army
        for (const [armyId, movementData] of this.movingArmies) {
            this.pausedSystemState.movingArmies.set(armyId, {
                ...movementData,
                elapsedTime: movementData.elapsedTime
            });

            // Pause the army's movement component if it has a pausable component
            const pausableComponent = movementData.army.getComponent('pausable');
            if (pausableComponent && typeof pausableComponent.pause === 'function') {
                pausableComponent.pause(this.pauseStartTime, {
                    movementProgress: movementData.currentIndex,
                    elapsedTime: movementData.elapsedTime
                });
            }
        }
    }

    /**
     * Unpause the movement system
     */
    unpause() {
        if (!this.isPausedState) {
            return; // Not paused
        }

        const pauseDuration = Date.now() - this.pauseStartTime;
        this.totalPausedTime += pauseDuration;
        this.isPausedState = false;

        // Restore movement data for each army
        if (this.pausedSystemState && this.pausedSystemState.movingArmies) {
            for (const [armyId, movementData] of this.movingArmies) {
                const pausedData = this.pausedSystemState.movingArmies.get(armyId);
                if (pausedData) {
                    // Restore preserved elapsed time
                    movementData.elapsedTime = pausedData.elapsedTime;
                }

                // Unpause the army's movement component
                const pausableComponent = movementData.army.getComponent('pausable');
                if (pausableComponent && typeof pausableComponent.unpause === 'function') {
                    const restoredState = pausableComponent.unpause(Date.now());
                    if (restoredState) {
                        movementData.currentIndex = restoredState.movementProgress || movementData.currentIndex;
                        movementData.elapsedTime = restoredState.elapsedTime || movementData.elapsedTime;
                    }
                }
            }
        }

        // Clear preserved state
        this.pausedSystemState = null;
        this.pauseStartTime = 0;
    }

    /**
     * Check if the movement system is paused
     * @returns {boolean} True if paused
     */
    isPaused() {
        return this.isPausedState;
    }

    /**
     * Get current system state for preservation
     * @returns {Object} Current system state
     */
    getState() {
        return {
            isPaused: this.isPausedState,
            pauseStartTime: this.pauseStartTime,
            totalPausedTime: this.totalPausedTime,
            movingArmiesCount: this.movingArmies.size,
            movingArmyIds: Array.from(this.movingArmies.keys())
        };
    }

    /**
     * Set system state (for restoration)
     * @param {Object} state - State to restore
     */
    setState(state) {
        if (state && typeof state === 'object') {
            this.isPausedState = state.isPaused || false;
            this.pauseStartTime = state.pauseStartTime || 0;
            this.totalPausedTime = state.totalPausedTime || 0;
        }
    }

    /**
     * Get adjusted delta time accounting for pause duration
     * @param {number} deltaTime - Original delta time
     * @returns {number} Adjusted delta time
     */
    getAdjustedDelta(deltaTime) {
        // For now, return deltaTime as-is since pause handling is done at the update level
        // Future enhancement could include more sophisticated time adjustment
        return deltaTime;
    }

    /**
     * Get total time spent paused
     * @returns {number} Total pause duration in milliseconds
     */
    getTotalPausedTime() {
        let total = this.totalPausedTime;
        if (this.isPausedState) {
            total += Date.now() - this.pauseStartTime;
        }
        return total;
    }

    /**
     * Get movement statistics including pause information
     * @returns {Object} Movement statistics
     */
    getMovementStats() {
        return {
            movingArmiesCount: this.movingArmies.size,
            isPaused: this.isPausedState,
            totalPausedTime: this.getTotalPausedTime(),
            pauseStartTime: this.pauseStartTime
        };
    }
}