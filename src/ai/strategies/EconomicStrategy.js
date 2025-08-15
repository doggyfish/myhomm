import { AIStrategy } from '../AIStrategy.js';
import { AIDecision } from '../AIDecision.js';
import { ConfigurationManager } from '../../config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

export class EconomicStrategy extends AIStrategy {
    constructor(aiController) {
        super(aiController);
        this.buildingPriorities = CONFIG.get('ai.buildingPriorities') || {
            'townHall': 100,
            'goldMine': 90,
            'lumber_mill': 85,
            'quarry': 80,
            'mage_tower': 75,
            'barracks': 70,
            'archery_range': 65,
            'stable': 60,
            'wall': 50
        };
        this.resourceThresholds = CONFIG.get('ai.resourceThresholds') || {
            gold: 1000,
            wood: 500,
            stone: 300,
            mana: 200
        };
    }

    evaluate(gameState) {
        const decisions = [];
        const player = this.ai.player;
        
        // Get player's castles
        const castles = this.getPlayerCastles(player, gameState);
        
        castles.forEach(castle => {
            const buildingDecisions = this.evaluateBuildingNeeds(castle, gameState);
            decisions.push(...buildingDecisions);
            
            const resourceDecisions = this.evaluateResourceNeeds(castle, player, gameState);
            decisions.push(...resourceDecisions);
        });

        return decisions;
    }

    getPlayerCastles(player, gameState) {
        // This would typically come from gameState or entity manager
        // For now, return empty array until castle system is integrated
        return [];
    }

    evaluateBuildingNeeds(castle, gameState) {
        const decisions = [];
        const player = this.ai.player;
        
        // Check if castle can build (has available slots)
        if (!this.canBuild(castle)) {
            return decisions;
        }

        // Evaluate each building type
        Object.entries(this.buildingPriorities).forEach(([buildingType, basePriority]) => {
            const buildingDecision = this.evaluateBuildingType(castle, buildingType, basePriority, gameState);
            if (buildingDecision) {
                decisions.push(buildingDecision);
            }
        });

        return decisions;
    }

    evaluateBuildingType(castle, buildingType, basePriority, gameState) {
        const player = this.ai.player;
        
        // Check if we already have this building
        if (this.hasBuildingType(castle, buildingType)) {
            // Some buildings can have multiples, others cannot
            if (!this.canHaveMultiple(buildingType)) {
                return null;
            }
        }

        // Check if we can afford this building
        const buildingCost = this.getBuildingCost(buildingType);
        if (!this.canAffordBuilding(player, buildingCost)) {
            return null;
        }

        // Calculate priority based on current game state
        const priority = this.calculateBuildingPriority(buildingType, basePriority, castle, gameState);
        
        if (priority <= 0) {
            return null;
        }

        return new AIDecision(
            'build',
            priority,
            `build_${buildingType}`,
            castle,
            buildingCost,
            this.calculateBuildingBenefit(buildingType, castle, gameState)
        );
    }

    calculateBuildingPriority(buildingType, basePriority, castle, gameState) {
        let priority = basePriority;
        const player = this.ai.player;
        
        // Adjust priority based on current resources
        const resources = player.resourceManager.resources;
        
        switch (buildingType) {
            case 'goldMine':
                // Higher priority if low on gold
                if (resources.gold < this.resourceThresholds.gold) {
                    priority += 20;
                }
                break;
                
            case 'lumber_mill':
                // Higher priority if low on wood
                if (resources.wood < this.resourceThresholds.wood) {
                    priority += 15;
                }
                break;
                
            case 'quarry':
                // Higher priority if low on stone
                if (resources.stone < this.resourceThresholds.stone) {
                    priority += 15;
                }
                break;
                
            case 'mage_tower':
                // Higher priority if low on mana
                if (resources.mana < this.resourceThresholds.mana) {
                    priority += 10;
                }
                break;
                
            case 'barracks':
            case 'archery_range':
            case 'stable':
                // Higher priority if under military threat
                if (this.isUnderThreat(castle, gameState)) {
                    priority += 25;
                }
                break;
                
            case 'wall':
                // Higher priority if castle is vulnerable
                if (this.isCastleVulnerable(castle, gameState)) {
                    priority += 30;
                }
                break;
        }

        // Apply difficulty modifier
        priority = this.applyDifficultyModifier(priority);
        
        return Math.max(0, priority);
    }

    evaluateResourceNeeds(castle, player, gameState) {
        const decisions = [];
        const resources = player.resourceManager.resources;
        
        // Check if we need to prioritize resource generation
        Object.entries(this.resourceThresholds).forEach(([resourceType, threshold]) => {
            if (resources[resourceType] < threshold) {
                const resourceDecision = this.createResourceDecision(resourceType, castle, gameState);
                if (resourceDecision) {
                    decisions.push(resourceDecision);
                }
            }
        });

        return decisions;
    }

    createResourceDecision(resourceType, castle, gameState) {
        // Create decisions to improve resource generation
        // This could involve building resource-generating buildings or upgrading existing ones
        
        const buildingMap = {
            'gold': 'goldMine',
            'wood': 'lumber_mill',
            'stone': 'quarry',
            'mana': 'mage_tower'
        };

        const buildingType = buildingMap[resourceType];
        if (!buildingType) {
            return null;
        }

        return new AIDecision(
            'build',
            75, // High priority for resource shortages
            `build_${buildingType}`,
            castle,
            this.getBuildingCost(buildingType),
            50 // Resource generation has high benefit
        );
    }

    canBuild(castle) {
        // Check if castle has available building slots
        // This would depend on castle implementation
        return true; // Placeholder
    }

    hasBuildingType(castle, buildingType) {
        // Check if castle already has this building type
        // This would depend on castle/building implementation
        return false; // Placeholder
    }

    canHaveMultiple(buildingType) {
        // Some buildings can be built multiple times
        const multipleAllowed = ['goldMine', 'lumber_mill', 'quarry', 'wall'];
        return multipleAllowed.includes(buildingType);
    }

    getBuildingCost(buildingType) {
        // Get building cost from configuration
        const buildingConfig = CONFIG.get(`buildings.${buildingType}`);
        return buildingConfig?.cost || { gold: 100, wood: 50, stone: 25 };
    }

    canAffordBuilding(player, cost) {
        const resources = player.resourceManager.resources;
        
        return Object.entries(cost).every(([resourceType, amount]) => {
            return resources[resourceType] >= amount;
        });
    }

    calculateBuildingBenefit(buildingType, castle, gameState) {
        // Calculate expected benefit from building
        const benefitMap = {
            'goldMine': 60,
            'lumber_mill': 55,
            'quarry': 50,
            'mage_tower': 45,
            'barracks': 70,
            'archery_range': 65,
            'stable': 60,
            'wall': 40,
            'townHall': 80
        };
        
        return benefitMap[buildingType] || 30;
    }

    isUnderThreat(castle, gameState) {
        // Check if castle is under military threat
        // This would analyze nearby enemy armies
        return false; // Placeholder
    }

    isCastleVulnerable(castle, gameState) {
        // Check if castle needs defensive improvements
        // This would analyze castle defenses vs nearby threats
        return false; // Placeholder
    }

    applyDifficultyModifier(priority) {
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
        
        if (difficultyConfig.resourceThresholds) {
            this.resourceThresholds = { ...this.resourceThresholds, ...difficultyConfig.resourceThresholds };
        }
        
        if (difficultyConfig.buildingPriorities) {
            this.buildingPriorities = { ...this.buildingPriorities, ...difficultyConfig.buildingPriorities };
        }
    }
}