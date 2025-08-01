// Main configuration exports
export { GAME_CONFIG } from './GameConfig.js';
export { TERRAIN_CONFIG } from './TerrainConfig.js';
export { UNIT_CONFIGS } from './UnitConfig.js';
export { BUILDING_CONFIGS } from './BuildingConfig.js';
export { ConfigurationManager, CONFIG } from './ConfigurationManager.js';

// Static config objects for direct access
export const STATIC_CONFIG = {
    GAME_CONFIG,
    TERRAIN_CONFIG,
    UNIT_CONFIGS,
    BUILDING_CONFIGS
};