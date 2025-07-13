/**
 * MovementSystem handles army movement and pathfinding
 */
class MovementSystem {
    constructor(mapWidth = 20, mapHeight = 15) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.movementHistory = [];
        this.maxHistoryLength = 50;
    }
    
    /**
     * Update movement for all armies
     * @param {Array} armies - Array of army objects
     * @returns {Array} Armies that reached their destination
     */
    updateAllMovement(armies) {
        const arrivedArmies = [];
        
        armies.forEach(army => {
            if (army.updateMovement && army.updateMovement()) {
                arrivedArmies.push(army);
                this.recordMovement(army);
            }
        });
        
        return arrivedArmies;
    }
    
    /**
     * Initiate army movement
     * @param {Army} army - Army to move
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @returns {boolean} True if movement initiated successfully
     */
    moveArmy(army, targetX, targetY) {
        // Validate target position
        if (!this.isValidPosition(targetX, targetY)) {
            console.log(`Invalid target position: (${targetX}, ${targetY})`);
            return false;
        }
        
        // Check if army is already at target
        if (army.x === targetX && army.y === targetY) {
            console.log(`Army is already at target position: (${targetX}, ${targetY})`);
            return false;
        }
        
        // Start movement
        army.moveTo(targetX, targetY);
        
        console.log(`Movement initiated: Army moving from (${army.x}, ${army.y}) to (${targetX}, ${targetY})`);
        return true;
    }
    
    /**
     * Check if position is valid on the map
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {boolean} True if position is valid
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }
    
    /**
     * Calculate distance between two points
     * @param {number} x1 - First X position
     * @param {number} y1 - First Y position
     * @param {number} x2 - Second X position
     * @param {number} y2 - Second Y position
     * @returns {number} Distance between points
     */
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    /**
     * Calculate movement time for an army
     * @param {Army} army - Army to calculate for
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @returns {number} Estimated movement time in milliseconds
     */
    calculateMovementTime(army, targetX, targetY) {
        const distance = this.calculateDistance(army.x, army.y, targetX, targetY);
        const moveSpeed = army.moveSpeed || 0.02;
        
        // Assume 60 FPS for frame-based movement
        const framesPerSecond = 60;
        const framesNeeded = distance / moveSpeed;
        
        return Math.round((framesNeeded / framesPerSecond) * 1000);
    }
    
    /**
     * Find all armies at a specific position
     * @param {Array} armies - Array of armies to search
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Array} Armies at the position
     */
    getArmiesAtPosition(armies, x, y) {
        return armies.filter(army => army.isAtPosition && army.isAtPosition(x, y));
    }
    
    /**
     * Find nearest enemy army to a position
     * @param {Array} armies - Array of all armies
     * @param {number} x - Search center X
     * @param {number} y - Search center Y
     * @param {Player} player - Player to find enemies for
     * @returns {Army|null} Nearest enemy army or null
     */
    findNearestEnemyArmy(armies, x, y, player) {
        let nearestArmy = null;
        let shortestDistance = Infinity;
        
        armies.forEach(army => {
            if (army.owner !== player && army.isStationary) {
                const distance = this.calculateDistance(x, y, army.x, army.y);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestArmy = army;
                }
            }
        });
        
        return nearestArmy;
    }
    
    /**
     * Find all possible movement targets for an army
     * @param {Array} armies - All armies
     * @param {Array} castles - All castles
     * @param {Player} player - Player making the move
     * @returns {Array} Array of possible target positions
     */
    findPossibleTargets(armies, castles, player) {
        const targets = [];
        
        // Add enemy castles as targets
        castles.forEach(castle => {
            if (castle.owner !== player) {
                targets.push({
                    x: castle.x,
                    y: castle.y,
                    type: 'enemy_castle',
                    target: castle,
                    priority: 'high'
                });
            }
        });
        
        // Add enemy armies as targets
        armies.forEach(army => {
            if (army.owner !== player && army.isStationary) {
                targets.push({
                    x: army.x,
                    y: army.y,
                    type: 'enemy_army',
                    target: army,
                    priority: 'medium'
                });
            }
        });
        
        // Add friendly castles for reinforcement
        castles.forEach(castle => {
            if (castle.owner === player) {
                targets.push({
                    x: castle.x,
                    y: castle.y,
                    type: 'friendly_castle',
                    target: castle,
                    priority: 'low'
                });
            }
        });
        
        // Add friendly armies for merging
        armies.forEach(army => {
            if (army.owner === player && army.isStationary) {
                targets.push({
                    x: army.x,
                    y: army.y,
                    type: 'friendly_army',
                    target: army,
                    priority: 'low'
                });
            }
        });
        
        return targets;
    }
    
    /**
     * Get optimal movement speed based on army size
     * @param {Army} army - Army to calculate speed for
     * @returns {number} Optimal movement speed
     */
    getOptimalSpeed(army) {
        // Larger armies move slightly slower
        const baseMoveSpeed = 0.02;
        const sizePenalty = Math.min(0.005, army.unitCount * 0.0001);
        
        return Math.max(0.01, baseMoveSpeed - sizePenalty);
    }
    
    /**
     * Record a movement for history tracking
     * @param {Army} army - Army that completed movement
     */
    recordMovement(army) {
        const movementRecord = {
            armyId: army.id,
            owner: army.owner.name,
            from: { x: army.movementHistory[army.movementHistory.length - 1]?.from.x || army.x, 
                   y: army.movementHistory[army.movementHistory.length - 1]?.from.y || army.y },
            to: { x: army.x, y: army.y },
            unitCount: army.unitCount,
            timestamp: Date.now()
        };
        
        this.movementHistory.push(movementRecord);
        
        // Limit history size
        if (this.movementHistory.length > this.maxHistoryLength) {
            this.movementHistory.shift();
        }
    }
    
    /**
     * Get movement statistics
     * @returns {Object} Movement statistics
     */
    getStatistics() {
        const stats = {
            totalMovements: this.movementHistory.length,
            averageDistance: 0,
            mostActivePlayer: null,
            movementsByPlayer: {}
        };
        
        let totalDistance = 0;
        
        this.movementHistory.forEach(record => {
            // Calculate distance
            const distance = this.calculateDistance(
                record.from.x, record.from.y,
                record.to.x, record.to.y
            );
            totalDistance += distance;
            
            // Count by player
            if (!stats.movementsByPlayer[record.owner]) {
                stats.movementsByPlayer[record.owner] = 0;
            }
            stats.movementsByPlayer[record.owner]++;
        });
        
        stats.averageDistance = stats.totalMovements > 0 ? 
            Math.round((totalDistance / stats.totalMovements) * 100) / 100 : 0;
            
        // Find most active player
        let maxMovements = 0;
        Object.keys(stats.movementsByPlayer).forEach(player => {
            if (stats.movementsByPlayer[player] > maxMovements) {
                maxMovements = stats.movementsByPlayer[player];
                stats.mostActivePlayer = player;
            }
        });
        
        return stats;
    }
    
    /**
     * Clear movement history
     */
    clearHistory() {
        this.movementHistory = [];
    }
    
    /**
     * Set map dimensions
     * @param {number} width - Map width
     * @param {number} height - Map height
     */
    setMapDimensions(width, height) {
        this.mapWidth = width;
        this.mapHeight = height;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovementSystem;
}