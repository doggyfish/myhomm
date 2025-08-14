import { EventEmitter } from 'events';
import { CONFIG } from '../config/ConfigurationManager.js';
import { TERRAIN_CONFIG } from '../config/TerrainConfig.js';
import { 
    CombatResult, 
    CombatParticipant, 
    COMBAT_EVENTS,
    CombatInitiatedEvent,
    CombatResolvedEvent,
    ArmyEliminatedEvent,
    CastleUnderSiegeEvent
} from '../events/CombatEvents.js';

/**
 * CombatEngine - Handles combat resolution with power calculations
 * Implements event-driven architecture for combat notifications
 * Implements IPausableSystem for comprehensive pause support
 */
export class CombatEngine extends EventEmitter {
    constructor(gameStateManager) {
        super();
        this.gameState = gameStateManager;
        
        // Pause state management
        this.isPausedState = false;
        this.pauseStartTime = 0;
    }

    /**
     * Resolve combat between two entities
     * @param {Entity} attacker - The attacking entity
     * @param {Entity} defender - The defending entity  
     * @param {Object} position - {x, y} battlefield position
     * @param {string} terrainType - Type of terrain for combat
     * @returns {CombatResult} The combat resolution result
     */
    resolveCombat(attacker, defender, position, terrainType) {
        const startTime = performance.now();
        
        // Emit combat initiated event
        const initiatedEvent = new CombatInitiatedEvent(attacker, defender, position, terrainType);
        this.emit(COMBAT_EVENTS.INITIATED, initiatedEvent);

        // Check if this is a castle siege
        const isSiege = defender.type === 'castle';
        if (isSiege) {
            const siegeEvent = new CastleUnderSiegeEvent(defender, attacker, position);
            this.emit(COMBAT_EVENTS.CASTLE_UNDER_SIEGE, siegeEvent);
        }

        // Create combat participants
        const attackerParticipant = this.createCombatParticipant(attacker, position, terrainType, 'attacker');
        const defenderParticipant = this.createCombatParticipant(defender, position, terrainType, 'defender');

        // Apply spell effects before combat
        this.applySpellEffects(attackerParticipant, defenderParticipant);

        // Calculate final combat powers
        const attackerPower = attackerParticipant.modifiedPower;
        const defenderPower = defenderParticipant.modifiedPower;

        // Resolve combat outcome
        const result = this.calculateCombatOutcome(
            attackerParticipant, 
            defenderParticipant, 
            terrainType, 
            position
        );

        // Update entity states based on result
        this.applyResult(result, attacker, defender);

        // Record combat in history
        this.recordCombatHistory(result, attacker, defender);

        // Emit combat resolved event
        const resolvedEvent = new CombatResolvedEvent(result);
        this.emit(COMBAT_EVENTS.RESOLVED, resolvedEvent);

        // Verify performance requirement (<100ms)
        const duration = performance.now() - startTime;
        if (duration > 100) {
            console.warn(`Combat resolution took ${duration}ms (exceeds 100ms requirement)`);
        }

        return result;
    }

    /**
     * Create combat participant with power calculations
     */
    createCombatParticipant(entity, position, terrainType, role) {
        let combatComponent = entity.getComponent('combat');
        let basePower = 0;

        // Handle castles differently - they use DefenseComponent
        if (entity.type === 'castle') {
            basePower = entity.getTotalDefensePower ? entity.getTotalDefensePower() : 0;
        } else {
            if (!combatComponent) {
                throw new Error(`Entity ${entity.id} missing CombatComponent for combat`);
            }
            basePower = combatComponent.power;
        }

        let modifiedPower = basePower;

        // Apply terrain modifiers
        modifiedPower = this.applyTerrainModifiers(modifiedPower, terrainType);

        // Apply castle defense bonuses if defending
        if (role === 'defender' && entity.type === 'castle') {
            modifiedPower = this.applyCastleDefenseBonus(entity, modifiedPower);
        }

        // Get spell effects from entity
        const spellEffects = this.getSpellEffects(entity);

        return new CombatParticipant({
            entity,
            basePower,
            modifiedPower,
            position,
            spellEffects
        });
    }

    /**
     * Apply terrain combat modifiers
     */
    applyTerrainModifiers(power, terrainType) {
        const terrain = TERRAIN_CONFIG[terrainType];
        if (!terrain) {
            console.warn(`Unknown terrain type: ${terrainType}, using no modifier`);
            return power;
        }

        const modifier = terrain.combatModifier || 1.0;
        const modifiedPower = power * modifier;

        // Emit terrain modifier event
        this.emit(COMBAT_EVENTS.TERRAIN_MODIFIER_APPLIED, {
            terrainType,
            modifier,
            originalPower: power,
            modifiedPower
        });

        return modifiedPower;
    }

    /**
     * Apply castle defense bonuses for siege combat
     */
    applyCastleDefenseBonus(castle, basePower) {
        let totalPower = basePower;

        // Apply base castle defense multiplier
        const castleMultiplier = CONFIG.get('combat.castleDefenseMultiplier');
        totalPower *= castleMultiplier;

        // Add garrison power if present
        if (castle.garrisonArmy) {
            const garrisonCombat = castle.garrisonArmy.getComponent('combat');
            if (garrisonCombat) {
                totalPower += garrisonCombat.power;
            }
        }

        // Add building defense bonuses
        const defenseComponent = castle.getComponent('defense');
        if (defenseComponent) {
            const buildingDefenseBonus = this.calculateBuildingDefenseBonus(castle);
            totalPower += buildingDefenseBonus;
        }

        return totalPower;
    }

    /**
     * Calculate building defense bonus from castle buildings
     */
    calculateBuildingDefenseBonus(castle) {
        let bonus = 0;
        
        for (const building of castle.buildings) {
            const buildingComponent = building.getComponent('defense');
            if (buildingComponent) {
                bonus += buildingComponent.power;
            }
        }

        return bonus;
    }

    /**
     * Get active spell effects for an entity
     */
    getSpellEffects(entity) {
        // Check if entity has spell queue (for armies)
        if (entity.spellQueue && entity.spellQueue.length > 0) {
            return entity.spellQueue.slice(); // Return copy
        }
        
        return [];
    }

    /**
     * Apply spell effects before combat resolution
     */
    applySpellEffects(attackerParticipant, defenderParticipant) {
        const appliedEffects = [];

        // Apply attacker's spell effects
        for (const spellEffect of attackerParticipant.spellEffects) {
            this.applySingleSpellEffect(spellEffect, attackerParticipant, defenderParticipant);
            appliedEffects.push(spellEffect.name);
        }

        // Apply defender's spell effects  
        for (const spellEffect of defenderParticipant.spellEffects) {
            this.applySingleSpellEffect(spellEffect, defenderParticipant, attackerParticipant);
            appliedEffects.push(spellEffect.name);
        }

        // Emit spell effects applied event
        if (appliedEffects.length > 0) {
            this.emit(COMBAT_EVENTS.SPELL_EFFECTS_APPLIED, {
                effects: appliedEffects,
                attacker: attackerParticipant.entity.id,
                defender: defenderParticipant.entity.id
            });
        }
    }

    /**
     * Apply a single spell effect to combat participants
     */
    applySingleSpellEffect(spellEffect, caster, target) {
        const spellMultiplier = CONFIG.get('combat.spellDamageMultiplier');

        switch (spellEffect.type) {
            case 'damage':
                if (spellEffect.target === 'attacker' || spellEffect.target === 'both') {
                    target.modifiedPower -= spellEffect.value * spellMultiplier;
                }
                break;
            case 'heal':
                if (spellEffect.target === 'defender' || spellEffect.target === 'both') {
                    caster.modifiedPower += spellEffect.value * spellMultiplier;
                }
                break;
            case 'buff':
                caster.modifiedPower *= (1 + spellEffect.value);
                break;
            case 'debuff':
                target.modifiedPower *= (1 - spellEffect.value);
                break;
        }

        // Ensure power doesn't go below 0
        caster.modifiedPower = Math.max(0, caster.modifiedPower);
        target.modifiedPower = Math.max(0, target.modifiedPower);
    }

    /**
     * Calculate final combat outcome
     */
    calculateCombatOutcome(attackerParticipant, defenderParticipant, terrainType, position) {
        const attackerPower = attackerParticipant.modifiedPower;
        const defenderPower = defenderParticipant.modifiedPower;

        let winner = null;
        let loser = null;
        let remainingPower = 0;
        let attackerLosses = 0;
        let defenderLosses = 0;
        let draw = false;

        // Calculate losses as percentage of power difference
        const powerDifference = Math.abs(attackerPower - defenderPower);
        const totalPower = attackerPower + defenderPower;

        if (attackerPower > defenderPower) {
            winner = attackerParticipant.entity;
            loser = defenderParticipant.entity;
            remainingPower = attackerPower - defenderPower;
            
            // Calculate losses (defender takes more damage)
            defenderLosses = defenderPower; // Defender eliminated
            attackerLosses = Math.min(attackerPower * 0.3, defenderPower * 0.5);
        } else if (defenderPower > attackerPower) {
            winner = defenderParticipant.entity;
            loser = attackerParticipant.entity;
            remainingPower = defenderPower - attackerPower;
            
            // Calculate losses (attacker takes more damage)
            attackerLosses = attackerPower; // Attacker eliminated
            defenderLosses = Math.min(defenderPower * 0.3, attackerPower * 0.5);
        } else {
            // Draw - both sides take heavy losses
            draw = true;
            attackerLosses = attackerPower * 0.8;
            defenderLosses = defenderPower * 0.8;
        }

        // Collect spell effects that were applied
        const allSpellEffects = [
            ...attackerParticipant.spellEffects,
            ...defenderParticipant.spellEffects
        ].map(effect => effect.name);

        return new CombatResult({
            winner,
            loser,
            remainingPower,
            attackerLosses,
            defenderLosses,
            terrain: terrainType,
            spellEffectsApplied: allSpellEffects,
            draw,
            position
        });
    }

    /**
     * Apply combat result to entities
     */
    applyResult(result, attacker, defender) {
        // Update attacker
        const attackerCombat = attacker.getComponent('combat');
        if (attackerCombat) {
            const newAttackerPower = Math.max(0, attackerCombat.power - result.attackerLosses);
            attackerCombat.updatePower(newAttackerPower);
        }

        // Update defender
        const defenderCombat = defender.getComponent('combat');
        if (defenderCombat) {
            const newDefenderPower = Math.max(0, defenderCombat.power - result.defenderLosses);
            defenderCombat.updatePower(newDefenderPower);
        }

        // Handle eliminated entities
        if (result.loser) {
            const loserCombat = result.loser.getComponent('combat');
            if (loserCombat && loserCombat.power === 0) {
                // Emit army elimination event
                const eliminatedEvent = new ArmyEliminatedEvent(result.loser, result.position);
                this.emit(COMBAT_EVENTS.ARMY_ELIMINATED, eliminatedEvent);

                // Remove from game state if it's an army
                if (result.loser.type === 'army') {
                    this.gameState.removeArmy(result.loser.id);
                }
            }
        }

        // Clear spell queues after combat
        if (attacker.spellQueue) {
            attacker.spellQueue = [];
        }
        if (defender.spellQueue) {
            defender.spellQueue = [];
        }
    }

    /**
     * Record combat in entity combat history
     */
    recordCombatHistory(result, attacker, defender) {
        // Record in attacker's history
        const attackerCombat = attacker.getComponent('combat');
        if (attackerCombat) {
            attackerCombat.addCombatToHistory(result);
        }

        // Record in defender's history
        const defenderCombat = defender.getComponent('combat');
        if (defenderCombat) {
            defenderCombat.addCombatToHistory(result);
        }
    }

    /**
     * Check if two entities can engage in combat
     */
    canCombat(entity1, entity2) {
        // Must be different owners
        if (entity1.owner?.id === entity2.owner?.id) {
            return false;
        }

        // Check combat capability for each entity
        const canFight1 = this.canEntityFight(entity1);
        const canFight2 = this.canEntityFight(entity2);

        return canFight1 && canFight2;
    }

    /**
     * Check if an individual entity can fight
     */
    canEntityFight(entity) {
        if (entity.type === 'castle') {
            // Castles can always defend if they have defense power
            return entity.getTotalDefensePower ? entity.getTotalDefensePower() > 0 : false;
        } else {
            // Armies need combat component with power > 0
            const combat = entity.getComponent('combat');
            return combat ? combat.power > 0 : false;
        }
    }

    /**
     * Get combat prediction without resolving
     */
    predictCombat(attacker, defender, position, terrainType) {
        // Create temporary participants for prediction
        const attackerParticipant = this.createCombatParticipant(attacker, position, terrainType, 'attacker');
        const defenderParticipant = this.createCombatParticipant(defender, position, terrainType, 'defender');

        // Apply spell effects
        this.applySpellEffects(attackerParticipant, defenderParticipant);

        // Calculate outcome without applying
        return this.calculateCombatOutcome(attackerParticipant, defenderParticipant, terrainType, position);
    }

    // IPausableSystem implementation

    /**
     * Pause the combat engine
     */
    pause() {
        this.isPausedState = true;
        this.pauseStartTime = Date.now();
    }

    /**
     * Unpause the combat engine
     */
    unpause() {
        if (this.isPausedState) {
            this.isPausedState = false;
            this.pauseStartTime = 0;
        }
    }

    /**
     * Check if combat engine is paused
     * @returns {boolean} True if paused
     */
    isPaused() {
        return this.isPausedState || false;
    }

    /**
     * Get combat engine state for pause preservation
     * @returns {object} Current state
     */
    getState() {
        return {
            isPaused: this.isPausedState || false,
            pauseStartTime: this.pauseStartTime || 0
        };
    }

    /**
     * Set combat engine state for pause restoration
     * @param {object} state State to restore
     */
    setState(state) {
        if (state && typeof state === 'object') {
            this.isPausedState = state.isPaused || false;
            this.pauseStartTime = state.pauseStartTime || 0;
        }
    }
}