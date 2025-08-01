// Centralized configuration system with no magic numbers
export const GAME_CONFIG = {
    // Map configuration
    map: {
        tileSize: 64,
        defaultSize: 64,
        minSize: 32,
        maxSize: 256,
        fogOfWarEnabled: true
    },
    
    // Time configuration (all in milliseconds)
    time: {
        baseGameSpeed: 1.0,
        resourceUpdateInterval: 1000, // 1 second
        spellSelectionInterval: 180000, // 3 minutes
        aiDecisionInterval: 10000, // 10 seconds
        autosaveInterval: 300000 // 5 minutes
    },
    
    // Movement configuration
    movement: {
        baseTimePerTile: 1000, // 1 second to cross one tile at speed 1
        speedUnit: 'tilesPerSecond', // How speed values are interpreted
        minEffectiveSpeed: 0.1, // Minimum speed to prevent division by zero
        maxEffectiveSpeed: 1000 // Maximum speed cap
    },
    
    // Resource configuration
    resources: {
        baseGeneration: {
            gold: 60,  // per minute
            mana: 60   // per minute
        },
        startingResources: {
            gold: 0,
            mana: 0,
            wood: 0,
            stone: 0,
            mercury: 0,
            sulfur: 0,
            crystal: 0
        },
        economicVictory: {
            gold: 10000,
            rareResourceAmount: 1000
        }
    },
    
    // Faction configuration
    factions: {
        human: {
            resourceBonus: {
                gold: 1.0,
                mana: 1.25
            },
            unitProductionSpeed: 1.0,
            startingUnits: ['swordsman', 'archer']
        },
        orc: {
            resourceBonus: {
                gold: 1.25,
                mana: 1.0
            },
            unitProductionSpeed: 1.2,
            startingUnits: ['warrior', 'archer']
        }
    },
    
    // Army configuration
    army: {
        maxRegularUnits: 7,
        maxSiegeUnits: 1,
        mergeDistance: 2, // tiles
        selectionRadius: 1 // tiles
    },
    
    // Combat configuration
    combat: {
        baseDefenseMultiplier: 1.0,
        castleDefenseMultiplier: 1.5,
        siegeAntiCastleBonus: 1.5,
        spellDamageMultiplier: 1.0
    },
    
    // UI configuration
    ui: {
        notificationDuration: 5000, // 5 seconds
        doubleClickTime: 300, // milliseconds
        scrollSpeed: 10,
        zoomLevels: [0.5, 0.75, 1.0, 1.25, 1.5],
        defaultZoom: 1.0
    },
    
    // Performance configuration
    performance: {
        maxVisibleEntities: 200,
        cullingMargin: 100, // pixels
        pathfindingCacheSize: 100,
        objectPoolSizes: {
            projectiles: 50,
            effects: 100,
            ui: 20
        }
    }
};