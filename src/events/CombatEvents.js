/**
 * Combat Events - Event definitions and interfaces for combat system
 */

/**
 * Combat result interface for battle outcomes
 */
export class CombatResult {
    constructor({
        winner = null,
        loser = null,
        remainingPower = 0,
        attackerLosses = 0,
        defenderLosses = 0,
        terrain = null,
        spellEffectsApplied = [],
        draw = false,
        position = { x: 0, y: 0 }
    } = {}) {
        this.winner = winner;
        this.loser = loser;
        this.remainingPower = remainingPower;
        this.attackerLosses = attackerLosses;
        this.defenderLosses = defenderLosses;
        this.terrain = terrain;
        this.spellEffectsApplied = spellEffectsApplied;
        this.draw = draw;
        this.position = position;
        this.timestamp = Date.now();
    }
}

/**
 * Combat participant interface for entities in battle
 */
export class CombatParticipant {
    constructor({
        entity,
        basePower = 0,
        modifiedPower = 0,
        position = { x: 0, y: 0 },
        spellEffects = []
    } = {}) {
        this.entity = entity;
        this.basePower = basePower;
        this.modifiedPower = modifiedPower;
        this.position = position;
        this.spellEffects = spellEffects;
    }
}

/**
 * Spell effect interface for combat modifications
 */
export class SpellEffect {
    constructor({
        id,
        name,
        type = 'damage', // 'damage', 'heal', 'buff', 'debuff'
        value = 0,
        duration = 0,
        target = 'attacker' // 'attacker', 'defender', 'both'
    } = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.value = value;
        this.duration = duration;
        this.target = target;
    }
}

/**
 * Combat event types for the event system
 */
export const COMBAT_EVENTS = {
    // Combat lifecycle events
    INITIATED: 'combat:initiated',
    RESOLVED: 'combat:resolved',
    
    // Entity events
    ARMY_ELIMINATED: 'army:eliminated',
    CASTLE_UNDER_SIEGE: 'castle:under-siege',
    
    // Movement integration events
    TILE_OCCUPIED: 'movement:tile-occupied',
    
    // Spell events
    SPELL_CAST: 'spell:cast',
    
    // Combat calculation events
    POWER_CALCULATED: 'combat:power-calculated',
    TERRAIN_MODIFIER_APPLIED: 'combat:terrain-modifier-applied',
    SPELL_EFFECTS_APPLIED: 'combat:spell-effects-applied'
};

/**
 * Combat event data structures
 */
export class CombatInitiatedEvent {
    constructor(attacker, defender, position, terrain) {
        this.type = COMBAT_EVENTS.INITIATED;
        this.attacker = attacker;
        this.defender = defender;
        this.position = position;
        this.terrain = terrain;
        this.timestamp = Date.now();
    }
}

export class CombatResolvedEvent {
    constructor(combatResult) {
        this.type = COMBAT_EVENTS.RESOLVED;
        this.result = combatResult;
        this.timestamp = Date.now();
    }
}

export class ArmyEliminatedEvent {
    constructor(army, position, cause = 'combat') {
        this.type = COMBAT_EVENTS.ARMY_ELIMINATED;
        this.army = army;
        this.position = position;
        this.cause = cause;
        this.timestamp = Date.now();
    }
}

export class CastleUnderSiegeEvent {
    constructor(castle, attackingArmy, position) {
        this.type = COMBAT_EVENTS.CASTLE_UNDER_SIEGE;
        this.castle = castle;
        this.attackingArmy = attackingArmy;
        this.position = position;
        this.timestamp = Date.now();
    }
}

/**
 * Combat notification levels for UI display
 */
export const COMBAT_NOTIFICATION_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical'
};

/**
 * Combat notification for UI feedback
 */
export class CombatNotification {
    constructor({
        level = COMBAT_NOTIFICATION_LEVELS.INFO,
        title = '',
        message = '',
        result = null,
        position = { x: 0, y: 0 },
        duration = 3000
    } = {}) {
        this.level = level;
        this.title = title;
        this.message = message;
        this.result = result;
        this.position = position;
        this.duration = duration;
        this.timestamp = Date.now();
    }
}