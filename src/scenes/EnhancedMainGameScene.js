/**
 * Enhanced Main Game Scene for MyHoMM Phaser 3 Version
 * Integrates all Phase 1-5 features: OOP architecture, advanced AI, mobile optimization, 
 * tactical combat, and enhanced camera/UI systems
 */

class EnhancedMainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EnhancedMainGameScene' });
        
        // Scene state
        this.gameState = 'running';
        this.debugMode = false;
        this.currentPhase = 5; // All phases integrated
        
        // Map properties with Phase 5 enhancements
        this.mapWidth = EnhancedGameConfig.enhanced.camera.bounds.enabled ? 
                       MyHoMMConfig.map.defaultWidth : 32;
        this.mapHeight = EnhancedGameConfig.enhanced.camera.bounds.enabled ? 
                        MyHoMMConfig.map.defaultHeight : 32;
        this.tileSize = MyHoMMConfig.map.tileSize;
        
        // Phase 4: Terrain map
        this.terrainMap = [];
        this.initializeTerrainMap();
        
        // Game entities
        this.castles = [];
        this.armies = [];
        this.players = [];
        
        // Enhanced systems (all phases)
        this.gameManager = null;
        this.combatSystem = null;
        this.productionSystem = null;
        this.aiSystem = null;
        this.mobileManager = null;
        this.tacticalManager = null;
        
        // Phase 3: Mobile detection and optimization
        this.isMobile = MOBILE_CONFIG.detection.userAgentPattern.test(navigator.userAgent);
        this.performanceLevel = this.detectPerformanceLevel();
        
        // UI elements
        this.gridGraphics = null;
        this.debugGraphics = null;
        this.terrainGraphics = null;
        this.uiManager = null;
        
        // Enhanced input state
        this.keys = null;
        this.pointer = null;
        this.selectedEntity = null;
        this.gameMode = 'normal'; // normal, tactical, mobile
        
        // Phase 2: Turn management
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.isProcessingTurn = false;
        
        console.log('🎮 Enhanced MainGameScene initialized with all Phase 1-5 features');
    }
    
    initializeTerrainMap() {
        this.terrainMap = [];
        for (let x = 0; x < this.mapWidth; x++) {
            this.terrainMap[x] = [];
            for (let y = 0; y < this.mapHeight; y++) {
                // Generate terrain based on position
                this.terrainMap[x][y] = this.generateTerrain(x, y);
            }
        }
    }
    
    generateTerrain(x, y) {
        const terrainTypes = Object.keys(TERRAIN_EFFECTS);
        const hash = (x * 31 + y * 17) % 100;
        
        if (hash < 40) return 'PLAINS';
        if (hash < 65) return 'FOREST';
        if (hash < 85) return 'HILLS';
        return 'SWAMP';
    }
    
    detectPerformanceLevel() {
        // Simple performance detection
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        if (memory >= 8 && cores >= 8) return 'high';
        if (memory >= 4 && cores >= 4) return 'medium';
        return 'low';
    }
    
    preload() {
        console.log('🎮 Enhanced MainGameScene: Preloading assets...');
        
        // Enhanced preloading for all phases
        this.loadGameAssets();
        this.loadMobileAssets();
        this.loadTacticalAssets();
        
        console.log('✅ Enhanced MainGameScene: Assets preloaded');
    }
    
    loadGameAssets() {
        // Create enhanced graphics for different unit types and terrain
        this.createUnitTypeGraphics();
        this.createTerrainGraphics();
        this.createFormationGraphics();
    }
    
    loadMobileAssets() {
        if (this.isMobile) {
            // Load mobile-optimized assets
            console.log('📱 Loading mobile-optimized assets');
        }
    }
    
    loadTacticalAssets() {
        // Load tactical combat assets
        console.log('⚔️ Loading tactical combat assets');
    }
    
    createUnitTypeGraphics() {
        // Create graphics for different unit types
        Object.keys(ENHANCED_UNIT_TYPES).forEach(unitType => {
            const unitInfo = ENHANCED_UNIT_TYPES[unitType];
            // In a real implementation, this would load actual sprites
            console.log(`Loading ${unitInfo.name} graphics`);
        });
    }
    
    createTerrainGraphics() {
        // Create graphics for terrain types
        Object.keys(TERRAIN_EFFECTS).forEach(terrainType => {
            const terrainInfo = TERRAIN_EFFECTS[terrainType];
            console.log(`Loading ${terrainInfo.name} terrain graphics`);
        });
    }
    
    createFormationGraphics() {
        // Create graphics for formation indicators
        Object.keys(TACTICAL_FORMATIONS).forEach(formation => {
            const formationInfo = TACTICAL_FORMATIONS[formation];
            console.log(`Loading ${formationInfo.name} formation graphics`);
        });
    }
    
    create() {
        console.log('🎮 Enhanced MainGameScene: Creating enhanced game world...');
        
        // Set up enhanced camera system (Phase 5)
        this.setupEnhancedCamera();
        
        // Create enhanced world graphics
        this.createGrid();
        this.createTerrainVisuals();
        this.createDebugGraphics();
        
        // Initialize all enhanced game systems
        this.initializeEnhancedGameSystems();
        
        // Set up enhanced input controls
        this.setupEnhancedInputControls();
        
        // Initialize players with enhanced features
        this.initializeEnhancedPlayers();
        
        // Initialize starting entities with enhancements
        this.initializeEnhancedStartingEntities();
        
        // Start enhanced production system
        this.startEnhancedProductionSystem();
        
        // Initialize mobile systems if needed
        if (this.isMobile) {
            this.initializeMobileSystems();
        }
        
        // Initialize UI manager
        this.initializeUIManager();
        
        console.log('✅ Enhanced MainGameScene: Enhanced game world created');
        
        // Hide loading indicator
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    setupEnhancedCamera() {
        const worldWidth = this.mapWidth * this.tileSize;
        const worldHeight = this.mapHeight * this.tileSize;
        
        // Enhanced camera setup with Phase 5 features
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setZoom(ENHANCED_CAMERA_CONFIG.zoom.default);
        
        // Enable camera effects
        if (ENHANCED_CAMERA_CONFIG.effects.smooth.enabled) {
            this.cameras.main.lerp = ENHANCED_CAMERA_CONFIG.effects.smooth.factor;
        }
        
        console.log('📸 Enhanced camera system initialized');
    }
    
    createTerrainVisuals() {
        this.terrainGraphics = this.add.graphics();
        this.redrawTerrain();
    }
    
    redrawTerrain() {
        if (!this.terrainGraphics) return;
        
        this.terrainGraphics.clear();
        
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                const terrain = this.terrainMap[x][y];
                const terrainInfo = TERRAIN_EFFECTS[terrain];
                const color = parseInt(terrainInfo.color.replace('#', '0x'));
                
                this.terrainGraphics.fillStyle(color, 0.3);
                this.terrainGraphics.fillRect(
                    x * this.tileSize, 
                    y * this.tileSize, 
                    this.tileSize, 
                    this.tileSize
                );
            }
        }
    }
    
    initializeEnhancedGameSystems() {
        // Enhanced system initialization with all phases
        this.gameManager = new EnhancedGameManager(this);
        this.combatSystem = new EnhancedCombatSystem(this);
        this.productionSystem = new EnhancedProductionSystem(this);
        this.aiSystem = new EnhancedAISystem(this);
        
        if (EnhancedGameConfig.enhanced.phases.phase4.enabled) {
            this.tacticalManager = new TacticalManager(this);
        }
        
        console.log('✅ Enhanced game systems initialized');
    }
    
    setupEnhancedInputControls() {
        // Enhanced keyboard controls
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
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            TAB: Phaser.Input.Keyboard.KeyCodes.TAB,
            // Phase 4: Tactical controls
            Q: Phaser.Input.Keyboard.KeyCodes.Q, // Formation change
            E: Phaser.Input.Keyboard.KeyCodes.E, // Split army
            R: Phaser.Input.Keyboard.KeyCodes.R, // Rotate formation
            T: Phaser.Input.Keyboard.KeyCodes.T  // Tactical mode
        });
        
        // Enhanced mouse/touch controls
        this.input.on('pointerdown', this.onEnhancedPointerDown, this);
        this.input.on('pointermove', this.onEnhancedPointerMove, this);
        this.input.on('pointerup', this.onEnhancedPointerUp, this);
        this.input.on('wheel', this.onEnhancedMouseWheel, this);
        
        console.log('✅ Enhanced input controls set up');
    }
    
    initializeEnhancedPlayers() {
        // Create enhanced human player
        this.players.push(new Player({
            id: 'human',
            name: 'Human Player',
            color: MyHoMMConfig.players.human.color,
            isHuman: true,
            personality: 'balanced',
            aggressiveness: 0.5,
            expansiveness: 0.5,
            economicFocus: 0.5
        }));
        
        // Create enhanced AI player with personality
        const aiPersonality = AI_CONFIG.personalities.balanced;
        this.players.push(new Player({
            id: 'ai',
            name: 'AI Commander',
            color: MyHoMMConfig.players.ai.color,
            isHuman: false,
            difficulty: 'medium',
            personality: 'balanced',
            ...aiPersonality
        }));
        
        console.log('✅ Enhanced players initialized');
    }
    
    initializeEnhancedStartingEntities() {
        // Create enhanced starting castles
        const humanCastle = this.createEnhancedCastle(2, 2, this.players[0]);
        const aiCastle = this.createEnhancedCastle(this.mapWidth - 3, this.mapHeight - 3, this.players[1]);
        
        // Upgrade starting castles slightly
        humanCastle.upgrade('production');
        aiCastle.upgrade('production');
        
        console.log('✅ Enhanced starting entities created');
    }
    
    createEnhancedCastle(gridX, gridY, owner, config = {}) {
        const castle = new Castle({
            scene: this,
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2,
            gridX: gridX,
            gridY: gridY,
            owner: owner,
            level: config.level || 1,
            ...config
        });
        
        this.castles.push(castle);
        return castle;
    }
    
    createEnhancedArmy(gridX, gridY, owner, unitCount = 1, config = {}) {
        const army = new EnhancedArmy({
            scene: this,
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2,
            gridX: gridX,
            gridY: gridY,
            owner: owner,
            unitCount: unitCount,
            formation: config.formation || owner.getPreferredFormation(),
            experience: config.experience || 0,
            unitTypes: config.unitTypes,
            ...config
        });
        
        this.armies.push(army);
        return army;
    }
    
    startEnhancedProductionSystem() {
        this.time.addEvent({
            delay: MyHoMMConfig.units.productionInterval,
            callback: () => {
                this.productionSystem.updateProduction();
            },
            loop: true
        });
        
        // Phase 2: Income system
        this.time.addEvent({
            delay: 5000, // Every 5 seconds
            callback: () => {
                this.players.forEach(player => player.updateIncome());
            },
            loop: true
        });
    }
    
    initializeMobileSystems() {
        console.log('📱 Initializing mobile systems...');
        // Mobile optimization would be implemented here
        // This is a simplified version for the migration
    }
    
    initializeUIManager() {
        // Enhanced UI manager with phase features
        this.uiManager = {
            selectedEntity: null,
            currentMode: 'normal',
            showTerrain: true,
            showFormations: true
        };
    }
    
    // Enhanced input handlers
    onEnhancedPointerDown(pointer) {
        if (pointer.rightButtonDown()) {
            // Right click for camera panning or context menu
            return;
        }
        
        // Enhanced left click handling
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const gridX = Math.floor(worldPoint.x / this.tileSize);
        const gridY = Math.floor(worldPoint.y / this.tileSize);
        
        this.onEnhancedTileClicked(gridX, gridY, pointer);
    }
    
    onEnhancedPointerMove(pointer) {
        // Enhanced pointer movement (simplified for this migration)
    }
    
    onEnhancedPointerUp(pointer) {
        // Enhanced pointer up handling
    }
    
    onEnhancedMouseWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        // Enhanced zoom with Phase 5 camera system
        const zoomFactor = deltaY > 0 ? 
            (1 - ENHANCED_CAMERA_CONFIG.zoom.step) : 
            (1 + ENHANCED_CAMERA_CONFIG.zoom.step);
            
        const newZoom = Phaser.Math.Clamp(
            this.cameras.main.zoom * zoomFactor,
            ENHANCED_CAMERA_CONFIG.zoom.min,
            ENHANCED_CAMERA_CONFIG.zoom.max
        );
        
        this.cameras.main.setZoom(newZoom);
    }
    
    onEnhancedTileClicked(gridX, gridY, pointer) {
        console.log(`Enhanced tile clicked: ${gridX}, ${gridY}`);
        
        // Check for entities at this position
        const castle = this.castles.find(c => c.gridX === gridX && c.gridY === gridY);
        const army = this.armies.find(a => a.gridX === gridX && a.gridY === gridY);
        
        if (castle) {
            this.selectEntity(castle);
            this.showEntityInfo(castle);
        } else if (army) {
            this.selectEntity(army);
            this.showEntityInfo(army);
        } else if (this.selectedEntity && this.selectedEntity.type === 'castle') {
            // Create enhanced army from selected castle
            this.createEnhancedArmyFromCastle(this.selectedEntity, gridX, gridY);
        } else if (this.selectedEntity && this.selectedEntity.type === 'army') {
            // Move selected army with enhanced movement
            this.selectedEntity.moveToGrid(gridX, gridY);
            this.selectEntity(null);
        } else {
            this.selectEntity(null);
        }
    }
    
    showEntityInfo(entity) {
        if (entity.type === 'castle') {
            console.log(`Castle Level ${entity.level}, Upgrades:`, entity.upgrades);
        } else if (entity.type === 'army') {
            console.log(`Army Formation: ${entity.formation}, Experience: ${entity.experience}, Power: ${entity.calculateTotalPower()}`);
        }
    }
    
    createEnhancedArmyFromCastle(castle, targetGridX, targetGridY) {
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
        
        // Create enhanced army with unit type composition
        const armySize = Math.floor(castle.unitCount / 2);
        castle.unitCount -= armySize;
        castle.updateTotalUnits();
        castle.updateVisuals();
        
        // Copy unit types proportionally
        const armyUnitTypes = {};
        Object.entries(castle.unitTypes).forEach(([unitType, data]) => {
            const count = Math.floor(data.count * 0.5);
            armyUnitTypes[unitType] = { count: count, level: data.level };
            castle.unitTypes[unitType].count -= count;
        });
        
        this.createEnhancedArmy(targetGridX, targetGridY, castle.owner, armySize, {
            unitTypes: armyUnitTypes,
            formation: castle.owner.getPreferredFormation()
        });
        
        console.log(`Created enhanced army of ${armySize} units at ${targetGridX}, ${targetGridY}`);
    }
    
    update(time, delta) {
        // Enhanced update loop with all phase features
        this.updateEnhancedCameraControls(delta);
        
        // Update enhanced game systems
        if (this.gameManager) {
            this.gameManager.update(time, delta);
        }
        
        if (this.aiSystem) {
            this.aiSystem.update(time, delta);
        }
        
        if (this.tacticalManager) {
            this.tacticalManager.update(time, delta);
        }
        
        // Phase 2: Turn management
        this.updateTurnManagement(time, delta);
        
        // Update enhanced UI
        this.updateEnhancedUI();
    }
    
    updateEnhancedCameraControls(delta) {
        const panSpeed = ENHANCED_CAMERA_CONFIG.movement.panSpeed * (delta / 1000);
        
        // Enhanced keyboard camera controls
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
        
        // Enhanced zoom controls
        if (this.keys.PLUS.isDown) {
            const newZoom = Phaser.Math.Clamp(
                this.cameras.main.zoom * (1 + ENHANCED_CAMERA_CONFIG.zoom.step),
                ENHANCED_CAMERA_CONFIG.zoom.min,
                ENHANCED_CAMERA_CONFIG.zoom.max
            );
            this.cameras.main.setZoom(newZoom);
        }
        if (this.keys.MINUS.isDown) {
            const newZoom = Phaser.Math.Clamp(
                this.cameras.main.zoom * (1 - ENHANCED_CAMERA_CONFIG.zoom.step),
                ENHANCED_CAMERA_CONFIG.zoom.min,
                ENHANCED_CAMERA_CONFIG.zoom.max
            );
            this.cameras.main.setZoom(newZoom);
        }
        
        // Enhanced special keys
        if (Phaser.Input.Keyboard.JustDown(this.keys.H)) {
            this.resetCamera();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
            this.fitCameraToMap();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.endTurn();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.TAB)) {
            this.cycleSelectedEntity();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.T)) {
            this.toggleTacticalMode();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.selectEntity(null);
        }
    }
    
    updateTurnManagement(time, delta) {
        // Phase 2: Turn-based enhancements
        if (!this.isProcessingTurn && this.gameState === 'running') {
            // Check if current player's turn should end
            const currentPlayer = this.players[this.currentPlayerIndex];
            if (!currentPlayer.isHuman) {
                // AI turn processing would be handled here
            }
        }
    }
    
    endTurn() {
        console.log(`Turn ${this.turnNumber} ended for ${this.players[this.currentPlayerIndex].name}`);
        
        // Restore movement points for all armies
        this.armies.forEach(army => {
            if (army.restoreMovementPoints) {
                army.restoreMovementPoints();
            }
        });
        
        // Switch to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        if (this.currentPlayerIndex === 0) {
            this.turnNumber++;
        }
        
        console.log(`Turn ${this.turnNumber} started for ${this.players[this.currentPlayerIndex].name}`);
    }
    
    cycleSelectedEntity() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerEntities = [
            ...this.castles.filter(c => c.owner === currentPlayer),
            ...this.armies.filter(a => a.owner === currentPlayer)
        ];
        
        if (playerEntities.length === 0) return;
        
        let currentIndex = this.selectedEntity ? 
            playerEntities.indexOf(this.selectedEntity) : -1;
        currentIndex = (currentIndex + 1) % playerEntities.length;
        
        this.selectEntity(playerEntities[currentIndex]);
    }
    
    toggleTacticalMode() {
        this.gameMode = this.gameMode === 'tactical' ? 'normal' : 'tactical';
        console.log(`Switched to ${this.gameMode} mode`);
        
        if (this.gameMode === 'tactical') {
            this.showTacticalOverlay();
        } else {
            this.hideTacticalOverlay();
        }
    }
    
    showTacticalOverlay() {
        // Show formation indicators, terrain effects, etc.
        console.log('Tactical overlay activated');
    }
    
    hideTacticalOverlay() {
        // Hide tactical information
        console.log('Tactical overlay deactivated');
    }
    
    updateEnhancedUI() {
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
        
        // Enhanced UI updates would go here
    }
    
    // Public methods for UI controls (enhanced)
    resetCamera() {
        const centerX = (this.mapWidth * this.tileSize) / 2;
        const centerY = (this.mapHeight * this.tileSize) / 2;
        
        this.cameras.main.centerOn(centerX, centerY);
        this.cameras.main.setZoom(ENHANCED_CAMERA_CONFIG.zoom.default);
        
        console.log('Enhanced camera reset to center');
    }
    
    fitCameraToMap() {
        const worldWidth = this.mapWidth * this.tileSize;
        const worldHeight = this.mapHeight * this.tileSize;
        
        const scaleX = this.cameras.main.width / worldWidth;
        const scaleY = this.cameras.main.height / worldHeight;
        const zoom = Math.min(scaleX, scaleY) * 0.9;
        
        this.cameras.main.setZoom(zoom);
        this.resetCamera();
        
        console.log('Enhanced camera fitted to map');
    }
    
    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.debugGraphics) {
            this.debugGraphics.setVisible(this.debugMode);
        }
        if (this.terrainGraphics) {
            this.terrainGraphics.setVisible(this.debugMode);
        }
        console.log('Enhanced debug mode:', this.debugMode);
    }
    
    addRandomCastle() {
        const gridX = Phaser.Math.Between(1, this.mapWidth - 2);
        const gridY = Phaser.Math.Between(1, this.mapHeight - 2);
        
        const existingCastle = this.castles.find(c => c.gridX === gridX && c.gridY === gridY);
        const existingArmy = this.armies.find(a => a.gridX === gridX && a.gridY === gridY);
        
        if (!existingCastle && !existingArmy) {
            const randomPlayer = this.players[Math.floor(Math.random() * this.players.length)];
            this.createEnhancedCastle(gridX, gridY, randomPlayer);
            console.log(`Added enhanced castle at ${gridX}, ${gridY}`);
        } else {
            console.log('Position occupied, try again');
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
            console.log(`Selected enhanced ${entity.type}:`, entity);
            
            // Show enhanced entity information
            this.showEntityInfo(entity);
        }
    }
}

// Register enhanced scene with Phaser
window.EnhancedMainGameScene = EnhancedMainGameScene;