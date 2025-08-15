import { EconomicStrategy } from '../../../src/ai/strategies/EconomicStrategy.js';
import { AIController } from '../../../src/ai/AIController.js';
import { Player } from '../../../src/game/Player.js';
import { AIDecision } from '../../../src/ai/AIDecision.js';
import { ConfigurationManager } from '../../../src/config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

describe('EconomicStrategy', () => {
    let player;
    let aiController;
    let economicStrategy;
    let mockGameState;
    let mockCastle;

    beforeEach(() => {
        player = new Player('ai_player_1', 'AI Test Player', 'human', true);
        aiController = new AIController(player, 'medium');
        economicStrategy = new EconomicStrategy(aiController);
        
        // Mock castle
        mockCastle = {
            id: 'castle_1',
            type: 'castle',
            owner: player,
            buildings: new Map(),
            canBuild: jest.fn(() => true),
            hasBuilding: jest.fn(() => false),
            getAvailableSlots: jest.fn(() => 5)
        };
        
        mockGameState = {
            isPaused: false,
            players: [player],
            entities: new Map([['castle_1', mockCastle]]),
            currentTick: 0
        };

        // Setup mock resource manager
        player.resourceManager.resources = {
            gold: 1000,
            wood: 500,
            stone: 300,
            mana: 200,
            mercury: 50,
            sulfur: 50,
            crystal: 50
        };

        // Reset configuration
        CONFIG.reset();
    });

    describe('Initialization', () => {
        test('should initialize with correct AI controller', () => {
            expect(economicStrategy.ai).toBe(aiController);
            expect(economicStrategy.enabled).toBe(true);
        });

        test('should load building priorities from configuration', () => {
            const expectedPriorities = CONFIG.get('ai.buildingPriorities');
            expect(economicStrategy.buildingPriorities).toEqual(expectedPriorities);
        });

        test('should load resource thresholds from configuration', () => {
            const expectedThresholds = CONFIG.get('ai.resourceThresholds');
            expect(economicStrategy.resourceThresholds).toEqual(expectedThresholds);
        });
    });

    describe('Building Evaluation', () => {
        test('should evaluate building needs for castles', () => {
            jest.spyOn(economicStrategy, 'getPlayerCastles').mockReturnValue([mockCastle]);
            jest.spyOn(economicStrategy, 'evaluateBuildingNeeds').mockReturnValue([
                new AIDecision('build', 80, 'build_goldMine', mockCastle, { gold: 100 }, 60)
            ]);
            
            const decisions = economicStrategy.evaluate(mockGameState);
            
            expect(decisions).toHaveLength(1);
            expect(decisions[0].type).toBe('build');
            expect(decisions[0].action).toBe('build_goldMine');
        });

        test('should not create building decisions if castle cannot build', () => {
            jest.spyOn(economicStrategy, 'getPlayerCastles').mockReturnValue([mockCastle]);
            jest.spyOn(economicStrategy, 'canBuild').mockReturnValue(false);
            
            const decisions = economicStrategy.evaluateBuildingNeeds(mockCastle, mockGameState);
            
            expect(decisions).toHaveLength(0);
        });

        test('should not create building decisions if player cannot afford', () => {
            // Set low resources
            player.resourceManager.resources.gold = 50;
            
            jest.spyOn(economicStrategy, 'getPlayerCastles').mockReturnValue([mockCastle]);
            jest.spyOn(economicStrategy, 'getBuildingCost').mockReturnValue({ gold: 100, wood: 50 });
            
            const decisions = economicStrategy.evaluateBuildingNeeds(mockCastle, mockGameState);
            
            expect(decisions).toHaveLength(0);
        });

        test('should increase priority for resource buildings when resources are low', () => {
            // Set low gold
            player.resourceManager.resources.gold = 500; // Below threshold of 1000
            
            jest.spyOn(economicStrategy, 'getPlayerCastles').mockReturnValue([mockCastle]);
            jest.spyOn(economicStrategy, 'canBuild').mockReturnValue(true);
            jest.spyOn(economicStrategy, 'hasBuildingType').mockReturnValue(false);
            jest.spyOn(economicStrategy, 'canAffordBuilding').mockReturnValue(true);
            jest.spyOn(economicStrategy, 'getBuildingCost').mockReturnValue({ gold: 100 });
            
            const basePriority = economicStrategy.buildingPriorities['goldMine'];
            const priority = economicStrategy.calculateBuildingPriority(
                'goldMine', basePriority, mockCastle, mockGameState
            );
            
            expect(priority).toBeGreaterThan(basePriority);
        });
    });

    describe('Resource Management', () => {
        test('should create resource decisions when resources are below threshold', () => {
            // Set resources below threshold
            player.resourceManager.resources.gold = 500; // Below 1000 threshold
            player.resourceManager.resources.wood = 200; // Below 500 threshold
            
            jest.spyOn(economicStrategy, 'createResourceDecision').mockImplementation((resourceType) => {
                return new AIDecision('build', 75, `build_${resourceType}Mine`, mockCastle, { gold: 100 }, 50);
            });
            
            const decisions = economicStrategy.evaluateResourceNeeds(mockCastle, player, mockGameState);
            
            expect(decisions.length).toBeGreaterThan(0);
            expect(decisions.some(d => d.action.includes('gold'))).toBe(true);
            expect(decisions.some(d => d.action.includes('wood'))).toBe(true);
        });

        test('should not create resource decisions when resources are above threshold', () => {
            // Set all resources above threshold
            player.resourceManager.resources = {
                gold: 2000,
                wood: 1000,
                stone: 600,
                mana: 400
            };
            
            const decisions = economicStrategy.evaluateResourceNeeds(mockCastle, player, mockGameState);
            
            expect(decisions).toHaveLength(0);
        });
    });

    describe('Building Affordability', () => {
        test('should correctly check if player can afford building', () => {
            const cost = { gold: 100, wood: 50, stone: 25 };
            
            expect(economicStrategy.canAffordBuilding(player, cost)).toBe(true);
            
            // Test with insufficient resources
            const expensiveCost = { gold: 2000, wood: 1000 };
            expect(economicStrategy.canAffordBuilding(player, expensiveCost)).toBe(false);
        });

        test('should handle partial resource availability', () => {
            const cost = { gold: 100, wood: 1000 }; // Can afford gold but not wood
            
            expect(economicStrategy.canAffordBuilding(player, cost)).toBe(false);
        });
    });

    describe('Building Priority Calculation', () => {
        test('should apply difficulty modifiers to priority', () => {
            const basePriority = 100;
            
            // Test easy difficulty (0.8 modifier)
            economicStrategy.ai.difficulty = 'easy';
            const easyPriority = economicStrategy.applyDifficultyModifier(basePriority);
            expect(easyPriority).toBe(80);
            
            // Test hard difficulty (1.2 modifier)
            economicStrategy.ai.difficulty = 'hard';
            const hardPriority = economicStrategy.applyDifficultyModifier(basePriority);
            expect(hardPriority).toBe(120);
        });

        test('should increase priority for military buildings when under threat', () => {
            jest.spyOn(economicStrategy, 'isUnderThreat').mockReturnValue(true);
            
            const basePriority = 70;
            const priority = economicStrategy.calculateBuildingPriority(
                'barracks', basePriority, mockCastle, mockGameState
            );
            
            expect(priority).toBeGreaterThan(basePriority);
        });

        test('should increase wall priority when castle is vulnerable', () => {
            jest.spyOn(economicStrategy, 'isCastleVulnerable').mockReturnValue(true);
            
            const basePriority = 50;
            const priority = economicStrategy.calculateBuildingPriority(
                'wall', basePriority, mockCastle, mockGameState
            );
            
            expect(priority).toBeGreaterThan(basePriority);
        });
    });

    describe('Building Configuration', () => {
        test('should handle multiple building types correctly', () => {
            expect(economicStrategy.canHaveMultiple('goldMine')).toBe(true);
            expect(economicStrategy.canHaveMultiple('townHall')).toBe(false);
            expect(economicStrategy.canHaveMultiple('wall')).toBe(true);
        });

        test('should get building costs from configuration', () => {
            CONFIG.set('buildings.goldMine.cost', { gold: 150, wood: 75 });
            
            const cost = economicStrategy.getBuildingCost('goldMine');
            expect(cost).toEqual({ gold: 150, wood: 75 });
        });

        test('should use default cost when building not configured', () => {
            const cost = economicStrategy.getBuildingCost('unknownBuilding');
            expect(cost).toEqual({ gold: 100, wood: 50, stone: 25 });
        });
    });

    describe('Strategy State Management', () => {
        test('should pause and resume correctly', () => {
            expect(economicStrategy.enabled).toBe(true);
            
            economicStrategy.pause();
            expect(economicStrategy.enabled).toBe(false);
            
            economicStrategy.resume();
            expect(economicStrategy.enabled).toBe(true);
        });

        test('should not evaluate when disabled', () => {
            economicStrategy.enabled = false;
            
            const evaluateSpy = jest.spyOn(economicStrategy, 'evaluateBuildingNeeds');
            
            economicStrategy.evaluate(mockGameState);
            
            // Should return empty array when disabled
            expect(evaluateSpy).not.toHaveBeenCalled();
        });
    });

    describe('Difficulty Adaptation', () => {
        test('should update thresholds based on difficulty', () => {
            const hardConfig = {
                resourceThresholds: { gold: 1500, wood: 750 }
            };
            CONFIG.set('ai.difficulty.hard', hardConfig);
            
            economicStrategy.setDifficulty('hard');
            
            expect(economicStrategy.resourceThresholds.gold).toBe(1500);
            expect(economicStrategy.resourceThresholds.wood).toBe(750);
        });

        test('should update building priorities based on difficulty', () => {
            const expertConfig = {
                buildingPriorities: { 'goldMine': 130 }
            };
            CONFIG.set('ai.difficulty.expert', expertConfig);
            
            economicStrategy.setDifficulty('expert');
            
            expect(economicStrategy.buildingPriorities['goldMine']).toBe(130);
        });
    });

    describe('Decision Quality', () => {
        test('should create valid decisions', () => {
            jest.spyOn(economicStrategy, 'getPlayerCastles').mockReturnValue([mockCastle]);
            
            const decisions = economicStrategy.evaluate(mockGameState);
            
            decisions.forEach(decision => {
                expect(decision).toBeInstanceOf(AIDecision);
                expect(decision.isValid()).toBe(true);
                expect(decision.type).toBe('build');
                expect(decision.priority).toBeGreaterThan(0);
            });
        });

        test('should provide expected benefits for buildings', () => {
            const goldMineBenefit = economicStrategy.calculateBuildingBenefit('goldMine', mockCastle, mockGameState);
            const wallBenefit = economicStrategy.calculateBuildingBenefit('wall', mockCastle, mockGameState);
            
            expect(goldMineBenefit).toBeGreaterThan(0);
            expect(wallBenefit).toBeGreaterThan(0);
            expect(goldMineBenefit).toBeGreaterThan(wallBenefit); // Economic buildings should have higher benefit
        });
    });
});