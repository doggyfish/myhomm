import { ResourceManager } from './ResourceManager.js';

export class Player {
    constructor(id, name, faction, isAI = false) {
        this.id = id;
        this.name = name;
        this.faction = faction;
        this.isAI = isAI;
        this.resourceManager = new ResourceManager(this);
        this.spellLibrary = [];
        this.isAlive = true;
        this.color = this.assignColor();
        this.aiController = null; // Will be set if this is an AI player
    }
    
    assignColor() {
        // Predefined player colors for up to 8 players
        const playerColors = [
            0xFF0000, // Red
            0x0000FF, // Blue
            0x00FF00, // Green
            0xFFFF00, // Yellow
            0xFF00FF, // Magenta
            0x00FFFF, // Cyan
            0xFF8000, // Orange
            0x8000FF  // Purple
        ];
        
        // Use player ID to determine color index (assumes sequential IDs like player1, player2, etc.)
        const playerNumber = parseInt(this.id.replace(/\D/g, '')) || 1;
        const colorIndex = (playerNumber - 1) % playerColors.length;
        
        return playerColors[colorIndex];
    }
    
    addSpell(spell) {
        if (!this.spellLibrary.find(s => s.id === spell.id)) {
            this.spellLibrary.push(spell);
        }
    }
    
    hasSpell(spellId) {
        return this.spellLibrary.some(spell => spell.id === spellId);
    }
    
    removeSpell(spellId) {
        const index = this.spellLibrary.findIndex(spell => spell.id === spellId);
        if (index !== -1) {
            this.spellLibrary.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getSpell(spellId) {
        return this.spellLibrary.find(spell => spell.id === spellId);
    }
    
    canCastSpell(spellId) {
        const spell = this.getSpell(spellId);
        if (!spell) return false;
        
        return this.resourceManager.hasResource('mana', spell.manaCost);
    }
    
    eliminate() {
        this.isAlive = false;
        // Could add cleanup logic here (remove entities, etc.)
    }
    
    revive() {
        this.isAlive = true;
    }
    
    getFactionBonus(resource) {
        // Apply faction-specific resource bonuses
        const factionConfig = this.getFactionConfig();
        return factionConfig?.resourceBonus?.[resource] || 1.0;
    }
    
    getFactionConfig() {
        // This would typically come from CONFIG, but we'll implement basic logic
        const factionBonuses = {
            human: {
                resourceBonus: { gold: 1.0, mana: 1.25 },
                unitProductionSpeed: 1.0
            },
            orc: {
                resourceBonus: { gold: 1.25, mana: 1.0 },
                unitProductionSpeed: 1.2
            }
        };
        
        return factionBonuses[this.faction] || factionBonuses.human;
    }
    
    getDisplayName() {
        return this.isAI ? `${this.name} (AI)` : this.name;
    }
    
    toString() {
        return `Player(${this.id}, ${this.name}, ${this.faction}, AI: ${this.isAI})`;
    }
    
    setAIController(aiController) {
        this.aiController = aiController;
    }

    updateAI(gameState, deltaTime) {
        if (this.isAI && this.aiController) {
            this.aiController.update(gameState, deltaTime);
        }
    }

    getAIStatus() {
        if (this.isAI && this.aiController) {
            return this.aiController.getStatus();
        }
        return null;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            faction: this.faction,
            isAI: this.isAI,
            isAlive: this.isAlive,
            color: this.color,
            resources: this.resourceManager.resources,
            spellLibrary: this.spellLibrary.map(spell => spell.id)
        };
    }
}