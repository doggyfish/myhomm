import { BuildingPanel } from './BuildingPanel.js';

export class CastleOverlay {
    constructor(scene) {
        this.scene = scene;
        this.castle = null;
        this.isVisible = false;
        
        // UI Components
        this.mainContainer = null;
        this.buildingPanel = null;
        this.selectedCastleSprite = null;
        
        this.createComponents();
    }

    createComponents() {
        // Main container for castle overlay
        this.mainContainer = this.scene.add.container(0, 0).setDepth(150);
        this.mainContainer.setVisible(false);

        // Building panel (reuse existing component)
        this.buildingPanel = new BuildingPanel(
            this.scene,
            this.scene.cameras.main.width - 200,
            this.scene.cameras.main.height / 2,
            380,
            500
        );

        // Create castle info panel
        this.createCastleInfoPanel();
        
        // Create resource display
        this.createResourceDisplay();
        
        // Create garrison display
        this.createGarrisonDisplay();
    }

    createCastleInfoPanel() {
        const panelX = 200;
        const panelY = 100;
        const panelWidth = 350;
        const panelHeight = 200;

        // Background
        this.infoPanelBg = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2c3e50, 0.9)
            .setStrokeStyle(2, 0x34495e)
            .setOrigin(0, 0);

        // Title
        this.castleNameText = this.scene.add.text(panelX + 10, panelY + 10, '', {
            font: '18px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        });

        // Owner info
        this.ownerText = this.scene.add.text(panelX + 10, panelY + 35, '', {
            font: '14px Arial',
            fill: '#bdc3c7'
        });

        // Position info
        this.positionText = this.scene.add.text(panelX + 10, panelY + 55, '', {
            font: '12px Arial',
            fill: '#95a5a6'
        });

        // Defense info
        this.defenseText = this.scene.add.text(panelX + 10, panelY + 75, '', {
            font: '12px Arial',
            fill: '#e74c3c'
        });

        // Buildings info
        this.buildingCountText = this.scene.add.text(panelX + 10, panelY + 95, '', {
            font: '12px Arial',
            fill: '#3498db'
        });

        // Manage Buildings button
        this.manageBuildingsBtn = this.scene.add.rectangle(panelX + 10, panelY + 130, 120, 35, 0x27ae60)
            .setStrokeStyle(2, 0x229954)
            .setOrigin(0, 0)
            .setInteractive()
            .on('pointerdown', () => this.openBuildingPanel())
            .on('pointerover', () => this.manageBuildingsBtn.setFillStyle(0x229954))
            .on('pointerout', () => this.manageBuildingsBtn.setFillStyle(0x27ae60));

        this.manageBuildingsBtnText = this.scene.add.text(panelX + 70, panelY + 147, 'Manage Buildings', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Dispatch Army button
        this.dispatchArmyBtn = this.scene.add.rectangle(panelX + 150, panelY + 130, 120, 35, 0x3498db)
            .setStrokeStyle(2, 0x2980b9)
            .setOrigin(0, 0)
            .setInteractive()
            .on('pointerdown', () => this.dispatchArmy())
            .on('pointerover', () => this.dispatchArmyBtn.setFillStyle(0x2980b9))
            .on('pointerout', () => this.dispatchArmyBtn.setFillStyle(0x3498db));

        this.dispatchArmyBtnText = this.scene.add.text(panelX + 210, panelY + 147, 'Dispatch Army', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Close button
        this.closeBtn = this.scene.add.rectangle(panelX + panelWidth - 30, panelY + 10, 25, 25, 0xe74c3c)
            .setStrokeStyle(2, 0xc0392b)
            .setInteractive()
            .on('pointerdown', () => this.hide())
            .on('pointerover', () => this.closeBtn.setFillStyle(0xc0392b))
            .on('pointerout', () => this.closeBtn.setFillStyle(0xe74c3c));

        this.closeBtnText = this.scene.add.text(panelX + panelWidth - 17, panelY + 22, 'X', {
            font: '14px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add all to main container
        this.mainContainer.add([
            this.infoPanelBg,
            this.castleNameText,
            this.ownerText,
            this.positionText,
            this.defenseText,
            this.buildingCountText,
            this.manageBuildingsBtn,
            this.manageBuildingsBtnText,
            this.dispatchArmyBtn,
            this.dispatchArmyBtnText,
            this.closeBtn,
            this.closeBtnText
        ]);
    }

    createResourceDisplay() {
        const panelX = 200;
        const panelY = 320;
        const panelWidth = 350;
        const panelHeight = 120;

        // Background
        this.resourcePanelBg = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x34495e, 0.9)
            .setStrokeStyle(2, 0x7f8c8d)
            .setOrigin(0, 0);

        // Title
        this.resourceTitleText = this.scene.add.text(panelX + 10, panelY + 10, 'Resource Generation', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        });

        // Resource rates (will be populated dynamically)
        this.resourceRatesContainer = this.scene.add.container(panelX + 10, panelY + 40);

        this.mainContainer.add([
            this.resourcePanelBg,
            this.resourceTitleText,
            this.resourceRatesContainer
        ]);
    }

    createGarrisonDisplay() {
        const panelX = 200;
        const panelY = 460;
        const panelWidth = 350;
        const panelHeight = 120;

        // Background
        this.garrisonPanelBg = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x8e44ad, 0.9)
            .setStrokeStyle(2, 0x9b59b6)
            .setOrigin(0, 0);

        // Title
        this.garrisonTitleText = this.scene.add.text(panelX + 10, panelY + 10, 'Garrison Army', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        });

        // Garrison info
        this.garrisonInfoText = this.scene.add.text(panelX + 10, panelY + 35, '', {
            font: '12px Arial',
            fill: '#ecf0f1'
        });

        // Garrison units container
        this.garrisonUnitsContainer = this.scene.add.container(panelX + 10, panelY + 60);

        this.mainContainer.add([
            this.garrisonPanelBg,
            this.garrisonTitleText,
            this.garrisonInfoText,
            this.garrisonUnitsContainer
        ]);
    }

    show(castle, castleSprite) {
        this.castle = castle;
        this.selectedCastleSprite = castleSprite;
        this.isVisible = true;
        
        // Highlight selected castle
        if (castleSprite) {
            castleSprite.setTint(0x00ff00);
        }
        
        this.mainContainer.setVisible(true);
        this.updateDisplay();
    }

    hide() {
        this.isVisible = false;
        this.mainContainer.setVisible(false);
        this.buildingPanel.hide();
        
        // Remove castle highlight
        if (this.selectedCastleSprite) {
            this.selectedCastleSprite.clearTint();
            this.selectedCastleSprite = null;
        }
        
        this.castle = null;
    }

    openBuildingPanel() {
        if (this.castle && this.buildingPanel) {
            this.buildingPanel.show(this.castle);
        }
    }

    dispatchArmy() {
        if (!this.castle || !this.castle.hasGarrison()) {
            console.log('No garrison army to dispatch');
            // Show message to user
            this.showNoGarrisonMessage();
            return;
        }

        const garrison = this.castle.getGarrisonArmy();
        if (!garrison) {
            console.log('Garrison army not found');
            return;
        }

        // Create simple dispatch confirmation
        this.showDispatchConfirmation(garrison);
    }

    showNoGarrisonMessage() {
        // Temporarily show message on the garrison info text
        const originalText = this.garrisonInfoText.text;
        this.garrisonInfoText.setText('No garrison army to dispatch').setFill('#e74c3c');
        
        // Reset after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            this.garrisonInfoText.setText(originalText).setFill('#ecf0f1');
        });
    }

    showDispatchConfirmation(garrison) {
        const screenCenterX = this.scene.cameras.main.width / 2;
        const screenCenterY = this.scene.cameras.main.height / 2;

        // Create confirmation dialog
        this.confirmationContainer = this.scene.add.container(screenCenterX, screenCenterY).setDepth(200);

        // Background
        const confirmBg = this.scene.add.rectangle(0, 0, 300, 200, 0x2c3e50, 0.95)
            .setStrokeStyle(2, 0x34495e);

        // Title
        const titleText = this.scene.add.text(0, -70, 'Dispatch Army', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Garrison info
        const unitCount = garrison.getTotalUnitCount ? garrison.getTotalUnitCount() : 0;
        const totalPower = garrison.getCurrentPower ? garrison.getCurrentPower() : 0;
        
        const infoText = this.scene.add.text(0, -30, 
            `Units: ${unitCount}\nTotal Power: ${totalPower}`, {
            font: '12px Arial',
            fill: '#ecf0f1',
            align: 'center'
        }).setOrigin(0.5);

        // Confirm button
        const confirmBtn = this.scene.add.rectangle(-75, 40, 100, 35, 0x27ae60)
            .setStrokeStyle(2, 0x229954)
            .setInteractive()
            .on('pointerdown', () => this.confirmDispatch(garrison))
            .on('pointerover', () => confirmBtn.setFillStyle(0x229954))
            .on('pointerout', () => confirmBtn.setFillStyle(0x27ae60));

        const confirmBtnText = this.scene.add.text(-75, 40, 'Dispatch', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Cancel button
        const cancelBtn = this.scene.add.rectangle(75, 40, 100, 35, 0xe74c3c)
            .setStrokeStyle(2, 0xc0392b)
            .setInteractive()
            .on('pointerdown', () => this.cancelDispatch())
            .on('pointerover', () => cancelBtn.setFillStyle(0xc0392b))
            .on('pointerout', () => cancelBtn.setFillStyle(0xe74c3c));

        const cancelBtnText = this.scene.add.text(75, 40, 'Cancel', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.confirmationContainer.add([
            confirmBg, titleText, infoText, 
            confirmBtn, confirmBtnText, 
            cancelBtn, cancelBtnText
        ]);
    }

    confirmDispatch(garrison) {
        // Remove garrison from castle
        this.castle.setGarrisonArmy(null);

        // Create army on the map at castle position
        const castlePos = this.castle.getPosition();
        
        // Move army to an adjacent tile (for simplicity, move one tile to the right)
        garrison.setPosition(castlePos.x + 1, castlePos.y);
        garrison.isGarrison = false;
        garrison.location = null;

        console.log(`Army dispatched from ${this.castle.name} to position (${castlePos.x + 1}, ${castlePos.y})`);

        // Clean up confirmation dialog
        this.cancelDispatch();

        // Update the castle display
        this.updateDisplay();
    }

    cancelDispatch() {
        if (this.confirmationContainer) {
            this.confirmationContainer.destroy();
            this.confirmationContainer = null;
        }
    }

    updateDisplay() {
        if (!this.castle) return;

        this.updateCastleInfo();
        this.updateResourceDisplay();
        this.updateGarrisonDisplay();
    }

    updateCastleInfo() {
        const info = this.castle.getInfo();
        const position = this.castle.getPosition();

        this.castleNameText.setText(info.name);
        this.ownerText.setText(`Owner: ${info.owner ? `Player ${info.owner}` : 'Neutral'}`);
        this.positionText.setText(`Position: (${position.x}, ${position.y})`);
        
        const defenseDetails = this.castle.getDefenseDetails();
        this.defenseText.setText(`Defense: ${Math.floor(defenseDetails.totalCastlePower)} power`);
        
        this.buildingCountText.setText(`Buildings: ${info.buildingCount}/${this.castle.buildingSlots}`);

        // Update dispatch army button state
        const hasGarrison = this.castle.hasGarrison();
        if (hasGarrison) {
            this.dispatchArmyBtn.setFillStyle(0x3498db).setStrokeStyle(2, 0x2980b9);
            this.dispatchArmyBtnText.setFill('#ffffff');
        } else {
            this.dispatchArmyBtn.setFillStyle(0x7f8c8d).setStrokeStyle(2, 0x95a5a6);
            this.dispatchArmyBtnText.setFill('#bdc3c7');
        }
    }

    updateResourceDisplay() {
        // Clear existing resource displays
        this.resourceRatesContainer.removeAll(true);

        const rates = this.castle.getResourceGenerationRates();
        let yOffset = 0;
        let xOffset = 0;
        const columnWidth = 110;

        Object.keys(rates).forEach((resource, index) => {
            const rate = rates[resource];
            if (rate > 0) {
                const resourceText = this.scene.add.text(xOffset, yOffset, 
                    `${resource}: +${Math.floor(rate)}/min`, {
                    font: '11px Arial',
                    fill: this.getResourceColor(resource)
                });

                this.resourceRatesContainer.add(resourceText);

                // Arrange in columns
                if ((index + 1) % 3 === 0) {
                    yOffset += 20;
                    xOffset = 0;
                } else {
                    xOffset += columnWidth;
                }
            }
        });

        if (this.resourceRatesContainer.list.length === 0) {
            const noResourceText = this.scene.add.text(0, 0, 'No resource generation', {
                font: '12px Arial',
                fill: '#95a5a6'
            });
            this.resourceRatesContainer.add(noResourceText);
        }
    }

    updateGarrisonDisplay() {
        const garrison = this.castle.getGarrisonArmy();
        
        if (!garrison) {
            this.garrisonInfoText.setText('No garrison army');
            this.garrisonUnitsContainer.removeAll(true);
            return;
        }

        // Update garrison info
        const totalPower = garrison.getCurrentPower ? garrison.getCurrentPower() : 0;
        const unitCount = garrison.getTotalUnitCount ? garrison.getTotalUnitCount() : 0;
        this.garrisonInfoText.setText(`${unitCount} units, ${totalPower} total power`);

        // Clear existing unit displays
        this.garrisonUnitsContainer.removeAll(true);

        // Display unit composition (if available)
        if (garrison.getComposition) {
            const composition = garrison.getComposition();
            let xOffset = 0;
            
            Object.keys(composition).forEach(unitType => {
                const count = composition[unitType];
                if (count > 0) {
                    const unitText = this.scene.add.text(xOffset, 0, 
                        `${count} ${unitType}`, {
                        font: '10px Arial',
                        fill: '#ecf0f1'
                    });
                    
                    this.garrisonUnitsContainer.add(unitText);
                    xOffset += 80;
                }
            });
        } else {
            // Fallback if garrison doesn't have composition method
            const placeholderText = this.scene.add.text(0, 0, 'Garrison details unavailable', {
                font: '10px Arial',
                fill: '#95a5a6'
            });
            this.garrisonUnitsContainer.add(placeholderText);
        }
    }

    getResourceColor(resource) {
        const colors = {
            gold: '#f1c40f',
            mana: '#3498db',
            wood: '#8b4513',
            stone: '#7f8c8d',
            mercury: '#e74c3c',
            sulfur: '#e67e22',
            crystal: '#9b59b6'
        };
        return colors[resource] || '#ecf0f1';
    }

    update(deltaTime) {
        if (this.isVisible && this.castle) {
            // Update castle systems
            this.castle.update(deltaTime);
            
            // Update building panel
            if (this.buildingPanel) {
                this.buildingPanel.update(deltaTime);
            }
            
            // Refresh display periodically (every second)
            if (this.scene.time.now % 1000 < 50) {
                this.updateDisplay();
            }
        }
    }

    destroy() {
        // Clean up confirmation dialog if open
        if (this.confirmationContainer) {
            this.confirmationContainer.destroy();
            this.confirmationContainer = null;
        }

        if (this.buildingPanel) {
            this.buildingPanel.destroy();
        }
        
        if (this.mainContainer) {
            this.mainContainer.destroy(true);
        }

        if (this.selectedCastleSprite) {
            this.selectedCastleSprite.clearTint();
        }
    }
}