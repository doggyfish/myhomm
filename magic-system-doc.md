# Simplified Magic System Documentation

## Magic System Overview

The magic system uses a simple rogue-like selection mechanism where players periodically choose spells to add to their library. Once learned, spells can be purchased with mana and either cast immediately (economic spells) or queued for automatic use during combat (damage spells).

## Core Magic Mechanics

### Rogue-like Spell Selection
```javascript
const MagicSelectionSystem = {
    selectionInterval: 180000, // 3 minutes
    lastSelectionTime: 0,
    
    update: function(currentTime) {
        if (currentTime - this.lastSelectionTime >= this.selectionInterval) {
            this.triggerSpellSelection();
            this.lastSelectionTime = currentTime;
        }
    },
    
    triggerSpellSelection: function() {
        const spellChoices = this.generateThreeRandomSpells();
        this.showSelectionUI(spellChoices);
        game.pause(); // Pause game during selection
    },
    
    generateThreeRandomSpells: function() {
        const allSpells = [...DamageSpells, ...EconomicSpells];
        const availableSpells = allSpells.filter(spell => 
            !SpellLibrary.hasSpell(spell.name) // Don't offer already known spells
        );
        
        // Randomly select 3 different spells
        const selected = [];
        for (let i = 0; i < 3 && availableSpells.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableSpells.length);
            selected.push(availableSpells.splice(randomIndex, 1)[0]);
        }
        
        return selected;
    }
};
```

### Spell Library System
```javascript
const SpellLibrary = {
    knownSpells: [],
    
    addSpell: function(spell) {
        if (!this.hasSpell(spell.name)) {
            this.knownSpells.push(spell);
            this.updateLibraryUI();
            showNotification(`Learned new spell: ${spell.name}`, 'success');
        }
    },
    
    hasSpell: function(spellName) {
        return this.knownSpells.some(spell => spell.name === spellName);
    },
    
    getSpell: function(spellName) {
        return this.knownSpells.find(spell => spell.name === spellName);
    },
    
    purchaseSpell: function(spellName) {
        const spell = this.getSpell(spellName);
        if (!spell) return { success: false, reason: "Spell not known" };
        
        if (player.resources.mana < spell.manaCost) {
            return { success: false, reason: "Insufficient mana" };
        }
        
        // Deduct mana cost
        player.resources.mana -= spell.manaCost;
        
        if (spell.type === 'damage') {
            // Add to combat queue
            SpellQueue.addSpell(spell);
            return { success: true, message: `${spell.name} added to combat queue` };
        } else if (spell.type === 'economic') {
            // Cast immediately
            const result = spell.effect();
            return { success: true, message: `${spell.name} cast immediately`, result: result };
        }
    }
};
```

### Spell Queue System (Combat Spells Only)
```javascript
const SpellQueue = {
    queue: [], // First In, First Out
    
    addSpell: function(spell) {
        this.queue.push({
            spell: spell,
            purchaseTime: Date.now()
        });
        this.updateQueueUI();
    },
    
    getNextSpell: function() {
        if (this.queue.length > 0) {
            const nextSpell = this.queue.shift(); // Remove first spell (FIFO)
            this.updateQueueUI();
            return nextSpell.spell;
        }
        return null;
    },
    
    isEmpty: function() {
        return this.queue.length === 0;
    },
    
    clearQueue: function() {
        this.queue = [];
        this.updateQueueUI();
    },
    
    // Automatically triggered during combat
    triggerNextSpell: function(combatContext) {
        const spell = this.getNextSpell();
        if (spell) {
            console.log(`Auto-casting queued spell: ${spell.name}`);
            return spell.effect(combatContext);
        }
        return null;
    }
};
```

## Spell Categories

### Damage Spells (Auto-queue for Combat)
```javascript
const DamageSpells = [
    {
        name: "Fireball",
        type: "damage",
        manaCost: 30,
        rarity: "common",
        description: "Deals 50-80 fire damage to enemy army",
        effect: function(combatContext) {
            const damage = Math.random() * 30 + 50;
            const target = combatContext.enemyArmy;
            
            return {
                damage: damage,
                target: target,
                message: `Fireball deals ${Math.round(damage)} damage!`
            };
        }
    },
    
    {
        name: "Lightning Bolt",
        type: "damage", 
        manaCost: 25,
        rarity: "common",
        description: "Quick lightning strike for 40-60 damage",
        effect: function(combatContext) {
            const damage = Math.random() * 20 + 40;
            const target = combatContext.enemyArmy;
            
            return {
                damage: damage,
                target: target,
                message: `Lightning strikes for ${Math.round(damage)} damage!`
            };
        }
    },
    
    {
        name: "Ice Shard",
        type: "damage",
        manaCost: 35,
        rarity: "common", 
        description: "Ice projectile dealing 60-90 damage and slowing enemy",
        effect: function(combatContext) {
            const damage = Math.random() * 30 + 60;
            const target = combatContext.enemyArmy;
            
            // Apply slow effect
            target.movementPenalty = 0.5;
            target.slowDuration = 120000; // 2 minutes
            
            return {
                damage: damage,
                target: target,
                additionalEffect: "Enemy slowed by 50%",
                message: `Ice shard deals ${Math.round(damage)} damage and slows the enemy!`
            };
        }
    },
    
    {
        name: "Meteor Strike",
        type: "damage",
        manaCost: 80,
        rarity: "rare",
        description: "Massive area damage: 100-150 to all enemy armies in combat",
        effect: function(combatContext) {
            const damage = Math.random() * 50 + 100;
            const allEnemies = combatContext.allEnemyArmies || [combatContext.enemyArmy];
            
            const results = allEnemies.map(enemy => ({
                damage: damage,
                target: enemy
            }));
            
            return {
                areaEffect: true,
                results: results,
                message: `Meteor devastates the battlefield for ${Math.round(damage)} area damage!`
            };
        }
    },
    
    {
        name: "Death Ray",
        type: "damage",
        manaCost: 120,
        rarity: "epic",
        description: "Instantly destroy 25% of enemy army units",
        effect: function(combatContext) {
            const target = combatContext.enemyArmy;
            const unitsDestroyed = Math.floor(target.totalUnits * 0.25);
            
            return {
                percentageDamage: 0.25,
                unitsDestroyed: unitsDestroyed,
                target: target,
                message: `Death ray annihilates ${unitsDestroyed} enemy units!`
            };
        }
    }
];
```

### Economic Spells (Cast Immediately)
```javascript
const EconomicSpells = [
    {
        name: "Transmute Gold",
        type: "economic",
        manaCost: 20,
        rarity: "common",
        description: "Instantly gain 200-300 gold",
        effect: function() {
            const goldGained = Math.random() * 100 + 200;
            player.resources.gold += goldGained;
            
            return {
                goldGained: Math.round(goldGained),
                message: `Gained ${Math.round(goldGained)} gold through transmutation!`
            };
        }
    },
    
    {
        name: "Resource Blessing",
        type: "economic",
        manaCost: 40,
        rarity: "uncommon",
        description: "All castles produce 2x resources for 5 minutes",
        effect: function() {
            player.castles.forEach(castle => {
                castle.resourceMultiplier = 2.0;
                castle.bonusEndTime = Date.now() + 300000; // 5 minutes
            });
            
            return {
                castlesAffected: player.castles.length,
                duration: 300000,
                message: "All castles blessed with double production for 5 minutes!"
            };
        }
    },
    
    {
        name: "Instant Construction",
        type: "economic",
        manaCost: 60,
        rarity: "uncommon",
        description: "Complete one building construction immediately",
        effect: function() {
            // Find first castle with building under construction
            const castlesWithConstruction = player.castles.filter(castle => 
                castle.constructionQueue.length > 0
            );
            
            if (castlesWithConstruction.length > 0) {
                const castle = castlesWithConstruction[0];
                const building = castle.constructionQueue.shift();
                castle.buildings.push(building);
                
                return {
                    buildingCompleted: building.name,
                    castle: castle,
                    message: `${building.name} construction completed instantly!`
                };
            } else {
                return {
                    message: "No buildings under construction to complete"
                };
            }
        }
    },
    
    {
        name: "Mass Production",
        type: "economic",
        manaCost: 80,
        rarity: "rare",
        description: "Instantly produce 20 units at each castle",
        effect: function() {
            let totalUnitsProduced = 0;
            
            player.castles.forEach(castle => {
                castle.addUnitsToGarrison(20);
                totalUnitsProduced += 20;
            });
            
            return {
                unitsProduced: totalUnitsProduced,
                castlesAffected: player.castles.length,
                message: `Mass production created ${totalUnitsProduced} units across all castles!`
            };
        }
    },
    
    {
        name: "Economic Miracle",
        type: "economic",
        manaCost: 150,
        rarity: "legendary",
        description: "Gain massive resources: 2000 gold, 500 wood, 300 stone",
        effect: function() {
            player.resources.gold += 2000;
            player.resources.wood += 500;
            player.resources.stone += 300;
            
            return {
                resourcesGained: {
                    gold: 2000,
                    wood: 500, 
                    stone: 300
                },
                message: "Economic miracle grants massive resources!"
            };
        }
    }
];
```

## Combat Integration

### Automatic Spell Casting During Combat
Combat system should trigger queued spells automatically when combat starts. 

## User Interface Systems

### Spell Selection UI
```javascript
const SpellSelectionUI = {
    showSelectionModal: function(spellChoices) {
        const modal = document.createElement('div');
        modal.className = 'spell-selection-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Choose a Spell to Learn</h2>
                <div class="spell-choices">
                    ${spellChoices.map((spell, index) => `
                        <div class="spell-choice" onclick="selectSpell(${index})">
                            <h3>${spell.name}</h3>
                            <div class="spell-type">${spell.type.toUpperCase()}</div>
                            <div class="mana-cost">${spell.manaCost} mana</div>
                            <div class="rarity ${spell.rarity}">${spell.rarity.toUpperCase()}</div>
                            <p class="description">${spell.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add selection handlers
        window.selectSpell = (index) => {
            SpellLibrary.addSpell(spellChoices[index]);
            document.body.removeChild(modal);
            game.resume();
        };
    }
};
```

### Spell Library UI
```javascript
const SpellLibraryUI = {
    showLibrary: function() {
        const libraryPanel = document.getElementById('spellLibraryPanel');
        if (!libraryPanel) return;
        
        libraryPanel.innerHTML = `
            <div class="library-header">
                <h3>Spell Library</h3>
                <div class="mana-display">Mana: ${player.resources.mana}</div>
            </div>
            <div class="spell-list">
                ${SpellLibrary.knownSpells.map(spell => `
                    <div class="library-spell ${player.resources.mana >= spell.manaCost ? 'affordable' : 'expensive'}">
                        <div class="spell-info">
                            <h4>${spell.name}</h4>
                            <div class="spell-type">${spell.type}</div>
                            <div class="mana-cost">${spell.manaCost} mana</div>
                            <p class="description">${spell.description}</p>
                        </div>
                        <button class="purchase-btn" 
                                onclick="purchaseSpell('${spell.name}')"
                                ${player.resources.mana >= spell.manaCost ? '' : 'disabled'}>
                            ${spell.type === 'damage' ? 'Add to Queue' : 'Cast Now'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    updateLibrary: function() {
        this.showLibrary(); // Refresh the display
    }
};
```

### Spell Queue UI
```javascript
const SpellQueueUI = {
    showQueue: function() {
        const queuePanel = document.getElementById('spellQueuePanel');
        if (!queuePanel) return;
        
        queuePanel.innerHTML = `
            <div class="queue-header">
                <h3>Combat Spell Queue</h3>
                <div class="queue-info">Next spell triggers on combat</div>
            </div>
            <div class="queue-list">
                ${SpellQueue.queue.length === 0 ? 
                    '<div class="empty-queue">No spells queued</div>' :
                    SpellQueue.queue.map((item, index) => `
                        <div class="queued-spell ${index === 0 ? 'next-spell' : ''}">
                            <div class="spell-name">${item.spell.name}</div>
                            <div class="spell-damage">${item.spell.description}</div>
                            <div class="queue-position">${index === 0 ? 'NEXT' : `#${index + 1}`}</div>
                        </div>
                    `).join('')
                }
            </div>
            <div class="queue-controls">
                <button onclick="SpellQueue.clearQueue()" 
                        ${SpellQueue.queue.length === 0 ? 'disabled' : ''}>
                    Clear Queue
                </button>
            </div>
        `;
    },
    
    updateQueue: function() {
        this.showQueue(); // Refresh the display
    }
};
```

### Integrated UI Updates
```javascript
// Global functions for UI integration
window.purchaseSpell = function(spellName) {
    const result = SpellLibrary.purchaseSpell(spellName);
    
    if (result.success) {
        showNotification(result.message, 'success');
        SpellLibraryUI.updateLibrary();
        SpellQueueUI.updateQueue();
    } else {
        showNotification(result.reason, 'error');
    }
};

// Update UI methods for systems
SpellLibrary.updateLibraryUI = function() {
    SpellLibraryUI.updateLibrary();
};

SpellQueue.updateQueueUI = function() {
    SpellQueueUI.updateQueue();
};
```

## HTML Integration

### Required HTML Structure
```html
<!-- Add to your main game HTML -->
<div id="magicInterface" class="magic-ui">
    <div id="spellLibraryPanel" class="ui-panel">
        <!-- Spell library content populated by JavaScript -->
    </div>
    
    <div id="spellQueuePanel" class="ui-panel">
        <!-- Spell queue content populated by JavaScript -->
    </div>
</div>

<!-- CSS for styling -->
<style>
.magic-ui {
    position: fixed;
    right: 10px;
    top: 10px;
    width: 300px;
}

.ui-panel {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #444;
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px;
    color: white;
}

.spell-choice {
    border: 2px solid #666;
    padding: 10px;
    margin: 5px;
    cursor: pointer;
    background: #333;
}

.spell-choice:hover {
    border-color: #888;
    background: #444;
}

.affordable {
    border-left: 4px solid #4CAF50;
}

.expensive {
    border-left: 4px solid #F44336;
    opacity: 0.6;
}

.next-spell {
    background: #1a472a;
    border-left: 4px solid #4CAF50;
}

.common { color: #FFFFFF; }
.uncommon { color: #4CAF50; }
.rare { color: #2196F3; }
.epic { color: #9C27B0; }
.legendary { color: #FF9800; }
</style>
```

This simplified magic system provides:
- **Easy Selection**: Choose from 3 random spells every 3 minutes
- **Simple Library**: All known spells in one place
- **Auto-Combat**: Damage spells automatically trigger during fights
- **Immediate Economic**: Resource spells cast right away
- **Clear UI**: Separate panels for library and combat queue
- **FIFO Queue**: First purchased spell triggers first in combat