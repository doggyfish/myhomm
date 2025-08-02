import { CONFIG } from '../config/ConfigurationManager.js';
import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';
import { Pathfinding } from './Pathfinding.js';

/**
 * System for handling army movement with terrain modifiers
 */
export class MovementSystem {
    constructor(mapData) {
        this.mapData = mapData;
        this.pathfinding = new Pathfinding(mapData);
        this.movingArmies = new Map(); // armyId -> movement data
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
        for (const [armyId, movementData] of this.movingArmies) {
            this.updateArmyMovement(movementData, deltaTime);
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
}