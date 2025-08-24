export class CombatSystem {
  static resolveCombat(tile) {
    console.log('='.repeat(60));
    console.log(`🎯 COMBAT INITIATED at tile (${tile.x}, ${tile.y})`);
    console.log('='.repeat(60));
    
    const factions = tile.getAllFactions();
    const castleFaction = tile.castle ? tile.castle.factionId : null;

    // Add castle faction to the list if it exists and is different
    if (castleFaction !== null && !factions.includes(castleFaction)) {
      factions.push(castleFaction);
    }

    // Detailed pre-combat state
    console.log(`📊 PRE-COMBAT STATE:`);
    console.log(`   Factions involved: ${factions.length} →`, factions.map(f => `Faction ${f}`));
    
    if (tile.units.length > 0) {
      console.log(`   Mobile units on tile:`);
      tile.units.forEach(unit => {
        console.log(`     • Faction ${unit.factionId}: ${unit.count} units ${unit.isMoving ? '(moving)' : '(stationary)'}`);
      });
    } else {
      console.log(`   Mobile units on tile: None`);
    }
    
    if (tile.castle) {
      console.log(`   Castle: Faction ${tile.castle.factionId} with ${tile.castle.unitCount} units`);
    } else {
      console.log(`   Castle: None`);
    }
    console.log('');

    if (factions.length <= 1) {
      // No combat needed - merge same faction units
      if (factions.length === 1) {
        console.log('🤝 NO COMBAT: All units belong to same faction - merging');
        this.mergeSameFactionUnits(tile, factions[0]);
        
        // If there's a castle of the same faction, merge units into castle
        if (tile.castle && tile.castle.factionId === factions[0]) {
          const tileUnits = tile.getTotalUnitsForFaction(factions[0]);
          if (tileUnits > 0) {
            console.log(`🏰 Merging ${tileUnits} units into friendly castle`);
            tile.castle.unitCount += tileUnits;
            tile.units = tile.units.filter(unit => unit.factionId !== factions[0]);
            console.log(`   Castle now has ${tile.castle.unitCount} units`);
          }
        }
      } else {
        console.log('🤝 NO COMBAT: No units on tile');
      }
      console.log('='.repeat(60));
      return;
    }

    // Determine combat type
    console.log('🔍 COMBAT TYPE DETERMINATION:');
    if (tile.castle && tile.units.length > 0) {
      const castleFactionUnits = tile.getUnitsForFaction(tile.castle.factionId);
      const enemyUnits = tile.units.filter(unit => unit.factionId !== tile.castle.factionId);
      
      console.log(`   Castle present: Faction ${tile.castle.factionId}`);
      console.log(`   Friendly reinforcements: ${castleFactionUnits.length} unit groups`);
      console.log(`   Enemy attackers: ${enemyUnits.length} unit groups`);
      
      if (castleFactionUnits.length > 0) {
        console.log('   → REINFORCED CASTLE COMBAT');
        return this.resolveReinforcedCastleCombat(tile);
      } else {
        console.log('   → REGULAR CASTLE COMBAT (no reinforcements)');
        return this.resolveRegularCombat(tile, factions);
      }
    } else if (tile.castle) {
      console.log(`   Castle present but no mobile units → REGULAR CASTLE COMBAT`);
      return this.resolveRegularCombat(tile, factions);
    } else {
      console.log(`   No castle present → REGULAR FIELD COMBAT`);
      return this.resolveRegularCombat(tile, factions);
    }
  }

  static resolveReinforcedCastleCombat(tile) {
    console.log('');
    console.log('🏰⚔️ REINFORCED CASTLE COMBAT ANALYSIS:');
    console.log('-'.repeat(50));
    
    const castleFaction = tile.castle.factionId;
    const reinforcements = tile.getUnitsForFaction(castleFaction);
    const attackers = tile.units.filter(unit => unit.factionId !== castleFaction);
    
    console.log(`📋 FORCE COMPOSITION:`);
    console.log(`   Castle: Faction ${castleFaction} with ${tile.castle.unitCount} units`);
    console.log(`   Reinforcement groups: ${reinforcements.length}`);
    reinforcements.forEach((unit, i) => {
      console.log(`     ${i+1}. ${unit.count} units (Faction ${unit.factionId})`);
    });
    console.log(`   Attacker groups: ${attackers.length}`);
    attackers.forEach((unit, i) => {
      console.log(`     ${i+1}. ${unit.count} units (Faction ${unit.factionId})`);
    });
    
    if (reinforcements.length === 0) {
      console.log('❌ ERROR: No reinforcements found, falling back to regular combat');
      return this.resolveRegularCombat(tile, tile.getAllFactions().concat([castleFaction]));
    }
    
    if (attackers.length === 0) {
      console.log('❌ ERROR: No attackers found, this should not happen');
      return;
    }
    
    // COMBINED DEFENSE: Reinforcements + Castle fight as one force
    const reinforcementStrength = reinforcements.reduce((sum, unit) => sum + unit.count, 0);
    const castleStrength = tile.castle.unitCount;
    const combinedDefense = reinforcementStrength + castleStrength;
    const attackerStrength = attackers.reduce((sum, unit) => sum + unit.count, 0);
    
    console.log('');
    console.log(`⚔️ BATTLE STRENGTH CALCULATION:`);
    console.log(`   Reinforcements: ${reinforcementStrength} units`);
    console.log(`   Castle garrison: ${castleStrength} units`);
    console.log(`   → Combined Defense: ${reinforcementStrength} + ${castleStrength} = ${combinedDefense} units`);
    console.log(`   → Total Attackers: ${attackerStrength} units`);
    console.log('');
    console.log(`🎲 COMBAT RESOLUTION: ${combinedDefense} vs ${attackerStrength}`);
    
    if (attackerStrength > combinedDefense) {
      // Attackers win - conquer castle
      const survivingAttackers = attackerStrength - combinedDefense;
      console.log(`💥 ATTACKERS VICTORY!`);
      console.log(`   Casualties: ${combinedDefense} defenders eliminated`);
      console.log(`   Survivors: ${survivingAttackers} attackers`);
      
      // Remove all defenders (reinforcements)
      console.log(`🧹 Removing all defender reinforcements from tile`);
      tile.units = tile.units.filter(unit => unit.factionId !== castleFaction);
      
      // Determine winning attacker faction (in case of multiple)
      let winningAttackerFaction = attackers[0].factionId;
      if (attackers.length > 1) {
        console.log(`🤔 Multiple attacker factions - determining primary conquerer:`);
        // Find the attacker faction with most units
        const attackerFactions = {};
        attackers.forEach(unit => {
          if (!attackerFactions[unit.factionId]) {
            attackerFactions[unit.factionId] = 0;
          }
          attackerFactions[unit.factionId] += unit.count;
        });
        
        let maxCount = 0;
        Object.entries(attackerFactions).forEach(([factionId, count]) => {
          console.log(`     Faction ${factionId}: ${count} units`);
          if (count > maxCount) {
            maxCount = count;
            winningAttackerFaction = parseInt(factionId);
          }
        });
        console.log(`     → Faction ${winningAttackerFaction} takes castle (largest force)`);
      }
      
      // Castle changes ownership
      const oldCastleFaction = tile.castle.factionId;
      const oldCastleUnits = tile.castle.unitCount;
      tile.castle.factionId = winningAttackerFaction;
      tile.castle.unitCount = survivingAttackers;
      
      // Clear all units from tile (attackers are now in the castle)
      tile.units = [];
      
      console.log(`🏰 CASTLE CONQUERED!`);
      console.log(`   Previous: Faction ${oldCastleFaction} with ${oldCastleUnits} units`);
      console.log(`   New: Faction ${winningAttackerFaction} with ${survivingAttackers} units`);
      
    } else {
      // Defenders win
      const survivingDefenders = combinedDefense - attackerStrength;
      console.log(`🛡️ DEFENDERS VICTORY!`);
      console.log(`   Casualties: ${attackerStrength} attackers eliminated`);
      console.log(`   Survivors: ${survivingDefenders} defenders`);
      
      // Remove all attackers
      console.log(`🧹 Removing all attackers from tile:`);
      attackers.forEach(attacker => {
        console.log(`     Removing ${attacker.count} units of Faction ${attacker.factionId}`);
        tile.units = tile.units.filter(unit => unit.factionId !== attacker.factionId);
      });
      
      // Distribute survivors: Losses come from reinforcements first, then castle
      const totalLosses = attackerStrength; // Total losses = attacker strength
      console.log('');
      console.log(`📊 SURVIVOR DISTRIBUTION:`);
      console.log(`   Total losses to distribute: ${totalLosses}`);
      console.log(`   Available reinforcements: ${reinforcementStrength}`);
      console.log(`   Castle garrison: ${castleStrength}`);
      
      if (totalLosses >= reinforcementStrength) {
        // All reinforcements lost, some/all castle units lost
        const castleLosses = totalLosses - reinforcementStrength;
        const castleSurvivors = castleStrength - castleLosses;
        
        console.log(`   → All ${reinforcementStrength} reinforcements lost`);
        console.log(`   → ${castleLosses} castle casualties`);
        console.log(`   → ${castleSurvivors} castle survivors`);
        
        // Remove all reinforcements
        tile.units = tile.units.filter(unit => unit.factionId !== castleFaction);
        
        // Update castle with survivors
        tile.castle.unitCount = Math.max(0, castleSurvivors);
        
        console.log(`🏰 FINAL STATE:`);
        console.log(`   Reinforcements: 0 (all eliminated)`);
        console.log(`   Castle: ${tile.castle.unitCount} units`);
        
      } else {
        // Some reinforcements lost, castle untouched
        const reinforcementSurvivors = reinforcementStrength - totalLosses;
        
        console.log(`   → ${totalLosses} reinforcement casualties`);
        console.log(`   → ${reinforcementSurvivors} reinforcement survivors`);
        console.log(`   → Castle untouched (${castleStrength} units)`);
        
        // Update reinforcements
        tile.units = tile.units.filter(unit => unit.factionId !== castleFaction);
        if (reinforcementSurvivors > 0) {
          tile.addUnit({
            factionId: castleFaction,
            count: reinforcementSurvivors,
            x: tile.x,
            y: tile.y,
            isMoving: false
          });
        }
        
        console.log(`🏰 FINAL STATE:`);
        console.log(`   Reinforcements: ${reinforcementSurvivors} units`);
        console.log(`   Castle: ${castleStrength} units (unchanged)`);
      }
    }
    
    console.log('='.repeat(60));
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
