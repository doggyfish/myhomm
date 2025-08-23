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
      
      // Store previous tile position
      const prevTileX = Math.floor(unit.x / GAME_CONFIG.TILE_SIZE);
      const prevTileY = Math.floor(unit.y / GAME_CONFIG.TILE_SIZE);
      
      const isComplete = unit.update(deltaTime, faction.speed);
      
      // Check if unit moved to a different tile during this update
      const currentTileX = Math.floor(unit.x / GAME_CONFIG.TILE_SIZE);
      const currentTileY = Math.floor(unit.y / GAME_CONFIG.TILE_SIZE);
      
      if ((prevTileX !== currentTileX || prevTileY !== currentTileY) && 
          currentTileX >= 0 && currentTileX < GAME_CONFIG.DEFAULT_MAP_SIZE &&
          currentTileY >= 0 && currentTileY < GAME_CONFIG.DEFAULT_MAP_SIZE) {
        
        // Unit entered a new tile - check for combat with existing units
        const currentTile = map[currentTileY][currentTileX];
        if (currentTile.units.length > 0) {
          // Check if there are enemy units on this tile
          const enemyUnits = currentTile.units.filter(u => u.factionId !== unit.factionId);
          if (enemyUnits.length > 0) {
            console.log(`🔥 MOVEMENT COMBAT: ${faction.name} unit passing through tile (${currentTileX}, ${currentTileY}) with enemy units!`);
            
            // Temporarily add moving unit to tile for combat resolution
            const tempUnit = {
              factionId: unit.factionId,
              count: unit.count,
              x: currentTileX,
              y: currentTileY,
              isMoving: true
            };
            currentTile.addUnit(tempUnit);
            
            // Resolve combat
            CombatSystem.resolveCombat(currentTile);
            
            // Check if the moving unit survived combat
            const survivingUnits = currentTile.getUnitsForFaction(unit.factionId);
            if (survivingUnits.length === 0) {
              // Unit was destroyed in combat - remove from moving units
              console.log(`💀 ${faction.name} unit destroyed while passing through!`);
              this.movingUnits.splice(index, 1);
              return; // Skip further processing for this unit
            } else {
              // Update unit count if it survived with reduced numbers
              const survivingUnit = survivingUnits[0];
              unit.count = survivingUnit.count;
              console.log(`✅ ${faction.name} unit survived with ${unit.count} units, continuing movement`);
              
              // IMPORTANT: Remove ALL units of this faction from the tile since they're still moving
              currentTile.units = currentTile.units.filter(u => u.factionId !== unit.factionId);
            }
          }
        }
      }

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
