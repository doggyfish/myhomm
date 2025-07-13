/**
 * ProductionSystem handles unit production for all castles
 */
class ProductionSystem {
    constructor() {
        this.enabled = true;
        this.globalProductionMultiplier = 1.0;
        this.lastUpdateTime = Date.now();
    }
    
    /**
     * Update production for all castles
     * @param {Array} castles - Array of castle objects
     * @param {number} currentTime - Current timestamp
     * @returns {number} Number of units produced this update
     */
    update(castles, currentTime = Date.now()) {
        if (!this.enabled) return 0;
        
        let totalUnitsProduced = 0;
        
        castles.forEach(castle => {
            if (castle.updateProduction && castle.updateProduction(currentTime)) {
                totalUnitsProduced++;
            }
        });
        
        this.lastUpdateTime = currentTime;
        return totalUnitsProduced;
    }
    
    /**
     * Set global production multiplier (for game speed control)
     * @param {number} multiplier - Production speed multiplier
     */
    setGlobalMultiplier(multiplier) {
        this.globalProductionMultiplier = Math.max(0, multiplier);
    }
    
    /**
     * Enable or disable production
     * @param {boolean} enabled - Whether production is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Get production statistics
     * @param {Array} castles - Array of castle objects
     * @returns {Object} Production statistics
     */
    getStatistics(castles) {
        const stats = {
            totalCastles: castles.length,
            producingCastles: 0,
            totalUnitsPerMinute: 0,
            averageUpgradeLevel: 0,
            totalUpgrades: 0
        };
        
        castles.forEach(castle => {
            if (castle.isProducing) {
                stats.producingCastles++;
                stats.totalUnitsPerMinute += castle.getEfficiency ? castle.getEfficiency() : 60;
            }
            
            if (castle.upgrades && castle.upgrades.production) {
                stats.totalUpgrades += castle.upgrades.production;
            }
        });
        
        stats.averageUpgradeLevel = stats.totalCastles > 0 ? 
            stats.totalUpgrades / stats.totalCastles : 0;
            
        return stats;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionSystem;
}