import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig.js';
import { MapGenerator } from '../systems/MapGenerator.js';
import { MovementSystem } from '../systems/MovementSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.map = null;
    this.selectedCastle = null;
    this.movementSystem = new MovementSystem();
    this.graphics = null;
    this.uiText = null;
  }

  create() {
    // Generate map
    this.map = MapGenerator.generateMap(GAME_CONFIG.DEFAULT_MAP_SIZE);

    // Create graphics object for rendering
    this.graphics = this.add.graphics();

    // Setup camera
    this.cameras.main.setBounds(
      0,
      0,
      GAME_CONFIG.DEFAULT_MAP_SIZE * GAME_CONFIG.TILE_SIZE,
      GAME_CONFIG.DEFAULT_MAP_SIZE * GAME_CONFIG.TILE_SIZE,
    );
    this.cameras.main.setZoom(0.8);

    // Create UI text
    this.uiText = this.add.text(10, 10, '', {
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    this.uiText.setScrollFactor(0);

    // Setup input handling
    this.input.on('pointerdown', this.handleClick, this);

    // Start game loop
    this.updateProduction();
  }

  update(time, delta) {
    // Update movement system
    this.movementSystem.update(delta, this.map);

    // Render the game
    this.render();

    // Update UI
    this.updateUI();
  }

  handleClick(pointer) {
    const { worldX } = pointer;
    const { worldY } = pointer;
    const tileX = Math.floor(worldX / GAME_CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldY / GAME_CONFIG.TILE_SIZE);

    // Validate click position
    if (tileX < 0 || tileX >= GAME_CONFIG.DEFAULT_MAP_SIZE
        || tileY < 0 || tileY >= GAME_CONFIG.DEFAULT_MAP_SIZE) {
      return;
    }

    const clickedTile = this.map[tileY][tileX];

    if (!this.selectedCastle) {
      // First click - select castle
      if (clickedTile.castle) {
        this.selectedCastle = clickedTile.castle;
        console.log(`Selected castle at (${tileX}, ${tileY}) with ${this.selectedCastle.unitCount} units`);
      }
    } else {
      // Second click - move units
      if (clickedTile.isPassable()) {
        const unitCount = Math.floor(this.selectedCastle.unitCount / 2) || 1;
        const success = this.movementSystem.moveUnits(
          this.map,
          this.selectedCastle.x,
          this.selectedCastle.y,
          tileX,
          tileY,
          unitCount,
        );

        if (success) {
          console.log(`Moved ${unitCount} units from (${this.selectedCastle.x}, ${this.selectedCastle.y}) to (${tileX}, ${tileY})`);
        } else {
          console.log('Movement failed - no valid path or insufficient units');
        }
      } else {
        console.log('Cannot move to impassable tile');
      }

      // Deselect castle
      this.selectedCastle = null;
    }
  }

  render() {
    this.graphics.clear();

    // Render tiles
    for (let y = 0; y < GAME_CONFIG.DEFAULT_MAP_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.DEFAULT_MAP_SIZE; x++) {
        const tile = this.map[y][x];
        const pixelX = x * GAME_CONFIG.TILE_SIZE;
        const pixelY = y * GAME_CONFIG.TILE_SIZE;

        // Draw tile
        this.graphics.fillStyle(tile.type.color);
        this.graphics.fillRect(pixelX, pixelY, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);

        // Draw castle
        if (tile.castle) {
          const faction = GAME_CONFIG.FACTIONS[tile.castle.factionId];
          this.graphics.fillStyle(faction.color);

          // Draw castle as a larger square
          const castleSize = GAME_CONFIG.TILE_SIZE * 0.8;
          const castleOffset = (GAME_CONFIG.TILE_SIZE - castleSize) / 2;
          this.graphics.fillRect(
            pixelX + castleOffset,
            pixelY + castleOffset,
            castleSize,
            castleSize,
          );

          // Highlight selected castle
          if (this.selectedCastle === tile.castle) {
            this.graphics.lineStyle(3, 0xFFFFFF);
            this.graphics.strokeRect(
              pixelX + castleOffset - 2,
              pixelY + castleOffset - 2,
              castleSize + 4,
              castleSize + 4,
            );
          }
        }

        // Draw units on tile
        if (tile.units.length > 0) {
          const totalUnits = tile.units.reduce((sum, unit) => sum + unit.count, 0);
          if (totalUnits > 0) {
            const primaryUnit = tile.units[0];
            const faction = GAME_CONFIG.FACTIONS[primaryUnit.factionId];

            this.graphics.fillStyle(faction.color);
            const unitSize = GAME_CONFIG.TILE_SIZE * 0.3;
            const unitOffset = (GAME_CONFIG.TILE_SIZE - unitSize) / 2;
            this.graphics.fillCircle(
              pixelX + unitOffset + unitSize / 2,
              pixelY + unitOffset + unitSize / 2,
              unitSize / 2,
            );
          }
        }
      }
    }

    // Render moving units
    const movingUnits = this.movementSystem.getMovingUnits();
    movingUnits.forEach((unit) => {
      const faction = GAME_CONFIG.FACTIONS[unit.factionId];
      this.graphics.fillStyle(faction.color);
      this.graphics.fillCircle(unit.x + GAME_CONFIG.TILE_SIZE / 2, unit.y + GAME_CONFIG.TILE_SIZE / 2, 8);
    });

    // Draw grid
    this.graphics.lineStyle(1, 0x444444, 0.5);
    for (let x = 0; x <= GAME_CONFIG.DEFAULT_MAP_SIZE; x++) {
      this.graphics.moveTo(x * GAME_CONFIG.TILE_SIZE, 0);
      this.graphics.lineTo(x * GAME_CONFIG.TILE_SIZE, GAME_CONFIG.DEFAULT_MAP_SIZE * GAME_CONFIG.TILE_SIZE);
    }
    for (let y = 0; y <= GAME_CONFIG.DEFAULT_MAP_SIZE; y++) {
      this.graphics.moveTo(0, y * GAME_CONFIG.TILE_SIZE);
      this.graphics.lineTo(GAME_CONFIG.DEFAULT_MAP_SIZE * GAME_CONFIG.TILE_SIZE, y * GAME_CONFIG.TILE_SIZE);
    }
    this.graphics.strokePath();
  }

  updateUI() {
    let uiText = 'Strategy Game\n';
    uiText += 'Click castle to select, click destination to move units\n\n';

    // Show faction info
    GAME_CONFIG.FACTIONS.forEach((faction) => {
      const castles = this.getAllCastlesForFaction(faction.id);
      const totalUnits = this.getTotalUnitsForFaction(faction.id);
      uiText += `${faction.name}: ${castles.length} castles, ${totalUnits} total units\n`;
    });

    if (this.selectedCastle) {
      const faction = GAME_CONFIG.FACTIONS[this.selectedCastle.factionId];
      uiText += `\nSelected: ${faction.name} castle (${this.selectedCastle.unitCount} units)`;
    }

    this.uiText.setText(uiText);
  }

  updateProduction() {
    // Update all castles
    for (let y = 0; y < GAME_CONFIG.DEFAULT_MAP_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.DEFAULT_MAP_SIZE; x++) {
        const tile = this.map[y][x];
        if (tile.castle) {
          tile.castle.update();
        }
      }
    }

    // Schedule next update
    this.time.delayedCall(GAME_CONFIG.PRODUCTION.INTERVAL, () => this.updateProduction());
  }

  getAllCastlesForFaction(factionId) {
    const castles = [];
    for (let y = 0; y < GAME_CONFIG.DEFAULT_MAP_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.DEFAULT_MAP_SIZE; x++) {
        const { castle } = this.map[y][x];
        if (castle && castle.factionId === factionId) {
          castles.push(castle);
        }
      }
    }
    return castles;
  }

  getTotalUnitsForFaction(factionId) {
    let total = 0;

    // Count castle units
    for (let y = 0; y < GAME_CONFIG.DEFAULT_MAP_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.DEFAULT_MAP_SIZE; x++) {
        const tile = this.map[y][x];
        if (tile.castle && tile.castle.factionId === factionId) {
          total += tile.castle.unitCount;
        }
        // Count tile units
        total += tile.getTotalUnitsForFaction(factionId);
      }
    }

    // Count moving units
    const movingUnits = this.movementSystem.getMovingUnits();
    movingUnits.forEach((unit) => {
      if (unit.factionId === factionId) {
        total += unit.count;
      }
    });

    return total;
  }
}
