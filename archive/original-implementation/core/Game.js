/**
 * Main Game class that coordinates all game systems and entities
 * This is the central controller for the MyHoMM game
 */
console.log('🔍 Game.js executing, about to define Game class');
class Game {
    constructor(canvasId = 'gameCanvas') {
        // Core game properties
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Game settings
        this.settings = {
            gridSize: 40,
            mapWidth: 20,
            mapHeight: 15,
            unitProductionInterval: 1000, // 1 second
            gameSpeed: 1.0,
            testMode: window.testMode || false
        };
        
        // Game state
        this.gameState = 'running'; // running, paused, gameOver
        this.gameStartTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.frameCount = 0;
        this.fps = 0;
        
        // Game entities
        this.players = [];
        this.castles = [];
        this.armies = [];
        
        // Game systems
        this.systems = {
            production: null,
            combat: null,
            movement: null,
            ai: null
        };
        
        // Mobile systems (Phase 3)
        this.mobile = {
            manager: null,
            optimizer: null,
            touchManager: null,
            performanceManager: null,
            uiManager: null,
            combatSystem: null,
            isActive: false
        };
        
        // UI and input
        this.ui = {
            selectedCastle: null,
            selectedArmy: null,
            lastClickTime: 0,
            inputHandler: null,
            renderer: null
        };
        
        // Game statistics
        this.statistics = {
            totalUnitsProduced: 0,
            totalBattles: 0,
            totalMovements: 0,
            gameTime: 0
        };
        
        // Event callbacks
        this.eventCallbacks = {
            onUnitProduced: [],
            onBattleResolved: [],
            onCastleCaptured: [],
            onArmyMoved: [],
            onGameOver: []
        };
        
        // Initialize game synchronously
        this.initializeSync();
    }
    
    /**
     * Initialize the game synchronously
     */
    initializeSync() {
        console.log('Initializing MyHoMM Game...');
        
        try {
            // Initialize systems
            this.initializeSystems();
            
            // Initialize players
            this.initializePlayers();
            
            // Initialize castles
            this.initializeCastles();
            
            // Setup input handling
            this.setupInputHandling();
            
            // Initialize mobile systems (Phase 3)
            this.initializeMobileSystems();
            
            // Start game loop if not in test mode
            if (!this.settings.testMode) {
                this.startGameLoop();
            }
            
            console.log('Game initialized successfully');
            this.triggerEvent('onGameInitialized');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.gameState = 'error';
        }
    }
    
    /**
     * Initialize the game asynchronously (for future use)
     */
    async initialize() {
        console.log('Initializing MyHoMM Game...');
        
        try {
            // Load required classes (in a real module system, these would be imports)
            await this.loadGameClasses();
            
            // Initialize systems
            this.initializeSystems();
            
            // Initialize players
            this.initializePlayers();
            
            // Initialize castles
            this.initializeCastles();
            
            // Setup input handling
            this.setupInputHandling();
            
            // Start game loop if not in test mode
            if (!this.settings.testMode) {
                this.startGameLoop();
            }
            
            console.log('Game initialized successfully');
            this.triggerEvent('onGameInitialized');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.gameState = 'error';
        }
    }
    
    /**
     * Load all required game classes
     */
    async loadGameClasses() {
        // In a real module system, these would be actual imports
        // For now, we assume classes are loaded globally
        
        // Check if required classes are available
        const requiredClasses = ['Player', 'Castle', 'Army', 'ProductionSystem', 
                               'CombatSystem', 'MovementSystem', 'AISystem'];
        
        for (const className of requiredClasses) {
            if (typeof window[className] === 'undefined') {
                console.warn(`Class ${className} not loaded - some features may not work`);
            }
        }
    }
    
    /**
     * Initialize all game systems
     */
    initializeSystems() {
        // Initialize systems (checking if classes exist)
        if (typeof ProductionSystem !== 'undefined') {
            this.systems.production = new ProductionSystem();
        }
        
        if (typeof CombatSystem !== 'undefined') {
            this.systems.combat = new CombatSystem();
        }
        
        if (typeof MovementSystem !== 'undefined') {
            this.systems.movement = new MovementSystem(this.settings.mapWidth, this.settings.mapHeight);
        }
        
        if (typeof AISystem !== 'undefined') {
            this.systems.ai = new AISystem();
        }
        
        console.log('Game systems initialized');
    }
    
    /**
     * Initialize players
     */
    initializePlayers() {
        const playerData = [
            { id: 0, name: "Player 1", color: "#4af", isHuman: true },
            { id: 1, name: "Aggressive AI", color: "#f44", isHuman: false, difficulty: 'hard', personality: 'aggressive' },
            { id: 2, name: "Defensive AI", color: "#4f4", isHuman: false, difficulty: 'medium', personality: 'defensive' }
        ];
        
        this.players = [];
        
        playerData.forEach(data => {
            if (typeof Player !== 'undefined') {
                const player = new Player(data.id, data.name, data.color, data.isHuman);
                
                // Set AI personality settings
                if (!data.isHuman && data.personality) {
                    player.aiPersonality = data.personality;
                    player.settings = this.getPersonalitySettings(data.personality);
                }
                
                this.players.push(player);
                
                // Register AI players with specific difficulty
                if (!player.isHuman && this.systems.ai) {
                    const difficulty = data.difficulty || 'medium';
                    this.systems.ai.registerAIPlayer(player, difficulty);
                    console.log(`Registered ${player.name} as ${difficulty} ${data.personality || 'balanced'} AI`);
                }
            } else {
                // Fallback to simple object
                this.players.push(data);
            }
        });
        
        console.log(`Initialized ${this.players.length} players`);
    }
    
    /**
     * Get personality settings for AI players
     * @param {string} personality - AI personality type
     * @returns {Object} Personality settings
     */
    getPersonalitySettings(personality) {
        const personalitySettings = {
            aggressive: {
                economicFocus: 0.2,
                aggressiveness: 0.9,
                expansionTendency: 0.8,
                riskTolerance: 0.9
            },
            defensive: {
                economicFocus: 0.6,
                aggressiveness: 0.3,
                expansionTendency: 0.4,
                riskTolerance: 0.3
            },
            economic: {
                economicFocus: 0.9,
                aggressiveness: 0.2,
                expansionTendency: 0.6,
                riskTolerance: 0.4
            },
            balanced: {
                economicFocus: 0.5,
                aggressiveness: 0.5,
                expansionTendency: 0.5,
                riskTolerance: 0.5
            }
        };
        
        return personalitySettings[personality] || personalitySettings.balanced;
    }
    
    /**
     * Initialize castles
     */
    initializeCastles() {
        const castlePositions = [
            { x: 3, y: 3, playerIndex: 0 },
            { x: 16, y: 11, playerIndex: 1 },
            { x: 3, y: 11, playerIndex: 2 }
        ];
        
        this.castles = [];
        
        castlePositions.forEach(pos => {
            const owner = this.players[pos.playerIndex];
            
            if (typeof Castle !== 'undefined') {
                const castle = new Castle(pos.x, pos.y, owner);
                this.castles.push(castle);
            } else {
                // Fallback to simple object
                this.castles.push({
                    x: pos.x,
                    y: pos.y,
                    owner: owner,
                    unitCount: 10,
                    selected: false,
                    lastProductionTime: Date.now()
                });
            }
        });
        
        console.log(`Initialized ${this.castles.length} castles`);
    }
    
    /**
     * Setup input handling
     */
    setupInputHandling() {
        if (!this.canvas) return;
        
        // Mouse events
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleClick(mouseEvent);
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }
    
    /**
     * Handle click events
     */
    handleClick(event) {
        if (this.gameState !== 'running') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;
        
        const gridPos = this.pixelToGrid(clickX, clickY);
        this.onTileClicked(gridPos.x, gridPos.y);
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        switch (event.key) {
            case ' ': // Spacebar
                event.preventDefault();
                this.togglePause();
                break;
            case 'Escape':
                this.deselectAll();
                break;
            case '1':
            case '2':
            case '3':
                this.setGameSpeed(parseInt(event.key));
                break;
        }
    }
    
    /**
     * Handle tile click
     */
    onTileClicked(gridX, gridY) {
        console.log(`Tile clicked: ${gridX}, ${gridY}`);
        
        const clickedCastle = this.getCastleAtPosition(gridX, gridY);
        const clickedArmy = this.getArmyAtPosition(gridX, gridY);
        
        // Handle selection and movement logic
        if (this.ui.selectedCastle) {
            // Check if clicking on the same castle (deselect)
            if (clickedCastle === this.ui.selectedCastle) {
                this.deselectCastle();
                console.log("Deselected castle");
                return;
            }
            
            // Check if clicking on own castle (reinforce/merge)
            if (clickedCastle && clickedCastle.owner === this.ui.selectedCastle.owner) {
                console.log("Cannot send army to own castle - use army merging instead");
                this.deselectCastle();
                return;
            }
            
            // Send army to target location (attack or move to empty space)
            this.sendArmyFromCastle(this.ui.selectedCastle, gridX, gridY);
            this.deselectCastle();
        } else if (this.ui.selectedArmy) {
            // Check if clicking on the same army (deselect)
            if (clickedArmy === this.ui.selectedArmy) {
                this.deselectArmy();
                console.log("Deselected army");
                return;
            }
            
            this.moveArmy(this.ui.selectedArmy, gridX, gridY);
            this.deselectArmy();
        } else {
            // Try to select something
            if (clickedCastle && this.isPlayerControlled(clickedCastle.owner)) {
                this.selectCastle(clickedCastle);
            } else if (clickedArmy && this.isPlayerControlled(clickedArmy.owner)) {
                this.selectArmy(clickedArmy);
            }
        }
    }
    
    /**
     * Main game update loop
     */
    update() {
        if (this.gameState !== 'running') return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        
        // Update game statistics
        this.statistics.gameTime = currentTime - this.gameStartTime;
        
        // Update systems
        this.updateSystems(currentTime);
        
        // Update entities
        this.updateEntities(currentTime);
        
        // Check win conditions
        this.checkWinConditions();
        
        // Update FPS
        this.updateFPS(currentTime);
        
        this.lastUpdateTime = currentTime;
    }
    
    /**
     * Update all game systems
     */
    updateSystems(currentTime) {
        // Update production system
        if (this.systems.production) {
            const unitsProduced = this.systems.production.update(this.castles, currentTime);
            this.statistics.totalUnitsProduced += unitsProduced;
        }
        
        // Update movement system
        if (this.systems.movement) {
            const arrivedArmies = this.systems.movement.updateAllMovement(this.armies);
            arrivedArmies.forEach(army => this.handleArmyArrival(army));
        }
        
        // Update AI system
        if (this.systems.ai) {
            const aiActions = this.systems.ai.update({
                castles: this.castles,
                armies: this.armies,
                players: this.players
            });
            this.executeAIActions(aiActions);
        }
    }
    
    /**
     * Update game entities
     */
    updateEntities(currentTime) {
        // Remove armies marked for removal
        this.armies = this.armies.filter(army => !army.shouldBeRemoved);
        
        // Update player statistics
        this.players.forEach(player => {
            if (player.getTotalUnits) {
                player.getTotalUnits(this.castles, this.armies);
            }
            if (player.getCastleCount) {
                player.getCastleCount(this.castles);
            }
        });
    }
    
    /**
     * Handle army arrival at destination
     */
    handleArmyArrival(army) {
        const targetCastle = this.getCastleAtPosition(army.targetX, army.targetY);
        const existingArmy = this.getStationaryArmyAtPosition(army.targetX, army.targetY, army);
        
        if (targetCastle) {
            // Interact with castle
            if (this.systems.combat) {
                const result = this.systems.combat.resolveArmyVsCastle(army, targetCastle);
                this.handleCombatResult(result);
            }
        } else if (existingArmy) {
            // Interact with existing army
            if (this.systems.combat) {
                const result = this.systems.combat.resolveArmyVsArmy(army, existingArmy);
                this.handleCombatResult(result);
            }
        } else {
            // Empty tile - army stays there
            army.x = army.targetX;
            army.y = army.targetY;
            army.isStationary = true;
            console.log(`Army established position at ${army.x}, ${army.y}`);
        }
    }
    
    /**
     * Handle combat result
     */
    handleCombatResult(result) {
        this.statistics.totalBattles++;
        
        switch (result.type) {
            case 'army_vs_castle':
                if (result.attackerWins) {
                    this.triggerEvent('onCastleCaptured', result);
                }
                break;
            case 'army_vs_army':
                this.triggerEvent('onBattleResolved', result);
                break;
            case 'reinforcement':
                console.log('Castle reinforced successfully');
                break;
            case 'army_merge':
                console.log('Armies merged successfully');
                break;
        }
    }
    
    /**
     * Execute AI actions
     */
    executeAIActions(actions) {
        actions.forEach(action => {
            switch (action.type) {
                case 'send_army':
                    this.sendArmyFromCastle(action.source, action.target.x, action.target.y, action.percentage);
                    break;
                case 'move_army':
                    this.moveArmy(action.army, action.target.x, action.target.y);
                    break;
                case 'upgrade_castle':
                    this.upgradeCastle(action.castle, action.upgradeType);
                    break;
                // Add more action types as needed
            }
        });
    }
    
    /**
     * Upgrade a castle
     * @param {Castle} castle - Castle to upgrade
     * @param {string} upgradeType - Type of upgrade
     */
    upgradeCastle(castle, upgradeType) {
        if (castle && castle.upgrade) {
            const success = castle.upgrade(upgradeType);
            if (success) {
                this.triggerEvent('onCastleUpgraded', { 
                    castle: castle, 
                    upgradeType: upgradeType, 
                    level: castle.upgrades[upgradeType] 
                });
            }
            return success;
        }
        return false;
    }
    
    /**
     * Start the game loop
     */
    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.render();
            
            if (this.gameState !== 'stopped') {
                requestAnimationFrame(gameLoop);
            }
        };
        
        gameLoop();
        console.log('Game loop started');
    }
    
    /**
     * Render the game
     */
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#2a4a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw castles
        this.drawCastles();
        
        // Draw armies
        this.drawArmies();
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Utility methods for game logic
     */
    
    pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / this.settings.gridSize),
            y: Math.floor(pixelY / this.settings.gridSize)
        };
    }
    
    getCastleAtPosition(x, y) {
        return this.castles.find(castle => castle.x === x && castle.y === y);
    }
    
    getArmyAtPosition(x, y) {
        return this.armies.find(army => {
            if (army.isStationary) {
                return army.x === x && army.y === y;
            } else {
                return army.targetX === x && army.targetY === y && army.moveProgress > 0.8;
            }
        });
    }
    
    getStationaryArmyAtPosition(x, y, excludeArmy = null) {
        return this.armies.find(army => 
            army !== excludeArmy &&
            army.isStationary && 
            army.x === x && 
            army.y === y
        );
    }
    
    isPlayerControlled(player) {
        return player && player.isHuman;
    }
    
    selectCastle(castle) {
        this.deselectAll();
        this.ui.selectedCastle = castle;
        castle.selected = true;
        console.log(`Selected castle with ${castle.unitCount} units`);
    }
    
    selectArmy(army) {
        this.deselectAll();
        this.ui.selectedArmy = army;
        army.selected = true;
        console.log(`Selected army with ${army.unitCount} units`);
    }
    
    deselectAll() {
        if (this.ui.selectedCastle) {
            this.ui.selectedCastle.selected = false;
            this.ui.selectedCastle = null;
        }
        if (this.ui.selectedArmy) {
            this.ui.selectedArmy.selected = false;
            this.ui.selectedArmy = null;
        }
    }
    
    deselectCastle() {
        if (this.ui.selectedCastle) {
            this.ui.selectedCastle.selected = false;
            this.ui.selectedCastle = null;
        }
    }
    
    deselectArmy() {
        if (this.ui.selectedArmy) {
            this.ui.selectedArmy.selected = false;
            this.ui.selectedArmy = null;
        }
    }
    
    sendArmyFromCastle(castle, targetX, targetY, percentage = 0.5) {
        // Validate target position
        if (targetX < 0 || targetY < 0 || targetX >= this.settings.mapWidth || targetY >= this.settings.mapHeight) {
            console.log(`Invalid target position: (${targetX}, ${targetY})`);
            return null;
        }
        
        let armyData;
        
        if (castle.sendArmy) {
            armyData = castle.sendArmy(targetX, targetY, percentage);
        } else {
            // Fallback implementation
            const unitsToSend = Math.floor(castle.unitCount * percentage);
            if (unitsToSend <= 0) return null;
            
            armyData = {
                x: castle.x,
                y: castle.y,
                targetX: targetX,
                targetY: targetY,
                unitCount: unitsToSend,
                owner: castle.owner,
                moveProgress: 0,
                moveSpeed: 0.02,
                isStationary: false
            };
            
            castle.unitCount -= unitsToSend;
        }
        
        if (armyData) {
            if (typeof Army !== 'undefined') {
                const army = new Army(armyData.x, armyData.y, armyData.owner, armyData.unitCount);
                army.moveTo(armyData.targetX, armyData.targetY);
                this.armies.push(army);
            } else {
                // Fallback to simple object
                this.armies.push(armyData);
            }
            
            this.statistics.totalMovements++;
            this.triggerEvent('onArmyMoved', armyData);
        }
        
        return armyData;
    }
    
    moveArmy(army, targetX, targetY) {
        if (this.systems.movement) {
            this.systems.movement.moveArmy(army, targetX, targetY);
        } else if (army.moveTo) {
            army.moveTo(targetX, targetY);
        } else {
            // Fallback implementation
            army.targetX = targetX;
            army.targetY = targetY;
            army.moveProgress = 0;
            army.isStationary = false;
        }
        
        this.statistics.totalMovements++;
        this.triggerEvent('onArmyMoved', army);
    }
    
    /**
     * Game control methods
     */
    
    togglePause() {
        if (this.gameState === 'running') {
            this.gameState = 'paused';
            console.log('Game paused');
        } else if (this.gameState === 'paused') {
            this.gameState = 'running';
            console.log('Game resumed');
        }
    }
    
    setGameSpeed(speed) {
        this.settings.gameSpeed = Math.max(0.1, Math.min(5.0, speed));
        console.log(`Game speed set to ${this.settings.gameSpeed}x`);
    }
    
    checkWinConditions() {
        // Check for player elimination (lost all castles)
        this.players.forEach(player => {
            const playerCastles = this.castles.filter(c => c.owner === player);
            const playerArmies = this.armies.filter(a => a.owner === player);
            
            // If player has no castles, eliminate their armies
            if (playerCastles.length === 0 && playerArmies.length > 0) {
                this.eliminatePlayer(player);
            }
        });
        
        // Check human player win/loss conditions
        const humanPlayers = this.players.filter(p => p.isHuman);
        const humanPlayer = humanPlayers[0];
        
        if (!humanPlayer) return;
        
        const humanCastles = this.castles.filter(c => c.owner === humanPlayer);
        const totalCastles = this.castles.length;
        const humanArmies = this.armies.filter(a => a.owner === humanPlayer);
        
        if (humanCastles.length === 0 && humanArmies.length === 0) {
            this.endGame('defeat');
        } else if (humanCastles.length === totalCastles) {
            this.endGame('victory');
        }
        
        // Check for AI-only victory (if only one AI left with castles)
        const playersWithCastles = this.players.filter(player => {
            const castles = this.castles.filter(c => c.owner === player);
            return castles.length > 0;
        });
        
        if (playersWithCastles.length === 1 && !playersWithCastles[0].isHuman) {
            this.endGame('ai_victory');
        }
    }
    
    /**
     * Eliminate a player when they lose all castles
     * @param {Player} player - Player to eliminate
     */
    eliminatePlayer(player) {
        console.log(`Player ${player.name} has been eliminated - removing all armies`);
        
        // Mark all player's armies for removal
        this.armies.forEach(army => {
            if (army.owner === player) {
                army.shouldBeRemoved = true;
            }
        });
        
        // Remove AI player from AI system
        if (!player.isHuman && this.systems.ai) {
            this.systems.ai.removeAIPlayer(player.id);
        }
        
        // Update player statistics
        player.updateStatistics({ 
            eliminated: true,
            eliminationTime: Date.now() - this.gameStartTime 
        });
        
        this.triggerEvent('onPlayerEliminated', { player: player });
    }
    
    endGame(result) {
        this.gameState = 'gameOver';
        console.log(`Game Over - ${result}`);
        this.triggerEvent('onGameOver', { result: result, statistics: this.statistics });
    }
    
    /**
     * Rendering methods (basic implementations)
     */
    
    drawGrid() {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.settings.mapWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.settings.gridSize, 0);
            this.ctx.lineTo(x * this.settings.gridSize, this.settings.mapHeight * this.settings.gridSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.settings.mapHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.settings.gridSize);
            this.ctx.lineTo(this.settings.mapWidth * this.settings.gridSize, y * this.settings.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawCastles() {
        this.castles.forEach(castle => {
            const x = castle.x * this.settings.gridSize;
            const y = castle.y * this.settings.gridSize;
            const centerX = x + this.settings.gridSize / 2;
            const centerY = y + this.settings.gridSize / 2;
            
            // Draw castle
            this.ctx.fillStyle = castle.owner.color;
            this.ctx.fillRect(x + 5, y + 5, this.settings.gridSize - 10, this.settings.gridSize - 10);
            
            // Draw selection indicator
            if (castle.selected) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x + 2, y + 2, this.settings.gridSize - 4, this.settings.gridSize - 4);
            }
            
            // Draw unit count
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(castle.unitCount.toString(), centerX, centerY + 5);
        });
    }
    
    drawArmies() {
        this.armies.forEach(army => {
            let currentX, currentY;
            
            if (army.isStationary) {
                currentX = army.x * this.settings.gridSize + this.settings.gridSize / 2;
                currentY = army.y * this.settings.gridSize + this.settings.gridSize / 2;
            } else {
                const startX = army.x * this.settings.gridSize + this.settings.gridSize / 2;
                const startY = army.y * this.settings.gridSize + this.settings.gridSize / 2;
                const endX = army.targetX * this.settings.gridSize + this.settings.gridSize / 2;
                const endY = army.targetY * this.settings.gridSize + this.settings.gridSize / 2;
                
                currentX = startX + (endX - startX) * army.moveProgress;
                currentY = startY + (endY - startY) * army.moveProgress;
            }
            
            // Draw army circle
            this.ctx.fillStyle = army.owner.color;
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw selection indicator
            if (army.selected) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(currentX, currentY, 15, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Draw unit count
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(army.unitCount.toString(), currentX, currentY + 3);
        });
    }
    
    updateUI() {
        try {
            // Update player statistics
            this.players.forEach(player => {
                const playerCastles = this.castles.filter(c => c.owner === player);
                const totalUnits = playerCastles.reduce((sum, castle) => sum + castle.unitCount, 0);
                const playerArmies = this.armies.filter(a => a.owner === player);
                const armyUnits = playerArmies.reduce((sum, army) => sum + army.unitCount, 0);
                
                const playerKey = player.name.toLowerCase().replace(' ', '');
                const castleElement = document.getElementById(`${playerKey}Castles`);
                const unitsElement = document.getElementById(`${playerKey}Units`);
                
                if (castleElement) castleElement.textContent = playerCastles.length;
                if (unitsElement) unitsElement.textContent = totalUnits + armyUnits;
            });
            
            // Update selected info
            const selectedInfo = document.getElementById('selectedInfo');
            if (selectedInfo) {
                if (this.ui.selectedCastle) {
                    selectedInfo.textContent = `${this.ui.selectedCastle.owner.name} Castle (${this.ui.selectedCastle.unitCount} units)`;
                } else if (this.ui.selectedArmy) {
                    selectedInfo.textContent = `${this.ui.selectedArmy.owner.name} Army (${this.ui.selectedArmy.unitCount} units)`;
                } else {
                    selectedInfo.textContent = 'None';
                }
            }
        } catch (error) {
            // Silently fail if UI elements don't exist
        }
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = document.getElementById('gameContainer');
        if (!container) return;
        
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 40;
        
        const aspectRatio = this.canvas.width / this.canvas.height;
        let newWidth = Math.min(maxWidth, maxHeight * aspectRatio);
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = newHeight + 'px';
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(60000 / (currentTime - this.lastUpdateTime));
        }
    }
    
    /**
     * Event system
     */
    
    addEventListener(eventType, callback) {
        if (!this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType] = [];
        }
        this.eventCallbacks[eventType].push(callback);
    }
    
    removeEventListener(eventType, callback) {
        if (this.eventCallbacks[eventType]) {
            const index = this.eventCallbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.eventCallbacks[eventType].splice(index, 1);
            }
        }
    }
    
    triggerEvent(eventType, data = null) {
        if (this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for ${eventType}:`, error);
                }
            });
        }
    }
    
    /**
     * Save/Load functionality
     */
    
    saveGame() {
        const gameData = {
            version: '1.0',
            timestamp: Date.now(),
            gameTime: this.statistics.gameTime,
            players: this.players.map(p => p.toJSON ? p.toJSON() : p),
            castles: this.castles.map(c => c.toJSON ? c.toJSON() : c),
            armies: this.armies.map(a => a.toJSON ? a.toJSON() : a),
            statistics: this.statistics,
            settings: this.settings
        };
        
        try {
            localStorage.setItem('myhomm_save', JSON.stringify(gameData));
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saved = localStorage.getItem('myhomm_save');
            if (!saved) return false;
            
            const gameData = JSON.parse(saved);
            
            // Restore game state
            this.statistics = gameData.statistics || this.statistics;
            this.settings = { ...this.settings, ...gameData.settings };
            
            // Restore players
            this.players = gameData.players.map(data => {
                return Player && Player.fromJSON ? Player.fromJSON(data) : data;
            });
            
            // Restore castles
            this.castles = gameData.castles.map(data => {
                const owner = this.players.find(p => p.id === data.ownerId);
                return Castle && Castle.fromJSON ? Castle.fromJSON(data, owner) : { ...data, owner };
            });
            
            // Restore armies
            this.armies = gameData.armies.map(data => {
                const owner = this.players.find(p => p.id === data.ownerId);
                return Army && Army.fromJSON ? Army.fromJSON(data, owner) : { ...data, owner };
            });
            
            console.log('Game loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }
    
    /**
     * Get game statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            fps: this.fps,
            gameState: this.gameState,
            playerCount: this.players.length,
            castleCount: this.castles.length,
            armyCount: this.armies.length
        };
    }
    
    /**
     * Initialize mobile systems (Phase 3)
     */
    async initializeMobileSystems() {
        try {
            console.log('🚀 Initializing mobile systems...');
            
            // Check if mobile classes are available
            if (typeof MobileGameManager !== 'undefined') {
                this.mobile.manager = new MobileGameManager(this);
                await this.mobile.manager.initialize();
                
                // Store references to mobile systems
                this.mobile.optimizer = this.mobile.manager.mobileOptimizer;
                this.mobile.touchManager = this.mobile.manager.touchManager;
                this.mobile.performanceManager = this.mobile.manager.performanceManager;
                this.mobile.uiManager = this.mobile.manager.uiManager;
                this.mobile.combatSystem = this.mobile.manager.combatSystem;
                this.mobile.isActive = this.mobile.manager.isActive;
                
                console.log('✅ Mobile systems initialized successfully');
            } else {
                console.log('📱 Mobile systems not available - running in desktop mode');
            }
        } catch (error) {
            console.warn('⚠️ Mobile systems initialization failed:', error);
            console.log('📱 Falling back to desktop mode');
        }
    }
    
    /**
     * Get human player
     */
    getHumanPlayer() {
        return this.players.find(player => player.isHuman) || null;
    }
    
    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGrid(screenX, screenY) {
        const gridSize = this.settings.gridSize || 40;
        return {
            x: Math.floor(screenX / gridSize),
            y: Math.floor(screenY / gridSize)
        };
    }
    
    /**
     * Get castle at grid position
     */
    getCastleAtPosition(gridX, gridY) {
        return this.castles.find(castle => 
            Math.floor(castle.x) === gridX && Math.floor(castle.y) === gridY
        ) || null;
    }
    
    /**
     * Get army at grid position
     */
    getArmyAtPosition(gridX, gridY) {
        return this.armies.find(army => 
            Math.floor(army.x) === gridX && Math.floor(army.y) === gridY
        ) || null;
    }
    
    /**
     * Select castle
     */
    selectCastle(castle) {
        this.ui.selectedCastle = castle;
        this.ui.selectedArmy = null;
        
        console.log(`Selected castle owned by ${castle.owner.name}`);
    }
    
    /**
     * Select army
     */
    selectArmy(army) {
        this.ui.selectedArmy = army;
        this.ui.selectedCastle = null;
        
        console.log(`Selected army owned by ${army.owner.name}`);
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
        this.ui.selectedCastle = null;
        this.ui.selectedArmy = null;
    }
    
    /**
     * Issue movement command
     */
    issueMovementCommand(targetX, targetY) {
        if (this.ui.selectedCastle) {
            // Send army from selected castle
            this.sendArmyFromCastle(this.ui.selectedCastle, targetX, targetY, 0.5);
        } else if (this.ui.selectedArmy) {
            // Move selected army
            this.moveArmy(this.ui.selectedArmy, targetX, targetY);
        }
    }
    
    /**
     * Send army from castle
     */
    sendArmyFromCastle(castle, targetX, targetY, percentage = 0.5) {
        const armyData = castle.sendArmy(targetX, targetY, percentage);
        if (armyData) {
            const army = new Army(armyData.x, armyData.y, armyData.owner, armyData.unitCount);
            army.targetX = armyData.targetX;
            army.targetY = armyData.targetY;
            army.unitTypes = armyData.unitTypes;
            army.moveProgress = armyData.moveProgress;
            army.moveSpeed = armyData.moveSpeed;
            army.isStationary = armyData.isStationary;
            
            this.armies.push(army);
            console.log(`Army sent from castle to ${targetX}, ${targetY}`);
        }
    }
    
    /**
     * Move army
     */
    moveArmy(army, targetX, targetY) {
        army.targetX = targetX;
        army.targetY = targetY;
        army.isStationary = false;
        army.moveProgress = 0;
        
        console.log(`Army moving to ${targetX}, ${targetY}`);
    }
    
    /**
     * Show mobile context menu (called by mobile systems)
     */
    showMobileContextMenu(gridX, gridY, screenPosition) {
        if (this.mobile.manager && this.mobile.manager.showMobileContextMenu) {
            this.mobile.manager.showMobileContextMenu(gridX, gridY, screenPosition);
        }
    }
    
    /**
     * Show quick army menu (called by mobile systems)
     */
    showQuickArmyMenu(castle) {
        console.log(`Showing quick army menu for castle owned by ${castle.owner.name}`);
        
        if (this.mobile.uiManager) {
            this.mobile.uiManager.showBottomSheet({
                title: '⚔️ Send Army',
                castle: castle,
                type: 'army_selector'
            }, {
                height: this.mobile.uiManager.screenInfo.height * 0.4
            });
        }
    }
    
    /**
     * Update game area (called by mobile UI manager)
     */
    updateGameArea(gameArea) {
        console.log('📱 Game area updated:', gameArea);
        
        // Update camera bounds if camera system exists
        if (this.camera) {
            this.camera.setBounds(gameArea);
        }
    }
    
    /**
     * Check if mobile systems are active
     */
    isMobileActive() {
        return this.mobile.isActive && this.mobile.manager && this.mobile.manager.isMobileActive();
    }
    
    /**
     * Get mobile performance report
     */
    getMobilePerformanceReport() {
        if (this.mobile.manager) {
            return this.mobile.manager.getPerformanceReport();
        }
        return null;
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.gameState = 'stopped';
        
        // Shutdown mobile systems first
        if (this.mobile.manager) {
            this.mobile.manager.shutdown();
        }
        
        // Remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('touchstart', this.handleClick);
        }
        
        window.removeEventListener('resize', this.resizeCanvas);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        console.log('Game destroyed');
    }
}

console.log('🔍 Game class defined, checking availability:', typeof Game, typeof window.Game);
window.Game = Game; // Explicitly ensure it's in global scope

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}