/**
 * Player class representing a game player with their properties and statistics
 */
class Player {
    /**
     * Create a Player instance
     * @param {number} id - Unique player identifier
     * @param {string} name - Player's display name
     * @param {string} color - Player's color (hex or color name)
     * @param {boolean} isHuman - Whether this player is human-controlled
     */
    constructor(id, name, color, isHuman = true) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isHuman = isHuman;
        
        // Game statistics
        this.statistics = {
            castlesOwned: 0,
            totalUnits: 0,
            unitsProduced: 0,
            battlesWon: 0,
            battlesLost: 0,
            castlesCaptured: 0,
            castlesLost: 0
        };
        
        // Player resources (active resource system)
        this.resources = {
            gold: 100, // Starting gold for unit production
            goldPerSecond: 0
        };
        
        // Player settings
        this.settings = {
            difficulty: 'medium', // for AI players
            aggressiveness: 0.5,  // 0-1 scale for AI behavior
            economicFocus: 0.5    // 0-1 scale for AI priorities
        };
    }
    
    /**
     * Update player statistics
     * @param {Object} stats - Statistics to update
     */
    updateStatistics(stats) {
        Object.assign(this.statistics, stats);
    }
    
    /**
     * Add resources to player
     * @param {number} amount - Amount of gold to add
     */
    addGold(amount) {
        this.resources.gold += amount;
    }
    
    /**
     * Spend player resources
     * @param {number} amount - Amount of gold to spend
     * @returns {boolean} True if transaction successful
     */
    spendGold(amount) {
        if (this.resources.gold >= amount) {
            this.resources.gold -= amount;
            return true;
        }
        return false;
    }
    
    /**
     * Check if player can afford a cost
     * @param {number} cost - Cost to check
     * @returns {boolean} True if player can afford it
     */
    canAfford(cost) {
        return this.resources.gold >= cost;
    }
    
    /**
     * Update gold income based on owned castles
     * @param {number} goldPerSecond - Gold production rate
     */
    updateGoldIncome(goldPerSecond) {
        this.resources.goldPerSecond = goldPerSecond;
        this.resources.gold += goldPerSecond;
    }
    
    /**
     * Get player's total military strength
     * @param {Array} castles - Array of castles
     * @param {Array} armies - Array of armies
     * @returns {number} Total unit count
     */
    getTotalUnits(castles, armies) {
        const castleUnits = castles
            .filter(castle => castle.owner === this)
            .reduce((sum, castle) => sum + castle.unitCount, 0);
            
        const armyUnits = armies
            .filter(army => army.owner === this)
            .reduce((sum, army) => sum + army.unitCount, 0);
            
        this.statistics.totalUnits = castleUnits + armyUnits;
        return this.statistics.totalUnits;
    }
    
    /**
     * Get number of castles owned by this player
     * @param {Array} castles - Array of all castles
     * @returns {number} Number of owned castles
     */
    getCastleCount(castles) {
        this.statistics.castlesOwned = castles.filter(castle => castle.owner === this).length;
        return this.statistics.castlesOwned;
    }
    
    /**
     * Record a battle result
     * @param {boolean} won - Whether the player won the battle
     */
    recordBattle(won) {
        if (won) {
            this.statistics.battlesWon++;
        } else {
            this.statistics.battlesLost++;
        }
    }
    
    /**
     * Record castle ownership change
     * @param {boolean} gained - Whether player gained (true) or lost (false) a castle
     */
    recordCastleChange(gained) {
        if (gained) {
            this.statistics.castlesCaptured++;
        } else {
            this.statistics.castlesLost++;
        }
    }
    
    /**
     * Get player's win rate
     * @returns {number} Win rate as percentage (0-100)
     */
    getWinRate() {
        const totalBattles = this.statistics.battlesWon + this.statistics.battlesLost;
        if (totalBattles === 0) return 0;
        return Math.round((this.statistics.battlesWon / totalBattles) * 100);
    }
    
    /**
     * Check if this player is defeated (no castles or armies)
     * @param {Array} castles - Array of all castles
     * @param {Array} armies - Array of all armies
     * @returns {boolean} True if player is defeated
     */
    isDefeated(castles, armies) {
        const ownsCastles = castles.some(castle => castle.owner === this);
        const ownsArmies = armies.some(army => army.owner === this);
        return !ownsCastles && !ownsArmies;
    }
    
    /**
     * Export player data for saving
     * @returns {Object} Serializable player data
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            isHuman: this.isHuman,
            statistics: this.statistics,
            resources: this.resources,
            settings: this.settings
        };
    }
    
    /**
     * Import player data from save
     * @param {Object} data - Player data to import
     */
    static fromJSON(data) {
        const player = new Player(data.id, data.name, data.color, data.isHuman);
        player.statistics = data.statistics || player.statistics;
        player.resources = data.resources || player.resources;
        player.settings = data.settings || player.settings;
        return player;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}