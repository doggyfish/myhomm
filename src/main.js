import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { GAME_CONFIG } from './config/GameConfig.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

// Initialize game
const game = new Phaser.Game(config);

// Export for testing
window.game = game;
