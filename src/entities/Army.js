/**
 * Army class representing a mobile military unit that can move and engage in combat
 */
class Army {
    /**
     * Create an Army instance
     * @param {number} x - Current grid X position
     * @param {number} y - Current grid Y position
     * @param {Player} owner - Player who owns this army
     * @param {number} unitCount - Number of units in the army
     */
    constructor(x, y, owner, unitCount) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.moveProgress = 0;
        this.moveSpeed = 0.02; // Movement speed (0-1 per frame)
        this.isStationary = true;
        
        // Army composition
        this.unitCount = unitCount;
        this.owner = owner;
        this.selected = false;
        
        // Combat properties
        this.attackPower = unitCount; // Base attack equals unit count
        this.morale = 1.0; // Morale multiplier (0.5-1.5)
        this.experience = 0; // Experience points for veteran bonuses
        this.veteranLevel = 0; // 0=Rookie, 1=Veteran, 2=Elite
        
        // Army state
        this.id = Army.generateId();
        this.shouldBeRemoved = false;
        this.lastBattleTime = 0;
        this.movementHistory = [];
        
        // Unit composition (for future unit types)
        this.unitTypes = {
            infantry: unitCount,
            cavalry: 0,
            archers: 0
        };
        
        // Formation and tactics (future enhancement)
        this.formation = 'standard';
        this.tactics = 'balanced';
        
        // Supply and logistics
        this.supply = 100; // Supply level (affects combat effectiveness)
        this.maxSupply = 100;
    }
    
    /**
     * Generate unique army ID
     * @returns {string} Unique identifier
     */
    static generateId() {
        return 'army_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Move army to target position
     * @param {number} targetX - Target grid X position
     * @param {number} targetY - Target grid Y position
     */
    moveTo(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.moveProgress = 0;
        this.isStationary = false;
        
        // Record movement for history
        this.movementHistory.push({
            from: { x: this.x, y: this.y },
            to: { x: targetX, y: targetY },
            timestamp: Date.now()
        });
        
        // Keep movement history limited
        if (this.movementHistory.length > 10) {
            this.movementHistory.shift();
        }
        
        console.log(`Army moving from (${this.x}, ${this.y}) to (${targetX}, ${targetY})`);
    }
    
    /**
     * Update army movement - called every frame
     * @returns {boolean} True if army reached destination
     */
    updateMovement() {
        if (this.isStationary) return false;
        
        this.moveProgress += this.moveSpeed;
        
        if (this.moveProgress >= 1.0) {
            // Arrived at destination
            this.x = this.targetX;
            this.y = this.targetY;
            this.moveProgress = 0;
            this.isStationary = true;
            
            console.log(`Army arrived at (${this.x}, ${this.y})`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get current visual position for rendering (interpolated during movement)
     * @returns {Object} Current position for rendering
     */
    getRenderPosition() {
        if (this.isStationary) {
            return { x: this.x, y: this.y };
        }
        
        // Interpolate position during movement
        const startX = this.movementHistory.length > 0 ? 
            this.movementHistory[this.movementHistory.length - 1].from.x : this.x;
        const startY = this.movementHistory.length > 0 ? 
            this.movementHistory[this.movementHistory.length - 1].from.y : this.y;
            
        return {
            x: startX + (this.targetX - startX) * this.moveProgress,
            y: startY + (this.targetY - startY) * this.moveProgress
        };
    }
    
    /**
     * Merge with another army (same owner)
     * @param {Army} otherArmy - Army to merge with
     * @returns {boolean} True if merge successful
     */
    mergeWith(otherArmy) {
        if (this.owner !== otherArmy.owner) {
            return false;
        }
        
        // Combine units
        this.unitCount += otherArmy.unitCount;
        
        // Average morale and experience
        const totalUnits = this.unitCount;
        this.morale = (this.morale + otherArmy.morale) / 2;
        this.experience = Math.max(this.experience, otherArmy.experience);
        
        // Update unit types
        Object.keys(this.unitTypes).forEach(type => {
            this.unitTypes[type] += otherArmy.unitTypes[type] || 0;
        });
        
        // Mark other army for removal
        otherArmy.shouldBeRemoved = true;
        
        console.log(`Armies merged! New strength: ${this.unitCount} units`);
        return true;
    }
    
    /**
     * Attack another army or castle
     * @param {Army|Castle} target - Target to attack
     * @returns {Object} Combat result
     */
    attack(target) {
        const result = {
            attackerWins: false,
            defenderWins: false,
            attackerLosses: 0,
            defenderLosses: 0,
            targetDestroyed: false
        };
        
        // Calculate effective combat power
        const attackPower = this.getEffectiveCombatPower();
        let defensePower;
        
        if (target instanceof Army) {
            defensePower = target.getEffectiveCombatPower();
        } else {
            // Attacking a castle
            defensePower = target.getStrength();
        }
        
        // Simple combat resolution
        if (attackPower > defensePower) {
            // Attacker wins
            result.attackerWins = true;
            result.defenderLosses = target.unitCount;
            result.attackerLosses = target.unitCount;
            
            this.unitCount -= result.attackerLosses;
            this.gainExperience(target.unitCount);
            
            if (target instanceof Army) {
                target.shouldBeRemoved = true;
                result.targetDestroyed = true;
            }
            
        } else if (defensePower > attackPower) {
            // Defender wins
            result.defenderWins = true;
            result.attackerLosses = this.unitCount;
            result.defenderLosses = this.unitCount;
            
            target.unitCount -= result.defenderLosses;
            if (target instanceof Army) {
                target.gainExperience(this.unitCount);
            }
            
            this.shouldBeRemoved = true;
            
        } else {
            // Tie - both destroyed
            result.attackerLosses = this.unitCount;
            result.defenderLosses = target.unitCount;
            
            this.shouldBeRemoved = true;
            if (target instanceof Army) {
                target.shouldBeRemoved = true;
                result.targetDestroyed = true;
            } else {
                target.unitCount = 0;
            }
        }
        
        // Record battle statistics
        this.lastBattleTime = Date.now();
        this.owner.recordBattle(result.attackerWins);
        
        if (target.owner) {
            target.owner.recordBattle(result.defenderWins);
        }
        
        // Update morale based on result
        if (result.attackerWins) {
            this.morale = Math.min(1.5, this.morale + 0.1);
        } else {
            this.morale = Math.max(0.5, this.morale - 0.1);
        }
        
        return result;
    }
    
    /**
     * Calculate effective combat power including bonuses
     * @returns {number} Effective combat power
     */
    getEffectiveCombatPower() {
        let power = this.unitCount;
        
        // Apply morale modifier
        power *= this.morale;
        
        // Apply veteran bonus
        power *= (1 + this.veteranLevel * 0.1);
        
        // Apply supply penalty if low
        if (this.supply < 50) {
            power *= (this.supply / 100);
        }
        
        return Math.round(power);
    }
    
    /**
     * Gain experience from battles
     * @param {number} enemyUnits - Number of enemy units defeated
     */
    gainExperience(enemyUnits) {
        this.experience += enemyUnits;
        
        // Check for veteran level increase
        const oldLevel = this.veteranLevel;
        if (this.experience >= 100 && this.veteranLevel < 2) {
            this.veteranLevel = Math.min(2, Math.floor(this.experience / 50));
        }
        
        if (this.veteranLevel > oldLevel) {
            console.log(`Army promoted to veteran level ${this.veteranLevel}!`);
        }
    }
    
    /**
     * Rest and recover (restore supply and morale)
     */
    rest() {
        this.supply = Math.min(this.maxSupply, this.supply + 10);
        this.morale = Math.min(1.5, this.morale + 0.05);
    }
    
    /**
     * Split army into two armies
     * @param {number} percentage - Percentage to split off (0-1)
     * @returns {Army|null} New army or null if can't split
     */
    split(percentage) {
        if (percentage <= 0 || percentage >= 1 || this.unitCount <= 1) {
            return null;
        }
        
        const unitsToSplit = Math.floor(this.unitCount * percentage);
        if (unitsToSplit <= 0) return null;
        
        // Create new army
        const newArmy = new Army(this.x, this.y, this.owner, unitsToSplit);
        newArmy.morale = this.morale;
        newArmy.experience = Math.floor(this.experience * percentage);
        newArmy.veteranLevel = this.veteranLevel;
        
        // Reduce current army
        this.unitCount -= unitsToSplit;
        this.experience = Math.floor(this.experience * (1 - percentage));
        
        // Split unit types proportionally
        Object.keys(this.unitTypes).forEach(type => {
            const splitUnits = Math.floor(this.unitTypes[type] * percentage);
            newArmy.unitTypes[type] = splitUnits;
            this.unitTypes[type] -= splitUnits;
        });
        
        console.log(`Army split: ${unitsToSplit} units separated`);
        return newArmy;
    }
    
    /**
     * Select/deselect this army
     * @param {boolean} selected - Selection state
     */
    setSelected(selected) {
        this.selected = selected;
    }
    
    /**
     * Check if army is at the same position as target
     * @param {number} x - X position to check
     * @param {number} y - Y position to check
     * @returns {boolean} True if at same position
     */
    isAtPosition(x, y) {
        return this.x === x && this.y === y && this.isStationary;
    }
    
    /**
     * Get army status description
     * @returns {string} Status description
     */
    getStatus() {
        const statusParts = [];
        
        if (!this.isStationary) {
            statusParts.push('Moving');
        } else {
            statusParts.push('Stationed');
        }
        
        if (this.veteranLevel > 0) {
            const levels = ['', 'Veteran', 'Elite'];
            statusParts.push(levels[this.veteranLevel]);
        }
        
        if (this.supply < 50) {
            statusParts.push('Low Supply');
        }
        
        if (this.morale < 0.8) {
            statusParts.push('Low Morale');
        }
        
        return statusParts.join(', ');
    }
    
    /**
     * Export army data for saving
     * @returns {Object} Serializable army data
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            targetX: this.targetX,
            targetY: this.targetY,
            unitCount: this.unitCount,
            ownerId: this.owner.id,
            moveProgress: this.moveProgress,
            isStationary: this.isStationary,
            morale: this.morale,
            experience: this.experience,
            veteranLevel: this.veteranLevel,
            supply: this.supply,
            unitTypes: this.unitTypes,
            formation: this.formation,
            tactics: this.tactics
        };
    }
    
    /**
     * Import army data from save
     * @param {Object} data - Army data to import
     * @param {Player} owner - Player object to assign as owner
     */
    static fromJSON(data, owner) {
        const army = new Army(data.x, data.y, owner, data.unitCount);
        army.id = data.id;
        army.targetX = data.targetX || data.x;
        army.targetY = data.targetY || data.y;
        army.moveProgress = data.moveProgress || 0;
        army.isStationary = data.isStationary !== undefined ? data.isStationary : true;
        army.morale = data.morale || 1.0;
        army.experience = data.experience || 0;
        army.veteranLevel = data.veteranLevel || 0;
        army.supply = data.supply || 100;
        army.unitTypes = data.unitTypes || army.unitTypes;
        army.formation = data.formation || 'standard';
        army.tactics = data.tactics || 'balanced';
        
        return army;
    }
}

console.log('🔍 Army class defined, checking availability:', typeof Army, typeof window.Army);
window.Army = Army; // Explicitly ensure it's in global scope

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Army;
}