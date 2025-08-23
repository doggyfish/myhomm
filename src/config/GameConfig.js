export const GAME_CONFIG = {
  // Game dimensions
  WIDTH: 1024,
  HEIGHT: 768,

  // Map settings
  TILE_SIZE: 32,
  MIN_MAP_SIZE: 20,
  MAX_MAP_SIZE: 50,
  DEFAULT_MAP_SIZE: 30,

  // Faction settings
  FACTIONS: [
    {
      id: 0, name: 'Red', color: 0xFF0000, speed: 0.5,
    },
    {
      id: 1, name: 'Blue', color: 0x0066FF, speed: 0.75,
    },
    {
      id: 2, name: 'Green', color: 0x00FF00, speed: 1.0,
    },
    {
      id: 3, name: 'Yellow', color: 0xFFFF00, speed: 1.5,
    },
  ],

  // Tile types with probabilities
  TILE_TYPES: [
    {
      id: 0, name: 'grass', color: 0x228B22, passable: true, probability: 0.7,
    },
    {
      id: 1, name: 'water', color: 0x4682B4, passable: false, probability: 0.2,
    },
    {
      id: 2, name: 'mountain', color: 0x8B4513, passable: false, probability: 0.1,
    },
    // Temporarily disabled for easier testing - uncomment to enable
    // {
    //   id: 3, name: 'forest', color: 0x006400, passable: true, probability: 0.15,
    // },
    // {
    //   id: 4, name: 'desert', color: 0xF4A460, passable: true, probability: 0.1,
    // },
    // {
    //   id: 5, name: 'swamp', color: 0x556B2F, passable: true, probability: 0.05,
    // },
  ],

  // Production settings
  PRODUCTION: {
    MIN_RATE: 1,
    MAX_RATE: 10,
    DEFAULT_RATE: 120, // x units per minute
    INTERVAL: 500, // how often production occurs in milliseconds
  },

  // Animation settings
  ANIMATION: {
    UNIT_SPEED: 100, // pixels per second base speed
    PATHFINDING_MAX_TIME: 100, // milliseconds
  },
};
