/**
 * Main entry point for MyHoMM Phaser 3 Version
 */

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting MyHoMM Phaser 3...');
    
    // Check if all required classes are available
    if (typeof GameConfig === 'undefined') {
        console.error('❌ GameConfig not loaded');
        return;
    }
    if (typeof MainGameScene === 'undefined') {
        console.error('❌ MainGameScene not loaded');
        return;
    }
    if (typeof HUDScene === 'undefined') {
        console.error('❌ HUDScene not loaded');
        return;
    }
    
    console.log('✅ All classes loaded successfully');
    
    // Create Phaser game instance
    const config = {
        ...GameConfig,
        scene: [MainGameScene, HUDScene]
    };
    
    console.log('🎮 Creating Phaser game with config:', config);
    
    const game = new Phaser.Game(config);
    
    // Store game instance globally
    window.game = game;
    
    console.log('✅ MyHoMM Phaser 3 initialized');
    
    // Debug commands
    window.debug = {
        addCastle: () => {
            const scene = game.scene.scenes[0];
            if (scene && scene.addRandomCastle) {
                scene.addRandomCastle();
            }
        },
        resetCamera: () => {
            const scene = game.scene.scenes[0];
            if (scene && scene.resetCamera) {
                scene.resetCamera();
            }
        }
    };
});