import { Entity } from './Entity.js';
import { PositionComponent } from './components/PositionComponent.js';
import { ResourceGeneratorComponent } from './components/ResourceGeneratorComponent.js';
import { DefenseComponent } from './components/DefenseComponent.js';
import { CONFIG } from '../config/ConfigurationManager.js';

export class Castle extends Entity {
    constructor(id, x, y, owner) {
        super(id, 'castle', owner);
        
        // Castle-specific properties
        this.buildings = [];
        this.buildingSlots = 7; // Maximum number of buildings
        this.garrisonArmy = null; // Will hold an Army entity
        this.name = `Castle ${id}`;
        this.isCapital = false;
        
        // Add core components
        this.addComponent('position', new PositionComponent(x, y));
        this.addComponent('resourceGenerator', new ResourceGeneratorComponent());
        this.addComponent('defense', new DefenseComponent(50)); // Base defense power
        
        // Apply faction bonuses if owner exists
        this.applyFactionBonuses();
    }

    static createCapital(id, x, y, owner) {
        const castle = new Castle(id, x, y, owner);
        castle.isCapital = true;
        castle.name = `Capital ${id}`;
        
        // Capital castles might have different base stats
        const defenseComponent = castle.getComponent('defense');
        defenseComponent.setBasePower(75); // Higher base defense
        
        return castle;
    }

    applyFactionBonuses() {
        if (!this.owner) return;
        
        const resourceGenerator = this.getComponent('resourceGenerator');
        if (!resourceGenerator) return;
        
        // Apply faction-specific bonuses
        const factionConfig = this.owner.getFactionConfig ? this.owner.getFactionConfig() : {};
        const resourceBonus = factionConfig.resourceBonus || {};
        
        Object.keys(resourceBonus).forEach(resourceType => {
            const currentModifier = resourceGenerator.getModifier(resourceType);
            resourceGenerator.setModifier(resourceType, currentModifier * resourceBonus[resourceType]);
        });
    }

    // Building Management
    addBuilding(building) {
        if (this.buildings.length >= this.buildingSlots) {
            return false; // No more slots available
        }
        
        if (this.hasBuilding(building.type)) {
            return false; // Building type already exists
        }
        
        this.buildings.push(building);
        building.castle = this;
        
        // Apply building effects
        this.applyBuildingEffects(building);
        
        return true;
    }

    removeBuilding(buildingType) {
        const index = this.buildings.findIndex(b => b.type === buildingType);
        if (index >= 0) {
            const building = this.buildings.splice(index, 1)[0];
            building.castle = null;
            
            // Remove building effects
            this.removeBuildingEffects(building);
            
            return building;
        }
        return null;
    }

    hasBuilding(buildingType) {
        return this.buildings.some(b => b.type === buildingType);
    }

    getBuilding(buildingType) {
        return this.buildings.find(b => b.type === buildingType) || null;
    }

    getBuildings() {
        return [...this.buildings];
    }

    getBuildingCount() {
        return this.buildings.length;
    }

    getAvailableBuildingSlots() {
        return this.buildingSlots - this.buildings.length;
    }

    applyBuildingEffects(building) {
        const resourceGenerator = this.getComponent('resourceGenerator');
        const defenseComponent = this.getComponent('defense');
        
        // Apply resource generation bonuses
        if (building.resourceBonus && resourceGenerator) {
            resourceGenerator.addBuildingBonus(building.type, building.resourceBonus);
        }
        
        // Apply defense bonuses
        if (building.defensePower && defenseComponent) {
            defenseComponent.addDefensiveBuilding(building.type, building.defensePower);
        }
    }

    removeBuildingEffects(building) {
        const resourceGenerator = this.getComponent('resourceGenerator');
        const defenseComponent = this.getComponent('defense');
        
        // Remove resource generation bonuses
        if (building.resourceBonus && resourceGenerator) {
            resourceGenerator.removeBuildingBonus(building.type, building.resourceBonus);
        }
        
        // Remove defense bonuses
        if (building.defensePower && defenseComponent) {
            defenseComponent.removeDefensiveBuilding(building.type);
        }
    }

    // Garrison Army Management
    setGarrisonArmy(army) {
        this.garrisonArmy = army;
        if (army) {
            army.location = this;
            army.isGarrison = true;
        }
    }

    getGarrisonArmy() {
        return this.garrisonArmy;
    }

    hasGarrison() {
        return this.garrisonArmy !== null;
    }

    // Resource Generation
    update(deltaTime) {
        const resourceGenerator = this.getComponent('resourceGenerator');
        if (resourceGenerator) {
            resourceGenerator.update(deltaTime);
        }
        
        // Update buildings
        this.buildings.forEach(building => {
            if (building.update) {
                building.update(deltaTime);
                
                // Handle completed unit production
                if (building.canProduce() && this.garrisonArmy) {
                    const completedUnit = building.updateProduction(deltaTime);
                    if (completedUnit && this.garrisonArmy.addUnit) {
                        this.garrisonArmy.addUnit(completedUnit.type, 1);
                    }
                }
            }
        });
    }

    collectResources() {
        const resourceGenerator = this.getComponent('resourceGenerator');
        return resourceGenerator ? resourceGenerator.collectResources() : {};
    }

    getResourceGenerationRates() {
        const resourceGenerator = this.getComponent('resourceGenerator');
        return resourceGenerator ? resourceGenerator.getAllEffectiveRates() : {};
    }

    // Defense Calculations
    getTotalDefensePower() {
        const defenseComponent = this.getComponent('defense');
        let totalPower = defenseComponent ? defenseComponent.getEffectiveDefensePower() : 0;
        
        // Add garrison army power if present
        if (this.garrisonArmy) {
            totalPower += this.garrisonArmy.getTotalPower ? this.garrisonArmy.getTotalPower() : 0;
        }
        
        return totalPower;
    }

    getDefenseDetails() {
        const defenseComponent = this.getComponent('defense');
        const details = defenseComponent ? defenseComponent.calculateCombatDefense() : {};
        
        details.garrisonPower = this.garrisonArmy ? 
            (this.garrisonArmy.getTotalPower ? this.garrisonArmy.getTotalPower() : 0) : 0;
        details.totalCastlePower = this.getTotalDefensePower();
        
        return details;
    }

    /**
     * Check if castle can defend (for combat system)
     * @returns {boolean} True if castle has defense power
     */
    canDefend() {
        return this.getTotalDefensePower() > 0;
    }

    /**
     * Apply siege damage to castle defenses
     * @param {number} damage - Damage amount to apply
     */
    applySiegeDamage(damage) {
        const defenseComponent = this.getComponent('defense');
        if (defenseComponent) {
            // Apply damage to walls first
            defenseComponent.damageWalls(damage);
        }

        // Apply damage to garrison if present
        if (this.garrisonArmy && damage > 0) {
            const combatComponent = this.garrisonArmy.getComponent('combat');
            if (combatComponent) {
                const remainingDamage = Math.max(0, damage * 0.3); // 30% damage to garrison
                const newPower = Math.max(0, combatComponent.power - remainingDamage);
                combatComponent.updatePower(newPower);
                
                // Apply unit losses to garrison army
                if (this.garrisonArmy.applyCombatLosses) {
                    this.garrisonArmy.applyCombatLosses(remainingDamage);
                }
            }
        }
    }

    // Position helpers
    getPosition() {
        const positionComponent = this.getComponent('position');
        return positionComponent ? { x: positionComponent.x, y: positionComponent.y } : { x: 0, y: 0 };
    }

    setPosition(x, y) {
        const positionComponent = this.getComponent('position');
        if (positionComponent) {
            positionComponent.x = x;
            positionComponent.y = y;
        }
    }

    // Utility methods
    canBuildMoreBuildings() {
        return this.getAvailableBuildingSlots() > 0;
    }

    getInfo() {
        const position = this.getPosition();
        const resourceRates = this.getResourceGenerationRates();
        const defenseDetails = this.getDefenseDetails();
        
        return {
            id: this.id,
            name: this.name,
            owner: this.owner?.id || null,
            position,
            isCapital: this.isCapital,
            buildingCount: this.getBuildingCount(),
            availableSlots: this.getAvailableBuildingSlots(),
            buildings: this.buildings.map(b => ({ type: b.type, name: b.name })),
            hasGarrison: this.hasGarrison(),
            garrisonSize: this.garrisonArmy ? this.garrisonArmy.getUnitCount() : 0,
            resourceRates,
            defensePower: defenseDetails.totalCastlePower
        };
    }

    serialize() {
        const data = {
            id: this.id,
            type: this.type,
            owner: this.owner?.id || null,
            name: this.name,
            isCapital: this.isCapital,
            buildingSlots: this.buildingSlots,
            buildings: this.buildings.map(b => b.serialize ? b.serialize() : b),
            garrisonArmy: this.garrisonArmy ? this.garrisonArmy.serialize() : null,
            components: {}
        };
        
        // Serialize components
        this.components.forEach((component, name) => {
            if (component.serialize) {
                data.components[name] = component.serialize();
            }
        });
        
        return data;
    }

    static deserialize(data, owner) {
        const castle = new Castle(data.id, 0, 0, owner);
        castle.name = data.name;
        castle.isCapital = data.isCapital;
        castle.buildingSlots = data.buildingSlots;
        
        // Restore position
        if (data.components.position) {
            castle.setPosition(data.components.position.x, data.components.position.y);
        }
        
        // TODO: Restore buildings and garrison when those systems are implemented
        
        return castle;
    }
}