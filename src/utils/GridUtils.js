/**
 * GridUtils provides utility functions for grid-based calculations
 */
class GridUtils {
    /**
     * Calculate grid position from pixel coordinates
     * @param {number} pixelX - Pixel X coordinate
     * @param {number} pixelY - Pixel Y coordinate
     * @param {number} gridSize - Size of each grid cell in pixels
     * @returns {Object} Grid coordinates {x, y}
     */
    static pixelToGrid(pixelX, pixelY, gridSize) {
        return {
            x: Math.floor(pixelX / gridSize),
            y: Math.floor(pixelY / gridSize)
        };
    }
    
    /**
     * Calculate pixel position from grid coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {number} gridSize - Size of each grid cell in pixels
     * @returns {Object} Pixel coordinates {x, y}
     */
    static gridToPixel(gridX, gridY, gridSize) {
        return {
            x: gridX * gridSize,
            y: gridY * gridSize
        };
    }
    
    /**
     * Calculate center pixel position of a grid cell
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {number} gridSize - Size of each grid cell in pixels
     * @returns {Object} Center pixel coordinates {x, y}
     */
    static gridToPixelCenter(gridX, gridY, gridSize) {
        return {
            x: gridX * gridSize + gridSize / 2,
            y: gridY * gridSize + gridSize / 2
        };
    }
    
    /**
     * Check if grid position is within map bounds
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {number} mapWidth - Map width in grid units
     * @param {number} mapHeight - Map height in grid units
     * @returns {boolean} True if position is valid
     */
    static isValidGridPosition(x, y, mapWidth, mapHeight) {
        return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
    }
    
    /**
     * Calculate Manhattan distance between two grid positions
     * @param {number} x1 - First X coordinate
     * @param {number} y1 - First Y coordinate
     * @param {number} x2 - Second X coordinate
     * @param {number} y2 - Second Y coordinate
     * @returns {number} Manhattan distance
     */
    static manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }
    
    /**
     * Calculate Euclidean distance between two grid positions
     * @param {number} x1 - First X coordinate
     * @param {number} y1 - First Y coordinate
     * @param {number} x2 - Second X coordinate
     * @param {number} y2 - Second Y coordinate
     * @returns {number} Euclidean distance
     */
    static euclideanDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    /**
     * Get all adjacent grid positions (4-directional)
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} mapWidth - Map width in grid units
     * @param {number} mapHeight - Map height in grid units
     * @returns {Array} Array of adjacent positions
     */
    static getAdjacentPositions(x, y, mapWidth, mapHeight) {
        const positions = [];
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }  // Left
        ];
        
        directions.forEach(dir => {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidGridPosition(newX, newY, mapWidth, mapHeight)) {
                positions.push({ x: newX, y: newY });
            }
        });
        
        return positions;
    }
    
    /**
     * Get all positions within a radius (including diagonals)
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} radius - Radius in grid units
     * @param {number} mapWidth - Map width in grid units
     * @param {number} mapHeight - Map height in grid units
     * @returns {Array} Array of positions within radius
     */
    static getPositionsInRadius(x, y, radius, mapWidth, mapHeight) {
        const positions = [];
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (this.isValidGridPosition(newX, newY, mapWidth, mapHeight)) {
                    const distance = this.euclideanDistance(x, y, newX, newY);
                    if (distance <= radius) {
                        positions.push({ 
                            x: newX, 
                            y: newY, 
                            distance: distance 
                        });
                    }
                }
            }
        }
        
        return positions.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * Find path between two points (simple straight line)
     * @param {number} startX - Start X coordinate
     * @param {number} startY - Start Y coordinate
     * @param {number} endX - End X coordinate
     * @param {number} endY - End Y coordinate
     * @returns {Array} Array of grid positions forming the path
     */
    static getSimplePath(startX, startY, endX, endY) {
        const path = [];
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;
        
        let x = startX;
        let y = startY;
        
        while (true) {
            path.push({ x: x, y: y });
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return path;
    }
    
    /**
     * Check if a line of sight exists between two points
     * @param {number} x1 - First X coordinate
     * @param {number} y1 - First Y coordinate
     * @param {number} x2 - Second X coordinate
     * @param {number} y2 - Second Y coordinate
     * @param {Array} obstacles - Array of obstacle positions
     * @returns {boolean} True if line of sight exists
     */
    static hasLineOfSight(x1, y1, x2, y2, obstacles = []) {
        const path = this.getSimplePath(x1, y1, x2, y2);
        
        // Check if any path position has an obstacle
        for (let i = 1; i < path.length - 1; i++) { // Skip start and end
            const pos = path[i];
            if (obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Generate random valid position within map bounds
     * @param {number} mapWidth - Map width in grid units
     * @param {number} mapHeight - Map height in grid units
     * @param {Array} excludePositions - Positions to exclude
     * @returns {Object} Random position {x, y}
     */
    static getRandomPosition(mapWidth, mapHeight, excludePositions = []) {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * mapWidth);
            const y = Math.floor(Math.random() * mapHeight);
            
            const isExcluded = excludePositions.some(pos => pos.x === x && pos.y === y);
            if (!isExcluded) {
                return { x: x, y: y };
            }
            
            attempts++;
        }
        
        // Fallback to first available position
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
                const isExcluded = excludePositions.some(pos => pos.x === x && pos.y === y);
                if (!isExcluded) {
                    return { x: x, y: y };
                }
            }
        }
        
        return { x: 0, y: 0 }; // Ultimate fallback
    }
    
    /**
     * Calculate area of effect positions
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Effect radius
     * @param {string} shape - Shape type ('circle', 'square', 'diamond')
     * @param {number} mapWidth - Map width in grid units
     * @param {number} mapHeight - Map height in grid units
     * @returns {Array} Array of affected positions
     */
    static getAreaOfEffect(centerX, centerY, radius, shape = 'circle', mapWidth, mapHeight) {
        const positions = [];
        
        for (let x = centerX - radius; x <= centerX + radius; x++) {
            for (let y = centerY - radius; y <= centerY + radius; y++) {
                if (!this.isValidGridPosition(x, y, mapWidth, mapHeight)) continue;
                
                let include = false;
                const distance = this.euclideanDistance(centerX, centerY, x, y);
                const manhattanDist = this.manhattanDistance(centerX, centerY, x, y);
                
                switch (shape) {
                    case 'circle':
                        include = distance <= radius;
                        break;
                    case 'square':
                        include = Math.abs(x - centerX) <= radius && Math.abs(y - centerY) <= radius;
                        break;
                    case 'diamond':
                        include = manhattanDist <= radius;
                        break;
                }
                
                if (include) {
                    positions.push({ x: x, y: y, distance: distance });
                }
            }
        }
        
        return positions;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridUtils;
}