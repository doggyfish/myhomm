import { CONFIG } from '../../config/ConfigurationManager.js';

export class ResourceGeneratorComponent {
    constructor(baseRates = {}) {
        this.baseRates = {
            gold: 60,    // per minute
            mana: 60,    // per minute
            wood: 0,
            stone: 0,
            mercury: 0,
            sulfur: 0,
            crystal: 0,
            ...baseRates
        };
        
        this.modifiers = {
            gold: 1.0,
            mana: 1.0,
            wood: 1.0,
            stone: 1.0,
            mercury: 1.0,
            sulfur: 1.0,
            crystal: 1.0
        };
        
        this.lastUpdate = Date.now();
        this.accumulatedResources = {
            gold: 0,
            mana: 0,
            wood: 0,
            stone: 0,
            mercury: 0,
            sulfur: 0,
            crystal: 0
        };
    }

    setBaseRate(resourceType, rate) {
        this.baseRates[resourceType] = rate;
    }

    getBaseRate(resourceType) {
        return this.baseRates[resourceType] || 0;
    }

    setModifier(resourceType, modifier) {
        this.modifiers[resourceType] = modifier;
    }

    getModifier(resourceType) {
        return this.modifiers[resourceType] || 1.0;
    }

    getEffectiveRate(resourceType) {
        return this.baseRates[resourceType] * this.modifiers[resourceType];
    }

    getAllEffectiveRates() {
        const rates = {};
        Object.keys(this.baseRates).forEach(resourceType => {
            rates[resourceType] = this.getEffectiveRate(resourceType);
        });
        return rates;
    }

    update(deltaTime) {
        // deltaTime is in milliseconds
        const minutesFraction = deltaTime / (1000 * 60); // Convert to minutes
        
        Object.keys(this.baseRates).forEach(resourceType => {
            const effectiveRate = this.getEffectiveRate(resourceType);
            if (effectiveRate > 0) {
                this.accumulatedResources[resourceType] += effectiveRate * minutesFraction;
            }
        });
    }

    collectResources() {
        const resources = { ...this.accumulatedResources };
        
        // Reset accumulated resources
        Object.keys(this.accumulatedResources).forEach(resourceType => {
            this.accumulatedResources[resourceType] = 0;
        });
        
        return resources;
    }

    getAccumulatedResources() {
        return { ...this.accumulatedResources };
    }

    reset() {
        Object.keys(this.accumulatedResources).forEach(resourceType => {
            this.accumulatedResources[resourceType] = 0;
        });
        this.lastUpdate = Date.now();
    }

    addBuildingBonus(buildingType, bonus) {
        // Apply building-specific bonuses
        Object.keys(bonus).forEach(resourceType => {
            if (typeof bonus[resourceType] === 'number') {
                this.modifiers[resourceType] += bonus[resourceType];
            }
        });
    }

    removeBuildingBonus(buildingType, bonus) {
        // Remove building-specific bonuses
        Object.keys(bonus).forEach(resourceType => {
            if (typeof bonus[resourceType] === 'number') {
                this.modifiers[resourceType] = Math.max(0, this.modifiers[resourceType] - bonus[resourceType]);
            }
        });
    }
}