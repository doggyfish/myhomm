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

    // Check if this involves a castle with reinforcements
    if (tile.castle && tile.units.length > 0) {
      return this.resolveReinforcedCastleCombat(tile);
    }

    // Regular combat between different factions
    return this.resolveRegularCombat(tile, factions);
  }

  static resolveReinforcedCastleCombat(tile) {
    console.log('🏰⚔️ REINFORCED CASTLE COMBAT!');
    
    const castleFaction = tile.castle.factionId;
    const reinforcements = tile.getUnitsForFaction(castleFaction);
    const attackers = tile.units.filter(unit => unit.factionId !== castleFaction);
    
    console.log(`Castle faction: ${castleFaction}, Reinforcements: ${reinforcements.length}, Attackers: ${attackers.length}`);
    
    if (reinforcements.length === 0) {
      // No reinforcements, just regular castle combat
      console.log('No reinforcements found, falling back to regular combat');
      return this.resolveRegularCombat(tile, tile.getAllFactions().concat([castleFaction]));
    }
    
    if (attackers.length === 0) {
      console.log('No attackers found, should not happen');
      return;
    }
    
    // Phase 1: Attackers vs Reinforcements
    console.log('⚔️ Phase 1: Attackers vs Castle Reinforcements');
    const reinforcementStrength = reinforcements.reduce((sum, unit) => sum + unit.count, 0);
    const attackerStrength = attackers.reduce((sum, unit) => sum + unit.count, 0);
    
    console.log(`Reinforcements: ${reinforcementStrength}, Attackers: ${attackerStrength}`);
    
    if (attackerStrength > reinforcementStrength) {
      // Attackers win phase 1, continue to castle
      const survivingAttackers = attackerStrength - reinforcementStrength;
      console.log(`✅ Attackers won Phase 1 with ${survivingAttackers} survivors`);
      
      // Remove reinforcements (keep only non-castle-faction units)
      tile.units = tile.units.filter(unit => unit.factionId !== castleFaction);
      
      // Distribute survivors proportionally among attacking factions
      const attackerFactions = {};
      attackers.forEach(unit => {
        if (!attackerFactions[unit.factionId]) {
          attackerFactions[unit.factionId] = 0;
        }
        attackerFactions[unit.factionId] += unit.count;
      });
      
      // Clear all attacking units and redistribute survivors
      Object.keys(attackerFactions).forEach(factionId => {
        tile.units = tile.units.filter(unit => unit.factionId !== parseInt(factionId));
      });
      
      // Add survivors proportionally
      if (survivingAttackers > 0) {
        Object.entries(attackerFactions).forEach(([factionId, originalCount]) => {
          const proportion = originalCount / attackerStrength;
          const factionSurvivors = Math.floor(survivingAttackers * proportion);
          if (factionSurvivors > 0) {
            tile.addUnit({
              factionId: parseInt(factionId),
              count: factionSurvivors,
              x: tile.x,
              y: tile.y,
              isMoving: false
            });
          }
        });
      }
      
      // Phase 2: Use regular combat for remaining attackers vs castle
      console.log(`⚔️ Phase 2: ${survivingAttackers} remaining attackers vs Castle (${tile.castle.unitCount} units)`);
      
      // Let regular combat handle multiple attacking factions vs castle
      const remainingFactions = tile.getAllFactions();
      remainingFactions.push(castleFaction);
      return this.resolveRegularCombat(tile, remainingFactions);
    } else {
      // Reinforcements win, attackers defeated
      const survivingReinforcements = reinforcementStrength - attackerStrength;
      console.log(`🛡️ Reinforcements won! ${survivingReinforcements} reinforcements survive`);
      
      // Remove attackers (keep only castle-faction units)  
      tile.units = tile.units.filter(unit => unit.factionId === castleFaction);
      if (survivingReinforcements > 0) {
        // Merge surviving reinforcements back into castle
        tile.castle.unitCount += survivingReinforcements;
        tile.units = tile.units.filter(unit => unit.factionId !== castleFaction);
      }
    }
  }

  static resolveRegularCombat(tile, factions) {
    console.log('⚔️ REGULAR COMBAT!');
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
