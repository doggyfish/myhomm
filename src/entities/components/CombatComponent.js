export class CombatComponent {
    constructor(power, isRanged = false) {
        this.basePower = power;
        this.power = power;
        this.isRanged = isRanged;
        this.bonuses = [];
        this.lastCombatTick = 0;
        this.combatHistory = [];
    }
    
    addBonus(bonus) {
        this.bonuses.push(bonus);
        this.recalculatePower();
    }
    
    removeBonus(bonusId) {
        this.bonuses = this.bonuses.filter(bonus => bonus.id !== bonusId);
        this.recalculatePower();
    }
    
    recalculatePower() {
        let totalPower = this.basePower;
        
        for (const bonus of this.bonuses) {
            if (bonus.type === 'additive') {
                totalPower += bonus.value;
            } else if (bonus.type === 'multiplicative') {
                totalPower *= bonus.value;
            }
        }
        
        this.power = Math.max(0, totalPower);
    }
    
    getEffectivePower(terrainModifier = 1.0) {
        return this.power * terrainModifier;
    }
    
    clearBonuses() {
        this.bonuses = [];
        this.recalculatePower();
    }
    
    /**
     * Update power with bounds checking
     * @param {number} newPower - The new power value
     */
    updatePower(newPower) {
        this.power = Math.max(0, newPower);
    }
    
    /**
     * Add combat result to history
     * @param {CombatResult} combatResult - The combat result to record
     */
    addCombatToHistory(combatResult) {
        this.combatHistory.push(combatResult);
        this.lastCombatTick = Date.now();
        
        // Keep history limited to last 10 combats for memory management
        if (this.combatHistory.length > 10) {
            this.combatHistory.shift();
        }
    }
    
    /**
     * Get recent combat history
     * @param {number} count - Number of recent combats to return
     * @returns {Array} Array of recent combat results
     */
    getRecentCombats(count = 5) {
        return this.combatHistory.slice(-count);
    }
    
    /**
     * Clear combat history
     */
    clearCombatHistory() {
        this.combatHistory = [];
        this.lastCombatTick = 0;
    }
}