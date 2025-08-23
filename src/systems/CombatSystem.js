export class CombatSystem {
  static resolveCombat(tile) {
    const factions = tile.getAllFactions();
    const castleFaction = tile.castle ? tile.castle.factionId : null;

    // Add castle faction to the list if it exists and is different
    if (castleFaction !== null && !factions.includes(castleFaction)) {
      factions.push(castleFaction);
    }

    // Debug logging
    console.log(`Combat check at (${tile.x}, ${tile.y}): ${factions.length} factions`, factions);
    if (tile.units.length > 0) {
      console.log('Units on tile:', tile.units.map(u => ({ faction: u.factionId, count: u.count })));
    }
    if (tile.castle) {
      console.log(`Castle on tile: faction ${tile.castle.factionId}, ${tile.castle.unitCount} units`);
    }

    if (factions.length <= 1) {
      // No combat needed - merge same faction units
      if (factions.length === 1) {
        console.log('Merging same faction units');
        this.mergeSameFactionUnits(tile, factions[0]);
        
        // If there's a castle of the same faction, merge units into castle
        if (tile.castle && tile.castle.factionId === factions[0]) {
          const tileUnits = tile.getTotalUnitsForFaction(factions[0]);
          if (tileUnits > 0) {
            console.log(`🏰 Merging ${tileUnits} units into friendly castle`);
            tile.castle.unitCount += tileUnits;
            tile.units = tile.units.filter(unit => unit.factionId !== factions[0]);
          }
        }
      }
      return;
    }

    // Combat between different factions (including castle)
    console.log('🔥 COMBAT TRIGGERED! Factions fighting:', factions);
    const combatResults = [];

    // Calculate total strength per faction (including castle units)
    const factionStrengths = {};
    factions.forEach((factionId) => {
      let strength = tile.getTotalUnitsForFaction(factionId);
      
      // Add castle units to the strength calculation
      if (tile.castle && tile.castle.factionId === factionId) {
        strength += tile.castle.unitCount;
      }
      
      factionStrengths[factionId] = strength;
    });

    // Find the winning faction (highest unit count)
    let winningFaction = factions[0];
    let maxStrength = factionStrengths[winningFaction];

    factions.forEach((factionId) => {
      if (factionStrengths[factionId] > maxStrength) {
        winningFaction = factionId;
        maxStrength = factionStrengths[factionId];
      }
    });

    // Calculate survivors for winning faction
    const totalEnemyStrength = factions
      .filter((f) => f !== winningFaction)
      .reduce((sum, f) => sum + factionStrengths[f], 0);

    const survivors = Math.max(1, maxStrength - totalEnemyStrength);

    // Record combat results
    factions.forEach((factionId) => {
      combatResults.push({
        factionId,
        initialCount: factionStrengths[factionId],
        survived: factionId === winningFaction,
        finalCount: factionId === winningFaction ? survivors : 0,
      });
    });

    // Handle castle ownership change if castle exists
    if (tile.castle && tile.castle.factionId !== winningFaction) {
      console.log(`🏰 CASTLE CONQUERED! Castle changed from faction ${tile.castle.factionId} to faction ${winningFaction}`);
      tile.castle.factionId = winningFaction;
      tile.castle.unitCount = Math.min(survivors, tile.castle.unitCount);
    } else if (tile.castle && tile.castle.factionId === winningFaction) {
      // Castle defended successfully, update unit count
      tile.castle.unitCount = Math.max(1, survivors);
    }

    // Remove all units from tile
    tile.units = [];

    // Don't add surviving units to tile if they're now in the castle
    if (survivors > 0 && (!tile.castle || tile.castle.factionId !== winningFaction)) {
      const survivingUnit = {
        factionId: winningFaction,
        count: survivors,
        x: tile.x,
        y: tile.y,
        isMoving: false,
      };
      tile.addUnit(survivingUnit);
    }

    return combatResults;
  }

  static mergeSameFactionUnits(tile, factionId) {
    const factionUnits = tile.getUnitsForFaction(factionId);

    if (factionUnits.length <= 1) {
      return; // Nothing to merge
    }

    // Calculate total count
    const totalCount = factionUnits.reduce((sum, unit) => sum + unit.count, 0);

    // Remove all units of this faction
    tile.units = tile.units.filter((unit) => unit.factionId !== factionId);

    // Add single merged unit
    const mergedUnit = {
      factionId,
      count: totalCount,
      x: tile.x,
      y: tile.y,
      isMoving: false,
    };
    tile.addUnit(mergedUnit);
  }
}
