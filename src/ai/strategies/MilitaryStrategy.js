import { AIStrategy } from '../AIStrategy.js';
import { AIDecision } from '../AIDecision.js';
import { ConfigurationManager } from '../../config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

export class MilitaryStrategy extends AIStrategy {
    constructor(aiController) {
        super(aiController);
        this.unitPriorities = CONFIG.get('ai.unitPriorities') || {
            'swordsman': 80,
            'archer': 75,
            'knight': 90,
            'guard': 70,
            'wizard': 85
        };
        this.armyComposition = CONFIG.get('ai.armyComposition') || {
            'balanced': { 'swordsman': 0.4, 'archer': 0.4, 'knight': 0.2 },
            'offensive': { 'knight': 0.5, 'swordsman': 0.3, 'archer': 0.2 },
            'defensive': { 'guard': 0.5, 'archer': 0.3, 'swordsman': 0.2 }
        };
        this.threatAnalysisRange = CONFIG.get('ai.threatAnalysisRange') || 10;
    }

    evaluate(gameState) {
        const decisions = [];
        const player = this.ai.player;
        
        // Evaluate army production needs
        const productionDecisions = this.evaluateArmyProduction(player, gameState);
        decisions.push(...productionDecisions);

        // Evaluate combat opportunities
        const combatDecisions = this.evaluateCombatOpportunities(player, gameState);
        decisions.push(...combatDecisions);

        // Evaluate defensive needs
        const defenseDecisions = this.evaluateDefensiveNeeds(player, gameState);
        decisions.push(...defenseDecisions);

        return decisions;
    }

    evaluateArmyProduction(player, gameState) {
        const decisions = [];
        const castles = this.getPlayerCastles(player, gameState);
        
        castles.forEach(castle => {
            const productionDecisions = this.evaluateCastleProduction(castle, player, gameState);
            decisions.push(...productionDecisions);
        });

        return decisions;
    }

    evaluateCastleProduction(castle, player, gameState) {
        const decisions = [];
        
        // Check if castle can produce units
        if (!this.canProduceUnits(castle)) {
            return decisions;
        }

        // Analyze current military strength
        const militaryAnalysis = this.analyzeMilitaryStrength(player, gameState);
        
        // Determine production strategy based on threat level
        const threatLevel = this.assessThreatLevel(castle, gameState);
        const productionStrategy = this.determineProductionStrategy(threatLevel, militaryAnalysis);
        
        // Generate unit production decisions
        const unitDecisions = this.generateUnitProductionDecisions(castle, productionStrategy, gameState);
        decisions.push(...unitDecisions);

        return decisions;
    }

    generateUnitProductionDecisions(castle, strategy, gameState) {
        const decisions = [];
        const player = this.ai.player;
        const composition = this.armyComposition[strategy] || this.armyComposition['balanced'];
        
        Object.entries(composition).forEach(([unitType, ratio]) => {
            const unitDecision = this.evaluateUnitProduction(castle, unitType, ratio, gameState);
            if (unitDecision) {
                decisions.push(unitDecision);
            }
        });

        return decisions;
    }

    evaluateUnitProduction(castle, unitType, targetRatio, gameState) {
        const player = this.ai.player;
        
        // Check if we can produce this unit type
        if (!this.canProduceUnitType(castle, unitType)) {
            return null;
        }

        // Check if we can afford this unit
        const unitCost = this.getUnitCost(unitType);
        if (!this.canAffordUnit(player, unitCost)) {
            return null;
        }

        // Calculate priority based on current army composition
        const currentComposition = this.getCurrentArmyComposition(player, gameState);
        const currentRatio = currentComposition[unitType] || 0;
        
        let priority = this.unitPriorities[unitType] || 50;
        
        // Increase priority if we're below target ratio
        if (currentRatio < targetRatio) {
            priority += Math.round((targetRatio - currentRatio) * 100);
        }

        // Apply difficulty and threat modifiers
        priority = this.applyMilitaryModifiers(priority, unitType, gameState);

        if (priority <= 0) {
            return null;
        }

        return new AIDecision(
            'produce',
            priority,
            `produce_${unitType}`,
            castle,
            unitCost,
            this.calculateUnitBenefit(unitType, gameState)
        );
    }

    evaluateCombatOpportunities(player, gameState) {
        const decisions = [];
        const armies = this.getPlayerArmies(player, gameState);
        
        armies.forEach(army => {
            const combatDecisions = this.evaluateArmyCombat(army, gameState);
            decisions.push(...combatDecisions);
        });

        return decisions;
    }

    evaluateArmyCombat(army, gameState) {
        const decisions = [];
        
        // Find potential targets
        const targets = this.findCombatTargets(army, gameState);
        
        targets.forEach(target => {
            const combatDecision = this.evaluateCombatTarget(army, target, gameState);
            if (combatDecision) {
                decisions.push(combatDecision);
            }
        });

        return decisions;
    }

    evaluateCombatTarget(army, target, gameState) {
        // Calculate combat odds
        const combatAnalysis = this.analyzeCombatOdds(army, target, gameState);
        
        if (combatAnalysis.winChance < 0.6) {
            // Don't attack if chances are too low
            return null;
        }

        // Calculate strategic value of target
        const strategicValue = this.calculateTargetValue(target, gameState);
        
        const priority = Math.round(combatAnalysis.winChance * strategicValue);

        return new AIDecision(
            'attack',
            priority,
            `attack_${target.id}`,
            target,
            0, // No resource cost for attacking
            strategicValue
        );
    }

    evaluateDefensiveNeeds(player, gameState) {
        const decisions = [];
        const castles = this.getPlayerCastles(player, gameState);
        
        castles.forEach(castle => {
            const defenseDecisions = this.evaluateCastleDefense(castle, gameState);
            decisions.push(...defenseDecisions);
        });

        return decisions;
    }

    evaluateCastleDefense(castle, gameState) {
        const decisions = [];
        
        // Check if castle is under threat
        const threatLevel = this.assessThreatLevel(castle, gameState);
        
        if (threatLevel > 0.5) {
            // Consider defensive unit production
            const defenseDecision = this.createDefenseDecision(castle, threatLevel, gameState);
            if (defenseDecision) {
                decisions.push(defenseDecision);
            }
        }

        return decisions;
    }

    createDefenseDecision(castle, threatLevel, gameState) {
        // Prioritize defensive units
        const defensiveUnits = ['guard', 'archer'];
        const unitType = defensiveUnits[Math.floor(Math.random() * defensiveUnits.length)];
        
        const priority = Math.round(80 + (threatLevel * 20));
        
        return new AIDecision(
            'produce',
            priority,
            `defend_${unitType}`,
            castle,
            this.getUnitCost(unitType),
            60
        );
    }

    // Helper methods
    getPlayerCastles(player, gameState) {
        // This would get castles from game state
        return []; // Placeholder
    }

    getPlayerArmies(player, gameState) {
        // This would get armies from game state
        return []; // Placeholder
    }

    canProduceUnits(castle) {
        // Check if castle has production buildings
        return true; // Placeholder
    }

    canProduceUnitType(castle, unitType) {
        // Check if castle can produce specific unit type
        return true; // Placeholder
    }

    getUnitCost(unitType) {
        const unitConfig = CONFIG.get(`units.${unitType}`);
        return unitConfig?.cost || { gold: 50, wood: 25 };
    }

    canAffordUnit(player, cost) {
        const resources = player.resourceManager.resources;
        
        return Object.entries(cost).every(([resourceType, amount]) => {
            return resources[resourceType] >= amount;
        });
    }

    analyzeMilitaryStrength(player, gameState) {
        // Analyze player's current military strength
        return {
            totalPower: 0,
            armyCount: 0,
            unitComposition: {}
        }; // Placeholder
    }

    getCurrentArmyComposition(player, gameState) {
        // Get current army unit composition ratios
        return {}; // Placeholder
    }

    assessThreatLevel(castle, gameState) {
        // Assess threat level to castle from nearby enemies
        return 0.3; // Placeholder (30% threat)
    }

    determineProductionStrategy(threatLevel, militaryAnalysis) {
        if (threatLevel > 0.7) {
            return 'defensive';
        } else if (threatLevel < 0.3 && militaryAnalysis.totalPower > 100) {
            return 'offensive';
        }
        return 'balanced';
    }

    findCombatTargets(army, gameState) {
        // Find enemy armies and castles within range
        return []; // Placeholder
    }

    analyzeCombatOdds(attacker, defender, gameState) {
        // Calculate combat outcome probability
        return {
            winChance: 0.7,
            expectedLosses: 0.2
        }; // Placeholder
    }

    calculateTargetValue(target, gameState) {
        // Calculate strategic value of attacking target
        if (target.type === 'castle') {
            return 90;
        } else if (target.type === 'army') {
            return 60;
        }
        return 30;
    }

    calculateUnitBenefit(unitType, gameState) {
        const benefitMap = {
            'swordsman': 50,
            'archer': 55,
            'knight': 70,
            'guard': 45,
            'wizard': 65
        };
        
        return benefitMap[unitType] || 40;
    }

    applyMilitaryModifiers(priority, unitType, gameState) {
        // Apply difficulty and situational modifiers
        const difficultyModifiers = {
            'easy': 0.8,
            'medium': 1.0,
            'hard': 1.2,
            'expert': 1.4
        };
        
        const modifier = difficultyModifiers[this.ai.difficulty] || 1.0;
        return Math.round(priority * modifier);
    }

    setDifficulty(difficulty) {
        // Update strategy parameters based on difficulty
        const difficultyConfig = CONFIG.get(`ai.difficulty.${difficulty}`) || {};
        
        if (difficultyConfig.unitPriorities) {
            this.unitPriorities = { ...this.unitPriorities, ...difficultyConfig.unitPriorities };
        }
        
        if (difficultyConfig.armyComposition) {
            this.armyComposition = { ...this.armyComposition, ...difficultyConfig.armyComposition };
        }
    }
}