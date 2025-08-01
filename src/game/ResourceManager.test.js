import { ResourceManager } from './ResourceManager.js';
import { CONFIG } from '../config/ConfigurationManager.js';

// Mock the CONFIG
jest.mock('../config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn()
    }
}));

// Mock Player class
class MockPlayer {
    constructor(id) {
        this.id = id;
    }
}

describe('ResourceManager', () => {
    let player;
    let resourceManager;
    
    beforeEach(() => {
        CONFIG.get.mockImplementation((path) => {
            const configValues = {
                'resources.startingResources': {
                    gold: 100,
                    mana: 50,
                    wood: 0,
                    stone: 0,
                    mercury: 0,
                    sulfur: 0,
                    crystal: 0
                },
                'resources.baseGeneration': {
                    gold: 60,
                    mana: 60
                }
            };
            return configValues[path];
        });
        
        player = new MockPlayer('player1');
        resourceManager = new ResourceManager(player);
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('constructor', () => {
        test('should initialize with starting resources from config', () => {
            expect(resourceManager.resources.gold).toBe(100);
            expect(resourceManager.resources.mana).toBe(50);
            expect(resourceManager.resources.wood).toBe(0);
            expect(resourceManager.player).toBe(player);
        });
        
        test('should initialize with base generation rates', () => {
            expect(resourceManager.generation.gold).toBe(60);
            expect(resourceManager.generation.mana).toBe(60);
        });
    });
    
    describe('resource updates', () => {
        test('should generate resources over time', () => {
            // 30 seconds = 30000ms, should generate half of per-minute rate
            resourceManager.update(30000);
            
            expect(resourceManager.resources.gold).toBe(130); // 100 + (60 * 30000 / 60000)
            expect(resourceManager.resources.mana).toBe(80);  // 50 + (60 * 30000 / 60000)
        });
        
        test('should handle fractional generation correctly', () => {
            // 1 second = 1000ms
            resourceManager.update(1000);
            
            expect(resourceManager.resources.gold).toBe(101); // 100 + (60 * 1000 / 60000) = 100 + 1
            expect(resourceManager.resources.mana).toBe(51);  // 50 + 1
        });
        
        test('should not go negative after updates', () => {
            resourceManager.resources.gold = -10; // Force negative
            resourceManager.update(1000);
            
            expect(resourceManager.resources.gold).toBeGreaterThanOrEqual(0);
        });
    });
    
    describe('canAfford method', () => {
        test('should return true when player can afford cost', () => {
            const cost = { gold: 50, mana: 25 };
            expect(resourceManager.canAfford(cost)).toBe(true);
        });
        
        test('should return false when player cannot afford cost', () => {
            const cost = { gold: 200, mana: 25 };
            expect(resourceManager.canAfford(cost)).toBe(false);
        });
        
        test('should return false for unknown resource types', () => {
            const cost = { unknown: 10 };
            expect(resourceManager.canAfford(cost)).toBe(false);
        });
        
        test('should return false for null or invalid cost', () => {
            expect(resourceManager.canAfford(null)).toBe(false);
            expect(resourceManager.canAfford('invalid')).toBe(false);
            expect(resourceManager.canAfford(undefined)).toBe(false);
        });
        
        test('should handle multiple resources in cost', () => {
            resourceManager.resources.wood = 20;
            resourceManager.resources.stone = 10;
            
            const affordableCost = { gold: 50, wood: 15, stone: 5 };
            const unaffordableCost = { gold: 50, wood: 25, stone: 5 };
            
            expect(resourceManager.canAfford(affordableCost)).toBe(true);
            expect(resourceManager.canAfford(unaffordableCost)).toBe(false);
        });
    });
    
    describe('spend method', () => {
        test('should spend resources when affordable', () => {
            const cost = { gold: 30, mana: 20 };
            const result = resourceManager.spend(cost);
            
            expect(result).toBe(true);
            expect(resourceManager.resources.gold).toBe(70); // 100 - 30
            expect(resourceManager.resources.mana).toBe(30); // 50 - 20
        });
        
        test('should not spend resources when unaffordable', () => {
            const cost = { gold: 200, mana: 20 };
            const result = resourceManager.spend(cost);
            
            expect(result).toBe(false);
            expect(resourceManager.resources.gold).toBe(100); // Unchanged
            expect(resourceManager.resources.mana).toBe(50);  // Unchanged
        });
        
        test('should clamp resources to non-negative values after spending', () => {
            resourceManager.resources.gold = 10;
            const cost = { gold: 15 }; // More than available, but let's test clamping
            
            // This should fail canAfford check
            const result = resourceManager.spend(cost);
            expect(result).toBe(false);
            
            // But if we force spend somehow, clamping should work
            resourceManager.resources.gold -= 15;
            resourceManager.clampResources();
            expect(resourceManager.resources.gold).toBe(0);
        });
    });
    
    describe('add method', () => {
        test('should add resources', () => {
            const gain = { gold: 50, wood: 25 };
            resourceManager.add(gain);
            
            expect(resourceManager.resources.gold).toBe(150); // 100 + 50
            expect(resourceManager.resources.wood).toBe(25);  // 0 + 25
        });
        
        test('should ignore negative amounts', () => {
            const initialGold = resourceManager.resources.gold;
            resourceManager.add({ gold: -10 });
            
            expect(resourceManager.resources.gold).toBe(initialGold); // Unchanged
        });
        
        test('should ignore unknown resources', () => {
            resourceManager.add({ unknown: 100 });
            expect(resourceManager.resources.unknown).toBeUndefined();
        });
        
        test('should handle null or invalid input', () => {
            const initialGold = resourceManager.resources.gold;
            
            resourceManager.add(null);
            resourceManager.add('invalid');
            resourceManager.add(undefined);
            
            expect(resourceManager.resources.gold).toBe(initialGold);
        });
    });
    
    describe('generation management', () => {
        test('should set generation rate', () => {
            resourceManager.setGeneration('gold', 120);
            expect(resourceManager.generation.gold).toBe(120);
        });
        
        test('should not allow negative generation', () => {
            resourceManager.setGeneration('gold', -50);
            expect(resourceManager.generation.gold).toBe(0);
        });
        
        test('should add to generation rate', () => {
            resourceManager.addGeneration('gold', 30);
            expect(resourceManager.generation.gold).toBe(90); // 60 + 30
        });
        
        test('should handle negative addition correctly', () => {
            resourceManager.addGeneration('gold', -80);
            expect(resourceManager.generation.gold).toBe(0); // 60 - 80, clamped to 0
        });
    });
    
    describe('utility methods', () => {
        test('should get resource amount', () => {
            expect(resourceManager.getResource('gold')).toBe(100);
            expect(resourceManager.getResource('unknown')).toBe(0);
        });
        
        test('should set resource amount', () => {
            resourceManager.setResource('gold', 500);
            expect(resourceManager.resources.gold).toBe(500);
            
            // Should not go negative
            resourceManager.setResource('gold', -100);
            expect(resourceManager.resources.gold).toBe(0);
        });
        
        test('should check if has sufficient resource', () => {
            expect(resourceManager.hasResource('gold', 50)).toBe(true);
            expect(resourceManager.hasResource('gold', 150)).toBe(false);
        });
        
        test('should get generation rate', () => {
            expect(resourceManager.getGenerationRate('gold')).toBe(60);
            expect(resourceManager.getGenerationRate('unknown')).toBe(0);
        });
        
        test('should calculate total resource value', () => {
            resourceManager.resources.wood = 10;
            resourceManager.resources.stone = 5;
            
            const total = resourceManager.getTotalResourceValue();
            expect(total).toBe(165); // 100 + 50 + 10 + 5 + 0 + 0 + 0
        });
        
        test('should reset resources and generation', () => {
            resourceManager.resources.gold = 500;
            resourceManager.generation.gold = 120;
            
            resourceManager.reset();
            
            expect(resourceManager.resources.gold).toBe(100); // Back to starting value
            expect(resourceManager.generation.gold).toBe(60);  // Back to base rate
        });
    });
    
    describe('clamping', () => {
        test('should clamp all resources to non-negative', () => {
            resourceManager.resources.gold = -50;
            resourceManager.resources.mana = -10;
            resourceManager.resources.wood = 20; // Should remain unchanged
            
            resourceManager.clampResources();
            
            expect(resourceManager.resources.gold).toBe(0);
            expect(resourceManager.resources.mana).toBe(0);
            expect(resourceManager.resources.wood).toBe(20);
        });
    });
});