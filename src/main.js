import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloaderScene from './scenes/PreloaderScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameSetupScene from './scenes/GameSetupScene.js';
import GameScene from './scenes/GameScene.js';

// Game configuration with scene management
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
    scene: [
        BootScene,
        PreloaderScene,
        MainMenuScene,
        GameSetupScene,
        GameScene
    ]
};

console.log('Starting RTS Game...');

// Add error handling
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    document.body.innerHTML += '<div style="color: red; font-family: monospace; padding: 20px;">JavaScript Error: ' + event.error.message + '</div>';
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    document.body.innerHTML += '<div style="color: red; font-family: monospace; padding: 20px;">Promise Error: ' + event.reason + '</div>';
});

// Initialize the game
const game = new Phaser.Game(config);

// Add game event listeners for debugging
game.events.on('ready', () => {
    console.log('Phaser game ready!');
});

game.events.on('destroy', () => {
    console.log('Phaser game destroyed');
});

// Export for potential use in other modules
export default game;