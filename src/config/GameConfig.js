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

    // AI configuration
    ai: {
        decisionInterval: 2000, // Base decision interval in milliseconds
        maxDecisionTime: 500, // Maximum time per decision cycle
        strategyEvaluationInterval: 1000, // How often strategies evaluate
        debugMode: false, // Enable AI debug logging
        scoutingRange: 15, // Tiles for scouting operations
        retreatThreshold: 0.3, // Army strength threshold for retreat
        reinforcementThreshold: 0.7, // Strength threshold for requesting reinforcement
        explorationPriority: 40, // Base priority for exploration
        threatAnalysisRange: 10, // Range for threat analysis
        buildingPriorities: {
            'townHall': 100,
            'goldMine': 90,
            'lumber_mill': 85,
            'quarry': 80,
            'mage_tower': 75,
            'barracks': 70,
            'archery_range': 65,
            'stable': 60,
            'wall': 50
        },
        unitPriorities: {
            'swordsman': 80,
            'archer': 75,
            'knight': 90,
            'guard': 70,
            'wizard': 85
        },
        resourceThresholds: {
            gold: 1000,
            wood: 500,
            stone: 300,
            mana: 200
        },
        armyComposition: {
            'balanced': { 'swordsman': 0.4, 'archer': 0.4, 'knight': 0.2 },
            'offensive': { 'knight': 0.5, 'swordsman': 0.3, 'archer': 0.2 },
            'defensive': { 'guard': 0.5, 'archer': 0.3, 'swordsman': 0.2 }
        },
        difficulty: {
            'easy': {
                decisionInterval: 3000,
                resourceThresholds: { gold: 800, wood: 400, stone: 250, mana: 150 },
                buildingPriorities: {
                    'townHall': 80, 'goldMine': 70, 'lumber_mill': 65, 'quarry': 60,
                    'mage_tower': 55, 'barracks': 50, 'archery_range': 45, 'stable': 40, 'wall': 30
                }
            },
            'medium': {
                decisionInterval: 2000,
                resourceThresholds: { gold: 1000, wood: 500, stone: 300, mana: 200 }
            },
            'hard': {
                decisionInterval: 1500,
                resourceThresholds: { gold: 1200, wood: 600, stone: 350, mana: 250 },
                buildingPriorities: {
                    'townHall': 120, 'goldMine': 110, 'lumber_mill': 105, 'quarry': 100,
                    'mage_tower': 95, 'barracks': 90, 'archery_range': 85, 'stable': 80, 'wall': 70
                }
            },
            'expert': {
                decisionInterval: 1000,
                resourceThresholds: { gold: 1500, wood: 750, stone: 400, mana: 300 },
                buildingPriorities: {
                    'townHall': 140, 'goldMine': 130, 'lumber_mill': 125, 'quarry': 120,
                    'mage_tower': 115, 'barracks': 110, 'archery_range': 105, 'stable': 100, 'wall': 90
                }
            }
        }
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
    
    // Victory system configuration
    victory: {
        // Victory detection performance
        checkIntervalMs: 100, // How often to check victory conditions
        detectionTimeoutMs: 100, // Maximum time for victory detection
        
        // Castle elimination victory (always enabled)
        castleEliminationEnabled: true,
        
        // Economic victory conditions
        economicVictoryEnabled: false, // Enable economic victory
        economicTarget: {
            gold: 10000,
            rareResourceAmount: 1000
        },
        
        // Time limit victory
        timeLimitEnabled: false, // Enable time limit victory
        timeLimit: 3600000, // 1 hour in milliseconds
        
        // End game configuration
        endGameReviewEnabled: true, // Allow pause for strategic review
        celebrationDuration: 3000, // Victory celebration effects duration
        defeatAnalysisEnabled: true, // Show strategic analysis on defeat
        
        // UI configuration
        victoryScreenAnimationDuration: 500,
        defeatScreenAnimationDuration: 600,
        notificationDuration: 3000, // Player elimination notifications
        
        // Sound configuration
        victoryFanfareVolume: 0.7,
        defeatThemeVolume: 0.6,
        eliminationSoundVolume: 0.5
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
        spellDamageMultiplier: 1.0,
        maxCombatResolutionTime: 100, // milliseconds
        drawThreshold: 0.05, // 5% power difference for draw
        attackerLossMultiplier: 0.3, // 30% losses for winner
        defenderLossMultiplier: 0.5, // 50% losses relative to loser power
        eliminationThreshold: 0.01 // 1% power minimum to avoid elimination
    },
    
    // UI configuration
    ui: {
        notificationDuration: 5000, // 5 seconds
        doubleClickTime: 300, // milliseconds
        scrollSpeed: 10,
        zoomLevels: [0.5, 0.75, 1.0, 1.25, 1.5],
        defaultZoom: 1.0,
        fontFamily: 'Arial'
    },
    
    // Pause system configuration
    pause: {
        maxResponseTime: 200, // milliseconds - pause/unpause must complete within this time
        inputCooldown: 100, // milliseconds - prevent rapid toggle
        overlay: {
            backgroundAlpha: 0.5, // Semi-transparent background
            mainTextSize: '48px',
            mainTextColor: '#FFFFFF',
            instructionTextSize: '24px',
            instructionTextColor: '#CCCCCC',
            reasonTextSize: '18px',
            reasonTextColor: '#FFCC00',
            statsTextSize: '14px',
            statsTextColor: '#999999',
            transitionTime: 300, // milliseconds - fade in/out duration
            depth: 10000 // Z-index for overlay
        }
    },
    
    // Debug configuration  
    debug: {
        showPauseStats: false, // Show pause statistics in overlay
        logPauseEvents: true, // Log pause events to console
        enablePerformanceTiming: true // Track pause/unpause performance
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