import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';
import { CONFIG } from '../config/ConfigurationManager.js';

export class TilemapGenerator {
    constructor(width, height, playerCount = 2) {
        this.width = width;
        this.height = height;
        this.playerCount = playerCount;
        this.tiles = [];
        this.castlePositions = [];
    }

    generate() {
        this.initializeBaseTerrain();
        this.generateMountainRanges();
        this.generateWaterBodies();
        this.generateForests();
        this.generateSwamps();
        this.generateDeserts();
        this.generateRoads();
        this.placeCastlePositions();
        
        return {
            width: this.width,
            height: this.height,
            tiles: this.tiles,
            castlePositions: this.castlePositions
        };
    }

    initializeBaseTerrain() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Base terrain is mostly grassland with some plains
                const terrainType = Math.random() < 0.7 ? 'grassland' : 'plains';
                this.tiles[y][x] = {
                    x,
                    y,
                    terrain: terrainType,
                    hasRoad: false,
                    hasCastle: false
                };
            }
        }
    }

    generateMountainRanges() {
        const mountainChance = 0.08;
        const clusterSize = 3;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (Math.random() < mountainChance) {
                    this.createMountainCluster(x, y, clusterSize);
                }
            }
        }
    }

    createMountainCluster(centerX, centerY, size) {
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (this.isValidPosition(x, y)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const probability = Math.max(0, 1 - (distance / size));
                    
                    if (Math.random() < probability * 0.6) {
                        this.tiles[y][x].terrain = 'mountain';
                    }
                }
            }
        }
    }

    generateWaterBodies() {
        const waterBodies = Math.floor(this.width * this.height / 2000) + 1;
        
        for (let i = 0; i < waterBodies; i++) {
            const centerX = Math.floor(Math.random() * this.width);
            const centerY = Math.floor(Math.random() * this.height);
            const size = Math.floor(Math.random() * 4) + 2;
            
            this.createWaterCluster(centerX, centerY, size);
        }
    }

    createWaterCluster(centerX, centerY, size) {
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (this.isValidPosition(x, y)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const probability = Math.max(0, 1 - (distance / size));
                    
                    if (Math.random() < probability * 0.8) {
                        // Sometimes create lakes instead of water
                        const terrainType = Math.random() < 0.3 ? 'lake' : 'water';
                        this.tiles[y][x].terrain = terrainType;
                    }
                }
            }
        }
    }

    generateForests() {
        const forestChance = 0.15;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].terrain === 'grassland' || this.tiles[y][x].terrain === 'plains') {
                    if (Math.random() < forestChance) {
                        this.tiles[y][x].terrain = 'forest';
                    }
                }
            }
        }
    }

    generateSwamps() {
        const swampChance = 0.05;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].terrain === 'grassland') {
                    // Swamps are more likely near water
                    const nearWater = this.isNearTerrain(x, y, ['water', 'lake'], 2);
                    const chance = nearWater ? swampChance * 3 : swampChance;
                    
                    if (Math.random() < chance) {
                        this.tiles[y][x].terrain = 'swamp';
                    }
                }
            }
        }
    }

    generateDeserts() {
        const desertRegions = Math.floor(this.width * this.height / 3000);
        
        for (let i = 0; i < desertRegions; i++) {
            const centerX = Math.floor(Math.random() * this.width);
            const centerY = Math.floor(Math.random() * this.height);
            const size = Math.floor(Math.random() * 8) + 4;
            
            this.createDesertRegion(centerX, centerY, size);
        }
    }

    createDesertRegion(centerX, centerY, size) {
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (this.isValidPosition(x, y)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const probability = Math.max(0, 1 - (distance / size));
                    
                    if (Math.random() < probability * 0.4) {
                        if (this.tiles[y][x].terrain === 'grassland' || this.tiles[y][x].terrain === 'plains') {
                            this.tiles[y][x].terrain = 'desert';
                        }
                    }
                }
            }
        }
    }

    generateRoads() {
        // Generate a few random roads connecting different areas
        const roadCount = Math.floor(this.playerCount / 2) + 1;
        
        for (let i = 0; i < roadCount; i++) {
            const startX = Math.floor(Math.random() * this.width);
            const startY = Math.floor(Math.random() * this.height);
            const endX = Math.floor(Math.random() * this.width);
            const endY = Math.floor(Math.random() * this.height);
            
            this.createRoad(startX, startY, endX, endY);
        }
    }

    createRoad(startX, startY, endX, endY) {
        const path = this.findPath(startX, startY, endX, endY);
        
        for (const { x, y } of path) {
            if (this.isValidPosition(x, y)) {
                // Only place roads on passable terrain
                if (TERRAIN_CONFIG[this.tiles[y][x].terrain].passable) {
                    this.tiles[y][x].hasRoad = true;
                    this.tiles[y][x].terrain = 'road';
                }
            }
        }
    }

    findPath(startX, startY, endX, endY) {
        const path = [];
        let currentX = startX;
        let currentY = startY;
        
        // Simple path finding - move towards target
        while (currentX !== endX || currentY !== endY) {
            path.push({ x: currentX, y: currentY });
            
            // Move towards target
            if (currentX < endX) currentX++;
            else if (currentX > endX) currentX--;
            
            if (currentY < endY) currentY++;
            else if (currentY > endY) currentY--;
        }
        
        path.push({ x: endX, y: endY });
        return path;
    }

    placeCastlePositions() {
        this.castlePositions = [];
        const minDistance = Math.max(8, Math.floor(Math.min(this.width, this.height) / 4));
        
        for (let playerId = 0; playerId < this.playerCount; playerId++) {
            let attempts = 0;
            let position = null;
            
            while (!position && attempts < 100) {
                const x = Math.floor(Math.random() * this.width);
                const y = Math.floor(Math.random() * this.height);
                
                if (this.isValidCastlePosition(x, y, minDistance)) {
                    position = { x, y, playerId };
                    this.tiles[y][x].hasCastle = true;
                    this.tiles[y][x].terrain = 'grassland'; // Ensure castles are on passable terrain
                    this.castlePositions.push(position);
                }
                attempts++;
            }
            
            // Fallback if no good position found
            if (!position) {
                const x = Math.floor((playerId % 2) * (this.width - 1));
                const y = Math.floor(Math.floor(playerId / 2) * (this.height - 1));
                
                this.tiles[y][x].hasCastle = true;
                this.tiles[y][x].terrain = 'grassland';
                this.castlePositions.push({ x, y, playerId });
            }
        }
    }

    isValidCastlePosition(x, y, minDistance) {
        if (!this.isValidPosition(x, y)) return false;
        
        // Must be on passable terrain
        if (!TERRAIN_CONFIG[this.tiles[y][x].terrain].passable) return false;
        
        // Check distance from other castles
        for (const castle of this.castlePositions) {
            const distance = Math.sqrt((x - castle.x) ** 2 + (y - castle.y) ** 2);
            if (distance < minDistance) return false;
        }
        
        // Ensure there's some open space around the castle
        let openTiles = 0;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;
                
                if (this.isValidPosition(checkX, checkY)) {
                    if (TERRAIN_CONFIG[this.tiles[checkY][checkX].terrain].passable) {
                        openTiles++;
                    }
                }
            }
        }
        
        return openTiles >= 15; // At least 15 out of 25 tiles should be passable
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isNearTerrain(x, y, terrainTypes, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;
                
                if (this.isValidPosition(checkX, checkY)) {
                    if (terrainTypes.includes(this.tiles[checkY][checkX].terrain)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getTile(x, y) {
        if (!this.isValidPosition(x, y)) return null;
        return this.tiles[y][x];
    }

    getTerrainType(x, y) {
        const tile = this.getTile(x, y);
        return tile ? tile.terrain : null;
    }
}