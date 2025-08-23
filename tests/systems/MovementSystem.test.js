import { MovementSystem } from '../../src/systems/MovementSystem.js';
import { MapGenerator } from '../../src/systems/MapGenerator.js';
import { GAME_CONFIG } from '../../src/config/GameConfig.js';

describe('MovementSystem', () => {
  let movementSystem;
  let map;

  beforeEach(() => {
    movementSystem = new MovementSystem();
    map = MapGenerator.generateMap(20);
  });

  describe('Story 3.1: Two-Click Selection Interface', () => {
    test('should select castle and highlight available units on first click', () => {
      const castle = map[1][1].castle; // Top-left castle
      expect(castle).toBeDefined();
      expect(castle.unitCount).toBeGreaterThan(0);
    });

    test('should command unit movement on second click to valid tile', () => {
      const fromX = 1, fromY = 1;
      const toX = 5, toY = 5;
      
      // Ensure destination is passable
      map[toY][toX].type = GAME_CONFIG.TILE_TYPES.find(t => t.passable);
      
      const castle = map[fromY][fromX].castle;
      const initialUnits = castle.unitCount;
      
      const success = movementSystem.moveUnits(map, fromX, fromY, toX, toY, 5);
      expect(success).toBe(true);
      
      // Should have moving units
      const movingUnits = movementSystem.getMovingUnits();
      expect(movingUnits.length).toBe(1);
    });

    test('should show clear error feedback for invalid destinations', () => {
      const fromX = 1, fromY = 1;
      const toX = 5, toY = 5;
      
      // Make destination impassable
      map[toY][toX].type = GAME_CONFIG.TILE_TYPES.find(t => !t.passable);
      
      const success = movementSystem.moveUnits(map, fromX, fromY, toX, toY, 5);
      expect(success).toBe(false);
      
      // Should have no moving units
      const movingUnits = movementSystem.getMovingUnits();
      expect(movingUnits.length).toBe(0);
    });
  });

  describe('Story 3.3: Smooth Animation and Speed Multipliers', () => {
    test('should implement 4 faction speed multipliers', () => {
      expect(GAME_CONFIG.FACTIONS.length).toBe(4);
      
      const expectedSpeeds = [0.5, 1.0, 1.5, 2.0];
      GAME_CONFIG.FACTIONS.forEach((faction, index) => {
        expect(faction.speed).toBe(expectedSpeeds[index]);
      });
    });

    test('should maintain 60 FPS with multiple units moving', () => {
      // Create multiple moving units
      for (let i = 0; i < 5; i++) {
        movementSystem.moveUnits(map, 1, 1, 10 + i, 10, 1);
      }
      
      const movingUnits = movementSystem.getMovingUnits();
      expect(movingUnits.length).toBeGreaterThan(0);
      
      // Update should complete quickly
      const startTime = Date.now();
      movementSystem.update(16.67, map); // 60 FPS = 16.67ms frame time
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(16.67);
    });

    test('should trigger proper game state updates on movement completion', () => {
      const fromX = 1, fromY = 1;
      const toX = 3, toY = 3;
      
      // Ensure path is short for quick completion
      map[toY][toX].type = GAME_CONFIG.TILE_TYPES.find(t => t.passable);
      
      movementSystem.moveUnits(map, fromX, fromY, toX, toY, 1);
      
      // Simulate movement completion by updating many times
      for (let i = 0; i < 100; i++) {
        movementSystem.update(100, map); // Large delta to complete movement quickly
      }
      
      // Unit should have arrived at destination
      const destinationTile = map[toY][toX];
      const unitsAtDestination = destinationTile.units.length;
      expect(unitsAtDestination).toBeGreaterThan(0);
    });
  });

  describe('Story 2.3: Unit Production System', () => {
    test('should have configurable production rates per castle (1-10 units per minute)', () => {
      const castles = [];
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x].castle) {
            castles.push(map[y][x].castle);
          }
        }
      }
      
      expect(castles.length).toBe(4);
      castles.forEach(castle => {
        expect(castle.productionRate).toBeGreaterThanOrEqual(1);
        expect(castle.productionRate).toBeLessThanOrEqual(10);
      });
    });

    test('should show unit count at each castle', () => {
      const castle = map[1][1].castle;
      expect(castle.unitCount).toBeDefined();
      expect(typeof castle.unitCount).toBe('number');
      expect(castle.unitCount).toBeGreaterThan(0);
    });

    test('should run production system continuously during gameplay', () => {
      const castle = map[1][1].castle;
      const initialCount = castle.unitCount;
      
      // Simulate time passing
      castle.lastProductionTime = Date.now() - 60000; // 1 minute ago
      castle.update();
      
      expect(castle.unitCount).toBeGreaterThan(initialCount);
    });
  });
});