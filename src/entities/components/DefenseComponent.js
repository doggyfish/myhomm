export class DefenseComponent {
    constructor(basePower = 0) {
        this.basePower = basePower;
        this.buildingDefenseBonus = 0;
        this.walls = {
            level: 0,
            hitPoints: 0,
            maxHitPoints: 0
        };
        this.defensiveBuildings = [];
        this.defenseMultiplier = 1.0;
    }

    getBasePower() {
        return this.basePower;
    }

    setBasePower(power) {
        this.basePower = power;
    }

    getBuildingDefenseBonus() {
        return this.buildingDefenseBonus;
    }

    getTotalDefensePower() {
        return this.basePower + this.buildingDefenseBonus;
    }

    getEffectiveDefensePower() {
        return this.getTotalDefensePower() * this.defenseMultiplier;
    }

    addDefensiveBuilding(buildingType, defensePower) {
        this.defensiveBuildings.push({
            type: buildingType,
            power: defensePower
        });
        this.buildingDefenseBonus += defensePower;
    }

    removeDefensiveBuilding(buildingType) {
        const index = this.defensiveBuildings.findIndex(building => building.type === buildingType);
        if (index >= 0) {
            const building = this.defensiveBuildings.splice(index, 1)[0];
            this.buildingDefenseBonus -= building.power;
            return building;
        }
        return null;
    }

    getDefensiveBuildings() {
        return [...this.defensiveBuildings];
    }

    setWalls(level, hitPoints = null) {
        this.walls.level = level;
        
        // Calculate max hit points based on wall level
        const baseHitPoints = 100;
        this.walls.maxHitPoints = baseHitPoints * (level + 1);
        
        // Set current hit points (full if not specified)
        this.walls.hitPoints = hitPoints !== null ? hitPoints : this.walls.maxHitPoints;
        
        // Walls provide defense multiplier based on level
        this.updateDefenseMultiplier();
    }

    getWalls() {
        return { ...this.walls };
    }

    damageWalls(damage) {
        if (this.walls.level > 0) {
            this.walls.hitPoints = Math.max(0, this.walls.hitPoints - damage);
            
            // If walls are destroyed, reduce level
            if (this.walls.hitPoints === 0 && this.walls.level > 0) {
                this.walls.level = Math.max(0, this.walls.level - 1);
                this.setWalls(this.walls.level);
            }
            
            this.updateDefenseMultiplier();
        }
    }

    repairWalls(amount) {
        if (this.walls.level > 0) {
            this.walls.hitPoints = Math.min(this.walls.maxHitPoints, this.walls.hitPoints + amount);
        }
    }

    updateDefenseMultiplier() {
        // Base multiplier
        let multiplier = 1.0;
        
        // Wall bonus (diminishing returns for damaged walls)
        if (this.walls.level > 0) {
            const wallIntegrity = this.walls.hitPoints / this.walls.maxHitPoints;
            const wallBonus = (this.walls.level * 0.25) * wallIntegrity;
            multiplier += wallBonus;
        }
        
        this.defenseMultiplier = multiplier;
    }

    getDefenseMultiplier() {
        return this.defenseMultiplier;
    }

    calculateCombatDefense(attackingPower) {
        const effectiveDefense = this.getEffectiveDefensePower();
        
        // Return defense calculation details
        return {
            basePower: this.basePower,
            buildingBonus: this.buildingDefenseBonus,
            totalPower: this.getTotalDefensePower(),
            multiplier: this.defenseMultiplier,
            effectivePower: effectiveDefense,
            wallsLevel: this.walls.level,
            wallsIntegrity: this.walls.level > 0 ? this.walls.hitPoints / this.walls.maxHitPoints : 0
        };
    }

    serialize() {
        return {
            basePower: this.basePower,
            buildingDefenseBonus: this.buildingDefenseBonus,
            walls: { ...this.walls },
            defensiveBuildings: [...this.defensiveBuildings],
            defenseMultiplier: this.defenseMultiplier
        };
    }

    static deserialize(data) {
        const component = new DefenseComponent(data.basePower);
        component.buildingDefenseBonus = data.buildingDefenseBonus;
        component.walls = { ...data.walls };
        component.defensiveBuildings = [...data.defensiveBuildings];
        component.defenseMultiplier = data.defenseMultiplier;
        return component;
    }
}