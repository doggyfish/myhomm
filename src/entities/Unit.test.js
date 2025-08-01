import { Unit } from './Unit.js';
import { Army } from './Army.js';
import { Player } from '../game/Player.js';
import { ResourceManager } from '../game/ResourceManager.js';

describe('Unit', () => {
    describe('constructor', () => {
        test('should create human swordsman unit correctly', () => {
            const unit = new Unit('human', 'swordsman');
            
            expect(unit.faction).toBe('human');
            expect(unit.unitType).toBe('swordsman');
            expect(unit.power).toBe(5);
            expect(unit.speed).toBe(10);
            expect(unit.cost).toEqual({ gold: 50 });
            expect(unit.isRanged).toBe(false);
            expect(unit.antiCastle).toBe(1.0);
            expect(unit.canCastSpells).toBe(false);
            expect(unit.ability).toBe(null);
        });

        test('should create human archer with ranged property', () => {
            const unit = new Unit('human', 'archer');
            
            expect(unit.power).toBe(8);
            expect(unit.speed).toBe(5);
            expect(unit.isRanged).toBe(true);
        });

        test('should create human paladin with ability', () => {
            const unit = new Unit('human', 'paladin');
            
            expect(unit.power).toBe(50);
            expect(unit.speed).toBe(80);
            expect(unit.ability).toBe('powerBoost');
            expect(unit.cost).toEqual({ gold: 500 });
        });

        test('should create orc berserker with rage ability', () => {
            const unit = new Unit('orc', 'berserker');
            
            expect(unit.power).toBe(55);
            expect(unit.speed).toBe(75);
            expect(unit.ability).toBe('rage');
        });

        test('should create orc ogre with anti-castle bonus', () => {
            const unit = new Unit('orc', 'ogre');
            
            expect(unit.power).toBe(30);
            expect(unit.speed).toBe(15);
            expect(unit.antiCastle).toBe(1.5);
        });

        test('should create wizard with spell casting ability', () => {
            const unit = new Unit('human', 'wizard');
            
            expect(unit.canCastSpells).toBe(true);
            expect(unit.cost).toEqual({ gold: 150, mana: 50 });
        });

        test('should throw error for invalid unit type', () => {
            expect(() => new Unit('human', 'invalid')).toThrow('Invalid unit type: human.invalid');
            expect(() => new Unit('invalid', 'swordsman')).toThrow('Invalid unit type: invalid.swordsman');
        });
    });

    describe('speed property', () => {
        test('should ensure speed is a property of unit type, not instances', () => {
            const unit1 = new Unit('human', 'knight');
            const unit2 = new Unit('human', 'knight');
            
            expect(unit1.speed).toBe(100);
            expect(unit2.speed).toBe(100);
            expect(unit1.speed).toBe(unit2.speed);
            
            // Speed should be read from config, not modifiable
            const originalSpeed = unit1.speed;
            unit1.speed = 200; // Try to modify
            const unit3 = new Unit('human', 'knight');
            expect(unit3.speed).toBe(originalSpeed); // New instance should have original speed
        });

        test('should have different speeds for different unit types', () => {
            const swordsman = new Unit('human', 'swordsman');
            const knight = new Unit('human', 'knight');
            const archer = new Unit('human', 'archer');
            
            expect(swordsman.speed).toBe(10);
            expect(knight.speed).toBe(100);
            expect(archer.speed).toBe(5);
        });

        test('should have fastest unit be orc wolf rider', () => {
            const wolfRider = new Unit('orc', 'wolfRider');
            expect(wolfRider.speed).toBe(120);
        });
    });

    describe('cost management', () => {
        test('should get unit cost correctly', () => {
            const unit = new Unit('human', 'swordsman');
            const cost = unit.getCost();
            
            expect(cost).toEqual({ gold: 50 });
            
            // Should return a copy, not reference
            cost.gold = 100;
            expect(unit.getCost()).toEqual({ gold: 50 });
        });

        test('should check affordability correctly', () => {
            const player = new Player('p1', 'Test', 'human', false);
            const resourceManager = player.resourceManager;
            const unit = new Unit('human', 'knight');
            
            // Can't afford initially
            expect(unit.canAfford(resourceManager)).toBe(false);
            
            // Add resources
            resourceManager.setResource('gold', 200);
            expect(unit.canAfford(resourceManager)).toBe(true);
            
            // Check wizard with mana cost
            const wizard = new Unit('human', 'wizard');
            expect(wizard.canAfford(resourceManager)).toBe(false); // Has gold but no mana
            
            resourceManager.setResource('mana', 50);
            expect(wizard.canAfford(resourceManager)).toBe(true);
        });
    });

    describe('ability system', () => {
        describe('berserker rage', () => {
            test('should increase power when in combat', () => {
                const berserker = new Unit('orc', 'berserker');
                
                expect(berserker.getEffectivePower()).toBe(55); // Base power
                expect(berserker.getEffectivePower({ inCombat: true })).toBe(82.5); // 55 * 1.5
            });

            test('should apply rage ability', () => {
                const berserker = new Unit('orc', 'berserker');
                const result = berserker.applyAbility(null, { inCombat: true });
                
                expect(result.applied).toBe(true);
                expect(result.type).toBe('rage');
            });
        });

        describe('paladin power boost', () => {
            test('should calculate boost based on paladin count', () => {
                const paladin = new Unit('human', 'paladin');
                const player = new Player('p1', 'Test', 'human', false);
                const army = new Army('army1', player);
                
                // No paladins, no boost
                let result = paladin.applyAbility(army);
                expect(result.applied).toBe(false);
                
                // Add paladins
                army.addUnits('paladin', 1);
                result = paladin.applyAbility(army);
                expect(result.applied).toBe(true);
                expect(result.type).toBe('powerBoost');
                expect(result.value).toBe(0.1); // 10% boost for 1 paladin
                expect(result.count).toBe(1);
                
                // Add more paladins
                army.addUnits('paladin', 2);
                result = paladin.applyAbility(army);
                expect(result.value).toBeCloseTo(0.3, 10); // 30% boost for 3 paladins
                
                // Test max cap
                army.addUnits('paladin', 10);
                result = paladin.applyAbility(army);
                expect(result.value).toBe(0.5); // Capped at 50%
            });

            test('should not apply boost to non-paladin unit', () => {
                const swordsman = new Unit('human', 'swordsman');
                const player = new Player('p1', 'Test', 'human', false);
                const army = new Army('army1', player);
                
                army.addUnits('paladin', 5);
                const result = swordsman.applyAbility(army);
                expect(result.applied).toBe(false);
            });
        });

        test('should check ability existence', () => {
            const paladin = new Unit('human', 'paladin');
            const berserker = new Unit('orc', 'berserker');
            const swordsman = new Unit('human', 'swordsman');
            
            expect(paladin.hasAbility('powerBoost')).toBe(true);
            expect(paladin.hasAbility('rage')).toBe(false);
            
            expect(berserker.hasAbility('rage')).toBe(true);
            expect(berserker.hasAbility('powerBoost')).toBe(false);
            
            expect(swordsman.hasAbility('powerBoost')).toBe(false);
            expect(swordsman.hasAbility('rage')).toBe(false);
        });
    });

    describe('combat modifiers', () => {
        test('should apply anti-castle bonus', () => {
            const ogre = new Unit('orc', 'ogre');
            const swordsman = new Unit('human', 'swordsman');
            
            // Against castle
            let modifiers = ogre.getCombatModifiers({ type: 'castle' });
            expect(modifiers.damage).toBe(1.5);
            
            // Against non-castle
            modifiers = ogre.getCombatModifiers({ type: 'army' });
            expect(modifiers.damage).toBe(1.0);
            
            // Unit without anti-castle
            modifiers = swordsman.getCombatModifiers({ type: 'castle' });
            expect(modifiers.damage).toBe(1.0);
        });
    });

    describe('static methods', () => {
        test('should create unit using static method', () => {
            const unit = Unit.create('human', 'knight');
            
            expect(unit).toBeInstanceOf(Unit);
            expect(unit.faction).toBe('human');
            expect(unit.unitType).toBe('knight');
            expect(unit.power).toBe(20);
        });

        test('should check unit existence', () => {
            expect(Unit.exists('human', 'swordsman')).toBe(true);
            expect(Unit.exists('human', 'knight')).toBe(true);
            expect(Unit.exists('orc', 'warrior')).toBe(true);
            expect(Unit.exists('human', 'invalid')).toBe(false);
            expect(Unit.exists('invalid', 'swordsman')).toBe(false);
        });

        test('should get all faction units', () => {
            const humanUnits = Unit.getFactionUnits('human');
            const orcUnits = Unit.getFactionUnits('orc');
            
            expect(humanUnits).toHaveLength(5);
            expect(humanUnits.every(u => u instanceof Unit)).toBe(true);
            expect(humanUnits.every(u => u.faction === 'human')).toBe(true);
            
            expect(orcUnits).toHaveLength(6);
            expect(orcUnits.every(u => u instanceof Unit)).toBe(true);
            expect(orcUnits.every(u => u.faction === 'orc')).toBe(true);
            
            // Invalid faction
            const invalidUnits = Unit.getFactionUnits('invalid');
            expect(invalidUnits).toEqual([]);
        });
    });

    describe('display information', () => {
        test('should get display info', () => {
            const paladin = new Unit('human', 'paladin');
            const info = paladin.getDisplayInfo();
            
            expect(info).toEqual({
                name: 'Paladin',
                faction: 'human',
                type: 'paladin',
                power: 50,
                speed: 80,
                cost: { gold: 500 },
                isRanged: false,
                canCastSpells: false,
                ability: 'powerBoost',
                antiCastle: null
            });
        });

        test('should format display names correctly', () => {
            expect(new Unit('human', 'swordsman').getDisplayName()).toBe('Swordsman');
            expect(new Unit('orc', 'wolfRider').getDisplayName()).toBe('Wolf Rider');
            expect(new Unit('human', 'knight').getDisplayName()).toBe('Knight');
        });

        test('should include anti-castle in display info when applicable', () => {
            const ogre = new Unit('orc', 'ogre');
            const info = ogre.getDisplayInfo();
            
            expect(info.antiCastle).toBe(1.5);
        });
    });

    describe('special properties', () => {
        test('should identify ranged units', () => {
            const archer = new Unit('human', 'archer');
            const swordsman = new Unit('human', 'swordsman');
            
            expect(archer.isRanged).toBe(true);
            expect(swordsman.isRanged).toBe(false);
        });

        test('should identify spell casting units', () => {
            const wizard = new Unit('human', 'wizard');
            const shaman = new Unit('orc', 'shaman');
            const knight = new Unit('human', 'knight');
            
            expect(wizard.canCastSpells).toBe(true);
            expect(shaman.canCastSpells).toBe(true);
            expect(knight.canCastSpells).toBe(false);
        });
    });
});