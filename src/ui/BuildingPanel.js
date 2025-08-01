import { BUILDING_CONFIGS } from '../config/BuildingConfig.js';
import { Building } from '../entities/Building.js';

export class BuildingPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.castle = null;
        this.isVisible = false;
        
        this.container = scene.add.container(x, y);
        this.container.setDepth(200);
        this.container.setVisible(false);
        
        this.selectedBuilding = null;
        this.createPanel();
    }

    createPanel() {
        // Background
        this.background = this.scene.add.rectangle(0, 0, this.width, this.height, 0x2c3e50, 0.95)
            .setStrokeStyle(2, 0x34495e);
        this.container.add(this.background);

        // Title
        this.titleText = this.scene.add.text(0, -this.height/2 + 20, 'Castle Buildings', {
            font: '18px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.container.add(this.titleText);

        // Close button
        this.closeButton = this.scene.add.rectangle(this.width/2 - 20, -this.height/2 + 20, 30, 30, 0xe74c3c)
            .setStrokeStyle(2, 0xc0392b)
            .setInteractive()
            .on('pointerdown', () => this.hide())
            .on('pointerover', () => this.closeButton.setFillStyle(0xc0392b))
            .on('pointerout', () => this.closeButton.setFillStyle(0xe74c3c));
        
        this.closeButtonText = this.scene.add.text(this.width/2 - 20, -this.height/2 + 20, 'X', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.container.add([this.closeButton, this.closeButtonText]);

        // Building list container
        this.buildingListContainer = this.scene.add.container(-this.width/2 + 20, -this.height/2 + 60);
        this.container.add(this.buildingListContainer);

        // Available buildings container (right side)
        this.availableBuildingsContainer = this.scene.add.container(20, -this.height/2 + 60);
        this.container.add(this.availableBuildingsContainer);
    }

    show(castle) {
        this.castle = castle;
        this.container.setVisible(true);
        this.isVisible = true;
        this.updateDisplay();
    }

    hide() {
        this.container.setVisible(false);
        this.isVisible = false;
        this.castle = null;
        this.selectedBuilding = null;
    }

    updateDisplay() {
        if (!this.castle) return;

        this.clearContainers();
        this.displayExistingBuildings();
        this.displayAvailableBuildings();
    }

    clearContainers() {
        this.buildingListContainer.removeAll(true);
        this.availableBuildingsContainer.removeAll(true);
    }

    displayExistingBuildings() {
        const buildings = this.castle.getBuildings();
        let yOffset = 0;

        // Existing buildings section
        const existingTitle = this.scene.add.text(0, yOffset, 'Current Buildings:', {
            font: '14px Arial',
            fill: '#ecf0f1',
            fontStyle: 'bold'
        });
        this.buildingListContainer.add(existingTitle);
        yOffset += 25;

        buildings.forEach((building, index) => {
            this.createBuildingItem(building, 0, yOffset, true);
            yOffset += 50;
        });

        // Building slots info
        const slotsUsed = buildings.length;
        const totalSlots = this.castle.buildingSlots;
        const slotsText = this.scene.add.text(0, yOffset + 10, 
            `Slots: ${slotsUsed}/${totalSlots}`, {
            font: '12px Arial',
            fill: '#bdc3c7'
        });
        this.buildingListContainer.add(slotsText);
    }

    displayAvailableBuildings() {
        let yOffset = 0;

        // Available buildings section
        const availableTitle = this.scene.add.text(0, yOffset, 'Available Buildings:', {
            font: '14px Arial',
            fill: '#ecf0f1',
            fontStyle: 'bold'
        });
        this.availableBuildingsContainer.add(availableTitle);
        yOffset += 25;

        Object.keys(BUILDING_CONFIGS).forEach(buildingType => {
            if (!this.castle.hasBuilding(buildingType) && this.castle.canBuildMoreBuildings()) {
                this.createAvailableBuildingItem(buildingType, 0, yOffset);
                yOffset += 45;
            }
        });

        if (yOffset === 25) { // Only title was added
            const noBuildings = this.scene.add.text(0, yOffset, 
                this.castle.canBuildMoreBuildings() ? 'All buildings constructed' : 'No building slots available', {
                font: '12px Arial',
                fill: '#95a5a6'
            });
            this.availableBuildingsContainer.add(noBuildings);
        }
    }

    createBuildingItem(building, x, y, isExisting = true) {
        const info = building.getInfo();
        
        // Building background
        const bg = this.scene.add.rectangle(x, y, 180, 45, 0x34495e, 0.8)
            .setStrokeStyle(1, 0x7f8c8d);

        // Building name
        const nameText = this.scene.add.text(x - 85, y - 10, info.name, {
            font: '12px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        });

        // Building level
        const levelText = this.scene.add.text(x - 85, y + 5, `Level ${info.level}`, {
            font: '10px Arial',
            fill: '#bdc3c7'
        });

        // Status
        let statusText = '';
        let statusColor = '#27ae60';
        
        if (!info.isConstructed) {
            statusText = `Building... ${Math.floor(info.constructionProgress * 100)}%`;
            statusColor = '#f39c12';
        } else if (info.productionStatus.isProducing) {
            statusText = `Producing ${info.productionStatus.currentUnit}`;
            statusColor = '#3498db';
        } else {
            statusText = 'Ready';
        }

        const status = this.scene.add.text(x + 85, y, statusText, {
            font: '9px Arial',
            fill: statusColor
        }).setOrigin(1, 0.5);

        const group = [bg, nameText, levelText, status];

        if (isExisting) {
            // Make clickable for existing buildings
            bg.setInteractive()
                .on('pointerdown', () => this.selectBuilding(building))
                .on('pointerover', () => bg.setFillStyle(0x5d6d7e))
                .on('pointerout', () => bg.setFillStyle(0x34495e));
        }

        this.buildingListContainer.add(group);
        return group;
    }

    createAvailableBuildingItem(buildingType, x, y) {
        const config = BUILDING_CONFIGS[buildingType];
        const building = new Building(buildingType);
        const cost = building.getCost();
        
        // Background
        const bg = this.scene.add.rectangle(x, y, 180, 40, 0x27ae60, 0.8)
            .setStrokeStyle(1, 0x229954);

        // Building name
        const nameText = this.scene.add.text(x - 85, y - 8, building.getName(), {
            font: '11px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        });

        // Cost
        const costText = Object.keys(cost)
            .map(resource => `${cost[resource]} ${resource}`)
            .join(', ');
        
        const costDisplay = this.scene.add.text(x - 85, y + 6, costText, {
            font: '9px Arial',
            fill: '#ecf0f1'
        });

        // Check if can afford
        const canAfford = this.castle.owner?.resourceManager ? 
            building.canConstruct(this.castle.owner.resourceManager) : false;
        
        if (!canAfford) {
            bg.setFillStyle(0x95a5a6);
            bg.setStrokeStyle(1, 0x7f8c8d);
        }

        const group = [bg, nameText, costDisplay];

        // Make clickable if can afford
        if (canAfford) {
            bg.setInteractive()
                .on('pointerdown', () => this.constructBuilding(buildingType))
                .on('pointerover', () => bg.setFillStyle(0x229954))
                .on('pointerout', () => bg.setFillStyle(0x27ae60));
        }

        this.availableBuildingsContainer.add(group);
        return group;
    }

    selectBuilding(building) {
        this.selectedBuilding = building;
        console.log('Selected building:', building.getInfo());
        // TODO: Show building details panel
    }

    constructBuilding(buildingType) {
        if (!this.castle || !this.castle.owner?.resourceManager) return;

        const building = new Building(buildingType);
        
        if (building.startConstruction(this.castle.owner.resourceManager)) {
            const success = this.castle.addBuilding(building);
            if (success) {
                console.log(`Started construction of ${building.getName()}`);
                this.updateDisplay();
            } else {
                // Refund resources if couldn't add to castle
                console.log('Could not add building to castle');
            }
        } else {
            console.log('Cannot afford building construction');
        }
    }

    update(deltaTime) {
        if (this.isVisible && this.castle) {
            // Update building construction/production
            this.castle.getBuildings().forEach(building => {
                building.update(deltaTime);
            });
            
            // Refresh display periodically
            if (this.scene.time.now % 1000 < 50) { // Roughly every second
                this.updateDisplay();
            }
        }
    }

    destroy() {
        if (this.container) {
            this.container.destroy(true);
        }
    }
}