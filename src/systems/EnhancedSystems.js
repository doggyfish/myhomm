/**
 * Enhanced Game Systems for MyHoMM Phaser 3 Version
 * Combines all Phase 1-5 features into unified system classes
 */

// Enhanced Game Manager (Phase 1-5 integration)
class EnhancedGameManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = 'running';
        this.gameStartTime = Date.now();
        
        // Phase 2: Enhanced statistics
        this.statistics = {
            totalUnitsProduced: 0,
            totalBattles: 0,
            totalMovements: 0,
            gameTime: 0,
            goldProduced: 0,
            goldSpent: 0,
            castlesBuilt: 0,
            armiesCreated: 0,
            upgradesCompleted: 0
        };
        
        // Phase 3: Mobile optimizations
        this.mobileOptimizations = {
            adaptiveQuality: true,
            batteryOptimization: true,
            performanceMonitoring: true
        };
        
        console.log('🎮 Enhanced GameManager initialized');
    }
    
    update(time, delta) {
        if (this.gameState !== 'running') return;
        
        this.statistics.gameTime = time - this.gameStartTime;
        this.checkWinCondition();
        this.updatePlayerStatistics();
        
        // Phase 3: Performance monitoring
        if (this.mobileOptimizations.performanceMonitoring) {
            this.monitorPerformance();
        }
    }
    
    checkWinCondition() {
        const humanPlayer = this.scene.players.find(p => p.isHuman);
        const aiPlayer = this.scene.players.find(p => !p.isHuman);
        
        if (!humanPlayer || !aiPlayer) return;
        
        const humanCastles = this.scene.castles.filter(c => c.owner === humanPlayer);
        const aiCastles = this.scene.castles.filter(c => c.owner === aiPlayer);
        const humanArmies = this.scene.armies.filter(a => a.owner === humanPlayer);
        const aiArmies = this.scene.armies.filter(a => a.owner === aiPlayer);
        
        if (humanCastles.length === 0 && humanArmies.length === 0) {
            this.endGame(aiPlayer, 'Human player eliminated');
        } else if (aiCastles.length === 0 && aiArmies.length === 0) {
            this.endGame(humanPlayer, 'AI player eliminated');
        }
    }
    
    monitorPerformance() {
        const fps = this.scene.game.loop.actualFps;
        if (fps < MOBILE_CONFIG.performance.minFPS && this.mobileOptimizations.adaptiveQuality) {
            this.reduceQuality();
        }
    }
    
    reduceQuality() {
        console.log('📱 Reducing quality for performance');
        // Implementation would reduce visual effects, etc.
    }
    
    endGame(winner, reason) {
        this.gameState = 'gameOver';
        console.log(`🎮 Enhanced Game Over: ${winner.name} wins! Reason: ${reason}`);
        this.showGameOverUI(winner, reason);
    }
    
    showGameOverUI(winner, reason) {
        const gameOverText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            `🎮 Enhanced Game Over!\n${winner.name} Wins!\n\n${reason}\n\nPress R to restart`,
            {
                fontSize: '32px',
                fill: winner.isHuman ? '#4CAF50' : '#F44336',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(1000);
        
        this.scene.input.keyboard.once('keydown-R', () => {
            this.scene.scene.restart();
        });
    }
    
    // Event handlers with enhanced features
    onUnitProduced(castle, unitCount) {
        this.statistics.totalUnitsProduced += unitCount;
        console.log(`Enhanced unit production: ${unitCount} units at castle (${castle.gridX}, ${castle.gridY})`);
    }
    
    onBattleResolved(attacker, defender, result) {
        this.statistics.totalBattles++;
        console.log(`Enhanced battle resolved:`, result);
    }
    
    onCastleCaptured(castle, oldOwner, newOwner) {
        console.log(`Enhanced castle capture: ${oldOwner.name} → ${newOwner.name}`);
    }
    
    onArmyMoved(army, targetGridX, targetGridY) {
        this.statistics.totalMovements++;
        console.log(`Enhanced army movement to (${targetGridX}, ${targetGridY})`);
    }
}

// Enhanced Combat System (Phase 1-4 integration)
class EnhancedCombatSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Phase 4: Tactical combat features
        this.tacticalCombat = {
            enabled: true,
            formationBonuses: true,
            terrainEffects: true,
            unitTypeAdvantages: true
        };
        
        console.log('⚔️ Enhanced CombatSystem initialized');
    }
    
    handleCombatResult(attacker, defender, result) {
        console.log('Enhanced combat result:', result);
        
        // Phase 4: Apply tactical bonuses
        if (this.tacticalCombat.enabled) {
            result = this.applyTacticalModifiers(attacker, defender, result);
        }
        
        // Phase 1-2: Experience and morale effects
        if (attacker.gainExperience) {
            attacker.gainExperience(result.captured ? 15 : 5);
        }
        
        if (this.scene.gameManager) {
            this.scene.gameManager.onBattleResolved(attacker, defender, result);
        }
    }
    
    applyTacticalModifiers(attacker, defender, result) {
        // Apply formation, terrain, and unit type bonuses
        let modifier = 1.0;
        
        // Formation bonuses
        if (attacker.formationModifiers?.attackBonus) {
            modifier *= (1 + attacker.formationModifiers.attackBonus);
        }
        
        // Terrain effects
        if (attacker.terrainModifiers?.defenseBonus) {
            modifier *= (1 + attacker.terrainModifiers.defenseBonus);
        }
        
        // Apply modifier to result
        if (result.captured && modifier > 1.1) {
            result.attackerLosses = Math.floor(result.attackerLosses * 0.8);
            result.type = 'tactical_victory';
        }
        
        return result;
    }
    
    // Phase 3-4: Calculate unit type advantages
    calculateUnitTypeBonus(attackerTypes, defenderTypes) {
        let bonus = 1.0;
        
        Object.entries(attackerTypes).forEach(([unitType, data]) => {
            const unitInfo = ENHANCED_UNIT_TYPES[unitType.toUpperCase()];
            if (unitInfo && data.count > 0) {
                // Apply unit type advantages
                const advantage = this.getUnitAdvantage(unitInfo, defenderTypes);
                bonus += advantage * (data.count / Object.values(attackerTypes).reduce((sum, d) => sum + d.count, 0));
            }
        });
        
        return bonus;
    }
    
    getUnitAdvantage(unitInfo, defenderTypes) {
        // Simple unit advantage calculation
        if (unitInfo.strength === 'all') return 0.1;
        
        const advantageTargets = Object.keys(defenderTypes).filter(defType => 
            defType.toLowerCase() === unitInfo.strength?.toLowerCase()
        );
        
        return advantageTargets.length > 0 ? 0.2 : 0;
    }
}

// Enhanced Production System (Phase 1-3 integration)
class EnhancedProductionSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Phase 2: Enhanced production features
        this.productionModifiers = {
            globalSpeed: 1.0,
            qualityBonuses: true,
            resourceEfficiency: true
        };
        
        console.log('🏭 Enhanced ProductionSystem initialized');
    }
    
    updateProduction() {
        this.scene.castles.forEach(castle => {
            if (castle.canProduceUnit && castle.canProduceUnit()) {
                const produced = castle.produceUnit();
                
                if (produced && this.scene.gameManager) {
                    this.scene.gameManager.onUnitProduced(castle, 1);
                }
            }
        });
        
        // Phase 2: Resource income
        this.updateResourceIncome();
    }
    
    updateResourceIncome() {
        this.scene.players.forEach(player => {
            if (player.updateIncome) {
                player.updateIncome();
            }
        });
    }
}

// Enhanced AI System (Phase 1-4 integration)
class EnhancedAISystem {
    constructor(scene) {
        this.scene = scene;
        this.lastAIUpdate = 0;
        this.aiUpdateInterval = 2000;
        
        // Phase 2: Enhanced AI capabilities
        this.aiCapabilities = {
            strategicPlanning: true,
            tacticalCombat: true,
            economicManagement: true,
            adaptiveDifficulty: true
        };
        
        console.log('🤖 Enhanced AISystem initialized');
    }
    
    update(time, delta) {
        if (time - this.lastAIUpdate > this.aiUpdateInterval) {
            this.updateAI();
            this.lastAIUpdate = time;
        }
    }
    
    updateAI() {
        const aiPlayers = this.scene.players.filter(p => !p.isHuman);
        
        aiPlayers.forEach(aiPlayer => {
            this.updateAIPlayer(aiPlayer);
        });
    }
    
    updateAIPlayer(aiPlayer) {
        // Phase 1-2: Strategic decision making
        if (this.aiCapabilities.strategicPlanning) {
            aiPlayer.updateAIStrategy({
                castles: this.scene.castles,
                armies: this.scene.armies,
                players: this.scene.players
            });
        }
        
        // Phase 4: Tactical decisions
        if (this.aiCapabilities.tacticalCombat) {
            this.updateAITacticalDecisions(aiPlayer);
        }
        
        // AI castle management
        this.manageAICastles(aiPlayer);
        
        // AI army management
        this.manageAIArmies(aiPlayer);
    }
    
    updateAITacticalDecisions(aiPlayer) {
        const aiArmies = this.scene.armies.filter(a => a.owner === aiPlayer);
        
        aiArmies.forEach(army => {
            if (army.setFormation) {
                const preferredFormation = aiPlayer.getPreferredFormation();
                if (army.formation !== preferredFormation) {
                    army.setFormation(preferredFormation);
                }
            }
        });
    }
    
    manageAICastles(aiPlayer) {
        const aiCastles = this.scene.castles.filter(c => c.owner === aiPlayer);
        
        aiCastles.forEach(castle => {
            // Enhanced AI castle management
            if (castle.unitCount > 15 && Math.random() < 0.3) {
                this.createAIArmy(castle);
            }
            
            // Phase 2: AI upgrades
            if (aiPlayer.resources.gold > 200 && Math.random() < 0.1) {
                const upgradeTypes = ['production', 'defense', 'capacity', 'economy'];
                const randomUpgrade = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
                if (castle.upgrade) {
                    castle.upgrade(randomUpgrade);
                }
            }
        });
    }
    
    manageAIArmies(aiPlayer) {
        const aiArmies = this.scene.armies.filter(a => a.owner === aiPlayer);
        
        aiArmies.forEach(army => {
            if (army.movementPoints > 0) {
                this.moveAIArmy(army, aiPlayer);
            }
        });
    }
    
    createAIArmy(castle) {
        const directions = [[0,1], [1,0], [0,-1], [-1,0]];
        
        for (const [dx, dy] of directions) {
            const targetX = castle.gridX + dx;
            const targetY = castle.gridY + dy;
            
            if (targetX >= 0 && targetX < this.scene.mapWidth && 
                targetY >= 0 && targetY < this.scene.mapHeight) {
                
                const occupied = this.scene.castles.find(c => c.gridX === targetX && c.gridY === targetY) ||
                               this.scene.armies.find(a => a.gridX === targetX && a.gridY === targetY);
                
                if (!occupied) {
                    const armySize = Math.floor(castle.unitCount / 2);
                    castle.unitCount -= armySize;
                    if (castle.updateTotalUnits) castle.updateTotalUnits();
                    if (castle.updateVisuals) castle.updateVisuals();
                    
                    this.scene.createEnhancedArmy(targetX, targetY, castle.owner, armySize);
                    console.log(`Enhanced AI created army of ${armySize} units`);
                    return;
                }
            }
        }
    }
    
    moveAIArmy(army, aiPlayer) {
        // Enhanced AI army movement with tactical considerations
        const targets = this.findAITargets(army, aiPlayer);
        
        if (targets.length > 0) {
            const target = targets[0];
            const distance = Math.abs(target.gridX - army.gridX) + Math.abs(target.gridY - army.gridY);
            
            if (distance <= army.movementPoints) {
                army.moveToGrid(target.gridX, target.gridY);
            } else {
                // Move towards target
                const dx = Math.sign(target.gridX - army.gridX);
                const dy = Math.sign(target.gridY - army.gridY);
                army.moveToGrid(army.gridX + dx, army.gridY + dy);
            }
        }
    }
    
    findAITargets(army, aiPlayer) {
        const enemyCastles = this.scene.castles.filter(c => c.owner !== aiPlayer);
        const enemyArmies = this.scene.armies.filter(a => a.owner !== aiPlayer);
        
        // Prioritize weaker targets
        const allTargets = [...enemyCastles, ...enemyArmies];
        return allTargets.sort((a, b) => {
            const aPower = a.calculateTotalPower ? a.calculateTotalPower() : a.unitCount;
            const bPower = b.calculateTotalPower ? b.calculateTotalPower() : b.unitCount;
            return aPower - bPower;
        });
    }
}

// Tactical Manager (Phase 4)
class TacticalManager {
    constructor(scene) {
        this.scene = scene;
        this.tacticalMode = false;
        
        console.log('⚔️ TacticalManager initialized');
    }
    
    update(time, delta) {
        if (this.tacticalMode) {
            this.updateTacticalDisplay();
        }
    }
    
    updateTacticalDisplay() {
        // Update tactical overlays, formation indicators, etc.
    }
    
    enableTacticalMode() {
        this.tacticalMode = true;
        console.log('Tactical mode enabled');
    }
    
    disableTacticalMode() {
        this.tacticalMode = false;
        console.log('Tactical mode disabled');
    }
}

// Export all enhanced systems
window.EnhancedGameManager = EnhancedGameManager;
window.EnhancedCombatSystem = EnhancedCombatSystem;
window.EnhancedProductionSystem = EnhancedProductionSystem;
window.EnhancedAISystem = EnhancedAISystem;
window.TacticalManager = TacticalManager;

console.log('🚀 Enhanced Game Systems loaded with all Phase 1-5 features');