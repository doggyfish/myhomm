/**
 * CombatSystem handles all combat resolution between armies and castles
 */
class CombatSystem {
    constructor() {
        this.combatHistory = [];
        this.maxHistoryLength = 100;
    }
    
    /**
     * Resolve army vs castle combat
     * @param {Army} army - Attacking army
     * @param {Castle} castle - Defending castle
     * @returns {Object} Combat result
     */
    resolveArmyVsCastle(army, castle) {
        // Check if same owner (reinforcement)
        if (army.owner === castle.owner) {
            return this.reinforceCastle(army, castle);
        }
        
        // Different owners - combat
        const result = castle.defendAgainstAttack(army.unitCount, army.owner);
        result.type = 'army_vs_castle';
        result.timestamp = Date.now();
        
        // Army is always destroyed in castle combat
        army.shouldBeRemoved = true;
        
        this.recordCombat(result, army, castle);
        return result;
    }
    
    /**
     * Resolve army vs army combat
     * @param {Army} attackingArmy - Attacking army
     * @param {Army} defendingArmy - Defending army
     * @returns {Object} Combat result
     */
    resolveArmyVsArmy(attackingArmy, defendingArmy) {
        // Check if same owner (merge)
        if (attackingArmy.owner === defendingArmy.owner) {
            return this.mergeArmies(attackingArmy, defendingArmy);
        }
        
        // Different owners - combat
        const result = attackingArmy.attack(defendingArmy);
        result.type = 'army_vs_army';
        result.timestamp = Date.now();
        
        this.recordCombat(result, attackingArmy, defendingArmy);
        return result;
    }
    
    /**
     * Reinforce castle with army units
     * @param {Army} army - Reinforcing army
     * @param {Castle} castle - Castle to reinforce
     * @returns {Object} Reinforcement result
     */
    reinforceCastle(army, castle) {
        const result = {
            type: 'reinforcement',
            timestamp: Date.now(),
            unitsAdded: army.unitCount,
            oldCastleUnits: castle.unitCount,
            newCastleUnits: 0,
            success: false
        };
        
        if (castle.receiveReinforcements(army.unitCount, army.owner)) {
            result.success = true;
            result.newCastleUnits = castle.unitCount;
            army.shouldBeRemoved = true;
            
            console.log(`${army.owner.name} reinforced castle with ${army.unitCount} units!`);
        }
        
        this.recordCombat(result, army, castle);
        return result;
    }
    
    /**
     * Merge two armies of the same owner
     * @param {Army} movingArmy - Army that moved to position
     * @param {Army} stationaryArmy - Army already at position
     * @returns {Object} Merge result
     */
    mergeArmies(movingArmy, stationaryArmy) {
        const result = {
            type: 'army_merge',
            timestamp: Date.now(),
            unitsAdded: movingArmy.unitCount,
            oldArmyUnits: stationaryArmy.unitCount,
            newArmyUnits: 0,
            success: false
        };
        
        if (stationaryArmy.mergeWith(movingArmy)) {
            result.success = true;
            result.newArmyUnits = stationaryArmy.unitCount;
            
            console.log(`Armies merged! New strength: ${stationaryArmy.unitCount} units`);
        }
        
        this.recordCombat(result, movingArmy, stationaryArmy);
        return result;
    }
    
    /**
     * Calculate combat odds before battle
     * @param {Object} attacker - Attacking unit (Army)
     * @param {Object} defender - Defending unit (Army or Castle)
     * @returns {Object} Combat prediction
     */
    calculateCombatOdds(attacker, defender) {
        const attackPower = attacker.getEffectiveCombatPower ? 
            attacker.getEffectiveCombatPower() : attacker.unitCount;
            
        const defensePower = defender.getStrength ? 
            defender.getStrength() : defender.unitCount;
            
        const totalPower = attackPower + defensePower;
        const attackerWinChance = totalPower > 0 ? (attackPower / totalPower) * 100 : 50;
        
        return {
            attackerWinChance: Math.round(attackerWinChance),
            defenderWinChance: Math.round(100 - attackerWinChance),
            attackPower: attackPower,
            defensePower: defensePower,
            recommendation: attackerWinChance > 60 ? 'favorable' : 
                           attackerWinChance > 40 ? 'even' : 'unfavorable'
        };
    }
    
    /**
     * Record combat event in history
     * @param {Object} result - Combat result
     * @param {Object} unit1 - First participating unit
     * @param {Object} unit2 - Second participating unit
     */
    recordCombat(result, unit1, unit2) {
        const combatRecord = {
            ...result,
            attacker: {
                owner: unit1.owner.name,
                type: unit1.constructor.name,
                units: unit1.unitCount
            },
            defender: {
                owner: unit2.owner.name,
                type: unit2.constructor.name,
                units: unit2.unitCount
            }
        };
        
        this.combatHistory.push(combatRecord);
        
        // Limit history size
        if (this.combatHistory.length > this.maxHistoryLength) {
            this.combatHistory.shift();
        }
    }
    
    /**
     * Get combat history for a specific player
     * @param {Player} player - Player to get history for
     * @param {number} limit - Maximum number of records to return
     * @returns {Array} Combat history records
     */
    getPlayerCombatHistory(player, limit = 10) {
        return this.combatHistory
            .filter(record => 
                record.attacker.owner === player.name || 
                record.defender.owner === player.name
            )
            .slice(-limit)
            .reverse();
    }
    
    /**
     * Get combat statistics
     * @returns {Object} Combat statistics
     */
    getStatistics() {
        const stats = {
            totalCombats: this.combatHistory.length,
            armyVsArmy: 0,
            armyVsCastle: 0,
            reinforcements: 0,
            merges: 0,
            averageBattleSize: 0
        };
        
        let totalUnitsInvolved = 0;
        
        this.combatHistory.forEach(record => {
            switch (record.type) {
                case 'army_vs_army':
                    stats.armyVsArmy++;
                    break;
                case 'army_vs_castle':
                    stats.armyVsCastle++;
                    break;
                case 'reinforcement':
                    stats.reinforcements++;
                    break;
                case 'army_merge':
                    stats.merges++;
                    break;
            }
            
            totalUnitsInvolved += (record.attacker.units || 0) + (record.defender.units || 0);
        });
        
        stats.averageBattleSize = stats.totalCombats > 0 ? 
            Math.round(totalUnitsInvolved / stats.totalCombats) : 0;
            
        return stats;
    }
    
    /**
     * Clear combat history
     */
    clearHistory() {
        this.combatHistory = [];
    }
    
    /**
     * Export combat history for saving
     * @returns {Array} Combat history data
     */
    exportHistory() {
        return this.combatHistory.slice(); // Return copy
    }
    
    /**
     * Import combat history from save
     * @param {Array} history - Combat history to import
     */
    importHistory(history) {
        this.combatHistory = Array.isArray(history) ? history : [];
    }
}

console.log('🔍 CombatSystem class defined, checking availability:', typeof CombatSystem, typeof window.CombatSystem);
window.CombatSystem = CombatSystem; // Explicitly ensure it's in global scope

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
}