/**
 * Army class for MyHoMM Phaser 3 Version
 * Extends Phaser GameObject for mobile army units
 */

class Army extends Phaser.GameObjects.Container {
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
        
        // Visual properties
        this.tileSize = MyHoMMConfig.map.tileSize;
        this.isSelected = false;
        
        // Movement properties
        this.movementSpeed = MyHoMMConfig.units.movementSpeed;
        this.isMoving = false;
        this.targetX = this.x;
        this.targetY = this.y;
        
        // Create visual components
        this.createVisuals();
        
        // Make interactive
        this.setInteractive(new Phaser.Geom.Rectangle(-this.tileSize/2, -this.tileSize/2, this.tileSize, this.tileSize), Phaser.Geom.Rectangle.Contains);
        
        console.log(`Army created at (${this.gridX}, ${this.gridY}) for ${this.owner.name} with ${this.unitCount} units`);
    }
    
    createVisuals() {
        // Main army body (circle for armies, rectangle for castles)
        this.armyBody = this.scene.add.circle(0, 0, this.tileSize * 0.35, this.owner.color);
        this.armyBody.setStrokeStyle(2, 0x000000);
        this.add(this.armyBody);
        
        // Army banner/flag
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
    
    updateVisuals() {
        if (this.unitText) {
            this.unitText.setText(this.unitCount.toString());
        }
        
        // Update color if owner changed
        if (this.armyBody) {
            this.armyBody.setFillStyle(this.owner.color);
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
            console.log(`Selected army at (${this.gridX}, ${this.gridY}) - Units: ${this.unitCount}`);
        }
    }
    
    moveToGrid(targetGridX, targetGridY) {
        // Validate target position
        if (targetGridX < 0 || targetGridX >= this.scene.mapWidth ||
            targetGridY < 0 || targetGridY >= this.scene.mapHeight) {
            console.log('Invalid move target');
            return false;
        }
        
        // Check for existing entities at target
        const targetCastle = this.scene.castles.find(c => c.gridX === targetGridX && c.gridY === targetGridY);
        const targetArmy = this.scene.armies.find(a => a.gridX === targetGridX && a.gridY === targetGridY && a !== this);
        
        if (targetCastle) {
            // Attack castle
            this.attackCastle(targetCastle);
            return true;
        } else if (targetArmy) {
            // Attack army
            this.attackArmy(targetArmy);
            return true;
        } else {
            // Move to empty position
            this.moveToPosition(targetGridX, targetGridY);
            return true;
        }
    }
    
    moveToPosition(targetGridX, targetGridY) {
        this.gridX = targetGridX;
        this.gridY = targetGridY;
        
        const targetX = targetGridX * this.tileSize + this.tileSize / 2;
        const targetY = targetGridY * this.tileSize + this.tileSize / 2;
        
        // Instant movement for now (can be animated later)
        this.x = targetX;
        this.y = targetY;
        
        console.log(`Army moved to (${targetGridX}, ${targetGridY})`);
        
        // Trigger movement event
        if (this.scene.gameManager) {
            this.scene.gameManager.onArmyMoved(this, targetGridX, targetGridY);
        }
    }
    
    attackCastle(castle) {
        console.log(`Army at (${this.gridX}, ${this.gridY}) attacking castle at (${castle.gridX}, ${castle.gridY})`);
        
        if (castle.owner === this.owner) {
            // Friendly castle - merge units
            const unitsToMerge = this.unitCount;
            castle.addUnits(unitsToMerge);
            console.log(`Army merged ${unitsToMerge} units into friendly castle`);
            this.destroy();
        } else {
            // Enemy castle - combat
            const combatResult = castle.defendAgainstArmy(this);
            
            // Handle combat result
            if (this.scene.combatSystem) {
                this.scene.combatSystem.handleCombatResult(this, castle, combatResult);
            }
        }
    }
    
    attackArmy(targetArmy) {
        console.log(`Army at (${this.gridX}, ${this.gridY}) attacking army at (${targetArmy.gridX}, ${targetArmy.gridY})`);
        
        if (targetArmy.owner === this.owner) {
            // Friendly army - merge
            this.mergeWithArmy(targetArmy);
        } else {
            // Enemy army - combat
            this.combatWithArmy(targetArmy);
        }
    }
    
    mergeWithArmy(otherArmy) {
        const totalUnits = this.unitCount + otherArmy.unitCount;
        this.unitCount = totalUnits;
        this.updateVisuals();
        
        console.log(`Armies merged. Total units: ${totalUnits}`);
        
        // Remove the other army
        otherArmy.destroy();
    }
    
    combatWithArmy(enemyArmy) {
        console.log(`Combat between armies: ${this.unitCount} vs ${enemyArmy.unitCount}`);
        
        // Simple combat: higher number wins
        if (this.unitCount > enemyArmy.unitCount) {
            // This army wins
            const survivingUnits = this.unitCount - enemyArmy.unitCount;
            this.unitCount = survivingUnits;
            this.updateVisuals();
            
            // Move to enemy position
            this.moveToPosition(enemyArmy.gridX, enemyArmy.gridY);
            
            // Remove enemy army
            enemyArmy.destroy();
            
            console.log(`Army won combat with ${survivingUnits} units remaining`);
        } else if (enemyArmy.unitCount > this.unitCount) {
            // Enemy army wins
            const survivingUnits = enemyArmy.unitCount - this.unitCount;
            enemyArmy.unitCount = survivingUnits;
            enemyArmy.updateVisuals();
            
            // Remove this army
            this.destroy();
            
            console.log(`Army lost combat. Enemy has ${survivingUnits} units remaining`);
        } else {
            // Tie - both armies destroyed
            console.log('Combat resulted in mutual destruction');
            enemyArmy.destroy();
            this.destroy();
        }
    }
    
    addUnits(count) {
        this.unitCount += count;
        this.updateVisuals();
        console.log(`Army gained ${count} units. Total: ${this.unitCount}`);
    }
    
    removeUnits(count) {
        const removedCount = Math.min(count, this.unitCount);
        this.unitCount -= removedCount;
        this.updateVisuals();
        
        if (this.unitCount <= 0) {
            this.destroy();
        }
        
        console.log(`Army lost ${removedCount} units. Remaining: ${this.unitCount}`);
        return removedCount;
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

window.Army = Army;