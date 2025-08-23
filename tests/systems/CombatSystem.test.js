import { CombatSystem } from '../../src/systems/CombatSystem.js';
import { Tile } from '../../src/entities/Tile.js';
import { GAME_CONFIG } from '../../src/config/GameConfig.js';

describe('CombatSystem', () => {
  describe('Story 4.2: Combat Resolution System', () => {
    test('should trigger combat when enemy units meet on same tile', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Add units from different factions
      tile.addUnit({ factionId: 0, count: 10 });
      tile.addUnit({ factionId: 1, count: 8 });
      
      const initialUnitCount = tile.units.length;
      expect(initialUnitCount).toBe(2);
      
      CombatSystem.resolveCombat(tile);
      
      // After combat, should have only one faction remaining
      const factions = tile.getAllFactions();
      expect(factions.length).toBeLessThanOrEqual(1);
    });

    test('should use balanced mathematical formulas for combat resolution', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Faction 0 has more units, should win
      tile.addUnit({ factionId: 0, count: 15 });
      tile.addUnit({ factionId: 1, count: 8 });
      
      CombatSystem.resolveCombat(tile);
      
      // Winning faction should be faction 0
      expect(tile.units.length).toBe(1);
      expect(tile.units[0].factionId).toBe(0);
      
      // Survivors should be difference between winning and losing forces
      expect(tile.units[0].count).toBe(15 - 8); // 7 survivors
    });

    test('should retain survivors based on unit count differential', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      tile.addUnit({ factionId: 0, count: 20 });
      tile.addUnit({ factionId: 1, count: 12 });
      tile.addUnit({ factionId: 2, count: 5 });
      
      CombatSystem.resolveCombat(tile);
      
      // Faction 0 should win with 20 - (12 + 5) = 3 survivors
      expect(tile.units.length).toBe(1);
      expect(tile.units[0].factionId).toBe(0);
      expect(tile.units[0].count).toBe(3);
    });

    test('should eliminate losing units from the game world', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      tile.addUnit({ factionId: 0, count: 10 });
      tile.addUnit({ factionId: 1, count: 7 });
      
      CombatSystem.resolveCombat(tile);
      
      // Only winning faction should remain
      const remainingFactions = tile.getAllFactions();
      expect(remainingFactions).toEqual([0]);
    });
  });

  describe('Story 4.3: Unit Merging and Visual Feedback', () => {
    test('should merge same-faction units when reaching same destination', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Add multiple units of same faction
      tile.addUnit({ factionId: 1, count: 5 });
      tile.addUnit({ factionId: 1, count: 3 });
      tile.addUnit({ factionId: 1, count: 7 });
      
      CombatSystem.resolveCombat(tile);
      
      // Should merge into single unit
      expect(tile.units.length).toBe(1);
      expect(tile.units[0].factionId).toBe(1);
      expect(tile.units[0].count).toBe(15); // 5 + 3 + 7
    });

    test('should display combined unit count correctly after merging', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      tile.addUnit({ factionId: 2, count: 8 });
      tile.addUnit({ factionId: 2, count: 12 });
      
      const totalBefore = tile.getTotalUnitsForFaction(2);
      expect(totalBefore).toBe(20);
      
      CombatSystem.resolveCombat(tile);
      
      const totalAfter = tile.getTotalUnitsForFaction(2);
      expect(totalAfter).toBe(20);
      expect(tile.units.length).toBe(1);
    });

    test('should update game state correctly after all faction interactions', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Mixed scenario: same faction merging and combat
      tile.addUnit({ factionId: 0, count: 5 });
      tile.addUnit({ factionId: 0, count: 3 }); // Same faction - should merge first
      tile.addUnit({ factionId: 1, count: 6 }); // Different faction - combat
      
      CombatSystem.resolveCombat(tile);
      
      // Faction 0 should have 8 total, faction 1 has 6, so faction 0 wins with 2 survivors
      expect(tile.units.length).toBe(1);
      expect(tile.units[0].factionId).toBe(0);
      expect(tile.units[0].count).toBe(2);
    });
  });
});