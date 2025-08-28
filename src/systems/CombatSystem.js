export class CombatSystem {
  // Helper function to get all neighboring tiles (including diagonal)
  static getSurroundingTiles(tile, map) {
    const surroundingTiles = [];
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },  /*center tile*/     { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
    ];
    
    for (const dir of directions) {
      const newX = tile.x + dir.dx;
      const newY = tile.y + dir.dy;
      
      // Check bounds
      if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length) {
        surroundingTiles.push(map[newY][newX]);
      }
    }
    
    return surroundingTiles;
  }
  
  // Get all reinforcement units for a faction from castle tile, surrounding tiles, and nearby moving units
  static getAllReinforcementsForCastle(castleTile, castleFaction, map, movingUnits = []) {
    const allReinforcements = [];
    
    // Units on the castle tile itself
    const castleTileUnits = castleTile.getUnitsForFaction(castleFaction);
    castleTileUnits.forEach(unit => {
      allReinforcements.push({ unit, tile: castleTile, location: 'castle_tile' });
    });
    
    // Units on surrounding tiles
    const surroundingTiles = this.getSurroundingTiles(castleTile, map);
    surroundingTiles.forEach(tile => {
      const reinforcementUnits = tile.getUnitsForFaction(castleFaction);
      reinforcementUnits.forEach(unit => {
        allReinforcements.push({ unit, tile, location: 'surrounding' });
      });
    });
    
    // Check for nearby moving units that could return to reinforce
    console.log(`   Checking ${movingUnits.length} moving units for potential reinforcements...`);
    movingUnits.forEach((movingUnit, index) => {
      console.log(`     Unit ${index}: Faction ${movingUnit.factionId}, ${movingUnit.count} units at pixel (${movingUnit.x}, ${movingUnit.y})`);
      if (movingUnit.factionId === castleFaction) {
        // Calculate distance from moving unit's current position to castle
        const TILE_SIZE = 64; // TODO: Import from GAME_CONFIG
        const currentTileX = Math.floor(movingUnit.x / TILE_SIZE);
        const currentTileY = Math.floor(movingUnit.y / TILE_SIZE);
        const distanceFromCastle = Math.abs(currentTileX - castleTile.x) + Math.abs(currentTileY - castleTile.y);
        console.log(`       → Tile (${currentTileX}, ${currentTileY}), distance ${distanceFromCastle} from castle (${castleTile.x}, ${castleTile.y})`);
        
        // If moving unit is within 1 tile of the castle, they can reinforce
        if (distanceFromCastle <= 1) {
          const unitAsReinforcement = {
            factionId: movingUnit.factionId,
            count: movingUnit.count,
            isMoving: true
          };
          allReinforcements.push({ 
            unit: unitAsReinforcement, 
            tile: null, 
            location: `moving_unit_${distanceFromCastle}tiles_away` 
          });
        }
      }
    });
    
    return allReinforcements;
  }

  static resolveCombat(tile, map = null, movingUnits = []) {
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
      const enemyUnits = tile.units.filter(unit => unit.factionId !== tile.castle.factionId);
      
      // Check for reinforcements (castle tile + surrounding tiles + nearby moving units)
      let allReinforcements = [];
      if (map) {
        allReinforcements = this.getAllReinforcementsForCastle(tile, tile.castle.factionId, map, movingUnits);
      } else {
        // Fallback to old behavior if no map provided
        const castleFactionUnits = tile.getUnitsForFaction(tile.castle.factionId);
        castleFactionUnits.forEach(unit => {
          allReinforcements.push({ unit, tile, location: 'castle_tile' });
        });
      }
      
      console.log(`   Castle present: Faction ${tile.castle.factionId}`);
      console.log(`   Friendly reinforcements: ${allReinforcements.length} unit groups`);
      allReinforcements.forEach(reinforcement => {
        console.log(`     • ${reinforcement.unit.count} units from ${reinforcement.location} ${reinforcement.unit.isMoving ? '(moving)' : '(stationary)'}`);
      });
      console.log(`   Enemy attackers: ${enemyUnits.length} unit groups`);
      
      if (allReinforcements.length > 0) {
        console.log('   → REINFORCED CASTLE COMBAT');
        return this.resolveReinforcedCastleCombat(tile, map, movingUnits);
      } else {
        console.log('   → CASTLE UNDER ATTACK (no friendly reinforcements)');
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

  static resolveReinforcedCastleCombat(tile, map = null, movingUnits = []) {
    console.log('');
    console.log('🏰⚔️ REINFORCED CASTLE COMBAT ANALYSIS:');
    console.log('-'.repeat(50));
    
    const castleFaction = tile.castle.factionId;
    
    // Get all reinforcements (castle tile + surrounding tiles + nearby moving units)
    let allReinforcements = [];
    if (map) {
      allReinforcements = this.getAllReinforcementsForCastle(tile, castleFaction, map, movingUnits);
    } else {
      // Fallback to old behavior
      const castleFactionUnits = tile.getUnitsForFaction(castleFaction);
      castleFactionUnits.forEach(unit => {
        allReinforcements.push({ unit, tile, location: 'castle_tile' });
      });
    }
    
    const attackers = tile.units.filter(unit => unit.factionId !== castleFaction);
    
    console.log(`📋 FORCE COMPOSITION:`);
    console.log(`   Castle: Faction ${castleFaction} with ${tile.castle.unitCount} units`);
    console.log(`   Reinforcement groups: ${allReinforcements.length}`);
    allReinforcements.forEach((reinforcement, i) => {
      const movingStatus = reinforcement.unit.isMoving ? '(moving)' : '(stationary)';
      console.log(`     ${i+1}. ${reinforcement.unit.count} units from ${reinforcement.location} ${movingStatus}`);
    });
    console.log(`   Attacker groups: ${attackers.length}`);
    attackers.forEach((unit, i) => {
      console.log(`     ${i+1}. ${unit.count} units (Faction ${unit.factionId})`);
    });
    
    if (allReinforcements.length === 0) {
      console.log('❌ ERROR: No reinforcements found, falling back to regular combat');
      return this.resolveRegularCombat(tile, tile.getAllFactions().concat([castleFaction]));
    }
    
    if (attackers.length === 0) {
      console.log('❌ ERROR: No attackers found, this should not happen');
      return;
    }
    
    // COMBINED DEFENSE: All reinforcements + Castle fight as one force
    const reinforcementStrength = allReinforcements.reduce((sum, reinforcement) => sum + reinforcement.unit.count, 0);
    const castleStrength = tile.castle.unitCount;
    const combinedDefense = reinforcementStrength + castleStrength;
    const attackerStrength = attackers.reduce((sum, unit) => sum + unit.count, 0);
    
    console.log('');
    console.log(`⚔️ DETAILED STRENGTH BREAKDOWN:`);
    console.log(`   Defending Forces (Faction ${castleFaction}):`);
    console.log(`     Mobile reinforcements: ${reinforcementStrength} units`);
    allReinforcements.forEach((reinforcement, i) => {
      const movingStatus = reinforcement.unit.isMoving ? '(moving)' : '(stationary)';
      console.log(`       Group ${i+1}: ${reinforcement.unit.count} units from ${reinforcement.location} ${movingStatus}`);
    });
    console.log(`     Castle garrison: ${castleStrength} units`);
    console.log(`     → Total Defense: ${reinforcementStrength} + ${castleStrength} = ${combinedDefense} units`);
    
    console.log(`   Attacking Forces:`);
    const attackersByFaction = {};
    attackers.forEach(unit => {
      if (!attackersByFaction[unit.factionId]) {
        attackersByFaction[unit.factionId] = 0;
      }
      attackersByFaction[unit.factionId] += unit.count;
    });
    Object.entries(attackersByFaction).forEach(([factionId, count]) => {
      console.log(`     Faction ${factionId}: ${count} units`);
    });
    console.log(`     → Total Attackers: ${attackerStrength} units`);
    
    console.log('');
    console.log(`🎲 COMBAT RESOLUTION: ${combinedDefense} vs ${attackerStrength}`);
    
    if (attackerStrength > combinedDefense) {
      // Attackers win - conquer castle
      const survivingAttackers = attackerStrength - combinedDefense;
      console.log(`💥 ATTACKERS VICTORY!`);
      console.log(`   Casualties: ${combinedDefense} defenders eliminated`);
      console.log(`   Survivors: ${survivingAttackers} attackers`);
      
      // Remove all defenders (reinforcements from all tiles)
      console.log(`🧹 Removing all defender reinforcements from castle area`);
      allReinforcements.forEach(reinforcement => {
        console.log(`     Removing ${reinforcement.unit.count} units from ${reinforcement.location}`);
        if (reinforcement.tile) {
          // Remove from tile (stationary units)
          reinforcement.tile.units = reinforcement.tile.units.filter(unit => unit.factionId !== castleFaction);
        } else {
          // Remove from moving units array (moving units)  
          console.log(`       (Moving unit removed from movement queue)`);
        }
      });
      
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
        
        // Remove all reinforcements from all tiles
        allReinforcements.forEach(reinforcement => {
          console.log(`     Removing ${reinforcement.unit.count} units from ${reinforcement.location}`);
          if (reinforcement.tile) {
            // Remove from tile (stationary units)
            reinforcement.tile.units = reinforcement.tile.units.filter(unit => unit.factionId !== castleFaction);
          } else {
            // Remove from moving units array (moving units)
            console.log(`       (Moving unit removed from movement queue)`);
          }
        });
        
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
        
        // Update reinforcements - remove all then add survivors to castle tile
        allReinforcements.forEach(reinforcement => {
          console.log(`     Removing ${reinforcement.unit.count} units from ${reinforcement.location}`);
          if (reinforcement.tile) {
            // Remove from tile (stationary units)
            reinforcement.tile.units = reinforcement.tile.units.filter(unit => unit.factionId !== castleFaction);
          } else {
            // Remove from moving units array (moving units)
            console.log(`       (Moving unit removed from movement queue)`);
          }
        });
        
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
    console.log('');
    console.log('⚔️ REGULAR COMBAT ANALYSIS:');
    console.log('-'.repeat(50));
    
    const combatResults = [];

    // Calculate total strength per faction (including castle units)
    const factionStrengths = {};
    console.log(`📋 DETAILED FORCE BREAKDOWN:`);
    factions.forEach((factionId) => {
      let mobileStrength = tile.getTotalUnitsForFaction(factionId);
      let castleStrength = 0;
      
      // Add castle units to the strength calculation
      if (tile.castle && tile.castle.factionId === factionId) {
        castleStrength = tile.castle.unitCount;
      }
      
      const totalStrength = mobileStrength + castleStrength;
      factionStrengths[factionId] = totalStrength;
      
      console.log(`   Faction ${factionId}:`);
      console.log(`     Mobile units: ${mobileStrength}`);
      console.log(`     Castle units: ${castleStrength}`);
      console.log(`     → Total strength: ${totalStrength}`);
    });

    console.log('');
    console.log(`⚔️ BATTLE STRENGTH CALCULATION:`);
    
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

    const survivors = maxStrength - totalEnemyStrength;
    
    console.log(`   Winning faction: ${winningFaction} with ${maxStrength} total strength`);
    console.log(`   Total enemy strength: ${totalEnemyStrength}`);
    console.log(`   → Combat result: ${maxStrength} vs ${totalEnemyStrength} = ${survivors} survivors`);

    console.log('');
    console.log(`📊 COMBAT RESOLUTION:`);
    
    // Handle mutual destruction case (equal forces)
    if (survivors <= 0) {
      console.log('💀 MUTUAL DESTRUCTION! All forces eliminated.');
      // Record combat results - everyone dies
      factions.forEach((factionId) => {
        combatResults.push({
          factionId,
          initialCount: factionStrengths[factionId],
          survived: false,
          finalCount: 0,
        });
      });
    } else {
      console.log(`✅ VICTORY! Faction ${winningFaction} wins with ${survivors} survivors`);
      // Record combat results - normal victory
      factions.forEach((factionId) => {
        combatResults.push({
          factionId,
          initialCount: factionStrengths[factionId],
          survived: factionId === winningFaction,
          finalCount: factionId === winningFaction ? survivors : 0,
        });
      });
    }

    console.log('');
    console.log(`🏰 POST-COMBAT CASTLE HANDLING:`);
    
    // Handle castle ownership change if castle exists
    if (survivors > 0) {
      // Normal victory - handle castle ownership
      if (tile.castle && tile.castle.factionId !== winningFaction) {
        console.log(`🏰 CASTLE CONQUERED!`);
        console.log(`   Previous owner: Faction ${tile.castle.factionId} with ${tile.castle.unitCount} units`);
        console.log(`   New owner: Faction ${winningFaction} with ${survivors} units`);
        tile.castle.factionId = winningFaction;
        tile.castle.unitCount = survivors;
      } else if (tile.castle && tile.castle.factionId === winningFaction) {
        // Castle defended successfully, update unit count
        console.log(`🛡️ CASTLE DEFENDED SUCCESSFULLY!`);
        console.log(`   Faction ${winningFaction} retains castle with ${survivors} units`);
        tile.castle.unitCount = survivors;
      }
    } else if (tile.castle) {
      // Mutual destruction - castle becomes neutral or empty
      console.log(`🏰 CASTLE ABANDONED! All attacking and defending forces eliminated.`);
      // Keep castle ownership but reduce to minimum garrison
      tile.castle.unitCount = Math.max(1, tile.castle.unitCount - Math.abs(survivors));
    }

    console.log('');
    console.log(`🧹 FINAL TILE CLEANUP:`);
    console.log(`   Removing all mobile units from tile`);
    
    // Remove all units from tile
    tile.units = [];

    // Add surviving units to tile only if there are survivors and they're not garrisoned in castle
    if (survivors > 0 && (!tile.castle || tile.castle.factionId !== winningFaction)) {
      console.log(`   Adding ${survivors} surviving mobile units to tile`);
      const survivingUnit = {
        factionId: winningFaction,
        count: survivors,
        x: tile.x,
        y: tile.y,
        isMoving: false,
      };
      tile.addUnit(survivingUnit);
    } else if (survivors > 0 && tile.castle && tile.castle.factionId === winningFaction) {
      console.log(`   All survivors garrisoned in castle - no mobile units remain on tile`);
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
