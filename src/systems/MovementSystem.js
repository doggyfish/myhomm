import { PathfindingSystem } from './PathfindingSystem.js';
import { Unit } from '../entities/Unit.js';
import { CombatSystem } from './CombatSystem.js';
import { TileEventSystem } from './TileEventSystem.js';
import { GAME_CONFIG } from '../config/GameConfig.js';

export class MovementSystem {
  constructor() {
    this.movingUnits = [];
    this.tileEventSystem = new TileEventSystem();
  }

  moveUnits(map, fromX, fromY, toX, toY, unitCount) {
    // Prevent moving to the same location
    if (fromX === toX && fromY === toY) {
      console.log('Cannot move units to the same location');
      return false;
    }

    const fromTile = map[fromY][fromX];
    const toTile = map[toY][toX];

    // Validate movement
    if (!this.canMoveUnits(fromTile, unitCount)) {
      return false;
    }

    // Get available units (prioritize non-moving units first)
    const availableUnits = this.getAvailableUnits(fromTile, unitCount);

    if (availableUnits.totalCount < unitCount) {
      return false;
    }

    // Find path
    const path = PathfindingSystem.findPath(map, fromX, fromY, toX, toY);
    if (path.length === 0 && (fromX !== toX || fromY !== toY)) {
      return false; // No valid path found
    }

    // Create moving unit
    const { factionId } = availableUnits.units[0];
    const faction = GAME_CONFIG.FACTIONS.find((f) => f.id === factionId);

    const movingUnit = new Unit(factionId, unitCount);
    movingUnit.setPosition(fromX * GAME_CONFIG.TILE_SIZE, fromY * GAME_CONFIG.TILE_SIZE);

    // Convert path to pixel coordinates
    const pixelPath = path.map((point) => ({
      x: point.x * GAME_CONFIG.TILE_SIZE,
      y: point.y * GAME_CONFIG.TILE_SIZE,
    }));

    movingUnit.setPath(pixelPath);
    movingUnit.speed = GAME_CONFIG.ANIMATION.UNIT_SPEED;
    movingUnit.destinationTile = { x: toX, y: toY };
    movingUnit.originTile = { x: fromX, y: fromY };

    // Remove units from source
    this.removeUnitsFromTile(fromTile, factionId, unitCount);

    // Add to moving units and start tracking
    this.movingUnits.push(movingUnit);
    this.tileEventSystem.trackUnit(movingUnit);

    return true;
  }

  update(deltaTime, map) {
    const completedUnits = [];
    const allTileEvents = [];

    // First, update all unit positions and collect tile events
    this.movingUnits.forEach((unit, index) => {
      const faction = GAME_CONFIG.FACTIONS.find((f) => f.id === unit.factionId);
      const isComplete = unit.update(deltaTime, faction.speed);
      
      // Update tile tracking and get events
      const events = this.tileEventSystem.updateUnit(unit, map);
      allTileEvents.push(...events);

      if (isComplete) {
        completedUnits.push({ unit, index });
      }
    });

    // Process all tile events to determine combat situations
    const combatSituations = this.tileEventSystem.processEvents(allTileEvents, map, this.movingUnits);
    
    // Resolve combat situations
    this.resolveCombatSituations(combatSituations, map);

    // Handle completed movements
    completedUnits.reverse().forEach(({ unit, index }) => {
      // Remove from tile tracking
      this.tileEventSystem.removeUnit(unit.id);
      this.completeMovement(unit, map);
      this.movingUnits.splice(index, 1);
    });
  }

  resolveCombatSituations(combatSituations, map) {
    combatSituations.forEach(situation => {
      if (situation.type === 'MOVING_UNIT_COMBAT') {
        console.log(`⚡ MOVING UNIT COMBAT: ${situation.factions.length} factions crossing paths at (${situation.tile.x}, ${situation.tile.y})`);
        this.resolveMovingUnitCombat(situation.units);
      } else if (situation.type === 'TILE_COMBAT') {
        const faction = GAME_CONFIG.FACTIONS.find(f => f.id === situation.movingUnits[0].factionId);
        console.log(`🔥 TILE COMBAT: ${faction.name} unit entering occupied tile at (${situation.tile.x}, ${situation.tile.y})`);
        
        // Temporarily add moving units to tile for combat resolution
        situation.movingUnits.forEach(unit => {
          const tempUnit = {
            factionId: unit.factionId,
            count: unit.count,
            x: situation.tile.x,
            y: situation.tile.y,
            isMoving: true
          };
          situation.mapTile.addUnit(tempUnit);
        });
        
        // Resolve combat using existing system
        CombatSystem.resolveCombat(situation.mapTile, map, this.movingUnits);
        
        // Update moving units based on combat results
        situation.movingUnits.forEach(unit => {
          const survivingUnits = situation.mapTile.getUnitsForFaction(unit.factionId);
          const conqueredCastle = situation.mapTile.castle && situation.mapTile.castle.factionId === unit.factionId;
          
          if (survivingUnits.length === 0 && !conqueredCastle) {
            // Unit was destroyed - remove from moving units and tracking
            console.log(`💀 ${faction.name} unit destroyed in tile combat!`);
            this.tileEventSystem.removeUnit(unit.id);
            const index = this.movingUnits.indexOf(unit);
            if (index >= 0) {
              this.movingUnits.splice(index, 1);
            }
          } else if (conqueredCastle) {
            // Unit conquered castle - remove from moving units and tracking
            console.log(`🏰 ${faction.name} unit conquered castle and is now garrisoned!`);
            this.tileEventSystem.removeUnit(unit.id);
            const index = this.movingUnits.indexOf(unit);
            if (index >= 0) {
              this.movingUnits.splice(index, 1);
            }
          } else {
            // Unit survived - update count and continue moving
            const survivingUnit = survivingUnits[0];
            unit.count = survivingUnit.count;
            console.log(`✅ ${faction.name} unit survived with ${unit.count} units, continuing movement`);
            
            // Remove units from tile since they're still moving
            situation.mapTile.units = situation.mapTile.units.filter(u => u.factionId !== unit.factionId);
          }
        });
      }
    });
  }

  resolveMovingUnitCombat(unitsInCombat) {
    // Calculate total strength per faction
    const factionStrengths = {};
    unitsInCombat.forEach(unit => {
      if (!factionStrengths[unit.factionId]) {
        factionStrengths[unit.factionId] = 0;
      }
      factionStrengths[unit.factionId] += unit.count;
    });

    // Find winning faction
    let winningFaction = -1;
    let maxStrength = 0;
    Object.entries(factionStrengths).forEach(([factionId, strength]) => {
      if (strength > maxStrength) {
        winningFaction = parseInt(factionId);
        maxStrength = strength;
      }
    });

    // Calculate survivors
    const totalEnemyStrength = Object.entries(factionStrengths)
      .filter(([factionId]) => parseInt(factionId) !== winningFaction)
      .reduce((sum, [, strength]) => sum + strength, 0);
    
    const survivorCount = Math.max(1, maxStrength - totalEnemyStrength);
    
    // Update units and remove destroyed ones
    const unitsToRemove = [];
    unitsInCombat.forEach(unit => {
      if (unit.factionId === winningFaction) {
        unit.count = survivorCount;
        console.log(`✅ ${GAME_CONFIG.FACTIONS[unit.factionId].name} unit survived with ${unit.count} units, continuing to destination`);
      } else {
        console.log(`💀 ${GAME_CONFIG.FACTIONS[unit.factionId].name} unit destroyed in path crossing!`);
        unitsToRemove.push(unit);
      }
    });
    
    // Remove destroyed units from tracking and moving units array
    unitsToRemove.forEach(unit => {
      this.tileEventSystem.removeUnit(unit.id);
      const index = this.movingUnits.indexOf(unit);
      if (index >= 0) {
        this.movingUnits.splice(index, 1);
      }
    });
  }

  completeMovement(unit, map) {
    const destTile = map[unit.destinationTile.y][unit.destinationTile.x];

    // Add unit to destination tile
    const stationaryUnit = {
      factionId: unit.factionId,
      count: unit.count,
      x: unit.destinationTile.x,
      y: unit.destinationTile.y,
      isMoving: false,
    };

    destTile.addUnit(stationaryUnit);

    // Resolve combat or merging
    CombatSystem.resolveCombat(destTile, map, this.movingUnits);
  }

  canMoveUnits(fromTile, unitCount) {
    const totalUnits = fromTile.units.reduce((sum, unit) => sum + unit.count, 0);
    const castleUnits = fromTile.castle ? fromTile.castle.unitCount : 0;
    return (totalUnits + castleUnits) >= unitCount;
  }

  getAvailableUnits(tile, requestedCount) {
    const result = { units: [], totalCount: 0 };
    let remaining = requestedCount;

    // First, use tile units
    for (const unit of tile.units) {
      if (remaining <= 0) break;

      const takeCount = Math.min(unit.count, remaining);
      result.units.push({ ...unit, takeCount });
      result.totalCount += takeCount;
      remaining -= takeCount;
    }

    // Then use castle units if needed
    if (remaining > 0 && tile.castle) {
      const takeCount = Math.min(tile.castle.unitCount, remaining);
      if (takeCount > 0) {
        result.units.push({
          factionId: tile.castle.factionId,
          count: takeCount,
          takeCount,
          isFromCastle: true,
        });
        result.totalCount += takeCount;
      }
    }

    return result;
  }

  removeUnitsFromTile(tile, factionId, count) {
    let remaining = count;

    // Remove from tile units first
    tile.units = tile.units.filter((unit) => {
      if (unit.factionId === factionId && remaining > 0) {
        if (unit.count <= remaining) {
          remaining -= unit.count;
          return false; // Remove entire unit
        }
        unit.count -= remaining;
        remaining = 0;
        return true; // Keep unit with reduced count
      }
      return true;
    });

    // Remove from castle if needed
    if (remaining > 0 && tile.castle && tile.castle.factionId === factionId) {
      tile.castle.removeUnits(remaining);
    }
  }

  getMovingUnits() {
    return this.movingUnits;
  }
}
