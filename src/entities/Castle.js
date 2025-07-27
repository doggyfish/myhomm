/**
 * Castle class for MyHoMM Phaser 3 Version
 * Extends Phaser GameObject for castle entities that produce units
 */

class Castle extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);
        
        // Add to scene
        config.scene.add.existing(this);
        
        // Entity properties
        this.type = 'castle';
        this.gridX = config.gridX;
        this.gridY = config.gridY;
        this.owner = config.owner;
        this.unitCount = config.unitCount || 10;
        this.maxUnits = MyHoMMConfig.units.maxUnitsPerCastle;
        
        // Phase 1-2: Castle upgrades and economics
        this.level = config.level || 1;
        this.upgrades = {
            production: 0, // +1 unit per upgrade level
            defense: 0,    // +10% defensive bonus per level
            capacity: 0,   // +50 max units per level
            economy: 0     // +5 gold per turn per level
        };
        this.defenseBonus = 0.1; // 10% base defensive bonus
        this.goldProduction = 5; // Base gold per production cycle
        
        // Phase 3-4: Unit type composition for mobile/tactical
        this.unitTypes = {
            infantry: { count: Math.floor(this.unitCount * 0.4), level: 1 },
            archers: { count: Math.floor(this.unitCount * 0.3), level: 2 },
            cavalry: { count: Math.floor(this.unitCount * 0.2), level: 3 },
            knights: { count: Math.floor(this.unitCount * 0.1), level: 4 }
        };
        this.updateTotalUnits();
        
        // Visual properties
        this.tileSize = MyHoMMConfig.map.tileSize;
        this.isSelected = false;
        
        // Production properties
        this.lastProductionTime = 0;
        this.productionInterval = MyHoMMConfig.units.productionInterval;
        
        // Create visual components
        this.createVisuals();
        
        // Make interactive
        this.setInteractive(new Phaser.Geom.Rectangle(-this.tileSize/2, -this.tileSize/2, this.tileSize, this.tileSize), Phaser.Geom.Rectangle.Contains);
        
        console.log(`Castle created at (${this.gridX}, ${this.gridY}) for ${this.owner.name}`);
    }
    
    createVisuals() {
        // Main castle body
        this.castleBody = this.scene.add.rectangle(0, 0, this.tileSize * 0.8, this.tileSize * 0.8, this.owner.color);
        this.castleBody.setStrokeStyle(2, 0x000000);
        this.add(this.castleBody);
        
        // Castle flag/tower
        this.castleFlag = this.scene.add.rectangle(0, -this.tileSize * 0.25, this.tileSize * 0.3, this.tileSize * 0.2, this.owner.color);
        this.castleFlag.setStrokeStyle(1, 0x000000);
        this.add(this.castleFlag);
        
        // Unit count text
        this.unitText = this.scene.add.text(0, this.tileSize * 0.15, this.unitCount.toString(), {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this.unitText.setOrigin(0.5);
        this.add(this.unitText);
        
        // Phase 1-2: Castle level text
        this.levelText = this.scene.add.text(-this.tileSize * 0.3, -this.tileSize * 0.3, `L${this.level}`, {
            fontSize: '10px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 1
        });
        this.levelText.setOrigin(0.5);
        this.add(this.levelText);
        
        // Selection indicator (initially hidden)
        this.selectionIndicator = this.scene.add.graphics();
        this.selectionIndicator.lineStyle(3, 0xffff00, 1);
        this.selectionIndicator.strokeRect(-this.tileSize/2, -this.tileSize/2, this.tileSize, this.tileSize);
        this.selectionIndicator.setVisible(false);
        this.add(this.selectionIndicator);
        
        // Depth sorting
        this.setDepth(10);
    }
    
    updateVisuals() {
        if (this.unitText) {
            this.unitText.setText(this.unitCount.toString());
        }
        
        // Update color if owner changed
        if (this.castleBody) {
            this.castleBody.setFillStyle(this.owner.color);
        }
        if (this.castleFlag) {
            this.castleFlag.setFillStyle(this.owner.color);
        }
        
        // Phase 1-2: Show castle level
        if (this.levelText) {
            this.levelText.setText(`L${this.level}`);
        }
    }
    
    // Phase 3-4: Update unit count from unit types
    updateTotalUnits() {
        this.unitCount = Object.values(this.unitTypes).reduce((total, unitType) => total + unitType.count, 0);
    }
    
    setSelected(selected) {
        this.isSelected = selected;
        if (this.selectionIndicator) {
            this.selectionIndicator.setVisible(selected);
        }
        
        if (selected) {
            console.log(`Selected castle at (${this.gridX}, ${this.gridY}) - Units: ${this.unitCount}`);
        }
    }
    
    produceUnit() {
        const effectiveMaxUnits = this.maxUnits + (this.upgrades.capacity * 50);
        if (this.unitCount >= effectiveMaxUnits) {
            return false;
        }
        
        // Phase 1-2: Enhanced production based on upgrades
        const productionAmount = 1 + this.upgrades.production;
        
        // Phase 3-4: Produce different unit types
        this.produceSpecificUnitType(productionAmount);
        
        this.updateTotalUnits();
        this.updateVisuals();
        
        // Phase 1-2: Produce gold
        const goldProduced = this.goldProduction + (this.upgrades.economy * 5);
        this.owner.addGold(goldProduced);
        
        // Update owner statistics
        this.owner.addUnits(productionAmount);
        
        console.log(`Castle at (${this.gridX}, ${this.gridY}) produced ${productionAmount} units. Total: ${this.unitCount}`);
        return true;
    }
    
    // Phase 3-4: Produce specific unit types
    produceSpecificUnitType(amount) {
        // Simple production algorithm - mostly infantry with some variety
        for (let i = 0; i < amount; i++) {
            const rand = Math.random();
            if (rand < 0.5) {
                this.unitTypes.infantry.count++;
            } else if (rand < 0.75) {
                this.unitTypes.archers.count++;
            } else if (rand < 0.9) {
                this.unitTypes.cavalry.count++;
            } else {
                this.unitTypes.knights.count++;
            }
        }
    }
    
    // Phase 1-2: Castle upgrade system
    upgrade(upgradeType) {
        const costs = {
            production: (this.upgrades.production + 1) * 100,
            defense: (this.upgrades.defense + 1) * 150,
            capacity: (this.upgrades.capacity + 1) * 200,
            economy: (this.upgrades.economy + 1) * 120
        };
        
        const cost = costs[upgradeType];
        if (!cost) {
            console.log(`Invalid upgrade type: ${upgradeType}`);
            return false;
        }
        
        if (this.owner.spendGold(cost)) {
            this.upgrades[upgradeType]++;
            this.level = Math.max(this.level, Math.max(...Object.values(this.upgrades)) + 1);
            this.updateVisuals();
            console.log(`Castle upgraded ${upgradeType} to level ${this.upgrades[upgradeType]}`);
            return true;
        }
        
        console.log(`Cannot afford ${upgradeType} upgrade (Cost: ${cost})`);
        return false;
    }
    
    removeUnits(count) {
        const removedCount = Math.min(count, this.unitCount);
        this.unitCount -= removedCount;
        this.updateVisuals();
        
        console.log(`Castle at (${this.gridX}, ${this.gridY}) lost ${removedCount} units. Remaining: ${this.unitCount}`);
        return removedCount;
    }
    
    addUnits(count) {
        const addedCount = Math.min(count, this.maxUnits - this.unitCount);
        this.unitCount += addedCount;
        this.updateVisuals();
        
        console.log(`Castle at (${this.gridX}, ${this.gridY}) gained ${addedCount} units. Total: ${this.unitCount}`);
        return addedCount;
    }
    
    changeOwner(newOwner) {
        const oldOwner = this.owner;
        this.owner = newOwner;
        this.updateVisuals();
        
        console.log(`Castle at (${this.gridX}, ${this.gridY}) captured by ${newOwner.name} from ${oldOwner.name}`);
        
        // Trigger events
        if (this.scene.gameManager) {
            this.scene.gameManager.onCastleCaptured(this, oldOwner, newOwner);
        }
    }
    
    canProduceUnit() {
        return this.unitCount < this.maxUnits;
    }
    
    getProductionRate() {
        return 1000 / this.productionInterval; // Units per second
    }
    
    isOwnedBy(player) {
        return this.owner === player;
    }
    
    getDistanceTo(other) {
        const dx = this.gridX - other.gridX;
        const dy = this.gridY - other.gridY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Combat methods
    defendAgainstArmy(army) {
        console.log(`Castle at (${this.gridX}, ${this.gridY}) defending against army of ${army.unitCount} units`);
        
        // Simple combat: higher number wins
        if (army.unitCount > this.unitCount) {
            // Castle is captured
            const survivingUnits = army.unitCount - this.unitCount;
            this.changeOwner(army.owner);
            this.unitCount = survivingUnits;
            this.updateVisuals();
            
            // Remove the attacking army
            army.destroy();
            
            return {
                captured: true,
                defenderUnitsLost: this.unitCount,
                attackerUnitsLost: army.unitCount - survivingUnits
            };
        } else {
            // Castle successfully defends
            const survivingDefenders = this.unitCount - army.unitCount;
            this.unitCount = survivingDefenders;
            this.updateVisuals();
            
            // Remove the attacking army
            army.destroy();
            
            return {
                captured: false,
                defenderUnitsLost: army.unitCount,
                attackerUnitsLost: army.unitCount
            };
        }
    }
    
    serialize() {
        return {
            type: 'castle',
            gridX: this.gridX,
            gridY: this.gridY,
            x: this.x,
            y: this.y,
            ownerId: this.owner.id,
            unitCount: this.unitCount,
            lastProductionTime: this.lastProductionTime
        };
    }
    
    static deserialize(scene, data, players) {
        const owner = players.find(p => p.id === data.ownerId);
        return new Castle({
            scene: scene,
            x: data.x,
            y: data.y,
            gridX: data.gridX,
            gridY: data.gridY,
            owner: owner,
            unitCount: data.unitCount
        });
    }
    
    destroy() {
        if (this.scene && this.scene.castles) {
            const index = this.scene.castles.indexOf(this);
            if (index !== -1) {
                this.scene.castles.splice(index, 1);
            }
        }
        
        super.destroy();
    }
}

window.Castle = Castle;