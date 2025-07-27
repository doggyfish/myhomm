/**
 * CastleSpecializationSystem - Phase 4 castle specialization with mobile-optimized interfaces
 * Provides deep strategic castle management building on mobile UI foundation
 */

// Phase 4: Castle specialization types with mobile-friendly interfaces
const CASTLE_SPECIALIZATIONS = {
    MILITARY_FORTRESS: {
        name: "Military Fortress",
        specialization: "combat",
        description: "Specialized in producing elite military units and defensive capabilities",
        mobileIcon: "🏰",
        displayColor: "#8B0000",
        bonuses: {
            unitDefense: 0.3,          // +30% defense for all units produced here
            veteranChance: 0.2,        // +20% chance for veteran units
            knightProduction: true,    // Can produce Knights
            siegeResistance: 0.4       // +40% resistance to siege attacks
        },
        uniqueUnits: ['KNIGHTS', 'SIEGE_ENGINES'],
        goldProduction: 3,
        maxUpgrades: 5,
        conversionCost: 500,
        upgradeTree: {
            fortification: { 
                maxLevel: 5, 
                baseCost: 200,
                name: "Fortification",
                description: "Increases castle defense and unit protection",
                icon: "🛡️"
            },
            barracks: { 
                maxLevel: 3, 
                baseCost: 400,
                name: "Advanced Barracks",
                description: "Improves unit training and veteran chances",
                icon: "⚔️"
            },
            armory: { 
                maxLevel: 4, 
                baseCost: 300,
                name: "Elite Armory",
                description: "Enhances unit equipment and combat effectiveness",
                icon: "🗡️"
            }
        },
        tacticalAdvantages: [
            "Strong defensive position",
            "Elite unit production",
            "Siege warfare resistance"
        ]
    },
    
    ECONOMIC_STRONGHOLD: {
        name: "Economic Stronghold", 
        specialization: "economy",
        description: "Focused on resource generation, trade, and efficient production systems",
        mobileIcon: "💰",
        displayColor: "#FFD700",
        bonuses: {
            productionSpeed: 0.4,      // +40% faster unit production
            costReduction: 0.15,       // -15% unit costs
            goldMultiplier: 2.0,       // Double gold production
            tradeBonus: 0.25           // +25% gold from nearby resources
        },
        uniqueUnits: ['ENGINEERS', 'MERCHANTS'],
        goldProduction: 6,
        maxUpgrades: 4,
        conversionCost: 400,
        upgradeTree: {
            treasury: { 
                maxLevel: 4, 
                baseCost: 150,
                name: "Grand Treasury",
                description: "Increases gold production and storage capacity",
                icon: "💎"
            },
            workshop: { 
                maxLevel: 5, 
                baseCost: 250,
                name: "Master Workshop",
                description: "Reduces production costs and improves efficiency",
                icon: "🔨"
            },
            marketplace: { 
                maxLevel: 3, 
                baseCost: 350,
                name: "Trade Hub",
                description: "Generates additional income from regional trade",
                icon: "🏪"
            }
        },
        tacticalAdvantages: [
            "Rapid army expansion",
            "Economic sustainability",
            "Resource optimization"
        ]
    },
    
    ARCANE_TOWER: {
        name: "Arcane Tower",
        specialization: "magic",
        description: "Mystical tower producing magical units and providing arcane enhancements",
        mobileIcon: "🔮",
        displayColor: "#4B0082",
        bonuses: {
            archerPower: 0.5,          // +50% archer power (magical enhancement)
            magicResistance: 0.3,      // +30% magic resistance for all units
            scrying: true,             // Can see enemy army compositions
            spellSupport: true         // Units receive magical battlefield support
        },
        uniqueUnits: ['BATTLE_MAGES', 'ARCANE_ARCHERS'],
        goldProduction: 2,
        maxUpgrades: 4,
        conversionCost: 600,
        upgradeTree: {
            spellforge: { 
                maxLevel: 3, 
                baseCost: 300,
                name: "Arcane Spellforge",
                description: "Enhances magical unit abilities and spell power",
                icon: "✨"
            },
            library: { 
                maxLevel: 4, 
                baseCost: 200,
                name: "Mystical Library",
                description: "Provides magical knowledge and research bonuses",
                icon: "📚"
            },
            sanctuary: { 
                maxLevel: 5, 
                baseCost: 400,
                name: "Arcane Sanctuary",
                description: "Increases magical energy and unit production",
                icon: "🏛️"
            }
        },
        tacticalAdvantages: [
            "Magical unit superiority",
            "Enhanced reconnaissance",
            "Spell-based tactics"
        ]
    },

    ENGINEERING_COMPLEX: {
        name: "Engineering Complex",
        specialization: "technology",
        description: "Advanced technological facility producing siege weapons and defensive systems",
        mobileIcon: "⚙️",
        displayColor: "#708090",
        bonuses: {
            siegePower: 0.6,           // +60% siege weapon effectiveness
            defensiveBonus: 0.4,       // +40% defensive structures effectiveness
            rapidDeployment: true,     // Can deploy units faster to battlefield
            technologicalEdge: 0.2     // +20% effectiveness against primitive units
        },
        uniqueUnits: ['SIEGE_ENGINES', 'ENGINEERS', 'BALLISTAS'],
        goldProduction: 4,
        maxUpgrades: 4,
        conversionCost: 550,
        upgradeTree: {
            workshop: { 
                maxLevel: 5, 
                baseCost: 250,
                name: "Advanced Workshop",
                description: "Improves siege weapon production and maintenance",
                icon: "🔧"
            },
            laboratory: { 
                maxLevel: 3, 
                baseCost: 400,
                name: "Research Laboratory",
                description: "Develops new technologies and unit improvements",
                icon: "🧪"
            },
            foundry: { 
                maxLevel: 4, 
                baseCost: 350,
                name: "Master Foundry",
                description: "Creates superior weapons and defensive equipment",
                icon: "🏭"
            }
        },
        tacticalAdvantages: [
            "Siege warfare dominance",
            "Technological superiority",
            "Rapid deployment capabilities"
        ]
    }
};

// Phase 4: Extended unit types for castle specializations
const SPECIALIZED_UNITS = {
    ENGINEERS: {
        level: 3,
        basePower: 2,
        cost: 8,
        productionTime: 4000,
        name: "Engineers",
        description: "Specialist units that can build and repair structures",
        combatType: "support",
        mobileIcon: "🔧",
        displayColor: "#708090",
        specialAbility: "construction",
        availableIn: ["ECONOMIC_STRONGHOLD", "ENGINEERING_COMPLEX"]
    },
    MERCHANTS: {
        level: 1,
        basePower: 0.5,
        cost: 5,
        productionTime: 2000,
        name: "Merchants",
        description: "Trade specialists that generate additional income",
        combatType: "economic",
        mobileIcon: "💼",
        displayColor: "#FFD700",
        specialAbility: "trade_income",
        availableIn: ["ECONOMIC_STRONGHOLD"]
    },
    ARCANE_ARCHERS: {
        level: 3,
        basePower: 4,
        cost: 10,
        productionTime: 4500,
        name: "Arcane Archers",
        description: "Magically enhanced archers with increased range and power",
        combatType: "magical_ranged",
        mobileIcon: "🏹✨",
        displayColor: "#4B0082",
        specialAbility: "magical_arrows",
        availableIn: ["ARCANE_TOWER"]
    },
    BALLISTAS: {
        level: 4,
        basePower: 7,
        cost: 18,
        productionTime: 7000,
        name: "Ballistas",
        description: "Heavy siege weapons effective against fortifications",
        combatType: "siege_ranged",
        mobileIcon: "🏹🏰",
        displayColor: "#708090",
        specialAbility: "siege_damage",
        availableIn: ["ENGINEERING_COMPLEX"]
    }
};

/**
 * CastleSpecializationSystem - Manages castle specialization and upgrades
 */
class CastleSpecializationSystem {
    constructor(game, mobileUIManager) {
        this.game = game;
        this.mobileUI = mobileUIManager;
        
        // Specialization state
        this.activeSpecializations = new Map(); // castleId -> specialization
        this.conversionQueue = new Map(); // castleId -> conversion data
        
        // UI components
        this.ui = {
            specializationPanel: null,
            conversionModal: null,
            upgradeInterface: null
        };
        
        // Mobile optimization settings
        this.mobileOptimized = {
            touchFriendlyControls: this.game.mobile?.isActive || false,
            simplifiedInterface: this.game.mobile?.isActive || false,
            contextMenus: true
        };
        
        this.initialize();
        
        console.log('🏰 CastleSpecializationSystem initialized - Phase 4 castle management active');
    }
    
    /**
     * Initialize castle specialization system
     */
    initialize() {
        this.createSpecializationUI();
        this.setupEventHandlers();
        this.loadExistingSpecializations();
    }
    
    /**
     * Create specialization UI components
     */
    createSpecializationUI() {
        this.createSpecializationPanel();
        this.createConversionModal();
        this.createUpgradeInterface();
    }
    
    /**
     * Create main specialization panel
     */
    createSpecializationPanel() {
        const panel = document.createElement('div');
        panel.id = 'castleSpecializationPanel';
        panel.className = 'specialization-panel';
        panel.innerHTML = `
            <div class="specialization-header">
                <h3>🏰 Castle Specialization</h3>
                <button class="panel-close" onclick="castleSpecialization.hidePanel()">✕</button>
            </div>
            
            <div class="specialization-content">
                <div class="castle-info-section">
                    <div class="castle-title">
                        <h4 id="castleName">Select a Castle</h4>
                        <span class="castle-level" id="castleLevel">Level --</span>
                    </div>
                    
                    <div class="current-specialization" id="currentSpecialization">
                        <div class="spec-icon">🏰</div>
                        <div class="spec-details">
                            <div class="spec-name">Basic Castle</div>
                            <div class="spec-description">No specialization active</div>
                        </div>
                    </div>
                </div>
                
                <div class="specialization-bonuses" id="specializationBonuses">
                    <h4>Active Bonuses</h4>
                    <div class="bonus-list">
                        <div class="bonus-item">
                            <span class="bonus-icon">🏗️</span>
                            <span class="bonus-text">Standard production rates</span>
                        </div>
                    </div>
                </div>
                
                <div class="upgrade-progress" id="upgradeProgress">
                    <h4>Upgrade Progress</h4>
                    <div class="upgrade-tree" id="upgradeTree">
                        <div class="no-upgrades">Select a specialized castle to see upgrades</div>
                    </div>
                </div>
                
                <div class="specialization-actions">
                    <button class="btn-primary" onclick="castleSpecialization.showConversionModal()">
                        🔄 Change Specialization
                    </button>
                    <button class="btn-secondary" onclick="castleSpecialization.showUpgradeInterface()">
                        ⬆️ Upgrade Castle
                    </button>
                </div>
            </div>
        `;
        
        // Apply mobile optimizations
        if (this.mobileOptimized.touchFriendlyControls) {
            panel.classList.add('mobile-optimized');
        }
        
        document.body.appendChild(panel);
        this.ui.specializationPanel = panel;
    }
    
    /**
     * Create conversion modal for changing specializations
     */
    createConversionModal() {
        const modal = document.createElement('div');
        modal.id = 'specializationConversionModal';
        modal.className = 'specialization-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="castleSpecialization.hideConversionModal()"></div>
            <div class="modal-content conversion-content">
                <div class="modal-header">
                    <h2>🏰 Choose Castle Specialization</h2>
                    <button class="close-btn" onclick="castleSpecialization.hideConversionModal()">✕</button>
                </div>
                
                <div class="specialization-options">
                    ${this.generateSpecializationOptions()}
                </div>
                
                <div class="conversion-info">
                    <div class="conversion-cost" id="conversionCost">
                        <span class="cost-label">Conversion Cost:</span>
                        <span class="cost-value">-- gold</span>
                    </div>
                    <div class="conversion-time" id="conversionTime">
                        <span class="time-label">Conversion Time:</span>
                        <span class="time-value">-- seconds</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-primary" id="confirmConversion" onclick="castleSpecialization.confirmConversion()" disabled>
                        Convert Castle
                    </button>
                    <button class="btn-secondary" onclick="castleSpecialization.hideConversionModal()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.ui.conversionModal = modal;
        
        // Setup selection handlers
        this.setupSpecializationSelection();
    }
    
    /**
     * Generate specialization option cards
     */
    generateSpecializationOptions() {
        let optionsHTML = '';
        
        Object.entries(CASTLE_SPECIALIZATIONS).forEach(([key, spec]) => {
            optionsHTML += `
                <div class="spec-option" data-specialization="${key}">
                    <div class="spec-card">
                        <div class="spec-card-header">
                            <span class="spec-icon-large">${spec.mobileIcon}</span>
                            <h3>${spec.name}</h3>
                        </div>
                        
                        <div class="spec-card-content">
                            <p class="spec-description">${spec.description}</p>
                            
                            <div class="spec-bonuses">
                                <h4>Bonuses:</h4>
                                <ul class="bonus-list">
                                    ${this.generateBonusList(spec.bonuses)}
                                </ul>
                            </div>
                            
                            <div class="spec-units">
                                <h4>Unique Units:</h4>
                                <div class="unit-icons">
                                    ${spec.uniqueUnits.map(unit => {
                                        const unitData = SPECIALIZED_UNITS[unit];
                                        return unitData ? `<span class="unit-icon" title="${unitData.name}">${unitData.mobileIcon}</span>` : '';
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="spec-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">💰</span>
                                    <span class="stat-text">${spec.goldProduction} gold/sec</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🔄</span>
                                    <span class="stat-text">${spec.maxUpgrades} max upgrades</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">💎</span>
                                    <span class="stat-text">${spec.conversionCost} gold cost</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return optionsHTML;
    }
    
    /**
     * Generate bonus list HTML
     */
    generateBonusList(bonuses) {
        let bonusHTML = '';
        
        Object.entries(bonuses).forEach(([bonus, value]) => {
            const bonusText = this.formatBonusText(bonus, value);
            if (bonusText) {
                bonusHTML += `<li>${bonusText}</li>`;
            }
        });
        
        return bonusHTML;
    }
    
    /**
     * Format bonus text for display
     */
    formatBonusText(bonus, value) {
        const bonusDescriptions = {
            unitDefense: `+${Math.round(value * 100)}% unit defense`,
            veteranChance: `+${Math.round(value * 100)}% veteran unit chance`,
            productionSpeed: `+${Math.round(value * 100)}% production speed`,
            costReduction: `-${Math.round(value * 100)}% unit costs`,
            goldMultiplier: `${value}x gold production`,
            archerPower: `+${Math.round(value * 100)}% archer power`,
            magicResistance: `+${Math.round(value * 100)}% magic resistance`,
            siegePower: `+${Math.round(value * 100)}% siege effectiveness`,
            defensiveBonus: `+${Math.round(value * 100)}% defensive bonus`,
            knightProduction: 'Can produce Knights',
            scrying: 'See enemy army compositions',
            spellSupport: 'Magical battlefield support',
            rapidDeployment: 'Faster unit deployment',
            technologicalEdge: `+${Math.round(value * 100)}% vs primitive units`
        };
        
        return bonusDescriptions[bonus];
    }
    
    /**
     * Create upgrade interface
     */
    createUpgradeInterface() {
        const upgradeInterface = document.createElement('div');
        upgradeInterface.id = 'castleUpgradeInterface';
        upgradeInterface.className = 'upgrade-interface';
        upgradeInterface.innerHTML = `
            <div class="interface-header">
                <h3>⬆️ Castle Upgrades</h3>
                <button class="interface-close" onclick="castleSpecialization.hideUpgradeInterface()">✕</button>
            </div>
            
            <div class="interface-content">
                <div class="upgrade-categories" id="upgradeCategories">
                    <!-- Dynamically populated based on specialization -->
                </div>
                
                <div class="upgrade-details" id="upgradeDetails">
                    <div class="no-selection">Select an upgrade category to see details</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(upgradeInterface);
        this.ui.upgradeInterface = upgradeInterface;
    }
    
    /**
     * Setup event handlers for specialization system
     */
    setupEventHandlers() {
        // Listen for castle selection changes
        window.addEventListener('castleSelected', (event) => {
            this.updateSpecializationPanel(event.detail.castle);
        });
        
        // Listen for specialization changes
        window.addEventListener('specializationChanged', (event) => {
            this.handleSpecializationChange(event.detail);
        });
        
        // Listen for upgrade completions
        window.addEventListener('upgradeCompleted', (event) => {
            this.handleUpgradeCompletion(event.detail);
        });
    }
    
    /**
     * Setup specialization selection handlers
     */
    setupSpecializationSelection() {
        const specOptions = document.querySelectorAll('.spec-option');
        specOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove selection from other options
                specOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Select this option
                e.currentTarget.classList.add('selected');
                
                const specialization = e.currentTarget.dataset.specialization;
                this.selectedSpecialization = specialization;
                
                // Update conversion info
                this.updateConversionInfo(specialization);
                
                // Enable conversion button
                document.getElementById('confirmConversion').disabled = false;
                
                // Provide haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            });
        });
    }
    
    /**
     * Load existing specializations from game state
     */
    loadExistingSpecializations() {
        if (!this.game.castles) return;
        
        this.game.castles.forEach(castle => {
            if (castle.specialization) {
                this.activeSpecializations.set(castle.id, castle.specialization);
            }
        });
    }
    
    /**
     * Convert castle to new specialization
     */
    async convertCastle(castle, newSpecialization, player) {
        const spec = CASTLE_SPECIALIZATIONS[newSpecialization];
        
        if (!spec) {
            return {
                success: false,
                message: `Invalid specialization: ${newSpecialization}`
            };
        }
        
        // Check if player can afford conversion
        if (!this.canAfford(player, spec.conversionCost)) {
            return {
                success: false,
                message: `Insufficient gold. Need ${spec.conversionCost} gold.`
            };
        }
        
        // Pay conversion cost
        player.spendGold(spec.conversionCost);
        
        // Start conversion process
        const conversionData = {
            castle: castle,
            targetSpecialization: newSpecialization,
            startTime: Date.now(),
            duration: 10000, // 10 seconds conversion time
            player: player
        };
        
        this.conversionQueue.set(castle.id, conversionData);
        
        // Show conversion in progress
        this.showConversionProgress(conversionData);
        
        // Complete conversion after delay
        setTimeout(() => {
            this.completeConversion(castle.id);
        }, conversionData.duration);
        
        return {
            success: true,
            message: `Castle conversion to ${spec.name} started`,
            duration: conversionData.duration
        };
    }
    
    /**
     * Complete castle conversion
     */
    completeConversion(castleId) {
        const conversionData = this.conversionQueue.get(castleId);
        if (!conversionData) return;
        
        const { castle, targetSpecialization, player } = conversionData;
        const spec = CASTLE_SPECIALIZATIONS[targetSpecialization];
        
        // Apply new specialization
        castle.specialization = targetSpecialization;
        castle.specializationData = spec;
        castle.goldProduction = spec.goldProduction;
        castle.maxUpgrades = spec.maxUpgrades;
        
        // Reset upgrades for new specialization
        castle.specializedUpgrades = {};
        Object.keys(spec.upgradeTree).forEach(upgradeType => {
            castle.specializedUpgrades[upgradeType] = 0;
        });
        
        // Apply immediate bonuses
        this.applySpecializationBonuses(castle, spec);
        
        // Add to active specializations
        this.activeSpecializations.set(castleId, targetSpecialization);
        
        // Remove from conversion queue
        this.conversionQueue.delete(castleId);
        
        // Show completion notification
        this.showConversionComplete(castle, spec);
        
        // Trigger specialization change event
        window.dispatchEvent(new CustomEvent('specializationChanged', {
            detail: {
                castle: castle,
                specialization: targetSpecialization,
                spec: spec
            }
        }));
        
        console.log(`🏰 Castle ${castle.id} converted to ${spec.name}`);
    }
    
    /**
     * Apply specialization bonuses to castle
     */
    applySpecializationBonuses(castle, spec) {
        // Store original values if not already stored
        if (!castle.originalValues) {
            castle.originalValues = {
                goldProduction: castle.goldProduction,
                unitTypes: JSON.parse(JSON.stringify(castle.unitTypes || {}))
            };
        }
        
        // Apply production bonuses
        if (spec.bonuses.productionSpeed) {
            Object.keys(castle.unitTypes || {}).forEach(unitType => {
                if (castle.unitTypes[unitType].productionTime) {
                    castle.unitTypes[unitType].productionTime *= (1 - spec.bonuses.productionSpeed);
                }
            });
        }
        
        // Apply cost reductions
        if (spec.bonuses.costReduction) {
            Object.keys(castle.unitTypes || {}).forEach(unitType => {
                if (castle.unitTypes[unitType].cost) {
                    castle.unitTypes[unitType].cost *= (1 - spec.bonuses.costReduction);
                }
            });
        }
        
        // Enable unique unit production
        spec.uniqueUnits.forEach(unitType => {
            const unitData = SPECIALIZED_UNITS[unitType];
            if (unitData) {
                castle.unitTypes = castle.unitTypes || {};
                castle.unitTypes[unitType.toLowerCase()] = {
                    ...unitData,
                    count: 0,
                    lastProduced: Date.now()
                };
            }
        });
        
        // Apply gold production multiplier
        if (spec.bonuses.goldMultiplier) {
            castle.goldProduction *= spec.bonuses.goldMultiplier;
        }
    }
    
    /**
     * Upgrade castle specialization feature
     */
    upgradeSpecialization(castle, upgradeType, player) {
        if (!castle.specialization) {
            return {
                success: false,
                message: "Castle must be specialized before upgrading"
            };
        }
        
        const spec = CASTLE_SPECIALIZATIONS[castle.specialization];
        const upgradeData = spec.upgradeTree[upgradeType];
        
        if (!upgradeData) {
            return {
                success: false,
                message: `Invalid upgrade type: ${upgradeType}`
            };
        }
        
        const currentLevel = castle.specializedUpgrades[upgradeType] || 0;
        
        if (currentLevel >= upgradeData.maxLevel) {
            return {
                success: false,
                message: `${upgradeData.name} is already at maximum level`
            };
        }
        
        const upgradeCost = this.calculateUpgradeCost(upgradeData, currentLevel);
        
        if (!this.canAfford(player, upgradeCost)) {
            return {
                success: false,
                message: `Insufficient gold. Need ${upgradeCost} gold.`
            };
        }
        
        // Pay upgrade cost
        player.spendGold(upgradeCost);
        
        // Apply upgrade
        castle.specializedUpgrades[upgradeType] = currentLevel + 1;
        
        // Apply upgrade effects
        this.applyUpgradeEffects(castle, upgradeType, currentLevel + 1);
        
        // Show upgrade notification
        this.showUpgradeComplete(castle, upgradeData, currentLevel + 1);
        
        return {
            success: true,
            message: `${upgradeData.name} upgraded to level ${currentLevel + 1}`,
            newLevel: currentLevel + 1
        };
    }
    
    /**
     * Calculate upgrade cost based on level
     */
    calculateUpgradeCost(upgradeData, currentLevel) {
        return upgradeData.baseCost * Math.pow(1.5, currentLevel);
    }
    
    /**
     * Apply upgrade effects to castle
     */
    applyUpgradeEffects(castle, upgradeType, level) {
        const spec = CASTLE_SPECIALIZATIONS[castle.specialization];
        
        // Different upgrade types have different effects
        switch (upgradeType) {
            case 'fortification':
                // Increase defense bonuses
                if (!castle.upgradeEffects) castle.upgradeEffects = {};
                castle.upgradeEffects.defenseBonus = (castle.upgradeEffects.defenseBonus || 0) + 0.1;
                break;
                
            case 'barracks':
                // Increase veteran chance and production speed
                castle.upgradeEffects = castle.upgradeEffects || {};
                castle.upgradeEffects.veteranBonus = (castle.upgradeEffects.veteranBonus || 0) + 0.05;
                castle.upgradeEffects.productionBonus = (castle.upgradeEffects.productionBonus || 0) + 0.1;
                break;
                
            case 'armory':
                // Increase unit power
                castle.upgradeEffects = castle.upgradeEffects || {};
                castle.upgradeEffects.unitPowerBonus = (castle.upgradeEffects.unitPowerBonus || 0) + 0.08;
                break;
                
            case 'treasury':
                // Increase gold production
                castle.goldProduction *= 1.2;
                break;
                
            case 'workshop':
                // Reduce production costs and time
                castle.upgradeEffects = castle.upgradeEffects || {};
                castle.upgradeEffects.costReduction = (castle.upgradeEffects.costReduction || 0) + 0.05;
                castle.upgradeEffects.speedBonus = (castle.upgradeEffects.speedBonus || 0) + 0.1;
                break;
                
            case 'spellforge':
            case 'laboratory':
                // Increase magical/technological bonuses
                castle.upgradeEffects = castle.upgradeEffects || {};
                castle.upgradeEffects.specialBonus = (castle.upgradeEffects.specialBonus || 0) + 0.1;
                break;
        }
    }
    
    /**
     * Check if player can afford cost
     */
    canAfford(player, cost) {
        return player.resources && player.resources.gold >= cost;
    }
    
    /**
     * Show/hide specialization panel
     */
    showSpecializationPanel(castle) {
        if (this.ui.specializationPanel) {
            this.ui.specializationPanel.style.display = 'block';
            this.updateSpecializationPanel(castle);
        }
    }
    
    hidePanel() {
        if (this.ui.specializationPanel) {
            this.ui.specializationPanel.style.display = 'none';
        }
    }
    
    /**
     * Show/hide conversion modal
     */
    showConversionModal() {
        if (this.ui.conversionModal) {
            this.ui.conversionModal.style.display = 'flex';
        }
    }
    
    hideConversionModal() {
        if (this.ui.conversionModal) {
            this.ui.conversionModal.style.display = 'none';
        }
    }
    
    /**
     * Show/hide upgrade interface
     */
    showUpgradeInterface() {
        if (this.ui.upgradeInterface) {
            this.ui.upgradeInterface.style.display = 'block';
            this.updateUpgradeInterface();
        }
    }
    
    hideUpgradeInterface() {
        if (this.ui.upgradeInterface) {
            this.ui.upgradeInterface.style.display = 'none';
        }
    }
    
    /**
     * Update specialization panel with castle data
     */
    updateSpecializationPanel(castle) {
        if (!castle) return;
        
        // Update castle info
        const castleName = document.getElementById('castleName');
        const castleLevel = document.getElementById('castleLevel');
        
        if (castleName) {
            castleName.textContent = castle.name || `Castle ${castle.id}`;
        }
        if (castleLevel) {
            castleLevel.textContent = `Level ${castle.level || 1}`;
        }
        
        // Update current specialization
        this.updateCurrentSpecializationDisplay(castle);
        
        // Update bonuses display
        this.updateBonusesDisplay(castle);
        
        // Update upgrade progress
        this.updateUpgradeProgressDisplay(castle);
    }
    
    /**
     * Update current specialization display
     */
    updateCurrentSpecializationDisplay(castle) {
        const specElement = document.getElementById('currentSpecialization');
        if (!specElement) return;
        
        if (castle.specialization) {
            const spec = CASTLE_SPECIALIZATIONS[castle.specialization];
            specElement.innerHTML = `
                <div class="spec-icon">${spec.mobileIcon}</div>
                <div class="spec-details">
                    <div class="spec-name">${spec.name}</div>
                    <div class="spec-description">${spec.description}</div>
                </div>
            `;
        } else {
            specElement.innerHTML = `
                <div class="spec-icon">🏰</div>
                <div class="spec-details">
                    <div class="spec-name">Basic Castle</div>
                    <div class="spec-description">No specialization active</div>
                </div>
            `;
        }
    }
    
    /**
     * Update bonuses display
     */
    updateBonusesDisplay(castle) {
        const bonusesElement = document.getElementById('specializationBonuses');
        if (!bonusesElement) return;
        
        let bonusHTML = '<h4>Active Bonuses</h4><div class="bonus-list">';
        
        if (castle.specialization) {
            const spec = CASTLE_SPECIALIZATIONS[castle.specialization];
            Object.entries(spec.bonuses).forEach(([bonus, value]) => {
                const bonusText = this.formatBonusText(bonus, value);
                if (bonusText) {
                    bonusHTML += `
                        <div class="bonus-item">
                            <span class="bonus-icon">✨</span>
                            <span class="bonus-text">${bonusText}</span>
                        </div>
                    `;
                }
            });
        } else {
            bonusHTML += `
                <div class="bonus-item">
                    <span class="bonus-icon">🏗️</span>
                    <span class="bonus-text">Standard production rates</span>
                </div>
            `;
        }
        
        bonusHTML += '</div>';
        bonusesElement.innerHTML = bonusHTML;
    }
    
    /**
     * Update upgrade progress display
     */
    updateUpgradeProgressDisplay(castle) {
        const upgradeElement = document.getElementById('upgradeProgress');
        if (!upgradeElement) return;
        
        let upgradeHTML = '<h4>Upgrade Progress</h4>';
        
        if (castle.specialization) {
            const spec = CASTLE_SPECIALIZATIONS[castle.specialization];
            upgradeHTML += '<div class="upgrade-tree">';
            
            Object.entries(spec.upgradeTree).forEach(([upgradeType, upgradeData]) => {
                const currentLevel = castle.specializedUpgrades?.[upgradeType] || 0;
                const maxLevel = upgradeData.maxLevel;
                
                upgradeHTML += `
                    <div class="upgrade-branch">
                        <div class="upgrade-header">
                            <span class="upgrade-icon">${upgradeData.icon}</span>
                            <span class="upgrade-name">${upgradeData.name}</span>
                            <span class="upgrade-level">${currentLevel}/${maxLevel}</span>
                        </div>
                        <div class="upgrade-progress-bar">
                            <div class="progress-fill" style="width: ${(currentLevel / maxLevel) * 100}%"></div>
                        </div>
                    </div>
                `;
            });
            
            upgradeHTML += '</div>';
        } else {
            upgradeHTML += '<div class="no-upgrades">Select a specialized castle to see upgrades</div>';
        }
        
        upgradeElement.innerHTML = upgradeHTML;
    }
    
    /**
     * Update conversion info display
     */
    updateConversionInfo(specialization) {
        const spec = CASTLE_SPECIALIZATIONS[specialization];
        if (!spec) return;
        
        const costElement = document.getElementById('conversionCost');
        const timeElement = document.getElementById('conversionTime');
        
        if (costElement) {
            costElement.innerHTML = `
                <span class="cost-label">Conversion Cost:</span>
                <span class="cost-value">${spec.conversionCost} gold</span>
            `;
        }
        
        if (timeElement) {
            timeElement.innerHTML = `
                <span class="time-label">Conversion Time:</span>
                <span class="time-value">10 seconds</span>
            `;
        }
    }
    
    /**
     * Show conversion progress
     */
    showConversionProgress(conversionData) {
        const { castle, targetSpecialization, duration } = conversionData;
        const spec = CASTLE_SPECIALIZATIONS[targetSpecialization];
        
        // Show notification
        if (this.mobileUI && this.mobileUI.elements.notifications) {
            this.mobileUI.elements.notifications.show(
                `🏰 Converting to ${spec.name}... (${duration / 1000}s)`,
                'info',
                duration
            );
        }
        
        // Show progress indicator on castle
        this.showCastleProgress(castle, spec, duration);
    }
    
    /**
     * Show castle progress indicator
     */
    showCastleProgress(castle, spec, duration) {
        // Create progress indicator overlay
        const progressIndicator = document.createElement('div');
        progressIndicator.className = 'castle-progress-indicator';
        progressIndicator.innerHTML = `
            <div class="progress-content">
                <div class="progress-icon">${spec.mobileIcon}</div>
                <div class="progress-text">Converting...</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="conversionProgress_${castle.id}"></div>
                </div>
            </div>
        `;
        
        // Add to castle display
        const castleElement = document.querySelector(`[data-castle-id="${castle.id}"]`);
        if (castleElement) {
            castleElement.appendChild(progressIndicator);
        }
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 100 / (duration / 100);
            const progressBar = document.getElementById(`conversionProgress_${castle.id}`);
            if (progressBar) {
                progressBar.style.width = `${Math.min(progress, 100)}%`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    if (progressIndicator.parentNode) {
                        progressIndicator.parentNode.removeChild(progressIndicator);
                    }
                }, 500);
            }
        }, 100);
    }
    
    /**
     * Show conversion complete notification
     */
    showConversionComplete(castle, spec) {
        // Show success notification
        if (this.mobileUI && this.mobileUI.elements.notifications) {
            this.mobileUI.elements.notifications.show(
                `🎉 Castle converted to ${spec.name}!`,
                'success',
                3000
            );
        }
        
        // Provide haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    /**
     * Show upgrade complete notification
     */
    showUpgradeComplete(castle, upgradeData, newLevel) {
        if (this.mobileUI && this.mobileUI.elements.notifications) {
            this.mobileUI.elements.notifications.show(
                `${upgradeData.icon} ${upgradeData.name} upgraded to level ${newLevel}!`,
                'success',
                2000
            );
        }
        
        // Provide haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
    
    /**
     * Confirm conversion from modal
     */
    confirmConversion() {
        if (!this.selectedSpecialization || !this.game.ui.selectedCastle) {
            return;
        }
        
        const castle = this.game.ui.selectedCastle;
        const player = this.game.getHumanPlayer();
        
        this.convertCastle(castle, this.selectedSpecialization, player).then(result => {
            if (result.success) {
                this.hideConversionModal();
                // Update panel with new data
                setTimeout(() => {
                    this.updateSpecializationPanel(castle);
                }, result.duration + 100);
            } else {
                // Show error notification
                if (this.mobileUI && this.mobileUI.elements.notifications) {
                    this.mobileUI.elements.notifications.show(
                        result.message,
                        'error',
                        3000
                    );
                }
            }
        });
    }
    
    /**
     * Handle specialization change events
     */
    handleSpecializationChange(data) {
        const { castle, specialization } = data;
        
        // Update displays
        this.updateSpecializationPanel(castle);
        
        // Update castle visual appearance
        this.updateCastleAppearance(castle, specialization);
    }
    
    /**
     * Update castle visual appearance based on specialization
     */
    updateCastleAppearance(castle, specialization) {
        const spec = CASTLE_SPECIALIZATIONS[specialization];
        if (!spec) return;
        
        const castleElement = document.querySelector(`[data-castle-id="${castle.id}"]`);
        if (castleElement) {
            // Add specialization class
            castleElement.className = castleElement.className.replace(/spec-\w+/g, '');
            castleElement.classList.add(`spec-${specialization.toLowerCase()}`);
            
            // Update castle icon/color
            const castleIcon = castleElement.querySelector('.castle-icon');
            if (castleIcon) {
                castleIcon.textContent = spec.mobileIcon;
                castleIcon.style.color = spec.displayColor;
            }
        }
    }
    
    /**
     * Get specialization data for castle
     */
    getCastleSpecialization(castle) {
        if (!castle.specialization) return null;
        
        return {
            type: castle.specialization,
            data: CASTLE_SPECIALIZATIONS[castle.specialization],
            upgrades: castle.specializedUpgrades || {},
            effects: castle.upgradeEffects || {}
        };
    }
    
    /**
     * Get available specializations
     */
    getAvailableSpecializations() {
        return Object.keys(CASTLE_SPECIALIZATIONS);
    }
    
    /**
     * Get specialized units for specialization type
     */
    getSpecializedUnits(specializationType) {
        const spec = CASTLE_SPECIALIZATIONS[specializationType];
        if (!spec) return [];
        
        return spec.uniqueUnits.map(unitType => SPECIALIZED_UNITS[unitType]).filter(Boolean);
    }
    
    /**
     * Mobile context menu integration
     */
    getCastleContextOptions(castle) {
        const options = [];
        
        if (castle.specialization) {
            const spec = CASTLE_SPECIALIZATIONS[castle.specialization];
            options.push({
                text: `${spec.mobileIcon} ${spec.name}`,
                action: () => this.showSpecializationPanel(castle)
            });
            
            options.push({
                text: '⬆️ Upgrade Castle',
                action: () => this.showUpgradeInterface()
            });
        }
        
        options.push({
            text: '🔄 Change Specialization',
            action: () => {
                this.game.ui.selectedCastle = castle;
                this.showConversionModal();
            }
        });
        
        return options;
    }
    
    /**
     * Cleanup and destroy specialization system
     */
    destroy() {
        // Remove UI elements
        Object.values(this.ui).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clear state
        this.activeSpecializations.clear();
        this.conversionQueue.clear();
        
        console.log('🏰 CastleSpecializationSystem destroyed');
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        CastleSpecializationSystem, 
        CASTLE_SPECIALIZATIONS, 
        SPECIALIZED_UNITS 
    };
}

// Global reference for easy access
window.CastleSpecializationSystem = CastleSpecializationSystem;