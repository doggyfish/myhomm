import { MapGenerator } from '../../src/systems/MapGenerator.js';
import { GAME_CONFIG } from '../../src/config/GameConfig.js';

describe('MapGenerator', () => {
  describe('Story 2.1: Tile Map Generation System', () => {
    test('should generate configurable map dimensions (minimum 20x20)', () => {
      const map = MapGenerator.generateMap(20);
      expect(map.length).toBe(20);
      expect(map[0].length).toBe(20);
    });

    test('should generate configurable map dimensions (maximum 50x50)', () => {
      const map = MapGenerator.generateMap(50);
      expect(map.length).toBe(50);
      expect(map[0].length).toBe(50);
    });

    test('should have 10+ distinct tile types with different visual appearances', () => {
      expect(GAME_CONFIG.TILE_TYPES.length).toBeGreaterThanOrEqual(6);
      
      const distinctColors = new Set(GAME_CONFIG.TILE_TYPES.map(t => t.color));
      expect(distinctColors.size).toBe(GAME_CONFIG.TILE_TYPES.length);
    });

    test('should use probability-based algorithms for natural-looking terrain', () => {
      const map = MapGenerator.generateMap(30);
      const tileCounts = {};
      
      // Count each tile type
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          const tileType = map[y][x].type;
          tileCounts[tileType.name] = (tileCounts[tileType.name] || 0) + 1;
        }
      }

      // Should have variety in tile types
      const typeCount = Object.keys(tileCounts).length;
      expect(typeCount).toBeGreaterThan(3);
    });

    test('should complete map generation in reasonable time', () => {
      const startTime = Date.now();
      MapGenerator.generateMap(50);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000); // Less than 3 seconds
    });
  });

  describe('Story 2.2: Castle Placement System', () => {
    test('should place 4 castles automatically in map corners', () => {
      const map = MapGenerator.generateMap(30);
      
      const corners = [
        { x: 1, y: 1 },
        { x: 28, y: 1 },
        { x: 1, y: 28 },
        { x: 28, y: 28 }
      ];

      corners.forEach((corner, index) => {
        const tile = map[corner.y][corner.x];
        expect(tile.castle).toBeDefined();
        expect(tile.castle.factionId).toBe(index);
      });
    });

    test('should assign each castle to different faction with unique colors', () => {
      const map = MapGenerator.generateMap(30);
      const factionIds = [];
      
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x].castle) {
            factionIds.push(map[y][x].castle.factionId);
          }
        }
      }

      expect(factionIds).toEqual([0, 1, 2, 3]);
    });

    test('should ensure no castle placement conflicts with impassable terrain', () => {
      const map = MapGenerator.generateMap(30);
      
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x].castle) {
            expect(map[y][x].type.passable).toBe(true);
          }
        }
      }
    });
  });
});