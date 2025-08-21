import Phaser from 'phaser';
import { TilemapGenerator } from '../world/TilemapGenerator.js';
import { TilemapRenderer } from '../world/TilemapRenderer.js';
import { CONFIG } from '../config/ConfigurationManager.js';
import { Castle } from '../entities/Castle.js';
import { Army } from '../entities/Army.js';
import { Player } from '../game/Player.js';
import { CastleOverlay } from '../ui/CastleOverlay.js';
import { PauseSystem } from '../systems/PauseSystem.js';
import { PauseOverlay } from '../ui/PauseOverlay.js';
import { PauseEvents } from '../events/PauseEvents.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Get game configuration
        const mapSize = CONFIG.get('game.mapSize') || 64;
        const playerCount = CONFIG.get('game.playerCount') || 2;

        // Initialize players
        this.initializePlayers(playerCount);

        // Generate map
        this.mapGenerator = new TilemapGenerator(mapSize, mapSize, playerCount);
        this.mapData = this.mapGenerator.generate();

        // Initialize army management
        this.armies = [];
        this.selectedArmy = null;
        
        // Click handling for castle/army interaction
        this.clickTimer = null;
        this.clickCount = 0;
        this.lastClickedCastle = null;

        // Create castles from map data
        this.createCastles();

        // Create tilemap renderer
        this.tilemapRenderer = new TilemapRenderer(this);
        this.tilemapRenderer.preload();
        this.tilemapRenderer.createTilemap(this.mapData);
        this.tilemapRenderer.setupCamera();
        this.tilemapRenderer.enableCameraControls();

        // Create castle overlay UI
        this.castleOverlay = new CastleOverlay(this);

        // Add UI overlay
        this.createUI();

        // Initialize pause system
        this.initializePauseSystem();

        // Add tile inspection
        this.enableTileInspection();
        
        // Add castle selection
        this.enableCastleSelection();

        // Create army sprites container
        this.createArmySprites();
    }

    createUI() {
        // Create UI container
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Map info panel
        const mapInfoBg = this.add.rectangle(10, 10, 200, 80, 0x000000, 0.7)
            .setOrigin(0, 0);
        
        this.mapInfoText = this.add.text(20, 20, '', {
            font: '12px Arial',
            fill: '#ffffff'
        });

        this.uiContainer.add([mapInfoBg, this.mapInfoText]);

        // Controls info
        const controlsBg = this.add.rectangle(10, 100, 300, 150, 0x000000, 0.7)
            .setOrigin(0, 0);
        
        const controlsText = this.add.text(20, 110, 
            'Controls:\n' +
            'WASD / Arrow Keys - Move camera\n' +
            'Mouse Drag - Pan camera\n' +
            'Mouse Wheel - Zoom in/out\n' +
            'Single-click castle/army - Select army\n' +
            'Click selected army - Deselect army\n' +
            'Double-click castle/army - Open castle\n' +
            'Click anything (army selected) - Move army\n' +
            'F - Toggle fog of war\n' +
            '1-8 - Switch player view\n' +
            'SPACE - Center on most powerful castle\n' +
            'D - Deselect army\n' +
            'P/ESC - Pause/Unpause\n' +
            'Shift+ESC - Back to menu',
            {
                font: '12px Arial',
                fill: '#ffffff'
            }
        );

        this.uiContainer.add([controlsBg, controlsText]);

        // Tile info panel (initially hidden)
        this.tileInfoBg = this.add.rectangle(this.cameras.main.width - 10, 10, 200, 100, 0x000000, 0.7)
            .setOrigin(1, 0)
            .setVisible(false);
        
        this.tileInfoText = this.add.text(this.cameras.main.width - 20, 20, '', {
            font: '12px Arial',
            fill: '#ffffff'
        }).setOrigin(1, 0).setVisible(false);

        this.uiContainer.add([this.tileInfoBg, this.tileInfoText]);

        // Update map info
        this.updateMapInfo();

        // Back button
        const backButton = this.add.rectangle(this.cameras.main.width - 10, this.cameras.main.height - 10, 100, 40, 0x2c3e50)
            .setOrigin(1, 1)
            .setStrokeStyle(2, 0x34495e)
            .setInteractive()
            .on('pointerdown', () => this.goBack())
            .on('pointerover', () => backButton.setFillStyle(0x34495e))
            .on('pointerout', () => backButton.setFillStyle(0x2c3e50));

        const backText = this.add.text(this.cameras.main.width - 60, this.cameras.main.height - 30, 'Back', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.uiContainer.add([backButton, backText]);

        // Pause controls - ESC and P key
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        this.input.keyboard.on('keydown-P', () => this.togglePause());
        
        // SPACE key to center on most powerful castle
        this.input.keyboard.on('keydown-SPACE', () => this.centerOnMostPowerfulCastle());
        
        // Back to menu (Shift+ESC)
        this.input.keyboard.createCombo([Phaser.Input.Keyboard.KeyCodes.SHIFT, Phaser.Input.Keyboard.KeyCodes.ESC], {
            resetOnMatch: true,
            maxKeyDelay: 0,
            resetOnWrongKey: false
        });
        this.input.keyboard.on('keycombomatch', () => this.goBack());
        
        // Fog controls
        this.input.keyboard.on('keydown-F', () => this.toggleFog());
        
        // Player switching
        for (let i = 1; i <= 8; i++) {
            this.input.keyboard.on(`keydown-${i}`, () => this.switchPlayer(i - 1));
        }
        
        // Army deselection
        this.input.keyboard.on('keydown-D', () => this.deselectArmy());
        
    }

    updateMapInfo() {
        const camera = this.cameras.main;
        const mapInfo = 
            `Map: ${this.mapData.width}x${this.mapData.height}\n` +
            `Players: ${this.mapData.castlePositions.length}\n` +
            `Zoom: ${camera.zoom.toFixed(2)}x\n` +
            `Pos: ${Math.floor(camera.scrollX)}, ${Math.floor(camera.scrollY)}`;
        
        this.mapInfoText.setText(mapInfo);
    }

    enableTileInspection() {
        this.input.on('pointerdown', (pointer) => {
            console.log(`Pointer down at screen (${pointer.x}, ${pointer.y}), isDragging: ${this.tilemapRenderer.isDragging}`);
            
            // If army is selected, allow movement even if dragging
            if (this.selectedArmy) {
                console.log('Army selected, processing click for movement');
                const tile = this.tilemapRenderer.getTileAtScreenPosition(pointer.x, pointer.y);
                console.log('Tile detected for movement:', tile);
                this.handleTileClick(tile, pointer);
                return;
            }
            
            // Only inspect if not dragging (for normal tile inspection)
            if (!this.tilemapRenderer.isDragging) {
                const tile = this.tilemapRenderer.getTileAtScreenPosition(pointer.x, pointer.y);
                console.log('Tile detected for inspection:', tile);
                this.handleTileClick(tile, pointer);
            }
        });
    }

    handleTileClick(tile, pointer) {
        // Try alternative tile calculation if primary method fails
        if (!tile) {
            console.log('No tile detected, trying alternative calculation');
            tile = this.screenToTileCoordinates(pointer.x, pointer.y);
            console.log('Alternative tile calculation:', tile);
        }

        if (!tile) {
            console.log('No tile detected at click position');
            return;
        }

        console.log(`Tile clicked: (${tile.x}, ${tile.y}), Selected army:`, this.selectedArmy?.id);

        // If army is selected, try to move it
        if (this.selectedArmy) {
            console.log(`Attempting to move army ${this.selectedArmy.id} to (${tile.x}, ${tile.y})`);
            const moved = this.moveSelectedArmy(tile.x, tile.y);
            if (moved) {
                // Show movement feedback
                this.showTileInfo(tile, `Army moved to (${tile.x}, ${tile.y})`);
                return;
            }
        }

        // Otherwise, inspect the tile
        this.inspectTile(tile, pointer);
    }

    screenToTileCoordinates(screenX, screenY) {
        const camera = this.cameras.main;
        
        // Convert screen coordinates to world coordinates
        const worldX = screenX / camera.zoom + camera.scrollX;
        const worldY = screenY / camera.zoom + camera.scrollY;
        
        // Convert world coordinates to tile coordinates
        const tileSize = 32;
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        
        // Check bounds
        const mapSize = this.mapData ? this.mapData.width : 64;
        if (tileX >= 0 && tileY >= 0 && tileX < mapSize && tileY < mapSize) {
            return { x: tileX, y: tileY, terrain: 'unknown' };
        }
        
        return null;
    }

    inspectTile(tile, pointer) {
        if (tile) {
            const tileInfo = 
                `Tile: ${tile.x}, ${tile.y}\n` +
                `Terrain: ${tile.terrain}\n` +
                `Road: ${tile.hasRoad ? 'Yes' : 'No'}\n` +
                `Castle: ${tile.hasCastle ? 'Yes' : 'No'}`;
            
            this.showTileInfo(tile, tileInfo);
        }
    }

    showTileInfo(tile, text) {
        this.tileInfoText.setText(text);
        this.tileInfoBg.setVisible(true);
        this.tileInfoText.setVisible(true);
        
        // Hide after 3 seconds
        this.time.delayedCall(3000, () => {
            this.tileInfoBg.setVisible(false);
            this.tileInfoText.setVisible(false);
        });
    }

    initializePlayers(playerCount) {
        this.players = [];
        
        for (let i = 0; i < playerCount; i++) {
            const faction = i % 2 === 0 ? 'human' : 'orc';
            const isAI = i > 0; // Player 0 is human, others are AI
            const player = new Player(`player${i}`, `Player ${i + 1}`, faction, isAI);
            
            // Give starting resources
            const resourceManager = player.resourceManager;
            resourceManager.setResource('gold', 2000);
            resourceManager.setResource('wood', 500);
            resourceManager.setResource('stone', 300);
            
            this.players.push(player);
        }
    }

    createCastles() {
        this.castles = [];
        
        this.mapData.castlePositions.forEach((castlePos, index) => {
            if (index < this.players.length) {
                const player = this.players[index];
                const castle = Castle.createCapital(
                    `castle_${index}`,
                    castlePos.x,
                    castlePos.y,
                    player
                );
                
                // Create initial garrison army for testing
                if (index === 0) { // Only for player castle
                    const garrison = new Army(`garrison_${index}`, player);
                    
                    // Add some test units
                    garrison.addUnits('warrior', 10);
                    garrison.addUnits('archer', 5);
                    
                    castle.setGarrisonArmy(garrison);
                }
                
                // Initialize fog of war around castle
                if (this.tilemapRenderer && this.tilemapRenderer.fogOfWar) {
                    this.tilemapRenderer.fogOfWar.updateVisionFromCastles([castlePos], index);
                }
                
                this.castles.push(castle);
            }
        });
    }

    enableCastleSelection() {
        // Make castle sprites interactive
        if (this.tilemapRenderer && this.tilemapRenderer.castleSprites) {
            this.tilemapRenderer.castleSprites.children.entries.forEach(castleSprite => {
                castleSprite.setInteractive()
                    .on('pointerdown', (pointer, localX, localY, event) => {
                        // Stop event from propagating to tile inspection
                        event.stopPropagation();
                        this.handleCastleClick(castleSprite);
                    })
                    .on('pointerover', () => {
                        if (!this.castleOverlay.selectedCastleSprite || 
                            this.castleOverlay.selectedCastleSprite !== castleSprite) {
                            castleSprite.setTint(0xffff00); // Yellow highlight on hover
                        }
                    })
                    .on('pointerout', () => {
                        if (!this.castleOverlay.selectedCastleSprite || 
                            this.castleOverlay.selectedCastleSprite !== castleSprite) {
                            castleSprite.clearTint();
                        }
                    });
            });
        }
    }

    handleCastleClick(castleSprite) {
        // Find the corresponding castle entity
        const castleX = castleSprite.getData('x');
        const castleY = castleSprite.getData('y');
        
        const castle = this.castles.find(c => {
            const pos = c.getPosition();
            return pos.x === castleX && pos.y === castleY;
        });
        
        if (!castle) return;

        // If an army is selected, move it to this castle instead of doing selection logic
        if (this.selectedArmy) {
            console.log('Army selected, moving to castle instead of castle interaction');
            const castlePos = castle.getPosition();
            this.moveSelectedArmy(castlePos.x, castlePos.y);
            return;
        }

        // No army selected, proceed with normal castle click logic
        // Check for dispatched armies at this castle position
        const dispatchedArmies = castle.getDispatchedArmies();
        const armyAtPosition = dispatchedArmies.find(army => {
            const armyPos = army.getPosition();
            const castlePos = castle.getPosition();
            return armyPos.x === castlePos.x && armyPos.y === castlePos.y;
        });

        // Handle click timing for single vs double click
        this.clickCount++;
        
        if (this.clickTimer) {
            // This is a second click within the timeout period
            this.time.removeEvent(this.clickTimer);
            this.clickTimer = null;
            this.handleDoubleClick(castle, armyAtPosition, castleSprite);
            this.clickCount = 0;
        } else {
            // This is the first click, start timer
            this.clickTimer = this.time.delayedCall(300, () => {
                // Single click timeout - handle single click
                this.handleSingleClick(castle, armyAtPosition);
                this.clickTimer = null;
                this.clickCount = 0;
            });
        }

        this.lastClickedCastle = castle;
    }

    handleSingleClick(castle, armyAtPosition) {
        console.log('Single click on castle/army position');
        
        if (armyAtPosition) {
            // Select the army at this position
            this.selectArmy(armyAtPosition);
            console.log(`Selected army ${armyAtPosition.id} at castle ${castle.name}`);
        } else {
            // No army at position, deselect any selected army
            this.deselectArmy();
            console.log(`No army to select at castle ${castle.name}`);
        }
    }

    handleDoubleClick(castle, armyAtPosition, castleSprite) {
        console.log('Double click on castle/army position');
        
        // Always open castle view on double click
        this.selectCastle(castle, castleSprite);
        console.log(`Opened castle view for ${castle.name}`);
    }

    selectCastle(castle, castleSprite) {
        // If no sprite provided, find it
        if (!castleSprite) {
            castleSprite = this.tilemapRenderer.castleSprites.children.entries.find(sprite => {
                const spriteX = sprite.getData('x');
                const spriteY = sprite.getData('y');
                const castlePos = castle.getPosition();
                return spriteX === castlePos.x && spriteY === castlePos.y;
            });
        }
        
        if (castleSprite) {
            this.castleOverlay.show(castle, castleSprite);
        }
    }

    update() {
        if (this.tilemapRenderer) {
            this.tilemapRenderer.update();
        }
        
        // Update castles
        if (this.castles) {
            const deltaTime = this.game.loop.delta;
            this.castles.forEach(castle => {
                castle.update(deltaTime);
            });
        }
        
        // Update armies
        if (this.armies) {
            const deltaTime = this.game.loop.delta;
            this.armies.forEach(army => {
                if (army.update) {
                    army.update(deltaTime);
                }
            });
        }
        
        // Update castle overlay
        if (this.castleOverlay) {
            this.castleOverlay.update(this.game.loop.delta);
        }
        
        // Update UI info periodically
        if (this.time.now % 100 < 50) { // Approximate every 100ms
            this.updateMapInfo();
        }
    }

    toggleFog() {
        if (this.tilemapRenderer) {
            this.tilemapRenderer.toggleFog();
        }
    }

    switchPlayer(playerId) {
        if (this.tilemapRenderer && playerId < this.mapData.castlePositions.length) {
            this.tilemapRenderer.setCurrentPlayer(playerId);
        }
    }

    goBack() {
        this.scene.start('MainMenuScene');
    }

    centerOnMostPowerfulCastle() {
        if (!this.castles || this.castles.length === 0) return;

        // Find the most powerful castle (by total defense power)
        let mostPowerfulCastle = this.castles[0];
        let maxPower = mostPowerfulCastle.getTotalDefensePower();

        this.castles.forEach(castle => {
            const power = castle.getTotalDefensePower();
            if (power > maxPower) {
                maxPower = power;
                mostPowerfulCastle = castle;
            }
        });

        // Center camera on the most powerful castle
        const castlePos = mostPowerfulCastle.getPosition();
        if (this.tilemapRenderer) {
            this.tilemapRenderer.centerCameraOnTile(castlePos.x, castlePos.y);
        }

        console.log(`Centered on ${mostPowerfulCastle.name} at (${castlePos.x}, ${castlePos.y}) with ${maxPower} power`);
    }

    // Army Management Methods

    createArmySprites() {
        // Create container for army sprites
        this.armySprites = this.add.group();
    }

    registerArmy(army) {
        console.log(`Registering army:`, army.id);
        if (!this.armies.includes(army)) {
            this.armies.push(army);
            this.createArmySprite(army);
            console.log(`Army ${army.id} registered and sprite created`);
        } else {
            console.log(`Army ${army.id} already registered`);
        }
    }

    createArmySprite(army) {
        const position = army.getPosition();
        const tileSize = 32;
        
        console.log(`Creating army sprite for ${army.id} at position:`, position);
        
        // Create army sprite centered on tile (same as castle)
        const armySprite = this.add.circle(
            position.x * tileSize + tileSize / 2,
            position.y * tileSize + tileSize / 2,
            8, // smaller radius so it's visible over castle
            0xff6b6b // red color
        );
        
        armySprite.setStrokeStyle(2, 0x000000);
        armySprite.setData('army', army);
        armySprite.setInteractive();
        armySprite.setDepth(100); // Ensure army sprites are above castles and terrain
        
        // Store sprite reference in army
        army.sprite = armySprite;
        
        // Add to army sprites group
        this.armySprites.add(armySprite);
        
        console.log(`Army sprite created at screen position: (${armySprite.x}, ${armySprite.y})`);
        
        // Make army clickable
        armySprite.on('pointerdown', (pointer, localX, localY, event) => {
            // Stop event from propagating to tile handling
            event.stopPropagation();
            console.log(`Army sprite clicked: ${army.id}`);
            
            // If this army is already selected, deselect it
            if (this.selectedArmy === army) {
                this.deselectArmy();
            } else {
                this.selectArmy(army);
            }
        });
        
        armySprite.on('pointerover', () => {
            if (this.selectedArmy !== army) {
                armySprite.setFillStyle(0xff9999); // Lighter red on hover
            }
        });
        
        armySprite.on('pointerout', () => {
            if (this.selectedArmy !== army) {
                armySprite.setFillStyle(0xff6b6b); // Original red
            }
        });
    }

    selectArmy(army) {
        console.log(`selectArmy called with:`, army?.id);
        
        // Deselect previous army
        if (this.selectedArmy && this.selectedArmy.sprite) {
            this.selectedArmy.sprite.setFillStyle(0xff6b6b);
            this.selectedArmy.sprite.setStrokeStyle(2, 0x000000);
        }
        
        // Select new army
        this.selectedArmy = army;
        if (army && army.sprite) {
            army.sprite.setFillStyle(0xffff00); // Yellow when selected
            army.sprite.setStrokeStyle(3, 0x00ff00); // Green border when selected
            console.log(`Army ${army.id} visually selected`);
        } else {
            console.warn(`Army ${army?.id} has no sprite`);
        }
        
        console.log(`Army ${army.id} selected, this.selectedArmy is now:`, this.selectedArmy?.id);
    }

    moveSelectedArmy(targetX, targetY) {
        if (!this.selectedArmy) {
            console.log('No selected army to move');
            return false;
        }
        
        console.log(`Moving army ${this.selectedArmy.id} from current position to (${targetX}, ${targetY})`);
        
        // Check if target position has a castle
        const targetCastle = this.castles.find(castle => {
            const pos = castle.getPosition();
            return pos.x === targetX && pos.y === targetY;
        });

        if (targetCastle) {
            // Army is moving into a castle
            const success = this.moveArmyIntoCastle(this.selectedArmy, targetCastle);
            if (success) {
                this.showTileInfo({ x: targetX, y: targetY }, `Army entered ${targetCastle.name}`);
            }
            return success;
        } else {
            // Normal movement to empty tile
            const success = this.moveArmyToPosition(targetX, targetY);
            if (success) {
                this.showTileInfo({ x: targetX, y: targetY }, `Army moved to (${targetX}, ${targetY})`);
            }
            return success;
        }
    }

    moveArmyIntoCastle(army, castle) {
        console.log(`Army ${army.id} entering castle ${castle.name}`);

        // Check if castle belongs to same owner
        if (army.owner !== castle.owner) {
            console.log(`Army cannot enter enemy castle`);
            // TODO: Implement siege/attack mechanics here
            return false;
        }

        // Check if castle already has a garrison
        if (castle.hasGarrison()) {
            // Merge with existing garrison
            const existingGarrison = castle.getGarrisonArmy();
            console.log(`Merging army ${army.id} with existing garrison ${existingGarrison.id}`);
            
            if (existingGarrison.mergeArmy(army)) {
                // Successfully merged - remove the moving army
                this.removeArmy(army);
                
                // Update castle overlay if it's showing this castle
                if (this.castleOverlay && this.castleOverlay.castle === castle) {
                    this.castleOverlay.updateDisplay();
                }
                
                console.log(`Army ${army.id} merged into garrison`);
                return true;
            } else {
                console.log(`Failed to merge armies`);
                return false;
            }
        } else {
            // Castle has no garrison - army becomes the garrison
            console.log(`Army ${army.id} becoming garrison of ${castle.name}`);
            
            // Remove army from dispatched armies list of origin castle
            if (army.originCastle) {
                army.originCastle.removeDispatchedArmy(army);
            }

            // Convert army to garrison
            army.isGarrison = true;
            army.location = castle;
            castle.setGarrisonArmy(army);

            // Remove army sprite and remove from scene armies
            this.removeArmy(army);
            
            // Update castle overlay if it's showing this castle
            if (this.castleOverlay && this.castleOverlay.castle === castle) {
                this.castleOverlay.updateDisplay();
            }
            
            console.log(`Army ${army.id} is now garrison of ${castle.name}`);
            return true;
        }
    }

    moveArmyToPosition(targetX, targetY) {
        // Move army to target position
        this.selectedArmy.setPosition(targetX, targetY);
        
        // Update sprite position
        if (this.selectedArmy.sprite) {
            const tileSize = 32;
            const newSpriteX = targetX * tileSize + tileSize / 2;
            const newSpriteY = targetY * tileSize + tileSize / 2;
            
            console.log(`Moving sprite from (${this.selectedArmy.sprite.x}, ${this.selectedArmy.sprite.y}) to (${newSpriteX}, ${newSpriteY})`);
            
            this.selectedArmy.sprite.setPosition(newSpriteX, newSpriteY);
        } else {
            console.warn(`Army ${this.selectedArmy.id} has no sprite to move`);
        }
        
        console.log(`Army ${this.selectedArmy.id} moved to (${targetX}, ${targetY})`);
        return true;
    }

    removeArmy(army) {
        // Remove from armies array
        const index = this.armies.indexOf(army);
        if (index >= 0) {
            this.armies.splice(index, 1);
        }

        // Remove sprite
        if (army.sprite) {
            army.sprite.destroy();
            army.sprite = null;
        }

        // Deselect if this was the selected army
        if (this.selectedArmy === army) {
            this.selectedArmy = null;
        }

        console.log(`Army ${army.id} removed from scene`);
    }

    deselectArmy() {
        if (this.selectedArmy && this.selectedArmy.sprite) {
            this.selectedArmy.sprite.setFillStyle(0xff6b6b);
            this.selectedArmy.sprite.setStrokeStyle(2, 0x000000);
        }
        this.selectedArmy = null;
        console.log('Army deselected');
    }


    // Pause System Methods

    /**
     * Initialize the comprehensive pause system
     */
    initializePauseSystem() {
        // Create pause system instance
        this.pauseSystem = new PauseSystem();
        
        // Create pause overlay
        this.pauseOverlay = new PauseOverlay(this);
        
        // Set up pause event listeners
        this.pauseSystem.on(PauseEvents.PAUSE_ACTIVATED, (eventData) => {
            this.onPauseActivated(eventData);
        });
        
        this.pauseSystem.on(PauseEvents.PAUSE_DEACTIVATED, (eventData) => {
            this.onPauseDeactivated(eventData);
        });
        
        this.pauseSystem.on(PauseEvents.PAUSE_ERROR, (eventData) => {
            console.error('Pause system error:', eventData);
        });

        // Register systems that need pause coordination
        // Note: These would be registered when systems are created
        // For now, we'll register them when they're available
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        try {
            if (this.pauseSystem) {
                const wasPaused = this.pauseSystem.isPaused();
                const result = this.pauseSystem.toggle('user');
                console.log(`Pause toggle: was ${wasPaused}, now ${this.pauseSystem.isPaused()}, result: ${result}`);
            } else {
                console.warn('Pause system not initialized');
            }
        } catch (error) {
            console.error('Error in togglePause:', error);
        }
    }

    /**
     * Handle pause activation
     */
    onPauseActivated(eventData) {
        try {
            console.log('Pause activated:', eventData);
            
            // Show pause overlay
            if (this.pauseOverlay) {
                this.pauseOverlay.show(eventData.reason, CONFIG.get('debug.showPauseStats'));
            }

            // Pause Phaser scene physics and tweens
            if (this.physics) {
                this.physics.pause();
            }
            this.tweens.pauseAll();
            this.time.paused = true;

            // Update pause overlay with statistics if enabled
            if (this.pauseOverlay && CONFIG.get('debug.showPauseStats')) {
                this.updatePauseStats();
            }
        } catch (error) {
            console.error('Error in onPauseActivated:', error);
        }
    }

    /**
     * Handle pause deactivation
     */
    onPauseDeactivated(eventData) {
        try {
            console.log('Pause deactivated:', eventData);
            
            // Hide pause overlay
            if (this.pauseOverlay) {
                this.pauseOverlay.hide();
            }

            // Resume Phaser scene physics and tweens
            if (this.physics) {
                this.physics.resume();
            }
            this.tweens.resumeAll();
            this.time.paused = false;
        } catch (error) {
            console.error('Error in onPauseDeactivated:', error);
        }
    }

    /**
     * Update pause statistics display
     */
    updatePauseStats() {
        if (this.pauseSystem && this.pauseOverlay) {
            const stats = this.pauseSystem.getStats();
            this.pauseOverlay.updateStats(stats);
        }
    }

    /**
     * Register a system with the pause system
     */
    registerPausableSystem(system, systemId) {
        if (this.pauseSystem && system) {
            this.pauseSystem.registerPausableSystem(system, systemId);
        }
    }

    destroy() {
        // Destroy pause system
        if (this.pauseSystem) {
            this.pauseSystem.destroy();
        }
        
        // Destroy pause overlay
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
        }

        // Destroy army sprites
        if (this.armySprites) {
            this.armySprites.destroy(true);
        }

        if (this.tilemapRenderer) {
            this.tilemapRenderer.destroy();
        }
        
        if (this.castleOverlay) {
            this.castleOverlay.destroy();
        }
        
        super.destroy();
    }
}