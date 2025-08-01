import { TilemapGenerator } from './TilemapGenerator.js';
import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';

describe('TilemapGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new TilemapGenerator(32, 32, 2);
    });

    describe('constructor', () => {
        test('should create generator with correct dimensions', () => {
            expect(generator.width).toBe(32);
            expect(generator.height).toBe(32);
            expect(generator.playerCount).toBe(2);
            expect(generator.tiles).toEqual([]);
            expect(generator.castlePositions).toEqual([]);
        });

        test('should default to 2 players', () => {
            const defaultGenerator = new TilemapGenerator(64, 64);
            expect(defaultGenerator.playerCount).toBe(2);
        });
    });

    describe('generate', () => {
        test('should generate map with correct structure', () => {
            const map = generator.generate();

            expect(map).toHaveProperty('width', 32);
            expect(map).toHaveProperty('height', 32);
            expect(map).toHaveProperty('tiles');
            expect(map).toHaveProperty('castlePositions');
            expect(map.tiles).toHaveLength(32);
            expect(map.tiles[0]).toHaveLength(32);
        });

        test('should generate different maps on multiple calls', () => {
            const map1 = generator.generate();
            const map2 = generator.generate();

            // Maps should be different (very unlikely to be identical)
            let differences = 0;
            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    if (map1.tiles[y][x].terrain !== map2.tiles[y][x].terrain) {
                        differences++;
                    }
                }
            }

            expect(differences).toBeGreaterThan(0);
        });
    });

    describe('different map sizes', () => {
        test('should generate 64x64 map', () => {
            const largeGenerator = new TilemapGenerator(64, 64, 4);
            const map = largeGenerator.generate();

            expect(map.width).toBe(64);
            expect(map.height).toBe(64);
            expect(map.tiles).toHaveLength(64);
            expect(map.tiles[0]).toHaveLength(64);
            expect(map.castlePositions).toHaveLength(4);
        });

        test('should generate 128x128 map', () => {
            const hugeGenerator = new TilemapGenerator(128, 128, 6);
            const map = hugeGenerator.generate();

            expect(map.width).toBe(128);
            expect(map.height).toBe(128);
            expect(map.tiles).toHaveLength(128);
            expect(map.tiles[0]).toHaveLength(128);
            expect(map.castlePositions).toHaveLength(6);
        });

        test('should handle minimum map size', () => {
            const smallGenerator = new TilemapGenerator(16, 16, 2);
            const map = smallGenerator.generate();

            expect(map.width).toBe(16);
            expect(map.height).toBe(16);
            expect(map.castlePositions).toHaveLength(2);
        });
    });

    describe('terrain generation', () => {
        test('should generate all tile positions with valid terrain', () => {
            const map = generator.generate();

            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    const tile = map.tiles[y][x];
                    expect(tile).toHaveProperty('x', x);
                    expect(tile).toHaveProperty('y', y);
                    expect(tile).toHaveProperty('terrain');
                    expect(tile).toHaveProperty('hasRoad');
                    expect(tile).toHaveProperty('hasCastle');
                    expect(TERRAIN_CONFIG).toHaveProperty(tile.terrain);
                }
            }
        });

        test('should generate variety of terrain types', () => {
            const map = generator.generate();
            const terrainTypes = new Set();

            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    terrainTypes.add(map.tiles[y][x].terrain);
                }
            }

            // Should have at least grassland/plains and some other terrain
            expect(terrainTypes.size).toBeGreaterThan(1);
            expect(terrainTypes.has('grassland') || terrainTypes.has('plains')).toBe(true);
        });

        test('should generate mountains', () => {
            // Generate multiple maps to ensure we get mountains
            let hasMountains = false;
            for (let attempt = 0; attempt < 5 && !hasMountains; attempt++) {
                const map = generator.generate();
                for (let y = 0; y < map.height && !hasMountains; y++) {
                    for (let x = 0; x < map.width && !hasMountains; x++) {
                        if (map.tiles[y][x].terrain === 'mountain') {
                            hasMountains = true;
                        }
                    }
                }
            }
            expect(hasMountains).toBe(true);
        });

        test('should generate water bodies', () => {
            // Generate multiple maps to ensure we get water
            let hasWater = false;
            for (let attempt = 0; attempt < 5 && !hasWater; attempt++) {
                const map = generator.generate();
                for (let y = 0; y < map.height && !hasWater; y++) {
                    for (let x = 0; x < map.width && !hasWater; x++) {
                        if (map.tiles[y][x].terrain === 'water' || map.tiles[y][x].terrain === 'lake') {
                            hasWater = true;
                        }
                    }
                }
            }
            expect(hasWater).toBe(true);
        });
    });

    describe('castle placement', () => {
        test('should place correct number of castles', () => {
            const map = generator.generate();
            expect(map.castlePositions).toHaveLength(2);

            // Count castles in tiles
            let castleCount = 0;
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    if (map.tiles[y][x].hasCastle) {
                        castleCount++;
                    }
                }
            }
            expect(castleCount).toBe(2);
        });

        test('should place castles on passable terrain', () => {
            const map = generator.generate();

            for (const castle of map.castlePositions) {
                const tile = map.tiles[castle.y][castle.x];
                expect(TERRAIN_CONFIG[tile.terrain].passable).toBe(true);
                expect(tile.hasCastle).toBe(true);
            }
        });

        test('should assign player IDs to castles', () => {
            const map = generator.generate();
            const playerIds = map.castlePositions.map(castle => castle.playerId);
            
            expect(playerIds).toContain(0);
            expect(playerIds).toContain(1);
            expect(new Set(playerIds).size).toBe(2); // Should have unique player IDs
        });

        test('should maintain minimum distance between castles', () => {
            const largeGenerator = new TilemapGenerator(64, 64, 4);
            const map = largeGenerator.generate();

            for (let i = 0; i < map.castlePositions.length; i++) {
                for (let j = i + 1; j < map.castlePositions.length; j++) {
                    const castle1 = map.castlePositions[i];
                    const castle2 = map.castlePositions[j];
                    const distance = Math.sqrt(
                        (castle1.x - castle2.x) ** 2 + (castle1.y - castle2.y) ** 2
                    );
                    
                    // Minimum distance should be at least 8 tiles
                    expect(distance).toBeGreaterThanOrEqual(8);
                }
            }
        });
    });

    describe('utility methods', () => {
        beforeEach(() => {
            generator.generate(); // Generate map for testing utilities
        });

        test('should validate positions correctly', () => {
            expect(generator.isValidPosition(0, 0)).toBe(true);
            expect(generator.isValidPosition(31, 31)).toBe(true);
            expect(generator.isValidPosition(-1, 0)).toBe(false);
            expect(generator.isValidPosition(0, -1)).toBe(false);
            expect(generator.isValidPosition(32, 0)).toBe(false);
            expect(generator.isValidPosition(0, 32)).toBe(false);
        });

        test('should get tile correctly', () => {
            const tile = generator.getTile(0, 0);
            expect(tile).toHaveProperty('x', 0);
            expect(tile).toHaveProperty('y', 0);
            expect(tile).toHaveProperty('terrain');

            const invalidTile = generator.getTile(-1, -1);
            expect(invalidTile).toBeNull();
        });

        test('should get terrain type correctly', () => {
            const terrainType = generator.getTerrainType(0, 0);
            expect(typeof terrainType).toBe('string');
            expect(TERRAIN_CONFIG).toHaveProperty(terrainType);

            const invalidTerrain = generator.getTerrainType(-1, -1);
            expect(invalidTerrain).toBeNull();
        });
    });

    describe('road generation', () => {
        test('should generate roads', () => {
            // Generate multiple maps to ensure we get roads
            let hasRoads = false;
            for (let attempt = 0; attempt < 10 && !hasRoads; attempt++) {
                const map = generator.generate();
                for (let y = 0; y < map.height && !hasRoads; y++) {
                    for (let x = 0; x < map.width && !hasRoads; x++) {
                        if (map.tiles[y][x].terrain === 'road' || map.tiles[y][x].hasRoad) {
                            hasRoads = true;
                        }
                    }
                }
            }
            expect(hasRoads).toBe(true);
        });
    });

    describe('terrain distribution', () => {
        test('should have balanced terrain distribution', () => {
            const largeGenerator = new TilemapGenerator(64, 64, 2);
            const map = largeGenerator.generate();
            
            const terrainCounts = {};
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    const terrain = map.tiles[y][x].terrain;
                    terrainCounts[terrain] = (terrainCounts[terrain] || 0) + 1;
                }
            }

            // Grassland and plains should be most common
            const grasslandCount = terrainCounts.grassland || 0;
            const plainsCount = terrainCounts.plains || 0;
            const totalBaseTerrain = grasslandCount + plainsCount;
            const totalTiles = map.width * map.height;

            // Base terrain should be at least 40% of the map
            expect(totalBaseTerrain / totalTiles).toBeGreaterThan(0.4);
        });
    });

    describe('edge cases', () => {
        test('should handle single player', () => {
            const singlePlayerGenerator = new TilemapGenerator(32, 32, 1);
            const map = singlePlayerGenerator.generate();

            expect(map.castlePositions).toHaveLength(1);
            expect(map.castlePositions[0].playerId).toBe(0);
        });

        test('should handle maximum players', () => {
            const maxPlayerGenerator = new TilemapGenerator(64, 64, 8);
            const map = maxPlayerGenerator.generate();

            expect(map.castlePositions).toHaveLength(8);
            
            const playerIds = map.castlePositions.map(castle => castle.playerId);
            expect(new Set(playerIds).size).toBe(8); // All unique player IDs
        });

        test('should handle rectangular maps', () => {
            const rectGenerator = new TilemapGenerator(48, 32, 2);
            const map = rectGenerator.generate();

            expect(map.width).toBe(48);
            expect(map.height).toBe(32);
            expect(map.tiles).toHaveLength(32);
            expect(map.tiles[0]).toHaveLength(48);
        });
    });
});