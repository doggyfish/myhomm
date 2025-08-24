import { Castle } from '../../src/entities/Castle.js';
import { GAME_CONFIG } from '../../src/config/GameConfig.js';

describe('Castle', () => {
  describe('Story 4.1: Four Distinct Factions', () => {
    test('should have 4 factions with unique colors', () => {
      expect(GAME_CONFIG.FACTIONS.length).toBe(4);
      
      const expectedColors = [0xFF0000, 0x0066FF, 0x00FF00, 0xFFFF00];
      const expectedNames = ['Red', 'Blue', 'Green', 'Yellow'];
      
      GAME_CONFIG.FACTIONS.forEach((faction, index) => {
        expect(faction.id).toBe(index);
        expect(faction.color).toBe(expectedColors[index]);
        expect(faction.name).toBe(expectedNames[index]);
      });
    });

    test('should have distinct visual appearance for units and castles per faction', () => {
      const colors = GAME_CONFIG.FACTIONS.map(f => f.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(4);
    });

    test('should apply speed multipliers properly per faction for testing', () => {
      const expectedSpeeds = [0.5, 0.75, 1.0, 1.5];
      GAME_CONFIG.FACTIONS.forEach((faction, index) => {
        expect(faction.speed).toBe(expectedSpeeds[index]);
      });
    });
  });

  describe('Castle Production', () => {
    test('should update unit count based on production rate', () => {
      const castle = new Castle(5, 5, 0, 5); // 5 units per minute
      const initialCount = castle.unitCount;
      
      // Simulate 1 minute passing
      castle.lastProductionTime = Date.now() - 60000;
      castle.update();
      
      expect(castle.unitCount).toBe(initialCount + 5);
    });

    test('should remove units correctly when sending them', () => {
      const castle = new Castle(5, 5, 0);
      castle.unitCount = 20;
      
      const removed = castle.removeUnits(8);
      expect(removed).toBe(8);
      expect(castle.unitCount).toBe(12);
    });

    test('should not remove more units than available', () => {
      const castle = new Castle(5, 5, 0);
      castle.unitCount = 5;
      
      const removed = castle.removeUnits(10);
      expect(removed).toBe(5);
      expect(castle.unitCount).toBe(0);
    });

    test('should check if can send requested units', () => {
      const castle = new Castle(5, 5, 0);
      castle.unitCount = 15;
      
      expect(castle.canSendUnits(10)).toBe(true);
      expect(castle.canSendUnits(15)).toBe(true);
      expect(castle.canSendUnits(20)).toBe(false);
    });
  });
});