import { PathfindingSystem } from './PathfindingSystem.js';
import { Unit } from '../entities/Unit.js';
import { CombatSystem } from './CombatSystem.js';
import { GAME_CONFIG } from '../config/GameConfig.js';

export class MovementSystem {
  constructor() {
    this.movingUnits = [];
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

    // Remove units from source
    this.removeUnitsFromTile(fromTile, factionId, unitCount);

    // Add to moving units
    this.movingUnits.push(movingUnit);

    return true;
  }

  update(deltaTime, map) {
    const completedUnits = [];

    // First, update all unit positions
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
        
        // Unit entered a new tile - check for combat with existing units or enemy castle
        const currentTile = map[currentTileY][currentTileX];
        const hasEnemyUnits = currentTile.units.some(u => u.factionId !== unit.factionId);
        const hasEnemyCastle = currentTile.castle && currentTile.castle.factionId !== unit.factionId;
        
        if (hasEnemyUnits || hasEnemyCastle) {
          if (hasEnemyCastle) {
            console.log(`🏰 CASTLE ATTACK: ${faction.name} unit attacking ${currentTile.castle.factionId} castle at (${currentTileX}, ${currentTileY})!`);
          }
          if (hasEnemyUnits) {
            console.log(`🔥 MOVEMENT COMBAT: ${faction.name} unit passing through tile (${currentTileX}, ${currentTileY}) with enemy units!`);
          }
          
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
          const conqueredCastle = currentTile.castle && currentTile.castle.factionId === unit.factionId;
          
          if (survivingUnits.length === 0 && !conqueredCastle) {
            // Unit was destroyed in combat - remove from moving units
            console.log(`💀 ${faction.name} unit destroyed while passing through!`);
            this.movingUnits.splice(index, 1);
            return; // Skip further processing for this unit
          } else if (conqueredCastle) {
            // Unit conquered the castle - they're now garrisoned, remove from moving units
            console.log(`🏰 ${faction.name} unit conquered castle and is now garrisoned!`);
            this.movingUnits.splice(index, 1);
            return; // Unit has reached final destination (castle)
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

      if (isComplete) {
        completedUnits.push({ unit, index });
      }
    });

    // Check for moving-unit-to-moving-unit combat (units crossing paths)
    this.checkMovingUnitCombat(map);

    // Handle completed movements
    completedUnits.reverse().forEach(({ unit, index }) => {
      this.completeMovement(unit, map);
      this.movingUnits.splice(index, 1);
    });
  }

  checkMovingUnitCombat(map) {
    // Group moving units by their current tile positions
    const tileUnits = {};
    
    this.movingUnits.forEach(unit => {
      const tileX = Math.floor(unit.x / GAME_CONFIG.TILE_SIZE);
      const tileY = Math.floor(unit.y / GAME_CONFIG.TILE_SIZE);
      const tileKey = `${tileX},${tileY}`;
      
      if (!tileUnits[tileKey]) {
        tileUnits[tileKey] = [];
      }
      tileUnits[tileKey].push(unit);
    });

    // Check each tile for combat between moving units
    Object.entries(tileUnits).forEach(([tileKey, unitsOnTile]) => {
      if (unitsOnTile.length < 2) return; // Need at least 2 units for combat

      const [tileX, tileY] = tileKey.split(',').map(Number);

      // Check if there are different factions among moving units
      const factions = new Set(unitsOnTile.map(u => u.factionId));
      if (factions.size > 1) {
        console.log(`⚡ MOVING UNIT COMBAT: ${factions.size} factions crossing paths at (${tileX}, ${tileY})`);
        
        // Resolve combat directly without using tiles - just between moving units
        const combatResult = this.resolveMovingUnitCombat(unitsOnTile);
        
        // Remove destroyed units from movingUnits array
        unitsOnTile.forEach(unit => {
          if (!combatResult.survivors.includes(unit)) {
            const index = this.movingUnits.indexOf(unit);
            if (index >= 0) {
              console.log(`💀 ${GAME_CONFIG.FACTIONS[unit.factionId].name} unit destroyed in path crossing!`);
              this.movingUnits.splice(index, 1);
            }
          }
        });
        
        console.log(`✅ Combat resolved at (${tileX}, ${tileY}) - survivors continue moving`);
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
    
    // Update winning units with survivor count
    const survivors = [];
    unitsInCombat.forEach(unit => {
      if (unit.factionId === winningFaction) {
        unit.count = survivorCount;
        survivors.push(unit);
        console.log(`✅ ${GAME_CONFIG.FACTIONS[unit.factionId].name} unit survived with ${unit.count} units, continuing to destination`);
      }
    });

    return { survivors, winningFaction };
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
