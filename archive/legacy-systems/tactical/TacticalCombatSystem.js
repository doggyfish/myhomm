/**
 * TacticalCombatSystem - Phase 4 tactical enhancements for mobile combat
 * Extends MobileCombatSystem with formation, terrain, and weather mechanics
 */

// Phase 4: Enhanced unit types building on mobile foundation
// Note: MOBILE_UNIT_TYPES will be accessed through mobileCombatSystem instance
const PHASE4_ENHANCED_UNITS_BASE = {
    
    // New Phase 4 advanced units
    SIEGE_ENGINES: {
        level: 5,
        basePower: 8,
        cost: 20,
        productionTime: 8000,
        name: "Siege Engines",
        description: "Castle-destroying siege weapons",
        combatType: "siege",
        mobileIcon: "🏰",
        displayColor: "#8B0000",
        strength: "fortifications",
        weakness: "cavalry",
        specialAbility: "castle_damage"
    },
    BATTLE_MAGES: {
        level: 4,
        basePower: 6,
        cost: 15,
        productionTime: 6000,
        name: "Battle Mages",
        description: "Magical combat specialists",
        combatType: "magic",
        mobileIcon: "✨",
        displayColor: "#4B0082",
        strength: "infantry",
        weakness: "archers",
        specialAbility: "spell_casting"
    }
};

// Phase 4: Formation system for tactical combat
const TACTICAL_FORMATIONS = {
    OFFENSIVE: {
        name: "Offensive Formation",
        description: "Maximizes attack power but reduces defense",
        mobileIcon: "⚡",
        modifiers: {
            attackBonus: 0.2,
            defenseReduction: 0.1,
            moveSpeed: 1.0
        },
        bestAgainst: ["DEFENSIVE"],
        weakAgainst: ["FLANKING"],
        tacticalAdvice: "Best for overwhelming weaker enemies"
    },
    DEFENSIVE: {
        name: "Defensive Formation", 
        description: "Maximizes defense but reduces attack speed",
        mobileIcon: "🛡️",
        modifiers: {
            defenseBonus: 0.3,
            attackReduction: 0.15,
            moveSpeed: 0.8
        },
        bestAgainst: ["FLANKING"],
        weakAgainst: ["OFFENSIVE"],
        tacticalAdvice: "Ideal for holding strategic positions"
    },
    BALANCED: {
        name: "Balanced Formation",
        description: "No bonuses or penalties, adaptable",
        mobileIcon: "⚖️",
        modifiers: {
            attackBonus: 0.0,
            defenseBonus: 0.0,
            moveSpeed: 1.0
        },
        bestAgainst: [],
        weakAgainst: [],
        tacticalAdvice: "Versatile formation for uncertain situations"
    },
    FLANKING: {
        name: "Flanking Formation",
        description: "Fast movement, effective against defensive positions",
        mobileIcon: "🏃",
        modifiers: {
            moveSpeed: 1.3,
            flankingBonus: 0.25,
            directCombatReduction: 0.1
        },
        bestAgainst: ["DEFENSIVE"],
        weakAgainst: ["OFFENSIVE"],
        tacticalAdvice: "Excels at hit-and-run tactics"
    }
};

// Phase 4: Terrain effects system
const TERRAIN_TYPES = {
    PLAINS: {
        name: "Plains",
        description: "Open ground with no modifiers",
        mobileIcon: "🌾",
        modifiers: {
            cavalryBonus: 0.1,
            archerPenalty: 0.0,
            visibilityBonus: 0.2
        }
    },
    FOREST: {
        name: "Forest",
        description: "Dense trees favor archers and infantry",
        mobileIcon: "🌲",
        modifiers: {
            archerBonus: 0.2,
            cavalryPenalty: 0.3,
            infantryBonus: 0.1
        }
    },
    HILLS: {
        name: "Hills",
        description: "High ground provides tactical advantage",
        mobileIcon: "⛰️",
        modifiers: {
            archerBonus: 0.3,
            defenseBonus: 0.2,
            chargeReduction: 0.2
        }
    },
    SWAMP: {
        name: "Swampland",
        description: "Difficult terrain slows all units",
        mobileIcon: "🦆",
        modifiers: {
            moveSpeedReduction: 0.4,
            cavalryPenalty: 0.5,
            generalPenalty: 0.1
        }
    }
};

// Phase 4: Weather effects system
const WEATHER_CONDITIONS = {
    CLEAR: {
        name: "Clear Weather",
        description: "Perfect conditions for battle",
        mobileIcon: "☀️",
        modifiers: {}
    },
    RAIN: {
        name: "Heavy Rain",
        description: "Reduces archer effectiveness and movement",
        mobileIcon: "🌧️",
        modifiers: {
            archerPenalty: 0.3,
            moveSpeedReduction: 0.2,
            visibilityReduction: 0.4
        }
    },
    FOG: {
        name: "Dense Fog",
        description: "Severely limits visibility and ranged attacks",
        mobileIcon: "🌫️",
        modifiers: {
            archerPenalty: 0.5,
            surpriseAttackBonus: 0.2,
            visibilityReduction: 0.7
        }
    },
    SNOW: {
        name: "Heavy Snow",
        description: "Slows movement but aids defense",
        mobileIcon: "❄️",
        modifiers: {
            moveSpeedReduction: 0.3,
            defenseBonus: 0.1,
            cavalryPenalty: 0.2
        }
    }
};

/**
 * TacticalCombatSystem - Phase 4 tactical enhancements
 * Extends mobile combat with formation, terrain, and weather systems
 */
class TacticalCombatSystem {
    constructor(mobileCombatSystem) {
        this.mobileCombat = mobileCombatSystem;
        this.game = mobileCombatSystem.game;
        this.mobileUI = mobileCombatSystem.mobileUI;
        
        // Enhanced unit types combining mobile and tactical
        this.enhancedUnitTypes = this.createEnhancedUnitTypes();
        
        // Tactical state management
        this.tacticalState = {
            formationsEnabled: true,
            terrainEffectsEnabled: true,
            weatherEffectsEnabled: true,
            advancedAIEnabled: true
        };
        
        // Formation system
        this.formationSystem = new FormationSystem(this);
        
        // Environmental systems
        this.terrainSystem = new TerrainSystem(this);
        this.weatherSystem = new WeatherSystem(this);
        
        // Tactical AI
        this.tacticalAI = new TacticalAI(this);
        
        console.log('⚔️ TacticalCombatSystem initialized - Phase 4 tactical enhancements active');
    }
    
    /**
     * Create enhanced unit types by combining mobile and tactical units
     */
    createEnhancedUnitTypes() {
        // Get mobile unit types from the mobile combat system
        const mobileUnitTypes = this.mobileCombat.getUnitTypeInfo ? 
            this.mobileCombat.constructor.MOBILE_UNIT_TYPES || {} : {};
            
        // Combine with Phase 4 enhanced units
        return {
            ...mobileUnitTypes,
            ...PHASE4_ENHANCED_UNITS_BASE
        };
    }
    
    /**
     * Enhanced battle resolution with tactical depth
     * Extends mobile combat system while maintaining performance
     */
    resolveTacticalBattle(attackingArmy, defendingArmy, battleOptions = {}) {
        console.log('⚔️ Phase 4 tactical battle starting:', battleOptions);
        
        // Use mobile combat as foundation
        const mobileResult = this.mobileCombat.resolveBattle(attackingArmy, defendingArmy, battleOptions.location);
        
        // Add Phase 4 tactical enhancements
        if (this.shouldEnableTacticalFeatures(battleOptions)) {
            this.applyTacticalModifiers(mobileResult, battleOptions);
            this.processFormationAdvantages(mobileResult, battleOptions);
            this.applyEnvironmentalEffects(mobileResult, battleOptions);
            this.updateTacticalDisplay(mobileResult, battleOptions);
        }
        
        return mobileResult;
    }
    
    /**
     * Determine if tactical features should be enabled
     */
    shouldEnableTacticalFeatures(battleOptions) {
        // Always enable on desktop, optional on mobile based on settings
        return !this.game.mobile?.isActive || 
               battleOptions.enableAdvancedTactics ||
               this.game.settings?.alwaysUseTacticalCombat;
    }
    
    /**
     * Apply tactical modifiers to battle result
     */
    applyTacticalModifiers(result, battleOptions) {
        const tacticalData = {
            formationAdvantages: [],
            environmentalEffects: [],
            tacticalBonuses: {},
            aiRecommendations: []
        };
        
        // Formation analysis
        if (battleOptions.attackerFormation && battleOptions.defenderFormation) {
            const formationAdvantage = this.formationSystem.calculateFormationAdvantage(
                battleOptions.attackerFormation,
                battleOptions.defenderFormation
            );
            
            tacticalData.formationAdvantages.push({
                type: 'formation_matchup',
                attacker: battleOptions.attackerFormation,
                defender: battleOptions.defenderFormation,
                advantage: formationAdvantage,
                description: this.formationSystem.getAdvantageDescription(
                    battleOptions.attackerFormation, 
                    battleOptions.defenderFormation
                )
            });
            
            // Apply formation modifier to power
            result.mobileDisplay.attackerPowerAfter *= formationAdvantage;
        }
        
        // Store tactical data in result
        result.tacticalData = tacticalData;
        
        console.log('⚔️ Tactical modifiers applied:', tacticalData);
    }
    
    /**
     * Process formation advantages and tactical positioning
     */
    processFormationAdvantages(result, battleOptions) {
        if (!battleOptions.attackerFormation) return;
        
        const attackerFormation = TACTICAL_FORMATIONS[battleOptions.attackerFormation];
        const defenderFormation = TACTICAL_FORMATIONS[battleOptions.defenderFormation];
        
        if (attackerFormation) {
            // Apply formation bonuses to attacker
            let powerModifier = 1.0;
            
            if (attackerFormation.modifiers.attackBonus) {
                powerModifier *= (1 + attackerFormation.modifiers.attackBonus);
            }
            if (attackerFormation.modifiers.attackReduction) {
                powerModifier *= (1 - attackerFormation.modifiers.attackReduction);
            }
            
            // Apply formation matchup bonuses
            if (defenderFormation && attackerFormation.bestAgainst.includes(battleOptions.defenderFormation)) {
                powerModifier *= 1.15; // +15% against favorable matchup
                result.tacticalData.formationAdvantages.push({
                    type: 'favorable_matchup',
                    bonus: 0.15,
                    description: `${attackerFormation.name} is effective against ${defenderFormation.name}`
                });
            } else if (defenderFormation && attackerFormation.weakAgainst.includes(battleOptions.defenderFormation)) {
                powerModifier *= 0.85; // -15% against unfavorable matchup
                result.tacticalData.formationAdvantages.push({
                    type: 'unfavorable_matchup',
                    penalty: 0.15,
                    description: `${attackerFormation.name} is weak against ${defenderFormation.name}`
                });
            }
            
            // Update final power calculation
            result.mobileDisplay.attackerPowerAfter *= powerModifier;
        }
    }
    
    /**
     * Apply environmental effects (terrain and weather)
     */
    applyEnvironmentalEffects(result, battleOptions) {
        const environmentalEffects = [];
        
        // Terrain effects
        if (battleOptions.terrain && this.tacticalState.terrainEffectsEnabled) {
            const terrainEffects = this.terrainSystem.applyTerrainEffects(
                result.attackingArmy,
                result.defendingArmy,
                battleOptions.terrain
            );
            environmentalEffects.push(...terrainEffects);
        }
        
        // Weather effects
        if (battleOptions.weather && this.tacticalState.weatherEffectsEnabled) {
            const weatherEffects = this.weatherSystem.applyWeatherEffects(
                result.attackingArmy,
                result.defendingArmy,
                battleOptions.weather
            );
            environmentalEffects.push(...weatherEffects);
        }
        
        // Apply environmental modifiers to battle result
        environmentalEffects.forEach(effect => {
            if (effect.target === 'attacker') {
                result.mobileDisplay.attackerPowerAfter *= effect.modifier;
            } else if (effect.target === 'defender') {
                result.mobileDisplay.defenderPowerAfter *= effect.modifier;
            }
        });
        
        result.tacticalData.environmentalEffects = environmentalEffects;
    }
    
    /**
     * Update tactical display for mobile and desktop
     */
    updateTacticalDisplay(result, battleOptions) {
        if (this.mobileUI && this.mobileUI.elements.tacticalPanel) {
            // Update mobile tactical display
            this.mobileUI.elements.tacticalPanel.updateTacticalData(result.tacticalData);
        }
        
        // Trigger tactical display updates
        const tacticalEvent = new CustomEvent('tacticalBattleResolved', {
            detail: {
                result: result,
                options: battleOptions,
                tacticalData: result.tacticalData
            }
        });
        
        window.dispatchEvent(tacticalEvent);
    }
    
    /**
     * Get tactical recommendations for AI or player assistance
     */
    getTacticalRecommendations(attackingArmy, defendingArmy, battleContext = {}) {
        return this.tacticalAI.generateRecommendations(attackingArmy, defendingArmy, battleContext);
    }
    
    /**
     * Analyze optimal formation for given battle context
     */
    recommendOptimalFormation(attackingArmy, defendingArmy, battleContext = {}) {
        return this.tacticalAI.recommendFormation(attackingArmy, defendingArmy, battleContext);
    }
    
    /**
     * Get available tactical options for current game state
     */
    getAvailableTacticalOptions() {
        return {
            formations: Object.keys(TACTICAL_FORMATIONS),
            terrain: Object.keys(TERRAIN_TYPES),
            weather: Object.keys(WEATHER_CONDITIONS),
            specialAbilities: this.getAvailableSpecialAbilities()
        };
    }
    
    /**
     * Get special abilities available to units
     */
    getAvailableSpecialAbilities() {
        const abilities = [];
        
        Object.values(PHASE4_ENHANCED_UNITS).forEach(unit => {
            if (unit.specialAbility) {
                abilities.push({
                    unitType: unit.name,
                    ability: unit.specialAbility,
                    description: this.getSpecialAbilityDescription(unit.specialAbility)
                });
            }
        });
        
        return abilities;
    }
    
    /**
     * Get description for special ability
     */
    getSpecialAbilityDescription(ability) {
        const descriptions = {
            castle_damage: "Can damage castle defenses during siege battles",
            spell_casting: "Can cast battlefield spells affecting multiple units",
            siege_resistance: "Reduced damage from siege weapons",
            rapid_deployment: "Can be deployed faster than normal units"
        };
        
        return descriptions[ability] || "Special combat ability";
    }
    
    /**
     * Mobile-optimized tactical interface methods
     */
    showMobileTacticalOptions(army, position) {
        if (!this.mobileUI) return;
        
        const tacticalOptions = [
            {
                text: `⚡ Offensive Formation`,
                icon: "⚡",
                action: () => this.setArmyFormation(army, 'OFFENSIVE')
            },
            {
                text: `🛡️ Defensive Formation`,
                icon: "🛡️", 
                action: () => this.setArmyFormation(army, 'DEFENSIVE')
            },
            {
                text: `🏃 Flanking Formation`,
                icon: "🏃",
                action: () => this.setArmyFormation(army, 'FLANKING')
            },
            {
                text: `⚖️ Balanced Formation`,
                icon: "⚖️",
                action: () => this.setArmyFormation(army, 'BALANCED')
            }
        ];
        
        this.mobileUI.showContextMenu(position.x, position.y, tacticalOptions);
    }
    
    /**
     * Set army formation with mobile feedback
     */
    setArmyFormation(army, formation) {
        army.formation = formation;
        const formationData = TACTICAL_FORMATIONS[formation];
        
        // Provide haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Show formation confirmation
        if (this.mobileUI && this.mobileUI.elements.notifications) {
            this.mobileUI.elements.notifications.show(
                `${formationData.mobileIcon} Formation: ${formationData.name}`,
                'success',
                2000
            );
        }
        
        console.log(`⚔️ Army formation set to ${formation}:`, formationData);
    }
}

/**
 * FormationSystem - Handles tactical formations
 */
class FormationSystem {
    constructor(tacticalCombat) {
        this.tacticalCombat = tacticalCombat;
    }
    
    calculateFormationAdvantage(attackerFormation, defenderFormation) {
        const FORMATION_MATRIX = {
            'OFFENSIVE': { 'DEFENSIVE': 1.2, 'FLANKING': 0.9, 'BALANCED': 1.1 },
            'DEFENSIVE': { 'OFFENSIVE': 0.8, 'FLANKING': 1.3, 'BALANCED': 1.0 },
            'FLANKING': { 'DEFENSIVE': 0.7, 'OFFENSIVE': 1.4, 'BALANCED': 1.1 },
            'BALANCED': { 'OFFENSIVE': 0.9, 'DEFENSIVE': 1.0, 'FLANKING': 0.9 }
        };
        
        return FORMATION_MATRIX[attackerFormation]?.[defenderFormation] || 1.0;
    }
    
    getAdvantageDescription(attackerFormation, defenderFormation) {
        const attacker = TACTICAL_FORMATIONS[attackerFormation];
        const defender = TACTICAL_FORMATIONS[defenderFormation];
        
        if (!attacker || !defender) return "Formation matchup analysis unavailable";
        
        if (attacker.bestAgainst.includes(defenderFormation)) {
            return `${attacker.name} has tactical advantage over ${defender.name}`;
        } else if (attacker.weakAgainst.includes(defenderFormation)) {
            return `${attacker.name} is disadvantaged against ${defender.name}`;
        } else {
            return `${attacker.name} vs ${defender.name} - neutral matchup`;
        }
    }
}

/**
 * TerrainSystem - Handles terrain effects on combat
 */
class TerrainSystem {
    constructor(tacticalCombat) {
        this.tacticalCombat = tacticalCombat;
    }
    
    applyTerrainEffects(attackingArmy, defendingArmy, terrainType) {
        const terrain = TERRAIN_TYPES[terrainType];
        if (!terrain) return [];
        
        const effects = [];
        
        // Apply terrain modifiers based on unit composition
        const attackerComposition = this.analyzeArmyComposition(attackingArmy);
        const defenderComposition = this.analyzeArmyComposition(defendingArmy);
        
        // Cavalry effects
        if (terrain.modifiers.cavalryBonus && attackerComposition.cavalry > 0) {
            effects.push({
                target: 'attacker',
                modifier: 1 + terrain.modifiers.cavalryBonus,
                description: `${terrain.name} benefits cavalry units`,
                unitType: 'cavalry'
            });
        }
        if (terrain.modifiers.cavalryPenalty && attackerComposition.cavalry > 0) {
            effects.push({
                target: 'attacker',
                modifier: 1 - terrain.modifiers.cavalryPenalty,
                description: `${terrain.name} hinders cavalry units`,
                unitType: 'cavalry'
            });
        }
        
        // Archer effects
        if (terrain.modifiers.archerBonus && attackerComposition.archers > 0) {
            effects.push({
                target: 'attacker',
                modifier: 1 + terrain.modifiers.archerBonus,
                description: `${terrain.name} benefits archer units`,
                unitType: 'archers'
            });
        }
        
        // Infantry effects
        if (terrain.modifiers.infantryBonus && attackerComposition.infantry > 0) {
            effects.push({
                target: 'attacker',
                modifier: 1 + terrain.modifiers.infantryBonus,
                description: `${terrain.name} benefits infantry units`,
                unitType: 'infantry'
            });
        }
        
        return effects;
    }
    
    analyzeArmyComposition(army) {
        if (!army.unitTypes) {
            return { infantry: army.unitCount || 0, archers: 0, cavalry: 0, knights: 0 };
        }
        
        return {
            infantry: army.unitTypes.infantry?.count || 0,
            archers: army.unitTypes.archers?.count || 0,
            cavalry: army.unitTypes.cavalry?.count || 0,
            knights: army.unitTypes.knights?.count || 0
        };
    }
}

/**
 * WeatherSystem - Handles weather effects on combat
 */
class WeatherSystem {
    constructor(tacticalCombat) {
        this.tacticalCombat = tacticalCombat;
    }
    
    applyWeatherEffects(attackingArmy, defendingArmy, weatherType) {
        const weather = WEATHER_CONDITIONS[weatherType];
        if (!weather) return [];
        
        const effects = [];
        
        // Apply weather modifiers
        Object.entries(weather.modifiers).forEach(([modifier, value]) => {
            switch (modifier) {
                case 'archerPenalty':
                    effects.push({
                        target: 'both',
                        modifier: 1 - value,
                        description: `${weather.name} reduces archer effectiveness`,
                        unitType: 'archers'
                    });
                    break;
                    
                case 'moveSpeedReduction':
                    effects.push({
                        target: 'both',
                        modifier: 1 - value,
                        description: `${weather.name} slows unit movement`,
                        affectsMovement: true
                    });
                    break;
                    
                case 'defenseBonus':
                    effects.push({
                        target: 'defender',
                        modifier: 1 + value,
                        description: `${weather.name} aids defensive positions`
                    });
                    break;
                    
                case 'visibilityReduction':
                    effects.push({
                        target: 'both',
                        modifier: 1 - (value * 0.3), // Reduced visibility affects coordination
                        description: `${weather.name} reduces battlefield visibility`
                    });
                    break;
            }
        });
        
        return effects;
    }
}

/**
 * TacticalAI - Provides tactical recommendations and analysis
 */
class TacticalAI {
    constructor(tacticalCombat) {
        this.tacticalCombat = tacticalCombat;
    }
    
    generateRecommendations(attackingArmy, defendingArmy, battleContext) {
        const recommendations = {
            formation: this.recommendFormation(attackingArmy, defendingArmy, battleContext),
            tactics: this.recommendTactics(attackingArmy, defendingArmy, battleContext),
            priority: this.assessBattlePriority(attackingArmy, defendingArmy),
            confidence: this.calculateConfidence(attackingArmy, defendingArmy, battleContext)
        };
        
        return recommendations;
    }
    
    recommendFormation(attackingArmy, defendingArmy, battleContext) {
        const attackerPower = this.tacticalCombat.mobileCombat.calculateArmyPower(attackingArmy);
        const defenderPower = this.tacticalCombat.mobileCombat.calculateArmyPower(defendingArmy);
        
        const powerRatio = attackerPower / defenderPower;
        
        // Recommend formation based on power ratio and context
        if (powerRatio > 1.5) {
            return {
                formation: 'OFFENSIVE',
                reasoning: 'Strong power advantage - press the attack'
            };
        } else if (powerRatio < 0.7) {
            return {
                formation: 'DEFENSIVE',
                reasoning: 'Power disadvantage - focus on survival'
            };
        } else if (battleContext.terrain === 'PLAINS') {
            return {
                formation: 'FLANKING',
                reasoning: 'Open terrain favors mobile tactics'
            };
        } else {
            return {
                formation: 'BALANCED',
                reasoning: 'Uncertain conditions - maintain flexibility'
            };
        }
    }
    
    recommendTactics(attackingArmy, defendingArmy, battleContext) {
        const tactics = [];
        
        // Terrain-based recommendations
        if (battleContext.terrain === 'HILLS') {
            tactics.push('Secure high ground for archer advantage');
        } else if (battleContext.terrain === 'FOREST') {
            tactics.push('Use infantry to exploit forest cover');
        }
        
        // Weather-based recommendations
        if (battleContext.weather === 'FOG') {
            tactics.push('Consider surprise attacks while visibility is low');
        } else if (battleContext.weather === 'RAIN') {
            tactics.push('Reduce reliance on archers in wet conditions');
        }
        
        return tactics;
    }
    
    assessBattlePriority(attackingArmy, defendingArmy) {
        const attackerPower = this.tacticalCombat.mobileCombat.calculateArmyPower(attackingArmy);
        const defenderPower = this.tacticalCombat.mobileCombat.calculateArmyPower(defendingArmy);
        
        const powerRatio = attackerPower / defenderPower;
        
        if (powerRatio > 2.0) return 'high_priority_attack';
        if (powerRatio < 0.5) return 'avoid_engagement';
        if (powerRatio > 1.2) return 'favorable_attack';
        if (powerRatio < 0.8) return 'defensive_posture';
        return 'balanced_engagement';
    }
    
    calculateConfidence(attackingArmy, defendingArmy, battleContext) {
        let confidence = 0.5; // Base 50% confidence
        
        const attackerPower = this.tacticalCombat.mobileCombat.calculateArmyPower(attackingArmy);
        const defenderPower = this.tacticalCombat.mobileCombat.calculateArmyPower(defendingArmy);
        const powerRatio = attackerPower / defenderPower;
        
        // Adjust confidence based on power ratio
        if (powerRatio > 1.5) confidence += 0.3;
        else if (powerRatio > 1.2) confidence += 0.2;
        else if (powerRatio < 0.7) confidence -= 0.3;
        else if (powerRatio < 0.8) confidence -= 0.2;
        
        // Environmental factors
        if (battleContext.terrain && battleContext.weather) {
            confidence += 0.1; // More data = higher confidence
        }
        
        return Math.max(0.1, Math.min(0.9, confidence));
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TacticalCombatSystem, 
        FormationSystem, 
        TerrainSystem, 
        WeatherSystem,
        TacticalAI,
        PHASE4_ENHANCED_UNITS,
        TACTICAL_FORMATIONS,
        TERRAIN_TYPES,
        WEATHER_CONDITIONS
    };
}