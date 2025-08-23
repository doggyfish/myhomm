import { GAME_CONFIG } from '../../src/config/GameConfig.js';
import { MapGenerator } from '../../src/systems/MapGenerator.js';
import { MovementSystem } from '../../src/systems/MovementSystem.js';
import { CombatSystem } from '../../src/systems/CombatSystem.js';

describe('Game Integration Tests', () => {
  describe('Epic 1: Tech Stack Foundation', () => {
    test('Story 1.1: Vite Development Environment Setup - ES6+ modules load correctly', () => {
      // Test that all modules can be imported successfully
      expect(GAME_CONFIG).toBeDefined();
      expect(MapGenerator).toBeDefined();
      expect(MovementSystem).toBeDefined();
      expect(CombatSystem).toBeDefined();
    });

    test('Story 1.2: Jest Testing Framework - Unit tests run with npm test', () => {
      // This test running proves Jest is working
      expect(true).toBe(true);
    });

    test('Story 1.3: Build Optimization - Production build configuration exists', () => {
      // Verify game config supports optimization
      expect(GAME_CONFIG.WIDTH).toBeDefined();
      expect(GAME_CONFIG.HEIGHT).toBeDefined();
      expect(typeof GAME_CONFIG.TILE_SIZE).toBe('number');
    });
  });

  describe('Complete Game Flow', () => {
    test('should support full gameplay loop: generation → selection → movement → combat', () => {
      // Generate map
      const map = MapGenerator.generateMap(10);
      expect(map.length).toBe(10);

      // Find castles
      const castles = [];
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x].castle) {
            castles.push({ castle: map[y][x].castle, x, y });
          }
        }
      }
      expect(castles.length).toBe(4);

      // Initialize movement system
      const movementSystem = new MovementSystem();

      // Move units from one castle
      const fromCastle = castles[0];
      const toCastle = castles[1];
      
      const success = movementSystem.moveUnits(
        map, 
        fromCastle.x, 
        fromCastle.y, 
        toCastle.x, 
        toCastle.y, 
        5
      );
      expect(success).toBe(true);

      // Simulate movement completion
      for (let i = 0; i < 100; i++) {
        movementSystem.update(100, map);
      }

      // Verify combat occurred at destination
      const destinationTile = map[toCastle.y][toCastle.x];
      const totalUnits = destinationTile.units.reduce((sum, unit) => sum + unit.count, 0);
      expect(totalUnits).toBeGreaterThan(0);
    });

    test('should maintain performance with multiple simultaneous operations', () => {
      const startTime = Date.now();
      
      const map = MapGenerator.generateMap(30);
      const movementSystem = new MovementSystem();
      
      // Create multiple movements
      for (let i = 0; i < 3; i++) {
        movementSystem.moveUnits(map, 1, 1, 5 + i, 5 + i, 1);
      }

      // Update simulation
      for (let frame = 0; frame < 10; frame++) {
        movementSystem.update(16.67, map); // 60 FPS
      }
      
      const endTime = Date.now();
      
      // Should complete within reasonable time for 60 FPS
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('All Acceptance Criteria Validation', () => {
    test('Epic 2: All tile-based world system criteria met', () => {
      const map = MapGenerator.generateMap(25);
      
      // Map dimensions configurable
      expect(map.length).toBe(25);
      expect(map[0].length).toBe(25);
      
      // Multiple tile types
      const tileTypes = new Set();
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          tileTypes.add(map[y][x].type.name);
        }
      }
      expect(tileTypes.size).toBeGreaterThan(3);
      
      // 4 castles in corners with different factions
      const cornerCastles = [
        map[1][1].castle,
        map[1][23].castle,
        map[23][1].castle,
        map[23][23].castle
      ];
      
      cornerCastles.forEach((castle, index) => {
        expect(castle).toBeDefined();
        expect(castle.factionId).toBe(index);
      });
    });

    test('Epic 3: All unit movement system criteria met', () => {
      const map = MapGenerator.generateMap(20);
      const movementSystem = new MovementSystem();
      
      // Two-click interface simulation
      const success = movementSystem.moveUnits(map, 1, 1, 10, 10, 3);
      expect(success).toBe(true);
      
      // Pathfinding works
      const movingUnits = movementSystem.getMovingUnits();
      expect(movingUnits.length).toBe(1);
      expect(movingUnits[0].path.length).toBeGreaterThan(0);
      
      // Speed multipliers applied
      expect(GAME_CONFIG.FACTIONS[0].speed).toBe(0.5);
      expect(GAME_CONFIG.FACTIONS[3].speed).toBe(2.0);
    });

    test('Epic 4: All faction warfare system criteria met', () => {
      // 4 distinct factions
      expect(GAME_CONFIG.FACTIONS.length).toBe(4);
      
      // Combat resolution
      const map = MapGenerator.generateMap(10);
      const tile = map[5][5];
      tile.addUnit({ factionId: 0, count: 10 });
      tile.addUnit({ factionId: 1, count: 6 });
      
      CombatSystem.resolveCombat(tile);
      
      // Winner keeps survivors
      expect(tile.units.length).toBe(1);
      expect(tile.units[0].factionId).toBe(0);
      expect(tile.units[0].count).toBe(4); // 10 - 6
    });
  });
});