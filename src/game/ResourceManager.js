import { CONFIG } from '../config/ConfigurationManager.js';

export class ResourceManager {
    constructor(player) {
        this.player = player;
        
        // Initialize resources with starting values from config
        const startingResources = CONFIG.get('resources.startingResources');
        this.resources = {
            gold: startingResources.gold,
            mana: startingResources.mana,
            wood: startingResources.wood,
            stone: startingResources.stone,
            mercury: startingResources.mercury,
            sulfur: startingResources.sulfur,
            crystal: startingResources.crystal
        };
        
        // Base generation rates (per minute)
        const baseGeneration = CONFIG.get('resources.baseGeneration');
        this.generation = {
            gold: baseGeneration.gold,
            mana: baseGeneration.mana
        };
    }
    
    update(delta) {
        // Apply generation rates (convert from per minute to per millisecond)
        this.resources.gold += (this.generation.gold * delta / 60000);
        this.resources.mana += (this.generation.mana * delta / 60000);
        
        // Ensure resources don't go negative (shouldn't happen with generation, but safety check)
        this.clampResources();
    }
    
    canAfford(cost) {
        if (!cost || typeof cost !== 'object') {
            return false;
        }
        
        for (const [resource, amount] of Object.entries(cost)) {
            if (this.resources[resource] === undefined) {
                return false; // Unknown resource type
            }
            if (this.resources[resource] < amount) {
                return false; // Insufficient resource
            }
        }
        
        return true;
    }
    
    spend(cost) {
        if (!this.canAfford(cost)) {
            return false;
        }
        
        for (const [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }
        
        this.clampResources();
        return true;
    }
    
    add(resourcesGained) {
        if (!resourcesGained || typeof resourcesGained !== 'object') {
            return;
        }
        
        for (const [resource, amount] of Object.entries(resourcesGained)) {
            if (this.resources[resource] !== undefined && amount > 0) {
                this.resources[resource] += amount;
            }
        }
        
        this.clampResources();
    }
    
    setGeneration(resource, amount) {
        if (this.generation[resource] !== undefined) {
            this.generation[resource] = Math.max(0, amount);
        }
    }
    
    addGeneration(resource, amount) {
        if (this.generation[resource] !== undefined) {
            this.generation[resource] += amount;
            this.generation[resource] = Math.max(0, this.generation[resource]);
        }
    }
    
    getResource(resource) {
        return this.resources[resource] || 0;
    }
    
    setResource(resource, amount) {
        if (this.resources[resource] !== undefined) {
            this.resources[resource] = Math.max(0, amount);
        }
    }
    
    hasResource(resource, amount) {
        return this.getResource(resource) >= amount;
    }
    
    getGenerationRate(resource) {
        return this.generation[resource] || 0;
    }
    
    getTotalResourceValue() {
        // Simple total for comparison (could be weighted if needed)
        return Object.values(this.resources).reduce((sum, amount) => sum + amount, 0);
    }
    
    clampResources() {
        // Ensure no negative resources
        for (const resource in this.resources) {
            this.resources[resource] = Math.max(0, this.resources[resource]);
        }
    }
    
    reset() {
        const startingResources = CONFIG.get('resources.startingResources');
        this.resources = { ...startingResources };
        
        const baseGeneration = CONFIG.get('resources.baseGeneration');
        this.generation = {
            gold: baseGeneration.gold,
            mana: baseGeneration.mana
        };
    }
}