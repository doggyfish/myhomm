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
        
        // Units
        this.unitCount = 10;
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
        
        // Resources (for future resource system)
        this.goldProduction = 2; // Gold per second
        this.constructionQueue = []; // For future building queue
        
        // Visual properties
        this.type = 'basic'; // For different castle types
        this.health = 100;   // For siege mechanics
        this.defenseBonus = 0; // Defensive advantage
    }
    
    /**
     * Update castle production - should be called every frame
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if unit was produced
     */
    updateProduction(currentTime) {
        if (!this.isProducing) return false;
        
        const timeSinceLastProduction = currentTime - this.lastProductionTime;
        const actualInterval = this.productionInterval / this.getProductionMultiplier();
        
        if (timeSinceLastProduction >= actualInterval && this.unitCount < this.maxUnitCount) {
            this.produceUnit();
            this.lastProductionTime = currentTime;
            return true;
        }
        return false;
    }
    
    /**
     * Produce a single unit
     */
    produceUnit() {
        if (this.unitCount < this.maxUnitCount) {
            this.unitCount++;
            this.owner.updateStatistics({ unitsProduced: this.owner.statistics.unitsProduced + 1 });
            
            // Add gold production (for future resource system)
            this.owner.addGold(this.goldProduction);
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
        const unitsToSend = Math.floor(this.unitCount * percentage);
        
        if (unitsToSend <= 0) {
            console.log(`Castle at ${this.x},${this.y}: Not enough units to send army!`);
            return null;
        }
        
        // Create army data
        const armyData = {
            x: this.x,
            y: this.y,
            targetX: targetX,
            targetY: targetY,
            unitCount: unitsToSend,
            owner: this.owner,
            moveProgress: 0,
            moveSpeed: 0.02,
            isStationary: false,
            sourceType: 'castle',
            sourceId: this.getId()
        };
        
        // Remove units from castle
        this.unitCount -= unitsToSend;
        
        console.log(`Castle sent army with ${unitsToSend} units to ${targetX}, ${targetY}`);
        return armyData;
    }
    
    /**
     * Receive reinforcements (merge incoming army)
     * @param {number} unitCount - Number of units to add
     * @param {Player} owner - Owner of incoming units
     * @returns {boolean} True if reinforcement accepted
     */
    receiveReinforcements(unitCount, owner) {
        if (this.owner === owner) {
            const unitsToAdd = Math.min(unitCount, this.maxUnitCount - this.unitCount);
            this.unitCount += unitsToAdd;
            console.log(`Castle reinforced with ${unitsToAdd} units! Total: ${this.unitCount}`);
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
    upgrade(upgradeType, cost = 100) {
        if (this.owner.canAfford(cost) && this.upgrades.hasOwnProperty(upgradeType)) {
            if (this.owner.spendGold(cost)) {
                this.upgrades[upgradeType]++;
                this.applyUpgrade(upgradeType);
                console.log(`Castle upgraded: ${upgradeType} level ${this.upgrades[upgradeType]}`);
                return true;
            }
        }
        return false;
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
            unitCount: this.unitCount,
            level: this.level,
            upgrades: this.upgrades,
            lastProductionTime: this.lastProductionTime,
            isProducing: this.isProducing,
            type: this.type,
            health: this.health
        };
    }
    
    /**
     * Import castle data from save
     * @param {Object} data - Castle data to import
     * @param {Player} owner - Player object to assign as owner
     */
    static fromJSON(data, owner) {
        const castle = new Castle(data.x, data.y, owner);
        castle.unitCount = data.unitCount || 10;
        castle.level = data.level || 1;
        castle.upgrades = data.upgrades || castle.upgrades;
        castle.lastProductionTime = data.lastProductionTime || Date.now();
        castle.isProducing = data.isProducing !== undefined ? data.isProducing : true;
        castle.type = data.type || 'basic';
        castle.health = data.health || 100;
        
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