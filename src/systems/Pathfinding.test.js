import { Pathfinding } from './Pathfinding.js';

describe('Pathfinding', () => {
    let pathfinding;
    let mapData;

    beforeEach(() => {
        // Create 5x5 test map
        mapData = {
            width: 5,
            height: 5,
            tiles: []
        };
        
        // Fill with grassland
        for (let y = 0; y < 5; y++) {
            mapData.tiles[y] = [];
            for (let x = 0; x < 5; x++) {
                mapData.tiles[y][x] = { 
                    x, 
                    y, 
                    terrain: 'grassland'
                };
            }
        }
        
        pathfinding = new Pathfinding(mapData);
    });

    describe('basic pathfinding', () => {
        test('should find straight horizontal path', () => {
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 3, y: 0 });
            
            expect(path).toHaveLength(4);
            expect(path[0]).toEqual({ x: 0, y: 0 });
            expect(path[3]).toEqual({ x: 3, y: 0 });
        });

        test('should find straight vertical path', () => {
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 0, y: 3 });
            
            expect(path).toHaveLength(4);
            expect(path[0]).toEqual({ x: 0, y: 0 });
            expect(path[3]).toEqual({ x: 0, y: 3 });
        });

        test('should find diagonal path using Manhattan movement', () => {
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 2, y: 2 });
            
            expect(path).toHaveLength(5); // 2 right + 2 down + start
            expect(path[0]).toEqual({ x: 0, y: 0 });
            expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
        });

        test('should return empty path for invalid positions', () => {
            const path = pathfinding.findPath({ x: -1, y: 0 }, { x: 3, y: 0 });
            expect(path).toEqual([]);
            
            const path2 = pathfinding.findPath({ x: 0, y: 0 }, { x: 10, y: 0 });
            expect(path2).toEqual([]);
        });

        test('should return empty path to impassable goal', () => {
            mapData.tiles[2][2].terrain = 'mountain';
            
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 2, y: 2 });
            expect(path).toEqual([]);
        });
    });

    describe('obstacle avoidance', () => {
        test('should find path around single obstacle', () => {
            mapData.tiles[1][1].terrain = 'mountain';
            
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 2, y: 2 });
            
            expect(path.length).toBeGreaterThan(0);
            expect(path).not.toContainEqual({ x: 1, y: 1 });
            expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
        });

        test('should find path around wall', () => {
            // Create vertical wall with gap
            mapData.tiles[0][2].terrain = 'mountain';
            mapData.tiles[1][2].terrain = 'mountain';
            mapData.tiles[2][2].terrain = 'mountain';
            // Leave gap at tiles[3][2]
            
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 0, y: 4 });
            
            expect(path.length).toBeGreaterThan(4); // Must go around through the gap
            expect(path[path.length - 1]).toEqual({ x: 0, y: 4 });
        });

        test('should return empty path when blocked', () => {
            // Surround target with mountains
            mapData.tiles[1][1].terrain = 'mountain';
            mapData.tiles[1][2].terrain = 'mountain';
            mapData.tiles[1][3].terrain = 'mountain';
            mapData.tiles[2][1].terrain = 'mountain';
            mapData.tiles[2][3].terrain = 'mountain';
            mapData.tiles[3][1].terrain = 'mountain';
            mapData.tiles[3][2].terrain = 'mountain';
            mapData.tiles[3][3].terrain = 'mountain';
            
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 2, y: 2 });
            expect(path).toEqual([]);
        });
    });

    describe('terrain cost calculation', () => {
        test('should calculate correct movement costs', () => {
            // Test different terrain costs
            const grassCost = pathfinding.getMovementCost(
                { x: 0, y: 0 }, 
                { x: 1, y: 0 }
            );
            expect(grassCost).toBe(1.0); // 1 / 1.0
            
            mapData.tiles[0][1].terrain = 'road';
            const roadCost = pathfinding.getMovementCost(
                { x: 0, y: 0 }, 
                { x: 1, y: 0 }
            );
            expect(roadCost).toBe(0.5); // 1 / 2.0
            
            mapData.tiles[0][1].terrain = 'swamp';
            const swampCost = pathfinding.getMovementCost(
                { x: 0, y: 0 }, 
                { x: 1, y: 0 }
            );
            expect(swampCost).toBe(2.0); // 1 / 0.5
        });

        test('should return infinity for impassable terrain', () => {
            mapData.tiles[0][1].terrain = 'mountain';
            
            const cost = pathfinding.getMovementCost(
                { x: 0, y: 0 }, 
                { x: 1, y: 0 }
            );
            
            expect(cost).toBe(Infinity);
        });

        test('should prefer roads over normal terrain', () => {
            // Create two paths: direct and road
            mapData.tiles[0][1].terrain = 'road';
            mapData.tiles[0][2].terrain = 'road';
            mapData.tiles[0][3].terrain = 'road';
            mapData.tiles[1][3].terrain = 'road';
            mapData.tiles[2][3].terrain = 'road';
            
            const path = pathfinding.findPath({ x: 0, y: 0 }, { x: 2, y: 3 });
            
            // Should prefer the longer road path over direct path
            const hasRoad = path.some(pos => {
                const tile = mapData.tiles[pos.y][pos.x];
                return tile.terrain === 'road';
            });
            
            expect(hasRoad).toBe(true);
        });
    });

    describe('path time calculation', () => {
        test('should calculate correct time for uniform terrain', () => {
            const path = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 }
            ];
            
            const time = pathfinding.calculatePathTime(path, 10);
            
            // Skip first position, 2 tiles at speed 10 on grassland
            // 1000 / (10 * 1.0) = 100ms per tile
            expect(time).toBe(200);
        });

        test('should calculate correct time for mixed terrain', () => {
            mapData.tiles[0][1].terrain = 'road';
            mapData.tiles[0][2].terrain = 'swamp';
            
            const path = [
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // road
                { x: 2, y: 0 }  // swamp
            ];
            
            const time = pathfinding.calculatePathTime(path, 10);
            
            // road: 1000 / (10 * 2.0) = 50ms
            // swamp: 1000 / (10 * 0.5) = 200ms
            expect(time).toBe(250);
        });
    });

    describe('edge cases', () => {
        test('should handle start equals goal', () => {
            const path = pathfinding.findPath({ x: 2, y: 2 }, { x: 2, y: 2 });
            
            expect(path).toHaveLength(1);
            expect(path[0]).toEqual({ x: 2, y: 2 });
        });

        test('should handle large map efficiently', () => {
            // Create larger map
            const largeMap = {
                width: 50,
                height: 50,
                tiles: []
            };
            
            for (let y = 0; y < 50; y++) {
                largeMap.tiles[y] = [];
                for (let x = 0; x < 50; x++) {
                    largeMap.tiles[y][x] = { 
                        x, 
                        y, 
                        terrain: 'grassland'
                    };
                }
            }
            
            const largePathfinding = new Pathfinding(largeMap);
            
            const startTime = Date.now();
            const path = largePathfinding.findPath({ x: 0, y: 0 }, { x: 49, y: 49 });
            const endTime = Date.now();
            
            expect(path.length).toBeGreaterThan(0);
            expect(endTime - startTime).toBeLessThan(100); // Should be fast
        });
    });
});