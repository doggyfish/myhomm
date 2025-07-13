/**
 * AISystem handles artificial intelligence for computer players
 */
class AISystem {
    constructor() {
        this.aiPlayers = new Map(); // Map of player ID to AI state
        this.lastUpdateTime = Date.now();
        this.updateInterval = 2000; // AI thinks every 2 seconds
        this.difficultySettings = {
            easy: {
                reactionTime: 3000,
                attackThreshold: 1.5,
                economicFocus: 0.7,
                aggressiveness: 0.3
            },
            medium: {
                reactionTime: 2000,
                attackThreshold: 1.2,
                economicFocus: 0.5,
                aggressiveness: 0.5
            },
            hard: {
                reactionTime: 1000,
                attackThreshold: 1.0,
                economicFocus: 0.3,
                aggressiveness: 0.8
            }
        };
    }
    
    /**
     * Register an AI player
     * @param {Player} player - Player to register as AI
     * @param {string} difficulty - AI difficulty level
     */
    registerAIPlayer(player, difficulty = 'medium') {
        if (!player.isHuman) {
            this.aiPlayers.set(player.id, {
                player: player,
                difficulty: difficulty,
                settings: this.difficultySettings[difficulty],
                lastAction: Date.now(),
                strategy: this.selectStrategy(player, difficulty),
                targets: [],
                state: 'evaluating' // evaluating, attacking, defending, expanding
            });
        }
    }
    
    /**
     * Update AI for all registered players
     * @param {Object} gameState - Current game state
     * @returns {Array} Array of AI actions to execute
     */
    update(gameState) {
        const currentTime = Date.now();
        const actions = [];
        
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return actions;
        }
        
        this.aiPlayers.forEach((aiData, playerId) => {
            const playerActions = this.updateAIPlayer(aiData, gameState, currentTime);
            actions.push(...playerActions);
        });
        
        this.lastUpdateTime = currentTime;
        return actions;
    }
    
    /**
     * Update a single AI player
     * @param {Object} aiData - AI player data
     * @param {Object} gameState - Current game state
     * @param {number} currentTime - Current timestamp
     * @returns {Array} Actions for this AI player
     */
    updateAIPlayer(aiData, gameState, currentTime) {
        const { player, settings, strategy } = aiData;
        const actions = [];
        
        // Check if enough time has passed since last action
        if (currentTime - aiData.lastAction < settings.reactionTime) {
            return actions;
        }
        
        // Evaluate current situation
        const situation = this.evaluateSituation(player, gameState);
        
        // Update AI state based on situation
        this.updateAIState(aiData, situation);
        
        // Execute strategy based on current state
        switch (aiData.state) {
            case 'attacking':
                actions.push(...this.executeAttackStrategy(aiData, gameState, situation));
                break;
            case 'defending':
                actions.push(...this.executeDefenseStrategy(aiData, gameState, situation));
                break;
            case 'expanding':
                actions.push(...this.executeExpansionStrategy(aiData, gameState, situation));
                break;
            case 'evaluating':
            default:
                actions.push(...this.executeEvaluationStrategy(aiData, gameState, situation));
                break;
        }
        
        if (actions.length > 0) {
            aiData.lastAction = currentTime;
        }
        
        return actions;
    }
    
    /**
     * Evaluate current game situation for AI player
     * @param {Player} player - AI player
     * @param {Object} gameState - Current game state
     * @returns {Object} Situation analysis
     */
    evaluateSituation(player, gameState) {
        const { castles, armies, players } = gameState;
        
        const myCastles = castles.filter(c => c.owner === player);
        const myArmies = armies.filter(a => a.owner === player);
        const enemyCastles = castles.filter(c => c.owner !== player);
        const enemyArmies = armies.filter(a => a.owner !== player);
        
        const myTotalUnits = this.calculateTotalUnits(myCastles, myArmies);
        const enemyTotalUnits = this.calculateTotalUnits(enemyCastles, enemyArmies);
        
        return {
            myCastles: myCastles,
            myArmies: myArmies,
            enemyCastles: enemyCastles,
            enemyArmies: enemyArmies,
            myTotalUnits: myTotalUnits,
            enemyTotalUnits: enemyTotalUnits,
            militaryStrength: myTotalUnits / Math.max(1, enemyTotalUnits),
            castleAdvantage: myCastles.length / Math.max(1, enemyCastles.length),
            threats: this.identifyThreats(myCastles, myArmies, enemyArmies),
            opportunities: this.identifyOpportunities(myCastles, myArmies, enemyCastles, enemyArmies)
        };
    }
    
    /**
     * Update AI state based on situation
     * @param {Object} aiData - AI player data
     * @param {Object} situation - Current situation analysis
     */
    updateAIState(aiData, situation) {
        const { settings } = aiData;
        
        // Determine AI state based on situation and strategy
        if (situation.threats.length > 0) {
            aiData.state = 'defending';
        } else if (situation.militaryStrength > settings.attackThreshold && 
                   situation.opportunities.length > 0) {
            aiData.state = 'attacking';
        } else if (situation.castleAdvantage < 1) {
            aiData.state = 'expanding';
        } else {
            aiData.state = 'evaluating';
        }
    }
    
    /**
     * Execute attack strategy
     * @param {Object} aiData - AI player data
     * @param {Object} gameState - Current game state
     * @param {Object} situation - Situation analysis
     * @returns {Array} Attack actions
     */
    executeAttackStrategy(aiData, gameState, situation) {
        const actions = [];
        const { player, settings } = aiData;
        
        // Find best attack opportunities
        const targets = this.prioritizeTargets(situation.opportunities, settings);
        
        situation.myCastles.forEach(castle => {
            if (castle.unitCount > 15) { // Has enough units for attack
                const bestTarget = this.findBestTarget(castle, targets);
                if (bestTarget && Math.random() < settings.aggressiveness) {
                    actions.push({
                        type: 'send_army',
                        source: castle,
                        target: bestTarget,
                        percentage: 0.6 // Send 60% of units
                    });
                }
            }
        });
        
        return actions;
    }
    
    /**
     * Execute defense strategy
     * @param {Object} aiData - AI player data
     * @param {Object} gameState - Current game state
     * @param {Object} situation - Situation analysis
     * @returns {Array} Defense actions
     */
    executeDefenseStrategy(aiData, gameState, situation) {
        const actions = [];
        
        // Reinforce threatened positions
        situation.threats.forEach(threat => {
            const nearestCastle = this.findNearestCastle(threat.target, situation.myCastles);
            if (nearestCastle && nearestCastle.unitCount > 10) {
                actions.push({
                    type: 'send_army',
                    source: nearestCastle,
                    target: threat.target,
                    percentage: 0.7 // Send more units for defense
                });
            }
        });
        
        return actions;
    }
    
    /**
     * Execute expansion strategy
     * @param {Object} aiData - AI player data
     * @param {Object} gameState - Current game state
     * @param {Object} situation - Situation analysis
     * @returns {Array} Expansion actions
     */
    executeExpansionStrategy(aiData, gameState, situation) {
        const actions = [];
        
        // Focus on capturing weakest enemy castles
        const weakCastles = situation.enemyCastles
            .sort((a, b) => a.unitCount - b.unitCount)
            .slice(0, 2); // Target 2 weakest castles
            
        situation.myCastles.forEach(castle => {
            if (castle.unitCount > 20) {
                const target = weakCastles.find(t => t.unitCount < castle.unitCount * 0.8);
                if (target) {
                    actions.push({
                        type: 'send_army',
                        source: castle,
                        target: target,
                        percentage: 0.8 // Send most units for expansion
                    });
                }
            }
        });
        
        return actions;
    }
    
    /**
     * Execute evaluation strategy (default/idle)
     * @param {Object} aiData - AI player data
     * @param {Object} gameState - Current game state
     * @param {Object} situation - Situation analysis
     * @returns {Array} Evaluation actions
     */
    executeEvaluationStrategy(aiData, gameState, situation) {
        const actions = [];
        
        // Consolidate scattered armies
        if (situation.myArmies.length > 3) {
            const centralCastle = this.findCentralCastle(situation.myCastles);
            if (centralCastle) {
                situation.myArmies.forEach(army => {
                    if (army.unitCount < 10) { // Small armies
                        actions.push({
                            type: 'move_army',
                            army: army,
                            target: centralCastle
                        });
                    }
                });
            }
        }
        
        // Consider castle upgrades if player has enough resources
        if (aiData.player.resources.gold > 200) {
            const upgradeActions = this.considerCastleUpgrades(aiData, situation);
            actions.push(...upgradeActions);
        }
        
        return actions;
    }
    
    /**
     * Consider castle upgrades for AI player
     * @param {Object} aiData - AI player data
     * @param {Object} situation - Current situation analysis
     * @returns {Array} Upgrade actions
     */
    considerCastleUpgrades(aiData, situation) {
        const actions = [];
        const { player, settings } = aiData;
        
        situation.myCastles.forEach(castle => {
            // Prioritize upgrades based on AI personality
            const upgradeOptions = this.prioritizeUpgrades(castle, settings);
            
            for (const upgradeType of upgradeOptions) {
                const cost = castle.getUpgradeCost(upgradeType);
                
                if (player.canAfford(cost) && castle.upgrades[upgradeType] < 3) {
                    // AI has a chance to upgrade based on economic focus
                    const upgradeChance = settings.economicFocus * 0.5;
                    
                    if (Math.random() < upgradeChance) {
                        actions.push({
                            type: 'upgrade_castle',
                            castle: castle,
                            upgradeType: upgradeType
                        });
                        break; // Only one upgrade per castle per turn
                    }
                }
            }
        });
        
        return actions;
    }
    
    /**
     * Prioritize upgrades based on AI settings
     * @param {Object} castle - Castle to upgrade
     * @param {Object} settings - AI difficulty settings
     * @returns {Array} Prioritized upgrade types
     */
    prioritizeUpgrades(castle, settings) {
        const upgrades = [];
        
        if (settings.economicFocus > 0.6) {
            // Economic AI prioritizes production and capacity
            upgrades.push('production', 'capacity', 'defense');
        } else if (settings.aggressiveness > 0.6) {
            // Aggressive AI prioritizes defense and production
            upgrades.push('defense', 'production', 'capacity');
        } else {
            // Balanced AI
            upgrades.push('production', 'defense', 'capacity');
        }
        
        return upgrades;
    }
    
    /**
     * Calculate total units for castles and armies
     * @param {Array} castles - Array of castles
     * @param {Array} armies - Array of armies
     * @returns {number} Total unit count
     */
    calculateTotalUnits(castles, armies) {
        const castleUnits = castles.reduce((sum, castle) => sum + castle.unitCount, 0);
        const armyUnits = armies.reduce((sum, army) => sum + army.unitCount, 0);
        return castleUnits + armyUnits;
    }
    
    /**
     * Identify threats to AI player
     * @param {Array} myCastles - AI player's castles
     * @param {Array} myArmies - AI player's armies
     * @param {Array} enemyArmies - Enemy armies
     * @returns {Array} Array of threats
     */
    identifyThreats(myCastles, myArmies, enemyArmies) {
        const threats = [];
        
        enemyArmies.forEach(enemy => {
            if (enemy.isStationary) {
                // Check if enemy army threatens any of our positions
                const threatRange = 3; // Grid units
                
                [...myCastles, ...myArmies].forEach(myUnit => {
                    const distance = Math.sqrt(
                        Math.pow(enemy.x - myUnit.x, 2) + 
                        Math.pow(enemy.y - myUnit.y, 2)
                    );
                    
                    if (distance <= threatRange && enemy.unitCount > myUnit.unitCount * 0.8) {
                        threats.push({
                            source: enemy,
                            target: myUnit,
                            distance: distance,
                            priority: enemy.unitCount / myUnit.unitCount
                        });
                    }
                });
            }
        });
        
        return threats.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * Identify attack opportunities
     * @param {Array} myCastles - AI player's castles
     * @param {Array} myArmies - AI player's armies
     * @param {Array} enemyCastles - Enemy castles
     * @param {Array} enemyArmies - Enemy armies
     * @returns {Array} Array of opportunities
     */
    identifyOpportunities(myCastles, myArmies, enemyCastles, enemyArmies) {
        const opportunities = [];
        
        [...enemyCastles, ...enemyArmies].forEach(target => {
            const nearestSource = this.findNearestUnit(target, [...myCastles, ...myArmies]);
            
            if (nearestSource && nearestSource.unitCount > target.unitCount * 1.2) {
                opportunities.push({
                    target: target,
                    source: nearestSource,
                    advantage: nearestSource.unitCount / target.unitCount,
                    distance: Math.sqrt(
                        Math.pow(target.x - nearestSource.x, 2) + 
                        Math.pow(target.y - nearestSource.y, 2)
                    )
                });
            }
        });
        
        return opportunities.sort((a, b) => b.advantage - a.advantage);
    }
    
    /**
     * Find nearest unit to a target
     * @param {Object} target - Target position
     * @param {Array} units - Array of units to search
     * @returns {Object|null} Nearest unit or null
     */
    findNearestUnit(target, units) {
        let nearest = null;
        let shortestDistance = Infinity;
        
        units.forEach(unit => {
            const distance = Math.sqrt(
                Math.pow(target.x - unit.x, 2) + 
                Math.pow(target.y - unit.y, 2)
            );
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearest = unit;
            }
        });
        
        return nearest;
    }
    
    /**
     * Select AI strategy based on player and difficulty
     * @param {Player} player - AI player
     * @param {string} difficulty - Difficulty level
     * @returns {string} Strategy name
     */
    selectStrategy(player, difficulty) {
        const strategies = ['aggressive', 'defensive', 'economic', 'balanced'];
        
        // Select based on player settings or random
        if (player.settings && player.settings.economicFocus > 0.7) {
            return 'economic';
        } else if (player.settings && player.settings.aggressiveness > 0.7) {
            return 'aggressive';
        } else {
            return strategies[Math.floor(Math.random() * strategies.length)];
        }
    }
    
    /**
     * Prioritize targets based on AI settings
     * @param {Array} opportunities - Array of attack opportunities
     * @param {Object} settings - AI difficulty settings
     * @returns {Array} Prioritized targets
     */
    prioritizeTargets(opportunities, settings) {
        return opportunities
            .sort((a, b) => {
                // Sort by advantage (higher is better)
                const scoreA = a.advantage - (a.distance * 0.1);
                const scoreB = b.advantage - (b.distance * 0.1);
                return scoreB - scoreA;
            })
            .slice(0, 3); // Take top 3 targets
    }
    
    /**
     * Find best target for a specific castle
     * @param {Object} castle - Source castle
     * @param {Array} targets - Available targets
     * @returns {Object|null} Best target or null
     */
    findBestTarget(castle, targets) {
        if (!targets || targets.length === 0) return null;
        
        // Find closest target that this castle can handle
        let bestTarget = null;
        let bestScore = 0;
        
        targets.forEach(target => {
            const distance = Math.sqrt(
                Math.pow(target.target.x - castle.x, 2) + 
                Math.pow(target.target.y - castle.y, 2)
            );
            
            // Score based on advantage and distance (closer is better)
            const score = target.advantage / (distance + 1);
            
            if (score > bestScore && castle.unitCount > target.target.unitCount) {
                bestScore = score;
                bestTarget = target.target;
            }
        });
        
        return bestTarget;
    }
    
    /**
     * Find nearest castle to a target
     * @param {Object} target - Target object with x, y coordinates
     * @param {Array} castles - Array of castles to search
     * @returns {Object|null} Nearest castle or null
     */
    findNearestCastle(target, castles) {
        if (!castles || castles.length === 0) return null;
        
        let nearestCastle = null;
        let shortestDistance = Infinity;
        
        castles.forEach(castle => {
            const distance = Math.sqrt(
                Math.pow(target.x - castle.x, 2) + 
                Math.pow(target.y - castle.y, 2)
            );
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestCastle = castle;
            }
        });
        
        return nearestCastle;
    }
    
    /**
     * Find central castle (average position)
     * @param {Array} castles - Array of castles
     * @returns {Object|null} Central castle or null
     */
    findCentralCastle(castles) {
        if (!castles || castles.length === 0) return null;
        if (castles.length === 1) return castles[0];
        
        // Calculate center point
        const centerX = castles.reduce((sum, castle) => sum + castle.x, 0) / castles.length;
        const centerY = castles.reduce((sum, castle) => sum + castle.y, 0) / castles.length;
        
        // Find castle closest to center
        let centralCastle = castles[0];
        let shortestDistance = Infinity;
        
        castles.forEach(castle => {
            const distance = Math.sqrt(
                Math.pow(castle.x - centerX, 2) + 
                Math.pow(castle.y - centerY, 2)
            );
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                centralCastle = castle;
            }
        });
        
        return centralCastle;
    }
    
    /**
     * Remove AI player
     * @param {number} playerId - Player ID to remove
     */
    removeAIPlayer(playerId) {
        this.aiPlayers.delete(playerId);
    }
    
    /**
     * Get AI statistics
     * @returns {Object} AI system statistics
     */
    getStatistics() {
        return {
            activeAIPlayers: this.aiPlayers.size,
            lastUpdateTime: this.lastUpdateTime,
            updateInterval: this.updateInterval
        };
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AISystem;
}