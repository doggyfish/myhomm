import Phaser from 'phaser';
import { CONFIG } from '../config/ConfigurationManager.js';

export default class GameSetupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameSetupScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game setup state
        this.gameConfig = {
            mapSize: 64,
            playerCount: 2,
            difficulty: 'normal'
        };

        // Title
        this.add.text(width / 2, 80, 'Game Setup', {
            font: '32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Create setup UI
        this.createMapSizeSelector(width / 2, 180);
        this.createPlayerCountSelector(width / 2, 280);
        this.createDifficultySelector(width / 2, 380);

        // Control buttons
        this.createButtons(width / 2, height - 100);
    }

    createMapSizeSelector(x, y) {
        const label = this.add.text(x, y - 30, 'Map Size', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const mapSizes = [
            { size: 32, label: 'Small (32x32)' },
            { size: 64, label: 'Medium (64x64)' },
            { size: 128, label: 'Large (128x128)' },
            { size: 256, label: 'Huge (256x256)' }
        ];

        this.mapSizeButtons = [];
        const buttonWidth = 140;
        const spacing = 150;
        const startX = x - (mapSizes.length - 1) * spacing / 2;

        mapSizes.forEach((mapSize, index) => {
            const buttonX = startX + index * spacing;
            const isSelected = mapSize.size === this.gameConfig.mapSize;
            
            const button = this.createSelectableButton(
                buttonX, y,
                buttonWidth, 40,
                mapSize.label,
                isSelected,
                () => this.selectMapSize(mapSize.size)
            );
            
            this.mapSizeButtons.push({ button, size: mapSize.size });
        });
    }

    createPlayerCountSelector(x, y) {
        const label = this.add.text(x, y - 30, 'Player Count', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.playerCountButtons = [];
        const buttonWidth = 60;
        const spacing = 70;
        const startX = x - (8 - 1) * spacing / 2;

        for (let i = 1; i <= 8; i++) {
            const buttonX = startX + (i - 1) * spacing;
            const isSelected = i === this.gameConfig.playerCount;
            
            const button = this.createSelectableButton(
                buttonX, y,
                buttonWidth, 40,
                i.toString(),
                isSelected,
                () => this.selectPlayerCount(i)
            );
            
            this.playerCountButtons.push({ button, count: i });
        }
    }

    createDifficultySelector(x, y) {
        const label = this.add.text(x, y - 30, 'Difficulty', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const difficulties = ['Easy', 'Normal', 'Hard'];
        this.difficultyButtons = [];
        const buttonWidth = 100;
        const spacing = 120;
        const startX = x - (difficulties.length - 1) * spacing / 2;

        difficulties.forEach((difficulty, index) => {
            const buttonX = startX + index * spacing;
            const isSelected = difficulty.toLowerCase() === this.gameConfig.difficulty;
            
            const button = this.createSelectableButton(
                buttonX, y,
                buttonWidth, 40,
                difficulty,
                isSelected,
                () => this.selectDifficulty(difficulty.toLowerCase())
            );
            
            this.difficultyButtons.push({ button, difficulty: difficulty.toLowerCase() });
        });
    }

    createSelectableButton(x, y, width, height, text, isSelected, callback) {
        const fillColor = isSelected ? 0x4a90e2 : 0x2c3e50;
        const strokeColor = isSelected ? 0x6bb2ff : 0x34495e;

        const button = this.add.rectangle(x, y, width, height, fillColor)
            .setStrokeStyle(2, strokeColor)
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => {
                if (!isSelected) {
                    button.setFillStyle(0x34495e);
                }
            })
            .on('pointerout', () => {
                if (!isSelected) {
                    button.setFillStyle(fillColor);
                }
            });

        const buttonText = this.add.text(x, y, text, {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        return { rect: button, text: buttonText };
    }

    createButtons(x, y) {
        // Start Game button
        const startButton = this.add.rectangle(x - 80, y, 140, 50, 0x27ae60)
            .setStrokeStyle(2, 0x2ecc71)
            .setInteractive()
            .on('pointerdown', () => this.startGame())
            .on('pointerover', () => startButton.setFillStyle(0x2ecc71))
            .on('pointerout', () => startButton.setFillStyle(0x27ae60));

        this.add.text(x - 80, y, 'Start Game', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Back button
        const backButton = this.add.rectangle(x + 80, y, 140, 50, 0x95a5a6)
            .setStrokeStyle(2, 0xbdc3c7)
            .setInteractive()
            .on('pointerdown', () => this.goBack())
            .on('pointerover', () => backButton.setFillStyle(0xbdc3c7))
            .on('pointerout', () => backButton.setFillStyle(0x95a5a6));

        this.add.text(x + 80, y, 'Back', {
            font: '16px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    selectMapSize(size) {
        this.gameConfig.mapSize = size;
        this.updateMapSizeButtons();
    }

    selectPlayerCount(count) {
        this.gameConfig.playerCount = count;
        this.updatePlayerCountButtons();
    }

    selectDifficulty(difficulty) {
        this.gameConfig.difficulty = difficulty;
        this.updateDifficultyButtons();
    }

    updateMapSizeButtons() {
        this.mapSizeButtons.forEach(({ button, size }) => {
            const isSelected = size === this.gameConfig.mapSize;
            button.rect.setFillStyle(isSelected ? 0x4a90e2 : 0x2c3e50);
            button.rect.setStrokeStyle(2, isSelected ? 0x6bb2ff : 0x34495e);
        });
    }

    updatePlayerCountButtons() {
        this.playerCountButtons.forEach(({ button, count }) => {
            const isSelected = count === this.gameConfig.playerCount;
            button.rect.setFillStyle(isSelected ? 0x4a90e2 : 0x2c3e50);
            button.rect.setStrokeStyle(2, isSelected ? 0x6bb2ff : 0x34495e);
        });
    }

    updateDifficultyButtons() {
        this.difficultyButtons.forEach(({ button, difficulty }) => {
            const isSelected = difficulty === this.gameConfig.difficulty;
            button.rect.setFillStyle(isSelected ? 0x4a90e2 : 0x2c3e50);
            button.rect.setStrokeStyle(2, isSelected ? 0x6bb2ff : 0x34495e);
        });
    }

    startGame() {
        console.log('Starting game with config:', this.gameConfig);
        
        // Set the game configuration for use by other systems
        CONFIG.set('game.mapSize', this.gameConfig.mapSize);
        CONFIG.set('game.playerCount', this.gameConfig.playerCount);
        CONFIG.set('game.difficulty', this.gameConfig.difficulty);
        
        // Start the game scene
        this.scene.start('GameScene');
    }

    showStartGameMessage() {
        // Create overlay
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.8
        );

        const message = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `Game would start with:\nMap: ${this.gameConfig.mapSize}x${this.gameConfig.mapSize}\nPlayers: ${this.gameConfig.playerCount}\nDifficulty: ${this.gameConfig.difficulty}\n\n(MainGameScene not implemented yet)\n\nClick to continue`,
            {
                font: '18px Arial',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);

        overlay.setInteractive().on('pointerdown', () => {
            overlay.destroy();
            message.destroy();
        });
    }

    goBack() {
        this.scene.start('MainMenuScene');
    }
}