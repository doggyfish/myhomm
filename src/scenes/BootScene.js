import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load essential boot assets (none needed for now)
        console.log('BootScene: Initializing game configuration...');
    }

    create() {
        // Initialize game configuration
        console.log('BootScene: Boot complete, starting preloader...');
        
        // Transition to preloader scene
        this.scene.start('PreloaderScene');
    }
}