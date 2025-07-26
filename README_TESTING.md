# MyHoMM - Automated Testing Guide

## 🧪 Test Suite Overview

Your HTML5 game now has a comprehensive automated testing system with a hybrid approach optimized for different testing scenarios:

### **Test File Structure:**

```
tests/
├── test-basic-browser.html     # 🎯 PRIMARY - Unified comprehensive test suite
├── specialized/
│   ├── test-mobile.html        # 📱 Mobile-specific deep testing
│   └── test-tactical.html      # ⚔️ Tactical systems deep testing
└── archive/
    ├── test-phase2.html        # 📦 Historical phase tests
    ├── test.html               # 📦 Legacy object-oriented test framework
    └── test-suite.js           # 📦 Legacy test suite class
```

### **Test Types Available:**

1. **Unit Tests** - Test individual game components
2. **Integration Tests** - Test complete game workflows  
3. **Performance Tests** - Benchmark game performance
4. **Cross-Browser Tests** - Ensure compatibility
5. **Memory Tests** - Check for memory leaks
6. **Platform-Aware Tests** - Conditional loading based on device type
7. **Advanced OOP Tests** - Object-oriented testing framework with assertions
8. **System Integration Tests** - End-to-end system validation

## 🚀 Quick Start

### **Primary Testing (95% of Use Cases)**

1. **Open `test-basic-browser.html`** in your browser
2. **Choose your test approach:**
   - **Quick Testing:** Click "Run All Tests" for standard test suite
   - **Advanced Testing:** Click "Run Advanced Tests" for OOP framework testing
   - **Specific Testing:** Click individual test buttons for targeted testing
3. **See results** immediately with visual feedback and detailed logging

### **Specialized Testing Scenarios**

#### **📱 Mobile Testing (`tests/specialized/test-mobile.html`)**

**How to run mobile tests:**

1. **Option 1: Desktop Browser Simulation** (Easiest)
   - Open `tests/specialized/test-mobile.html` in any desktop browser
   - Click "Initialize Mobile Test" 
   - Tests will run in desktop mobile simulation mode
   - Use browser dev tools (F12) > Device Toolbar to simulate touch events

2. **Option 2: Real Mobile Device** (Most Accurate)
   - Serve the test file using a local server:
     ```bash
     # Simple Python server
     python3 -m http.server 8080
     # Or using Node.js
     npx serve .
     ```
   - Navigate to `http://[your-ip]:8080/tests/specialized/test-mobile.html` on mobile device
   - Click "Initialize Mobile Test"

**What mobile tests cover:**
- ✅ Touch control validation
- ✅ Performance optimization testing  
- ✅ Mobile UI responsiveness
- ✅ Mobile-specific features
- ✅ Cross-platform compatibility

#### **⚔️ Tactical Testing (`tests/specialized/test-tactical.html`)**

**How to run tactical tests:**

1. Open `tests/specialized/test-tactical.html` in any desktop browser
2. Click "Initialize Tactical Test"
3. Tests will verify tactical system availability and functionality

**What tactical tests cover:**
- ✅ Formation system mechanics
- ✅ Terrain and weather effects
- ✅ Advanced combat calculations
- ✅ Castle specialization features
- ✅ Tactical UI components

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

### **Platform-Aware Testing System:**
- **Desktop Mode:** Mobile systems are correctly NOT loaded (tests pass when absent)
- **Mobile Mode:** Full mobile system functionality is tested
- **Conditional Loading:** Tests validate proper platform detection

### **Specialized Mobile Testing:**
Use `tests/specialized/test-mobile.html` for:
- **Real mobile device testing** with optimized styling
- **Touch event validation** in actual mobile browsers  
- **Performance testing** under mobile constraints
- **Mobile-specific UI** testing

## 🎯 Test File Usage Guidelines

### **Use `test-basic-browser.html` for:**
- ✅ Daily development testing
- ✅ CI/CD automated testing  
- ✅ Quick feature verification
- ✅ Cross-platform compatibility checks
- ✅ Platform-aware mobile system validation
- ✅ Advanced OOP testing with assertions
- ✅ Performance benchmarking
- ✅ Comprehensive system integration testing

### **Use specialized test files for:**
- 📱 **`tests/specialized/test-mobile.html`:** Real mobile device testing, touch optimization
- ⚔️ **`tests/specialized/test-tactical.html`:** Complex tactical feature development  
- 📦 **`tests/archive/`:** Historical phase-specific tests

### **Benefits of This Structure:**
- **Unified Testing:** One comprehensive file for 95% of testing needs
- **Dual Framework:** Both functional and OOP testing approaches in one place
- **Legacy Preserved:** Historical test frameworks archived but accessible
- **Specialization:** Focused environments for specific testing scenarios  
- **Maintainability:** Clear separation of concerns with no duplication
- **Performance:** Optimized load for routine testing
- **Flexibility:** Choose appropriate test framework and environment for the task

## 🛠️ Troubleshooting Specialized Tests

### **Common Issues and Solutions:**

#### **Mobile Tests Not Working:**

**Issue**: "❌ Game creation failed" or missing classes
**Solutions:**
1. Check browser console (F12) for specific error messages
2. Ensure all script files loaded without 404 errors
3. Verify you're accessing via `http://` (not `file://`) for proper script loading
4. Try refreshing the page and re-running initialization

**Issue**: Touch events not working in desktop browser
**Solutions:**
1. Open browser dev tools (F12)
2. Click the device toolbar icon (mobile/tablet icon)
3. Select a mobile device or set responsive mode
4. Touch events will now be simulated

#### **Tactical Tests Not Working:**

**Issue**: "❌ Missing tactical classes"
**Solutions:**
1. Check that all tactical system files exist in `src/tactical/`
2. Verify import paths are correct (`../../src/tactical/...`)
3. Ensure Phase 4 tactical systems are implemented

#### **General Test Issues:**

**Issue**: White screen or no content
**Solutions:**
1. Check browser console for JavaScript errors
2. Ensure you're serving files via HTTP (use local server)
3. Verify all CSS and JS files are loading correctly

**Issue**: Tests show warnings instead of success
**Solutions:**
- This is normal! Tests gracefully degrade when optional systems aren't available
- Warnings indicate fallback behavior is working correctly
- Only errors indicate actual problems

### **Browser Compatibility:**

**Supported Browsers:**
- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Mobile Browsers:**
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile
- ✅ Samsung Internet

### **Performance Tips:**

**For Mobile Testing:**
- Use actual mobile devices when possible for most accurate results
- Desktop simulation is good for development but not 100% accurate
- Test on various screen sizes and orientations

**For Tactical Testing:**
- Ensure sufficient system resources for complex calculations
- Close other browser tabs during performance testing
- Use incognito/private browsing to avoid extension interference

Your game is now fully tested and ready for production! 🚀