export class CombatSystem {
  static resolveCombat(tile) {
    const factions = tile.getAllFactions();

    if (factions.length <= 1) {
      // No combat needed - merge same faction units
      if (factions.length === 1) {
        this.mergeSameFactionUnits(tile, factions[0]);
      }
      return;
    }

    // Combat between different factions
    const combatResults = [];

    // Calculate total strength per faction
    const factionStrengths = {};
    factions.forEach((factionId) => {
      factionStrengths[factionId] = tile.getTotalUnitsForFaction(factionId);
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

    // Remove all units from tile
    tile.units = [];

    // Add surviving units
    if (survivors > 0) {
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
