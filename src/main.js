import Phaser from 'phaser';

// Basic game configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
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
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create
    }
};

// Placeholder preload function
function preload() {
    // Create a simple colored rectangle for testing
    this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
}

// Placeholder create function
function create() {
    // Add some text to verify the game is working
    this.add.text(512, 384, 'RTS Game - Phaser 3 Ready!', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.add.text(512, 450, 'Project structure initialized successfully', {
        fontSize: '16px',
        fill: '#ecf0f1',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
}

// Initialize the game
const game = new Phaser.Game(config);

// Export for potential use in other modules
export default game;