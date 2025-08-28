import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig.js';
import { MapGenerator } from '../systems/MapGenerator.js';
import { MovementSystem } from '../systems/MovementSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.map = null;
    this.selectedCastle = null;
    this.selectedUnits = null; // Store selected unit group
    this.selectedTile = null; // Store tile of selected units
    this.movementSystem = new MovementSystem();
    this.graphics = null;
    this.uiText = null;
    this.unitCountTexts = []; // Store text objects for unit counts
    this.eliminatedFactions = new Set(); // Track eliminated factions
    this.gameWon = false; // Track if game has been won
    this.winningFaction = null; // Store winning faction
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
    
    // Setup zoom controls
    this.input.on('wheel', this.handleZoom, this);
    this.currentZoom = 0.8;
    this.minZoom = 0.3;
    this.maxZoom = 2.0;

    // Setup WASD camera movement
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    this.cameraSpeed = 300; // pixels per second

    // Start game loop
    this.updateProduction();
  }

  update(time, delta) {
    // Stop processing if game is won
    if (this.gameWon) {
      this.render();
      this.updateUI();
      return;
    }

    // Handle WASD camera movement
    this.handleCameraMovement(delta);

    // Update movement system
    this.movementSystem.update(delta, this.map);

    // Check for faction elimination and victory
    this.checkFactionElimination();

    // Render the game
    this.render();

    // Update UI
    this.updateUI();
  }

  handleClick(pointer) {
    // Disable input if game is won
    if (this.gameWon) {
      return;
    }
    
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

    if (!this.selectedCastle && !this.selectedUnits) {
      // First click - select castle or unit group
      if (clickedTile.castle) {
        this.selectedCastle = clickedTile.castle;
        const castleFaction = GAME_CONFIG.FACTIONS.find(f => f.id === this.selectedCastle.factionId);
        console.log(`Selected ${castleFaction.name} castle at (${tileX}, ${tileY}) with ${this.selectedCastle.unitCount} units`);
      } else if (clickedTile.units.length > 0) {
        // Select unit group on this tile
        this.selectedUnits = clickedTile.units;
        this.selectedTile = clickedTile;
        const totalUnits = clickedTile.units.reduce((sum, unit) => sum + unit.count, 0);
        const faction = GAME_CONFIG.FACTIONS[clickedTile.units[0].factionId];
        console.log(`Selected ${totalUnits} ${faction.name} units at (${tileX}, ${tileY})`);
      }
    } else {
      // Second click - move units
      if (clickedTile.isPassable()) {
        let success = false;
        
        if (this.selectedCastle) {
          // Moving from castle - send all units
          const unitCount = Math.floor(this.selectedCastle.unitCount / 1) || 1;
          success = this.movementSystem.moveUnits(
            this.map,
            this.selectedCastle.x,
            this.selectedCastle.y,
            tileX,
            tileY,
            unitCount,
          );
          
          if (success) {
            const castleFaction = GAME_CONFIG.FACTIONS.find(f => f.id === this.selectedCastle.factionId);
            console.log(`Moved ${unitCount} ${castleFaction.name} units from castle (${this.selectedCastle.x}, ${this.selectedCastle.y}) to (${tileX}, ${tileY})`);
          }
        } else if (this.selectedUnits) {
          // Moving unit group
          const totalUnits = this.selectedUnits.reduce((sum, unit) => sum + unit.count, 0);
          success = this.movementSystem.moveUnits(
            this.map,
            this.selectedTile.x,
            this.selectedTile.y,
            tileX,
            tileY,
            totalUnits,
          );
          
          if (success) {
            const unitFaction = GAME_CONFIG.FACTIONS.find(f => f.id === this.selectedUnits[0].factionId);
            console.log(`Moved ${totalUnits} ${unitFaction.name} units from (${this.selectedTile.x}, ${this.selectedTile.y}) to (${tileX}, ${tileY})`);
          }
        }

        if (!success) {
          console.log('Movement failed - no valid path or insufficient units');
        }
      } else {
        console.log('Cannot move to impassable tile');
      }

      // Deselect everything
      this.selectedCastle = null;
      this.selectedUnits = null;
      this.selectedTile = null;
    }
  }

  handleCameraMovement(delta) {
    const camera = this.cameras.main;
    const speed = this.cameraSpeed * (delta / 1000); // Convert to pixels per frame

    // WASD camera movement
    if (this.wasd.A.isDown) {
      camera.scrollX -= speed;
    }
    if (this.wasd.D.isDown) {
      camera.scrollX += speed;
    }
    if (this.wasd.W.isDown) {
      camera.scrollY -= speed;
    }
    if (this.wasd.S.isDown) {
      camera.scrollY += speed;
    }

    // Keep camera within map bounds
    const mapWidth = GAME_CONFIG.DEFAULT_MAP_SIZE * GAME_CONFIG.TILE_SIZE;
    const mapHeight = GAME_CONFIG.DEFAULT_MAP_SIZE * GAME_CONFIG.TILE_SIZE;
    const cameraWidth = camera.width / this.currentZoom;
    const cameraHeight = camera.height / this.currentZoom;

    // Clamp camera position to keep it within map boundaries
    camera.scrollX = Phaser.Math.Clamp(
      camera.scrollX,
      -cameraWidth / 2,
      mapWidth - cameraWidth / 2
    );
    camera.scrollY = Phaser.Math.Clamp(
      camera.scrollY,
      -cameraHeight / 2,
      mapHeight - cameraHeight / 2
    );
  }

  handleZoom(pointer, gameObjects, deltaX, deltaY, deltaZ) {
    // Zoom out on wheel up, zoom in on wheel down
    const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Phaser.Math.Clamp(this.currentZoom + zoomDelta, this.minZoom, this.maxZoom);
    
    if (newZoom !== this.currentZoom) {
      this.currentZoom = newZoom;
      this.cameras.main.setZoom(this.currentZoom);
      console.log(`Zoom: ${this.currentZoom.toFixed(1)}x`);
    }
  }

  render() {
    this.graphics.clear();
    
    // Clear existing unit count texts
    this.unitCountTexts.forEach((text) => text.destroy());
    this.unitCountTexts = [];

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

          // Add unit count text inside castle
          const castleUnitText = this.add.text(
            pixelX + GAME_CONFIG.TILE_SIZE / 2,
            pixelY + GAME_CONFIG.TILE_SIZE / 2,
            tile.castle.unitCount.toString(),
            {
              fontSize: '14px',
              fontFamily: 'Arial',
              fontStyle: 'bold',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
            },
          );
          castleUnitText.setOrigin(0.5, 0.5);
          this.unitCountTexts.push(castleUnitText);
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

            // Highlight selected units
            if (this.selectedUnits === tile.units) {
              this.graphics.lineStyle(3, 0xFFFFFF);
              this.graphics.strokeCircle(
                pixelX + unitOffset + unitSize / 2,
                pixelY + unitOffset + unitSize / 2,
                unitSize / 2 + 2,
              );
            }

            // Add unit count text inside unit circle
            const unitCountText = this.add.text(
              pixelX + unitOffset + unitSize / 2,
              pixelY + unitOffset + unitSize / 2,
              totalUnits.toString(),
              {
                fontSize: '8px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
              },
            );
            unitCountText.setOrigin(0.5, 0.5);
            this.unitCountTexts.push(unitCountText);
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

      // Add unit count text inside moving unit circle
      const movingUnitText = this.add.text(
        unit.x + GAME_CONFIG.TILE_SIZE / 2,
        unit.y + GAME_CONFIG.TILE_SIZE / 2,
        unit.count.toString(),
        {
          fontSize: '10px',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        },
      );
      movingUnitText.setOrigin(0.5, 0.5);
      this.unitCountTexts.push(movingUnitText);
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
    
    if (this.gameWon) {
      uiText += `🎉 ${this.winningFaction.name} FACTION WINS! 🎉\n`;
      uiText += 'Game Over - Refresh page to play again\n\n';
    } else {
      uiText += 'Click castle to select, click destination to move units\n';
      uiText += `Mouse wheel: Zoom (${this.currentZoom.toFixed(1)}x) | WASD: Move camera\n\n`;
    }

    // Show faction info
    GAME_CONFIG.FACTIONS.forEach((faction) => {
      const castles = this.getAllCastlesForFaction(faction.id);
      const totalUnits = this.getTotalUnitsForFaction(faction.id);
      
      if (this.eliminatedFactions.has(faction.id)) {
        uiText += `${faction.name}: ELIMINATED\n`;
      } else {
        uiText += `${faction.name}: ${castles.length} castles, ${totalUnits} total units\n`;
      }
    });

    if (this.selectedCastle) {
      const faction = GAME_CONFIG.FACTIONS[this.selectedCastle.factionId];
      uiText += `\nSelected: ${faction.name} castle (${this.selectedCastle.unitCount} units)`;
    } else if (this.selectedUnits) {
      const totalUnits = this.selectedUnits.reduce((sum, unit) => sum + unit.count, 0);
      const faction = GAME_CONFIG.FACTIONS[this.selectedUnits[0].factionId];
      uiText += `\nSelected: ${totalUnits} ${faction.name} units at (${this.selectedTile.x}, ${this.selectedTile.y})`;
    }

    this.uiText.setText(uiText);
  }

  updateProduction() {
    // Stop production if game is won
    if (this.gameWon) {
      return;
    }

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

  checkFactionElimination() {
    GAME_CONFIG.FACTIONS.forEach((faction) => {
      // Skip already eliminated factions
      if (this.eliminatedFactions.has(faction.id)) {
        return;
      }

      // Check if faction has any castles
      const castles = this.getAllCastlesForFaction(faction.id);
      
      if (castles.length === 0) {
        // Faction is eliminated - no castles left
        console.log(`💀 FACTION ELIMINATED: ${faction.name} has lost all castles!`);
        
        // Add to eliminated factions
        this.eliminatedFactions.add(faction.id);
        
        // Remove all units of this faction from the map
        this.removeAllUnitsForFaction(faction.id);
        
        // Show elimination notification
        this.showEliminationNotification(faction);
        
        // Clear selection if eliminated faction was selected
        if (this.selectedCastle && this.selectedCastle.factionId === faction.id) {
          this.selectedCastle = null;
        }
        if (this.selectedUnits && this.selectedUnits.length > 0 && this.selectedUnits[0].factionId === faction.id) {
          this.selectedUnits = null;
          this.selectedTile = null;
        }
      }
    });

    // Check for victory condition
    this.checkVictoryCondition();
  }

  checkVictoryCondition() {
    // Don't check victory if game already won
    if (this.gameWon) {
      return;
    }

    // Count surviving factions (those with at least one castle)
    const survivingFactions = GAME_CONFIG.FACTIONS.filter(faction => {
      return !this.eliminatedFactions.has(faction.id);
    });

    // Victory condition: only one faction remains
    if (survivingFactions.length === 1) {
      this.winningFaction = survivingFactions[0];
      this.gameWon = true;
      
      console.log(`🎉 VICTORY: ${this.winningFaction.name} has conquered all other factions!`);
      
      // Show victory notification
      this.showVictoryNotification();
      
      // Clear any selections
      this.selectedCastle = null;
      this.selectedUnits = null;
      this.selectedTile = null;
    }
  }

  removeAllUnitsForFaction(factionId) {
    // Remove all tile units for this faction
    for (let y = 0; y < GAME_CONFIG.DEFAULT_MAP_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.DEFAULT_MAP_SIZE; x++) {
        const tile = this.map[y][x];
        tile.units = tile.units.filter(unit => unit.factionId !== factionId);
      }
    }

    // Remove all moving units for this faction
    this.movementSystem.movingUnits = this.movementSystem.movingUnits.filter(unit => unit.factionId !== factionId);
    
    console.log(`🧹 Removed all remaining units for eliminated faction ${factionId}`);
  }

  showEliminationNotification(faction) {
    // Create a temporary notification text
    const notification = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      `${faction.name} FACTION ELIMINATED!`,
      {
        fontSize: '32px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#cc0000',
        padding: { x: 20, y: 10 }
      }
    );
    
    notification.setOrigin(0.5, 0.5);
    notification.setScrollFactor(0); // Keep it on screen regardless of camera movement
    
    // Fade out the notification after 3 seconds
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => {
        notification.destroy();
      }
    });
  }

  showVictoryNotification() {
    // Create victory notification with faction color
    const victoryText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      `🎉 VICTORY! 🎉\n${this.winningFaction.name} FACTION WINS!`,
      {
        fontSize: '48px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        backgroundColor: '#00aa00',
        padding: { x: 30, y: 20 },
        align: 'center'
      }
    );
    
    victoryText.setOrigin(0.5, 0.5);
    victoryText.setScrollFactor(0);

    // Create restart instruction
    const restartText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      'Refresh page to play again',
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
      }
    );
    
    restartText.setOrigin(0.5, 0.5);
    restartText.setScrollFactor(0);

    // Add victory animation - pulsing effect
    this.tweens.add({
      targets: victoryText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
