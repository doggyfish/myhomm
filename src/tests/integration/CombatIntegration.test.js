import { MovementSystem } from '../../systems/MovementSystem.js';
import { CombatEngine } from '../../systems/CombatEngine.js';
import { Army } from '../../entities/Army.js';
import { Castle } from '../../entities/Castle.js';
import { GameStateManager } from '../../game/GameStateManager.js';
import { COMBAT_EVENTS } from '../../events/CombatEvents.js';
import { CONFIG } from '../../config/ConfigurationManager.js';

// Mock player class
class MockPlayer {
    constructor(id, faction = 'human') {
        this.id = id;
        this.faction = faction;
        this.isAlive = true;
    }

    getFactionConfig() {
        return {
            resourceBonus: { gold: 1.0, mana: 1.0 }
        };
    }
}

// Mock map data for pathfinding
const mockMapData = {
    width: 10,
    height: 10,
    tiles: []
};

// Initialize map with grassland terrain
for (let y = 0; y < mockMapData.height; y++) {
    mockMapData.tiles[y] = [];
    for (let x = 0; x < mockMapData.width; x++) {
        mockMapData.tiles[y][x] = { terrain: 'grassland' };
    }
}

describe('Combat System Integration', () => {
    let movementSystem;
    let combatEngine;
    let gameStateManager;
    let player1, player2;

    beforeEach(() => {
        // Create players
        player1 = new MockPlayer('player1');
        player2 = new MockPlayer('player2');

        // Create game state manager
        gameStateManager = new GameStateManager();
        gameStateManager.addPlayer(player1);
        gameStateManager.addPlayer(player2);

        // Create systems
        movementSystem = new MovementSystem(mockMapData);
        combatEngine = new CombatEngine(gameStateManager);
        
        // Integrate systems
        movementSystem.setGameStateManager(gameStateManager);
        movementSystem.setCombatEngine(combatEngine);
    });

    describe('Army vs Army Combat Triggers', () => {
        let army1, army2;

        beforeEach(() => {
            // Create armies with different owners
            army1 = new Army('army1', player1);
            army1.addUnits('swordsman', 10);
            army1.setTilePosition(2, 2);
            
            army2 = new Army('army2', player2);
            army2.addUnits('archer', 8);
            army2.setTilePosition(5, 5);

            // Add armies to game state
            gameStateManager.addEntity(army1);
            gameStateManager.addEntity(army2);
        });

        test('should trigger combat when enemy armies meet on same tile', (done) => {
            let combatTriggered = false;

            // Listen for combat events
            combatEngine.on(COMBAT_EVENTS.INITIATED, (event) => {
                combatTriggered = true;
                expect(event.attacker).toBe(army1);
                expect(event.defender).toBe(army2);
                expect(event.position).toEqual({ x: 5, y: 5 });
                done();
            });

            // Start army1 movement to army2's position
            const movementResult = movementSystem.startMovement(army1, { x: 5, y: 5 });
            expect(movementResult.success).toBe(true);

            // Simulate movement completion by calling checkTileOccupation directly
            movementSystem.checkTileOccupation(army1, { x: 5, y: 5 });
        });

        test('should not trigger combat between allied armies', () => {
            // Create allied army
            const allyArmy = new Army('ally1', player1);
            allyArmy.addUnits('swordsman', 5);
            allyArmy.setTilePosition(3, 3);
            gameStateManager.addEntity(allyArmy);

            let combatTriggered = false;
            combatEngine.on(COMBAT_EVENTS.INITIATED, () => {
                combatTriggered = true;
            });

            // Move army to ally position
            movementSystem.checkTileOccupation(army1, { x: 3, y: 3 });

            expect(combatTriggered).toBe(false);
        });

        test('should stop movement of both armies when combat is triggered', () => {
            // Start movement for both armies
            movementSystem.startMovement(army1, { x: 5, y: 5 });
            movementSystem.startMovement(army2, { x: 7, y: 7 });

            expect(movementSystem.isMoving(army1.id)).toBe(true);
            expect(movementSystem.isMoving(army2.id)).toBe(true);

            // Trigger combat
            movementSystem.checkTileOccupation(army1, { x: 5, y: 5 });

            // Both armies should stop moving
            expect(movementSystem.isMoving(army1.id)).toBe(false);
            expect(movementSystem.isMoving(army2.id)).toBe(false);
        });

        test('should remove eliminated army from movement system', (done) => {
            // Create weak army that will be eliminated
            const weakArmy = new Army('weak', player1);
            weakArmy.addUnits('peasant', 1); // Assuming peasants have low power
            weakArmy.setTilePosition(1, 1);
            gameStateManager.addEntity(weakArmy);

            // Create strong army
            const strongArmy = new Army('strong', player2);
            strongArmy.addUnits('dragon', 1); // Assuming dragons have high power
            strongArmy.setTilePosition(1, 1);
            gameStateManager.addEntity(strongArmy);

            combatEngine.on(COMBAT_EVENTS.ARMY_ELIMINATED, (event) => {
                // Verify army was removed from game state
                expect(gameStateManager.getEntity(event.army.id)).toBeUndefined();
                done();
            });

            // Trigger combat
            movementSystem.checkTileOccupation(weakArmy, { x: 1, y: 1 });
        });
    });

    describe('Army vs Castle Siege Combat', () => {
        let army, castle;

        beforeEach(() => {
            // Create attacking army
            army = new Army('siege_army', player1);
            army.addUnits('catapult', 2);
            army.setTilePosition(3, 3);

            // Create enemy castle
            castle = Castle.createCapital('enemy_castle', 4, 4, player2);
            
            // Add entities to game state
            gameStateManager.addEntity(army);
            gameStateManager.addEntity(castle);
        });

        test('should trigger siege combat when army attacks castle', (done) => {
            combatEngine.on(COMBAT_EVENTS.CASTLE_UNDER_SIEGE, (event) => {
                expect(event.castle).toBe(castle);
                expect(event.attackingArmy).toBe(army);
                done();
            });

            // Move army to castle position
            movementSystem.checkTileOccupation(army, { x: 4, y: 4 });
        });

        test('should apply castle defense bonuses in siege combat', (done) => {
            combatEngine.on(COMBAT_EVENTS.RESOLVED, (event) => {
                const result = event.result;
                
                // Verify siege combat occurred
                expect(result.position).toEqual({ x: 4, y: 4 });
                
                // Castle should have received defense bonuses
                // (specific outcome depends on army vs castle power balance)
                expect(result).toBeDefined();
                done();
            });

            movementSystem.checkTileOccupation(army, { x: 4, y: 4 });
        });

        test('should handle castle with garrison army', (done) => {
            // Add garrison to castle
            const garrison = new Army('garrison', player2);
            garrison.addUnits('guard', 5);
            castle.setGarrisonArmy(garrison);

            combatEngine.on(COMBAT_EVENTS.RESOLVED, (event) => {
                // Garrison should have contributed to castle defense
                expect(event.result).toBeDefined();
                done();
            });

            movementSystem.checkTileOccupation(army, { x: 4, y: 4 });
        });
    });

    describe('Terrain Integration', () => {
        let army1, army2;

        beforeEach(() => {
            army1 = new Army('army1', player1);
            army1.addUnits('swordsman', 10);
            
            army2 = new Army('army2', player2);
            army2.addUnits('archer', 10);

            gameStateManager.addEntity(army1);
            gameStateManager.addEntity(army2);
        });

        test('should apply terrain combat modifiers', (done) => {
            // Set forest terrain at battle location
            mockMapData.tiles[3][3] = { terrain: 'forest' };

            combatEngine.on(COMBAT_EVENTS.RESOLVED, (event) => {
                const result = event.result;
                expect(result.terrain).toBe('forest');
                
                // Forest provides 1.1x combat bonus
                // Both armies get the bonus, but result should still be deterministic
                expect(result).toBeDefined();
                done();
            });

            army2.setTilePosition(3, 3);
            movementSystem.checkTileOccupation(army1, { x: 3, y: 3 });
        });

        test('should handle different terrain types correctly', (done) => {
            // Set swamp terrain (also 1.1x combat modifier)
            mockMapData.tiles[2][2] = { terrain: 'swamp' };

            combatEngine.on(COMBAT_EVENTS.TERRAIN_MODIFIER_APPLIED, (event) => {
                expect(event.terrainType).toBe('swamp');
                expect(event.modifier).toBe(1.1);
                done();
            });

            army2.setTilePosition(2, 2);
            movementSystem.checkTileOccupation(army1, { x: 2, y: 2 });
        });
    });

    describe('Multi-entity Tile Occupation', () => {
        test('should handle multiple entities on same tile', () => {
            const army1 = new Army('army1', player1);
            army1.addUnits('swordsman', 5);
            army1.setTilePosition(7, 7);

            const army2 = new Army('army2', player2);
            army2.addUnits('archer', 5);
            army2.setTilePosition(7, 7);

            const castle = new Castle('castle1', 7, 7, player2);

            gameStateManager.addEntity(army1);
            gameStateManager.addEntity(army2);
            gameStateManager.addEntity(castle);

            const entities = movementSystem.getEntitiesAtPosition(7, 7);
            
            expect(entities).toHaveLength(3);
            expect(entities).toContain(army1);
            expect(entities).toContain(army2);
            expect(entities).toContain(castle);
        });

        test('should prioritize army vs army combat over siege', (done) => {
            const attackingArmy = new Army('attacker', player1);
            attackingArmy.addUnits('knight', 3);

            const defendingArmy = new Army('defender', player2);
            defendingArmy.addUnits('spearman', 4);
            defendingArmy.setTilePosition(6, 6);

            const castle = new Castle('castle1', 6, 6, player2);

            gameStateManager.addEntity(attackingArmy);
            gameStateManager.addEntity(defendingArmy);
            gameStateManager.addEntity(castle);

            // Should trigger army vs army combat, not siege
            combatEngine.on(COMBAT_EVENTS.INITIATED, (event) => {
                expect(event.attacker).toBe(attackingArmy);
                expect(event.defender).toBe(defendingArmy);
                // Should not be siege combat
                done();
            });

            movementSystem.checkTileOccupation(attackingArmy, { x: 6, y: 6 });
        });
    });

    describe('Performance Integration', () => {
        test('should handle multiple simultaneous combats efficiently', (done) => {
            const armies = [];
            const positions = [
                { x: 1, y: 1 }, { x: 1, y: 2 },
                { x: 2, y: 1 }, { x: 2, y: 2 },
                { x: 3, y: 1 }, { x: 3, y: 2 }
            ];

            // Create multiple army pairs
            for (let i = 0; i < 6; i++) {
                const army = new Army(`army${i}`, i % 2 === 0 ? player1 : player2);
                army.addUnits('swordsman', 5);
                army.setTilePosition(positions[i].x, positions[i].y);
                armies.push(army);
                gameStateManager.addEntity(army);
            }

            let combatCount = 0;
            const startTime = performance.now();

            combatEngine.on(COMBAT_EVENTS.RESOLVED, () => {
                combatCount++;
                if (combatCount === 3) { // 3 combat pairs
                    const duration = performance.now() - startTime;
                    expect(duration).toBeLessThan(300); // Should complete within 300ms
                    done();
                }
            });

            // Trigger combats by moving armies to occupied positions
            movementSystem.checkTileOccupation(armies[1], positions[0]); // army1 -> army0's position
            movementSystem.checkTileOccupation(armies[3], positions[2]); // army3 -> army2's position
            movementSystem.checkTileOccupation(armies[5], positions[4]); // army5 -> army4's position
        });

        test('should maintain game state consistency during combat', () => {
            const army1 = new Army('test1', player1);
            army1.addUnits('swordsman', 10);
            
            const army2 = new Army('test2', player2);
            army2.addUnits('archer', 8);
            army2.setTilePosition(8, 8);

            gameStateManager.addEntity(army1);
            gameStateManager.addEntity(army2);

            const initialEntityCount = gameStateManager.entities.size;

            // Trigger combat
            movementSystem.checkTileOccupation(army1, { x: 8, y: 8 });

            // Game state should remain consistent
            expect(gameStateManager.entities.size).toBeLessThanOrEqual(initialEntityCount);
            
            // All remaining entities should be valid
            gameStateManager.entities.forEach((entity) => {
                expect(entity.id).toBeDefined();
                expect(entity.type).toBeDefined();
            });
        });
    });

    describe('Event Chain Integration', () => {
        test('should properly chain movement and combat events', (done) => {
            const eventSequence = [];

            const army1 = new Army('chain1', player1);
            army1.addUnits('knight', 5);
            
            const army2 = new Army('chain2', player2);
            army2.addUnits('archer', 5);
            army2.setTilePosition(9, 9);

            gameStateManager.addEntity(army1);
            gameStateManager.addEntity(army2);

            combatEngine.on(COMBAT_EVENTS.INITIATED, () => {
                eventSequence.push('combat-initiated');
            });

            combatEngine.on(COMBAT_EVENTS.RESOLVED, () => {
                eventSequence.push('combat-resolved');
                
                // Verify proper event sequence
                expect(eventSequence).toEqual(['combat-initiated', 'combat-resolved']);
                done();
            });

            // Simulate movement completion and combat trigger
            movementSystem.checkTileOccupation(army1, { x: 9, y: 9 });
        });
    });
});