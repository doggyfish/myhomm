/**
 * Phase 2 Feature Tests - AI System, Resource Management, Unit Types, Elimination
 */

class Phase2TestSuite {
    constructor() {
        this.testResults = [];
        this.originalConsoleLog = console.log;
    }
    
    // Test Helper Methods
    addResult(passed, message) {
        this.testResults.push({
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });
    }
    
    assertTrue(condition, message) {
        this.addResult(condition, message);
        if (!condition) {
            console.error(`❌ ASSERTION FAILED: ${message}`);
        }
    }
    
    assertEqual(actual, expected, message) {
        const passed = actual === expected;
        this.addResult(passed, `${message} - Expected: ${expected}, Got: ${actual}`);
        if (!passed) {
            console.error(`❌ ASSERTION FAILED: ${message} - Expected: ${expected}, Got: ${actual}`);
        }
    }
    
    createTestGame() {
        try {
            // Create minimal test environment
            let testCanvas = document.getElementById('gameCanvas');
            if (!testCanvas) {
                testCanvas = document.createElement('canvas');
                testCanvas.id = 'gameCanvas';
                testCanvas.width = 400;
                testCanvas.height = 300;
                document.body.appendChild(testCanvas);
            }
            
            window.testMode = true;
            const game = new Game('gameCanvas');
            
            // Ensure players have sufficient gold for testing
            game.players.forEach(player => {
                if (player.addGold) {
                    player.addGold(1000); // Give plenty of gold for testing
                }
            });
            
            return game;
        } catch (error) {
            console.error('Failed to create test game:', error);
            return null;
        }
    }
    
    // Phase 2 Feature Tests
    
    /**
     * Test Enhanced AI System with Personalities
     */
    async testAIPersonalitySystem() {
        this.addResult(true, "=== PHASE 2 TESTS: AI Personality System ===");
        
        const game = this.createTestGame();
        if (!game || !game.systems || !game.systems.ai) {
            this.addResult(false, "AI System not available for testing");
            return;
        }
        
        const aiSystem = game.systems.ai;
        
        // Test personality type definitions
        this.assertTrue(aiSystem.personalityTypes.hasOwnProperty('aggressive'), "Should have aggressive personality");
        this.assertTrue(aiSystem.personalityTypes.hasOwnProperty('defensive'), "Should have defensive personality");
        this.assertTrue(aiSystem.personalityTypes.hasOwnProperty('economic'), "Should have economic personality");
        
        // Test personality assignment
        const testPlayer = game.players.find(p => !p.isHuman);
        if (testPlayer) {
            aiSystem.registerAIPlayer(testPlayer, 'medium', 'aggressive');
            const aiData = aiSystem.aiPlayers.get(testPlayer.id);
            
            this.assertEqual(aiData.personality, 'aggressive', "AI should have assigned personality");
            this.assertTrue(aiData.personalityData.aggressiveness > 0.8, "Aggressive AI should have high aggressiveness");
            this.assertTrue(aiData.personalityData.economicFocus < 0.3, "Aggressive AI should have low economic focus");
        }
        
        // Test random personality selection
        const randomPersonality = aiSystem.selectRandomPersonality();
        this.assertTrue(Object.keys(aiSystem.personalityTypes).includes(randomPersonality), 
                      "Random personality should be valid");
    }
    
    /**
     * Test Resource Management System
     */
    async testResourceManagementSystem() {
        this.addResult(true, "=== PHASE 2 TESTS: Resource Management System ===");
        
        const game = this.createTestGame();
        if (!game || !game.players || game.players.length === 0) {
            this.addResult(false, "Cannot test resources - game not properly initialized");
            return;
        }
        
        const player = game.players[0];
        const initialGold = player.resources ? player.resources.gold : 0;
        
        // Test gold management
        if (player.addGold && player.spendGold && player.canAfford) {
            // Test adding gold
            player.addGold(100);
            this.assertEqual(player.resources.gold, initialGold + 100, "Should add gold correctly");
            
            // Test spending gold
            const spendResult = player.spendGold(50);
            this.assertTrue(spendResult, "Should be able to spend available gold");
            this.assertEqual(player.resources.gold, initialGold + 50, "Should deduct spent gold");
            
            // Test insufficient funds
            const insufficientResult = player.spendGold(player.resources.gold + 100);
            this.assertTrue(!insufficientResult, "Should not allow spending more than available");
            
            // Test canAfford check
            this.assertTrue(player.canAfford(10), "Should afford small amounts");
            this.assertTrue(!player.canAfford(player.resources.gold + 100), "Should not afford excessive amounts");
        }
        
        // Test castle gold production
        if (game.castles && game.castles.length > 0) {
            const castle = game.castles[0];
            const currentTime = Date.now();
            
            if (castle.updateGoldProduction) {
                const ownerInitialGold = castle.owner.resources.gold;
                castle.lastGoldTime = currentTime - 2000; // Force gold production
                castle.updateGoldProduction(currentTime);
                
                this.assertTrue(castle.owner.resources.gold > ownerInitialGold, 
                              "Castle should generate gold for owner");
            }
        }
    }
    
    /**
     * Test Multiple Unit Types System
     */
    async testMultipleUnitTypes() {
        this.addResult(true, "=== PHASE 2 TESTS: Multiple Unit Types System ===");
        
        const game = this.createTestGame();
        if (!game || !game.castles || game.castles.length === 0) {
            this.addResult(false, "Cannot test unit types - no castles available");
            return;
        }
        
        const castle = game.castles[0];
        
        // Test unit type definitions
        if (castle.unitTypes) {
            this.assertTrue(castle.unitTypes.hasOwnProperty('infantry'), "Should have infantry unit type");
            this.assertTrue(castle.unitTypes.hasOwnProperty('archers'), "Should have archers unit type");
            this.assertTrue(castle.unitTypes.hasOwnProperty('cavalry'), "Should have cavalry unit type");
            
            // Test different costs
            this.assertTrue(castle.unitTypes.infantry.cost < castle.unitTypes.archers.cost, 
                          "Infantry should cost less than archers");
            this.assertTrue(castle.unitTypes.archers.cost < castle.unitTypes.cavalry.cost, 
                          "Archers should cost less than cavalry");
            
            // Test different production times
            this.assertTrue(castle.unitTypes.infantry.productionTime < castle.unitTypes.cavalry.productionTime, 
                          "Infantry should produce faster than cavalry");
        }
        
        // Test unit production
        if (castle.produceUnitOfType) {
            const initialInfantry = castle.unitTypes.infantry.count || 0;
            castle.produceUnitOfType('infantry');
            
            if (castle.owner.resources.gold >= castle.unitTypes.infantry.cost) {
                this.assertTrue(castle.unitTypes.infantry.count > initialInfantry, 
                              "Should produce infantry unit if gold available");
            }
        }
        
        // Test army composition
        if (castle.calculateArmyComposition) {
            const composition = castle.calculateArmyComposition(10);
            
            this.assertTrue(composition.hasOwnProperty('infantry'), "Army composition should include infantry");
            this.assertTrue(composition.hasOwnProperty('archers'), "Army composition should include archers");
            this.assertTrue(composition.hasOwnProperty('cavalry'), "Army composition should include cavalry");
            
            const totalUnits = Object.values(composition).reduce((sum, count) => sum + count, 0);
            this.assertTrue(totalUnits <= 10, "Army composition should not exceed requested units");
        }
    }
    
    /**
     * Test Player Elimination System
     */
    async testPlayerEliminationSystem() {
        this.addResult(true, "=== PHASE 2 TESTS: Player Elimination System ===");
        
        const game = this.createTestGame();
        if (!game || !game.players || game.players.length === 0) {
            this.addResult(false, "Cannot test elimination - game not properly initialized");
            return;
        }
        
        // Test elimination method exists
        this.assertTrue(typeof game.eliminatePlayer === 'function', "Game should have eliminatePlayer method");
        
        if (game.eliminatePlayer) {
            const testPlayer = game.players[1]; // Use second player
            const initialArmyCount = game.armies.length;
            
            // Create test army for player
            if (typeof Army !== 'undefined') {
                const testArmy = new Army(5, 5, testPlayer, 10);
                game.armies.push(testArmy);
            }
            
            // Test elimination
            game.eliminatePlayer(testPlayer);
            
            // Check armies marked for removal
            const playerArmies = game.armies.filter(a => a.owner === testPlayer);
            playerArmies.forEach(army => {
                this.assertTrue(army.shouldBeRemoved, "Player armies should be marked for removal");
            });
            
            // Test AI system cleanup
            if (game.systems.ai && !testPlayer.isHuman) {
                const aiData = game.systems.ai.aiPlayers.get(testPlayer.id);
                this.assertTrue(!aiData, "Eliminated AI player should be removed from AI system");
            }
        }
        
        // Test win condition checking
        if (game.checkWinConditions) {
            // This should run without errors
            try {
                game.checkWinConditions();
                this.addResult(true, "Win condition checking should execute without errors");
            } catch (error) {
                this.addResult(false, `Win condition checking failed: ${error.message}`);
            }
        }
    }
    
    /**
     * Test Castle Upgrade System
     */
    async testCastleUpgradeSystem() {
        this.addResult(true, "=== PHASE 2 TESTS: Castle Upgrade System ===");
        
        const game = this.createTestGame();
        if (!game || !game.castles || game.castles.length === 0) {
            this.addResult(false, "Cannot test upgrades - no castles available");
            return;
        }
        
        const castle = game.castles[0];
        const player = castle.owner;
        
        // Test upgrade cost calculation
        if (castle.getUpgradeCost) {
            const productionCost = castle.getUpgradeCost('production');
            const defenseCost = castle.getUpgradeCost('defense');
            const capacityCost = castle.getUpgradeCost('capacity');
            
            this.assertTrue(productionCost > 0, "Production upgrade should have a cost");
            this.assertTrue(defenseCost > 0, "Defense upgrade should have a cost");
            this.assertTrue(capacityCost > 0, "Capacity upgrade should have a cost");
            
            // Test escalating costs
            castle.upgrades.production = 1;
            const higherCost = castle.getUpgradeCost('production');
            this.assertTrue(higherCost > productionCost, "Higher levels should cost more");
        }
        
        // Test upgrade functionality
        if (castle.upgrade && player.resources) {
            const initialGold = player.resources.gold;
            const initialLevel = castle.upgrades.production || 0;
            const upgradeCost = castle.getUpgradeCost('production');
            
            if (initialGold >= upgradeCost) {
                const upgradeResult = castle.upgrade('production');
                
                this.assertTrue(upgradeResult, "Upgrade should succeed with sufficient gold");
                this.assertEqual(castle.upgrades.production, initialLevel + 1, "Upgrade level should increase");
                this.assertTrue(player.resources.gold < initialGold, "Gold should be spent on upgrade");
            }
        }
    }
    
    /**
     * Test AI Decision Making with Resource Management
     */
    async testAIResourceManagement() {
        this.addResult(true, "=== PHASE 2 TESTS: AI Resource Management ===");
        
        const game = this.createTestGame();
        if (!game || !game.systems || !game.systems.ai) {
            this.addResult(false, "AI System not available for testing");
            return;
        }
        
        const aiSystem = game.systems.ai;
        const aiPlayer = game.players.find(p => !p.isHuman);
        
        if (aiPlayer) {
            // Register AI with economic personality
            aiSystem.registerAIPlayer(aiPlayer, 'medium', 'economic');
            const aiData = aiSystem.aiPlayers.get(aiPlayer.id);
            
            // Test upgrade consideration with sufficient gold
            aiPlayer.addGold(500);
            const gameState = {
                castles: game.castles,
                armies: game.armies,
                players: game.players
            };
            
            const situation = aiSystem.evaluateSituation(aiPlayer, gameState);
            const upgradeActions = aiSystem.considerCastleUpgrades(aiData, situation);
            
            // Economic AI should consider upgrades when having sufficient gold
            this.assertTrue(Array.isArray(upgradeActions), "Should return array of upgrade actions");
            
            // Test upgrade desirability calculation
            if (game.castles.length > 0) {
                const castle = game.castles.find(c => c.owner === aiPlayer);
                if (castle) {
                    const desirability = aiSystem.calculateUpgradeDesirability(
                        castle, 'production', aiData.personalityData, situation, aiData.settings
                    );
                    
                    this.assertTrue(desirability > 0, "Upgrade desirability should be positive");
                    this.assertTrue(desirability <= 2.0, "Upgrade desirability should be capped at 2.0");
                }
            }
        }
    }
    
    /**
     * Test Integration Between Systems
     */
    async testSystemIntegration() {
        this.addResult(true, "=== PHASE 2 TESTS: System Integration ===");
        
        const game = this.createTestGame();
        if (!game) {
            this.addResult(false, "Cannot test integration - game not available");
            return;
        }
        
        // Test game update with all systems
        try {
            const initialTime = Date.now();
            game.lastUpdateTime = initialTime - 100; // Force update
            
            game.update();
            
            this.addResult(true, "Game update should complete without errors");
        } catch (error) {
            this.addResult(false, `Game update failed: ${error.message}`);
        }
        
        // Test AI action execution
        if (game.executeAIActions) {
            const testActions = [
                {
                    type: 'upgrade_castle',
                    castle: game.castles[0],
                    upgradeType: 'production'
                }
            ];
            
            try {
                game.executeAIActions(testActions);
                this.addResult(true, "AI action execution should complete without errors");
            } catch (error) {
                this.addResult(false, `AI action execution failed: ${error.message}`);
            }
        }
        
        // Test win condition checking
        if (game.checkWinConditions) {
            try {
                game.checkWinConditions();
                this.addResult(true, "Win conditions check should execute without errors");
            } catch (error) {
                this.addResult(false, `Win conditions check failed: ${error.message}`);
            }
        }
        
        // Test AI system upgrade decision making
        if (game.systems.ai) {
            const aiPlayer = game.players.find(p => !p.isHuman);
            if (aiPlayer) {
                try {
                    const aiData = game.systems.ai.aiPlayers.get(aiPlayer.id);
                    if (aiData) {
                        const situation = game.systems.ai.evaluateSituation(aiPlayer, {
                            castles: game.castles,
                            armies: game.armies,
                            players: game.players
                        });
                        
                        const upgradeActions = game.systems.ai.considerCastleUpgrades(aiData, situation);
                        this.assertTrue(Array.isArray(upgradeActions), "AI should return upgrade actions array");
                        this.addResult(true, "AI upgrade decision system working correctly");
                    }
                } catch (error) {
                    this.addResult(false, `AI upgrade decision system failed: ${error.message}`);
                }
            }
        }
    }
    
    // Test Runner Methods
    
    async runPhase2Tests() {
        try {
            this.addResult(true, "🚀 Starting Phase 2 Test Suite...");
            this.testResults = [];
            
            await this.testAIPersonalitySystem();
            await this.testResourceManagementSystem();
            await this.testMultipleUnitTypes();
            await this.testPlayerEliminationSystem();
            await this.testCastleUpgradeSystem();
            await this.testAIResourceManagement();
            await this.testSystemIntegration();
            
            this.addResult(true, "✅ Phase 2 tests completed!");
            this.displayResults();
            return this.displayResults();
        } catch (error) {
            this.addResult(false, `Phase 2 test suite failed: ${error.message}`);
            this.displayResults();
            return this.displayResults();
        }
    }
    
    displayResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const failed = total - passed;
        
        console.log(`\n📊 Phase 2 Test Results: ${passed}/${total} tests passed`);
        
        if (failed > 0) {
            console.log(`❌ ${failed} tests failed:`);
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.message}`);
            });
        }
        
        console.log('\n📋 Detailed Test Results:');
        this.testResults.forEach(result => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.message}`);
        });
        
        // Summary report
        const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
        console.log(`\n🎯 Phase 2 Test Summary:`);
        console.log(`   • Success Rate: ${successRate}%`);
        console.log(`   • Passed: ${passed}`);
        console.log(`   • Failed: ${failed}`);
        console.log(`   • Total: ${total}`);
        
        return { passed, total, failed, successRate: parseFloat(successRate) };
    }
    
    // Helper method to run specific test categories
    async runAITests() {
        this.testResults = [];
        await this.testAIPersonalitySystem();
        await this.testAIResourceManagement();
        this.displayResults();
    }
    
    async runResourceTests() {
        this.testResults = [];
        await this.testResourceManagementSystem();
        await this.testCastleUpgradeSystem();
        this.displayResults();
    }
    
    async runGameplayTests() {
        this.testResults = [];
        await this.testMultipleUnitTypes();
        await this.testPlayerEliminationSystem();
        this.displayResults();
    }
}

// Global test runner function for Phase 2
if (typeof window !== 'undefined') {
    window.Phase2TestSuite = Phase2TestSuite;
    
    // Add global test runner function
    window.runPhase2Tests = async function() {
        const testSuite = new Phase2TestSuite();
        console.log('🚀 Running Phase 2 Test Suite...');
        const results = await testSuite.runPhase2Tests();
        console.log(`📊 Phase 2 Test Results: ${results.passed}/${results.total} tests passed`);
        return results;
    };
    
    // Add individual test category runners
    window.runPhase2AITests = async function() {
        const testSuite = new Phase2TestSuite();
        return await testSuite.runAITests();
    };
    
    window.runPhase2ResourceTests = async function() {
        const testSuite = new Phase2TestSuite();
        return await testSuite.runResourceTests();
    };
    
    window.runPhase2GameplayTests = async function() {
        const testSuite = new Phase2TestSuite();
        return await testSuite.runGameplayTests();
    };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Phase2TestSuite;
}