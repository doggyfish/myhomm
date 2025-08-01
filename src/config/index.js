// Main configuration exports
export { GAME_CONFIG } from './GameConfig.js';
export { TERRAIN_CONFIG } from './TerrainConfig.js';
export { UNIT_CONFIGS } from './UnitConfig.js';
export { BUILDING_CONFIGS } from './BuildingConfig.js';

// Re-export all configurations as a single object for convenience
export const CONFIG = {
    GAME: () => import('./GameConfig.js').then(m => m.GAME_CONFIG),
    TERRAIN: () => import('./TerrainConfig.js').then(m => m.TERRAIN_CONFIG),
    UNITS: () => import('./UnitConfig.js').then(m => m.UNIT_CONFIGS),
    BUILDINGS: () => import('./BuildingConfig.js').then(m => m.BUILDING_CONFIGS)
};