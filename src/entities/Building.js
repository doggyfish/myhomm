import { BUILDING_CONFIGS } from '../config/BuildingConfig.js';

export class Building {
    constructor(type, level = 1) {
        if (!BUILDING_CONFIGS[type]) {
            throw new Error(`Unknown building type: ${type}`);
        }
        
        this.type = type;
        this.level = level;
        this.config = BUILDING_CONFIGS[type];
        this.castle = null;
        this.isConstructed = false;
        this.constructionProgress = 0;
        this.constructionTime = this.getConstructionTime();
        
        // Production tracking
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;
        this.lastUpdate = Date.now();
    }

    static create(type, level = 1) {
        return new Building(type, level);
    }

    getName() {
        const names = {
            barracks: 'Barracks',
            archeryRange: 'Archery Range',
            stables: 'Stables',
            magicTower: 'Magic Tower',
            goldMine: 'Gold Mine',
            manaWell: 'Mana Well',
            walls: 'Walls',
            watchtower: 'Watchtower'
        };
        return names[this.type] || this.type;
    }

    getConstructionTime() {
        // Base construction time in milliseconds
        const baseTime = 30000; // 30 seconds
        return baseTime * this.level;
    }

    getCost() {
        const baseCost = { ...this.config.cost };
        
        // Scale cost by level
        Object.keys(baseCost).forEach(resource => {
            baseCost[resource] = Math.floor(baseCost[resource] * Math.pow(1.5, this.level - 1));
        });
        
        return baseCost;
    }

    canConstruct(resourceManager) {
        const cost = this.getCost();
        return Object.keys(cost).every(resource => 
            resourceManager.canAfford(resource, cost[resource])
        );
    }

    startConstruction(resourceManager) {
        if (this.isConstructed || this.constructionProgress > 0) {
            return false; // Already constructed or in progress
        }

        const cost = this.getCost();
        if (!this.canConstruct(resourceManager)) {
            return false;
        }

        // Spend resources
        Object.keys(cost).forEach(resource => {
            resourceManager.spend(resource, cost[resource]);
        });

        this.constructionProgress = 0;
        this.lastUpdate = Date.now();
        return true;
    }

    updateConstruction(deltaTime) {
        if (this.isConstructed || this.constructionProgress >= this.constructionTime) {
            if (!this.isConstructed) {
                this.completeConstruction();
            }
            return;
        }

        this.constructionProgress += deltaTime;
        
        if (this.constructionProgress >= this.constructionTime) {
            this.completeConstruction();
        }
    }

    completeConstruction() {
        this.isConstructed = true;
        this.constructionProgress = this.constructionTime;
        
        // Apply building effects to castle
        if (this.castle) {
            this.applyEffects();
        }
    }

    applyEffects() {
        if (!this.castle || !this.isConstructed) return;

        // Resource generation bonus
        if (this.config.generates) {
            this.resourceBonus = { ...this.config.generates };
            Object.keys(this.resourceBonus).forEach(resource => {
                this.resourceBonus[resource] *= this.level;
            });
        }

        // Defense bonus
        if (this.config.defenseBonus) {
            this.defensePower = Math.floor(this.config.defenseBonus * 100 * this.level);
        }

        // Vision range bonus
        if (this.config.visionRange) {
            this.visionRange = this.config.visionRange + (this.level - 1);
        }

        // Wall effects
        if (this.type === 'walls') {
            const defenseComponent = this.castle.getComponent('defense');
            if (defenseComponent) {
                defenseComponent.setWalls(this.level, this.config.hitPoints * this.level);
            }
        }
    }

    // Production methods for unit-producing buildings
    canProduce() {
        return this.isConstructed && this.config.produces && this.config.produces.length > 0;
    }

    getProducibleUnits() {
        if (!this.canProduce()) return [];
        
        // Filter by castle owner's faction
        const faction = this.castle?.owner?.faction || 'human';
        return this.config.produces.filter(unit => {
            // Simple faction filtering - could be enhanced
            if (faction === 'human') {
                return !['warrior', 'wolfRider', 'shaman'].includes(unit);
            } else if (faction === 'orc') {
                return !['swordsman', 'knight', 'wizard'].includes(unit);
            }
            return true;
        });
    }

    startProduction(unitType) {
        if (!this.canProduce()) return false;
        
        const producibleUnits = this.getProducibleUnits();
        if (!producibleUnits.includes(unitType)) return false;

        // Add to production queue
        this.productionQueue.push({
            type: unitType,
            startTime: Date.now(),
            productionTime: this.getProductionTime()
        });

        // Start production if not already producing
        if (!this.currentProduction) {
            this.processProductionQueue();
        }

        return true;
    }

    getProductionTime() {
        return this.config.baseRate / this.level; // Higher level = faster production
    }

    updateProduction(deltaTime) {
        if (!this.currentProduction || !this.isConstructed) return null;

        this.productionProgress += deltaTime;

        if (this.productionProgress >= this.currentProduction.productionTime) {
            const completedUnit = { ...this.currentProduction };
            this.completeProduction();
            return completedUnit;
        }

        return null;
    }

    completeProduction() {
        const completedUnit = this.currentProduction;
        this.currentProduction = null;
        this.productionProgress = 0;
        
        // Process next item in queue
        this.processProductionQueue();
        
        return completedUnit;
    }

    processProductionQueue() {
        if (this.productionQueue.length > 0 && !this.currentProduction) {
            this.currentProduction = this.productionQueue.shift();
            this.productionProgress = 0;
        }
    }

    getProductionStatus() {
        return {
            isProducing: !!this.currentProduction,
            currentUnit: this.currentProduction?.type || null,
            progress: this.currentProduction ? this.productionProgress / this.currentProduction.productionTime : 0,
            queueLength: this.productionQueue.length,
            queue: this.productionQueue.map(item => item.type)
        };
    }

    cancelProduction() {
        this.currentProduction = null;
        this.productionProgress = 0;
        this.productionQueue = [];
    }

    // Upgrade system
    canUpgrade() {
        return this.isConstructed && this.level < 5; // Max level 5
    }

    getUpgradeCost() {
        if (!this.canUpgrade()) return null;
        
        const nextLevel = this.level + 1;
        const baseCost = { ...this.config.cost };
        
        Object.keys(baseCost).forEach(resource => {
            baseCost[resource] = Math.floor(baseCost[resource] * Math.pow(1.5, nextLevel - 1));
        });
        
        return baseCost;
    }

    startUpgrade(resourceManager) {
        if (!this.canUpgrade()) return false;
        
        const cost = this.getUpgradeCost();
        if (!Object.keys(cost).every(resource => 
            resourceManager.canAfford(resource, cost[resource]))) {
            return false;
        }

        // Spend resources
        Object.keys(cost).forEach(resource => {
            resourceManager.spend(resource, cost[resource]);
        });

        this.level++;
        this.constructionTime = this.getConstructionTime();
        
        // Reapply effects with new level
        this.applyEffects();
        
        return true;
    }

    update(deltaTime) {
        this.updateConstruction(deltaTime);
        
        if (this.isConstructed) {
            const completedUnit = this.updateProduction(deltaTime);
            if (completedUnit && this.castle?.garrisonArmy) {
                // Add completed unit to garrison
                this.castle.garrisonArmy.addUnit(completedUnit.type, 1);
            }
        }
    }

    getInfo() {
        const cost = this.getCost();
        const upgradeCost = this.getUpgradeCost();
        
        return {
            type: this.type,
            name: this.getName(),
            level: this.level,
            isConstructed: this.isConstructed,
            constructionProgress: this.constructionProgress / this.constructionTime,
            cost,
            upgradeCost,
            canUpgrade: this.canUpgrade(),
            canProduce: this.canProduce(),
            producibleUnits: this.getProducibleUnits(),
            productionStatus: this.getProductionStatus(),
            effects: {
                resourceBonus: this.resourceBonus || {},
                defensePower: this.defensePower || 0,
                visionRange: this.visionRange || 0
            }
        };
    }

    serialize() {
        return {
            type: this.type,
            level: this.level,
            isConstructed: this.isConstructed,
            constructionProgress: this.constructionProgress,
            productionQueue: this.productionQueue,
            currentProduction: this.currentProduction,
            productionProgress: this.productionProgress,
            resourceBonus: this.resourceBonus,
            defensePower: this.defensePower,
            visionRange: this.visionRange
        };
    }

    static deserialize(data) {
        const building = new Building(data.type, data.level);
        building.isConstructed = data.isConstructed;
        building.constructionProgress = data.constructionProgress;
        building.productionQueue = data.productionQueue || [];
        building.currentProduction = data.currentProduction;
        building.productionProgress = data.productionProgress || 0;
        building.resourceBonus = data.resourceBonus;
        building.defensePower = data.defensePower;
        building.visionRange = data.visionRange;
        
        return building;
    }
}