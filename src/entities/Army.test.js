import { Army } from './Army.js';
import { Player } from '../game/Player.js';

describe('Army', () => {
    let player;
    let army;

    beforeEach(() => {
        // Create a mock player with faction
        player = new Player('player1', 'Test Player', 'human', false);
        army = new Army('army1', player);
    });

    describe('constructor', () => {
        test('should create army with correct initial state', () => {
            expect(army.id).toBe('army1');
            expect(army.type).toBe('army');
            expect(army.owner).toBe(player);
            expect(army.units.size).toBe(0);
            expect(army.spellQueue).toEqual([]);
        });

        test('should initialize with required components', () => {
            expect(army.hasComponent('position')).toBe(true);
            expect(army.hasComponent('movement')).toBe(true);
            expect(army.hasComponent('combat')).toBe(true);
        });
    });

    describe('unit management', () => {
        test('should add units correctly', () => {
            const result = army.addUnits('swordsman', 10);
            
            expect(result).toBe(true);
            expect(army.getUnitCount('swordsman')).toBe(10);
            expect(army.getTotalUnitCount()).toBe(10);
        });

        test('should add multiple unit types', () => {
            army.addUnits('swordsman', 10);
            army.addUnits('archer', 5);
            
            expect(army.getUnitCount('swordsman')).toBe(10);
            expect(army.getUnitCount('archer')).toBe(5);
            expect(army.getTotalUnitCount()).toBe(15);
        });

        test('should accumulate units of same type', () => {
            army.addUnits('swordsman', 10);
            army.addUnits('swordsman', 5);
            
            expect(army.getUnitCount('swordsman')).toBe(15);
            expect(army.getTotalUnitCount()).toBe(15);
        });

        test('should reject invalid unit types', () => {
            const result = army.addUnits('invalidUnit', 10);
            
            expect(result).toBe(false);
            expect(army.getTotalUnitCount()).toBe(0);
        });

        test('should reject negative unit counts', () => {
            const result = army.addUnits('swordsman', -5);
            
            expect(result).toBe(false);
            expect(army.getTotalUnitCount()).toBe(0);
        });

        test('should reject zero unit counts', () => {
            const result = army.addUnits('swordsman', 0);
            
            expect(result).toBe(false);
            expect(army.getTotalUnitCount()).toBe(0);
        });
    });

    describe('unit removal', () => {
        beforeEach(() => {
            army.addUnits('swordsman', 10);
            army.addUnits('archer', 5);
        });

        test('should remove units correctly', () => {
            const result = army.removeUnits('swordsman', 3);
            
            expect(result).toBe(true);
            expect(army.getUnitCount('swordsman')).toBe(7);
            expect(army.getTotalUnitCount()).toBe(12);
        });

        test('should remove all units of type when count reaches zero', () => {
            const result = army.removeUnits('archer', 5);
            
            expect(result).toBe(true);
            expect(army.hasUnitType('archer')).toBe(false);
            expect(army.getUnitCount('archer')).toBe(0);
            expect(army.getTotalUnitCount()).toBe(10);
        });

        test('should reject removing more units than available', () => {
            const result = army.removeUnits('swordsman', 15);
            
            expect(result).toBe(false);
            expect(army.getUnitCount('swordsman')).toBe(10);
        });

        test('should reject removing from non-existent unit type', () => {
            const result = army.removeUnits('knight', 1);
            
            expect(result).toBe(false);
        });

        test('should reject negative removal counts', () => {
            const result = army.removeUnits('swordsman', -3);
            
            expect(result).toBe(false);
            expect(army.getUnitCount('swordsman')).toBe(10);
        });
    });

    describe('power calculation', () => {
        test('should calculate power correctly for single unit type', () => {
            army.addUnits('swordsman', 10); // power 5 each = 50 total
            
            expect(army.calculatePower()).toBe(50);
            
            const combatComponent = army.getComponent('combat');
            expect(combatComponent.basePower).toBe(50);
        });

        test('should calculate power correctly for multiple unit types', () => {
            army.addUnits('swordsman', 10); // power 5 each = 50
            army.addUnits('archer', 3); // power 8 each = 24
            
            expect(army.calculatePower()).toBe(74);
        });

        test('should return zero power for empty army', () => {
            expect(army.calculatePower()).toBe(0);
        });

        test('should update power when units are added', () => {
            army.addUnits('swordsman', 5);
            expect(army.calculatePower()).toBe(25);
            
            army.addUnits('archer', 2);
            expect(army.calculatePower()).toBe(41); // 25 + 16
        });

        test('should update power when units are removed', () => {
            army.addUnits('swordsman', 10);
            army.addUnits('archer', 4);
            expect(army.calculatePower()).toBe(82); // 50 + 32
            
            army.removeUnits('archer', 2);
            expect(army.calculatePower()).toBe(66); // 50 + 16
        });
    });

    describe('speed calculation', () => {
        test('should calculate speed correctly for single unit type', () => {
            army.addUnits('swordsman', 100); // speed 10, quantity doesn't matter
            
            expect(army.calculateSpeed()).toBe(10);
        });

        test('should calculate average speed for multiple unit types', () => {
            army.addUnits('swordsman', 100); // speed 10
            army.addUnits('archer', 1); // speed 5
            
            // Average: (10 + 5) / 2 = 7.5
            expect(army.calculateSpeed()).toBe(7.5);
        });

        test('should not weight speed by unit quantities', () => {
            army.addUnits('swordsman', 1000); // speed 10, large quantity
            army.addUnits('archer', 1); // speed 5, small quantity
            
            // Should still be (10 + 5) / 2 = 7.5, NOT weighted by quantities
            expect(army.calculateSpeed()).toBe(7.5);
        });

        test('should handle three different unit types', () => {
            army.addUnits('swordsman', 10); // speed 10
            army.addUnits('archer', 5); // speed 5
            army.addUnits('knight', 2); // speed 100
            
            // Average: (10 + 5 + 100) / 3 = 38.33...
            expect(army.calculateSpeed()).toBeCloseTo(38.333, 3);
        });

        test('should return zero speed for empty army', () => {
            expect(army.calculateSpeed()).toBe(0);
        });

        test('should update speed when units are added', () => {
            army.addUnits('swordsman', 10);
            expect(army.calculateSpeed()).toBe(10);
            
            army.addUnits('archer', 5);
            expect(army.calculateSpeed()).toBe(7.5); // (10 + 5) / 2
        });

        test('should update speed when units are removed', () => {
            army.addUnits('swordsman', 10); // speed 10
            army.addUnits('archer', 5); // speed 5
            army.addUnits('knight', 2); // speed 100
            expect(army.calculateSpeed()).toBeCloseTo(38.333, 3);
            
            army.removeUnits('knight', 2); // Remove fastest units
            expect(army.calculateSpeed()).toBe(7.5); // (10 + 5) / 2
        });

        test('should update movement component when speed changes', () => {
            army.addUnits('swordsman', 10);
            const movementComponent = army.getComponent('movement');
            expect(movementComponent.baseSpeed).toBe(10);
            
            army.addUnits('archer', 10);
            expect(movementComponent.baseSpeed).toBe(7.5);
        });
    });

    describe('army merging', () => {
        let secondArmy;

        beforeEach(() => {
            secondArmy = new Army('army2', player);
        });

        test('should merge armies correctly', () => {
            army.addUnits('swordsman', 10);
            army.addUnits('archer', 5);
            
            secondArmy.addUnits('swordsman', 5);
            secondArmy.addUnits('knight', 2);
            
            const result = army.mergeArmy(secondArmy);
            
            expect(result).toBe(true);
            expect(army.getUnitCount('swordsman')).toBe(15);
            expect(army.getUnitCount('archer')).toBe(5);
            expect(army.getUnitCount('knight')).toBe(2);
            expect(army.getTotalUnitCount()).toBe(22);
            
            // Second army should be empty
            expect(secondArmy.getTotalUnitCount()).toBe(0);
        });

        test('should reject merging armies from different owners', () => {
            const differentPlayer = new Player('player2', 'Different Player', 'orc', false);
            const enemyArmy = new Army('enemy1', differentPlayer);
            
            army.addUnits('swordsman', 10);
            enemyArmy.addUnits('warrior', 5);
            
            const result = army.mergeArmy(enemyArmy);
            
            expect(result).toBe(false);
            expect(army.getTotalUnitCount()).toBe(10);
            expect(enemyArmy.getTotalUnitCount()).toBe(5);
        });

        test('should update army stats after merging', () => {
            army.addUnits('swordsman', 10); // power 50, speed 10
            secondArmy.addUnits('archer', 10); // power 80, speed 5
            
            army.mergeArmy(secondArmy);
            
            expect(army.calculatePower()).toBe(130); // 50 + 80
            expect(army.calculateSpeed()).toBe(7.5); // (10 + 5) / 2
        });
    });

    describe('army splitting', () => {
        beforeEach(() => {
            army.addUnits('swordsman', 20);
            army.addUnits('archer', 10);
            army.addUnits('knight', 4);
        });

        test('should split army correctly', () => {
            const unitsToSplit = new Map([
                ['swordsman', 5],
                ['archer', 3]
            ]);
            
            const newArmy = army.splitArmy(unitsToSplit, 'army2');
            
            expect(newArmy).not.toBeNull();
            expect(newArmy.id).toBe('army2');
            expect(newArmy.owner).toBe(player);
            
            // Check original army
            expect(army.getUnitCount('swordsman')).toBe(15);
            expect(army.getUnitCount('archer')).toBe(7);
            expect(army.getUnitCount('knight')).toBe(4);
            
            // Check new army
            expect(newArmy.getUnitCount('swordsman')).toBe(5);
            expect(newArmy.getUnitCount('archer')).toBe(3);
            expect(newArmy.getUnitCount('knight')).toBe(0);
        });

        test('should reject splitting more units than available', () => {
            const unitsToSplit = new Map([
                ['swordsman', 25] // More than the 20 available
            ]);
            
            const newArmy = army.splitArmy(unitsToSplit, 'army2');
            
            expect(newArmy).toBeNull();
            expect(army.getUnitCount('swordsman')).toBe(20); // Unchanged
        });

        test('should copy position to new army', () => {
            army.setPosition(100, 200);
            
            const unitsToSplit = new Map([['swordsman', 5]]);
            const newArmy = army.splitArmy(unitsToSplit, 'army2');
            
            const originalPos = army.getPosition();
            const newPos = newArmy.getPosition();
            
            expect(newPos.x).toBe(originalPos.x);
            expect(newPos.y).toBe(originalPos.y);
        });

        test('should update army stats after splitting', () => {
            const originalPower = army.calculatePower();
            const originalSpeed = army.calculateSpeed();
            
            const unitsToSplit = new Map([['swordsman', 10]]);
            const newArmy = army.splitArmy(unitsToSplit, 'army2');
            
            // Original army should have less power but same speed (still has all unit types)
            expect(army.calculatePower()).toBeLessThan(originalPower);
            expect(army.calculateSpeed()).toBe(originalSpeed);
            
            // New army should have some power and speed
            expect(newArmy.calculatePower()).toBeGreaterThan(0);
            expect(newArmy.calculateSpeed()).toBeGreaterThan(0);
        });
    });

    describe('utility methods', () => {
        beforeEach(() => {
            army.addUnits('swordsman', 10);
            army.addUnits('archer', 5);
        });

        test('should check if army has units', () => {
            expect(army.hasUnits()).toBe(true);
            
            const emptyArmy = new Army('empty', player);
            expect(emptyArmy.hasUnits()).toBe(false);
        });

        test('should check for specific unit types', () => {
            expect(army.hasUnitType('swordsman')).toBe(true);
            expect(army.hasUnitType('archer')).toBe(true);
            expect(army.hasUnitType('knight')).toBe(false);
        });

        test('should get army composition', () => {
            const composition = army.getComposition();
            
            expect(composition).toEqual({
                swordsman: 10,
                archer: 5
            });
        });

        test('should handle position management', () => {
            army.setPosition(150, 300);
            const position = army.getPosition();
            
            expect(position.x).toBe(150);
            expect(position.y).toBe(300);
        });

        test('should handle tile position management', () => {
            army.setTilePosition(5, 10);
            const position = army.getPosition();
            
            // Tile position 5,10 with tileSize 64 = world position 320,640
            expect(position.x).toBe(320);
            expect(position.y).toBe(640);
        });
    });

    describe('faction-specific units', () => {
        test('should work with human faction units', () => {
            army.addUnits('swordsman', 10);
            army.addUnits('knight', 2);
            army.addUnits('paladin', 1);
            
            expect(army.calculatePower()).toBe(140); // 50 + 40 + 50
            expect(army.calculateSpeed()).toBeCloseTo(63.333, 3); // (10 + 100 + 80) / 3
        });

        test('should work with orc faction units', () => {
            const orcPlayer = new Player('orc1', 'Orc Player', 'orc', false);
            const orcArmy = new Army('orcArmy', orcPlayer);
            
            orcArmy.addUnits('warrior', 10);
            orcArmy.addUnits('wolfRider', 2);
            orcArmy.addUnits('berserker', 1);
            
            expect(orcArmy.calculatePower()).toBe(145); // 60 + 30 + 55
            expect(orcArmy.calculateSpeed()).toBeCloseTo(68.333, 3); // (10 + 120 + 75) / 3
        });
    });

    describe('edge cases', () => {
        test('should handle army with no owner', () => {
            const orphanArmy = new Army('orphan', null);
            
            // Should default to human faction when owner is null
            const result = orphanArmy.addUnits('swordsman', 5);
            expect(result).toBe(true);
            expect(orphanArmy.calculatePower()).toBe(25);
        });

        test('should handle destroy correctly', () => {
            army.addUnits('swordsman', 10);
            army.spellQueue.push({ type: 'fireball' });
            
            army.destroy();
            
            expect(army.units.size).toBe(0);
            expect(army.spellQueue.length).toBe(0);
        });
    });
});