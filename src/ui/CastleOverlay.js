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
        
        // Create dispatched armies display
        this.createDispatchedArmiesDisplay();
    }

    createCastleInfoPanel() {
        // Use default positions that will be updated when shown
        const panelX = 200;
        const panelY = 100;
        const panelWidth = 350;
        const panelHeight = 200;

        // Background
        this.infoPanelBg = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2c3e50, 0.9)
            .setStrokeStyle(2, 0x34495e)
            .setOrigin(0, 0)
            .setScrollFactor(0); // Keep fixed to camera

        // Title
        this.castleNameText = this.scene.add.text(panelX + 10, panelY + 10, '', {
            font: '18px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0);

        // Owner info
        this.ownerText = this.scene.add.text(panelX + 10, panelY + 35, '', {
            font: '14px Arial',
            fill: '#bdc3c7'
        }).setScrollFactor(0);

        // Position info
        this.positionText = this.scene.add.text(panelX + 10, panelY + 55, '', {
            font: '12px Arial',
            fill: '#95a5a6'
        }).setScrollFactor(0);

        // Defense info
        this.defenseText = this.scene.add.text(panelX + 10, panelY + 75, '', {
            font: '12px Arial',
            fill: '#e74c3c'
        }).setScrollFactor(0);

        // Buildings info
        this.buildingCountText = this.scene.add.text(panelX + 10, panelY + 95, '', {
            font: '12px Arial',
            fill: '#3498db'
        }).setScrollFactor(0);

        // Manage Buildings button
        this.manageBuildingsBtn = this.scene.add.rectangle(panelX + 10, panelY + 130, 120, 35, 0x27ae60)
            .setStrokeStyle(2, 0x229954)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setInteractive()
            .on('pointerdown', () => this.openBuildingPanel())
            .on('pointerover', () => this.manageBuildingsBtn.setFillStyle(0x229954))
            .on('pointerout', () => this.manageBuildingsBtn.setFillStyle(0x27ae60));

        this.manageBuildingsBtnText = this.scene.add.text(panelX + 70, panelY + 147, 'Manage Buildings', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        // Dispatch Army button
        this.dispatchArmyBtn = this.scene.add.rectangle(panelX + 150, panelY + 130, 120, 35, 0x3498db)
            .setStrokeStyle(2, 0x2980b9)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setInteractive()
            .on('pointerdown', () => this.dispatchArmy())
            .on('pointerover', () => this.dispatchArmyBtn.setFillStyle(0x2980b9))
            .on('pointerout', () => this.dispatchArmyBtn.setFillStyle(0x3498db));

        this.dispatchArmyBtnText = this.scene.add.text(panelX + 210, panelY + 147, 'Dispatch Army', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        // Close button
        this.closeBtn = this.scene.add.rectangle(panelX + panelWidth - 30, panelY + 10, 25, 25, 0xe74c3c)
            .setStrokeStyle(2, 0xc0392b)
            .setScrollFactor(0)
            .setInteractive()
            .on('pointerdown', () => this.hide())
            .on('pointerover', () => this.closeBtn.setFillStyle(0xc0392b))
            .on('pointerout', () => this.closeBtn.setFillStyle(0xe74c3c));

        this.closeBtnText = this.scene.add.text(panelX + panelWidth - 17, panelY + 22, 'X', {
            font: '14px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

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
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // Title
        this.resourceTitleText = this.scene.add.text(panelX + 10, panelY + 10, 'Resource Generation', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0);

        // Resource rates (will be populated dynamically)
        this.resourceRatesContainer = this.scene.add.container(panelX + 10, panelY + 40)
            .setScrollFactor(0);

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
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // Title
        this.garrisonTitleText = this.scene.add.text(panelX + 10, panelY + 10, 'Garrison Army', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0);

        // Garrison info
        this.garrisonInfoText = this.scene.add.text(panelX + 10, panelY + 35, '', {
            font: '12px Arial',
            fill: '#ecf0f1'
        }).setScrollFactor(0);

        // Garrison units container
        this.garrisonUnitsContainer = this.scene.add.container(panelX + 10, panelY + 60)
            .setScrollFactor(0);

        this.mainContainer.add([
            this.garrisonPanelBg,
            this.garrisonTitleText,
            this.garrisonInfoText,
            this.garrisonUnitsContainer
        ]);
    }

    createDispatchedArmiesDisplay() {
        const panelX = 200;
        const panelY = 600;
        const panelWidth = 350;
        const panelHeight = 140;

        // Background
        this.dispatchedPanelBg = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x16537e, 0.9)
            .setStrokeStyle(2, 0x2980b9)
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // Title
        this.dispatchedTitleText = this.scene.add.text(panelX + 10, panelY + 10, 'Dispatched Armies', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0);

        // Dispatched armies info
        this.dispatchedInfoText = this.scene.add.text(panelX + 10, panelY + 35, '', {
            font: '12px Arial',
            fill: '#ecf0f1'
        }).setScrollFactor(0);

        // Dispatched armies container
        this.dispatchedArmiesContainer = this.scene.add.container(panelX + 10, panelY + 60)
            .setScrollFactor(0);

        // Select army button
        this.selectArmyBtn = this.scene.add.rectangle(panelX + 10, panelY + 100, 120, 30, 0x8e44ad)
            .setStrokeStyle(2, 0x9b59b6)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setInteractive()
            .on('pointerdown', () => this.selectDispatchedArmy())
            .on('pointerover', () => this.selectArmyBtn.setFillStyle(0x9b59b6))
            .on('pointerout', () => this.selectArmyBtn.setFillStyle(0x8e44ad));

        this.selectArmyBtnText = this.scene.add.text(panelX + 70, panelY + 115, 'Select Army', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        this.mainContainer.add([
            this.dispatchedPanelBg,
            this.dispatchedTitleText,
            this.dispatchedInfoText,
            this.dispatchedArmiesContainer,
            this.selectArmyBtn,
            this.selectArmyBtnText
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
        
        // Position UI near the castle
        this.positionUINearCastle(castle, castleSprite);
        
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

    positionUINearCastle(castle, castleSprite) {
        const camera = this.scene.cameras.main;
        const castlePos = castle.getPosition();
        
        // Convert castle tile position to world coordinates
        const tileSize = 32; // Should match TilemapRenderer.tileSize
        const worldX = castlePos.x * tileSize + tileSize / 2;
        const worldY = castlePos.y * tileSize + tileSize / 2;
        
        // Convert world coordinates to screen coordinates
        const screenX = (worldX - camera.scrollX) * camera.zoom;
        const screenY = (worldY - camera.scrollY) * camera.zoom;
        
        // Position UI to the right of the castle, but keep it on screen
        let uiX = screenX + 100; // Offset to the right
        let uiY = screenY - 200; // Offset upward
        
        // Keep UI within screen bounds
        const screenWidth = camera.width;
        const screenHeight = camera.height;
        const panelWidth = 350;
        const panelHeight = 740; // Total height of all panels (increased for dispatched armies)
        
        // Adjust X position if too far right
        if (uiX + panelWidth > screenWidth - 20) {
            uiX = screenX - panelWidth - 100; // Position to the left instead
        }
        
        // Adjust X position if too far left
        if (uiX < 20) {
            uiX = 20;
        }
        
        // Adjust Y position if too far down
        if (uiY + panelHeight > screenHeight - 20) {
            uiY = screenHeight - panelHeight - 20;
        }
        
        // Adjust Y position if too far up
        if (uiY < 20) {
            uiY = 20;
        }
        
        // Update all panel positions
        this.updatePanelPositions(uiX, uiY);
    }

    updatePanelPositions(baseX, baseY) {
        // Update castle info panel
        this.infoPanelBg.setPosition(baseX, baseY);
        this.castleNameText.setPosition(baseX + 10, baseY + 10);
        this.ownerText.setPosition(baseX + 10, baseY + 35);
        this.positionText.setPosition(baseX + 10, baseY + 55);
        this.defenseText.setPosition(baseX + 10, baseY + 75);
        this.buildingCountText.setPosition(baseX + 10, baseY + 95);
        this.manageBuildingsBtn.setPosition(baseX + 10, baseY + 130);
        this.manageBuildingsBtnText.setPosition(baseX + 70, baseY + 147);
        this.dispatchArmyBtn.setPosition(baseX + 150, baseY + 130);
        this.dispatchArmyBtnText.setPosition(baseX + 210, baseY + 147);
        this.closeBtn.setPosition(baseX + 320, baseY + 10);
        this.closeBtnText.setPosition(baseX + 333, baseY + 22);
        
        // Update resource panel
        this.resourcePanelBg.setPosition(baseX, baseY + 220);
        this.resourceTitleText.setPosition(baseX + 10, baseY + 230);
        this.resourceRatesContainer.setPosition(baseX + 10, baseY + 260);
        
        // Update garrison panel  
        this.garrisonPanelBg.setPosition(baseX, baseY + 360);
        this.garrisonTitleText.setPosition(baseX + 10, baseY + 370);
        this.garrisonInfoText.setPosition(baseX + 10, baseY + 395);
        this.garrisonUnitsContainer.setPosition(baseX + 10, baseY + 420);
        
        // Update dispatched armies panel
        this.dispatchedPanelBg.setPosition(baseX, baseY + 500);
        this.dispatchedTitleText.setPosition(baseX + 10, baseY + 510);
        this.dispatchedInfoText.setPosition(baseX + 10, baseY + 535);
        this.dispatchedArmiesContainer.setPosition(baseX + 10, baseY + 560);
        this.selectArmyBtn.setPosition(baseX + 10, baseY + 600);
        this.selectArmyBtnText.setPosition(baseX + 70, baseY + 615);
        
        // Update building panel position if it exists
        if (this.buildingPanel) {
            this.buildingPanel.updatePosition(baseX + 380, baseY);
        }
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

        // Store dialog elements for cleanup
        this.confirmationElements = [];

        // Background
        const confirmBg = this.scene.add.rectangle(screenCenterX, screenCenterY, 300, 200, 0x2c3e50, 0.95)
            .setStrokeStyle(2, 0x34495e)
            .setScrollFactor(0)
            .setDepth(300)
            .setInteractive(); // Make background interactive to prevent clicks going through

        // Title
        const titleText = this.scene.add.text(screenCenterX, screenCenterY - 70, 'Dispatch Army', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Garrison info
        const unitCount = garrison.getTotalUnitCount ? garrison.getTotalUnitCount() : 0;
        const totalPower = garrison.getCurrentPower ? garrison.getCurrentPower() : 0;
        
        const infoText = this.scene.add.text(screenCenterX, screenCenterY - 30, 
            `Units: ${unitCount}\nTotal Power: ${totalPower}`, {
            font: '12px Arial',
            fill: '#ecf0f1',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Confirm button
        const confirmBtn = this.scene.add.rectangle(screenCenterX - 75, screenCenterY + 40, 100, 35, 0x27ae60)
            .setStrokeStyle(2, 0x229954)
            .setScrollFactor(0)
            .setDepth(301)
            .setInteractive()
            .on('pointerdown', () => {
                this.confirmDispatch(garrison);
            })
            .on('pointerover', () => confirmBtn.setFillStyle(0x229954))
            .on('pointerout', () => confirmBtn.setFillStyle(0x27ae60));

        const confirmBtnText = this.scene.add.text(screenCenterX - 75, screenCenterY + 40, 'Dispatch', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

        // Cancel button
        const cancelBtn = this.scene.add.rectangle(screenCenterX + 75, screenCenterY + 40, 100, 35, 0xe74c3c)
            .setStrokeStyle(2, 0xc0392b)
            .setScrollFactor(0)
            .setDepth(301)
            .setInteractive()
            .on('pointerdown', () => {
                this.cancelDispatch();
            })
            .on('pointerover', () => {
                cancelBtn.setFillStyle(0xc0392b);
            })
            .on('pointerout', () => cancelBtn.setFillStyle(0xe74c3c));

        const cancelBtnText = this.scene.add.text(screenCenterX + 75, screenCenterY + 40, 'Cancel', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

        // Store all elements for cleanup
        this.confirmationElements = [
            confirmBg, titleText, infoText, 
            confirmBtn, confirmBtnText, 
            cancelBtn, cancelBtnText
        ];

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

        // Add to castle's dispatched armies
        this.castle.addDispatchedArmy(garrison);

        // Register army with scene for rendering and interaction
        if (this.scene.registerArmy) {
            this.scene.registerArmy(garrison);
        }

        console.log(`Army dispatched from ${this.castle.name} to position (${castlePos.x + 1}, ${castlePos.y})`);

        // Clean up confirmation dialog
        this.cancelDispatch();

        // Update the castle display
        this.updateDisplay();
    }

    cancelDispatch() {
        // Clean up individual elements
        if (this.confirmationElements) {
            this.confirmationElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.confirmationElements = null;
        }
        
        // Also clean up container if it exists (fallback)
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
        this.updateDispatchedArmiesDisplay();
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

    updateDispatchedArmiesDisplay() {
        const dispatchedArmies = this.castle.getDispatchedArmies();
        
        if (!dispatchedArmies || dispatchedArmies.length === 0) {
            this.dispatchedInfoText.setText('No dispatched armies');
            this.dispatchedArmiesContainer.removeAll(true);
            
            // Disable select button
            this.selectArmyBtn.setFillStyle(0x7f8c8d).setStrokeStyle(2, 0x95a5a6);
            this.selectArmyBtnText.setFill('#bdc3c7');
            return;
        }

        // Update info text
        const totalPower = this.castle.getTotalDispatchedPower();
        const armyCount = dispatchedArmies.length;
        this.dispatchedInfoText.setText(`${armyCount} ${armyCount === 1 ? 'army' : 'armies'}, ${totalPower} total power`);

        // Clear existing army displays
        this.dispatchedArmiesContainer.removeAll(true);

        // Display each dispatched army
        let yOffset = 0;
        dispatchedArmies.forEach((army, index) => {
            if (index < 2) { // Show only first 2 armies to fit in panel
                const unitCount = army.getTotalUnitCount ? army.getTotalUnitCount() : 0;
                const power = army.getCurrentPower ? army.getCurrentPower() : 0;
                const position = army.getPosition ? army.getPosition() : { x: 0, y: 0 };
                
                const armyText = this.scene.add.text(0, yOffset, 
                    `Army ${index + 1}: ${unitCount} units, ${power} power @ (${position.x}, ${position.y})`, {
                    font: '10px Arial',
                    fill: '#ecf0f1'
                });
                
                this.dispatchedArmiesContainer.add(armyText);
                yOffset += 15;
            }
        });

        if (dispatchedArmies.length > 2) {
            const moreText = this.scene.add.text(0, yOffset, 
                `+${dispatchedArmies.length - 2} more armies`, {
                font: '10px Arial',
                fill: '#95a5a6',
                fontStyle: 'italic'
            });
            this.dispatchedArmiesContainer.add(moreText);
        }

        // Enable select button
        this.selectArmyBtn.setFillStyle(0x8e44ad).setStrokeStyle(2, 0x9b59b6);
        this.selectArmyBtnText.setFill('#ffffff');
    }

    selectDispatchedArmy() {
        const dispatchedArmies = this.castle.getDispatchedArmies();
        
        if (!dispatchedArmies || dispatchedArmies.length === 0) {
            // Show message when no armies
            const originalText = this.dispatchedInfoText.text;
            this.dispatchedInfoText.setText('No armies to select').setFill('#e74c3c');
            
            // Reset after 2 seconds
            this.scene.time.delayedCall(2000, () => {
                this.dispatchedInfoText.setText(originalText).setFill('#ecf0f1');
            });
            return;
        }

        // Select the first available army (or show selection dialog if multiple)
        const selectedArmy = dispatchedArmies[0];
        
        if (this.scene.selectArmy) {
            console.log(`Calling scene.selectArmy with army:`, selectedArmy.id);
            this.scene.selectArmy(selectedArmy);
            
            // Close castle overlay
            this.hide();
            
            console.log(`Selected army ${selectedArmy.id} from ${this.castle.name}`);
        } else {
            console.error('scene.selectArmy method not found');
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
        this.cancelDispatch();

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