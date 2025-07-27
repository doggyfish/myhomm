/**
 * EnhancedArmy class for MyHoMM Phaser 3 Version
 * Includes all Phase 1-5 features: unit types, formations, experience, mobile optimization
 */

class EnhancedArmy extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);
        
        // Add to scene
        config.scene.add.existing(this);
        
        // Entity properties
        this.type = 'army';
        this.gridX = config.gridX;
        this.gridY = config.gridY;
        this.owner = config.owner;
        this.unitCount = config.unitCount || 1;
        
        // Phase 1-2: Experience and morale
        this.experience = config.experience || 0;
        this.veteranLevel = Math.floor(this.experience / 100);
        this.morale = config.morale || 50; // 0-100 scale
        this.supply = config.supply || 100; // 0-100 scale
        
        // Phase 3-4: Unit type composition
        this.unitTypes = config.unitTypes || this.createDefaultUnitComposition();
        this.updateTotalUnits();
        
        // Phase 4: Tactical properties
        this.formation = config.formation || 'balanced';
        this.formationModifiers = TACTICAL_FORMATIONS[this.formation.toUpperCase()].modifiers;
        this.terrain = config.terrain || 'plains';
        this.terrainModifiers = TERRAIN_EFFECTS[this.terrain.toUpperCase()].modifiers;
        
        // Visual properties
        this.tileSize = MyHoMMConfig.map.tileSize;
        this.isSelected = false;
        
        // Movement properties
        this.movementSpeed = MyHoMMConfig.units.movementSpeed;
        this.isMoving = false;
        this.targetX = this.x;
        this.targetY = this.y;
        this.movementPoints = 3; // Phase 2: Movement points system
        
        // Create visual components
        this.createVisuals();
        
        // Make interactive
        this.setInteractive(new Phaser.Geom.Rectangle(-this.tileSize/2, -this.tileSize/2, this.tileSize, this.tileSize), Phaser.Geom.Rectangle.Contains);
        
        console.log(`Enhanced army created at (${this.gridX}, ${this.gridY}) for ${this.owner.name} with ${this.unitCount} units`);
    }
    
    createDefaultUnitComposition() {
        // Phase 3-4: Create diverse unit composition
        const totalUnits = this.unitCount;
        return {
            infantry: { count: Math.floor(totalUnits * 0.5), level: 1 },
            archers: { count: Math.floor(totalUnits * 0.3), level: 2 },
            cavalry: { count: Math.floor(totalUnits * 0.2), level: 3 },
            knights: { count: 0, level: 4 }
        };
    }
    
    updateTotalUnits() {
        this.unitCount = Object.values(this.unitTypes).reduce((total, unitType) => total + unitType.count, 0);
    }
    
    createVisuals() {
        // Main army body with formation indicator
        const formationColor = this.getFormationColor();
        this.armyBody = this.scene.add.circle(0, 0, this.tileSize * 0.35, formationColor);
        this.armyBody.setStrokeStyle(2, 0x000000);
        this.add(this.armyBody);
        
        // Army banner with unit type indicator
        this.armyBanner = this.scene.add.triangle(0, -this.tileSize * 0.3, 0, 0, -8, -12, 8, -12, this.owner.color);
        this.armyBanner.setStrokeStyle(1, 0x000000);
        this.add(this.armyBanner);
        
        // Unit count text
        this.unitText = this.scene.add.text(0, 0, this.unitCount.toString(), {
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this.unitText.setOrigin(0.5);
        this.add(this.unitText);
        
        // Phase 1-2: Experience indicator
        this.experienceText = this.scene.add.text(this.tileSize * 0.3, -this.tileSize * 0.3, this.getExperienceSymbol(), {
            fontSize: '10px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 1
        });
        this.experienceText.setOrigin(0.5);
        this.add(this.experienceText);
        
        // Phase 4: Formation indicator
        this.formationText = this.scene.add.text(-this.tileSize * 0.3, -this.tileSize * 0.3, this.getFormationSymbol(), {
            fontSize: '10px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 1
        });
        this.formationText.setOrigin(0.5);
        this.add(this.formationText);
        
        // Selection indicator (initially hidden)
        this.selectionIndicator = this.scene.add.graphics();
        this.selectionIndicator.lineStyle(3, 0xffff00, 1);
        this.selectionIndicator.strokeCircle(0, 0, this.tileSize * 0.45);
        this.selectionIndicator.setVisible(false);
        this.add(this.selectionIndicator);
        
        // Movement indicator
        this.movementIndicator = this.scene.add.graphics();
        this.movementIndicator.setVisible(false);
        this.add(this.movementIndicator);
        
        // Depth sorting
        this.setDepth(15);
    }
    
    getFormationColor() {
        const colors = {
            offensive: 0xff4444,
            defensive: 0x4444ff,
            balanced: 0x44ff44,
            mobile: 0xffff44
        };
        return colors[this.formation] || this.owner.color;
    }
    
    getExperienceSymbol() {
        if (this.veteranLevel >= 3) return '★★★';
        if (this.veteranLevel >= 2) return '★★';
        if (this.veteranLevel >= 1) return '★';
        return '';
    }
    
    getFormationSymbol() {
        const symbols = {
            offensive: '⚡',
            defensive: '🛡️',
            balanced: '⚖️',
            mobile: '🏃'
        };
        return symbols[this.formation] || '⚖️';
    }
    
    updateVisuals() {
        if (this.unitText) {
            this.unitText.setText(this.unitCount.toString());
        }
        
        if (this.experienceText) {
            this.experienceText.setText(this.getExperienceSymbol());
        }
        
        if (this.formationText) {
            this.formationText.setText(this.getFormationSymbol());
        }
        
        // Update colors based on formation and owner
        if (this.armyBody) {
            this.armyBody.setFillStyle(this.getFormationColor());
        }
        if (this.armyBanner) {
            this.armyBanner.setFillStyle(this.owner.color);
        }
    }
    
    setSelected(selected) {
        this.isSelected = selected;
        if (this.selectionIndicator) {
            this.selectionIndicator.setVisible(selected);
        }
        
        if (selected) {
            console.log(`Selected enhanced army at (${this.gridX}, ${this.gridY}) - Units: ${this.unitCount}, Formation: ${this.formation}, Experience: ${this.experience}`);
        }
    }
    
    // Phase 4: Formation management
    setFormation(newFormation) {
        if (TACTICAL_FORMATIONS[newFormation.toUpperCase()]) {
            this.formation = newFormation;
            this.formationModifiers = TACTICAL_FORMATIONS[newFormation.toUpperCase()].modifiers;
            this.updateVisuals();
            console.log(`Army formation changed to: ${newFormation}`);
        }
    }
    
    // Phase 1-2: Experience system
    gainExperience(amount) {
        this.experience += amount;
        const newVeteranLevel = Math.floor(this.experience / 100);
        if (newVeteranLevel > this.veteranLevel) {
            this.veteranLevel = newVeteranLevel;
            console.log(`Army promoted to veteran level ${this.veteranLevel}!`);
        }
        this.updateVisuals();
    }
    
    // Phase 3-4: Calculate total army power with all modifiers
    calculateTotalPower() {
        let basePower = 0;
        
        // Calculate power from unit types
        Object.entries(this.unitTypes).forEach(([unitType, data]) => {
            const unitInfo = ENHANCED_UNIT_TYPES[unitType.toUpperCase()];
            if (unitInfo && data.count > 0) {
                basePower += data.count * unitInfo.basePower;
            }
        });
        
        // Apply experience modifier
        const experienceModifier = 1 + (this.veteranLevel * 0.1);
        basePower *= experienceModifier;
        
        // Apply morale modifier
        const moraleModifier = 0.5 + (this.morale / 100);
        basePower *= moraleModifier;
        
        // Apply formation modifiers
        if (this.formationModifiers.attackBonus) {
            basePower *= (1 + this.formationModifiers.attackBonus);
        }
        if (this.formationModifiers.attackReduction) {
            basePower *= (1 - this.formationModifiers.attackReduction);
        }
        
        // Apply terrain modifiers
        if (this.terrainModifiers.archerBonus && this.unitTypes.archers?.count > 0) {
            basePower *= (1 + this.terrainModifiers.archerBonus * (this.unitTypes.archers.count / this.unitCount));
        }
        
        return Math.round(basePower);
    }
    
    // Enhanced movement with formation and terrain considerations
    moveToGrid(targetGridX, targetGridY) {
        // Check movement points
        if (this.movementPoints <= 0) {
            console.log('Army has no movement points remaining');
            return false;
        }
        
        // Validate target position
        if (targetGridX < 0 || targetGridX >= this.scene.mapWidth ||
            targetGridY < 0 || targetGridY >= this.scene.mapHeight) {
            console.log('Invalid move target');
            return false;
        }
        
        // Calculate movement cost based on terrain and formation
        const distance = Math.abs(targetGridX - this.gridX) + Math.abs(targetGridY - this.gridY);
        const moveCost = this.calculateMovementCost(distance);
        
        if (moveCost > this.movementPoints) {
            console.log(`Insufficient movement points. Need ${moveCost}, have ${this.movementPoints}`);
            return false;
        }
        
        // Check for existing entities at target
        const targetCastle = this.scene.castles.find(c => c.gridX === targetGridX && c.gridY === targetGridY);
        const targetArmy = this.scene.armies.find(a => a.gridX === targetGridX && a.gridY === targetGridY && a !== this);
        
        if (targetCastle) {
            // Attack castle
            this.attackCastle(targetCastle);
            this.movementPoints -= moveCost;
            return true;
        } else if (targetArmy) {
            // Attack army
            this.attackArmy(targetArmy);
            this.movementPoints -= moveCost;
            return true;
        } else {
            // Move to empty position
            this.moveToPosition(targetGridX, targetGridY);
            this.movementPoints -= moveCost;
            return true;
        }
    }
    
    calculateMovementCost(distance) {
        let baseCost = distance;
        
        // Apply formation speed modifiers
        if (this.formationModifiers.moveSpeed) {
            baseCost /= this.formationModifiers.moveSpeed;
        }
        
        // Apply terrain modifiers
        if (this.terrainModifiers.moveSpeed) {
            baseCost /= this.terrainModifiers.moveSpeed;
        }
        
        return Math.ceil(baseCost);
    }
    
    moveToPosition(targetGridX, targetGridY) {
        this.gridX = targetGridX;
        this.gridY = targetGridY;
        
        const targetX = targetGridX * this.tileSize + this.tileSize / 2;
        const targetY = targetGridY * this.tileSize + this.tileSize / 2;
        
        // Instant movement for now (can be animated later)
        this.x = targetX;
        this.y = targetY;
        
        // Update terrain
        this.terrain = this.detectTerrain(targetGridX, targetGridY);
        this.terrainModifiers = TERRAIN_EFFECTS[this.terrain.toUpperCase()].modifiers;
        
        console.log(`Enhanced army moved to (${targetGridX}, ${targetGridY}) on ${this.terrain} terrain`);
        
        // Trigger movement event
        if (this.scene.gameManager) {
            this.scene.gameManager.onArmyMoved(this, targetGridX, targetGridY);
        }
    }
    
    detectTerrain(gridX, gridY) {
        // Simple terrain detection (could be enhanced with actual terrain map)
        const terrainTypes = ['plains', 'forest', 'hills', 'swamp'];
        const hash = (gridX * 31 + gridY) % terrainTypes.length;
        return terrainTypes[hash];
    }
    
    // Enhanced combat with tactical considerations
    attackCastle(castle) {
        console.log(`Enhanced army attacking castle with formation: ${this.formation}`);
        
        if (castle.owner === this.owner) {
            // Friendly castle - merge units
            this.mergeWithCastle(castle);
        } else {
            // Enemy castle - tactical combat
            this.tacticalCombatWithCastle(castle);
        }
    }
    
    tacticalCombatWithCastle(castle) {
        const attackPower = this.calculateTotalPower();
        const defensePower = castle.calculateDefensePower();
        
        console.log(`Tactical combat: Army power ${attackPower} vs Castle power ${defensePower}`);
        
        // Enhanced combat resolution
        const combatResult = this.resolveTacticalCombat(attackPower, defensePower, castle);
        
        // Apply experience gain
        this.gainExperience(10);
        
        // Handle combat result
        if (this.scene.combatSystem) {
            this.scene.combatSystem.handleCombatResult(this, castle, combatResult);
        }
    }
    
    resolveTacticalCombat(attackPower, defensePower, defender) {
        // More sophisticated combat resolution
        const powerRatio = attackPower / defensePower;
        const randomFactor = 0.8 + (Math.random() * 0.4); // 80-120% variance
        
        const effectivePower = powerRatio * randomFactor;
        
        if (effectivePower > 1.2) {
            // Decisive victory
            const survivingRatio = Math.min(0.8, effectivePower - 0.5);
            return {
                captured: true,
                attackerLosses: Math.floor(this.unitCount * (1 - survivingRatio)),
                defenderLosses: defender.unitCount,
                type: 'decisive'
            };
        } else if (effectivePower > 1.0) {
            // Narrow victory
            return {
                captured: true,
                attackerLosses: Math.floor(this.unitCount * 0.6),
                defenderLosses: defender.unitCount,
                type: 'narrow'
            };
        } else {
            // Defeat
            return {
                captured: false,
                attackerLosses: this.unitCount,
                defenderLosses: Math.floor(defender.unitCount * 0.3),
                type: 'defeat'
            };
        }
    }
    
    // Phase 2: Restore movement points at turn start
    restoreMovementPoints() {
        this.movementPoints = 3;
        
        // Apply formation modifiers
        if (this.formationModifiers.moveSpeed > 1.0) {
            this.movementPoints = Math.floor(this.movementPoints * this.formationModifiers.moveSpeed);
        }
    }
    
    // Phase 1-2: Army splitting
    split(percentage) {
        if (percentage <= 0 || percentage >= 1) {
            console.log('Invalid split percentage');
            return null;
        }
        
        const splitUnits = Math.floor(this.unitCount * percentage);
        if (splitUnits <= 0) {
            console.log('Split would create empty army');
            return null;
        }
        
        // Create new army with proportional unit types
        const newUnitTypes = {};
        Object.entries(this.unitTypes).forEach(([unitType, data]) => {
            const splitCount = Math.floor(data.count * percentage);
            newUnitTypes[unitType] = { count: splitCount, level: data.level };
            this.unitTypes[unitType].count -= splitCount;
        });
        
        this.updateTotalUnits();
        this.updateVisuals();
        
        // Create new army
        const newArmy = this.scene.createEnhancedArmy(
            this.gridX + 1, 
            this.gridY, 
            this.owner, 
            splitUnits,
            {
                unitTypes: newUnitTypes,
                formation: this.formation,
                experience: Math.floor(this.experience * 0.8)
            }
        );
        
        console.log(`Army split: ${splitUnits} units separated`);
        return newArmy;
    }
    
    serialize() {
        return {
            type: 'enhancedArmy',
            gridX: this.gridX,
            gridY: this.gridY,
            x: this.x,
            y: this.y,
            ownerId: this.owner.id,
            unitCount: this.unitCount,
            unitTypes: this.unitTypes,
            formation: this.formation,
            experience: this.experience,
            morale: this.morale,
            supply: this.supply,
            movementPoints: this.movementPoints,
            terrain: this.terrain
        };
    }
    
    static deserialize(scene, data, players) {
        const owner = players.find(p => p.id === data.ownerId);
        return new EnhancedArmy({
            scene: scene,
            x: data.x,
            y: data.y,
            gridX: data.gridX,
            gridY: data.gridY,
            owner: owner,
            unitCount: data.unitCount,
            unitTypes: data.unitTypes,
            formation: data.formation,
            experience: data.experience,
            morale: data.morale,
            supply: data.supply
        });
    }
    
    destroy() {
        if (this.scene && this.scene.armies) {
            const index = this.scene.armies.indexOf(this);
            if (index !== -1) {
                this.scene.armies.splice(index, 1);
            }
        }
        
        super.destroy();
    }
}

window.EnhancedArmy = EnhancedArmy;