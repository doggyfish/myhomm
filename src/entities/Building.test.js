import { Building } from './Building.js';

// Mock ResourceManager
const mockResourceManager = {
    resources: {
        gold: 5000,
        wood: 1000,
        stone: 500,
        crystal: 100
    },
    canAfford: jest.fn((resource, amount) => mockResourceManager.resources[resource] >= amount),
    spend: jest.fn((resource, amount) => {
        mockResourceManager.resources[resource] -= amount;
    })
};

// Mock Castle
const mockCastle = {
    owner: {
        faction: 'human',
        resourceManager: mockResourceManager
    },
    garrisonArmy: {
        addUnit: jest.fn()
    },
    getComponent: jest.fn((name) => {
        if (name === 'defense') {
            return {
                setWalls: jest.fn()
            };
        }
        return null;
    })
};

describe('Building', () => {
    let building;
    
    beforeEach(() => {
        building = new Building('barracks');
        building.castle = mockCastle;
        jest.clearAllMocks();
        
        // Reset mock resource manager
        mockResourceManager.resources = {
            gold: 5000,
            wood: 1000,
            stone: 500,
            crystal: 100
        };
    });
    
    describe('constructor', () => {
        test('should create building with correct properties', () => {
            expect(building.type).toBe('barracks');
            expect(building.level).toBe(1);
            expect(building.isConstructed).toBe(false);
            expect(building.constructionProgress).toBe(0);
            expect(building.castle).toBe(mockCastle);
        });
        
        test('should throw error for unknown building type', () => {
            expect(() => new Building('unknown')).toThrow('Unknown building type: unknown');
        });
        
        test('should set custom level', () => {
            const building2 = new Building('barracks', 3);
            expect(building2.level).toBe(3);
        });
    });
    
    describe('static create', () => {
        test('should create building using static method', () => {
            const building2 = Building.create('stables', 2);
            expect(building2.type).toBe('stables');
            expect(building2.level).toBe(2);
        });
    });
    
    describe('getName', () => {
        test('should return proper building names', () => {
            expect(new Building('barracks').getName()).toBe('Barracks');
            expect(new Building('archeryRange').getName()).toBe('Archery Range');
            expect(new Building('magicTower').getName()).toBe('Magic Tower');
            expect(new Building('goldMine').getName()).toBe('Gold Mine');
        });
    });
    
    describe('cost calculation', () => {
        test('should calculate base cost correctly', () => {
            const cost = building.getCost();
            expect(cost).toEqual({ gold: 500, wood: 100 });
        });
        
        test('should scale cost by level', () => {
            building.level = 2;
            const cost = building.getCost();
            expect(cost.gold).toBe(750); // 500 * 1.5
            expect(cost.wood).toBe(150); // 100 * 1.5
        });
        
        test('should handle complex buildings', () => {
            const stables = new Building('stables');
            const cost = stables.getCost();
            expect(cost).toEqual({ gold: 1500, wood: 200, stone: 100 });
        });
    });
    
    describe('construction', () => {
        test('should check if can construct', () => {
            expect(building.canConstruct(mockResourceManager)).toBe(true);
            
            mockResourceManager.resources.gold = 100; // Not enough
            expect(building.canConstruct(mockResourceManager)).toBe(false);
        });
        
        test('should start construction successfully', () => {
            const result = building.startConstruction(mockResourceManager);
            
            expect(result).toBe(true);
            expect(mockResourceManager.spend).toHaveBeenCalledWith('gold', 500);
            expect(mockResourceManager.spend).toHaveBeenCalledWith('wood', 100);
            expect(building.constructionProgress).toBe(0);
        });
        
        test('should not start construction if already constructed', () => {
            building.isConstructed = true;
            const result = building.startConstruction(mockResourceManager);
            
            expect(result).toBe(false);
            expect(mockResourceManager.spend).not.toHaveBeenCalled();
        });
        
        test('should not start construction if insufficient resources', () => {
            mockResourceManager.resources.gold = 100;
            const result = building.startConstruction(mockResourceManager);
            
            expect(result).toBe(false);
            expect(mockResourceManager.spend).not.toHaveBeenCalled();
        });
        
        test('should update construction progress', () => {
            building.startConstruction(mockResourceManager);
            
            const deltaTime = 15000; // 15 seconds
            building.updateConstruction(deltaTime);
            
            expect(building.constructionProgress).toBe(15000);
            expect(building.isConstructed).toBe(false);
        });
        
        test('should complete construction when time reached', () => {
            building.startConstruction(mockResourceManager);
            
            const deltaTime = 30000; // 30 seconds (full construction time for level 1)
            building.updateConstruction(deltaTime);
            
            expect(building.isConstructed).toBe(true);
            expect(building.constructionProgress).toBe(30000);
        });
    });
    
    describe('production', () => {
        beforeEach(() => {
            building.completeConstruction();
        });
        
        test('should check if can produce', () => {
            expect(building.canProduce()).toBe(true);
            
            const goldMine = new Building('goldMine');
            goldMine.completeConstruction();
            expect(goldMine.canProduce()).toBe(false); // Resource building, not unit producer
        });
        
        test('should get producible units for faction', () => {
            const units = building.getProducibleUnits();
            expect(units).toEqual(['swordsman']); // Human faction, excludes 'warrior'
            
            // Test orc faction
            mockCastle.owner.faction = 'orc';
            building.castle = mockCastle;
            const orcUnits = building.getProducibleUnits();
            expect(orcUnits).toEqual(['warrior']); // Orc faction, excludes 'swordsman'
        });
        
        test('should start production successfully', () => {
            const result = building.startProduction('swordsman');
            
            expect(result).toBe(true);
            expect(building.productionQueue).toHaveLength(1);
            expect(building.currentProduction).toBeDefined();
            expect(building.currentProduction.type).toBe('swordsman');
        });
        
        test('should not start production for invalid unit', () => {
            const result = building.startProduction('invalidUnit');
            expect(result).toBe(false);
        });
        
        test('should queue multiple production orders', () => {
            building.startProduction('swordsman');
            building.startProduction('swordsman');
            
            expect(building.productionQueue).toHaveLength(1); // One in queue, one current
            expect(building.currentProduction).toBeDefined();
        });
        
        test('should update production progress', () => {
            building.startProduction('swordsman');
            
            const deltaTime = 30000; // 30 seconds
            const result = building.updateProduction(deltaTime);
            
            expect(building.productionProgress).toBe(30000);
            expect(result).toBeNull(); // Not completed yet
        });
        
        test('should complete production', () => {
            building.startProduction('swordsman');
            
            const deltaTime = 60000; // 60 seconds (full production time)
            const result = building.updateProduction(deltaTime);
            
            expect(result).toBeDefined();
            expect(result.type).toBe('swordsman');
            expect(building.currentProduction).toBeNull();
            expect(building.productionProgress).toBe(0);
        });
        
        test('should process production queue', () => {
            building.startProduction('swordsman');
            building.startProduction('swordsman');
            
            // Complete first production
            building.updateProduction(60000);
            
            expect(building.currentProduction).toBeDefined();
            expect(building.currentProduction.type).toBe('swordsman');
            expect(building.productionQueue).toHaveLength(0);
        });
        
        test('should get production status', () => {
            building.startProduction('swordsman');
            building.startProduction('swordsman');
            
            const status = building.getProductionStatus();
            
            expect(status.isProducing).toBe(true);
            expect(status.currentUnit).toBe('swordsman');
            expect(status.queueLength).toBe(1);
            expect(status.queue).toEqual(['swordsman']);
        });
        
        test('should cancel production', () => {
            building.startProduction('swordsman');
            building.startProduction('swordsman');
            
            building.cancelProduction();
            
            expect(building.currentProduction).toBeNull();
            expect(building.productionQueue).toHaveLength(0);
            expect(building.productionProgress).toBe(0);
        });
    });
    
    describe('upgrades', () => {
        beforeEach(() => {
            building.completeConstruction();
        });
        
        test('should check if can upgrade', () => {
            expect(building.canUpgrade()).toBe(true);
            
            building.level = 5; // Max level
            expect(building.canUpgrade()).toBe(false);
        });
        
        test('should calculate upgrade cost', () => {
            const cost = building.getUpgradeCost();
            expect(cost.gold).toBe(750); // Level 2 cost
            expect(cost.wood).toBe(150);
            
            building.level = 5;
            expect(building.getUpgradeCost()).toBeNull();
        });
        
        test('should upgrade successfully', () => {
            const result = building.startUpgrade(mockResourceManager);
            
            expect(result).toBe(true);
            expect(building.level).toBe(2);
            expect(mockResourceManager.spend).toHaveBeenCalledWith('gold', 750);
            expect(mockResourceManager.spend).toHaveBeenCalledWith('wood', 150);
        });
        
        test('should not upgrade if insufficient resources', () => {
            mockResourceManager.resources.gold = 100;
            const result = building.startUpgrade(mockResourceManager);
            
            expect(result).toBe(false);
            expect(building.level).toBe(1);
        });
        
        test('should not upgrade if at max level', () => {
            building.level = 5;
            const result = building.startUpgrade(mockResourceManager);
            
            expect(result).toBe(false);
        });
    });
    
    describe('effects', () => {
        test('should apply resource generation effects', () => {
            const goldMine = new Building('goldMine');
            goldMine.castle = mockCastle;
            goldMine.completeConstruction();
            
            expect(goldMine.resourceBonus).toEqual({ gold: 30 });
        });
        
        test('should apply defense effects', () => {
            const watchtower = new Building('watchtower');
            watchtower.castle = mockCastle;
            watchtower.completeConstruction();
            
            expect(watchtower.defensePower).toBe(120); // 1.2 * 100
        });
        
        test('should apply wall effects', () => {
            const walls = new Building('walls');
            walls.castle = mockCastle;
            walls.completeConstruction();
            
            expect(mockCastle.getComponent).toHaveBeenCalledWith('defense');
        });
        
        test('should scale effects by level', () => {
            const goldMine = new Building('goldMine', 3);
            goldMine.castle = mockCastle;
            goldMine.completeConstruction();
            
            expect(goldMine.resourceBonus.gold).toBe(90); // 30 * 3
        });
    });
    
    describe('update method', () => {
        test('should update construction and production', () => {
            building.startConstruction(mockResourceManager);
            building.updateConstruction = jest.fn();
            building.updateProduction = jest.fn().mockReturnValue(null);
            
            building.update(1000);
            
            expect(building.updateConstruction).toHaveBeenCalledWith(1000);
        });
        
        test('should add completed units to garrison', () => {
            building.completeConstruction();
            building.startProduction('swordsman');
            
            // Mock a completed unit
            building.updateProduction = jest.fn().mockReturnValue({ type: 'swordsman' });
            
            building.update(1000);
            
            expect(mockCastle.garrisonArmy.addUnit).toHaveBeenCalledWith('swordsman', 1);
        });
    });
    
    describe('information and serialization', () => {
        test('should get building information', () => {
            building.completeConstruction();
            const info = building.getInfo();
            
            expect(info).toHaveProperty('type', 'barracks');
            expect(info).toHaveProperty('name', 'Barracks');
            expect(info).toHaveProperty('level', 1);
            expect(info).toHaveProperty('isConstructed', true);
            expect(info).toHaveProperty('cost');
            expect(info).toHaveProperty('canProduce', true);
            expect(info).toHaveProperty('producibleUnits');
        });
        
        test('should serialize building data', () => {
            building.completeConstruction();
            building.startProduction('swordsman');
            
            const data = building.serialize();
            
            expect(data).toHaveProperty('type', 'barracks');
            expect(data).toHaveProperty('level', 1);
            expect(data).toHaveProperty('isConstructed', true);
            expect(data).toHaveProperty('productionQueue');
            expect(data).toHaveProperty('currentProduction');
        });
        
        test('should deserialize building data', () => {
            const data = {
                type: 'stables',
                level: 2,
                isConstructed: true,
                constructionProgress: 60000,
                productionQueue: [],
                currentProduction: null,
                productionProgress: 0,
                resourceBonus: { gold: 20 },
                defensePower: 50
            };
            
            const deserialized = Building.deserialize(data);
            
            expect(deserialized.type).toBe('stables');
            expect(deserialized.level).toBe(2);
            expect(deserialized.isConstructed).toBe(true);
            expect(deserialized.resourceBonus).toEqual({ gold: 20 });
            expect(deserialized.defensePower).toBe(50);
        });
    });
});