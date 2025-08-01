import { CombatComponent } from './CombatComponent.js';

describe('CombatComponent', () => {
    let combat;
    
    beforeEach(() => {
        combat = new CombatComponent(100);
    });
    
    describe('constructor', () => {
        test('should create combat component with correct values', () => {
            expect(combat.basePower).toBe(100);
            expect(combat.power).toBe(100);
            expect(combat.isRanged).toBe(false);
            expect(combat.bonuses).toEqual([]);
        });
        
        test('should create ranged combat component', () => {
            const rangedCombat = new CombatComponent(50, true);
            expect(rangedCombat.isRanged).toBe(true);
        });
    });
    
    describe('bonus management', () => {
        test('should add additive bonus', () => {
            const bonus = { id: 'test', type: 'additive', value: 20 };
            combat.addBonus(bonus);
            
            expect(combat.bonuses).toContain(bonus);
            expect(combat.power).toBe(120); // 100 + 20
        });
        
        test('should add multiplicative bonus', () => {
            const bonus = { id: 'test', type: 'multiplicative', value: 1.5 };
            combat.addBonus(bonus);
            
            expect(combat.power).toBe(150); // 100 * 1.5
        });
        
        test('should apply multiple bonuses correctly', () => {
            const additiveBonus = { id: 'add', type: 'additive', value: 20 };
            const multiplicativeBonus = { id: 'mult', type: 'multiplicative', value: 2.0 };
            
            combat.addBonus(additiveBonus);
            combat.addBonus(multiplicativeBonus);
            
            expect(combat.power).toBe(240); // (100 + 20) * 2.0
        });
        
        test('should remove bonus by id', () => {
            const bonus1 = { id: 'bonus1', type: 'additive', value: 20 };
            const bonus2 = { id: 'bonus2', type: 'additive', value: 30 };
            
            combat.addBonus(bonus1);
            combat.addBonus(bonus2);
            expect(combat.power).toBe(150); // 100 + 20 + 30
            
            combat.removeBonus('bonus1');
            expect(combat.power).toBe(130); // 100 + 30
            expect(combat.bonuses).toHaveLength(1);
        });
        
        test('should clear all bonuses', () => {
            combat.addBonus({ id: 'test1', type: 'additive', value: 20 });
            combat.addBonus({ id: 'test2', type: 'multiplicative', value: 1.5 });
            
            combat.clearBonuses();
            
            expect(combat.bonuses).toEqual([]);
            expect(combat.power).toBe(100); // Back to base power
        });
        
        test('should prevent negative power', () => {
            const negativeBonus = { id: 'negative', type: 'additive', value: -150 };
            combat.addBonus(negativeBonus);
            
            expect(combat.power).toBe(0); // Should be clamped to 0
        });
    });
    
    describe('effective power calculation', () => {
        test('should calculate effective power with terrain modifier', () => {
            combat.addBonus({ id: 'test', type: 'additive', value: 50 });
            // Power is now 150
            
            const effectivePower = combat.getEffectivePower(1.2);
            expect(effectivePower).toBe(180); // 150 * 1.2
        });
        
        test('should use default terrain modifier of 1.0', () => {
            const effectivePower = combat.getEffectivePower();
            expect(effectivePower).toBe(100);
        });
    });
});