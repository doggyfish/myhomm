/**
 * MobileCombatSystem - Power-based combat optimized for mobile visualization
 * Enhanced unit power system with mobile-friendly battle interfaces
 */

// Mobile-optimized unit types with visual elements
const MOBILE_UNIT_TYPES = {
    INFANTRY: {
        level: 1,
        basePower: 1,
        cost: 3,
        productionTime: 1000,
        name: "Infantry",
        description: "Basic melee fighters",
        combatType: "melee",
        mobileIcon: "⚔️",
        displayColor: "#8B4513",
        strength: "balanced",
        weakness: "cavalry"
    },
    ARCHERS: {
        level: 2, 
        basePower: 2,
        cost: 4,
        productionTime: 2000,
        name: "Archers",
        description: "Ranged combat specialists",
        combatType: "ranged",
        mobileIcon: "🏹",
        displayColor: "#228B22",
        strength: "infantry",
        weakness: "cavalry"
    },
    CAVALRY: {
        level: 3,
        basePower: 3,
        cost: 6,
        productionTime: 3000,
        name: "Cavalry", 
        description: "Fast mounted warriors",
        combatType: "mounted",
        mobileIcon: "🐎",
        displayColor: "#4169E1",
        strength: "archers",
        weakness: "infantry"
    },
    KNIGHTS: {
        level: 4,
        basePower: 5,
        cost: 12,
        productionTime: 5000,
        name: "Knights",
        description: "Elite heavy armor units",
        combatType: "elite",
        mobileIcon: "🛡️",
        displayColor: "#FFD700",
        strength: "all",
        weakness: "none"
    }
};

class MobileCombatSystem {
    constructor(game, mobileUIManager) {
        this.game = game;
        this.mobileUI = mobileUIManager;
        
        // Combat visualization settings
        this.visualSettings = {
            animationDuration: 2000, // 2 seconds for mobile
            showDetailedBreakdown: true,
            useHapticFeedback: true,
            showPowerNumbers: true,
            highlightAdvantages: true
        };
        
        // Battle interface components
        this.battleInterface = new MobileBattleInterface(this);
        this.combatAnimations = new MobileCombatAnimations(this);
        this.powerCalculator = new MobilePowerCalculator(this);
        
        // Active battle state
        this.activeBattle = null;
        this.battleHistory = [];
        
        console.log('⚔️ MobileCombatSystem initialized');
    }
    
    /**
     * Enhanced battle resolution with mobile-optimized visualization
     */
    resolveBattle(attackingArmy, defendingArmy, battleLocation = null) {
        console.log('⚔️ Mobile battle starting:', {
            attacker: this.calculateArmyPower(attackingArmy),
            defender: this.calculateArmyPower(defendingArmy)
        });
        
        // Initialize battle result structure
        const result = {
            id: Date.now(),
            winner: null,
            location: battleLocation,
            startTime: Date.now(),
            endTime: null,
            
            // Army states
            attackingArmy: this.cloneArmyState(attackingArmy),
            defendingArmy: this.cloneArmyState(defendingArmy),
            
            // Battle statistics
            attackerLosses: this.initializeLosses(),
            defenderLosses: this.initializeLosses(),
            
            // Mobile display data
            mobileDisplay: {
                attackerPowerBefore: this.calculateArmyPower(attackingArmy),
                defenderPowerBefore: this.calculateArmyPower(defendingArmy),
                attackerPowerAfter: 0,
                defenderPowerAfter: 0,
                battlePhases: [],
                advantageBreakdown: {},
                totalDuration: 0
            },
            
            // Detailed battle log for analysis
            battleLog: [],
            phases: []
        };
        
        // Set as active battle for mobile interface
        this.activeBattle = result;
        
        // Show mobile battle interface
        this.battleInterface.showBattleStart(result);
        
        // Calculate tactical advantages
        result.mobileDisplay.advantageBreakdown = this.calculateTacticalAdvantages(
            attackingArmy, defendingArmy
        );
        
        // Create battle phases for mobile visualization
        const battlePhases = this.createMobileBattlePhases(attackingArmy, defendingArmy);
        result.mobileDisplay.battlePhases = battlePhases;
        
        // Execute battle phases with mobile feedback
        this.executeBattlePhasesWithMobileVisuals(battlePhases, result);
        
        // Calculate final results
        result.mobileDisplay.attackerPowerAfter = this.calculateRemainingPower(
            attackingArmy, result.attackerLosses
        );
        result.mobileDisplay.defenderPowerAfter = this.calculateRemainingPower(
            defendingArmy, result.defenderLosses
        );
        
        // Determine winner
        result.winner = this.determineWinner(result);
        result.endTime = Date.now();
        result.mobileDisplay.totalDuration = result.endTime - result.startTime;
        
        // Show mobile battle results
        this.battleInterface.showBattleResult(result);
        
        // Add to battle history
        this.battleHistory.push(result);
        
        // Provide haptic feedback
        if (this.visualSettings.useHapticFeedback) {
            this.provideBattleHapticFeedback(result);
        }
        
        this.activeBattle = null;
        
        console.log('⚔️ Mobile battle completed:', {
            winner: result.winner,
            duration: result.mobileDisplay.totalDuration
        });
        
        return result;
    }
    
    /**
     * Calculate army power with mobile optimization
     */
    calculateArmyPower(army) {
        if (!army || !army.unitTypes) {
            return army.unitCount || 0; // Fallback for legacy armies
        }
        
        let totalPower = 0;
        
        Object.entries(army.unitTypes).forEach(([unitType, data]) => {
            const unitInfo = MOBILE_UNIT_TYPES[unitType.toUpperCase()];
            if (unitInfo && data.count > 0) {
                totalPower += data.count * unitInfo.basePower;
            }
        });
        
        return totalPower;
    }
    
    /**
     * Calculate tactical advantages for mobile display
     */
    calculateTacticalAdvantages(attackingArmy, defendingArmy) {
        const advantages = {
            attacker: [],
            defender: [],
            neutral: []
        };
        
        // Analyze unit type advantages
        Object.entries(attackingArmy.unitTypes || {}).forEach(([unitType, data]) => {
            if (data.count === 0) return;
            
            const unitInfo = MOBILE_UNIT_TYPES[unitType.toUpperCase()];
            if (!unitInfo) return;
            
            // Check advantages against defender units
            Object.entries(defendingArmy.unitTypes || {}).forEach(([defUnitType, defData]) => {
                if (defData.count === 0) return;
                
                const defUnitInfo = MOBILE_UNIT_TYPES[defUnitType.toUpperCase()];
                if (!defUnitInfo) return;
                
                if (unitInfo.strength === defUnitType.toLowerCase()) {
                    advantages.attacker.push({
                        type: 'unit_advantage',
                        attacker: unitInfo.name,
                        defender: defUnitInfo.name,
                        bonus: 1.5
                    });
                } else if (unitInfo.weakness === defUnitType.toLowerCase()) {
                    advantages.defender.push({
                        type: 'unit_advantage',
                        attacker: defUnitInfo.name,
                        defender: unitInfo.name,
                        bonus: 1.5
                    });
                }
            });
        });
        
        // Add terrain and other advantages here
        
        return advantages;
    }
    
    /**
     * Create battle phases optimized for mobile visualization
     */
    createMobileBattlePhases(attackingArmy, defendingArmy) {
        const phases = [];
        
        // Phase 1: Ranged combat (Archers)
        const attackerArchers = attackingArmy.unitTypes?.archers?.count || 0;
        const defenderArchers = defendingArmy.unitTypes?.archers?.count || 0;
        
        if (attackerArchers > 0 || defenderArchers > 0) {
            phases.push({
                name: 'Ranged Combat',
                type: 'ranged',
                icon: '🏹',
                description: 'Archers exchange volleys',
                participants: {
                    attacker: { archers: attackerArchers },
                    defender: { archers: defenderArchers }
                }
            });
        }
        
        // Phase 2: Cavalry charge
        const attackerCavalry = attackingArmy.unitTypes?.cavalry?.count || 0;
        const defenderCavalry = defendingArmy.unitTypes?.cavalry?.count || 0;
        
        if (attackerCavalry > 0 || defenderCavalry > 0) {
            phases.push({
                name: 'Cavalry Charge',
                type: 'mounted',
                icon: '🐎',
                description: 'Cavalry units clash',
                participants: {
                    attacker: { cavalry: attackerCavalry },
                    defender: { cavalry: defenderCavalry }
                }
            });
        }
        
        // Phase 3: Melee combat
        const attackerInfantry = attackingArmy.unitTypes?.infantry?.count || 0;
        const defenderInfantry = defendingArmy.unitTypes?.infantry?.count || 0;
        
        if (attackerInfantry > 0 || defenderInfantry > 0) {
            phases.push({
                name: 'Melee Combat',
                type: 'melee',
                icon: '⚔️',
                description: 'Infantry engage in close combat',
                participants: {
                    attacker: { infantry: attackerInfantry },
                    defender: { infantry: defenderInfantry }
                }
            });
        }
        
        // Phase 4: Elite combat (Knights)
        const attackerKnights = attackingArmy.unitTypes?.knights?.count || 0;
        const defenderKnights = defendingArmy.unitTypes?.knights?.count || 0;
        
        if (attackerKnights > 0 || defenderKnights > 0) {
            phases.push({
                name: 'Elite Combat',
                type: 'elite',
                icon: '🛡️',
                description: 'Elite knights battle',
                participants: {
                    attacker: { knights: attackerKnights },
                    defender: { knights: defenderKnights }
                }
            });
        }
        
        return phases;
    }
    
    /**
     * Execute battle phases with mobile-specific visuals and feedback
     */
    executeBattlePhasesWithMobileVisuals(phases, result) {
        phases.forEach((phase, index) => {
            console.log(`⚔️ Executing ${phase.name}`);
            
            // Calculate phase results
            const phaseResult = this.executePhase(phase, result);
            result.phases.push(phaseResult);
            
            // Show mobile phase visualization
            this.battleInterface.showPhaseResult(phase, phaseResult, index);
            
            // Add haptic feedback for each phase
            if (this.visualSettings.useHapticFeedback) {
                this.providePhaseHapticFeedback(phase.type);
            }
        });
    }
    
    /**
     * Execute individual battle phase
     */
    executePhase(phase, result) {
        const phaseResult = {
            name: phase.name,
            type: phase.type,
            attackerCasualties: {},
            defenderCasualties: {},
            powerExchanged: 0,
            advantages: []
        };
        
        // Simple phase resolution based on unit types and power
        Object.entries(phase.participants.attacker).forEach(([unitType, count]) => {
            if (count === 0) return;
            
            const unitInfo = MOBILE_UNIT_TYPES[unitType.toUpperCase()];
            const defenderCount = phase.participants.defender[unitType] || 0;
            
            if (defenderCount > 0) {
                // Same unit type combat
                const casualties = this.resolveSameUnitCombat(count, defenderCount, unitInfo);
                phaseResult.attackerCasualties[unitType] = casualties.attacker;
                phaseResult.defenderCasualties[unitType] = casualties.defender;
                
                // Update main result
                result.attackerLosses[unitType] += casualties.attacker;
                result.defenderLosses[unitType] += casualties.defender;
            } else {
                // Cross-unit type combat with advantages
                const crossCombat = this.resolveCrossUnitCombat(
                    unitType, count, phase.participants.defender, unitInfo, result
                );
                
                Object.assign(phaseResult.attackerCasualties, crossCombat.attackerCasualties);
                Object.assign(phaseResult.defenderCasualties, crossCombat.defenderCasualties);
                phaseResult.advantages.push(...crossCombat.advantages);
            }
        });
        
        return phaseResult;
    }
    
    /**
     * Resolve combat between same unit types
     */
    resolveSameUnitCombat(attackerCount, defenderCount, unitInfo) {
        const totalPower = (attackerCount + defenderCount) * unitInfo.basePower;
        const attackerPower = attackerCount * unitInfo.basePower;
        const defenderPower = defenderCount * unitInfo.basePower;
        
        // Calculate casualties based on power ratio with some randomness
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const attackerAdvantage = 1.1; // Slight attacker advantage
        
        const effectiveAttackerPower = attackerPower * attackerAdvantage * randomFactor;
        const effectiveDefenderPower = defenderPower * randomFactor;
        
        let attackerCasualties, defenderCasualties;
        
        if (effectiveAttackerPower > effectiveDefenderPower) {
            // Attacker wins
            defenderCasualties = defenderCount;
            attackerCasualties = Math.max(0, Math.floor(
                attackerCount * (defenderPower / attackerPower) * 0.7
            ));
        } else {
            // Defender wins
            attackerCasualties = attackerCount;
            defenderCasualties = Math.max(0, Math.floor(
                defenderCount * (attackerPower / defenderPower) * 0.7
            ));
        }
        
        return {
            attacker: Math.min(attackerCasualties, attackerCount),
            defender: Math.min(defenderCasualties, defenderCount)
        };
    }
    
    /**
     * Resolve cross-unit type combat with tactical advantages
     */
    resolveCrossUnitCombat(attackerUnitType, attackerCount, defenderUnits, attackerUnitInfo, result) {
        const casualties = {
            attackerCasualties: {},
            defenderCasualties: {},
            advantages: []
        };
        
        let remainingAttackerCount = attackerCount;
        
        // Fight against each defender unit type
        Object.entries(defenderUnits).forEach(([defenderUnitType, defenderCount]) => {
            if (remainingAttackerCount === 0 || defenderCount === 0) return;
            
            const defenderUnitInfo = MOBILE_UNIT_TYPES[defenderUnitType.toUpperCase()];
            if (!defenderUnitInfo) return;
            
            // Calculate advantage multiplier
            let advantageMultiplier = 1.0;
            let advantageDescription = null;
            
            if (attackerUnitInfo.strength === defenderUnitType.toLowerCase()) {
                advantageMultiplier = 1.5;
                advantageDescription = `${attackerUnitInfo.name} effective against ${defenderUnitInfo.name}`;
            } else if (attackerUnitInfo.weakness === defenderUnitType.toLowerCase()) {
                advantageMultiplier = 0.7;
                advantageDescription = `${attackerUnitInfo.name} weak against ${defenderUnitInfo.name}`;
            }
            
            if (advantageDescription) {
                casualties.advantages.push({
                    type: 'tactical',
                    description: advantageDescription,
                    multiplier: advantageMultiplier
                });
            }
            
            // Calculate effective power
            const attackerPower = remainingAttackerCount * attackerUnitInfo.basePower * advantageMultiplier;
            const defenderPower = defenderCount * defenderUnitInfo.basePower;
            
            // Resolve combat
            const combat = this.resolvePowerCombat(
                remainingAttackerCount, defenderCount, 
                attackerPower, defenderPower,
                attackerUnitInfo, defenderUnitInfo
            );
            
            // Record casualties
            casualties.attackerCasualties[attackerUnitType] = 
                (casualties.attackerCasualties[attackerUnitType] || 0) + combat.attackerCasualties;
            casualties.defenderCasualties[defenderUnitType] = 
                (casualties.defenderCasualties[defenderUnitType] || 0) + combat.defenderCasualties;
            
            remainingAttackerCount -= combat.attackerCasualties;
        });
        
        return casualties;
    }
    
    /**
     * Resolve combat based on pure power calculation
     */
    resolvePowerCombat(attackerCount, defenderCount, attackerPower, defenderPower, attackerUnit, defenderUnit) {
        const totalPower = attackerPower + defenderPower;
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        if (attackerPower > defenderPower) {
            // Attacker victory
            const powerRatio = defenderPower / attackerPower * randomFactor;
            return {
                attackerCasualties: Math.floor(attackerCount * powerRatio * 0.6),
                defenderCasualties: defenderCount
            };
        } else {
            // Defender victory or stalemate
            const powerRatio = attackerPower / defenderPower * randomFactor;
            return {
                attackerCasualties: attackerCount,
                defenderCasualties: Math.floor(defenderCount * powerRatio * 0.6)
            };
        }
    }
    
    /**
     * Determine battle winner
     */
    determineWinner(result) {
        const finalAttackerPower = result.mobileDisplay.attackerPowerAfter;
        const finalDefenderPower = result.mobileDisplay.defenderPowerAfter;
        
        if (finalAttackerPower > finalDefenderPower) {
            return result.attackingArmy.owner;
        } else if (finalDefenderPower > finalAttackerPower) {
            return result.defendingArmy.owner;
        } else {
            return null; // Draw (rare)
        }
    }
    
    /**
     * Utility methods
     */
    cloneArmyState(army) {
        return {
            owner: army.owner,
            unitCount: army.unitCount,
            unitTypes: army.unitTypes ? JSON.parse(JSON.stringify(army.unitTypes)) : null,
            x: army.x,
            y: army.y
        };
    }
    
    initializeLosses() {
        return {
            infantry: 0,
            archers: 0,
            cavalry: 0,
            knights: 0
        };
    }
    
    calculateRemainingPower(army, losses) {
        if (!army.unitTypes) {
            return Math.max(0, army.unitCount - Object.values(losses).reduce((sum, loss) => sum + loss, 0));
        }
        
        let remainingPower = 0;
        
        Object.entries(army.unitTypes).forEach(([unitType, data]) => {
            const unitInfo = MOBILE_UNIT_TYPES[unitType.toUpperCase()];
            if (unitInfo) {
                const remainingCount = Math.max(0, data.count - (losses[unitType] || 0));
                remainingPower += remainingCount * unitInfo.basePower;
            }
        });
        
        return remainingPower;
    }
    
    /**
     * Haptic feedback methods
     */
    provideBattleHapticFeedback(result) {
        if (!navigator.vibrate) return;
        
        if (result.winner === this.game.getHumanPlayer()) {
            // Victory pattern
            navigator.vibrate([100, 50, 100, 50, 200]);
        } else {
            // Defeat pattern
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    providePhaseHapticFeedback(phaseType) {
        if (!navigator.vibrate) return;
        
        switch (phaseType) {
            case 'ranged':
                navigator.vibrate([30, 30, 30]);
                break;
            case 'mounted':
                navigator.vibrate([50, 20, 50]);
                break;
            case 'melee':
                navigator.vibrate([80]);
                break;
            case 'elite':
                navigator.vibrate([100, 50, 100]);
                break;
        }
    }
    
    /**
     * Public API methods
     */
    getBattleHistory(limit = 10) {
        return this.battleHistory.slice(-limit);
    }
    
    getActiveBattle() {
        return this.activeBattle;
    }
    
    getUnitTypeInfo(unitType) {
        return MOBILE_UNIT_TYPES[unitType.toUpperCase()] || null;
    }
    
    calculateArmyComposition(army) {
        if (!army.unitTypes) {
            return { infantry: army.unitCount, total: army.unitCount, power: army.unitCount };
        }
        
        const composition = { ...army.unitTypes };
        composition.total = Object.values(army.unitTypes).reduce((sum, data) => sum + data.count, 0);
        composition.power = this.calculateArmyPower(army);
        
        return composition;
    }
}

/**
 * MobileBattleInterface - Touch-optimized battle visualization
 */
class MobileBattleInterface {
    constructor(combatSystem) {
        this.combatSystem = combatSystem;
        this.mobileUI = combatSystem.mobileUI;
        this.isVisible = false;
        this.currentBattle = null;
        this.animationState = 'idle';
    }
    
    showBattleStart(battle) {
        this.currentBattle = battle;
        this.isVisible = true;
        this.animationState = 'starting';
        
        console.log('📱 Battle interface shown');
        
        // Show battle preview with power comparison
        const content = this.createBattleStartContent(battle);
        this.mobileUI.showBottomSheet(content, {
            height: this.mobileUI.screenInfo.height * 0.4
        });
    }
    
    showPhaseResult(phase, result, index) {
        console.log(`📱 Showing phase ${index + 1}: ${phase.name}`);
        
        // Update battle interface with phase results
        if (this.mobileUI.elements.notifications) {
            this.mobileUI.elements.notifications.show(
                `${phase.icon} ${phase.name}`, 
                'info', 
                1500
            );
        }
    }
    
    showBattleResult(battle) {
        this.animationState = 'completed';
        
        const winner = battle.winner;
        const isPlayerVictory = winner === this.combatSystem.game.getHumanPlayer();
        
        console.log('📱 Battle result shown:', {
            winner: winner.name,
            playerVictory: isPlayerVictory
        });
        
        // Show victory/defeat notification
        const resultMessage = isPlayerVictory ? 
            `🎉 Victory! You won the battle!` :
            `💀 Defeat! ${winner.name} won the battle.`;
        
        if (this.mobileUI.elements.notifications) {
            this.mobileUI.elements.notifications.show(
                resultMessage,
                isPlayerVictory ? 'success' : 'error',
                4000
            );
        }
        
        // Show detailed results in bottom sheet
        const resultContent = this.createBattleResultContent(battle);
        this.mobileUI.showBottomSheet(resultContent, {
            height: this.mobileUI.screenInfo.height * 0.5
        });
        
        // Auto-hide after delay
        setTimeout(() => {
            this.hide();
        }, 5000);
    }
    
    createBattleStartContent(battle) {
        const attackerPower = battle.mobileDisplay.attackerPowerBefore;
        const defenderPower = battle.mobileDisplay.defenderPowerBefore;
        
        return {
            title: '⚔️ Battle Starting',
            sections: [
                {
                    type: 'power_comparison',
                    attacker: {
                        name: battle.attackingArmy.owner.name,
                        power: attackerPower,
                        units: battle.attackingArmy.unitCount
                    },
                    defender: {
                        name: battle.defendingArmy.owner.name,
                        power: defenderPower,
                        units: battle.defendingArmy.unitCount
                    }
                },
                {
                    type: 'advantages',
                    data: battle.mobileDisplay.advantageBreakdown
                }
            ]
        };
    }
    
    createBattleResultContent(battle) {
        const isPlayerVictory = battle.winner === this.combatSystem.game.getHumanPlayer();
        
        return {
            title: isPlayerVictory ? '🎉 Victory!' : '💀 Defeat',
            sections: [
                {
                    type: 'result_summary',
                    winner: battle.winner.name,
                    duration: battle.mobileDisplay.totalDuration,
                    powerBefore: {
                        attacker: battle.mobileDisplay.attackerPowerBefore,
                        defender: battle.mobileDisplay.defenderPowerBefore
                    },
                    powerAfter: {
                        attacker: battle.mobileDisplay.attackerPowerAfter,
                        defender: battle.mobileDisplay.defenderPowerAfter
                    }
                },
                {
                    type: 'casualties',
                    attackerLosses: battle.attackerLosses,
                    defenderLosses: battle.defenderLosses
                }
            ]
        };
    }
    
    hide() {
        this.isVisible = false;
        this.currentBattle = null;
        this.animationState = 'idle';
        
        this.mobileUI.hideBottomSheet();
        console.log('📱 Battle interface hidden');
    }
}

/**
 * MobileCombatAnimations - Optimized battle animations for mobile
 */
class MobileCombatAnimations {
    constructor(combatSystem) {
        this.combatSystem = combatSystem;
        this.animationsEnabled = true;
        this.activeAnimations = [];
    }
    
    playBattleStartAnimation(battle) {
        if (!this.animationsEnabled) return;
        
        console.log('📱 Playing battle start animation');
        // Implement battle start animation
    }
    
    playPhaseAnimation(phase, result) {
        if (!this.animationsEnabled) return;
        
        console.log(`📱 Playing ${phase.name} animation`);
        // Implement phase-specific animations
    }
    
    playBattleEndAnimation(result) {
        if (!this.animationsEnabled) return;
        
        console.log('📱 Playing battle end animation');
        // Implement battle conclusion animation
    }
    
    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
        if (!enabled) {
            this.activeAnimations = [];
        }
    }
}

/**
 * MobilePowerCalculator - Utility class for power calculations
 */
class MobilePowerCalculator {
    constructor(combatSystem) {
        this.combatSystem = combatSystem;
    }
    
    calculateUnitEffectiveness(unitType, targetUnitType) {
        const unit = MOBILE_UNIT_TYPES[unitType.toUpperCase()];
        if (!unit) return 1.0;
        
        if (unit.strength === targetUnitType.toLowerCase()) {
            return 1.5; // 50% bonus
        } else if (unit.weakness === targetUnitType.toLowerCase()) {
            return 0.7; // 30% penalty
        }
        
        return 1.0; // Neutral
    }
    
    getPowerBreakdown(army) {
        const breakdown = {};
        let totalPower = 0;
        
        if (army.unitTypes) {
            Object.entries(army.unitTypes).forEach(([unitType, data]) => {
                const unitInfo = MOBILE_UNIT_TYPES[unitType.toUpperCase()];
                if (unitInfo && data.count > 0) {
                    const power = data.count * unitInfo.basePower;
                    breakdown[unitType] = {
                        count: data.count,
                        individualPower: unitInfo.basePower,
                        totalPower: power,
                        percentage: 0 // Will be calculated after total
                    };
                    totalPower += power;
                }
            });
            
            // Calculate percentages
            Object.values(breakdown).forEach(unit => {
                unit.percentage = totalPower > 0 ? (unit.totalPower / totalPower) * 100 : 0;
            });
        }
        
        return {
            breakdown,
            totalPower,
            totalUnits: Object.values(breakdown).reduce((sum, unit) => sum + unit.count, 0)
        };
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        MobileCombatSystem, 
        MobileBattleInterface, 
        MobileCombatAnimations, 
        MobilePowerCalculator,
        MOBILE_UNIT_TYPES 
    };
}