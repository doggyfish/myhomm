/**
 * Player class for MyHoMM Phaser 3 Version
 * Represents a player in the game (human or AI)
 */

class Player {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.color = config.color;
        this.isHuman = config.isHuman || false;
        
        // Phase 1-2: Enhanced Resources
        this.resources = {
            gold: 1000,
            income: 10,
            units: 0,
            totalProduced: 0,
            totalLost: 0
        };
        
        // Phase 1-2: Enhanced Statistics
        this.statistics = {
            castlesOwned: 0,
            armiesOwned: 0,
            battlesWon: 0,
            battlesLost: 0,
            unitsProduced: 0,
            unitsLost: 0,
            goldEarned: 0,
            goldSpent: 0,
            timeAlive: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            castlesCaptured: 0,
            castlesLost: 0
        };
        
        // Phase 1-2: Enhanced AI properties
        this.aiState = {
            lastDecisionTime: 0,
            currentStrategy: 'expand',
            targetPosition: null,
            difficulty: config.difficulty || 'medium',
            personality: config.personality || 'balanced',
            aggressiveness: config.aggressiveness || 0.5,
            expansiveness: config.expansiveness || 0.5,
            economicFocus: config.economicFocus || 0.5,
            lastStrategicDecision: 0,
            strategicGoals: [],
            threatAssessment: 'none'
        };
        
        // Phase 3: Mobile detection
        this.isMobilePlayer = this.detectMobileDevice();
        
        // Phase 4: Tactical preferences
        this.tacticalPreferences = {
            preferredFormation: 'balanced',
            riskTolerance: 0.5,
            microManagement: config.isHuman ? true : false
        };
        
        console.log(`Player created: ${this.name} (${this.isHuman ? 'Human' : 'AI'})`);
    }
    
    addGold(amount) {
        this.resources.gold += amount;
        this.statistics.goldEarned += amount;
        console.log(`${this.name} gained ${amount} gold (Total: ${this.resources.gold})`);
    }
    
    spendGold(amount) {
        if (this.resources.gold >= amount) {
            this.resources.gold -= amount;
            this.statistics.goldSpent += amount;
            console.log(`${this.name} spent ${amount} gold (Remaining: ${this.resources.gold})`);
            return true;
        }
        console.log(`${this.name} cannot afford ${amount} gold (Has: ${this.resources.gold})`);
        return false;
    }
    
    addUnits(count) {
        this.resources.units += count;
        this.statistics.unitsProduced += count;
    }
    
    loseUnits(count) {
        this.resources.units = Math.max(0, this.resources.units - count);
        this.statistics.unitsLost += count;
    }
    
    updateStatistics(castleCount, armyCount) {
        this.statistics.castlesOwned = castleCount;
        this.statistics.armiesOwned = armyCount;
    }
    
    recordBattleResult(won, unitsLost = 0) {
        if (won) {
            this.statistics.battlesWon++;
        } else {
            this.statistics.battlesLost++;
        }
        
        if (unitsLost > 0) {
            this.loseUnits(unitsLost);
        }
    }
    
    getColorHex() {
        return `#${this.color.toString(16).padStart(6, '0')}`;
    }
    
    // Phase 3: Mobile detection
    detectMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Phase 1-2: Enhanced resource management
    updateIncome() {
        this.addGold(this.resources.income);
    }
    
    // Phase 1-2: Strategic decision making
    updateAIStrategy(gameState) {
        if (this.isHuman) return;
        
        const now = Date.now();
        if (now - this.aiState.lastStrategicDecision < 5000) return; // Update every 5 seconds
        
        this.aiState.lastStrategicDecision = now;
        
        // Simple strategy updating based on game state
        const enemyCastles = gameState.castles.filter(c => c.owner !== this).length;
        const myCastles = gameState.castles.filter(c => c.owner === this).length;
        
        if (myCastles < enemyCastles) {
            this.aiState.currentStrategy = 'expand';
            this.aiState.aggressiveness = Math.min(1.0, this.aiState.aggressiveness + 0.1);
        } else if (myCastles > enemyCastles * 1.5) {
            this.aiState.currentStrategy = 'attack';
            this.aiState.aggressiveness = Math.max(0.3, this.aiState.aggressiveness - 0.05);
        } else {
            this.aiState.currentStrategy = 'consolidate';
        }
    }
    
    // Phase 4: Tactical preferences
    getPreferredFormation() {
        if (this.isHuman) return 'manual';
        
        switch (this.aiState.personality) {
            case 'aggressive':
                return 'offensive';
            case 'defensive':
                return 'defensive';
            default:
                return 'balanced';
        }
    }
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            isHuman: this.isHuman,
            resources: { ...this.resources },
            statistics: { ...this.statistics },
            aiState: { ...this.aiState }
        };
    }
    
    static deserialize(data) {
        return new Player(data);
    }
}

window.Player = Player;