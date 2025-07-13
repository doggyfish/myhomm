// MyHoMM - HTML5 Real-Time Strategy Game
class MyHoMMGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.gridSize = 40;
        this.mapWidth = 20;
        this.mapHeight = 15;
        this.unitProductionInterval = 1000; // 1 second
        
        // Game state
        this.castles = [];
        this.armies = [];
        this.players = [];
        this.selectedCastle = null;
        this.gameStartTime = Date.now();
        this.lastProductionTime = 0;
        
        // Initialize
        this.initializePlayers();
        this.initializeCastles();
        this.setupEventListeners();
        this.selectedArmy = null;
        
        // Only start game loop if not in test mode
        if (!window.testMode) {
            this.gameLoop();
        }
    }
    
    initializePlayers() {
        this.players = [
            { id: 0, name: "Player 1", color: "#4af", isHuman: true },
            { id: 1, name: "Player 2", color: "#f44", isHuman: true },
            { id: 2, name: "Player 3", color: "#4f4", isHuman: true } // Changed to human for testing
        ];
    }
    
    initializeCastles() {
        // Spawn 3 castles at different positions
        this.spawnCastle(3, 3, this.players[0]);
        this.spawnCastle(16, 11, this.players[1]);
        this.spawnCastle(3, 11, this.players[2]);
        
        console.log(`Game initialized with ${this.castles.length} castles`);
    }
    
    spawnCastle(x, y, owner) {
        const castle = {
            x: x,
            y: y,
            unitCount: 10,
            owner: owner,
            selected: false,
            lastProductionTime: Date.now()
        };
        this.castles.push(castle);
    }
    
    setupEventListeners() {
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
        
        // Resize handling
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 40;
        
        // Maintain aspect ratio
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
    
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;
        
        const gridX = Math.floor(clickX / this.gridSize);
        const gridY = Math.floor(clickY / this.gridSize);
        
        this.onTileClicked(gridX, gridY);
    }
    
    onTileClicked(gridX, gridY) {
        console.log(`Tile clicked: ${gridX}, ${gridY}`);
        
        // Check if clicked on a castle or army
        const clickedCastle = this.getCastleAtPosition(gridX, gridY);
        const clickedArmy = this.getArmyAtPosition(gridX, gridY);
        
        // If we have something selected, we're trying to send/move to this tile
        if (this.selectedCastle) {
            // Send army from selected castle to this position
            this.sendArmyFromCastle(this.selectedCastle, gridX, gridY);
            this.deselectCastle();
            return;
        } else if (this.selectedArmy) {
            // Move selected army to this position
            this.moveArmy(this.selectedArmy, gridX, gridY);
            this.deselectArmy();
            return;
        }
        
        // Nothing selected - try to select something
        if (clickedCastle && clickedCastle.owner.isHuman) {
            // Select castle if it belongs to human player
            this.selectCastle(clickedCastle);
        } else if (clickedArmy && clickedArmy.owner.isHuman) {
            // Select army if it belongs to human player  
            this.selectArmy(clickedArmy);
        }
    }
    
    selectCastle(castle) {
        // Deselect everything
        this.deselectAll();
        
        // Select new castle
        this.selectedCastle = castle;
        castle.selected = true;
        
        this.updateUI();
        console.log(`Selected castle with ${castle.unitCount} units`);
    }
    
    selectArmy(army) {
        // Deselect everything
        this.deselectAll();
        
        // Select new army
        this.selectedArmy = army;
        army.selected = true;
        
        this.updateUI();
        console.log(`Selected army with ${army.unitCount} units`);
    }
    
    deselectAll() {
        if (this.selectedCastle) {
            this.selectedCastle.selected = false;
            this.selectedCastle = null;
        }
        if (this.selectedArmy) {
            this.selectedArmy.selected = false;
            this.selectedArmy = null;
        }
    }
    
    deselectCastle() {
        if (this.selectedCastle) {
            this.selectedCastle.selected = false;
            this.selectedCastle = null;
        }
        this.updateUI();
    }
    
    deselectArmy() {
        if (this.selectedArmy) {
            this.selectedArmy.selected = false;
            this.selectedArmy = null;
        }
        this.updateUI();
    }
    
    moveArmy(army, targetX, targetY) {
        // Make army start moving to new position
        army.targetX = targetX;
        army.targetY = targetY;
        army.moveProgress = 0;
        army.isStationary = false;
        
        console.log(`Moving army to ${targetX}, ${targetY}`);
    }
    
    getCastleAtPosition(x, y) {
        return this.castles.find(castle => castle.x === x && castle.y === y);
    }
    
    getArmyAtPosition(x, y) {
        return this.armies.find(army => {
            if (army.isStationary) {
                return army.x === x && army.y === y;
            } else {
                // For moving armies, check if they're close to the target
                const progress = army.moveProgress;
                if (progress > 0.8) { // Close to destination
                    return army.targetX === x && army.targetY === y;
                }
                return false;
            }
        });
    }
    
    sendArmyFromCastle(castle, targetX, targetY) {
        const unitsToSend = Math.floor(castle.unitCount / 2); // Send half
        
        if (unitsToSend <= 0) {
            console.log("Not enough units to send army!");
            return;
        }
        
        // Create army
        const army = {
            x: castle.x,
            y: castle.y,
            targetX: targetX,
            targetY: targetY,
            unitCount: unitsToSend,
            owner: castle.owner,
            moveProgress: 0,
            moveSpeed: 0.02, // Takes 50 frames to move one tile
            isStationary: false
        };
        
        // Remove units from castle
        castle.unitCount -= unitsToSend;
        
        // Add army to game
        this.armies.push(army);
        
        console.log(`Sent army with ${unitsToSend} units to ${targetX}, ${targetY}`);
    }
    
    gameLoop() {
        const currentTime = Date.now();
        
        // Handle unit production
        this.handleUnitProduction(currentTime);
        
        // Update armies
        this.updateArmies();
        
        // Render everything
        this.render();
        
        // Update UI
        this.updateUI();
        
        // Check win condition
        this.checkWinCondition();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    handleUnitProduction(currentTime) {
        if (currentTime - this.lastProductionTime >= this.unitProductionInterval) {
            this.castles.forEach(castle => {
                castle.unitCount++;
            });
            this.lastProductionTime = currentTime;
        }
    }
    
    updateArmies() {
        for (let i = this.armies.length - 1; i >= 0; i--) {
            const army = this.armies[i];
            
            if (!army.isStationary) {
                // Move army towards target
                army.moveProgress += army.moveSpeed;
                
                if (army.moveProgress >= 1.0) {
                    // Army reached destination
                    this.armyReachedDestination(army);
                    
                    // Remove army if it was destroyed in combat or merged
                    if (!army.isStationary) {
                        this.armies.splice(i, 1);
                    }
                }
            }
        }
    }
    
    armyReachedDestination(army) {
        const targetCastle = this.getCastleAtPosition(army.targetX, army.targetY);
        // Don't find the army that's moving - find other armies at destination
        const existingArmy = this.armies.find(otherArmy => 
            otherArmy !== army && 
            otherArmy.isStationary && 
            otherArmy.x === army.targetX && 
            otherArmy.y === army.targetY
        );
        
        if (targetCastle) {
            // Attack castle
            this.resolveCastleCombat(army, targetCastle);
        } else if (existingArmy) {
            // Fight existing army
            this.resolveArmyCombat(army, existingArmy);
        } else {
            // Empty tile - army stays there
            army.x = army.targetX;
            army.y = army.targetY;
            army.moveProgress = 0;
            army.isStationary = true;
            console.log(`Army established position at ${army.x}, ${army.y}`);
        }
    }
    
    resolveCastleCombat(army, defendingCastle) {
        const attackerUnits = army.unitCount;
        const defenderUnits = defendingCastle.unitCount;
        
        console.log(`Castle Combat: ${attackerUnits} vs ${defenderUnits}`);
        
        if (attackerUnits > defenderUnits) {
            // Attacker wins - takes over castle
            const remainingUnits = attackerUnits - defenderUnits;
            defendingCastle.unitCount = remainingUnits;
            defendingCastle.owner = army.owner;
            console.log(`${army.owner.name} conquered castle with ${remainingUnits} units!`);
        } else {
            // Defender wins - keeps castle
            defendingCastle.unitCount = defenderUnits - attackerUnits;
            console.log(`${defendingCastle.owner.name} defended castle!`);
        }
    }
    
    resolveArmyCombat(attackingArmy, defendingArmy) {
        const attackerUnits = attackingArmy.unitCount;
        const defenderUnits = defendingArmy.unitCount;
        
        console.log(`Army Combat: ${attackerUnits} vs ${defenderUnits}`);
        
        if (attackingArmy.owner === defendingArmy.owner) {
            // Same owner - merge armies
            defendingArmy.unitCount += attackerUnits;
            console.log(`Armies merged! New strength: ${defendingArmy.unitCount}`);
        } else if (attackerUnits > defenderUnits) {
            // Attacker wins
            const remainingUnits = attackerUnits - defenderUnits;
            defendingArmy.unitCount = remainingUnits;
            defendingArmy.owner = attackingArmy.owner;
            console.log(`${attackingArmy.owner.name} won army battle!`);
        } else if (defenderUnits > attackerUnits) {
            // Defender wins
            defendingArmy.unitCount = defenderUnits - attackerUnits;
            console.log(`${defendingArmy.owner.name} defended position!`);
        } else {
            // Tie - both armies destroyed
            const armyIndex = this.armies.indexOf(defendingArmy);
            this.armies.splice(armyIndex, 1);
            console.log("Both armies destroyed in combat!");
        }
    }
    
    checkWinCondition() {
        const humanPlayer = this.players.find(p => p.isHuman);
        if (!humanPlayer) return;
        
        const humanCastles = this.castles.filter(c => c.owner === humanPlayer);
        const totalCastles = this.castles.length;
        
        if (humanCastles.length === 0) {
            console.log("Game Over - You Lost!");
            // TODO: Show game over screen
        } else if (humanCastles.length === totalCastles) {
            console.log("Victory - You Won!");
            // TODO: Show victory screen
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2a4a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw castles
        this.drawCastles();
        
        // Draw armies
        this.drawArmies();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.mapWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.mapHeight * this.gridSize);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.mapHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.mapWidth * this.gridSize, y * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawCastles() {
        this.castles.forEach(castle => {
            const x = castle.x * this.gridSize;
            const y = castle.y * this.gridSize;
            const centerX = x + this.gridSize / 2;
            const centerY = y + this.gridSize / 2;
            
            // Draw castle
            this.ctx.fillStyle = castle.owner.color;
            this.ctx.fillRect(x + 5, y + 5, this.gridSize - 10, this.gridSize - 10);
            
            // Draw selection indicator
            if (castle.selected) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
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
                // Stationary army - draw at fixed position
                currentX = army.x * this.gridSize + this.gridSize / 2;
                currentY = army.y * this.gridSize + this.gridSize / 2;
            } else {
                // Moving army - calculate current position based on movement progress
                const startX = army.x * this.gridSize + this.gridSize / 2;
                const startY = army.y * this.gridSize + this.gridSize / 2;
                const endX = army.targetX * this.gridSize + this.gridSize / 2;
                const endY = army.targetY * this.gridSize + this.gridSize / 2;
                
                currentX = startX + (endX - startX) * army.moveProgress;
                currentY = startY + (endY - startY) * army.moveProgress;
            }
            
            // Draw army circle
            this.ctx.fillStyle = army.owner.color;
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw selection indicator for armies
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
                if (this.selectedCastle) {
                    selectedInfo.textContent = `${this.selectedCastle.owner.name} Castle (${this.selectedCastle.unitCount} units)`;
                } else if (this.selectedArmy) {
                    selectedInfo.textContent = `${this.selectedArmy.owner.name} Army (${this.selectedArmy.unitCount} units)`;
                } else {
                    selectedInfo.textContent = 'None';
                }
            }
        } catch (error) {
            // Silently fail if UI elements don't exist (like in tests)
            console.log('UI update skipped (elements not found)');
        }
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new MyHoMMGame();
});