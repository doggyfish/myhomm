import Phaser from 'phaser';
import { TilemapGenerator } from '../world/TilemapGenerator.js';
import { TilemapRenderer } from '../world/TilemapRenderer.js';
import { CONFIG } from '../config/ConfigurationManager.js';
import { Castle } from '../entities/Castle.js';
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
            'Click castle - Select castle\n' +
            'Click tile - Inspect tile\n' +
            'F - Toggle fog of war\n' +
            '1-8 - Switch player view\n' +
            'SPACE/P/ESC - Pause/Unpause\n' +
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

        // Pause controls - ESC and SPACE bar
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        this.input.keyboard.on('keydown-SPACE', () => this.togglePause());
        this.input.keyboard.on('keydown-P', () => this.togglePause());
        
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
            // Only inspect if not dragging
            if (!this.tilemapRenderer.isDragging) {
                const tile = this.tilemapRenderer.getTileAtScreenPosition(pointer.x, pointer.y);
                this.inspectTile(tile, pointer);
            }
        });
    }

    inspectTile(tile, pointer) {
        if (tile) {
            const tileInfo = 
                `Tile: ${tile.x}, ${tile.y}\n` +
                `Terrain: ${tile.terrain}\n` +
                `Road: ${tile.hasRoad ? 'Yes' : 'No'}\n` +
                `Castle: ${tile.hasCastle ? 'Yes' : 'No'}`;
            
            this.tileInfoText.setText(tileInfo);
            this.tileInfoBg.setVisible(true);
            this.tileInfoText.setVisible(true);
            
            // Hide after 3 seconds
            this.time.delayedCall(3000, () => {
                this.tileInfoBg.setVisible(false);
                this.tileInfoText.setVisible(false);
            });
        }
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
                        this.selectCastle(castleSprite);
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

    selectCastle(castleSprite) {
        // Find the corresponding castle entity
        const castleX = castleSprite.getData('x');
        const castleY = castleSprite.getData('y');
        
        const castle = this.castles.find(c => {
            const pos = c.getPosition();
            return pos.x === castleX && pos.y === castleY;
        });
        
        if (castle) {
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
        if (this.pauseSystem) {
            const newPauseState = this.pauseSystem.toggle('user');
            console.log(`Game ${newPauseState ? 'paused' : 'unpaused'} by user input`);
        }
    }

    /**
     * Handle pause activation
     */
    onPauseActivated(eventData) {
        console.log('Pause activated:', eventData);
        
        // Show pause overlay
        if (this.pauseOverlay) {
            this.pauseOverlay.show(eventData.reason, CONFIG.get('debug.showPauseStats'));
        }

        // Pause Phaser scene physics and tweens
        this.physics?.pause();
        this.tweens.pauseAll();
        this.time.paused = true;

        // Update pause overlay with statistics if enabled
        if (this.pauseOverlay && CONFIG.get('debug.showPauseStats')) {
            this.updatePauseStats();
        }
    }

    /**
     * Handle pause deactivation
     */
    onPauseDeactivated(eventData) {
        console.log('Pause deactivated:', eventData);
        
        // Hide pause overlay
        if (this.pauseOverlay) {
            this.pauseOverlay.hide();
        }

        // Resume Phaser scene physics and tweens
        this.physics?.resume();
        this.tweens.resumeAll();
        this.time.paused = false;
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

        if (this.tilemapRenderer) {
            this.tilemapRenderer.destroy();
        }
        
        if (this.castleOverlay) {
            this.castleOverlay.destroy();
        }
        
        super.destroy();
    }
}