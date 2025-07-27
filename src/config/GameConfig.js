/**
 * Phaser 3 Game Configuration for MyHoMM
 * Defines all game settings and initialization parameters
 */

const GameConfig = {
    // Core Phaser settings
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'gameContainer',
    backgroundColor: '#2d2d2d',
    
    // Physics (optional for RTS)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    
    // Scene configuration (will be set in main.js)
    scene: [],
    
    // Input settings
    input: {
        mouse: true,
        touch: true,
        keyboard: true,
        gamepad: false
    },
    
    // Rendering settings
    render: {
        antialias: true,
        pixelArt: false,
        transparent: false
    },
    
    // Scale configuration for responsive design
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 800,
            height: 600
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    
    // Audio settings
    audio: {
        disableWebAudio: false
    }
};

// Game-specific settings
const MyHoMMConfig = {
    // Map settings
    map: {
        tileSize: 40,
        defaultWidth: 32,
        defaultHeight: 32,
        minSize: 19,
        maxSize: 256
    },
    
    // Unit settings
    units: {
        productionInterval: 1000, // 1 second
        maxUnitsPerCastle: 999,
        movementSpeed: 200 // pixels per second
    },
    
    // Camera settings
    camera: {
        zoomMin: 0.25,
        zoomMax: 3.0,
        zoomDefault: 1.0,
        panSpeed: 400,
        zoomSpeed: 0.1,
        smoothing: 0.1
    },
    
    // Combat settings
    combat: {
        instant: true,
        animation: false,
        damageVariance: 0.1
    },
    
    // Player settings
    players: {
        human: {
            color: 0x4CAF50, // Green
            name: 'Human Player'
        },
        ai: {
            color: 0xF44336, // Red
            name: 'AI Player',
            difficulty: 'medium'
        }
    },
    
    // Performance settings
    performance: {
        maxEntitiesVisible: 1000,
        cullingEnabled: true,
        batchingEnabled: true,
        debugMode: false
    }
};

// Export configurations
window.GameConfig = GameConfig;
window.MyHoMMConfig = MyHoMMConfig;

console.log('🎮 Game configuration loaded');