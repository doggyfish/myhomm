// Terrain configuration with movement modifiers
export const TERRAIN_CONFIG = {
    grassland: { 
        movementModifier: 1.0, 
        passable: true,
        combatModifier: 1.0,
        visionModifier: 1.0
    },
    mountain: { 
        movementModifier: 0, // impassable
        passable: false,
        combatModifier: 1.0,
        visionModifier: 1.0
    },
    forest: { 
        movementModifier: 0.5, // 50% speed
        passable: true, 
        combatModifier: 1.1, // 10% combat bonus
        visionModifier: 0.8
    },
    water: { 
        movementModifier: 0, // impassable
        passable: false,
        combatModifier: 1.0,
        visionModifier: 1.0
    },
    road: { 
        movementModifier: 2.0, // 200% speed
        passable: true,
        combatModifier: 1.0,
        visionModifier: 1.0
    },
    desert: { 
        movementModifier: 0.67, // ~67% speed
        passable: true, 
        combatModifier: 1.0,
        visionModifier: 0.8
    },
    plains: { 
        movementModifier: 1.0,
        passable: true,
        combatModifier: 1.0,
        visionModifier: 1.0
    },
    swamp: { 
        movementModifier: 0.5, // 50% speed
        passable: true, 
        combatModifier: 1.1, // 10% combat bonus
        visionModifier: 0.9
    },
    snow: { 
        movementModifier: 0.67, // ~67% speed
        passable: true, 
        combatModifier: 1.0,
        visionModifier: 0.8
    },
    lake: { 
        movementModifier: 0.5, // 50% speed
        passable: true, 
        combatModifier: 0.9, // 10% combat penalty
        visionModifier: 1.0
    }
};