import { GAME_CONFIG } from '../config/GameConfig.js';
import { Tile } from '../entities/Tile.js';
import { Castle } from '../entities/Castle.js';

export class MapGenerator {
  static generateMap(size = GAME_CONFIG.DEFAULT_MAP_SIZE) {
    const map = [];

    // Initialize empty map
    for (let y = 0; y < size; y++) {
      map[y] = [];
      for (let x = 0; x < size; x++) {
        const tileType = this.generateTileType();
        map[y][x] = new Tile(x, y, tileType);
      }
    }

    // Place castles in corners
    const castlePositions = [
      { x: 1, y: 1 }, // Top-left
      { x: size - 2, y: 1 }, // Top-right
      { x: 1, y: size - 2 }, // Bottom-left
      { x: size - 2, y: size - 2 }, // Bottom-right
    ];

    castlePositions.forEach((pos, index) => {
      // Ensure castle position is passable
      const tileType = GAME_CONFIG.TILE_TYPES.find((t) => t.passable);
      map[pos.y][pos.x].type = tileType;

      // Create castle with different production rates for testing
      const productionRate = GAME_CONFIG.PRODUCTION.DEFAULT_RATE + (index - 1);
      const castle = new Castle(pos.x, pos.y, index, Math.max(1, productionRate));
      map[pos.y][pos.x].setCastle(castle);
    });

    return map;
  }

  static generateTileType() {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const tileType of GAME_CONFIG.TILE_TYPES) {
      cumulativeProbability += tileType.probability;
      if (random <= cumulativeProbability) {
        return tileType;
      }
    }

    // Fallback to first tile type
    return GAME_CONFIG.TILE_TYPES[0];
  }
}
