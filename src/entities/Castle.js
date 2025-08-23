export class Castle {
  constructor(x, y, factionId, productionRate = 3) {
    this.x = x;
    this.y = y;
    this.factionId = factionId;
    this.productionRate = productionRate;
    this.unitCount = 10; // Starting units
    this.lastProductionTime = Date.now();
  }

  update() {
    const now = Date.now();
    const timeDiff = now - this.lastProductionTime;

    // Produce units based on production rate (units per minute)
    const unitsToAdd = Math.floor((timeDiff / 60000) * this.productionRate);

    if (unitsToAdd > 0) {
      this.unitCount += unitsToAdd;
      this.lastProductionTime = now;
    }
  }

  removeUnits(count) {
    const actualCount = Math.min(count, this.unitCount);
    this.unitCount -= actualCount;
    return actualCount;
  }

  canSendUnits(count) {
    return this.unitCount >= count;
  }
}
