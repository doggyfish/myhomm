export class TileEventSystem {
  constructor() {
    this.tileOccupancy = new Map(); // Map of "x,y" -> Set of unit IDs
    this.unitTileHistory = new Map(); // Map of unit ID -> previous tile position
    this.eventQueue = [];
  }

  // Generate unique ID for moving units
  generateUnitId(unit) {
    return `${unit.factionId}_${unit.x}_${unit.y}_${Date.now()}_${Math.random()}`;
  }

  // Get current tile coordinates for a unit
  getCurrentTile(unit) {
    return {
      x: Math.floor(unit.x / 64), // TILE_SIZE
      y: Math.floor(unit.y / 64)
    };
  }

  // Get tile key for map storage
  getTileKey(tileX, tileY) {
    return `${tileX},${tileY}`;
  }

  // Initialize unit tracking
  trackUnit(unit) {
    if (!unit.id) {
      unit.id = this.generateUnitId(unit);
    }
    
    const currentTile = this.getCurrentTile(unit);
    const tileKey = this.getTileKey(currentTile.x, currentTile.y);
    
    // Add to tile occupancy
    if (!this.tileOccupancy.has(tileKey)) {
      this.tileOccupancy.set(tileKey, new Set());
    }
    this.tileOccupancy.get(tileKey).add(unit.id);
    
    // Track tile history
    this.unitTileHistory.set(unit.id, currentTile);
    
    // Queue enter event
    this.eventQueue.push({
      type: 'UNIT_ENTER_TILE',
      unitId: unit.id,
      unit: unit,
      tile: currentTile,
      timestamp: Date.now()
    });
  }

  // Update unit position and handle tile transitions
  updateUnit(unit, map) {
    if (!unit.id) {
      this.trackUnit(unit);
      return this.eventQueue.splice(0); // Return and clear events
    }

    const currentTile = this.getCurrentTile(unit);
    const previousTile = this.unitTileHistory.get(unit.id);
    
    // Check if unit changed tiles
    if (!previousTile || 
        currentTile.x !== previousTile.x || 
        currentTile.y !== previousTile.y) {
      
      // Remove from previous tile
      if (previousTile) {
        const prevTileKey = this.getTileKey(previousTile.x, previousTile.y);
        if (this.tileOccupancy.has(prevTileKey)) {
          this.tileOccupancy.get(prevTileKey).delete(unit.id);
          if (this.tileOccupancy.get(prevTileKey).size === 0) {
            this.tileOccupancy.delete(prevTileKey);
          }
        }
        
        // Queue exit event
        this.eventQueue.push({
          type: 'UNIT_EXIT_TILE',
          unitId: unit.id,
          unit: unit,
          tile: previousTile,
          timestamp: Date.now()
        });
      }
      
      // Add to current tile
      const currentTileKey = this.getTileKey(currentTile.x, currentTile.y);
      if (!this.tileOccupancy.has(currentTileKey)) {
        this.tileOccupancy.set(currentTileKey, new Set());
      }
      this.tileOccupancy.get(currentTileKey).add(unit.id);
      
      // Update history
      this.unitTileHistory.set(unit.id, currentTile);
      
      // Queue enter event
      this.eventQueue.push({
        type: 'UNIT_ENTER_TILE',
        unitId: unit.id,
        unit: unit,
        tile: currentTile,
        timestamp: Date.now()
      });
    }
    
    // Return events for this update and clear the queue
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  // Remove unit from tracking
  removeUnit(unitId) {
    const previousTile = this.unitTileHistory.get(unitId);
    
    if (previousTile) {
      // Remove from tile occupancy
      const tileKey = this.getTileKey(previousTile.x, previousTile.y);
      if (this.tileOccupancy.has(tileKey)) {
        this.tileOccupancy.get(tileKey).delete(unitId);
        if (this.tileOccupancy.get(tileKey).size === 0) {
          this.tileOccupancy.delete(tileKey);
        }
      }
      
      // Queue exit event
      this.eventQueue.push({
        type: 'UNIT_EXIT_TILE',
        unitId: unitId,
        tile: previousTile,
        timestamp: Date.now()
      });
    }
    
    // Remove from history
    this.unitTileHistory.delete(unitId);
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  // Get all units currently on a specific tile
  getUnitsOnTile(tileX, tileY, allUnits) {
    const tileKey = this.getTileKey(tileX, tileY);
    const unitIds = this.tileOccupancy.get(tileKey);
    
    if (!unitIds) {
      return [];
    }
    
    return allUnits.filter(unit => unitIds.has(unit.id));
  }

  // Check if multiple factions are on the same tile
  checkForCombat(tileX, tileY, allUnits) {
    const unitsOnTile = this.getUnitsOnTile(tileX, tileY, allUnits);
    
    if (unitsOnTile.length < 2) {
      return null; // No combat possible
    }
    
    const factions = new Set(unitsOnTile.map(unit => unit.factionId));
    
    if (factions.size > 1) {
      return {
        tile: { x: tileX, y: tileY },
        units: unitsOnTile,
        factions: Array.from(factions)
      };
    }
    
    return null; // Same faction, no combat
  }

  // Process all events and determine combat situations
  processEvents(events, map, allUnits) {
    const combatSituations = [];
    const tilesWithNewUnits = new Set();
    
    // Collect all tiles that had unit enter events
    events.forEach(event => {
      if (event.type === 'UNIT_ENTER_TILE') {
        const tileKey = this.getTileKey(event.tile.x, event.tile.y);
        tilesWithNewUnits.add(tileKey);
      }
    });
    
    // Check each affected tile for combat
    tilesWithNewUnits.forEach(tileKey => {
      const [x, y] = tileKey.split(',').map(Number);
      
      // Check for moving unit vs moving unit combat
      const movingUnitCombat = this.checkForCombat(x, y, allUnits);
      if (movingUnitCombat) {
        combatSituations.push({
          type: 'MOVING_UNIT_COMBAT',
          ...movingUnitCombat
        });
      }
      
      // Check for moving unit vs stationary/castle combat
      if (x >= 0 && y >= 0 && 
          y < map.length && x < map[0].length) {
        const mapTile = map[y][x];
        
        // Check if there are stationary units or castle on this tile
        const hasStationaryUnits = mapTile.units.length > 0;
        const hasCastle = mapTile.castle !== null;
        const movingUnitsOnTile = this.getUnitsOnTile(x, y, allUnits);
        
        if (movingUnitsOnTile.length > 0 && (hasStationaryUnits || hasCastle)) {
          // Get all factions involved (moving + stationary + castle)
          const allFactions = new Set([
            ...movingUnitsOnTile.map(u => u.factionId),
            ...mapTile.units.map(u => u.factionId)
          ]);
          
          if (hasCastle) {
            allFactions.add(mapTile.castle.factionId);
          }
          
          // Combat if multiple factions
          if (allFactions.size > 1) {
            combatSituations.push({
              type: 'TILE_COMBAT',
              tile: { x, y },
              mapTile: mapTile,
              movingUnits: movingUnitsOnTile,
              factions: Array.from(allFactions)
            });
          }
        }
      }
    });
    
    return combatSituations;
  }
}