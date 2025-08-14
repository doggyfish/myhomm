import { CombatEngine } from './CombatEngine.js';
import { CombatComponent } from '../entities/components/CombatComponent.js';
import { DefenseComponent } from '../entities/components/DefenseComponent.js';
import { Entity } from '../entities/Entity.js';
import { CONFIG } from '../config/ConfigurationManager.js';
import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';
import { COMBAT_EVENTS } from '../events/CombatEvents.js';

// Mock GameStateManager
class MockGameStateManager {
    constructor() {
        this.armies = [];
        this.castles = [];
    }

    getAllArmies() {
        return this.armies;
    }

    getAllCastles() {
        return this.castles;
    }

    removeArmy(armyId) {
        const index = this.armies.findIndex(army => army.id === armyId);
        if (index >= 0) {
            this.armies.splice(index, 1);
            return true;
        }
        return false;
    }
}

// Mock Entity with components
class MockArmy extends Entity {
    constructor(id, owner, power = 100) {
        super(id, 'army', owner);
        this.addComponent('combat', new CombatComponent(power));
        this.spellQueue = [];
    }

    applyCombatLosses(lossAmount) {
        const combat = this.getComponent('combat');
        if (combat) {
            combat.updatePower(Math.max(0, combat.power - lossAmount));
        }
    }

    canCombat() {
        const combat = this.getComponent('combat');
        return combat && combat.power > 0;
    }
}

class MockCastle extends Entity {
    constructor(id, owner, defensePower = 150) {
        super(id, 'castle', owner);
        this.addComponent('defense', new DefenseComponent(defensePower));
        this.garrisonArmy = null;
        this.buildings = [];
    }

    applySiegeDamage(damage) {
        const defense = this.getComponent('defense');
        if (defense) {
            defense.damageWalls(damage);
        }
    }
}

describe('CombatEngine', () => {
    let combatEngine;
    let mockGameState;

    beforeEach(() => {
        mockGameState = new MockGameStateManager();
        combatEngine = new CombatEngine(mockGameState);
    });

    describe('constructor', () => {
        test('should create combat engine with game state', () => {
            expect(combatEngine.gameState).toBe(mockGameState);
        });

        test('should be an EventEmitter', () => {
            expect(typeof combatEngine.on).toBe('function');
            expect(typeof combatEngine.emit).toBe('function');
        });
    });

    describe('resolveCombat', () => {
        let attacker, defender;

        beforeEach(() => {
            attacker = new MockArmy('army1', { id: 'player1' }, 100);
            defender = new MockArmy('army2', { id: 'player2' }, 80);
        });

        test('should resolve army vs army combat correctly', () => {
            const position = { x: 5, y: 5 };
            const result = combatEngine.resolveCombat(attacker, defender, position, 'grassland');

            expect(result).toBeDefined();
            expect(result.winner).toBe(attacker);
            expect(result.loser).toBe(defender);
            expect(result.position).toEqual(position);
            expect(result.terrain).toBe('grassland');
        });

        test('should apply terrain modifiers correctly', () => {
            // Test forest terrain (1.1x combat modifier)
            const result = combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'forest');
            
            expect(result.terrain).toBe('forest');
            // Both armies get terrain bonus, so stronger army still wins
            expect(result.winner).toBe(attacker);
        });

        test('should emit combat events', (done) => {
            let initiatedEmitted = false;
            let resolvedEmitted = false;

            combatEngine.on(COMBAT_EVENTS.INITIATED, () => {
                initiatedEmitted = true;
            });

            combatEngine.on(COMBAT_EVENTS.RESOLVED, () => {
                resolvedEmitted = true;
                expect(initiatedEmitted).toBe(true);
                expect(resolvedEmitted).toBe(true);
                done();
            });

            combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');
        });

        test('should complete within performance requirement', () => {
            const startTime = performance.now();
            combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(100); // Should complete within 100ms
        });

        test('should handle draw scenarios', () => {
            // Create armies with equal power
            const equalAttacker = new MockArmy('army1', { id: 'player1' }, 100);
            const equalDefender = new MockArmy('army2', { id: 'player2' }, 100);

            const result = combatEngine.resolveCombat(equalAttacker, equalDefender, { x: 0, y: 0 }, 'grassland');

            expect(result.draw).toBe(true);
            expect(result.winner).toBeNull();
            expect(result.loser).toBeNull();
            expect(result.attackerLosses).toBeGreaterThan(0);
            expect(result.defenderLosses).toBeGreaterThan(0);
        });
    });

    describe('castle siege combat', () => {
        let army, castle;

        beforeEach(() => {
            army = new MockArmy('army1', { id: 'player1' }, 200);
            castle = new MockCastle('castle1', { id: 'player2' }, 100);
        });

        test('should handle castle siege correctly', () => {
            const result = combatEngine.resolveCombat(army, castle, { x: 10, y: 10 }, 'grassland');

            expect(result.terrain).toBe('grassland');
            // Army should win against basic castle defense
            expect(result.winner).toBe(army);
            expect(result.loser).toBe(castle);
        });

        test('should apply castle defense multiplier', () => {
            const castleDefenseMultiplier = CONFIG.get('combat.castleDefenseMultiplier');
            expect(castleDefenseMultiplier).toBe(1.5);

            // Castle with garrison should be stronger
            const garrison = new MockArmy('garrison', { id: 'player2' }, 50);
            castle.garrisonArmy = garrison;

            const result = combatEngine.resolveCombat(army, castle, { x: 0, y: 0 }, 'grassland');
            
            // Castle with garrison and defense multiplier might win
            expect(result).toBeDefined();
        });

        test('should emit castle under siege event', (done) => {
            combatEngine.on(COMBAT_EVENTS.CASTLE_UNDER_SIEGE, (event) => {
                expect(event.castle).toBe(castle);
                expect(event.attackingArmy).toBe(army);
                done();
            });

            combatEngine.resolveCombat(army, castle, { x: 0, y: 0 }, 'grassland');
        });
    });

    describe('terrain modifiers', () => {
        let attacker, defender;

        beforeEach(() => {
            attacker = new MockArmy('army1', { id: 'player1' }, 100);
            defender = new MockArmy('army2', { id: 'player2' }, 100);
        });

        test('should apply forest combat bonus', () => {
            const originalPower = 100;
            const forestModifier = TERRAIN_CONFIG.forest.combatModifier;
            
            expect(forestModifier).toBe(1.1);
            
            const modifiedPower = combatEngine.applyTerrainModifiers(originalPower, 'forest');
            expect(modifiedPower).toBe(originalPower * forestModifier);
        });

        test('should apply swamp combat bonus', () => {
            const originalPower = 100;
            const swampModifier = TERRAIN_CONFIG.swamp.combatModifier;
            
            expect(swampModifier).toBe(1.1);
            
            const modifiedPower = combatEngine.applyTerrainModifiers(originalPower, 'swamp');
            expect(modifiedPower).toBe(originalPower * swampModifier);
        });

        test('should apply lake combat penalty', () => {
            const originalPower = 100;
            const lakeModifier = TERRAIN_CONFIG.lake.combatModifier;
            
            expect(lakeModifier).toBe(0.9);
            
            const modifiedPower = combatEngine.applyTerrainModifiers(originalPower, 'lake');
            expect(modifiedPower).toBe(originalPower * lakeModifier);
        });

        test('should handle unknown terrain', () => {
            const originalPower = 100;
            const modifiedPower = combatEngine.applyTerrainModifiers(originalPower, 'unknown');
            
            expect(modifiedPower).toBe(originalPower); // No modifier applied
        });
    });

    describe('spell effects', () => {
        let attacker, defender;

        beforeEach(() => {
            attacker = new MockArmy('army1', { id: 'player1' }, 100);
            defender = new MockArmy('army2', { id: 'player2' }, 100);
        });

        test('should apply damage spells', () => {
            // Add damage spell to attacker's queue
            attacker.spellQueue = [{
                id: 'fireball',
                name: 'Fireball',
                type: 'damage',
                value: 20,
                target: 'attacker' // Damage to enemy
            }];

            const result = combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');
            
            expect(result.spellEffectsApplied).toContain('Fireball');
        });

        test('should apply heal spells', () => {
            attacker.spellQueue = [{
                id: 'heal',
                name: 'Heal',
                type: 'heal',
                value: 15,
                target: 'defender' // Heal self (confusing naming, but correct logic)
            }];

            const result = combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');
            
            expect(result.spellEffectsApplied).toContain('Heal');
        });

        test('should apply buff spells', () => {
            attacker.spellQueue = [{
                id: 'bless',
                name: 'Bless',
                type: 'buff',
                value: 0.2, // 20% power increase
                target: 'both'
            }];

            const result = combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');
            
            expect(result.spellEffectsApplied).toContain('Bless');
        });

        test('should clear spell queues after combat', () => {
            attacker.spellQueue = [{ id: 'spell1', name: 'Test', type: 'damage', value: 10, target: 'attacker' }];
            defender.spellQueue = [{ id: 'spell2', name: 'Test2', type: 'heal', value: 5, target: 'defender' }];

            combatEngine.resolveCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');

            expect(attacker.spellQueue).toEqual([]);
            expect(defender.spellQueue).toEqual([]);
        });
    });

    describe('combat validation', () => {
        test('should validate combat participants', () => {
            const ally1 = new MockArmy('army1', { id: 'player1' }, 100);
            const ally2 = new MockArmy('army2', { id: 'player1' }, 80); // Same owner

            expect(combatEngine.canCombat(ally1, ally2)).toBe(false);
        });

        test('should require combat components', () => {
            const entity1 = new Entity('entity1', 'test', { id: 'player1' });
            const entity2 = new MockArmy('army1', { id: 'player2' }, 100);

            expect(combatEngine.canCombat(entity1, entity2)).toBe(false);
        });

        test('should require positive power', () => {
            const deadArmy = new MockArmy('army1', { id: 'player1' }, 0);
            const aliveArmy = new MockArmy('army2', { id: 'player2' }, 100);

            expect(combatEngine.canCombat(deadArmy, aliveArmy)).toBe(false);
        });
    });

    describe('combat prediction', () => {
        let attacker, defender;

        beforeEach(() => {
            attacker = new MockArmy('army1', { id: 'player1' }, 100);
            defender = new MockArmy('army2', { id: 'player2' }, 80);
        });

        test('should predict combat without applying results', () => {
            const originalAttackerPower = attacker.getComponent('combat').power;
            const originalDefenderPower = defender.getComponent('combat').power;

            const prediction = combatEngine.predictCombat(attacker, defender, { x: 0, y: 0 }, 'grassland');

            // Powers should be unchanged
            expect(attacker.getComponent('combat').power).toBe(originalAttackerPower);
            expect(defender.getComponent('combat').power).toBe(originalDefenderPower);
            
            // Prediction should still be valid
            expect(prediction.winner).toBe(attacker);
            expect(prediction.loser).toBe(defender);
        });
    });

    describe('army elimination', () => {
        test('should emit army eliminated event', (done) => {
            const weakArmy = new MockArmy('weak', { id: 'player1' }, 10);
            const strongArmy = new MockArmy('strong', { id: 'player2' }, 200);

            combatEngine.on(COMBAT_EVENTS.ARMY_ELIMINATED, (event) => {
                expect(event.army).toBe(weakArmy);
                done();
            });

            combatEngine.resolveCombat(weakArmy, strongArmy, { x: 0, y: 0 }, 'grassland');
        });
    });

    describe('performance requirements', () => {
        test('should complete multiple combats within time limits', () => {
            const armies = [];
            for (let i = 0; i < 8; i++) {
                armies.push(new MockArmy(`army${i}`, { id: `player${i % 2}` }, 100 + i * 10));
            }

            const startTime = performance.now();
            
            // Simulate multiple simultaneous combats
            for (let i = 0; i < 4; i++) {
                combatEngine.resolveCombat(armies[i * 2], armies[i * 2 + 1], { x: i, y: i }, 'grassland');
            }
            
            const duration = performance.now() - startTime;
            
            // All combats should complete within reasonable time
            expect(duration).toBeLessThan(400); // 4 combats * 100ms limit
        });

        test('should maintain 60 FPS during combat resolution', () => {
            const frameTime = 1000 / 60; // ~16.67ms per frame
            const army1 = new MockArmy('army1', { id: 'player1' }, 100);
            const army2 = new MockArmy('army2', { id: 'player2' }, 90);

            const startTime = performance.now();
            combatEngine.resolveCombat(army1, army2, { x: 0, y: 0 }, 'grassland');
            const duration = performance.now() - startTime;

            // Combat should complete within single frame budget
            expect(duration).toBeLessThan(frameTime);
        });
    });
});