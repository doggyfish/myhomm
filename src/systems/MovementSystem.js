import { PathfindingSystem } from './PathfindingSystem.js';
import { Unit } from '../entities/Unit.js';
import { CombatSystem } from './CombatSystem.js';
import { GAME_CONFIG } from '../config/GameConfig.js';

export class MovementSystem {
  constructor() {
    this.movingUnits = [];
  }

  moveUnits(map, fromX, fromY, toX, toY, unitCount) {
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

    // Remove units from source
    this.removeUnitsFromTile(fromTile, factionId, unitCount);

    // Add to moving units
    this.movingUnits.push(movingUnit);

    return true;
  }

  update(deltaTime, map) {
    const completedUnits = [];

    this.movingUnits.forEach((unit, index) => {
      const faction = GAME_CONFIG.FACTIONS.find((f) => f.id === unit.factionId);
      const isComplete = unit.update(deltaTime, faction.speed);

      if (isComplete) {
        completedUnits.push({ unit, index });
      }
    });

    // Handle completed movements
    completedUnits.reverse().forEach(({ unit, index }) => {
      this.completeMovement(unit, map);
      this.movingUnits.splice(index, 1);
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
    CombatSystem.resolveCombat(destTile);
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
