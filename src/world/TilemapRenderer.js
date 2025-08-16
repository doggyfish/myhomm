import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';
import { FogOfWar } from './FogOfWar.js';

export class TilemapRenderer {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.tileset = null;
        this.layers = {};
        this.tileSize = 32;
        this.mapData = null;
        this.fogOfWar = null;
        this.fogLayer = null;
        this.currentPlayer = 0;
        this.fogEnabled = true;
    }

    preload() {
        // Load terrain tileset - using colored rectangles for now
        this.createTerrainTextures();
    }

    createTerrainTextures() {
        const graphics = this.scene.add.graphics();
        
        // Create colored tiles for each terrain type
        const terrainColors = {
            grassland: 0x4a8a3c,
            plains: 0x7cb342,
            mountain: 0x5d4037,
            water: 0x1976d2,
            forest: 0x2e7d32,
            desert: 0xffc107,
            swamp: 0x558b2f,
            snow: 0xe8eaf6,
            lake: 0x42a5f5,
            road: 0x8d6e63
        };

        Object.entries(terrainColors).forEach(([terrain, color]) => {
            graphics.clear();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, this.tileSize, this.tileSize);
            graphics.lineStyle(1, 0x000000, 0.3);
            graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
            
            graphics.generateTexture(`terrain_${terrain}`, this.tileSize, this.tileSize);
        });

        // Create castle texture
        graphics.clear();
        graphics.fillStyle(0x8d6e63);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        graphics.fillStyle(0x5d4037);
        graphics.fillRect(4, 4, this.tileSize - 8, this.tileSize - 8);
        graphics.fillStyle(0xff0000);
        graphics.fillRect(12, 12, 8, 8);
        graphics.generateTexture('castle', this.tileSize, this.tileSize);

        // Create fog textures
        this.createFogTextures(graphics);

        graphics.destroy();
    }

    createFogTextures(graphics) {
        // Create fully fogged tile (black)
        graphics.clear();
        graphics.fillStyle(0x000000, 1.0);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        graphics.generateTexture('fog_full', this.tileSize, this.tileSize);

        // Create partially fogged tile (semi-transparent black)
        graphics.clear();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        graphics.generateTexture('fog_partial', this.tileSize, this.tileSize);

        // Create clear tile (transparent)
        graphics.clear();
        graphics.generateTexture('fog_clear', this.tileSize, this.tileSize);
    }

    createTilemap(mapData) {
        this.mapData = mapData;
        
        // Use sprite-based approach instead of complex tilemap system
        this.createTerrainSprites(mapData);
        
        // Create castle layer
        this.createCastleSprites(mapData.castlePositions);

        // Initialize fog of war
        this.initializeFogOfWar(mapData);

        return null; // No actual Phaser tilemap, using sprites
    }

    createTerrainSprites(mapData) {
        // Create container for terrain sprites
        this.terrainContainer = this.scene.add.container(0, 0);
        this.terrainContainer.setDepth(0); // Bottom layer

        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                const tile = mapData.tiles[y][x];
                const terrainSprite = this.scene.add.image(
                    x * this.tileSize + this.tileSize / 2,
                    y * this.tileSize + this.tileSize / 2,
                    `terrain_${tile.terrain}`
                );
                
                terrainSprite.setOrigin(0.5);
                terrainSprite.setData('tileX', x);
                terrainSprite.setData('tileY', y);
                terrainSprite.setData('terrain', tile.terrain);
                
                this.terrainContainer.add(terrainSprite);
            }
        }
    }

    convertMapDataToTileIndices(mapData) {
        const terrainTypes = Object.keys(TERRAIN_CONFIG);
        const tileData = [];

        for (let y = 0; y < mapData.height; y++) {
            tileData[y] = [];
            for (let x = 0; x < mapData.width; x++) {
                const tile = mapData.tiles[y][x];
                const terrainIndex = terrainTypes.indexOf(tile.terrain);
                tileData[y][x] = terrainIndex >= 0 ? terrainIndex + 1 : 1; // +1 because 0 is empty
            }
        }

        return tileData;
    }


    createCastleSprites(castlePositions) {
        this.castleSprites = this.scene.add.group();

        castlePositions.forEach(castle => {
            const castleSprite = this.scene.add.image(
                castle.x * this.tileSize + this.tileSize / 2,
                castle.y * this.tileSize + this.tileSize / 2,
                'castle'
            );
            
            castleSprite.setOrigin(0.5);
            castleSprite.setDepth(1); // Above terrain
            castleSprite.setData('playerId', castle.playerId);
            castleSprite.setData('x', castle.x);
            castleSprite.setData('y', castle.y);
            
            this.castleSprites.add(castleSprite);
        });
    }

    setupCamera() {
        const camera = this.scene.cameras.main;
        
        if (this.mapData) {
            // Set camera bounds to map size
            const mapWidth = this.mapData.width * this.tileSize;
            const mapHeight = this.mapData.height * this.tileSize;
            
            camera.setBounds(0, 0, mapWidth, mapHeight);
            
            // Center camera on map
            camera.centerOn(mapWidth / 2, mapHeight / 2);
            
            // Set zoom limits
            camera.setZoom(1);
            this.minZoom = 0.25;
            this.maxZoom = 3;
        }

        return camera;
    }

    initializeFogOfWar(mapData) {
        if (!this.fogEnabled) return;

        // Create fog of war system
        this.fogOfWar = new FogOfWar(mapData.width, mapData.height, mapData.castlePositions.length);
        
        // Initialize vision from starting castles
        this.fogOfWar.updateVisionFromCastles(mapData.castlePositions, this.currentPlayer);
        
        // Create fog layer as sprites instead of tilemap for better control
        this.fogLayer = this.scene.add.group();
        this.createFogSprites();
        
        // Update fog rendering
        this.updateFogRendering();
    }

    createFogSprites() {
        if (!this.fogOfWar) return;

        for (let y = 0; y < this.mapData.height; y++) {
            for (let x = 0; x < this.mapData.width; x++) {
                const fogSprite = this.scene.add.image(
                    x * this.tileSize + this.tileSize / 2,
                    y * this.tileSize + this.tileSize / 2,
                    'fog_full'
                );
                
                fogSprite.setOrigin(0.5);
                fogSprite.setDepth(10); // Above terrain and castles
                fogSprite.setData('tileX', x);
                fogSprite.setData('tileY', y);
                
                this.fogLayer.add(fogSprite);
            }
        }
    }

    updateFogRendering() {
        if (!this.fogOfWar || !this.fogLayer || !this.fogEnabled) return;

        this.fogLayer.children.entries.forEach(fogSprite => {
            const x = fogSprite.getData('tileX');
            const y = fogSprite.getData('tileY');
            const visibility = this.fogOfWar.getTileVisibility(x, y, this.currentPlayer);
            
            switch (visibility) {
                case 0: // Unexplored
                    fogSprite.setTexture('fog_full');
                    fogSprite.setVisible(true);
                    break;
                case 1: // Explored but not visible
                    fogSprite.setTexture('fog_partial');
                    fogSprite.setVisible(true);
                    break;
                case 2: // Visible
                    fogSprite.setVisible(false);
                    break;
            }
        });
    }

    setCurrentPlayer(playerId) {
        this.currentPlayer = playerId;
        if (this.fogOfWar) {
            this.fogOfWar.setCurrentPlayer(playerId);
            this.updateFogRendering();
        }
    }

    setFogEnabled(enabled) {
        this.fogEnabled = enabled;
        if (this.fogLayer) {
            this.fogLayer.setVisible(enabled);
        }
    }

    toggleFog() {
        this.setFogEnabled(!this.fogEnabled);
    }

    updateVisionFromCastles() {
        if (this.fogOfWar && this.mapData) {
            this.fogOfWar.updateVisionFromCastles(this.mapData.castlePositions, this.currentPlayer);
            this.updateFogRendering();
        }
    }

    enableCameraControls() {
        const camera = this.scene.cameras.main;
        
        // Mouse/touch drag for panning
        this.scene.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
            this.cameraStartX = camera.scrollX;
            this.cameraStartY = camera.scrollY;
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const deltaX = this.dragStartX - pointer.x;
                const deltaY = this.dragStartY - pointer.y;
                
                camera.setScroll(
                    this.cameraStartX + deltaX / camera.zoom,
                    this.cameraStartY + deltaY / camera.zoom
                );
            }
        });

        this.scene.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Mouse wheel for zooming
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Phaser.Math.Clamp(
                camera.zoom * zoomFactor,
                this.minZoom,
                this.maxZoom
            );
            
            // Zoom towards mouse position
            const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
            camera.zoom = newZoom;
            camera.centerOn(worldPoint.x, worldPoint.y);
        });

        // Keyboard controls
        const cursors = this.scene.input.keyboard.createCursorKeys();
        const wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
        
        this.cursors = cursors;
        this.wasd = wasd;
    }

    update() {
        // Handle keyboard camera movement
        if (this.cursors || this.wasd) {
            const camera = this.scene.cameras.main;
            const speed = 300 / camera.zoom; // Adjust speed based on zoom
            
            if (this.cursors.left.isDown || this.wasd.A.isDown) {
                camera.scrollX -= speed * this.scene.game.loop.delta / 1000;
            }
            if (this.cursors.right.isDown || this.wasd.D.isDown) {
                camera.scrollX += speed * this.scene.game.loop.delta / 1000;
            }
            if (this.cursors.up.isDown || this.wasd.W.isDown) {
                camera.scrollY -= speed * this.scene.game.loop.delta / 1000;
            }
            if (this.cursors.down.isDown || this.wasd.S.isDown) {
                camera.scrollY += speed * this.scene.game.loop.delta / 1000;
            }
        }
    }

    getTileAtWorldPosition(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        
        if (this.mapData && 
            tileX >= 0 && tileX < this.mapData.width &&
            tileY >= 0 && tileY < this.mapData.height) {
            return this.mapData.tiles[tileY][tileX];
        }
        
        return null;
    }

    getTileAtScreenPosition(screenX, screenY) {
        const camera = this.scene.cameras.main;
        const worldPoint = camera.getWorldPoint(screenX, screenY);
        return this.getTileAtWorldPosition(worldPoint.x, worldPoint.y);
    }

    worldToTileCoords(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }

    tileToWorldCoords(tileX, tileY) {
        return {
            x: tileX * this.tileSize + this.tileSize / 2,
            y: tileY * this.tileSize + this.tileSize / 2
        };
    }

    centerCameraOnTile(tileX, tileY) {
        const camera = this.scene.cameras.main;
        const worldCoords = this.tileToWorldCoords(tileX, tileY);
        camera.centerOn(worldCoords.x, worldCoords.y);
    }

    destroy() {
        if (this.terrainContainer) {
            this.terrainContainer.destroy(true);
        }
        if (this.castleSprites) {
            this.castleSprites.destroy(true);
        }
        if (this.fogLayer) {
            this.fogLayer.destroy(true);
        }
    }
}