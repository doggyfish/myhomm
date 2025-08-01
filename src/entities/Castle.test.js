import { Castle } from './Castle.js';

// Mock Player class
const mockPlayer = {
    id: 'player1',
    getFactionConfig: () => ({
        resourceBonus: {
            gold: 1.25,
            mana: 1.1
        }
    })
};

// Mock Building class
class MockBuilding {
    constructor(type, name, resourceBonus = {}, defensePower = 0) {
        this.type = type;
        this.name = name;
        this.resourceBonus = resourceBonus;
        this.defensePower = defensePower;
        this.castle = null;
    }
    
    serialize() {
        return {
            type: this.type,
            name: this.name,
            resourceBonus: this.resourceBonus,
            defensePower: this.defensePower
        };
    }
}

describe('Castle', () => {
    let castle;
    
    beforeEach(() => {
        castle = new Castle('castle1', 10, 15, mockPlayer);
    });
    
    describe('constructor', () => {
        test('should create castle with correct properties', () => {
            expect(castle.id).toBe('castle1');
            expect(castle.type).toBe('castle');
            expect(castle.owner).toBe(mockPlayer);
            expect(castle.name).toBe('Castle castle1');
            expect(castle.isCapital).toBe(false);
            expect(castle.buildings).toEqual([]);
            expect(castle.buildingSlots).toBe(7);
            expect(castle.garrisonArmy).toBeNull();
        });
        
        test('should add core components', () => {
            expect(castle.hasComponent('position')).toBe(true);
            expect(castle.hasComponent('resourceGenerator')).toBe(true);
            expect(castle.hasComponent('defense')).toBe(true);
        });
        
        test('should set position correctly', () => {
            const position = castle.getPosition();
            expect(position.x).toBe(10);
            expect(position.y).toBe(15);
        });
        
        test('should apply faction bonuses', () => {
            const resourceGenerator = castle.getComponent('resourceGenerator');
            expect(resourceGenerator.getModifier('gold')).toBe(1.25);
            expect(resourceGenerator.getModifier('mana')).toBe(1.1);
        });
    });
    
    describe('createCapital', () => {
        test('should create capital castle with enhanced properties', () => {
            const capital = Castle.createCapital('capital1', 5, 8, mockPlayer);
            
            expect(capital.isCapital).toBe(true);
            expect(capital.name).toBe('Capital capital1');
            
            const defenseComponent = capital.getComponent('defense');
            expect(defenseComponent.getBasePower()).toBe(75); // Higher than regular castle
        });
    });
    
    describe('building management', () => {
        let building1, building2;
        
        beforeEach(() => {
            building1 = new MockBuilding('barracks', 'Barracks', { gold: 0.1 }, 10);
            building2 = new MockBuilding('tower', 'Tower', {}, 20);
        });
        
        test('should add building successfully', () => {
            const result = castle.addBuilding(building1);
            
            expect(result).toBe(true);
            expect(castle.getBuildingCount()).toBe(1);
            expect(castle.hasBuilding('barracks')).toBe(true);
            expect(building1.castle).toBe(castle);
        });
        
        test('should apply building effects when adding', () => {
            const initialGoldModifier = castle.getComponent('resourceGenerator').getModifier('gold');
            const initialDefense = castle.getComponent('defense').getBuildingDefenseBonus();
            
            castle.addBuilding(building1);
            
            // Resource bonus should be applied
            const newGoldModifier = castle.getComponent('resourceGenerator').getModifier('gold');
            expect(newGoldModifier).toBeGreaterThan(initialGoldModifier);
            
            // Defense bonus should be applied
            const newDefense = castle.getComponent('defense').getBuildingDefenseBonus();
            expect(newDefense).toBe(initialDefense + 10);
        });
        
        test('should not add building if slots are full', () => {
            // Fill all building slots
            for (let i = 0; i < castle.buildingSlots; i++) {
                castle.addBuilding(new MockBuilding(`building${i}`, `Building ${i}`));
            }
            
            const extraBuilding = new MockBuilding('extra', 'Extra Building');
            const result = castle.addBuilding(extraBuilding);
            
            expect(result).toBe(false);
            expect(castle.getBuildingCount()).toBe(castle.buildingSlots);
        });
        
        test('should not add duplicate building types', () => {
            castle.addBuilding(building1);
            const duplicateBuilding = new MockBuilding('barracks', 'Another Barracks');
            const result = castle.addBuilding(duplicateBuilding);
            
            expect(result).toBe(false);
            expect(castle.getBuildingCount()).toBe(1);
        });
        
        test('should remove building successfully', () => {
            castle.addBuilding(building1);
            castle.addBuilding(building2);
            
            const removed = castle.removeBuilding('barracks');
            
            expect(removed).toBe(building1);
            expect(castle.getBuildingCount()).toBe(1);
            expect(castle.hasBuilding('barracks')).toBe(false);
            expect(castle.hasBuilding('tower')).toBe(true);
            expect(removed.castle).toBeNull();
        });
        
        test('should remove building effects when removing', () => {
            castle.addBuilding(building1);
            const modifierAfterAdd = castle.getComponent('resourceGenerator').getModifier('gold');
            const defenseAfterAdd = castle.getComponent('defense').getBuildingDefenseBonus();
            
            castle.removeBuilding('barracks');
            
            const modifierAfterRemove = castle.getComponent('resourceGenerator').getModifier('gold');
            const defenseAfterRemove = castle.getComponent('defense').getBuildingDefenseBonus();
            
            expect(modifierAfterRemove).toBeLessThan(modifierAfterAdd);
            expect(defenseAfterRemove).toBeLessThan(defenseAfterAdd);
        });
        
        test('should get building by type', () => {
            castle.addBuilding(building1);
            
            const retrieved = castle.getBuilding('barracks');
            expect(retrieved).toBe(building1);
            
            const nonExistent = castle.getBuilding('nonexistent');
            expect(nonExistent).toBeNull();
        });
        
        test('should return available building slots', () => {
            expect(castle.getAvailableBuildingSlots()).toBe(7);
            
            castle.addBuilding(building1);
            expect(castle.getAvailableBuildingSlots()).toBe(6);
            
            castle.addBuilding(building2);
            expect(castle.getAvailableBuildingSlots()).toBe(5);
        });
    });
    
    describe('garrison army management', () => {
        let mockArmy;
        
        beforeEach(() => {
            mockArmy = {
                location: null,
                isGarrison: false,
                getTotalPower: () => 150,
                getUnitCount: () => 5
            };
        });
        
        test('should set garrison army', () => {
            castle.setGarrisonArmy(mockArmy);
            
            expect(castle.getGarrisonArmy()).toBe(mockArmy);
            expect(castle.hasGarrison()).toBe(true);
            expect(mockArmy.location).toBe(castle);
            expect(mockArmy.isGarrison).toBe(true);
        });
        
        test('should handle null garrison army', () => {
            castle.setGarrisonArmy(mockArmy);
            castle.setGarrisonArmy(null);
            
            expect(castle.getGarrisonArmy()).toBeNull();
            expect(castle.hasGarrison()).toBe(false);
        });
    });
    
    describe('resource generation', () => {
        test('should update resource generation', () => {
            const resourceGenerator = castle.getComponent('resourceGenerator');
            const initialGold = resourceGenerator.getAccumulatedResources().gold;
            
            castle.update(60000); // 1 minute
            
            const finalGold = resourceGenerator.getAccumulatedResources().gold;
            expect(finalGold).toBeGreaterThan(initialGold);
        });
        
        test('should collect resources', () => {
            castle.update(60000); // 1 minute
            
            const resources = castle.collectResources();
            
            expect(resources).toHaveProperty('gold');
            expect(resources).toHaveProperty('mana');
            expect(resources.gold).toBeGreaterThan(0);
            expect(resources.mana).toBeGreaterThan(0);
        });
        
        test('should get resource generation rates', () => {
            const rates = castle.getResourceGenerationRates();
            
            expect(rates).toHaveProperty('gold');
            expect(rates).toHaveProperty('mana');
            expect(rates.gold).toBe(60 * 1.25); // Base rate * faction bonus
            expect(rates.mana).toBe(60 * 1.1);  // Base rate * faction bonus
        });
    });
    
    describe('defense calculations', () => {
        let mockArmy;
        
        beforeEach(() => {
            mockArmy = {
                location: null,
                isGarrison: false,
                getTotalPower: () => 150,
                getUnitCount: () => 5
            };
        });
        
        test('should calculate total defense power without garrison', () => {
            const defenseComponent = castle.getComponent('defense');
            const basePower = defenseComponent.getEffectiveDefensePower();
            
            expect(castle.getTotalDefensePower()).toBe(basePower);
        });
        
        test('should calculate total defense power with garrison', () => {
            const defenseComponent = castle.getComponent('defense');
            const basePower = defenseComponent.getEffectiveDefensePower();
            
            castle.setGarrisonArmy(mockArmy);
            
            expect(castle.getTotalDefensePower()).toBe(basePower + 150);
        });
        
        test('should get detailed defense information', () => {
            castle.setGarrisonArmy(mockArmy);
            
            const details = castle.getDefenseDetails();
            
            expect(details).toHaveProperty('basePower');
            expect(details).toHaveProperty('garrisonPower', 150);
            expect(details).toHaveProperty('totalCastlePower');
            expect(details.totalCastlePower).toBeGreaterThan(details.basePower);
        });
    });
    
    describe('position management', () => {
        test('should get position', () => {
            const position = castle.getPosition();
            expect(position.x).toBe(10);
            expect(position.y).toBe(15);
        });
        
        test('should set position', () => {
            castle.setPosition(20, 25);
            
            const position = castle.getPosition();
            expect(position.x).toBe(20);
            expect(position.y).toBe(25);
        });
    });
    
    describe('utility methods', () => {
        test('should check if can build more buildings', () => {
            expect(castle.canBuildMoreBuildings()).toBe(true);
            
            // Fill all slots
            for (let i = 0; i < castle.buildingSlots; i++) {
                castle.addBuilding(new MockBuilding(`building${i}`, `Building ${i}`));
            }
            
            expect(castle.canBuildMoreBuildings()).toBe(false);
        });
        
        test('should get castle information', () => {
            const building = new MockBuilding('barracks', 'Barracks');
            castle.addBuilding(building);
            
            const info = castle.getInfo();
            
            expect(info).toHaveProperty('id', 'castle1');
            expect(info).toHaveProperty('name', 'Castle castle1');
            expect(info).toHaveProperty('owner', 'player1');
            expect(info).toHaveProperty('position');
            expect(info).toHaveProperty('isCapital', false);
            expect(info).toHaveProperty('buildingCount', 1);
            expect(info).toHaveProperty('availableSlots', 6);
            expect(info).toHaveProperty('buildings');
            expect(info).toHaveProperty('hasGarrison', false);
            expect(info).toHaveProperty('resourceRates');
            expect(info).toHaveProperty('defensePower');
            
            expect(info.buildings).toHaveLength(1);
            expect(info.buildings[0].type).toBe('barracks');
        });
    });
    
    describe('serialization', () => {
        test('should serialize castle data', () => {
            const building = new MockBuilding('barracks', 'Barracks');
            castle.addBuilding(building);
            
            const serialized = castle.serialize();
            
            expect(serialized).toHaveProperty('id', 'castle1');
            expect(serialized).toHaveProperty('type', 'castle');
            expect(serialized).toHaveProperty('owner', 'player1');
            expect(serialized).toHaveProperty('name', 'Castle castle1');
            expect(serialized).toHaveProperty('isCapital', false);
            expect(serialized).toHaveProperty('buildings');
            expect(serialized).toHaveProperty('components');
            
            expect(serialized.buildings).toHaveLength(1);
        });
        
        test('should deserialize castle data', () => {
            const data = {
                id: 'castle2',
                name: 'Test Castle',
                isCapital: true,
                buildingSlots: 8,
                buildings: [],
                garrisonArmy: null,
                components: {
                    position: { x: 30, y: 40 }
                }
            };
            
            const deserialized = Castle.deserialize(data, mockPlayer);
            
            expect(deserialized.id).toBe('castle2');
            expect(deserialized.name).toBe('Test Castle');
            expect(deserialized.isCapital).toBe(true);
            expect(deserialized.buildingSlots).toBe(8);
            expect(deserialized.owner).toBe(mockPlayer);
            
            const position = deserialized.getPosition();
            expect(position.x).toBe(30);
            expect(position.y).toBe(40);
        });
    });
});