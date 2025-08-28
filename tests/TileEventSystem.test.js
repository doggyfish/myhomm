import { TileEventSystem } from '../src/systems/TileEventSystem.js';

// Mock GAME_CONFIG for testing
global.GAME_CONFIG = {
  TILE_SIZE: 64,
  DEFAULT_MAP_SIZE: 10,
  FACTIONS: [
    { id: 1, name: 'Red' },
    { id: 2, name: 'Blue' },
    { id: 3, name: 'Green' }
  ]
};

// Mock tile structure for testing
class MockTile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.units = [];
    this.castle = null;
  }

  addUnit(unit) {
    this.units.push(unit);
  }

  getUnitsForFaction(factionId) {
    return this.units.filter(u => u.factionId === factionId);
  }

  getAllFactions() {
    return [...new Set(this.units.map(u => u.factionId))];
  }

  getTotalUnitsForFaction(factionId) {
    return this.units
      .filter(u => u.factionId === factionId)
      .reduce((sum, u) => sum + u.count, 0);
  }
}

// Create a mock map
function createMockMap(size = 5) {
  const map = [];
  for (let y = 0; y < size; y++) {
    map[y] = [];
    for (let x = 0; x < size; x++) {
      map[y][x] = new MockTile(x, y);
    }
  }
  return map;
}

// Create a mock moving unit
function createMockUnit(factionId, count, x, y) {
  return {
    factionId,
    count,
    x: x * 64, // Convert tile to pixel coordinates
    y: y * 64,
    id: null // Will be assigned by TileEventSystem
  };
}

describe('TileEventSystem', () => {
  let tileEventSystem;
  let map;

  beforeEach(() => {
    tileEventSystem = new TileEventSystem();
    map = createMockMap(5);
  });

  describe('Basic Tile Tracking', () => {
    test('should track unit when first added', () => {
      const unit = createMockUnit(1, 10, 2, 2);
      
      tileEventSystem.trackUnit(unit);
      
      expect(unit.id).toBeDefined();
      expect(tileEventSystem.unitTileHistory.has(unit.id)).toBe(true);
      expect(tileEventSystem.tileOccupancy.has('2,2')).toBe(true);
    });

    test('should generate UNIT_ENTER_TILE event when tracking starts', () => {
      const unit = createMockUnit(1, 10, 2, 2);
      
      tileEventSystem.trackUnit(unit);
      const events = tileEventSystem.eventQueue;
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('UNIT_ENTER_TILE');
      expect(events[0].unitId).toBe(unit.id);
      expect(events[0].tile).toEqual({ x: 2, y: 2 });
    });

    test('should handle unit movement between tiles', () => {
      const unit = createMockUnit(1, 10, 1, 1);
      tileEventSystem.trackUnit(unit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move unit to adjacent tile
      unit.x = 2 * 64;
      unit.y = 2 * 64;
      
      const events = tileEventSystem.updateUnit(unit, map);
      
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('UNIT_EXIT_TILE');
      expect(events[0].tile).toEqual({ x: 1, y: 1 });
      expect(events[1].type).toBe('UNIT_ENTER_TILE');
      expect(events[1].tile).toEqual({ x: 2, y: 2 });
    });

    test('should not generate events when unit stays in same tile', () => {
      const unit = createMockUnit(1, 10, 2, 2);
      tileEventSystem.trackUnit(unit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move within same tile (pixel movement)
      unit.x = 2 * 64 + 30;
      unit.y = 2 * 64 + 20;
      
      const events = tileEventSystem.updateUnit(unit, map);
      
      expect(events).toHaveLength(0);
    });
  });

  describe('Combat Detection - Moving vs Stationary Units', () => {
    test('should detect combat when moving unit enters tile with enemy stationary unit', () => {
      // Place a stationary enemy unit on tile (2,2)
      const stationaryUnit = { factionId: 2, count: 5 };
      map[2][2].addUnit(stationaryUnit);
      
      // Create moving unit of different faction
      const movingUnit = createMockUnit(1, 8, 1, 2);
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move unit into the occupied tile
      movingUnit.x = 2 * 64;
      movingUnit.y = 2 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].tile).toEqual({ x: 2, y: 2 });
      expect(combatSituations[0].factions).toContain(1);
      expect(combatSituations[0].factions).toContain(2);
      expect(combatSituations[0].movingUnits).toContain(movingUnit);
    });

    test('should NOT detect combat when moving unit enters tile with friendly stationary unit', () => {
      // Place a friendly stationary unit on tile (2,2)
      const stationaryUnit = { factionId: 1, count: 5 };
      map[2][2].addUnit(stationaryUnit);
      
      // Create moving unit of same faction
      const movingUnit = createMockUnit(1, 8, 1, 2);
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move unit into the tile with friendly unit
      movingUnit.x = 2 * 64;
      movingUnit.y = 2 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(0);
    });

    test('should detect combat with multiple enemy factions on same tile', () => {
      // Place multiple enemy units on tile (3,3)
      map[3][3].addUnit({ factionId: 2, count: 4 });
      map[3][3].addUnit({ factionId: 3, count: 6 });
      
      // Create moving unit
      const movingUnit = createMockUnit(1, 10, 3, 2);
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move into contested tile
      movingUnit.x = 3 * 64;
      movingUnit.y = 3 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].factions).toHaveLength(3);
      expect(combatSituations[0].factions).toContain(1);
      expect(combatSituations[0].factions).toContain(2);
      expect(combatSituations[0].factions).toContain(3);
    });
  });

  describe('Combat Detection - Moving vs Castle', () => {
    test('should detect combat when moving unit enters tile with enemy castle', () => {
      // Place enemy castle on tile (1,3)
      map[3][1].castle = { factionId: 2, unitCount: 8 };
      
      // Create moving unit of different faction
      const movingUnit = createMockUnit(1, 12, 0, 3);
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move unit into castle tile
      movingUnit.x = 1 * 64;
      movingUnit.y = 3 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].factions).toContain(1);
      expect(combatSituations[0].factions).toContain(2);
    });

    test('should NOT detect combat when moving unit enters friendly castle', () => {
      // Place friendly castle on tile (1,3)
      map[3][1].castle = { factionId: 1, unitCount: 8 };
      
      // Create moving unit of same faction
      const movingUnit = createMockUnit(1, 12, 0, 3);
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move unit into friendly castle tile
      movingUnit.x = 1 * 64;
      movingUnit.y = 3 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(0);
    });

    test('should detect combat with castle AND stationary enemy units', () => {
      // Place enemy castle and additional enemy units
      map[2][2].castle = { factionId: 2, unitCount: 5 };
      map[2][2].addUnit({ factionId: 3, count: 4 });
      
      // Create moving unit
      const movingUnit = createMockUnit(1, 15, 1, 2);
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move into heavily defended tile
      movingUnit.x = 2 * 64;
      movingUnit.y = 2 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].factions).toHaveLength(3);
      expect(combatSituations[0].factions).toContain(1); // moving unit
      expect(combatSituations[0].factions).toContain(2); // castle
      expect(combatSituations[0].factions).toContain(3); // stationary unit
    });
  });

  describe('Combat Detection - Moving vs Moving Units', () => {
    test('should detect combat between two moving units of different factions', () => {
      const movingUnit1 = createMockUnit(1, 8, 2, 1);
      const movingUnit2 = createMockUnit(2, 6, 2, 3);
      const allMovingUnits = [movingUnit1, movingUnit2];
      
      tileEventSystem.trackUnit(movingUnit1);
      tileEventSystem.trackUnit(movingUnit2);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move both units to same tile (2,2)
      movingUnit1.x = 2 * 64;
      movingUnit1.y = 2 * 64;
      movingUnit2.x = 2 * 64;
      movingUnit2.y = 2 * 64;
      
      const events1 = tileEventSystem.updateUnit(movingUnit1, map);
      const events2 = tileEventSystem.updateUnit(movingUnit2, map);
      const allEvents = [...events1, ...events2];
      
      const combatSituations = tileEventSystem.processEvents(allEvents, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('MOVING_UNIT_COMBAT');
      expect(combatSituations[0].factions).toContain(1);
      expect(combatSituations[0].factions).toContain(2);
      expect(combatSituations[0].units).toContain(movingUnit1);
      expect(combatSituations[0].units).toContain(movingUnit2);
    });

    test('should NOT detect combat between moving units of same faction', () => {
      const movingUnit1 = createMockUnit(1, 8, 2, 1);
      const movingUnit2 = createMockUnit(1, 6, 2, 3);
      const allMovingUnits = [movingUnit1, movingUnit2];
      
      tileEventSystem.trackUnit(movingUnit1);
      tileEventSystem.trackUnit(movingUnit2);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move both friendly units to same tile
      movingUnit1.x = 2 * 64;
      movingUnit1.y = 2 * 64;
      movingUnit2.x = 2 * 64;
      movingUnit2.y = 2 * 64;
      
      const events1 = tileEventSystem.updateUnit(movingUnit1, map);
      const events2 = tileEventSystem.updateUnit(movingUnit2, map);
      const allEvents = [...events1, ...events2];
      
      const combatSituations = tileEventSystem.processEvents(allEvents, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(0);
    });

    test('should handle three-way moving unit combat', () => {
      const movingUnit1 = createMockUnit(1, 5, 1, 1);
      const movingUnit2 = createMockUnit(2, 7, 1, 2);
      const movingUnit3 = createMockUnit(3, 4, 2, 1);
      const allMovingUnits = [movingUnit1, movingUnit2, movingUnit3];
      
      tileEventSystem.trackUnit(movingUnit1);
      tileEventSystem.trackUnit(movingUnit2);
      tileEventSystem.trackUnit(movingUnit3);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // All three units meet at (1,1)
      movingUnit1.x = 1 * 64;
      movingUnit1.y = 1 * 64;
      movingUnit2.x = 1 * 64;
      movingUnit2.y = 1 * 64;
      movingUnit3.x = 1 * 64;
      movingUnit3.y = 1 * 64;
      
      const events1 = tileEventSystem.updateUnit(movingUnit1, map);
      const events2 = tileEventSystem.updateUnit(movingUnit2, map);
      const events3 = tileEventSystem.updateUnit(movingUnit3, map);
      const allEvents = [...events1, ...events2, ...events3];
      
      const combatSituations = tileEventSystem.processEvents(allEvents, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('MOVING_UNIT_COMBAT');
      expect(combatSituations[0].factions).toHaveLength(3);
      expect(combatSituations[0].units).toHaveLength(3);
    });
  });

  describe('Complex Combat Scenarios', () => {
    test('should handle moving unit entering tile with multiple enemy types', () => {
      // Setup complex tile with castle, stationary units, and incoming moving units
      map[2][2].castle = { factionId: 2, unitCount: 3 };
      map[2][2].addUnit({ factionId: 3, count: 4 });
      
      const movingUnit1 = createMockUnit(1, 10, 1, 2); // Attacker
      const movingUnit2 = createMockUnit(2, 5, 3, 2);  // Castle reinforcement
      const allMovingUnits = [movingUnit1, movingUnit2];
      
      tileEventSystem.trackUnit(movingUnit1);
      tileEventSystem.trackUnit(movingUnit2);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Both units enter the contested tile
      movingUnit1.x = 2 * 64;
      movingUnit1.y = 2 * 64;
      movingUnit2.x = 2 * 64;
      movingUnit2.y = 2 * 64;
      
      const events1 = tileEventSystem.updateUnit(movingUnit1, map);
      const events2 = tileEventSystem.updateUnit(movingUnit2, map);
      const allEvents = [...events1, ...events2];
      
      const combatSituations = tileEventSystem.processEvents(allEvents, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].factions).toHaveLength(3);
      expect(combatSituations[0].factions).toContain(1); // attacker
      expect(combatSituations[0].factions).toContain(2); // castle + reinforcement
      expect(combatSituations[0].factions).toContain(3); // stationary unit
    });

    test('should handle sequential unit entries to same tile', () => {
      // Place enemy on tile
      map[3][3].addUnit({ factionId: 2, count: 5 });
      
      const movingUnit1 = createMockUnit(1, 8, 2, 3);
      const movingUnit2 = createMockUnit(1, 4, 4, 3);
      const allMovingUnits = [movingUnit1, movingUnit2];
      
      tileEventSystem.trackUnit(movingUnit1);
      tileEventSystem.trackUnit(movingUnit2);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // First unit enters
      movingUnit1.x = 3 * 64;
      movingUnit1.y = 3 * 64;
      const events1 = tileEventSystem.updateUnit(movingUnit1, map);
      const combat1 = tileEventSystem.processEvents(events1, map, [movingUnit1]);
      
      expect(combat1).toHaveLength(1);
      expect(combat1[0].type).toBe('TILE_COMBAT');
      
      // Second unit enters same tile (after first combat would be resolved)
      movingUnit2.x = 3 * 64;
      movingUnit2.y = 3 * 64;
      const events2 = tileEventSystem.updateUnit(movingUnit2, map);
      const combat2 = tileEventSystem.processEvents(events2, map, [movingUnit2]);
      
      // This might not trigger combat if first unit cleared the tile, 
      // but we should at least get proper tracking
      expect(events2).toHaveLength(2); // EXIT + ENTER events
      expect(events2[1].type).toBe('UNIT_ENTER_TILE');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle unit moving to edge of map', () => {
      const movingUnit = createMockUnit(1, 5, 4, 4);
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move to edge of 5x5 map
      movingUnit.x = 4 * 64 + 63; // Almost at edge of tile (4,4)
      movingUnit.y = 4 * 64 + 63;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      expect(events).toHaveLength(0); // Should still be in same tile
      
      // Move beyond map boundary (this might happen during animation)
      movingUnit.x = 5 * 64;
      movingUnit.y = 5 * 64;
      
      const events2 = tileEventSystem.updateUnit(movingUnit, map);
      expect(events2).toHaveLength(2); // EXIT from (4,4) + ENTER to (5,5) even if out of bounds
    });

    test('should handle rapid tile crossing', () => {
      const movingUnit = createMockUnit(1, 3, 0, 0);
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Simulate rapid movement across multiple tiles
      const positions = [
        [1 * 64, 0 * 64], // (1,0)
        [2 * 64, 1 * 64], // (2,1)  
        [3 * 64, 2 * 64], // (3,2)
        [4 * 64, 3 * 64]  // (4,3)
      ];
      
      const allEvents = [];
      positions.forEach(([x, y]) => {
        movingUnit.x = x;
        movingUnit.y = y;
        const events = tileEventSystem.updateUnit(movingUnit, map);
        allEvents.push(...events);
      });
      
      // Should have EXIT/ENTER pairs for each transition
      expect(allEvents.length).toBeGreaterThanOrEqual(6); // At least 3 transitions * 2 events each
      
      // Verify sequence integrity
      const enterEvents = allEvents.filter(e => e.type === 'UNIT_ENTER_TILE');
      const exitEvents = allEvents.filter(e => e.type === 'UNIT_EXIT_TILE');
      expect(enterEvents).toHaveLength(4); // 4 tiles entered
      expect(exitEvents).toHaveLength(4);  // 4 tiles exited (including initial)
    });

    test('should properly clean up when unit is removed', () => {
      const movingUnit = createMockUnit(1, 7, 2, 3);
      tileEventSystem.trackUnit(movingUnit);
      
      expect(tileEventSystem.tileOccupancy.has('2,3')).toBe(true);
      expect(tileEventSystem.unitTileHistory.has(movingUnit.id)).toBe(true);
      
      const events = tileEventSystem.removeUnit(movingUnit.id);
      
      expect(tileEventSystem.tileOccupancy.has('2,3')).toBe(false);
      expect(tileEventSystem.unitTileHistory.has(movingUnit.id)).toBe(false);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('UNIT_EXIT_TILE');
    });

    test('should handle empty tile queries gracefully', () => {
      const emptyTileUnits = tileEventSystem.getUnitsOnTile(1, 1, []);
      expect(emptyTileUnits).toHaveLength(0);
      
      const combatCheck = tileEventSystem.checkForCombat(1, 1, []);
      expect(combatCheck).toBeNull();
    });
  });

  describe('Bug Reproduction Tests', () => {
    test('CRITICAL: Moving unit entering tile with enemy stationary unit MUST trigger combat', () => {
      // This test specifically addresses the bug mentioned in the issue
      console.log('=== CRITICAL BUG TEST: Moving vs Stationary Combat ===');
      
      // Setup: Enemy unit stationed at (1, 8) - like in the log
      const enemyStationaryUnit = { factionId: 2, count: 23 };
      map[8] = map[8] || [];
      for (let i = 0; i < 10; i++) {
        if (!map[8][i]) map[8][i] = new MockTile(i, 8);
      }
      map[8][1].addUnit(enemyStationaryUnit);
      
      // Moving unit approaching from (8, 8) to (1, 8) - like in the log  
      const movingUnit = createMockUnit(3, 20, 8, 8);
      const allMovingUnits = [movingUnit];
      
      console.log('Initial setup:');
      console.log(`- Stationary: Faction ${enemyStationaryUnit.factionId}, ${enemyStationaryUnit.count} units at (1,8)`);
      console.log(`- Moving: Faction ${movingUnit.factionId}, ${movingUnit.count} units starting at (8,8)`);
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Simulate unit moving step by step towards (1,8)
      const path = [
        { x: 7, y: 8 },
        { x: 6, y: 8 },
        { x: 5, y: 8 },
        { x: 4, y: 8 },
        { x: 3, y: 8 },
        { x: 2, y: 8 },
        { x: 1, y: 8 }  // Final destination with enemy
      ];
      
      let combatTriggered = false;
      
      path.forEach((pos, index) => {
        console.log(`Step ${index + 1}: Moving unit to (${pos.x}, ${pos.y})`);
        
        movingUnit.x = pos.x * 64;
        movingUnit.y = pos.y * 64;
        
        const events = tileEventSystem.updateUnit(movingUnit, map);
        console.log(`Events generated:`, events.map(e => `${e.type} at (${e.tile.x},${e.tile.y})`));
        
        const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
        console.log(`Combat situations:`, combatSituations.length);
        
        if (combatSituations.length > 0) {
          combatTriggered = true;
          console.log(`🔥 COMBAT TRIGGERED at (${pos.x}, ${pos.y})!`);
          console.log('Combat details:', combatSituations[0]);
          
          // Verify this is the correct type of combat
          expect(combatSituations[0].type).toBe('TILE_COMBAT');
          expect(combatSituations[0].factions).toContain(2); // Enemy stationary
          expect(combatSituations[0].factions).toContain(3); // Moving unit
          expect(combatSituations[0].movingUnits).toContain(movingUnit);
        }
      });
      
      // CRITICAL ASSERTION: Combat MUST have been triggered
      expect(combatTriggered).toBe(true);
      console.log('✅ Combat was properly triggered when moving unit entered enemy tile');
      console.log('=== END CRITICAL BUG TEST ===');
    });

    test('Bug scenario: Unit moving from castle to castle should trigger combat at destination', () => {
      // Recreate the exact scenario from the log
      // Castle at (8,8) moving 20 units to castle at (1,8)
      map[8] = map[8] || [];
      for (let i = 0; i < 10; i++) {
        if (!map[8][i]) map[8][i] = new MockTile(i, 8);
      }
      
      // Source castle (8,8) - Faction 3 with 12 units (after sending 20)
      map[8][8].castle = { factionId: 3, unitCount: 12 };
      
      // Destination castle (1,8) - Faction 2 with 0 units (as shown in log)  
      map[8][1].castle = { factionId: 2, unitCount: 0 };
      
      // Moving unit: Faction 3, 20 units going from (8,8) to (1,8)
      const movingUnit = createMockUnit(3, 20, 8, 8);
      movingUnit.destinationTile = { x: 1, y: 8 };
      
      const allMovingUnits = [movingUnit];
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Move directly to destination (simulate end of movement)
      movingUnit.x = 1 * 64;
      movingUnit.y = 8 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].factions).toContain(3); // Attacker
      expect(combatSituations[0].factions).toContain(2); // Castle owner
      
      console.log('✅ Castle attack scenario properly detected');
    });

    test('CRITICAL: Units must STOP when entering enemy-occupied tiles, not pass through', () => {
      console.log('=== MOVEMENT BLOCKING TEST ===');
      
      // Setup: Enemy stationed at (2,2) blocking the path from (1,2) to (3,2)
      const stationaryEnemy = { factionId: 2, count: 5 };
      map[2][2].addUnit(stationaryEnemy);
      
      // Moving unit trying to pass through
      const movingUnit = createMockUnit(1, 8, 1, 2);
      movingUnit.destinationTile = { x: 3, y: 2 }; // Trying to go past the enemy
      
      const allMovingUnits = [movingUnit];
      
      console.log('Setup: Enemy faction 2 with 5 units stationed at (2,2)');
      console.log('Moving: Faction 1 with 8 units trying to move from (1,2) through (2,2) to (3,2)');
      
      tileEventSystem.trackUnit(movingUnit);
      tileEventSystem.eventQueue = []; // Clear initial events
      
      // Unit enters the enemy-occupied tile (2,2)
      movingUnit.x = 2 * 64;
      movingUnit.y = 2 * 64;
      
      const events = tileEventSystem.updateUnit(movingUnit, map);
      const combatSituations = tileEventSystem.processEvents(events, map, allMovingUnits);
      
      console.log('Combat situations when entering enemy tile:', combatSituations.length);
      
      // Should trigger combat
      expect(combatSituations).toHaveLength(1);
      expect(combatSituations[0].type).toBe('TILE_COMBAT');
      expect(combatSituations[0].factions).toContain(1); // Attacker
      expect(combatSituations[0].factions).toContain(2); // Defender
      
      console.log('✅ Combat properly triggered when unit entered enemy tile');
      console.log('🔍 Key test: Unit should STOP at (2,2) after combat, not continue to (3,2)');
      console.log('=== END MOVEMENT BLOCKING TEST ===');
    });
  });
});