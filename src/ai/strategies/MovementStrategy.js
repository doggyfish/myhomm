import { AIStrategy } from '../AIStrategy.js';
import { AIDecision } from '../AIDecision.js';
import { ConfigurationManager } from '../../config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

export class MovementStrategy extends AIStrategy {
    constructor(aiController) {
        super(aiController);
        this.pathfinding = null; // Will be set by AIController
        this.scoutingRange = CONFIG.get('ai.scoutingRange') || 15;
        this.retreatThreshold = CONFIG.get('ai.retreatThreshold') || 0.3;
        this.reinforcementThreshold = CONFIG.get('ai.reinforcementThreshold') || 0.7;
        this.explorationPriority = CONFIG.get('ai.explorationPriority') || 40;
    }

    evaluate(gameState) {
        const decisions = [];
        const player = this.ai.player;
        
        // Evaluate army movement needs
        const armies = this.getPlayerArmies(player, gameState);
        armies.forEach(army => {
            const movementDecisions = this.evaluateArmyMovement(army, gameState);
            decisions.push(...movementDecisions);
        });

        // Evaluate scouting needs
        const scoutingDecisions = this.evaluateScoutingNeeds(player, gameState);
        decisions.push(...scoutingDecisions);

        // Evaluate reinforcement movements
        const reinforcementDecisions = this.evaluateReinforcementNeeds(player, gameState);
        decisions.push(...reinforcementDecisions);

        return decisions;
    }

    evaluateArmyMovement(army, gameState) {
        const decisions = [];
        
        // Skip if army is already moving
        if (this.isArmyMoving(army)) {
            return decisions;
        }

        // Evaluate different movement objectives
        const objectives = [
            () => this.evaluateAttackMovement(army, gameState),
            () => this.evaluateDefensiveMovement(army, gameState),
            () => this.evaluateScoutingMovement(army, gameState),
            () => this.evaluateRetreatMovement(army, gameState),
            () => this.evaluatePatrolMovement(army, gameState)
        ];

        objectives.forEach(evaluateObjective => {
            const objective = evaluateObjective();
            if (objective) {
                decisions.push(objective);
            }
        });

        return decisions;
    }

    evaluateAttackMovement(army, gameState) {
        // Find potential attack targets
        const targets = this.findAttackTargets(army, gameState);
        
        if (targets.length === 0) {
            return null;
        }

        // Select best target based on strategic value and distance
        const bestTarget = this.selectBestAttackTarget(army, targets, gameState);
        
        if (!bestTarget) {
            return null;
        }

        // Calculate path to target
        const path = this.calculatePath(army, bestTarget.position, gameState);
        
        if (!path || path.length === 0) {
            return null;
        }

        const priority = this.calculateAttackMovementPriority(army, bestTarget, gameState);

        return new AIDecision(
            'move',
            priority,
            'attack_move',
            bestTarget.position,
            0, // No resource cost for movement
            bestTarget.strategicValue || 60
        );
    }

    evaluateDefensiveMovement(army, gameState) {
        // Check if any friendly castles need defense
        const threatenedCastles = this.findThreatenedCastles(gameState);
        
        if (threatenedCastles.length === 0) {
            return null;
        }

        // Find closest threatened castle
        const nearestCastle = this.findNearestTarget(army, threatenedCastles);
        
        if (!nearestCastle) {
            return null;
        }

        // Calculate defensive position near castle
        const defensivePosition = this.calculateDefensivePosition(army, nearestCastle, gameState);
        
        const path = this.calculatePath(army, defensivePosition, gameState);
        
        if (!path || path.length === 0) {
            return null;
        }

        const priority = this.calculateDefensiveMovementPriority(army, nearestCastle, gameState);

        return new AIDecision(
            'move',
            priority,
            'defensive_move',
            defensivePosition,
            0,
            70 // High benefit for defense
        );
    }

    evaluateScoutingMovement(army, gameState) {
        // Only use small, fast armies for scouting
        if (!this.isSuitableForScouting(army)) {
            return null;
        }

        // Find unexplored areas
        const unexploredAreas = this.findUnexploredAreas(army, gameState);
        
        if (unexploredAreas.length === 0) {
            return null;
        }

        // Select nearest unexplored area
        const scoutTarget = this.findNearestTarget(army, unexploredAreas);
        
        const path = this.calculatePath(army, scoutTarget, gameState);
        
        if (!path || path.length === 0) {
            return null;
        }

        return new AIDecision(
            'move',
            this.explorationPriority,
            'scout_move',
            scoutTarget,
            0,
            30 // Medium benefit for exploration
        );
    }

    evaluateRetreatMovement(army, gameState) {
        // Check if army is in danger and should retreat
        const threatLevel = this.assessArmyThreatLevel(army, gameState);
        
        if (threatLevel < this.retreatThreshold) {
            return null;
        }

        // Find safe retreat position
        const retreatPosition = this.findSafeRetreatPosition(army, gameState);
        
        if (!retreatPosition) {
            return null;
        }

        const path = this.calculatePath(army, retreatPosition, gameState);
        
        if (!path || path.length === 0) {
            return null;
        }

        // High priority for retreat when in danger
        const priority = Math.round(90 + (threatLevel * 10));

        return new AIDecision(
            'move',
            priority,
            'retreat_move',
            retreatPosition,
            0,
            80 // High benefit for survival
        );
    }

    evaluatePatrolMovement(army, gameState) {
        // Default patrol movement for idle armies
        const patrolArea = this.getPatrolArea(army, gameState);
        
        if (!patrolArea) {
            return null;
        }

        const patrolTarget = this.selectPatrolTarget(army, patrolArea, gameState);
        
        const path = this.calculatePath(army, patrolTarget, gameState);
        
        if (!path || path.length === 0) {
            return null;
        }

        return new AIDecision(
            'move',
            20, // Low priority for patrol
            'patrol_move',
            patrolTarget,
            0,
            10 // Low benefit for patrol
        );
    }

    evaluateScoutingNeeds(player, gameState) {
        const decisions = [];
        
        // Check if we have enough scouting coverage
        const scoutingCoverage = this.calculateScoutingCoverage(player, gameState);
        
        if (scoutingCoverage < 0.6) {
            // Need more scouting
            const scoutingDecision = this.createScoutingDecision(player, gameState);
            if (scoutingDecision) {
                decisions.push(scoutingDecision);
            }
        }

        return decisions;
    }

    evaluateReinforcementNeeds(player, gameState) {
        const decisions = [];
        
        // Find armies that need reinforcement
        const weakArmies = this.findWeakArmies(player, gameState);
        
        weakArmies.forEach(weakArmy => {
            const reinforcement = this.findNearestReinforcement(weakArmy, player, gameState);
            if (reinforcement) {
                const reinforcementDecision = this.createReinforcementDecision(reinforcement, weakArmy, gameState);
                if (reinforcementDecision) {
                    decisions.push(reinforcementDecision);
                }
            }
        });

        return decisions;
    }

    // Helper methods
    getPlayerArmies(player, gameState) {
        // Get player's armies from game state
        return []; // Placeholder
    }

    isArmyMoving(army) {
        // Check if army is currently moving
        return army.components?.get('movement')?.isMoving || false;
    }

    findAttackTargets(army, gameState) {
        // Find enemy armies and castles within range
        return []; // Placeholder
    }

    selectBestAttackTarget(army, targets, gameState) {
        // Select target based on strategic value and tactical considerations
        if (targets.length === 0) return null;
        
        return targets.reduce((best, target) => {
            const score = this.calculateTargetScore(army, target, gameState);
            return (!best || score > best.score) ? { ...target, score } : best;
        }, null);
    }

    calculateTargetScore(army, target, gameState) {
        // Calculate score based on strategic value, distance, and combat odds
        const distance = this.calculateDistance(army.position, target.position);
        const combatOdds = this.calculateCombatOdds(army, target);
        const strategicValue = target.strategicValue || 50;
        
        // Higher score for closer, easier, more valuable targets
        return (strategicValue * combatOdds) / Math.max(1, distance / 10);
    }

    findThreatenedCastles(gameState) {
        // Find friendly castles under threat
        return []; // Placeholder
    }

    findNearestTarget(army, targets) {
        // Find nearest target from array
        if (targets.length === 0) return null;
        
        return targets.reduce((nearest, target) => {
            const distance = this.calculateDistance(army.position, target.position || target);
            return (!nearest || distance < nearest.distance) ? { ...target, distance } : nearest;
        }, null);
    }

    calculateDefensivePosition(army, castle, gameState) {
        // Calculate optimal defensive position near castle
        const castlePos = castle.position;
        return {
            x: castlePos.x + 2,
            y: castlePos.y + 2
        }; // Placeholder
    }

    calculatePath(army, destination, gameState) {
        // Use pathfinding system to calculate path
        if (!this.pathfinding) {
            return [destination]; // Simple direct path if no pathfinding
        }
        
        return this.pathfinding.findPath(army.position, destination, gameState);
    }

    isSuitableForScouting(army) {
        // Check if army is suitable for scouting (small, fast)
        const armySize = this.getArmySize(army);
        const armySpeed = this.getArmySpeed(army);
        
        return armySize <= 3 && armySpeed >= 8;
    }

    findUnexploredAreas(army, gameState) {
        // Find areas that haven't been scouted recently
        return []; // Placeholder
    }

    assessArmyThreatLevel(army, gameState) {
        // Assess threat level to army (0.0 = safe, 1.0 = extreme danger)
        return 0.2; // Placeholder
    }

    findSafeRetreatPosition(army, gameState) {
        // Find safe position to retreat to
        const nearestCastle = this.findNearestFriendlyCastle(army, gameState);
        return nearestCastle?.position;
    }

    findNearestFriendlyCastle(army, gameState) {
        // Find nearest friendly castle
        return null; // Placeholder
    }

    getPatrolArea(army, gameState) {
        // Get patrol area for army
        return {
            center: army.position,
            radius: 5
        }; // Placeholder
    }

    selectPatrolTarget(army, patrolArea, gameState) {
        // Select random position within patrol area
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * patrolArea.radius;
        
        return {
            x: patrolArea.center.x + Math.cos(angle) * distance,
            y: patrolArea.center.y + Math.sin(angle) * distance
        };
    }

    calculateScoutingCoverage(player, gameState) {
        // Calculate percentage of map scouted
        return 0.5; // Placeholder (50% coverage)
    }

    createScoutingDecision(player, gameState) {
        // Create decision to send army for scouting
        return null; // Placeholder
    }

    findWeakArmies(player, gameState) {
        // Find armies that are below strength threshold
        return []; // Placeholder
    }

    findNearestReinforcement(weakArmy, player, gameState) {
        // Find nearest army that can provide reinforcement
        return null; // Placeholder
    }

    createReinforcementDecision(reinforcement, target, gameState) {
        // Create decision to move reinforcement to target
        return null; // Placeholder
    }

    calculateDistance(pos1, pos2) {
        // Calculate distance between two positions
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calculateCombatOdds(attacker, defender) {
        // Calculate probability of attacker winning
        return 0.6; // Placeholder
    }

    getArmySize(army) {
        // Get total unit count in army
        let total = 0;
        if (army.units) {
            army.units.forEach(count => total += count);
        }
        return total;
    }

    getArmySpeed(army) {
        // Get army movement speed
        return army.components?.get('movement')?.baseSpeed || 5;
    }

    calculateAttackMovementPriority(army, target, gameState) {
        // Calculate priority for attack movement
        const combatOdds = this.calculateCombatOdds(army, target);
        const strategicValue = target.strategicValue || 50;
        
        return Math.round(combatOdds * strategicValue);
    }

    calculateDefensiveMovementPriority(army, castle, gameState) {
        // Calculate priority for defensive movement
        const threatLevel = this.assessCastleThreatLevel(castle, gameState);
        return Math.round(70 + (threatLevel * 30));
    }

    assessCastleThreatLevel(castle, gameState) {
        // Assess threat level to castle
        return 0.4; // Placeholder
    }

    setPathfinding(pathfinding) {
        this.pathfinding = pathfinding;
    }

    setDifficulty(difficulty) {
        // Update strategy parameters based on difficulty
        const difficultyConfig = CONFIG.get(`ai.difficulty.${difficulty}`) || {};
        
        if (difficultyConfig.scoutingRange) {
            this.scoutingRange = difficultyConfig.scoutingRange;
        }
        
        if (difficultyConfig.retreatThreshold) {
            this.retreatThreshold = difficultyConfig.retreatThreshold;
        }
    }
}