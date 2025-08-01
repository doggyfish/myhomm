import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game title
        this.add.text(width / 2, height / 4, 'RTS Game', {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 4 + 60, 'Heroes of Might & Magic + Red Alert', {
            font: '20px Arial',
            fill: '#ecf0f1'
        }).setOrigin(0.5);

        // Menu buttons
        this.createButton(width / 2, height / 2, 'New Game', () => {
            console.log('Starting GameSetupScene...');
            this.scene.start('GameSetupScene');
        });

        this.createButton(width / 2, height / 2 + 80, 'Load Game', () => {
            console.log('Load Game clicked - Not implemented yet');
        });

        this.createButton(width / 2, height / 2 + 160, 'Settings', () => {
            console.log('Settings clicked - Not implemented yet');
        });

        this.createButton(width / 2, height / 2 + 240, 'Exit', () => {
            console.log('Exit clicked');
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.rectangle(x, y, 200, 50, 0x2c3e50)
            .setStrokeStyle(2, 0x34495e)
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => button.setFillStyle(0x34495e))
            .on('pointerout', () => button.setFillStyle(0x2c3e50));

        this.add.text(x, y, text, {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        return button;
    }
}