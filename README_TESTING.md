# MyHoMM - Automated Testing Guide

## 🧪 Test Suite Overview

Your HTML5 game now has a comprehensive automated testing system with multiple testing approaches:

### **Test Types Available:**

1. **Unit Tests** - Test individual game components
2. **Integration Tests** - Test complete game workflows  
3. **Performance Tests** - Benchmark game performance
4. **Cross-Browser Tests** - Ensure compatibility
5. **Memory Tests** - Check for memory leaks

## 🚀 Quick Start

### **Browser-Based Testing (Easiest)**

1. **Open `test.html`** in your browser
2. **Click "Run All Tests"** button
3. **See results** immediately with visual feedback

### **Command Line Testing (CI/CD)**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run all tests:**
   ```bash
   npm test
   ```

3. **Run with cross-browser testing:**
   ```bash
   npm run test:browser
   ```

## 📋 Test Categories

### **Unit Tests**
- ✅ Game initialization (3 players, 3 castles)
- ✅ Castle selection/deselection
- ✅ Army creation and movement
- ✅ Unit production timing
- ✅ Combat resolution logic

### **Integration Tests**  
- ✅ Complete game flow (select → send → combat)
- ✅ Army merging (friendly armies combine)
- ✅ Castle conquest (army takes over castle)
- ✅ Empty tile positioning (armies stay put)

### **Performance Tests**
- ✅ 100 armies × 100 updates performance
- ✅ Memory leak detection
- ✅ UI update performance
- ✅ Benchmark timing

## 🎯 What Each Test Validates

### **Core Game Mechanics:**
```javascript
// Tests that armies stay in empty cells
testCompleteGameFlow() 
  → Click castle → Click empty tile → Army stays there ✅

// Tests that armies merge when sent to same position  
testArmyMerging()
  → Send army to existing friendly army → Numbers combine ✅

// Tests castle takeover mechanics
testCastleConquest() 
  → Attack enemy castle → Winner takes control ✅
```

### **Performance Benchmarks:**
- **Target**: <100ms for 100 armies × 100 updates
- **Memory**: No object leaks after army creation/destruction
- **UI**: Smooth updates even with many game objects

## 🔧 Running Specific Tests

### **In Browser:**
- **Unit Tests Only**: Click "Unit Tests Only"
- **Integration Tests**: Click "Integration Tests Only"  
- **Performance**: Click "Performance Tests"

### **Command Line:**
```bash
# Run specific test categories
node ci-test.js                    # All tests
node ci-test.js --cross-browser   # Cross-browser testing
```

## 📊 Test Results Format

### **Browser Output:**
```
✓ 15 Passed | ✗ 0 Failed | 📊 15 Total

✓ Should have 3 players (3)
✓ Should have 3 castles (3)  
✓ Castle should be selected
✓ Army established position at 10, 10
✓ Performance: Processed 100 armies x 100 updates in 45.23ms
```

### **CI Output:**
```bash
🚀 Starting automated test suite...
✅ Test page loaded
🧪 Running all automated tests...

📊 Test Results:
==================================================
✓ 15 Passed | ✗ 0 Failed | 📊 15 Total  
==================================================
✅ Should have 3 players (3)
✅ Should have 3 castles (3)
✅ Army established position at 10, 10
==================================================
Final Result: 15 passed, 0 failed

🏁 Testing complete. Exit code: 0
```

## 🔄 Continuous Integration

### **GitHub Actions Example:**
```yaml
name: Test MyHoMM Game
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

### **Local Development:**
```bash
# Watch for changes and re-run tests
npm run test:watch

# Serve game locally for testing
npm run serve
```

## 🐛 Debugging Failed Tests

### **Common Issues:**
1. **"Should have 3 castles" fails** → Check game initialization
2. **"Army established position" fails** → Check army movement logic
3. **Performance tests fail** → Optimize game loop or increase timeout

### **Debug Tips:**
- **Open `test.html`** in browser to see visual test results
- **Check browser console** for JavaScript errors
- **Use browser dev tools** to step through test execution

## 📈 Adding New Tests

### **Add Unit Test:**
```javascript
async testNewFeature() {
    this.addResult(true, "=== UNIT TESTS: New Feature ===");
    
    const game = this.createTestGame();
    // Test your feature
    this.assertTrue(condition, "Feature should work");
}
```

### **Add Integration Test:**
```javascript
async testCompleteWorkflow() {
    this.addResult(true, "=== INTEGRATION: Complete Workflow ===");
    
    const game = this.createTestGame();
    // Test complete user workflow
    game.onTileClicked(3, 3); // Simulate clicks
    // Assert expected results
}
```

## 🎮 Test Game Features

The test suite validates all your core game mechanics:

- ✅ **Real-time unit production** (1 unit/second)
- ✅ **Army positioning** (stay in empty cells)  
- ✅ **Army reinforcement** (merge friendly armies)
- ✅ **Army vs army combat** (higher wins)
- ✅ **Castle conquest** (armies take over castles)
- ✅ **Movement system** (instant positioning)

## 📱 Mobile Testing

The tests work on mobile browsers too:
- **Touch events** are automatically tested
- **Responsive layout** is validated
- **Performance** is measured on mobile devices

Your game is now fully tested and ready for production! 🚀