/**
 * Castle class representing a fortress that produces units and serves as a strategic point
 */
class Castle {
    /**
     * Create a Castle instance
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {Player} owner - Player who owns this castle
     */
    constructor(x, y, owner) {
        // Position
        this.x = x;
        this.y = y;
        
        // Ownership
        this.owner = owner;
        this.selected = false;
        
        // Units (legacy property for compatibility)
        this.maxUnitCount = 999; // Maximum units castle can hold
        
        // Production
        this.productionRate = 1; // Units per second
        this.lastProductionTime = Date.now();
        this.productionInterval = 1000; // 1 second in milliseconds
        this.isProducing = true;
        
        // Castle properties for future enhancements
        this.level = 1;
        this.upgrades = {
            production: 0,  // Production rate multiplier
            defense: 0,     // Defense bonus
            capacity: 0     // Max unit capacity bonus
        };
        
        // Resources (active resource system)
        this.goldProduction = 2; // Gold per second
        this.constructionQueue = []; // For future building queue
        this.lastGoldTime = Date.now(); // Track gold production
        
        // Unit type system
        this.unitTypes = {
            infantry: {
                cost: 3,
                productionTime: 1000, // 1 second
                lastProduced: Date.now(),
                count: 10 // Starting infantry
            },
            cavalry: {
                cost: 6,
                productionTime: 3000, // 3 seconds
                lastProduced: Date.now(),
                count: 0
            },
            archers: {
                cost: 4,
                productionTime: 2000, // 2 seconds
                lastProduced: Date.now(),
                count: 0
            }
        };
        
        // Current production queue cycle
        this.productionCycle = ['infantry', 'archers', 'cavalry'];
        this.currentProductionIndex = 0;
        
        // Visual properties
        this.type = 'basic'; // For different castle types
        this.health = 100;   // For siege mechanics
        this.defenseBonus = 0; // Defensive advantage
    }
    
    /**
     * Legacy compatibility: Get total unit count
     * @returns {number} Total units in castle
     */
    get unitCount() {
        return this.getTotalUnits();
    }
    
    /**
     * Legacy compatibility: Set unit count (distributes to infantry)
     * @param {number} count - New unit count
     */
    set unitCount(count) {
        // For compatibility, set infantry count
        if (this.unitTypes && this.unitTypes.infantry) {
            this.unitTypes.infantry.count = Math.max(0, count);
        }
    }
    
    /**
     * Update castle production - should be called every frame
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if unit was produced
     */
    updateProduction(currentTime) {
        if (!this.isProducing) return false;
        
        // Update gold production
        this.updateGoldProduction(currentTime);
        
        let unitProduced = false;
        
        // Check each unit type for production
        Object.keys(this.unitTypes).forEach(unitType => {
            if (this.checkUnitTypeProduction(unitType, currentTime)) {
                this.produceUnitOfType(unitType);
                unitProduced = true;
            }
        });
        
        return unitProduced;
    }
    
    /**
     * Check if a specific unit type can be produced
     * @param {string} unitType - Type of unit to check
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if unit can be produced
     */
    checkUnitTypeProduction(unitType, currentTime) {
        const unitData = this.unitTypes[unitType];
        if (!unitData) return false;
        
        const timeSinceLastProduction = currentTime - unitData.lastProduced;
        const adjustedProductionTime = unitData.productionTime / this.getProductionMultiplier();
        
        return timeSinceLastProduction >= adjustedProductionTime && 
               this.getTotalUnits() < this.maxUnitCount && 
               this.owner.canAfford(unitData.cost);
    }
    
    /**
     * Produce a unit of specific type
     * @param {string} unitType - Type of unit to produce
     */
    produceUnitOfType(unitType) {
        const unitData = this.unitTypes[unitType];
        if (!unitData) return;
        
        if (this.owner.spendGold(unitData.cost)) {
            unitData.count++;
            unitData.lastProduced = Date.now();
            this.owner.updateStatistics({ unitsProduced: this.owner.statistics.unitsProduced + 1 });
            console.log(`${this.owner.name} produced ${unitType} for ${unitData.cost} gold. Total ${unitType}: ${unitData.count}`);
        }
    }
    
    /**
     * Get total units in castle (all types combined)
     * @returns {number} Total unit count
     */
    getTotalUnits() {
        return Object.values(this.unitTypes).reduce((sum, unitData) => sum + unitData.count, 0);
    }
    
    /**
     * Update gold production for this castle
     * @param {number} currentTime - Current timestamp
     */
    updateGoldProduction(currentTime) {
        const timeSinceLastGold = currentTime - this.lastGoldTime;
        if (timeSinceLastGold >= 1000) { // Every second
            const goldToAdd = this.goldProduction * Math.floor(timeSinceLastGold / 1000);
            this.owner.addGold(goldToAdd);
            this.lastGoldTime = currentTime;
        }
    }
    
    
    /**
     * Send army from this castle
     * @param {number} targetX - Target grid X position
     * @param {number} targetY - Target grid Y position
     * @param {number} percentage - Percentage of units to send (0-1), default 0.5
     * @returns {Object|null} Army data or null if can't send
     */
    sendArmy(targetX, targetY, percentage = 0.5) {
        const totalUnits = this.getTotalUnits();
        const unitsToSend = Math.floor(totalUnits * percentage);
        
        if (unitsToSend <= 0) {
            console.log(`Castle at ${this.x},${this.y}: Not enough units to send army!`);
            return null;
        }
        
        // Calculate unit composition for the army
        const armyComposition = this.calculateArmyComposition(unitsToSend);
        
        // Create army data
        const armyData = {
            x: this.x,
            y: this.y,
            targetX: targetX,
            targetY: targetY,
            unitCount: unitsToSend,
            unitTypes: armyComposition,
            owner: this.owner,
            moveProgress: 0,
            moveSpeed: 0.02,
            isStationary: false,
            sourceType: 'castle',
            sourceId: this.getId()
        };
        
        // Remove units from castle
        this.removeUnitsFromCastle(armyComposition);
        
        console.log(`Castle sent army with ${unitsToSend} units (${JSON.stringify(armyComposition)}) to ${targetX}, ${targetY}`);
        return armyData;
    }
    
    /**
     * Calculate unit composition for army based on available units
     * @param {number} totalToSend - Total units to send in army
     * @returns {Object} Unit composition for army
     */
    calculateArmyComposition(totalToSend) {
        const composition = {
            infantry: 0,
            cavalry: 0,
            archers: 0
        };
        
        let remainingToSend = totalToSend;
        
        // Distribute units proportionally
        Object.keys(this.unitTypes).forEach(unitType => {
            const availableOfType = this.unitTypes[unitType].count;
            const proportionToSend = Math.min(availableOfType, Math.floor(remainingToSend * 0.33));
            composition[unitType] = proportionToSend;
            remainingToSend -= proportionToSend;
        });
        
        // Add remaining units to infantry
        if (remainingToSend > 0) {
            const infantryAvailable = this.unitTypes.infantry.count - composition.infantry;
            composition.infantry += Math.min(remainingToSend, infantryAvailable);
        }
        
        return composition;
    }
    
    /**
     * Remove specified units from castle
     * @param {Object} unitsToRemove - Units to remove by type
     */
    removeUnitsFromCastle(unitsToRemove) {
        Object.keys(unitsToRemove).forEach(unitType => {
            if (this.unitTypes[unitType]) {
                this.unitTypes[unitType].count -= unitsToRemove[unitType];
                this.unitTypes[unitType].count = Math.max(0, this.unitTypes[unitType].count);
            }
        });
    }
    
    /**
     * Receive reinforcements (merge incoming army)
     * @param {number} unitCount - Number of units to add
     * @param {Player} owner - Owner of incoming units
     * @returns {boolean} True if reinforcement accepted
     */
    receiveReinforcements(unitCount, owner, unitTypes = null) {
        if (this.owner === owner) {
            const currentTotal = this.getTotalUnits();
            const unitsToAdd = Math.min(unitCount, this.maxUnitCount - currentTotal);
            
            if (unitTypes) {
                // Add specific unit types
                Object.keys(unitTypes).forEach(unitType => {
                    if (this.unitTypes[unitType]) {
                        this.unitTypes[unitType].count += unitTypes[unitType];
                    }
                });
            } else {
                // Default to infantry
                this.unitTypes.infantry.count += unitsToAdd;
            }
            
            console.log(`Castle reinforced with ${unitsToAdd} units! Total: ${this.getTotalUnits()}`);
            return true;
        }
        return false;
    }
    
    /**
     * Handle incoming attack
     * @param {number} attackerUnits - Number of attacking units
     * @param {Player} attacker - Attacking player
     * @returns {Object} Combat result
     */
    defendAgainstAttack(attackerUnits, attacker) {
        const defenderUnits = this.unitCount;
        const defenseValue = defenderUnits + (defenderUnits * this.defenseBonus);
        
        const result = {
            attackerWins: false,
            defenderWins: false,
            attackerLosses: 0,
            defenderLosses: 0,
            remainingUnits: 0
        };
        
        if (attackerUnits > defenseValue) {
            // Attacker wins - castle changes ownership
            result.attackerWins = true;
            result.defenderLosses = defenderUnits;
            result.remainingUnits = attackerUnits - defenderUnits;
            
            // Record statistics
            this.owner.recordBattle(false);
            this.owner.recordCastleChange(false);
            attacker.recordBattle(true);
            attacker.recordCastleChange(true);
            
            // Change ownership
            this.owner = attacker;
            this.unitCount = result.remainingUnits;
            
            console.log(`${attacker.name} conquered castle! Remaining units: ${result.remainingUnits}`);
        } else {
            // Defender wins - keeps castle
            result.defenderWins = true;
            result.attackerLosses = attackerUnits;
            result.remainingUnits = defenderUnits - attackerUnits;
            
            // Record statistics
            this.owner.recordBattle(true);
            attacker.recordBattle(false);
            
            this.unitCount = result.remainingUnits;
            
            console.log(`${this.owner.name} defended castle! Remaining units: ${result.remainingUnits}`);
        }
        
        return result;
    }
    
    /**
     * Upgrade castle feature
     * @param {string} upgradeType - Type of upgrade ('production', 'defense', 'capacity')
     * @param {number} cost - Cost of upgrade
     * @returns {boolean} True if upgrade successful
     */
    upgrade(upgradeType) {
        if (!this.upgrades.hasOwnProperty(upgradeType)) {
            console.log(`Invalid upgrade type: ${upgradeType}`);
            return false;
        }
        
        const cost = this.getUpgradeCost(upgradeType);
        
        if (this.owner.canAfford(cost)) {
            if (this.owner.spendGold(cost)) {
                this.upgrades[upgradeType]++;
                this.applyUpgrade(upgradeType);
                console.log(`${this.owner.name} upgraded castle ${upgradeType} to level ${this.upgrades[upgradeType]} for ${cost} gold`);
                this.triggerUpgradeEffects(upgradeType);
                return true;
            }
        } else {
            console.log(`${this.owner.name} cannot afford ${upgradeType} upgrade (costs ${cost} gold, has ${this.owner.resources.gold})`);
        }
        return false;
    }
    
    /**
     * Trigger additional effects when castle is upgraded
     * @param {string} upgradeType - Type of upgrade completed
     */
    triggerUpgradeEffects(upgradeType) {
        switch (upgradeType) {
            case 'production':
                // Reset production timers to apply new rates immediately
                Object.keys(this.unitTypes).forEach(unitType => {
                    this.unitTypes[unitType].lastProduced = Date.now();
                });
                break;
            case 'capacity':
                // Capacity upgrade takes effect immediately
                console.log(`Castle capacity increased to ${this.maxUnitCount} units`);
                break;
            case 'defense':
                // Defense upgrade affects combat immediately
                console.log(`Castle defense bonus increased to ${(this.defenseBonus * 100).toFixed(0)}%`);
                break;
        }
    }
    
    /**
     * Apply upgrade effects
     * @param {string} upgradeType - Type of upgrade to apply
     */
    applyUpgrade(upgradeType) {
        switch (upgradeType) {
            case 'production':
                // Each level increases production by 20%
                break; // Handled in getProductionMultiplier()
            case 'defense':
                this.defenseBonus = this.upgrades.defense * 0.1; // 10% per level
                break;
            case 'capacity':
                this.maxUnitCount = 999 + (this.upgrades.capacity * 100); // +100 per level
                break;
        }
    }
    
    /**
     * Get production rate multiplier based on upgrades
     * @returns {number} Production multiplier
     */
    getProductionMultiplier() {
        return 1 + (this.upgrades.production * 0.2);
    }
    
    /**
     * Get upgrade cost for next level
     * @param {string} upgradeType - Type of upgrade
     * @returns {number} Cost for next upgrade level
     */
    getUpgradeCost(upgradeType) {
        const baseCosts = {
            production: 100,
            defense: 150,
            capacity: 200
        };
        
        const currentLevel = this.upgrades[upgradeType] || 0;
        return baseCosts[upgradeType] * Math.pow(1.5, currentLevel);
    }
    
    /**
     * Select/deselect this castle
     * @param {boolean} selected - Selection state
     */
    setSelected(selected) {
        this.selected = selected;
    }
    
    /**
     * Get unique identifier for this castle
     * @returns {string} Unique ID
     */
    getId() {
        return `castle_${this.x}_${this.y}`;
    }
    
    /**
     * Get castle efficiency (units produced per minute)
     * @returns {number} Units per minute
     */
    getEfficiency() {
        const unitsPerSecond = this.productionRate * this.getProductionMultiplier();
        return Math.round(unitsPerSecond * 60);
    }
    
    /**
     * Check if castle is at maximum capacity
     * @returns {boolean} True if at max capacity
     */
    isAtMaxCapacity() {
        return this.unitCount >= this.maxUnitCount;
    }
    
    /**
     * Get castle strength (for AI evaluation)
     * @returns {number} Relative strength value
     */
    getStrength() {
        return this.unitCount + (this.unitCount * this.defenseBonus);
    }
    
    /**
     * Export castle data for saving
     * @returns {Object} Serializable castle data
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            ownerId: this.owner.id,
            unitTypes: this.unitTypes,
            level: this.level,
            upgrades: this.upgrades,
            lastProductionTime: this.lastProductionTime,
            lastGoldTime: this.lastGoldTime,
            isProducing: this.isProducing,
            type: this.type,
            health: this.health,
            goldProduction: this.goldProduction,
            productionCycle: this.productionCycle,
            currentProductionIndex: this.currentProductionIndex
        };
    }
    
    /**
     * Import castle data from save
     * @param {Object} data - Castle data to import
     * @param {Player} owner - Player object to assign as owner
     */
    static fromJSON(data, owner) {
        const castle = new Castle(data.x, data.y, owner);
        
        // Restore unit types or use legacy unitCount
        if (data.unitTypes) {
            castle.unitTypes = data.unitTypes;
        } else if (data.unitCount) {
            castle.unitTypes.infantry.count = data.unitCount;
        }
        
        castle.level = data.level || 1;
        castle.upgrades = data.upgrades || castle.upgrades;
        castle.lastProductionTime = data.lastProductionTime || Date.now();
        castle.lastGoldTime = data.lastGoldTime || Date.now();
        castle.isProducing = data.isProducing !== undefined ? data.isProducing : true;
        castle.type = data.type || 'basic';
        castle.health = data.health || 100;
        castle.goldProduction = data.goldProduction || 2;
        castle.productionCycle = data.productionCycle || castle.productionCycle;
        castle.currentProductionIndex = data.currentProductionIndex || 0;
        
        // Apply upgrades
        Object.keys(castle.upgrades).forEach(upgradeType => {
            castle.applyUpgrade(upgradeType);
        });
        
        return castle;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Castle;
}