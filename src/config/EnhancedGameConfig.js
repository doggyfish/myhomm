/**
 * Enhanced Game Configuration for MyHoMM Phaser 3 Version
 * Includes all Phase 1-5 features: Advanced gameplay, mobile optimization, tactical combat
 */

// Phase 3-4: Enhanced Unit Types (combining mobile + tactical)
const ENHANCED_UNIT_TYPES = {
    // Phase 3: Mobile-optimized base units
    INFANTRY: {
        level: 1,
        basePower: 1,
        cost: 5,
        productionTime: 1000,
        name: "Infantry",
        mobileIcon: "⚔️",
        displayColor: "#8B4513",
        combatType: "melee",
        strength: "archers",
        weakness: "cavalry"
    },
    ARCHERS: {
        level: 2,
        basePower: 2,
        cost: 8,
        productionTime: 1500,
        name: "Archers",
        mobileIcon: "🏹",
        displayColor: "#228B22",
        combatType: "ranged",
        strength: "cavalry",
        weakness: "infantry"
    },
    CAVALRY: {
        level: 3,
        basePower: 3,
        cost: 12,
        productionTime: 2000,
        name: "Cavalry",
        mobileIcon: "🐎",
        displayColor: "#4169E1",
        combatType: "mobile",
        strength: "infantry",
        weakness: "archers"
    },
    KNIGHTS: {
        level: 4,
        basePower: 5,
        cost: 20,
        productionTime: 3000,
        name: "Knights",
        mobileIcon: "🛡️",
        displayColor: "#FFD700",
        combatType: "heavy",
        strength: "all",
        weakness: "none"
    },
    
    // Phase 4: Advanced tactical units
    SIEGE_ENGINES: {
        level: 5,
        basePower: 8,
        cost: 50,
        productionTime: 5000,
        name: "Siege Engines",
        mobileIcon: "🏰",
        displayColor: "#8B0000",
        combatType: "siege",
        strength: "fortifications",
        weakness: "cavalry",
        specialAbility: "castle_damage"
    },
    BATTLE_MAGES: {
        level: 4,
        basePower: 6,
        cost: 30,
        productionTime: 4000,
        name: "Battle Mages",
        mobileIcon: "✨",
        displayColor: "#4B0082",
        combatType: "magic",
        strength: "infantry",
        weakness: "archers",
        specialAbility: "spell_casting"
    }
};

// Phase 4: Tactical Formation System
const TACTICAL_FORMATIONS = {
    OFFENSIVE: {
        name: "Offensive Formation",
        description: "Maximizes attack power but reduces defense",
        mobileIcon: "⚡",
        modifiers: {
            attackBonus: 0.2,
            defenseReduction: 0.1,
            moveSpeed: 1.0
        }
    },
    DEFENSIVE: {
        name: "Defensive Formation",
        description: "Increases defense at cost of attack power",
        mobileIcon: "🛡️",
        modifiers: {
            defenseBonus: 0.3,
            attackReduction: 0.15,
            moveSpeed: 0.8
        }
    },
    BALANCED: {
        name: "Balanced Formation",
        description: "Provides moderate bonuses to all aspects",
        mobileIcon: "⚖️",
        modifiers: {
            attackBonus: 0.1,
            defenseBonus: 0.1,
            moveSpeed: 0.9
        }
    },
    MOBILE: {
        name: "Mobile Formation",
        description: "Maximizes movement speed and tactical flexibility",
        mobileIcon: "🏃",
        modifiers: {
            moveSpeed: 1.3,
            attackReduction: 0.1,
            defenseReduction: 0.1
        }
    }
};

// Phase 4: Terrain Effects System
const TERRAIN_EFFECTS = {
    PLAINS: {
        name: "Plains",
        mobileIcon: "🌾",
        color: "#90EE90",
        modifiers: { moveSpeed: 1.0, visibility: 1.0 }
    },
    FOREST: {
        name: "Forest",
        mobileIcon: "🌲",
        color: "#228B22",
        modifiers: { moveSpeed: 0.8, visibility: 0.7, archerBonus: 0.2 }
    },
    HILLS: {
        name: "Hills",
        mobileIcon: "⛰️",
        color: "#8B7355",
        modifiers: { moveSpeed: 0.7, visibility: 1.3, defenseBonus: 0.15 }
    },
    SWAMP: {
        name: "Swamp",
        mobileIcon: "🐸",
        color: "#556B2F",
        modifiers: { moveSpeed: 0.5, visibility: 0.5, cavalryPenalty: 0.3 }
    }
};

// Phase 3: Mobile Performance Configuration
const MOBILE_CONFIG = {
    detection: {
        userAgentPattern: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
        touchCapable: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints || 0
    },
    performance: {
        targetFPS: 30,
        maxFPS: 60,
        minFPS: 24,
        adaptiveQuality: true,
        maxMemoryMB: 150,
        maxBatteryPercentPerHour: 5
    },
    ui: {
        minTouchTarget: 44, // iOS HIG minimum
        scaleFactors: {
            phone: 1.0,
            tablet: 1.2,
            desktop: 1.0
        },
        safeAreaSupport: true
    },
    gestures: {
        tap: { enabled: true, threshold: 150 },
        longPress: { enabled: true, threshold: 500 },
        swipe: { enabled: true, threshold: 50 },
        pinch: { enabled: true, threshold: 0.1 },
        drag: { enabled: true, threshold: 10 }
    }
};

// Phase 1-2: Enhanced AI Configuration
const AI_CONFIG = {
    personalities: {
        aggressive: {
            name: "Aggressive",
            aggressiveness: 0.8,
            expansiveness: 0.7,
            economicFocus: 0.3,
            riskTolerance: 0.8
        },
        defensive: {
            name: "Defensive",
            aggressiveness: 0.2,
            expansiveness: 0.4,
            economicFocus: 0.8,
            riskTolerance: 0.3
        },
        balanced: {
            name: "Balanced",
            aggressiveness: 0.5,
            expansiveness: 0.5,
            economicFocus: 0.5,
            riskTolerance: 0.5
        },
        economic: {
            name: "Economic",
            aggressiveness: 0.3,
            expansiveness: 0.6,
            economicFocus: 0.9,
            riskTolerance: 0.4
        }
    },
    difficulties: {
        easy: {
            reactionTime: 3000,
            strategicUpdateInterval: 10000,
            errorRate: 0.2,
            resourceBonus: 0.8
        },
        medium: {
            reactionTime: 2000,
            strategicUpdateInterval: 5000,
            errorRate: 0.1,
            resourceBonus: 1.0
        },
        hard: {
            reactionTime: 1000,
            strategicUpdateInterval: 3000,
            errorRate: 0.05,
            resourceBonus: 1.2
        }
    }
};

// Phase 5: Enhanced Camera and UI Configuration
const ENHANCED_CAMERA_CONFIG = {
    zoom: {
        min: 0.25,
        max: 4.0,
        default: 1.0,
        step: 0.1
    },
    movement: {
        panSpeed: 400,
        keyboardSpeed: 300,
        mouseEdgeThreshold: 50,
        smoothing: 0.1,
        momentum: true
    },
    bounds: {
        enabled: true,
        padding: 100
    },
    effects: {
        shake: { enabled: true, intensity: 5 },
        smooth: { enabled: true, factor: 0.1 },
        follow: { enabled: true, lerp: 0.1 }
    }
};

// Combined Enhanced Game Configuration
const EnhancedGameConfig = {
    // Base Phaser configuration
    ...GameConfig,
    
    // Enhanced MyHoMM configuration
    enhanced: {
        unitTypes: ENHANCED_UNIT_TYPES,
        formations: TACTICAL_FORMATIONS,
        terrain: TERRAIN_EFFECTS,
        mobile: MOBILE_CONFIG,
        ai: AI_CONFIG,
        camera: ENHANCED_CAMERA_CONFIG,
        
        // Phase integration settings
        phases: {
            phase1: { enabled: true, oop: true, architecture: true },
            phase2: { enabled: true, ai: true, resources: true, upgrades: true },
            phase3: { enabled: true, mobile: true, touch: true, performance: true },
            phase4: { enabled: true, tactical: true, formations: true, terrain: true },
            phase5: { enabled: true, camera: true, ui: true, phaser3: true }
        },
        
        // Feature flags
        features: {
            castleUpgrades: true,
            unitTypes: true,
            formations: true,
            terrain: true,
            mobileOptimization: true,
            enhancedAI: true,
            tacticalCombat: true,
            advancedCamera: true,
            resourceManagement: true,
            saveLoad: true
        }
    }
};

// Export all configurations
window.EnhancedGameConfig = EnhancedGameConfig;
window.ENHANCED_UNIT_TYPES = ENHANCED_UNIT_TYPES;
window.TACTICAL_FORMATIONS = TACTICAL_FORMATIONS;
window.TERRAIN_EFFECTS = TERRAIN_EFFECTS;
window.MOBILE_CONFIG = MOBILE_CONFIG;
window.AI_CONFIG = AI_CONFIG;
window.ENHANCED_CAMERA_CONFIG = ENHANCED_CAMERA_CONFIG;

console.log('🚀 Enhanced Game Configuration loaded with all Phase 1-5 features');