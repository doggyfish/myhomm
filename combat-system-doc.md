# Combat System Documentation

## Combat Overview

The combat system resolves conflicts between armies and sieges against castles using a power-based calculation system. Combat emphasizes strategic army composition, positioning, and resource management over micro-management of individual units. Combat now integrates with the magic system by automatically triggering queued spells before normal combat resolution.

## Combat Flow with Magic Integration

### Updated Combat Resolution Order
1. **Pre-Combat Magic Phase**: Trigger all queued spells
2. **Apply Spell Effects**: Damage and modify armies
3. **Normal Combat Resolution**: Power-based calculation with modified values
4. **Post-Combat Cleanup**: Remove defeated armies, update UI

## Combat Types

### Army vs Army Combat

#### Basic Combat Resolution  (Both Sides Cast Spells)
```javascript
function resolveArmyVsArmyCombat(attackingArmy, defendingArmy) {
    console.log(`Combat initiated: ${attackingArmy.owner.name} vs ${defendingArmy.owner.name}`);
    
    // PHASE 1: PRE-COMBAT MAGIC
    const spellResults = triggerPreCombatSpells(attackingArmy, defendingArmy);
    
    // Check if either army was eliminated by spells
    if (attackingArmy.totalUnits <= 0 && defendingArmy.totalUnits <= 0) {
        return {
            winner: null,
            mutualDestruction: true,
            eliminatedArmies: [attackingArmy, defendingArmy],
            spellEffects: spellResults,
            combatPhase: 'mutual_magic_destruction'
        };
    }
    
    if (attackingArmy.totalUnits <= 0) {
        return {
            winner: defendingArmy.owner,
            survivingArmy: defendingArmy,
            loser: attackingArmy.owner,
            eliminatedArmy: attackingArmy,
            spellEffects: spellResults,
            combatPhase: 'magic_victory'
        };
    }
    
    if (army2.totalUnits <= 0) {
        return {
            winner: attackingArmy.owner,
            survivingArmy: attackingArmy,
            loser: defendingArmy.owner,
            eliminatedArmy: defendingArmy,
            spellEffects: spellResults,
            combatPhase: 'magic_victory'
        };
    }
    
    // PHASE 2: NORMAL COMBAT (after spell effects)
    const attackPower = calculateArmyPower(attackingArmy);
    const defensePower = calculateArmyPower(defendingArmy);
    
    // Apply terrain bonuses for defense
    const terrainBonus = getTerrainBonus(defendingArmy.position);
    const modifiedDefensePower = defensePower * (1 + terrainBonus);

    // Apply terrain bonuses for attack
    const attackBonus = getTerrainBonus(attackingArmy.position);
    const modifiedAttackPower = attackPower * (1 + attackBonus);
    
    // Combat resolution
    let combatResult;
    if (modifiedAttackPower > modifiedDefensePower) {
        // Attacker wins
        const remainingPower = attackPower - modifiedDefensePower;
        const survivorPercentage = remainingPower / attackPower;
        
        combatResult = {
            winner: attackingArmy.owner,
            survivingArmy: redistributePower(attackingArmy, survivorPercentage),
            loser: defendingArmy.owner,
            eliminatedArmy: defendingArmy
        };
    } else if (modifiedDefensePower > attackPower) {
        // Defender wins
        const remainingPower = modifiedDefensePower - attackPower;
        const survivorPercentage = remainingPower / modifiedDefensePower;
        
        combatResult = {
            winner: defendingArmy.owner,
            survivingArmy: redistributePower(defendingArmy, survivorPercentage),
            loser: attackingArmy.owner,
            eliminatedArmy: attackingArmy
        };
    } else {
        // Tie - both armies destroyed
        combatResult = {
            winner: null,
            mutualDestruction: true,
            eliminatedArmies: [attackingArmy, defendingArmy]
        };
    }

    // Combine spell and combat results
    return {
        ...combatResult,
        spellEffects: spellResults,
        army1FinalPower: modifiedArmy1Power,
        army2FinalPower: modifiedArmy2Power
    };
}
```
#### Pre-Combat Magic Phase
```javascript
function triggerPreCombatSpells(army1, army2) {
    const allSpellResults = {
        army1Effects: [],
        army2Effects: []
    };
    
    // Army 1 casts their queued spells at Army 2
    if (army1.owner.spellQueue && !army1.owner.spellQueue.isEmpty()) {
        console.log(`${army1.owner.name} casting ${army1.owner.spellQueue.queue.length} spells`);
        
        while (!army1.owner.spellQueue.isEmpty()) {
            const spell = army1.owner.spellQueue.getNextSpell();
            console.log(`${army1.owner.name} casts: ${spell.name}`);
            
            const combatContext = {
                casterArmy: army1,
                targetArmy: army2,
                enemyArmy: army2,
                combatType: 'army_vs_army'
            };
            
            try {
                const spellResult = spell.effect(combatContext);
                allSpellResults.army1Effects.push({
                    caster: army1.owner.name,
                    spellName: spell.name,
                    result: spellResult,
                    timestamp: Date.now()
                });
                
                // Apply spell damage to target (Army 2)
                applySpellDamage(spellResult, army2);
                
                if (spellResult.message) {
                    showGameMessage(`${army1.owner.name}: ${spellResult.message}`, 2000);
                }
                
            } catch (error) {
                console.error(`Error casting spell ${spell.name}:`, error);
            }
        }
    }
    
    // Army 2 casts their queued spells at Army 1
    if (army2.owner.spellQueue && !army2.owner.spellQueue.isEmpty()) {
        console.log(`${army2.owner.name} casting ${army2.owner.spellQueue.queue.length} spells`);
        
        while (!army2.owner.spellQueue.isEmpty()) {
            const spell = army2.owner.spellQueue.getNextSpell();
            console.log(`${army2.owner.name} casts: ${spell.name}`);
            
            const combatContext = {
                casterArmy: army2,
                targetArmy: army1,
                enemyArmy: army1,
                combatType: 'army_vs_army'
            };
            
            try {
                const spellResult = spell.effect(combatContext);
                allSpellResults.army2Effects.push({
                    caster: army2.owner.name,
                    spellName: spell.name,
                    result: spellResult,
                    timestamp: Date.now()
                });
                
                // Apply spell damage to target (Army 1)
                applySpellDamage(spellResult, army1);
                
                if (spellResult.message) {
                    showGameMessage(`${army2.owner.name}: ${spellResult.message}`, 2000);
                }
                
            } catch (error) {
                console.error(`Error casting spell ${spell.name}:`, error);
            }
        }
    }
    
    return allSpellResults;
}
```

#### Apply Spell Damage Function
```javascript
function applySpellDamage(spellResult, targetArmy) {
    if (spellResult.damage) {
        // Direct damage
        const damageDealt = Math.min(spellResult.damage, targetArmy.totalUnits);
        targetArmy.takeDamage(damageDealt);
        console.log(`Spell dealt ${damageDealt} damage to ${targetArmy.owner.name}'s army`);
    }
    
    if (spellResult.percentageDamage) {
        // Percentage-based damage
        const unitsToDestroy = Math.floor(targetArmy.totalUnits * spellResult.percentageDamage);
        targetArmy.removeUnits(unitsToDestroy);
        console.log(`Spell destroyed ${unitsToDestroy} units (${spellResult.percentageDamage * 100}% of army)`);
    }
    
    if (spellResult.areaEffect && spellResult.results) {
        // Area damage affects multiple targets
        spellResult.results.forEach(result => {
            if (result.target && result.damage) {
                const damageDealt = Math.min(result.damage, result.target.totalUnits);
                result.target.takeDamage(damageDealt);
                console.log(`Area spell dealt ${damageDealt} damage to ${result.target.owner.name}'s army`);
            }
        });
    }
    
    // Apply additional effects (slow, etc.)
    if (spellResult.additionalEffect && targetArmy.applyEffect) {
        targetArmy.applyEffect(spellResult.additionalEffect);
    }
}
```

#### Power Redistribution
When an army wins combat but takes casualties, the remaining power is distributed proportionally among surviving unit types:

```javascript
function redistributePower(army, survivorPercentage) {
    const newArmy = {
        units: {},
        totalPower: 0
    };
    
    // Calculate surviving units for each type
    for (const [unitType, count] of Object.entries(army.units)) {
        const survivingCount = Math.ceil(count * survivorPercentage);
        newArmy.units[unitType] = survivingCount;
        newArmy.totalPower += survivingCount * getUnitPower(unitType);
    }
    
    return newArmy;
}
```

### Army vs Castle Combat (Siege Warfare)

#### Siege Mechanics
```javascript
function resolveArmyVsCastleCombat(attackingArmy, targetCastle) {
    console.log(`Siege initiated: ${attackingArmy.owner.name} vs ${targetCastle.owner.name}'s castle`);
    
    // Castle should always have a garrison army
    if (!targetCastle.garrison) {
        console.error("Castle has no garrison army! This should not happen.");
        // Create emergency garrison if missing
        targetCastle.garrison = createEmergencyGarrison(targetCastle);
    }
    
    // PHASE 1: PRE-COMBAT MAGIC (BOTH SIDES CAST)
    const spellResults = triggerPreCombatSpells(attackingArmy, targetCastle.garrison);
    
    // Check if attacking army was eliminated by castle's defensive spells
    if (attackingArmy.totalUnits <= 0) {
        return {
            siegeSuccessful: false,
            attackerEliminated: true,
            spellEffects: spellResults,
            message: "Attacking army destroyed by castle's defensive magic!"
        };
    }

    // Check if garrison was eliminated by attacking spells
    if (targetCastle.garrison.totalUnits <= 0) {
        // Garrison destroyed, castle falls automatically
        return {
            siegeSuccessful: true,
            newOwner: attackingArmy.owner,
            survivingArmy: attackingArmy,
            eliminatedGarrison: targetCastle.garrison,
            spellEffects: spellResults,
            capturedResources: targetCastle.storedResources * 0.5,
            message: "Castle garrison destroyed by magic! Castle falls!"
        };
    }
    
    // PHASE 2: SIEGE COMBAT (after spell effects)
    // Calculate total castle defensive power
    const castleDefense = calculateCastleDefensePower(targetCastle);
    const attackPower = calculateArmyPower(attackingArmy);
    
    // Siege weapons provide bonus against castles
    const siegeBonus = calculateSiegeBonus(attackingArmy);
    const effectiveAttackPower = attackPower * (1 + siegeBonus);
    
    if (effectiveAttackPower > castleDefense) {
        // Successful siege
        const remainingPower = effectiveAttackPower - castleDefense;
        const survivorPercentage = remainingPower / effectiveAttackPower;
        
        return {
            siegeSuccessful: true,
            newOwner: attackingArmy.owner,
            survivingArmy: redistributePower(attackingArmy, survivorPercentage),
            castleDamage: calculateCastleDamage(targetCastle),
            capturedResources: targetCastle.storedResources * 0.5
        };
    } else {
        // Siege fails
        return {
            siegeSuccessful: false,
            spellEffects: spellResults,
            attackerEliminated: true,
            castleDamage: Math.min(castleDefense * 0.1, targetCastle.maxHealth * 0.2)
        };
    }
}
```

#### Castle Defense Calculation
```javascript
function calculateCastleDefensePower(castle) {
    let totalDefense = 0;
    
    // Base castle defensive value
    totalDefense += castle.baseDefense;
    
    // Wall defensive contribution
    totalDefense += castle.walls.currentHealth * castle.walls.defenseMultiplier;
    
    // Garrisoned army power (with defensive bonus)
    if (castle.garrison) {
        const garrisonPower = calculateArmyPower(castle.garrison);
        totalDefense += garrisonPower * 1.5; // 50% defensive bonus
    }
    
    // Defensive building bonuses
    castle.buildings.forEach(building => {
        if (building.type === 'defensive') {
            totalDefense += building.defensiveValue;
        }
    });
    
    // Faction-specific bonuses
    if (castle.owner.faction === 'human') {
        totalDefense *= 1.2; // Humans get 20% castle defense bonus
    }
    
    return totalDefense;
}
```

## Army Power Calculation

### Unit Power System
```javascript
const UnitStats = {
    // Basic Infantry
    swordsman: { power: 10, cost: 50, type: 'melee' },
    archer: { power: 8, cost: 60, type: 'ranged' },
    
    // Advanced Units
    knight: { power: 20, cost: 150, type: 'cavalry' },
    wizard: { power: 15, cost: 200, type: 'magic' },
    
    // Elite Units
    paladin: { power: 35, cost: 400, type: 'elite_melee' },
    archmage: { power: 30, cost: 500, type: 'elite_magic' },
    
    // Siege Units
    catapult: { power: 25, cost: 300, type: 'siege', siegeBonus: 2.0 },
    ballista: { power: 20, cost: 250, type: 'siege', siegeBonus: 1.5 }
};

function calculateArmyPower(army) {
    let totalPower = 0;
    
    // Sum power of all units
    for (const [unitType, count] of Object.entries(army.units)) {
        const unitPower = UnitStats[unitType].power;
        totalPower += unitPower * count;
    }
    
    // Apply army-wide modifiers
    // totalPower *= calculateMoraleMultiplier(army);
    //totalPower *= calculateExperienceMultiplier(army);
    //totalPower *= calculateSupplyMultiplier(army);
    
    return Math.round(totalPower);
}
```

### Enhanced Army Class with Spell Damage
Spell damage should be reducing x units from a type or reduct x power from a unit type
```javascript
// Add these methods to the Army class
Army.prototype.takePowerLossDamage = function(powerLossDamage, unit) {
    //round down to nearest unit. dmg 10 unit power 5 = 2 units lost. dmg 10 unit power 3 = 3 units lost.
    const unitsLost = roundDownToNearestUnit(powerLossDamage / unit.power); 
    this.removeUnits(unitsLost);
    
    return {
        damageDealt: unitsLost,
        unitsRemaining: this.totalUnits
    };
};


Army.prototype.takeUnitLossDamage = function(unitLossDamage) {
    const unitsLost = Math.min(unitLossDamage, this.totalUnits);
    this.removeUnits(unitsLost);
    
    return {
        damageDealt: unitsLost,
        unitsRemaining: this.totalUnits
    };
};

Army.prototype.removeUnits = function(unitsToRemove) {
    let remainingToRemove = unitsToRemove;
    
    // Remove units proportionally from each type
    const unitTypes = Object.keys(this.units);
    const totalUnits = this.getTotalUnits();
    
    unitTypes.forEach(unitType => {
        if (remainingToRemove > 0 && this.units[unitType] > 0) {
            const proportion = this.units[unitType] / totalUnits;
            const unitsToRemoveFromType = Math.min(
                Math.ceil(unitsToRemove * proportion),
                this.units[unitType],
                remainingToRemove
            );
            
            this.units[unitType] -= unitsToRemoveFromType;
            remainingToRemove -= unitsToRemoveFromType;
        }
    });
    
    // Update total units
    this.updateTotalUnits();
};

Army.prototype.getTotalUnits = function() {
    return Object.values(this.units).reduce((sum, count) => sum + count, 0);
};

Army.prototype.updateTotalUnits = function() {
    this.totalUnits = this.getTotalUnits();
};

Army.prototype.applyEffect = function(effect) {
    // Apply temporary effects like slow, etc.
    if (!this.temporaryEffects) {
        this.temporaryEffects = [];
    }
    
    this.temporaryEffects.push({
        type: effect,
        appliedAt: Date.now(),
        duration: 120000 // 2 minutes default
    });
};
```

### Combat Modifiers
currently there is none

## Terrain Combat Effects

### Defensive Terrain Bonuses
```javascript
const TerrainCombatModifiers = {
    grassland: { bonus: 0.0 },
    forest: { bonus: 0.25 },
    hills: { bonus: 0.2 },
    mountains: { bonus: 0.4 },
    swamp: { bonus: 0.15 },
    desert: { bonus: 0.0 },
    road: { bonus: 0.0 }
};

function getTerrainBonus(position) {
    const tile = map.getTile(position.x, position.y);
    return TerrainCombatModifiers[tile.type].bonus;
}
```

### Unit Type Terrain Interactions
To keep it simply, terrain only affects the unit's speed not power.

## Combat Animations and Feedback

### Visual Combat Resolution
```javascript
function playCombatAnimation(attacker, defender, result) {
    // Pre-combat positioning
    const combatScene = new CombatScene(attacker.position);
    combatScene.positionArmies(attacker, defender);
    
    // Combat sequence
    const sequence = [
        () => showChargeAnimation(attacker),
        () => showClashAnimation(attacker, defender),
        () => showCasualtiesAnimation(result.casualties),
        () => showResultAnimation(result.winner)
    ];
    
    // Execute animation sequence
    sequence.reduce((promise, animation) => {
        return promise.then(() => playAnimation(animation, 1000));
    }, Promise.resolve());
}
```

### Combat Log System
```javascript
const CombatLog = {
    entries: [],
    
    recordBattle: function(attacker, defender, result) {
        const logEntry = {
            timestamp: Date.now(),
            attackerName: attacker.owner.name,
            attackerPower: result.attackerPower,
            defenderName: defender.owner.name,
            defenderPower: result.defenderPower,
            winner: result.winner,
            location: attacker.position,
            spellsUsed: result.spellEffects ? result.spellEffects.length : 0,
            spellEffects: result.spellEffects || [],
            combatPhase: result.combatPhase || 'normal',
            casualties: result.casualties
        };
        
        this.entries.push(logEntry);
        this.displayRecentBattle(logEntry);
    },
    
    displayRecentBattle: function(entry) {
        let message = `${entry.attackerName} (${entry.attackerPower}) attacked ` +
                     `${entry.defenderName} (${entry.defenderPower}). `;
        
        if (entry.spellsUsed > 0) {
            message += `${entry.spellsUsed} spell(s) cast. `;
        }
        
        message += `Winner: ${entry.winner || 'Mutual destruction'}`;
       
        showGameMessage(message, 3000);

        // Log detailed spell effects
        if (entry.spellEffects.length > 0) {
            entry.spellEffects.forEach(spellEffect => {
                if (spellEffect.result && spellEffect.result.message) {
                    showGameMessage(`Spell: ${spellEffect.result.message}`, 2000);
                }
            });
        }
    }
};
```

## Advanced Combat Features

### Formation System
There is none 

### Siege Weapon Mechanics
```javascript
function calculateSiegeBonus(army) {
    let siegeBonus = 0;
    
    // Count siege weapons
    const catapults = army.units.catapult || 0;
    const ballistas = army.units.ballista || 0;
    
    // If amry has siege weapon, increase castle attack effectiveness
    if (catapults > 0) {
        siegeBonus = 0.5; // 50% bonus if has catapult
    }
    if (ballistas > 0) {
        siegeBonus += 0.25; // 25% bonus if has ballista
    }
      
    return siegeBonus;
}
```

### Combat Prediction System
```javascript
function predictCombatOutcome(attacker, defender) {
    const attackPower = calculateArmyPower(attacker);
    const defensePower = calculateArmyPower(defender);
    
    // Add randomness factor for realistic prediction
    const randomFactor = 0.1; // 10% variance
    const minAttack = attackPower * (1 - randomFactor);
    const maxAttack = attackPower * (1 + randomFactor);
    const minDefense = defensePower * (1 - randomFactor);
    const maxDefense = defensePower * (1 + randomFactor);
    
    const predictions = {
        attackerWinChance: 0,
        defenderWinChance: 0,
        mutualDestructionChance: 0,
        expectedCasualties: {
            attacker: 0,
            defender: 0
        }
    };
    
    // Monte Carlo simulation for prediction
    const simulations = 1000;
    for (let i = 0; i < simulations; i++) {
        const simAttack = Math.random() * (maxAttack - minAttack) + minAttack;
        const simDefense = Math.random() * (maxDefense - minDefense) + minDefense;
        
        if (simAttack > simDefense) {
            predictions.attackerWinChance++;
            predictions.expectedCasualties.attacker += (simDefense / simAttack);
        } else if (simDefense > simAttack) {
            predictions.defenderWinChance++;
            predictions.expectedCasualties.defender += (simAttack / simDefense);
        } else {
            predictions.mutualDestructionChance++;
            predictions.expectedCasualties.attacker += 1.0;
            predictions.expectedCasualties.defender += 1.0;
        }
    }
    
    // Convert to percentages
    predictions.attackerWinChance = (predictions.attackerWinChance / simulations) * 100;
    predictions.defenderWinChance = (predictions.defenderWinChance / simulations) * 100;
    predictions.mutualDestructionChance = (predictions.mutualDestructionChance / simulations) * 100;
    predictions.expectedCasualties.attacker = (predictions.expectedCasualties.attacker / simulations) * 100;
    predictions.expectedCasualties.defender = (predictions.expectedCasualties.defender / simulations) * 100;
    
    return predictions;
}
```

### Integration with Spell Queue System
### Combat Trigger
```javascript
// Update the main combat trigger function
function initiateCombat(attackingArmy, target) {
    let combatResult;
    
    if (target.type === 'castle') {
        combatResult = resolveArmyVsCastleCombat(attackingArmy, target);
    } else if (target.type === 'army') {
        combatResult = resolveArmyVsArmyCombat(attackingArmy, target);
    }
    
    // Record battle in combat log
    CombatLog.recordBattle(attackingArmy, target, combatResult);
    
    // Play combat animation with spell effects
    playCombatAnimationWithSpells(attackingArmy, target, combatResult);
    
    // Update spell queue UI (should be empty now)
    if (typeof SpellQueueUI !== 'undefined') {
        SpellQueueUI.updateQueue();
    }
    
    return combatResult;
}
```
### Combat Animation with Spell Effects
``` javascript
function playCombatAnimationWithSpells(attacker, defender, result) {
    const combatScene = new CombatScene(attacker.position);
    combatScene.positionArmies(attacker, defender);
    
    const sequence = [];
    
    // Add spell effect animations first
    if (result.spellEffects && result.spellEffects.length > 0) {
        result.spellEffects.forEach(spellEffect => {
            if (spellEffect.result) {
                sequence.push(() => showSpellAnimation(spellEffect.spellName, spellEffect.result));
            }
        });
    }
    
    // Add normal combat animations
    sequence.push(() => showChargeAnimation(attacker));
    sequence.push(() => showClashAnimation(attacker, defender));
    sequence.push(() => showCasualtiesAnimation(result.casualties));
    sequence.push(() => showResultAnimation(result.winner));
    
    // Execute animation sequence
    sequence.reduce((promise, animation) => {
        return promise.then(() => playAnimation(animation, 1000));
    }, Promise.resolve());
}

function showSpellAnimation(spellName, spellResult) {
    // Create spell-specific visual effects
    const spellAnimations = {
        'Fireball': () => createFireExplosion(spellResult.target.position),
        'Lightning Bolt': () => createLightningStrike(spellResult.target.position),
        'Ice Shard': () => createIceEffect(spellResult.target.position),
        'Meteor Strike': () => createMeteorImpact(spellResult.target.position),
        'Death Ray': () => createDeathRayBeam(spellResult.target.position)
    };
    
    const animation = spellAnimations[spellName];
    if (animation) {
        animation();
    } else {
        // Generic spell effect
        createGenericSpellEffect(spellResult.target.position);
    }
}
```

## Player/AI Spell Queue System

### Each Player Has Their Own Spell Queue
```javascript
// Each player (human or AI) has their own spell queue
class Player {
    constructor(id, name, isHuman = true) {
        this.id = id;
        this.name = name;
        this.isHuman = isHuman;
        this.resources = { mana: 100, gold: 100 };
        
        // Each player has their own spell systems
        this.spellLibrary = new SpellLibrary(this);
        this.spellQueue = new SpellQueue(this);
        
        // AI players also get automatic spell selection and purchasing
        if (!this.isHuman) {
            this.aiSpellManager = new AISpellManager(this);
        }
    }
}

// Individual spell queue for each player
class SpellQueue {
    constructor(owner) {
        this.owner = owner;
        this.queue = []; // FIFO queue
    }
    
    addSpell(spell) {
        this.queue.push({
            spell: spell,
            purchaseTime: Date.now()
        });
        console.log(`${this.owner.name} queued spell: ${spell.name}`);
    }
    
    getNextSpell() {
        if (this.queue.length > 0) {
            const nextSpell = this.queue.shift(); // Remove first spell (FIFO)
            return nextSpell.spell;
        }
        return null;
    }
    
    isEmpty() {
        return this.queue.length === 0;
    }
    
    clearQueue() {
        this.queue = [];
    }
}

// Individual spell library for each player
class SpellLibrary {
    constructor(owner) {
        this.owner = owner;
        this.knownSpells = [];
    }
    
    addSpell(spell) {
        if (!this.hasSpell(spell.name)) {
            this.knownSpells.push(spell);
            console.log(`${this.owner.name} learned spell: ${spell.name}`);
        }
    }
    
    hasSpell(spellName) {
        return this.knownSpells.some(spell => spell.name === spellName);
    }
    
    purchaseSpell(spellName) {
        const spell = this.knownSpells.find(s => s.name === spellName);
        if (!spell) return { success: false, reason: "Spell not known" };
        
        if (this.owner.resources.mana < spell.manaCost) {
            return { success: false, reason: "Insufficient mana" };
        }
        
        // Deduct mana cost
        this.owner.resources.mana -= spell.manaCost;
        
        if (spell.type === 'damage') {
            // Add to combat queue
            this.owner.spellQueue.addSpell(spell);
            return { success: true, message: `${spell.name} queued for combat` };
        } else if (spell.type === 'economic') {
            // Cast immediately
            const result = spell.effect();
            return { success: true, message: `${spell.name} cast immediately`, result: result };
        }
    }
}
```

### AI Spell Management
```javascript
class AISpellManager {
    constructor(aiPlayer) {
        this.aiPlayer = aiPlayer;
        this.lastSpellPurchase = 0;
        this.purchaseInterval = 30000; // AI considers buying spells every 30 seconds
    }
    
    update(currentTime) {
        if (currentTime - this.lastSpellPurchase >= this.purchaseInterval) {
            this.considerSpellPurchases();
            this.lastSpellPurchase = currentTime;
        }
    }
    
    considerSpellPurchases() {
        const availableSpells = this.aiPlayer.spellLibrary.knownSpells.filter(spell => 
            this.aiPlayer.resources.mana >= spell.manaCost
        );
        
        if (availableSpells.length === 0) return;
        
        // AI strategy: prefer damage spells if enemies nearby, economic spells otherwise
        const enemies = this.findNearbyEnemies();
        let preferredSpells;
        
        if (enemies.length > 0) {
            // Prioritize damage spells
            preferredSpells = availableSpells.filter(spell => spell.type === 'damage');
            if (preferredSpells.length === 0) preferredSpells = availableSpells;
        } else {
            // Prioritize economic spells
            preferredSpells = availableSpells.filter(spell => spell.type === 'economic');
            if (preferredSpells.length === 0) preferredSpells = availableSpells;
        }
        
        // Purchase a random spell from preferred list
        if (preferredSpells.length > 0) {
            const randomSpell = preferredSpells[Math.floor(Math.random() * preferredSpells.length)];
            const result = this.aiPlayer.spellLibrary.purchaseSpell(randomSpell.name);
            
            if (result.success) {
                console.log(`AI ${this.aiPlayer.name} purchased spell: ${randomSpell.name}`);
            }
        }
    }
    
    findNearbyEnemies() {
        // Simple AI logic to find enemies within reasonable range
        const myArmies = game.armies.filter(army => army.owner === this.aiPlayer);
        const enemyArmies = game.armies.filter(army => army.owner !== this.aiPlayer);
        
        const nearbyEnemies = [];
        myArmies.forEach(myArmy => {
            enemyArmies.forEach(enemyArmy => {
                const distance = calculateDistance(myArmy.position, enemyArmy.position);
                if (distance <= 10) { // Within 10 tiles
                    nearbyEnemies.push(enemyArmy);
                }
            });
        });
        
        return nearbyEnemies;
    }
}
```

### Updated Game Loop Integration
```javascript
// In your main game loop or army movement handler
function handleArmyReachesTarget(army, target) {
    // Existing code...
    
    if (target.type === 'enemy_army' || target.type === 'enemy_castle') {
        // Check if player has queued spells before combat
        if (army.owner.isHuman && !SpellQueue.isEmpty()) {
            showNotification(`Combat starting with ${SpellQueue.queue.length} queued spells!`, 'info');
        }
        
        // Initiate combat (which now includes spell resolution)
        const combatResult = initiateCombat(army, target);
        
        // Handle post-combat results
        handleCombatResults(combatResult);
    }
    
    // Rest of existing code...
}
```

This updated combat system now:

1. **Automatically triggers all queued spells** before normal combat
2. **Applies spell damage immediately** to modify army strengths
3. **Continues with normal combat** using the modified values
4. **Logs both spell and combat effects** for player feedback
5. **Empties the spell queue** after each combat encounter
6. **Provides rich visual feedback** for both spells and combat

The system maintains the simple "buy spell → auto-trigger in combat" flow while providing detailed feedback about what happened during the battle!