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

    test('should handle mutual destruction when forces are equal', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Equal forces should eliminate each other
      tile.addUnit({ factionId: 0, count: 8 });
      tile.addUnit({ factionId: 1, count: 8 });

      CombatSystem.resolveCombat(tile);

      // All units should be eliminated
      expect(tile.units.length).toBe(0);
      const remainingFactions = tile.getAllFactions();
      expect(remainingFactions).toEqual([]);
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

  describe('Reinforced Castle Combat System', () => {
    test('should handle two-phase combat: attackers vs reinforcements, then vs castle', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Setup: Green castle with reinforcements, Yellow attackers
      const mockCastle = { factionId: 2, unitCount: 10, x: 5, y: 5 };
      tile.setCastle(mockCastle);
      tile.addUnit({ factionId: 2, count: 4 }); // Green reinforcements
      tile.addUnit({ factionId: 3, count: 8 }); // Yellow attackers
      
      CombatSystem.resolveCombat(tile);
      
      // Phase 1: 8 Yellow vs 4 Green reinforcements → Yellow wins with 4 survivors
      // Phase 2: 4 Yellow vs 10 Green castle → Castle wins
      expect(tile.castle.factionId).toBe(2); // Castle should remain Green
      expect(tile.units.length).toBe(0); // No units left on tile
      expect(tile.castle.unitCount).toBe(6); // 10 - 4 = 6 remaining defenders
    });

    test('should conquer castle when attackers win both phases', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Setup: Weak castle with reinforcements, strong attackers
      const mockCastle = { factionId: 2, unitCount: 3, x: 5, y: 5 };
      tile.setCastle(mockCastle);
      tile.addUnit({ factionId: 2, count: 2 }); // Green reinforcements
      tile.addUnit({ factionId: 3, count: 10 }); // Yellow attackers
      
      CombatSystem.resolveCombat(tile);
      
      // Phase 1: 10 Yellow vs 2 Green reinforcements → Yellow wins with 8 survivors
      // Phase 2: 8 Yellow vs 3 Green castle → Yellow conquers with 5 survivors
      expect(tile.castle.factionId).toBe(3); // Castle conquered by Yellow
      expect(tile.castle.unitCount).toBe(Math.max(1, 5)); // 5 survivors in castle
      expect(tile.units.length).toBe(0); // No units on tile
    });

    test('should handle multi-faction attacks with proportional survivors', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Setup: Green castle, Red+Blue attackers
      const mockCastle = { factionId: 2, unitCount: 5, x: 5, y: 5 };
      tile.setCastle(mockCastle);
      tile.addUnit({ factionId: 2, count: 3 }); // Green reinforcements
      tile.addUnit({ factionId: 0, count: 6 }); // Red attackers (60%)
      tile.addUnit({ factionId: 1, count: 4 }); // Blue attackers (40%)
      
      CombatSystem.resolveCombat(tile);
      
      // Phase 1: 10 attackers vs 3 reinforcements → 7 survivors
      // Survivors distributed proportionally: Red gets 4, Blue gets 3
      // This will proceed to Phase 2 with regular combat resolution
      expect(tile.castle.factionId).not.toBe(2); // Castle should be conquered
    });

    test('should defend castle when reinforcements defeat attackers', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Setup: Strong reinforcements vs weak attackers
      const mockCastle = { factionId: 2, unitCount: 8, x: 5, y: 5 };
      tile.setCastle(mockCastle);
      tile.addUnit({ factionId: 2, count: 12 }); // Strong Green reinforcements
      tile.addUnit({ factionId: 3, count: 7 }); // Weak Yellow attackers
      
      CombatSystem.resolveCombat(tile);
      
      // Phase 1: 7 Yellow vs 12 Green reinforcements → Reinforcements win with 5 survivors
      // Survivors merge back into castle: 8 + 5 = 13
      expect(tile.castle.factionId).toBe(2); // Castle remains Green
      expect(tile.castle.unitCount).toBe(13); // Original castle + surviving reinforcements
      expect(tile.units.length).toBe(0); // No units on tile
    });

    test('should fallback to regular combat when no reinforcements present', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Setup: Castle with no reinforcements
      const mockCastle = { factionId: 2, unitCount: 8, x: 5, y: 5 };
      tile.setCastle(mockCastle);
      tile.addUnit({ factionId: 3, count: 12 }); // Direct castle attack
      
      CombatSystem.resolveCombat(tile);
      
      // Should use regular combat: 12 Yellow vs 8 Green castle → Yellow wins
      expect(tile.castle.factionId).toBe(3); // Castle conquered
      expect(tile.units.length).toBe(0); // No units on tile
    });

    test('should handle three-way multi-faction castle attack', () => {
      const tileType = GAME_CONFIG.TILE_TYPES[0];
      const tile = new Tile(5, 5, tileType);
      
      // Setup: Green castle vs Red+Blue+Yellow attackers
      const mockCastle = { factionId: 2, unitCount: 6, x: 5, y: 5 };
      tile.setCastle(mockCastle);
      tile.addUnit({ factionId: 2, count: 2 }); // Green reinforcements
      tile.addUnit({ factionId: 0, count: 4 }); // Red attackers
      tile.addUnit({ factionId: 1, count: 3 }); // Blue attackers  
      tile.addUnit({ factionId: 3, count: 5 }); // Yellow attackers
      
      CombatSystem.resolveCombat(tile);
      
      // Phase 1: 12 total attackers vs 2 reinforcements → 10 survivors
      // Phase 2: 10 attackers vs 6 castle → Attackers win
      // Castle should be conquered by the faction with highest survivor count
      expect(tile.castle.factionId).not.toBe(2); // Castle conquered
      expect(tile.units.length).toBe(0); // No units on tile
    });
  });
});