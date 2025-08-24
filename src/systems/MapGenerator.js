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

    // Ensure connectivity between all castle positions
    MapGenerator.ensureCastleConnectivity(map, castlePositions);

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

  static ensureCastleConnectivity(map, castlePositions) {
    const passableTileType = GAME_CONFIG.TILE_TYPES.find((t) => t.passable);

    // Create simple cross-pattern to ensure all castles are connected
    // Create horizontal corridor in middle
    const midY = Math.floor(map.length / 2);
    for (let x = 1; x < map[0].length - 1; x++) {
      map[midY][x].type = passableTileType;
    }

    // Create vertical corridor in middle  
    const midX = Math.floor(map[0].length / 2);
    for (let y = 1; y < map.length - 1; y++) {
      map[y][midX].type = passableTileType;
    }

    // Create paths from each castle to the center corridors
    castlePositions.forEach(pos => {
      MapGenerator.createSimplePath(map, pos, { x: midX, y: midY }, passableTileType);
    });

    console.log('Created connectivity corridors to ensure all castles are reachable');
  }

  static createSimplePath(map, from, to, passableTileType) {
    // Create L-shaped path (horizontal then vertical)
    let currentX = from.x;
    let currentY = from.y;

    // Move horizontally first
    const deltaX = to.x > from.x ? 1 : -1;
    while (currentX !== to.x) {
      currentX += deltaX;
      if (currentX >= 0 && currentX < map[0].length && currentY >= 0 && currentY < map.length) {
        map[currentY][currentX].type = passableTileType;
      }
    }

    // Then move vertically
    const deltaY = to.y > from.y ? 1 : -1;
    while (currentY !== to.y) {
      currentY += deltaY;
      if (currentX >= 0 && currentX < map[0].length && currentY >= 0 && currentY < map.length) {
        map[currentY][currentX].type = passableTileType;
      }
    }
  }
}
