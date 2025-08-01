import { Entity } from './Entity.js';
import { PositionComponent } from './components/PositionComponent.js';
import { MovementComponent } from './components/MovementComponent.js';
import { CombatComponent } from './components/CombatComponent.js';
import { UNIT_CONFIGS } from '../config/UnitConfig.js';

export class Army extends Entity {
    constructor(id, owner) {
        super(id, 'army', owner);
        
        // Store units as type -> count mapping
        this.units = new Map(); // unitType -> count
        this.spellQueue = [];
        
        // Initialize with components
        this.addComponent('position', new PositionComponent(0, 0));
        this.addComponent('movement', new MovementComponent(this.calculateSpeed()));
        this.addComponent('combat', new CombatComponent(this.calculatePower()));
    }
    
    /**
     * Add units to the army
     * @param {string} unitType - The type of unit to add
     * @param {number} count - Number of units to add
     */
    addUnits(unitType, count) {
        if (count <= 0) return false;
        
        // Validate unit type exists for faction
        const unitConfig = this.getUnitConfig(unitType);
        if (!unitConfig) {
            return false;
        }
        
        const currentCount = this.units.get(unitType) || 0;
        this.units.set(unitType, currentCount + count);
        
        // Recalculate army stats
        this.updateArmyStats();
        return true;
    }
    
    /**
     * Remove units from the army
     * @param {string} unitType - The type of unit to remove
     * @param {number} count - Number of units to remove
     */
    removeUnits(unitType, count) {
        if (count <= 0) return false;
        
        const currentCount = this.units.get(unitType) || 0;
        if (currentCount < count) {
            return false; // Not enough units to remove
        }
        
        const newCount = currentCount - count;
        if (newCount === 0) {
            this.units.delete(unitType);
        } else {
            this.units.set(unitType, newCount);
        }
        
        // Recalculate army stats
        this.updateArmyStats();
        return true;
    }
    
    /**
     * Calculate total army power (sum of all unit powers weighted by count)
     */
    calculatePower() {
        let totalPower = 0;
        
        this.units.forEach((count, unitType) => {
            const unitConfig = this.getUnitConfig(unitType);
            if (unitConfig) {
                totalPower += unitConfig.power * count;
            }
        });
        
        return totalPower;
    }
    
    /**
     * Calculate army speed (average of unique unit type speeds, NOT weighted by count)
     * Example: 100 swordsmen (speed 10) + 1 archer (speed 5) = army speed of 7.5
     */
    calculateSpeed() {
        if (this.units.size === 0) {
            return 0;
        }
        
        let totalSpeed = 0;
        let unitTypeCount = 0;
        
        // Calculate average speed based on unique unit types only
        // Unit quantities do not affect army speed
        this.units.forEach((count, unitType) => {
            const unitConfig = this.getUnitConfig(unitType);
            if (unitConfig) {
                totalSpeed += unitConfig.speed;
                unitTypeCount++;
            }
        });
        
        return unitTypeCount > 0 ? totalSpeed / unitTypeCount : 0;
    }
    
    /**
     * Get unit configuration for the army's faction
     */
    getUnitConfig(unitType) {
        const faction = this.owner ? this.owner.faction : 'human';
        return UNIT_CONFIGS[faction] ? UNIT_CONFIGS[faction][unitType] : null;
    }
    
    /**
     * Update army stats after unit changes
     */
    updateArmyStats() {
        // Update movement component speed
        const movementComponent = this.getComponent('movement');
        if (movementComponent) {
            const newSpeed = this.calculateSpeed();
            movementComponent.baseSpeed = newSpeed;
            movementComponent.currentSpeed = newSpeed;
        }
        
        // Update combat component power
        const combatComponent = this.getComponent('combat');
        if (combatComponent) {
            const newPower = this.calculatePower();
            combatComponent.basePower = newPower;
            combatComponent.recalculatePower();
        }
    }
    
    /**
     * Merge another army into this one
     * @param {Army} otherArmy - The army to merge
     */
    mergeArmy(otherArmy) {
        if (!otherArmy || otherArmy.owner !== this.owner) {
            return false; // Can't merge armies from different owners
        }
        
        // Add all units from other army
        otherArmy.units.forEach((count, unitType) => {
            this.addUnits(unitType, count);
        });
        
        // Clear the other army
        otherArmy.units.clear();
        otherArmy.updateArmyStats();
        
        return true;
    }
    
    /**
     * Split army by creating a new army with specified units
     * @param {Map} unitsToSplit - Map of unitType -> count to split off
     * @param {string} newArmyId - ID for the new army
     */
    splitArmy(unitsToSplit, newArmyId) {
        // Validate we have enough units to split
        for (const [unitType, count] of unitsToSplit) {
            const currentCount = this.units.get(unitType) || 0;
            if (currentCount < count) {
                return null; // Not enough units to split
            }
        }
        
        // Create new army
        const newArmy = new Army(newArmyId, this.owner);
        
        // Set position to same as current army
        const position = this.getComponent('position');
        if (position) {
            const newPosition = newArmy.getComponent('position');
            newPosition.setPosition(position.x, position.y);
        }
        
        // Move units to new army
        for (const [unitType, count] of unitsToSplit) {
            this.removeUnits(unitType, count);
            newArmy.addUnits(unitType, count);
        }
        
        return newArmy;
    }
    
    /**
     * Get total unit count
     */
    getTotalUnitCount() {
        let total = 0;
        this.units.forEach(count => total += count);
        return total;
    }
    
    /**
     * Get army composition as object
     */
    getComposition() {
        const composition = {};
        this.units.forEach((count, unitType) => {
            composition[unitType] = count;
        });
        return composition;
    }
    
    /**
     * Check if army has any units
     */
    hasUnits() {
        return this.units.size > 0 && this.getTotalUnitCount() > 0;
    }
    
    /**
     * Check if army has specific unit type
     */
    hasUnitType(unitType) {
        return this.units.has(unitType) && this.units.get(unitType) > 0;
    }
    
    /**
     * Get count of specific unit type
     */
    getUnitCount(unitType) {
        return this.units.get(unitType) || 0;
    }
    
    /**
     * Get position from component
     */
    getPosition() {
        const positionComponent = this.getComponent('position');
        return positionComponent ? { x: positionComponent.x, y: positionComponent.y } : { x: 0, y: 0 };
    }
    
    /**
     * Set position
     */
    setPosition(x, y) {
        const positionComponent = this.getComponent('position');
        if (positionComponent) {
            positionComponent.setPosition(x, y);
        }
    }
    
    /**
     * Set tile position
     */
    setTilePosition(tileX, tileY) {
        const positionComponent = this.getComponent('position');
        if (positionComponent) {
            positionComponent.setTilePosition(tileX, tileY);
        }
    }
    
    destroy() {
        this.units.clear();
        this.spellQueue = [];
        super.destroy();
    }
}