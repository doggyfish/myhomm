import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';

/**
 * A* pathfinding implementation with terrain modifiers
 */
export class Pathfinding {
    constructor(mapData) {
        this.mapData = mapData;
        this.width = mapData.width;
        this.height = mapData.height;
    }
    
    /**
     * Find path using A* algorithm
     * @param {Object} start - {x, y} start position
     * @param {Object} goal - {x, y} goal position
     * @returns {Array} Array of {x, y} positions forming the path
     */
    findPath(start, goal) {
        // Validate positions
        if (!this.isValidPosition(start) || !this.isValidPosition(goal)) {
            return [];
        }
        
        // Check if goal is passable
        if (!this.isPassable(goal.x, goal.y)) {
            return [];
        }
        
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = this.positionKey(start);
        const goalKey = this.positionKey(goal);
        
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));
        openSet.enqueue(start, fScore.get(startKey));
        
        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();
            const currentKey = this.positionKey(current);
            
            if (currentKey === goalKey) {
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(currentKey);
            
            // Check all neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                const neighborKey = this.positionKey(neighbor);
                
                if (closedSet.has(neighborKey)) {
                    continue;
                }
                
                // Calculate movement cost considering terrain
                const movementCost = this.getMovementCost(current, neighbor);
                if (movementCost === Infinity) {
                    continue; // Impassable terrain
                }
                
                const tentativeGScore = gScore.get(currentKey) + movementCost;
                
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));
                    
                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, fScore.get(neighborKey));
                    }
                }
            }
        }
        
        return []; // No path found
    }
    
    /**
     * Get movement cost between two adjacent tiles
     */
    getMovementCost(from, to) {
        const terrain = this.getTerrain(to.x, to.y);
        if (!terrain || !terrain.passable) {
            return Infinity;
        }
        
        // Base cost is 1, modified by terrain
        // Lower movement modifier = higher cost
        const movementModifier = terrain.movementModifier || 1.0;
        if (movementModifier === 0) {
            return Infinity;
        }
        
        return 1.0 / movementModifier;
    }
    
    /**
     * Manhattan distance heuristic
     */
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    /**
     * Get valid neighbors for a position
     */
    getNeighbors(position) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }  // West
        ];
        
        for (const dir of directions) {
            const neighbor = {
                x: position.x + dir.x,
                y: position.y + dir.y
            };
            
            if (this.isValidPosition(neighbor)) {
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }
    
    /**
     * Reconstruct path from A* results
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = this.positionKey(current);
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = this.positionKey(current);
        }
        
        return path;
    }
    
    /**
     * Check if position is valid on map
     */
    isValidPosition(position) {
        return position.x >= 0 && position.x < this.width &&
               position.y >= 0 && position.y < this.height;
    }
    
    /**
     * Check if tile is passable
     */
    isPassable(x, y) {
        const terrain = this.getTerrain(x, y);
        return terrain && terrain.passable;
    }
    
    /**
     * Get terrain at position
     */
    getTerrain(x, y) {
        if (!this.isValidPosition({ x, y })) {
            return null;
        }
        
        const tile = this.mapData.tiles[y][x];
        return TERRAIN_CONFIG[tile.terrain];
    }
    
    /**
     * Create unique key for position
     */
    positionKey(position) {
        return `${position.x},${position.y}`;
    }
    
    /**
     * Calculate total movement time for a path
     * @param {Array} path - Array of positions
     * @param {number} armySpeed - Army speed in tiles per second
     * @returns {number} Total time in milliseconds
     */
    calculatePathTime(path, armySpeed) {
        if (!path || path.length < 2) {
            return 0;
        }
        
        let totalTime = 0;
        const baseTimePerTile = 1000; // 1 second base time
        
        for (let i = 1; i < path.length; i++) {
            const position = path[i];
            const terrain = this.getTerrain(position.x, position.y);
            
            if (!terrain) {
                continue;
            }
            
            const terrainModifier = terrain.movementModifier || 1.0;
            const timePerTile = baseTimePerTile / (armySpeed * terrainModifier);
            totalTime += timePerTile;
        }
        
        return totalTime;
    }
}

/**
 * Priority queue for A* algorithm
 */
class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
        return this.elements.shift().element;
    }
    
    isEmpty() {
        return this.elements.length === 0;
    }
    
    contains(element) {
        return this.elements.some(item => 
            item.element.x === element.x && item.element.y === element.y
        );
    }
}