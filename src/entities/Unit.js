import { UNIT_CONFIGS } from '../config/UnitConfig.js';

/**
 * Represents a unit type definition, not individual unit instances.
 * Individual units are tracked as counts in the Army class.
 */
export class Unit {
    constructor(faction, unitType) {
        this.faction = faction;
        this.unitType = unitType;
        
        // Load configuration for this unit type
        const config = this.getConfig();
        if (!config) {
            throw new Error(`Invalid unit type: ${faction}.${unitType}`);
        }
        
        // Core stats from configuration
        this.power = config.power;
        this.speed = config.speed; // Speed is a property of unit type, not instances
        this.cost = config.cost || { gold: 0 };
        
        // Special properties
        this.isRanged = config.isRanged || false;
        this.antiCastle = config.antiCastle || 1.0; // Multiplier for siege attacks
        this.canCastSpells = config.canCastSpells || false;
        
        // Ability
        this.ability = config.ability || null;
    }
    
    /**
     * Get unit configuration from UNIT_CONFIGS
     */
    getConfig() {
        return UNIT_CONFIGS[this.faction] ? 
               UNIT_CONFIGS[this.faction][this.unitType] : 
               null;
    }
    
    /**
     * Get the cost to produce this unit type
     */
    getCost() {
        return { ...this.cost };
    }
    
    /**
     * Check if player can afford this unit type
     */
    canAfford(resourceManager) {
        return resourceManager.canAfford(this.cost);
    }
    
    /**
     * Get power with ability modifiers
     * @param {Object} context - Context for ability calculations (e.g., army composition)
     */
    getEffectivePower(context = {}) {
        let effectivePower = this.power;
        
        // Apply ability-based power modifications
        if (this.ability === 'rage' && context.inCombat) {
            // Berserker rage: increases power when in combat
            effectivePower *= 1.5;
        }
        
        return effectivePower;
    }
    
    /**
     * Apply unit ability effects
     * @param {Object} target - Target to apply ability to (army, units, etc.)
     * @param {Object} context - Context for ability application
     */
    applyAbility(target, context = {}) {
        switch (this.ability) {
            case 'powerBoost':
                // Paladin ability: boost power of other units in the army
                return this.applyPaladinBoost(target, context);
                
            case 'rage':
                // Berserker ability: handled in getEffectivePower
                return { applied: true, type: 'rage' };
                
            default:
                return { applied: false };
        }
    }
    
    /**
     * Apply Paladin power boost to army
     * @param {Army} army - The army to boost
     * @param {Object} context - Additional context
     */
    applyPaladinBoost(army, context) {
        if (!army || this.ability !== 'powerBoost') {
            return { applied: false };
        }
        
        // Calculate boost based on number of paladins
        const paladinCount = army.getUnitCount('paladin');
        if (paladinCount === 0) {
            return { applied: false };
        }
        
        // Each paladin provides a percentage boost to other units
        const boostPercentage = 0.1 * paladinCount; // 10% per paladin
        const maxBoost = 0.5; // Cap at 50% boost
        const actualBoost = Math.min(boostPercentage, maxBoost);
        
        return {
            applied: true,
            type: 'powerBoost',
            value: actualBoost,
            source: 'paladin',
            count: paladinCount
        };
    }
    
    /**
     * Check if this unit type has a specific ability
     */
    hasAbility(abilityName) {
        return this.ability === abilityName;
    }
    
    /**
     * Get combat modifiers for specific situations
     */
    getCombatModifiers(target) {
        const modifiers = {
            power: 1.0,
            damage: 1.0
        };
        
        // Anti-castle bonus
        if (target && target.type === 'castle' && this.antiCastle > 1.0) {
            modifiers.damage *= this.antiCastle;
        }
        
        return modifiers;
    }
    
    /**
     * Static method to create a unit type
     */
    static create(faction, unitType) {
        return new Unit(faction, unitType);
    }
    
    /**
     * Static method to check if a unit type exists
     */
    static exists(faction, unitType) {
        return !!(UNIT_CONFIGS[faction] && 
                  UNIT_CONFIGS[faction][unitType] !== undefined);
    }
    
    /**
     * Static method to get all unit types for a faction
     */
    static getFactionUnits(faction) {
        if (!UNIT_CONFIGS[faction]) {
            return [];
        }
        
        return Object.keys(UNIT_CONFIGS[faction]).map(unitType => 
            new Unit(faction, unitType)
        );
    }
    
    /**
     * Get display information for UI
     */
    getDisplayInfo() {
        return {
            name: this.getDisplayName(),
            faction: this.faction,
            type: this.unitType,
            power: this.power,
            speed: this.speed,
            cost: this.cost,
            isRanged: this.isRanged,
            canCastSpells: this.canCastSpells,
            ability: this.ability,
            antiCastle: this.antiCastle > 1.0 ? this.antiCastle : null
        };
    }
    
    /**
     * Get formatted display name
     */
    getDisplayName() {
        // Convert unitType to title case
        return this.unitType.charAt(0).toUpperCase() + 
               this.unitType.slice(1).replace(/([A-Z])/g, ' $1');
    }
}