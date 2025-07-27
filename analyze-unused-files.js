/**
 * Script to analyze and identify unused files in MyHoMM project
 * after migration to enhanced Phaser 3 solution
 */

const fs = require('fs');
const path = require('path');

// Files that are actively used in the enhanced Phaser 3 solution
const ACTIVE_FILES = [
    // Enhanced Phaser 3 implementation
    'index-enhanced-phaser.html',
    'test-complete-migration.html',
    
    // Core configuration
    'src/config/EnhancedGameConfig.js',
    'src/config/GameConfig.js',
    
    // Enhanced entities
    'src/entities/Player.js',
    'src/entities/Castle.js', 
    'src/entities/EnhancedArmy.js',
    
    // Enhanced systems
    'src/systems/EnhancedSystems.js',
    
    // Enhanced scenes
    'src/scenes/EnhancedMainGameScene.js',
    'src/scenes/HUDScene.js',
    
    // Documentation
    'CLAUDE.md',
    'README.md',
    'phase5_plan.md',
    'PHASE3_IMPLEMENTATION_COMPLETE.md',
    'PHASE1_COMPLETION_SUMMARY.md'
];

// Files that are now obsolete/replaced in enhanced solution
const OBSOLETE_FILES = [
    // Original vanilla JS implementation (replaced by enhanced Phaser 3)
    'src/core/Game.js',
    'src/core/PlatformDetector.js', 
    'src/core/SystemLoader.js',
    'src/main.js',
    
    // Original entities (replaced by enhanced versions)
    'src/entities/Army.js',
    
    // Original systems (replaced by EnhancedSystems.js)
    'src/systems/GameManager.js',
    'src/systems/CombatSystem.js',
    'src/systems/ProductionSystem.js',
    'src/systems/AISystem.js',
    'src/systems/MovementSystem.js',
    
    // Original scenes (replaced by enhanced versions)
    'src/scenes/MainGameScene.js',
    
    // Original UI system (replaced by Phaser 3 built-in)
    'src/ui/InputHandler.js',
    'src/ui/Renderer.js',
    
    // Mobile systems (integrated into EnhancedSystems.js)
    'src/mobile/MobileGameManager.js',
    'src/mobile/MobileOptimizer.js',
    'src/mobile/MobilePerformanceManager.js',
    'src/mobile/MobileUIManager.js',
    'src/mobile/TouchManager.js',
    'src/mobile/MobileCombatSystem.js',
    
    // Tactical systems (integrated into EnhancedSystems.js)
    'src/tactical/TacticalCombatSystem.js',
    'src/tactical/TacticalUIManager.js',
    'src/tactical/CastleSpecializationSystem.js',
    'src/tactical/tactical-ui-styles.css',
    
    // Utility files (functionality moved to enhanced classes)
    'src/utils/GameUtils.js',
    'src/utils/GridUtils.js',
    
    // Old HTML files (replaced by enhanced version)
    'index.html',
    'index-phaser.html',
    'test-phaser.html',
    'test-phaser-debug.html',
    'test-basic-browser.html',
    
    // Old test files (replaced by comprehensive test)
    'tests/phase2-tests.js',
    'tests/specialized/test-mobile.html',
    'tests/specialized/test-tactical.html',
    'tests/archive/test-phase2.html',
    'tests/archive/test-suite.js',
    'tests/archive/test.html',
    'verify-phase2.js',
    'ci-test.js',
    
    // Legacy backup files
    'game.js.backup',
    
    // Outdated documentation
    'PHASE2_PLAN.md',
    'PHASE3_PLAN.md',
    'phase4_plan.md',
    'ARCHITECTURE.md',
    'GAME_DESIGN.md',
    'IMPROVEMENT_GUIDE.md',
    'PLATFORM_SYSTEM.md',
    'README_TESTING.md'
];

// Generate analysis report
function generateReport() {
    const report = {
        timestamp: new Date().toISOString(),
        analysis: {
            activeFiles: ACTIVE_FILES.length,
            obsoleteFiles: OBSOLETE_FILES.length,
            totalFiles: ACTIVE_FILES.length + OBSOLETE_FILES.length
        },
        activeFiles: ACTIVE_FILES,
        obsoleteFiles: OBSOLETE_FILES,
        archiveRecommendations: {
            createArchiveFolder: true,
            moveObsoleteFiles: true,
            keepDocumentationForReference: true
        }
    };
    
    return report;
}

console.log('📁 MyHoMM File Usage Analysis');
console.log('==============================');

const report = generateReport();

console.log(`📊 Analysis Summary:`);
console.log(`   Active files: ${report.analysis.activeFiles}`);
console.log(`   Obsolete files: ${report.analysis.obsoleteFiles}`);
console.log(`   Total analyzed: ${report.analysis.totalFiles}`);

console.log(`\n✅ Active Files (Enhanced Phaser 3 Solution):`);
report.activeFiles.forEach(file => console.log(`   ${file}`));

console.log(`\n📦 Obsolete Files (Ready for Archive):`);
report.obsoleteFiles.forEach(file => console.log(`   ${file}`));

console.log(`\n💡 Recommendations:`);
console.log(`   1. Create 'archive/' folder for obsolete files`);
console.log(`   2. Move obsolete files to archive for reference`);
console.log(`   3. Keep some documentation files for historical reference`);
console.log(`   4. Update any remaining references to point to enhanced files`);

// Export report
module.exports = report;