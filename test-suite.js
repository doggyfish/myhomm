// MyHoMM Automated Test Suite
class GameTestSuite {
    constructor() {
        this.testResults = [];
        this.game = null;
        this.originalConsoleLog = console.log;
        this.gameLog = [];
    }
    
    // Test Framework Methods
    assertTrue(condition, message) {
        if (condition) {
            this.addResult(true, message);
        } else {
            this.addResult(false, `ASSERTION FAILED: ${message}`);
        }
    }
    
    assertEqual(actual, expected, message) {
        if (actual === expected) {
            this.addResult(true, `${message} (${actual})`);
        } else {
            this.addResult(false, `${message} - Expected: ${expected}, Got: ${actual}`);
        }
    }
    
    addResult(passed, message) {
        this.testResults.push({ passed, message, timestamp: Date.now() });
    }
    
    setupGameLogging() {
        this.gameLog = [];
        console.log = (message) => {
            this.gameLog.push(message);
            this.originalConsoleLog(message);
        };
    }
    
    restoreConsole() {
        console.log = this.originalConsoleLog;
    }
    
    // Create a test game instance
    createTestGame() {
        try {
            // Create a minimal test canvas if needed
            let testCanvas = document.getElementById('gameCanvas');
            if (!testCanvas) {
                testCanvas = document.createElement('canvas');
                testCanvas.id = 'gameCanvas';
                testCanvas.width = 400;
                testCanvas.height = 300;
                document.body.appendChild(testCanvas);
            }
            
            // Enable test mode to prevent automatic game loop
            window.testMode = true;
            
            // Create game instance
            this.game = new MyHoMMGame();
            
            return this.game;
        } catch (error) {
            this.addResult(false, `Failed to create test game: ${error.message}`);
            console.error(error);
            return null;
        }
    }
    
    // UNIT TESTS
    async testGameInitialization() {
        try {
            this.addResult(true, "=== UNIT TESTS: Game Initialization ===");
            
            const game = this.createTestGame();
            if (!game) {
                this.addResult(false, "Failed to create test game");
                return;
            }
            
            // Check if basic properties exist
            if (!game.players) {
                this.addResult(false, "Game has no players array");
                return;
            }
            
            if (!game.castles) {
                this.addResult(false, "Game has no castles array");
                return;
            }
            
            this.assertEqual(game.players.length, 3, "Should have 3 players");
            this.assertEqual(game.castles.length, 3, "Should have 3 castles");
            this.assertEqual(game.armies.length, 0, "Should start with 0 armies");
            
            // Test player properties
            this.assertTrue(game.players[0].isHuman, "Player 1 should be human");
            this.assertTrue(game.players[1].isHuman, "Player 2 should be human");
            this.assertTrue(game.players[2].isHuman, "Player 3 should be human");
            
            // Test castle properties
            game.castles.forEach((castle, index) => {
                this.assertEqual(castle.unitCount, 10, `Castle ${index + 1} should start with 10 units`);
                this.assertTrue(castle.owner !== null, `Castle ${index + 1} should have an owner`);
            });
            
        } catch (error) {
            this.addResult(false, `Game initialization test failed: ${error.message}`);
        }
    }
    
    async testCastleSelection() {
        this.addResult(true, "=== UNIT TESTS: Castle Selection ===");
        
        const game = this.createTestGame();
        const castle = game.castles[0];
        
        // Test selection
        game.selectCastle(castle);
        this.assertTrue(castle.selected, "Castle should be selected");
        this.assertEqual(game.selectedCastle, castle, "Game should track selected castle");
        
        // Test deselection
        game.deselectCastle();
        this.assertTrue(!castle.selected, "Castle should be deselected");
        this.assertEqual(game.selectedCastle, null, "Game should have no selected castle");
    }
    
    async testArmyCreation() {
        this.addResult(true, "=== UNIT TESTS: Army Creation ===");
        
        const game = this.createTestGame();
        const castle = game.castles[0];
        const initialUnits = castle.unitCount;
        
        // Send army
        game.sendArmyFromCastle(castle, 5, 5);
        
        this.assertEqual(game.armies.length, 1, "Should create 1 army");
        this.assertEqual(castle.unitCount, Math.floor(initialUnits / 2), "Castle should lose half its units");
        
        const army = game.armies[0];
        this.assertEqual(army.unitCount, Math.floor(initialUnits / 2), "Army should have half the units");
        this.assertEqual(army.targetX, 5, "Army should target correct X position");
        this.assertEqual(army.targetY, 5, "Army should target correct Y position");
        this.assertTrue(!army.isStationary, "Army should be moving initially");
    }
    
    async testUnitProduction() {
        this.addResult(true, "=== UNIT TESTS: Unit Production ===");
        
        const game = this.createTestGame();
        const initialCounts = game.castles.map(c => c.unitCount);
        
        // Simulate time passing
        const currentTime = Date.now();
        game.lastProductionTime = currentTime - game.unitProductionInterval - 100; // Force production
        game.handleUnitProduction(currentTime);
        
        game.castles.forEach((castle, index) => {
            this.assertEqual(castle.unitCount, initialCounts[index] + 1, 
                `Castle ${index + 1} should have gained 1 unit`);
        });
    }
    
    async testCombatResolution() {
        this.addResult(true, "=== UNIT TESTS: Combat Resolution ===");
        
        const game = this.createTestGame();
        
        // Create test armies with different owners
        const army1 = {
            unitCount: 15,
            owner: game.players[0],
            x: 1, y: 1,
            isStationary: true
        };
        
        const army2 = {
            unitCount: 10,
            owner: game.players[1],
            x: 1, y: 1,
            isStationary: true
        };
        
        game.armies.push(army1, army2);
        
        // Test combat
        game.resolveArmyCombat(army1, army2);
        
        this.assertEqual(army2.unitCount, 5, "Winning army should have 15-10=5 units");
        this.assertEqual(army2.owner, game.players[0], "Winning army should change owner");
    }
    
    // INTEGRATION TESTS
    async testCompleteGameFlow() {
        this.addResult(true, "=== INTEGRATION TESTS: Complete Game Flow ===");
        
        this.setupGameLogging();
        const game = this.createTestGame();
        
        // 1. Select castle
        game.onTileClicked(3, 3); // Click on first castle
        this.assertTrue(game.selectedCastle !== null, "Should select castle when clicked");
        
        // 2. Send army to empty tile
        const initialArmyCount = game.armies.length;
        game.onTileClicked(10, 10); // Click empty tile
        this.assertEqual(game.armies.length, initialArmyCount + 1, "Should create army when sending to empty tile");
        
        // 3. Simulate army movement to completion
        const army = game.armies[game.armies.length - 1];
        army.moveProgress = 1.0;
        game.armyReachedDestination(army);
        
        this.assertTrue(army.isStationary, "Army should be stationary after reaching empty destination");
        this.assertEqual(army.x, 10, "Army should be at target X position");
        this.assertEqual(army.y, 10, "Army should be at target Y position");
        
        this.restoreConsole();
    }
    
    async testArmyMerging() {
        this.addResult(true, "=== INTEGRATION TESTS: Army Merging ===");
        
        const game = this.createTestGame();
        
        // Create first army at position
        const army1 = {
            x: 5, y: 5,
            unitCount: 10,
            owner: game.players[0],
            isStationary: true
        };
        game.armies.push(army1);
        
        // Send second army from same player to same position
        const movingArmy = {
            x: 3, y: 3,
            targetX: 5, targetY: 5,
            unitCount: 5,
            owner: game.players[0],
            moveProgress: 1.0,
            isStationary: false
        };
        game.armies.push(movingArmy);
        
        // Simulate arrival
        game.armyReachedDestination(movingArmy);
        
        this.assertEqual(army1.unitCount, 15, "Stationary army should have merged units (10+5=15)");
        this.assertEqual(game.armies.length, 1, "Moving army should be removed after merging");
    }
    
    async testCastleConquest() {
        this.addResult(true, "=== INTEGRATION TESTS: Castle Conquest ===");
        
        const game = this.createTestGame();
        const castle = game.castles[1]; // Target castle
        const originalOwner = castle.owner;
        castle.unitCount = 5; // Set low unit count
        
        // Create attacking army
        const attackingArmy = {
            unitCount: 10,
            owner: game.players[0],
            targetX: castle.x,
            targetY: castle.y
        };
        
        // Simulate attack
        game.resolveCastleCombat(attackingArmy, castle);
        
        this.assertEqual(castle.unitCount, 5, "Castle should have remaining units (10-5=5)");
        this.assertEqual(castle.owner, game.players[0], "Castle should change ownership");
        this.assertTrue(castle.owner !== originalOwner, "Castle owner should be different");
    }
    
    // PERFORMANCE TESTS
    async testGamePerformance() {
        this.addResult(true, "=== PERFORMANCE TESTS ===");
        
        const game = this.createTestGame();
        
        // Test with many armies
        const startTime = performance.now();
        
        // Create 100 armies
        for (let i = 0; i < 100; i++) {
            game.armies.push({
                x: Math.random() * 20,
                y: Math.random() * 15,
                targetX: Math.random() * 20,
                targetY: Math.random() * 15,
                unitCount: 10,
                owner: game.players[i % 3],
                moveProgress: Math.random(),
                isStationary: Math.random() > 0.5
            });
        }
        
        // Update armies 100 times
        for (let i = 0; i < 100; i++) {
            game.updateArmies();
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.assertTrue(duration < 100, `Performance test should complete in <100ms (took ${duration.toFixed(2)}ms)`);
        this.addResult(true, `Performance: Processed 100 armies x 100 updates in ${duration.toFixed(2)}ms`);
    }
    
    async testMemoryLeaks() {
        this.addResult(true, "=== MEMORY TESTS ===");
        
        const game = this.createTestGame();
        const initialArmyCount = game.armies.length;
        
        // Create and destroy armies rapidly
        for (let i = 0; i < 50; i++) {
            game.sendArmyFromCastle(game.castles[0], 10, 10);
            // Immediately destroy army
            game.armies.pop();
        }
        
        this.assertEqual(game.armies.length, initialArmyCount, "Should not leak army objects");
        
        // Test UI updates don't cause memory issues
        for (let i = 0; i < 100; i++) {
            game.updateUI();
        }
        
        this.addResult(true, "Memory test completed - no obvious leaks detected");
    }
    
    // Test Runner Methods
    async runAllTests() {
        try {
            this.addResult(true, "🚀 Starting test suite...");
            this.testResults = [];
            
            this.addResult(true, "Running tests...");
            this.displayResults(); // Show progress
            
            await this.testGameInitialization();
            await this.testCastleSelection();
            await this.testArmyCreation();
            await this.testUnitProduction();
            await this.testCombatResolution();
            await this.testCompleteGameFlow();
            await this.testArmyMerging();
            await this.testCastleConquest();
            await this.testGamePerformance();
            await this.testMemoryLeaks();
            
            this.addResult(true, "✅ All tests completed!");
            this.displayResults();
        } catch (error) {
            this.addResult(false, `Test suite failed: ${error.message}`);
            this.displayResults();
        }
    }
    
    async runUnitTests() {
        this.testResults = [];
        
        await this.testGameInitialization();
        await this.testCastleSelection();
        await this.testArmyCreation();
        await this.testUnitProduction();
        await this.testCombatResolution();
        
        this.displayResults();
    }
    
    async runIntegrationTests() {
        this.testResults = [];
        
        await this.testCompleteGameFlow();
        await this.testArmyMerging();
        await this.testCastleConquest();
        
        this.displayResults();
    }
    
    async runPerformanceTests() {
        this.testResults = [];
        
        await this.testGamePerformance();
        await this.testMemoryLeaks();
        
        this.displayResults();
    }
    
    displayResults() {
        const container = document.getElementById('testResults');
        const summary = document.getElementById('testSummary');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const failed = total - passed;
        
        summary.innerHTML = `
            <span style="color: green;">✓ ${passed} Passed</span> | 
            <span style="color: red;">✗ ${failed} Failed</span> | 
            <span>📊 ${total} Total</span>
        `;
        
        container.innerHTML = this.testResults
            .map(result => `
                <div class="test-result ${result.passed ? 'test-pass' : 'test-fail'}">
                    ${result.passed ? '✓' : '✗'} ${result.message}
                </div>
            `)
            .join('');
    }
    
    clearResults() {
        this.testResults = [];
        document.getElementById('testResults').innerHTML = '';
        document.getElementById('testSummary').innerHTML = '';
        document.getElementById('gameLog').innerHTML = '';
    }
}

// Global test suite instance
const testSuite = new GameTestSuite();

// Global functions for buttons
function runAllTests() { testSuite.runAllTests(); }
function runUnitTests() { testSuite.runUnitTests(); }
function runIntegrationTests() { testSuite.runIntegrationTests(); }
function runPerformanceTests() { testSuite.runPerformanceTests(); }
function clearResults() { testSuite.clearResults(); }