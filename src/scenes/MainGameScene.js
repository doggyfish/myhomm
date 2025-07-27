/**
 * Main Game Scene for MyHoMM Phaser 3 Version
 * Handles the primary gameplay, camera controls, and entity management
 */

class MainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGameScene' });
        
        // Scene state
        this.gameState = 'running';
        this.debugMode = false;
        
        // Map properties
        this.mapWidth = MyHoMMConfig.map.defaultWidth;
        this.mapHeight = MyHoMMConfig.map.defaultHeight;
        this.tileSize = MyHoMMConfig.map.tileSize;
        
        // Game entities
        this.castles = [];
        this.armies = [];
        this.players = [];
        
        // Systems
        this.gameManager = null;
        this.combatSystem = null;
        this.productionSystem = null;
        this.aiSystem = null;
        
        // UI elements
        this.gridGraphics = null;
        this.debugGraphics = null;
        
        // Input state
        this.keys = null;
        this.pointer = null;
        this.selectedEntity = null;
    }
    
    preload() {
        console.log('🎮 MainGameScene: Preloading assets...');
        
        // Create simple colored rectangles for entities (placeholder graphics)
        this.load.image('castle_human', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('castle_ai', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('army', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        
        console.log('✅ MainGameScene: Assets preloaded');
    }
    
    create() {
        console.log('🎮 MainGameScene: Creating game world...');
        
        // Set up camera bounds
        const worldWidth = this.mapWidth * this.tileSize;
        const worldHeight = this.mapHeight * this.tileSize;
        
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setZoom(MyHoMMConfig.camera.zoomDefault);
        
        // Create world graphics
        this.createGrid();
        this.createDebugGraphics();
        
        // Initialize game systems
        this.initializeGameSystems();
        
        // Set up input controls
        this.setupInputControls();
        
        // Initialize players and entities
        this.initializePlayers();
        this.initializeStartingEntities();
        
        // Start production system
        this.startProductionSystem();
        
        console.log('✅ MainGameScene: Game world created');
        
        // Hide loading indicator
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    createGrid() {
        this.gridGraphics = this.add.graphics();
        this.redrawGrid();
    }
    
    redrawGrid() {
        if (!this.gridGraphics) return;
        
        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(1, 0x444444, 0.5);
        
        // Draw vertical lines
        for (let x = 0; x <= this.mapWidth; x++) {
            const posX = x * this.tileSize;
            this.gridGraphics.moveTo(posX, 0);
            this.gridGraphics.lineTo(posX, this.mapHeight * this.tileSize);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.mapHeight; y++) {
            const posY = y * this.tileSize;
            this.gridGraphics.moveTo(0, posY);
            this.gridGraphics.lineTo(this.mapWidth * this.tileSize, posY);
        }
        
        this.gridGraphics.strokePath();
    }
    
    createDebugGraphics() {
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setVisible(this.debugMode);
    }
    
    initializeGameSystems() {
        // Initialize game manager
        this.gameManager = new GameManager(this);
        
        // Initialize combat system
        this.combatSystem = new CombatSystem(this);
        
        // Initialize production system
        this.productionSystem = new ProductionSystem(this);
        
        // Initialize AI system
        this.aiSystem = new AISystem(this);
        
        console.log('✅ Game systems initialized');
    }
    
    setupInputControls() {
        // Keyboard controls
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            PLUS: Phaser.Input.Keyboard.KeyCodes.PLUS,
            MINUS: Phaser.Input.Keyboard.KeyCodes.MINUS,
            H: Phaser.Input.Keyboard.KeyCodes.H,
            F: Phaser.Input.Keyboard.KeyCodes.F,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });
        
        // Mouse/touch controls
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
        this.input.on('wheel', this.onMouseWheel, this);
        
        console.log('✅ Input controls set up');
    }
    
    initializePlayers() {
        // Create human player
        this.players.push(new Player({
            id: 'human',
            name: MyHoMMConfig.players.human.name,
            color: MyHoMMConfig.players.human.color,
            isHuman: true
        }));
        
        // Create AI player
        this.players.push(new Player({
            id: 'ai',
            name: MyHoMMConfig.players.ai.name,
            color: MyHoMMConfig.players.ai.color,
            isHuman: false
        }));
        
        console.log('✅ Players initialized');
    }
    
    initializeStartingEntities() {
        // Create starting castles
        this.createCastle(2, 2, this.players[0]); // Human castle
        this.createCastle(this.mapWidth - 3, this.mapHeight - 3, this.players[1]); // AI castle
        
        console.log('✅ Starting entities created');
    }
    
    createCastle(gridX, gridY, owner) {
        const castle = new Castle({
            scene: this,
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2,
            gridX: gridX,
            gridY: gridY,
            owner: owner
        });
        
        this.castles.push(castle);
        return castle;
    }
    
    createArmy(gridX, gridY, owner, unitCount = 1) {
        const army = new Army({
            scene: this,
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2,
            gridX: gridX,
            gridY: gridY,
            owner: owner,
            unitCount: unitCount
        });
        
        this.armies.push(army);
        return army;
    }
    
    startProductionSystem() {
        this.time.addEvent({
            delay: MyHoMMConfig.units.productionInterval,
            callback: () => {
                this.productionSystem.updateProduction();
            },
            loop: true
        });
    }
    
    // Input handlers
    onPointerDown(pointer) {
        if (pointer.rightButtonDown()) {
            // Right click for camera panning
            this.cameras.main.startFollow(null);
            return;
        }
        
        // Left click for entity interaction
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const gridX = Math.floor(worldPoint.x / this.tileSize);
        const gridY = Math.floor(worldPoint.y / this.tileSize);
        
        this.onTileClicked(gridX, gridY);
    }
    
    onPointerMove(pointer) {
        // Camera panning will be handled by keyboard controls for now
        // Right-click panning can be added later when needed
    }
    
    onPointerUp(pointer) {
        // Handle pointer up events
    }
    
    onMouseWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Phaser.Math.Clamp(
            this.cameras.main.zoom * zoomFactor,
            MyHoMMConfig.camera.zoomMin,
            MyHoMMConfig.camera.zoomMax
        );
        
        this.cameras.main.setZoom(newZoom);
    }
    
    onTileClicked(gridX, gridY) {
        console.log(`Tile clicked: ${gridX}, ${gridY}`);
        
        // Check for entities at this position
        const castle = this.castles.find(c => c.gridX === gridX && c.gridY === gridY);
        const army = this.armies.find(a => a.gridX === gridX && a.gridY === gridY);
        
        if (castle) {
            this.selectEntity(castle);
        } else if (army) {
            this.selectEntity(army);
        } else if (this.selectedEntity && this.selectedEntity.type === 'castle') {
            // Create army from selected castle
            this.createArmyFromCastle(this.selectedEntity, gridX, gridY);
        } else if (this.selectedEntity && this.selectedEntity.type === 'army') {
            // Move selected army
            this.selectedEntity.moveToGrid(gridX, gridY);
            this.selectEntity(null);
        } else {
            this.selectEntity(null);
        }
    }
    
    selectEntity(entity) {
        // Deselect previous entity
        if (this.selectedEntity) {
            this.selectedEntity.setSelected(false);
        }
        
        this.selectedEntity = entity;
        
        if (entity) {
            entity.setSelected(true);
            console.log(`Selected ${entity.type}:`, entity);
        }
    }
    
    createArmyFromCastle(castle, targetGridX, targetGridY) {
        if (castle.unitCount <= 1) {
            console.log('Castle needs at least 2 units to create army');
            return;
        }
        
        // Check if target position is valid and empty
        if (targetGridX < 0 || targetGridX >= this.mapWidth || 
            targetGridY < 0 || targetGridY >= this.mapHeight) {
            console.log('Invalid target position');
            return;
        }
        
        const existingCastle = this.castles.find(c => c.gridX === targetGridX && c.gridY === targetGridY);
        const existingArmy = this.armies.find(a => a.gridX === targetGridX && a.gridY === targetGridY);
        
        if (existingCastle || existingArmy) {
            console.log('Target position occupied');
            return;
        }
        
        // Create army with half of castle units
        const armySize = Math.floor(castle.unitCount / 2);
        castle.unitCount -= armySize;
        
        this.createArmy(targetGridX, targetGridY, castle.owner, armySize);
        
        console.log(`Created army of ${armySize} units at ${targetGridX}, ${targetGridY}`);
    }
    
    update(time, delta) {
        // Handle keyboard camera controls
        this.updateCameraControls(delta);
        
        // Update game systems
        if (this.gameManager) {
            this.gameManager.update(time, delta);
        }
        
        if (this.aiSystem) {
            this.aiSystem.update(time, delta);
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateCameraControls(delta) {
        const panSpeed = MyHoMMConfig.camera.panSpeed * (delta / 1000);
        
        if (this.keys.W.isDown || this.keys.UP.isDown) {
            this.cameras.main.scrollY -= panSpeed;
        }
        if (this.keys.S.isDown || this.keys.DOWN.isDown) {
            this.cameras.main.scrollY += panSpeed;
        }
        if (this.keys.A.isDown || this.keys.LEFT.isDown) {
            this.cameras.main.scrollX -= panSpeed;
        }
        if (this.keys.D.isDown || this.keys.RIGHT.isDown) {
            this.cameras.main.scrollX += panSpeed;
        }
        
        // Zoom controls
        if (this.keys.PLUS.isDown) {
            const newZoom = Phaser.Math.Clamp(
                this.cameras.main.zoom * 1.02,
                MyHoMMConfig.camera.zoomMin,
                MyHoMMConfig.camera.zoomMax
            );
            this.cameras.main.setZoom(newZoom);
        }
        if (this.keys.MINUS.isDown) {
            const newZoom = Phaser.Math.Clamp(
                this.cameras.main.zoom * 0.98,
                MyHoMMConfig.camera.zoomMin,
                MyHoMMConfig.camera.zoomMax
            );
            this.cameras.main.setZoom(newZoom);
        }
        
        // Special keys
        if (Phaser.Input.Keyboard.JustDown(this.keys.H)) {
            this.resetCamera();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
            this.fitCameraToMap();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.selectEntity(null);
        }
    }
    
    updateUI() {
        // Update FPS
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = Math.round(this.game.loop.actualFps);
        }
        
        // Update object count
        const objectCountElement = document.getElementById('objectCount');
        if (objectCountElement) {
            objectCountElement.textContent = this.castles.length + this.armies.length;
        }
    }
    
    // Public methods for UI controls
    resetCamera() {
        const centerX = (this.mapWidth * this.tileSize) / 2;
        const centerY = (this.mapHeight * this.tileSize) / 2;
        
        this.cameras.main.centerOn(centerX, centerY);
        this.cameras.main.setZoom(MyHoMMConfig.camera.zoomDefault);
        
        console.log('Camera reset to center');
    }
    
    fitCameraToMap() {
        const worldWidth = this.mapWidth * this.tileSize;
        const worldHeight = this.mapHeight * this.tileSize;
        
        const scaleX = this.cameras.main.width / worldWidth;
        const scaleY = this.cameras.main.height / worldHeight;
        const zoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
        
        this.cameras.main.setZoom(zoom);
        this.resetCamera();
        
        console.log('Camera fitted to map');
    }
    
    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.debugGraphics) {
            this.debugGraphics.setVisible(this.debugMode);
        }
        console.log('Debug mode:', this.debugMode);
    }
    
    addRandomCastle() {
        const gridX = Phaser.Math.Between(1, this.mapWidth - 2);
        const gridY = Phaser.Math.Between(1, this.mapHeight - 2);
        
        // Check if position is empty
        const existingCastle = this.castles.find(c => c.gridX === gridX && c.gridY === gridY);
        const existingArmy = this.armies.find(a => a.gridX === gridX && a.gridY === gridY);
        
        if (!existingCastle && !existingArmy) {
            const randomPlayer = this.players[Math.floor(Math.random() * this.players.length)];
            this.createCastle(gridX, gridY, randomPlayer);
            console.log(`Added random castle at ${gridX}, ${gridY}`);
        } else {
            console.log('Position occupied, try again');
        }
    }
}

// Register scene with Phaser
window.MainGameScene = MainGameScene;