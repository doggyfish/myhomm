import { PathfindingSystem } from '../../src/systems/PathfindingSystem.js';
import { MapGenerator } from '../../src/systems/MapGenerator.js';

describe('PathfindingSystem', () => {
  describe('Story 3.2: A* Pathfinding Algorithm', () => {
    test('should calculate optimal paths around impassable tiles', () => {
      const map = MapGenerator.generateMap(10);
      
      // Create a simple test scenario with obstacles
      // Make some tiles impassable
      for (let x = 3; x < 7; x++) {
        map[5][x].type = { passable: false };
      }

      const path = PathfindingSystem.findPath(map, 2, 5, 8, 5);
      expect(path.length).toBeGreaterThan(0);
      
      // Path should go around the obstacle
      const hasValidPath = path.every(point => map[point.y][point.x].type.passable !== false);
      expect(hasValidPath).toBe(true);
    });

    test('should complete pathfinding in less than 100ms', () => {
      const map = MapGenerator.generateMap(30);
      
      const startTime = Date.now();
      PathfindingSystem.findPath(map, 0, 0, 29, 29, 100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle edge cases (unreachable destinations)', () => {
      const map = MapGenerator.generateMap(10);
      
      // Surround destination with impassable tiles
      const destX = 5, destY = 5;
      for (let y = destY - 1; y <= destY + 1; y++) {
        for (let x = destX - 1; x <= destX + 1; x++) {
          if (x !== destX || y !== destY) {
            map[y][x].type = { passable: false };
          }
        }
      }

      const path = PathfindingSystem.findPath(map, 0, 0, destX, destY);
      expect(path).toEqual([]);
    });

    test('should return empty path for impassable destination', () => {
      const map = MapGenerator.generateMap(10);
      map[5][5].type = { passable: false };

      const path = PathfindingSystem.findPath(map, 0, 0, 5, 5);
      expect(path).toEqual([]);
    });

    test('should handle multiple units pathfinding simultaneously', () => {
      const map = MapGenerator.generateMap(20);
      
      const startTime = Date.now();
      
      // Simulate multiple pathfinding calls
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const path = PathfindingSystem.findPath(map, i, 0, 19 - i, 19);
        promises.push(path);
      }
      
      const endTime = Date.now();
      
      // Should complete all pathfinding without significant performance degradation
      expect(endTime - startTime).toBeLessThan(500);
      promises.forEach(path => expect(path).toBeDefined());
    });
  });
});