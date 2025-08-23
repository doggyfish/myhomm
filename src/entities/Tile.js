export class Tile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.units = [];
    this.castle = null;
  }

  isPassable() {
    return this.type.passable;
  }

  addUnit(unit) {
    this.units.push(unit);
  }

  removeUnit(unit) {
    const index = this.units.indexOf(unit);
    if (index > -1) {
      this.units.splice(index, 1);
    }
  }

  setCastle(castle) {
    this.castle = castle;
  }

  getUnitsForFaction(factionId) {
    return this.units.filter((unit) => unit.factionId === factionId);
  }

  getTotalUnitsForFaction(factionId) {
    const factionUnits = this.getUnitsForFaction(factionId);
    return factionUnits.reduce((sum, unit) => sum + unit.count, 0);
  }

  getAllFactions() {
    const factions = new Set();
    this.units.forEach((unit) => factions.add(unit.factionId));
    return Array.from(factions);
  }
}
