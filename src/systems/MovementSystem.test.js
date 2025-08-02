import { MovementSystem } from './MovementSystem.js';
import { Pathfinding } from './Pathfinding.js';
import { Army } from '../entities/Army.js';
import { Player } from '../game/Player.js';
import { CONFIG } from '../config/ConfigurationManager.js';

describe('MovementSystem', () => {
    let movementSystem;
    let mapData;
    let army;
    let player;

    beforeEach(() => {
        // Create simple 5x5 map for testing
        mapData = {
            width: 5,
            height: 5,
            tiles: []
        };
        
        // Fill with grassland by default
        for (let y = 0; y < 5; y++) {
            mapData.tiles[y] = [];
            for (let x = 0; x < 5; x++) {
                mapData.tiles[y][x] = { 
                    x, 
                    y, 
                    terrain: 'grassland',
                    hasRoad: false,
                    hasCastle: false
                };
            }
        }
        
        movementSystem = new MovementSystem(mapData);
        player = new Player('p1', 'Test', 'human', false);
        army = new Army('army1', player);
        
        // Add units to give army speed
        army.addUnits('swordsman', 10); // speed 10
        army.addUnits('archer', 5); // speed 5
        // Army speed should be (10 + 5) / 2 = 7.5
    });

    describe('movement calculations', () => {
        test('should calculate correct time for grassland movement', () => {
            const armySpeed = 7.5;
            const terrain = { movementModifier: 1.0 };
            
            const time = movementSystem.calculateTileTime(armySpeed, terrain);
            
            // baseTimePerTile (1000ms) / (7.5 * 1.0) = 133.33ms
            expect(time).toBeCloseTo(133.33, 2);
        });

        test('should calculate correct time for road movement', () => {
            const armySpeed = 7.5;
            const terrain = { movementModifier: 2.0 }; // Road modifier
            
            const time = movementSystem.calculateTileTime(armySpeed, terrain);
            
            // baseTimePerTile (1000ms) / (7.5 * 2.0) = 66.67ms
            expect(time).toBeCloseTo(66.67, 2);
        });

        test('should calculate correct time for swamp movement', () => {
            const armySpeed = 7.5;
            const terrain = { movementModifier: 0.5 }; // Swamp modifier
            
            const time = movementSystem.calculateTileTime(armySpeed, terrain);
            
            // baseTimePerTile (1000ms) / (7.5 * 0.5) = 266.67ms
            expect(time).toBeCloseTo(266.67, 2);
        });

        test('should handle zero speed gracefully', () => {
            const terrain = { movementModifier: 1.0 };
            const time = movementSystem.calculateTileTime(0, terrain);
            
            expect(time).toBe(Infinity);
        });

        test('should handle zero terrain modifier gracefully', () => {
            const armySpeed = 7.5;
            const terrain = { movementModifier: 0 };
            
            const time = movementSystem.calculateTileTime(armySpeed, terrain);
            
            expect(time).toBe(Infinity);
        });
    });

    describe('path time calculations', () => {
        test('should calculate total time for multi-terrain path', () => {
            // Set up path with different terrains
            mapData.tiles[1][1].terrain = 'road';
            mapData.tiles[2][1].terrain = 'swamp';
            
            const path = [
                { x: 1, y: 0 }, // grassland
                { x: 1, y: 1 }, // road
                { x: 1, y: 2 }, // swamp
            ];
            
            const armySpeed = 7.5;
            const totalTime = movementSystem.calculatePathTime(path, armySpeed);
            
            // grassland: 1000 / (7.5 * 1.0) = 133.33ms
            // road: 1000 / (7.5 * 2.0) = 66.67ms
            // swamp: 1000 / (7.5 * 0.5) = 266.67ms
            // Total: 133.33 + 66.67 + 266.67 = 466.67ms
            expect(totalTime).toBeCloseTo(466.67, 1);
        });

        test('should return 0 for empty path', () => {
            const totalTime = movementSystem.calculatePathTime([], 7.5);
            expect(totalTime).toBe(0);
        });

        test('should handle negative speed', () => {
            const path = [{ x: 1, y: 0 }];
            const totalTime = movementSystem.calculatePathTime(path, -1);
            expect(totalTime).toBe(0);
        });
    });

    describe('army movement', () => {
        beforeEach(() => {
            army.setTilePosition(0, 0);
        });

        test('should start movement successfully', () => {
            const result = movementSystem.startMovement(army, { x: 3, y: 0 });
            
            expect(result.success).toBe(true);
            expect(result.path).toHaveLength(3); // 3 tiles to move
            expect(result.distance).toBe(3);
            expect(result.estimatedTime).toBeCloseTo(400, 0); // 3 * 133.33ms
        });

        test('should fail to move to impassable terrain', () => {
            mapData.tiles[2][2].terrain = 'mountain'; // Impassable
            
            const result = movementSystem.startMovement(army, { x: 2, y: 2 });
            
            expect(result.success).toBe(false);
            expect(result.reason).toBe('No valid path');
        });

        test('should track moving armies', () => {
            expect(movementSystem.isMoving(army.id)).toBe(false);
            
            movementSystem.startMovement(army, { x: 2, y: 0 });
            
            expect(movementSystem.isMoving(army.id)).toBe(true);
        });

        test('should update movement progress', () => {
            movementSystem.startMovement(army, { x: 3, y: 0 });
            
            // Simulate time passing
            movementSystem.update(100); // 100ms
            
            const progress = movementSystem.getMovementProgress(army.id);
            expect(progress).not.toBeNull();
            expect(progress.totalSteps).toBe(3);
            expect(progress.elapsedTime).toBe(100);
        });

        test('should complete movement', () => {
            movementSystem.startMovement(army, { x: 1, y: 0 });
            
            // Simulate enough time to complete movement
            movementSystem.update(150); // More than 133.33ms
            
            expect(movementSystem.isMoving(army.id)).toBe(false);
            
            const position = army.getComponent('position');
            expect(position.tileX).toBe(1);
            expect(position.tileY).toBe(0);
        });

        test('should stop movement on command', () => {
            movementSystem.startMovement(army, { x: 3, y: 0 });
            
            expect(movementSystem.isMoving(army.id)).toBe(true);
            
            movementSystem.stopMovement(army.id);
            
            expect(movementSystem.isMoving(army.id)).toBe(false);
        });
    });

    describe('pathfinding integration', () => {
        test('should find path around obstacles', () => {
            // Create barrier - shorter wall
            mapData.tiles[2][2].terrain = 'mountain';
            
            army.setTilePosition(1, 2);
            
            const result = movementSystem.startMovement(army, { x: 3, y: 2 });
            
            expect(result.success).toBe(true);
            expect(result.path.length).toBeGreaterThan(2); // Must go around the obstacle
        });

        test('should check reachability', () => {
            // Create isolated area with vertical wall
            for (let i = 0; i < 5; i++) {
                mapData.tiles[i][2].terrain = 'water'; // Impassable vertical line
            }
            
            const reachable = movementSystem.isReachable(
                { x: 0, y: 0 },
                { x: 4, y: 0 }
            );
            
            expect(reachable).toBe(false);
        });

        test('should use roads for faster movement', () => {
            // Test time calculation with roads
            const roadPath = [
                { x: 0, y: 1 },
                { x: 0, y: 2 },
                { x: 0, y: 3 }
            ];
            
            // Set up road tiles
            mapData.tiles[1][0].terrain = 'road';
            mapData.tiles[2][0].terrain = 'road';
            mapData.tiles[3][0].terrain = 'road';
            
            const armySpeed = 7.5;
            const timeWithRoads = movementSystem.calculatePathTime(roadPath, armySpeed);
            
            // 3 road tiles: 3 * (1000 / (7.5 * 2.0)) = 3 * 66.67 = 200ms
            expect(timeWithRoads).toBeCloseTo(200, 0);
        });
    });

    describe('interpolation', () => {
        test('should provide interpolated position during movement', () => {
            army.setTilePosition(0, 0);
            movementSystem.startMovement(army, { x: 1, y: 0 });
            
            // Partial movement
            movementSystem.update(50); // 50ms into 133.33ms movement
            
            const interpolated = movementSystem.getInterpolatedPosition(army);
            
            // Should be partway between tiles
            expect(interpolated.x).toBeGreaterThan(0);
            expect(interpolated.x).toBeLessThan(64); // Full tile is 64 units
            expect(interpolated.y).toBe(0);
        });

        test('should return current position when not moving', () => {
            army.setTilePosition(2, 3);
            
            const interpolated = movementSystem.getInterpolatedPosition(army);
            
            expect(interpolated.x).toBe(128); // 2 * 64
            expect(interpolated.y).toBe(192); // 3 * 64
        });
    });

    describe('terrain handling', () => {
        test('should handle all terrain types correctly', () => {
            const terrainTimes = {
                'grassland': 133.33,  // modifier 1.0
                'road': 66.67,        // modifier 2.0
                'swamp': 266.67,      // modifier 0.5
                'forest': 266.67,     // modifier 0.5
                'desert': 199.00,     // modifier 0.67 -> 1000/(7.5*0.67) = 199
                'snow': 199.00,       // modifier 0.67 -> 1000/(7.5*0.67) = 199
                'plains': 133.33,     // modifier 1.0
                'lake': 266.67        // modifier 0.5
            };
            
            const armySpeed = 7.5;
            
            for (const [terrainType, expectedTime] of Object.entries(terrainTimes)) {
                mapData.tiles[0][0].terrain = terrainType;
                const terrain = movementSystem.getTerrain(0, 0);
                const time = movementSystem.calculateTileTime(armySpeed, terrain);
                
                expect(time).toBeCloseTo(expectedTime, 1);
            }
        });

        test('should block movement on impassable terrain', () => {
            const impassableTerrains = ['mountain', 'water'];
            
            for (const terrain of impassableTerrains) {
                mapData.tiles[1][1].terrain = terrain;
                army.setTilePosition(0, 1);
                
                const result = movementSystem.startMovement(army, { x: 2, y: 1 });
                
                // Should find alternate path or fail
                if (result.success) {
                    // Check it didn't go through the impassable tile
                    expect(result.path).not.toContainEqual({ x: 1, y: 1 });
                }
            }
        });
    });
});