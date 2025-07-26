/**
 * TacticalUIManager - Phase 4 UI extensions for cross-platform tactical features
 * Extends MobileUIManager with desktop-class tactical interfaces
 */

/**
 * TacticalUIManager - Enhanced UI system for Phase 4 tactical features
 * Builds on MobileUIManager while adding desktop-class tactical interfaces
 */
class TacticalUIManager {
    constructor(game, mobileUIManager, tacticalCombatSystem) {
        this.game = game;
        this.mobileUI = mobileUIManager;
        this.tacticalCombat = tacticalCombatSystem;
        
        // UI state management
        this.uiState = {
            tacticalPanelVisible: false,
            formationSelectorVisible: false,
            battleAnalysisVisible: false,
            environmentalInfoVisible: false
        };
        
        // UI elements
        this.elements = {
            tacticalPanel: null,
            formationSelector: null,
            battleAnalysis: null,
            environmentalInfo: null,
            tacticalHUD: null
        };
        
        // Desktop enhancement settings
        this.desktopFeatures = {
            detailedTooltips: !this.game.mobile?.isActive,
            expandedInformation: !this.game.mobile?.isActive,
            advancedControls: !this.game.mobile?.isActive,
            multipleWindows: !this.game.mobile?.isActive
        };
        
        this.initialize();
        
        console.log('🎮 TacticalUIManager initialized - Phase 4 cross-platform tactical UI active');
    }
    
    /**
     * Initialize tactical UI components
     */
    initialize() {
        this.createTacticalElements();
        this.setupEventListeners();
        this.integrateMobileUIExtensions();
        
        // Setup responsive behavior
        this.setupResponsiveHandlers();
    }
    
    /**
     * Create tactical UI elements with responsive design
     */
    createTacticalElements() {
        // Create tactical panel - scales from mobile to desktop
        this.createTacticalPanel();
        
        // Create formation selector - touch and mouse friendly
        this.createFormationSelector();
        
        // Create battle analysis interface
        this.createBattleAnalysisPanel();
        
        // Create environmental information display
        this.createEnvironmentalInfoPanel();
        
        // Create tactical HUD overlay
        this.createTacticalHUD();
    }
    
    /**
     * Create main tactical control panel
     */
    createTacticalPanel() {
        const panel = document.createElement('div');
        panel.id = 'tacticalPanel';
        panel.className = 'tactical-panel';
        panel.innerHTML = `
            <div class="tactical-header">
                <h3>🎯 Tactical Command</h3>
                <button class="panel-toggle" onclick="tacticalUI.togglePanel('tactical')">
                    <span class="toggle-icon">📊</span>
                </button>
            </div>
            
            <div class="tactical-content">
                <div class="formation-section">
                    <h4>Formation Control</h4>
                    <div class="formation-grid" id="formationGrid">
                        <div class="formation-option" data-formation="OFFENSIVE">
                            <span class="formation-icon">⚡</span>
                            <span class="formation-name">Offensive</span>
                        </div>
                        <div class="formation-option" data-formation="DEFENSIVE">
                            <span class="formation-icon">🛡️</span>
                            <span class="formation-name">Defensive</span>
                        </div>
                        <div class="formation-option" data-formation="FLANKING">
                            <span class="formation-icon">🏃</span>
                            <span class="formation-name">Flanking</span>
                        </div>
                        <div class="formation-option" data-formation="BALANCED">
                            <span class="formation-icon">⚖️</span>
                            <span class="formation-name">Balanced</span>
                        </div>
                    </div>
                </div>
                
                <div class="environmental-section">
                    <h4>Environmental Conditions</h4>
                    <div class="environment-display" id="environmentDisplay">
                        <div class="terrain-info">
                            <span class="env-icon" id="terrainIcon">🌾</span>
                            <span class="env-name" id="terrainName">Plains</span>
                        </div>
                        <div class="weather-info">
                            <span class="env-icon" id="weatherIcon">☀️</span>
                            <span class="env-name" id="weatherName">Clear</span>
                        </div>
                    </div>
                </div>
                
                <div class="tactical-analysis">
                    <h4>Battle Analysis</h4>
                    <div class="analysis-content" id="analysisContent">
                        <div class="power-comparison">
                            <div class="power-bar">
                                <div class="attacker-power" id="attackerPowerBar"></div>
                                <div class="defender-power" id="defenderPowerBar"></div>
                            </div>
                            <div class="power-labels">
                                <span class="attacker-label">Your Forces: <strong id="attackerPower">--</strong></span>
                                <span class="defender-label">Enemy Forces: <strong id="defenderPower">--</strong></span>
                            </div>
                        </div>
                        
                        <div class="tactical-recommendations" id="tacticalRecommendations">
                            <div class="recommendation-item">
                                <span class="rec-icon">💡</span>
                                <span class="rec-text">Select armies to see tactical analysis</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Apply responsive styling
        this.applyResponsiveStyles(panel);
        
        // Add to DOM
        document.body.appendChild(panel);
        this.elements.tacticalPanel = panel;
        
        // Setup formation selection handlers
        this.setupFormationHandlers();
    }
    
    /**
     * Create formation selector interface
     */
    createFormationSelector() {
        const selector = document.createElement('div');
        selector.id = 'formationSelector';
        selector.className = 'formation-selector-modal';
        selector.innerHTML = `
            <div class="modal-overlay" onclick="tacticalUI.hideFormationSelector()"></div>
            <div class="modal-content formation-selector-content">
                <div class="modal-header">
                    <h2>🎯 Choose Formation</h2>
                    <button class="close-btn" onclick="tacticalUI.hideFormationSelector()">✕</button>
                </div>
                
                <div class="formation-options-grid">
                    <div class="formation-card" data-formation="OFFENSIVE">
                        <div class="formation-card-header">
                            <span class="formation-icon-large">⚡</span>
                            <h3>Offensive Formation</h3>
                        </div>
                        <div class="formation-description">
                            <p>Maximizes attack power but reduces defense</p>
                            <div class="formation-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">⚔️</span>
                                    <span class="stat-text">+20% Attack</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🛡️</span>
                                    <span class="stat-text">-10% Defense</span>
                                </div>
                            </div>
                            <div class="formation-advice">
                                <strong>Best against:</strong> Defensive formations<br>
                                <strong>Weak against:</strong> Flanking formations
                            </div>
                        </div>
                    </div>
                    
                    <div class="formation-card" data-formation="DEFENSIVE">
                        <div class="formation-card-header">
                            <span class="formation-icon-large">🛡️</span>
                            <h3>Defensive Formation</h3>
                        </div>
                        <div class="formation-description">
                            <p>Maximizes defense but reduces attack speed</p>
                            <div class="formation-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">🛡️</span>
                                    <span class="stat-text">+30% Defense</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">⚔️</span>
                                    <span class="stat-text">-15% Attack</span>
                                </div>
                            </div>
                            <div class="formation-advice">
                                <strong>Best against:</strong> Flanking formations<br>
                                <strong>Weak against:</strong> Offensive formations
                            </div>
                        </div>
                    </div>
                    
                    <div class="formation-card" data-formation="FLANKING">
                        <div class="formation-card-header">
                            <span class="formation-icon-large">🏃</span>
                            <h3>Flanking Formation</h3>
                        </div>
                        <div class="formation-description">
                            <p>Fast movement, effective against defensive positions</p>
                            <div class="formation-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">💨</span>
                                    <span class="stat-text">+30% Speed</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🎯</span>
                                    <span class="stat-text">+25% Flanking</span>
                                </div>
                            </div>
                            <div class="formation-advice">
                                <strong>Best against:</strong> Defensive formations<br>
                                <strong>Weak against:</strong> Offensive formations
                            </div>
                        </div>
                    </div>
                    
                    <div class="formation-card" data-formation="BALANCED">
                        <div class="formation-card-header">
                            <span class="formation-icon-large">⚖️</span>
                            <h3>Balanced Formation</h3>
                        </div>
                        <div class="formation-description">
                            <p>No bonuses or penalties, adaptable to any situation</p>
                            <div class="formation-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">🔄</span>
                                    <span class="stat-text">Neutral</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🎯</span>
                                    <span class="stat-text">Adaptable</span>
                                </div>
                            </div>
                            <div class="formation-advice">
                                <strong>Effective against:</strong> All situations<br>
                                <strong>Specialty:</strong> Versatility and adaptation
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="formation-selector-actions">
                    <button class="btn-primary" onclick="tacticalUI.applySelectedFormation()">
                        Apply Formation
                    </button>
                    <button class="btn-secondary" onclick="tacticalUI.hideFormationSelector()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(selector);
        this.elements.formationSelector = selector;
        
        // Setup formation card selection
        this.setupFormationCardHandlers();
    }
    
    /**
     * Create battle analysis panel
     */
    createBattleAnalysisPanel() {
        const panel = document.createElement('div');
        panel.id = 'battleAnalysisPanel';
        panel.className = 'battle-analysis-panel';
        panel.innerHTML = `
            <div class="analysis-header">
                <h3>📊 Tactical Analysis</h3>
                <button class="panel-toggle" onclick="tacticalUI.togglePanel('analysis')">
                    <span class="toggle-icon">📈</span>
                </button>
            </div>
            
            <div class="analysis-content">
                <div class="power-analysis">
                    <h4>Power Assessment</h4>
                    <div class="power-breakdown" id="powerBreakdown">
                        <div class="army-power-display">
                            <div class="army-side attacker">
                                <h5>Your Forces</h5>
                                <div class="power-number" id="analysisAttackerPower">0</div>
                                <div class="unit-breakdown" id="analysisAttackerUnits"></div>
                            </div>
                            <div class="vs-separator">VS</div>
                            <div class="army-side defender">
                                <h5>Enemy Forces</h5>
                                <div class="power-number" id="analysisDefenderPower">0</div>
                                <div class="unit-breakdown" id="analysisDefenderUnits"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tactical-factors">
                    <h4>Tactical Factors</h4>
                    <div class="factors-list" id="tacticalFactors">
                        <div class="factor-item">
                            <span class="factor-icon">🌾</span>
                            <span class="factor-text">Terrain: Plains (+10% cavalry)</span>
                        </div>
                        <div class="factor-item">
                            <span class="factor-icon">☀️</span>
                            <span class="factor-text">Weather: Clear (no effects)</span>
                        </div>
                    </div>
                </div>
                
                <div class="battle-prediction">
                    <h4>Battle Prediction</h4>
                    <div class="prediction-content" id="predictionContent">
                        <div class="outcome-indicator" id="outcomeIndicator">
                            <div class="outcome-icon">🎯</div>
                            <div class="outcome-text">Select armies for prediction</div>
                            <div class="confidence-meter">
                                <div class="confidence-fill" id="confidenceFill"></div>
                            </div>
                        </div>
                        
                        <div class="recommendations" id="battleRecommendations">
                            <div class="recommendation">
                                <span class="rec-icon">💡</span>
                                <span class="rec-text">Analyze battle conditions for tactical advice</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.elements.battleAnalysis = panel;
    }
    
    /**
     * Create environmental information panel
     */
    createEnvironmentalInfoPanel() {
        const panel = document.createElement('div');
        panel.id = 'environmentalPanel';
        panel.className = 'environmental-panel';
        panel.innerHTML = `
            <div class="env-header">
                <h3>🌍 Environmental Conditions</h3>
                <button class="panel-toggle" onclick="tacticalUI.togglePanel('environmental')">
                    <span class="toggle-icon">🌦️</span>
                </button>
            </div>
            
            <div class="env-content">
                <div class="terrain-section">
                    <h4>Terrain Effects</h4>
                    <div class="terrain-selector" id="terrainSelector">
                        <div class="terrain-option" data-terrain="PLAINS">
                            <span class="terrain-icon">🌾</span>
                            <span class="terrain-name">Plains</span>
                        </div>
                        <div class="terrain-option" data-terrain="FOREST">
                            <span class="terrain-icon">🌲</span>
                            <span class="terrain-name">Forest</span>
                        </div>
                        <div class="terrain-option" data-terrain="HILLS">
                            <span class="terrain-icon">⛰️</span>
                            <span class="terrain-name">Hills</span>
                        </div>
                        <div class="terrain-option" data-terrain="SWAMP">
                            <span class="terrain-icon">🦆</span>
                            <span class="terrain-name">Swamp</span>
                        </div>
                    </div>
                    <div class="terrain-effects" id="terrainEffects">
                        <p>Select terrain to see effects</p>
                    </div>
                </div>
                
                <div class="weather-section">
                    <h4>Weather Conditions</h4>
                    <div class="weather-selector" id="weatherSelector">
                        <div class="weather-option" data-weather="CLEAR">
                            <span class="weather-icon">☀️</span>
                            <span class="weather-name">Clear</span>
                        </div>
                        <div class="weather-option" data-weather="RAIN">
                            <span class="weather-icon">🌧️</span>
                            <span class="weather-name">Rain</span>
                        </div>
                        <div class="weather-option" data-weather="FOG">
                            <span class="weather-icon">🌫️</span>
                            <span class="weather-name">Fog</span>
                        </div>
                        <div class="weather-option" data-weather="SNOW">
                            <span class="weather-icon">❄️</span>
                            <span class="weather-name">Snow</span>
                        </div>
                    </div>
                    <div class="weather-effects" id="weatherEffects">
                        <p>Select weather to see effects</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.elements.environmentalInfo = panel;
        
        // Setup environmental selection handlers
        this.setupEnvironmentalHandlers();
    }
    
    /**
     * Create tactical HUD overlay
     */
    createTacticalHUD() {
        const hud = document.createElement('div');
        hud.id = 'tacticalHUD';
        hud.className = 'tactical-hud';
        hud.innerHTML = `
            <div class="hud-section formation-display">
                <span class="hud-label">Formation:</span>
                <span class="hud-value" id="currentFormation">
                    <span class="formation-icon">⚖️</span>
                    <span class="formation-text">Balanced</span>
                </span>
            </div>
            
            <div class="hud-section environment-display">
                <span class="hud-label">Environment:</span>
                <span class="hud-value" id="currentEnvironment">
                    <span class="env-icon">🌾</span>
                    <span class="env-text">Plains</span>
                    <span class="weather-icon">☀️</span>
                </span>
            </div>
            
            <div class="hud-section battle-status">
                <span class="hud-label">Battle Readiness:</span>
                <span class="hud-value" id="battleReadiness">
                    <span class="readiness-indicator ready">⚔️</span>
                    <span class="readiness-text">Ready</span>
                </span>
            </div>
        `;
        
        document.body.appendChild(hud);
        this.elements.tacticalHUD = hud;
    }
    
    /**
     * Apply responsive styles based on device type
     */
    applyResponsiveStyles(element) {
        if (this.game.mobile?.isActive) {
            element.classList.add('mobile-optimized');
        } else {
            element.classList.add('desktop-enhanced');
        }
        
        // Add touch-friendly styling for touch devices
        if ('ontouchstart' in window) {
            element.classList.add('touch-enabled');
        }
    }
    
    /**
     * Setup formation selection handlers
     */
    setupFormationHandlers() {
        const formationOptions = document.querySelectorAll('.formation-option');
        formationOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const formation = e.currentTarget.dataset.formation;
                this.selectFormation(formation);
            });
            
            // Touch handlers for mobile
            if ('ontouchstart' in window) {
                option.addEventListener('touchstart', (e) => {
                    e.currentTarget.classList.add('touched');
                });
                
                option.addEventListener('touchend', (e) => {
                    e.currentTarget.classList.remove('touched');
                });
            }
        });
    }
    
    /**
     * Setup formation card handlers for detailed selector
     */
    setupFormationCardHandlers() {
        const formationCards = document.querySelectorAll('.formation-card');
        formationCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Remove selection from other cards
                formationCards.forEach(c => c.classList.remove('selected'));
                
                // Select this card
                e.currentTarget.classList.add('selected');
                this.selectedFormation = e.currentTarget.dataset.formation;
                
                // Provide haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            });
        });
    }
    
    /**
     * Setup environmental condition handlers
     */
    setupEnvironmentalHandlers() {
        // Terrain selection
        const terrainOptions = document.querySelectorAll('.terrain-option');
        terrainOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const terrain = e.currentTarget.dataset.terrain;
                this.selectTerrain(terrain);
            });
        });
        
        // Weather selection
        const weatherOptions = document.querySelectorAll('.weather-option');
        weatherOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const weather = e.currentTarget.dataset.weather;
                this.selectWeather(weather);
            });
        });
    }
    
    /**
     * Setup event listeners for tactical UI
     */
    setupEventListeners() {
        // Listen for tactical battle events
        window.addEventListener('tacticalBattleResolved', (event) => {
            this.updateBattleAnalysis(event.detail);
        });
        
        // Listen for army selection changes
        window.addEventListener('armySelected', (event) => {
            this.updateTacticalAnalysis(event.detail.army);
        });
        
        // Listen for formation changes
        window.addEventListener('formationChanged', (event) => {
            this.updateFormationDisplay(event.detail);
        });
        
        // Keyboard shortcuts (desktop only)
        if (!this.game.mobile?.isActive) {
            this.setupKeyboardShortcuts();
        }
    }
    
    /**
     * Setup keyboard shortcuts for desktop
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        this.showFormationSelector();
                        break;
                    case 't':
                        e.preventDefault();
                        this.togglePanel('tactical');
                        break;
                    case 'a':
                        e.preventDefault();
                        this.togglePanel('analysis');  
                        break;
                    case 'e':
                        e.preventDefault();
                        this.togglePanel('environmental');
                        break;
                }
            }
        });
    }
    
    /**
     * Integrate with existing mobile UI system
     */
    integrateMobileUIExtensions() {
        if (!this.mobileUI) return;
        
        // Add tactical options to mobile context menus
        const originalShowContextMenu = this.mobileUI.showContextMenu.bind(this.mobileUI);
        this.mobileUI.showContextMenu = (x, y, options) => {
            // Add tactical options if appropriate
            const tacticalOptions = this.getTacticalContextOptions();
            const enhancedOptions = [...options, ...tacticalOptions];
            
            return originalShowContextMenu(x, y, enhancedOptions);
        };
        
        // Extend mobile HUD with tactical information
        if (this.mobileUI.elements && this.mobileUI.elements.hud) {
            this.extendMobileHUD();
        }
    }
    
    /**
     * Get tactical options for context menus
     */
    getTacticalContextOptions() {
        return [
            {
                text: '🎯 Formation Options',
                action: () => this.showFormationSelector()
            },
            {
                text: '📊 Battle Analysis',
                action: () => this.togglePanel('analysis')
            },
            {
                text: '🌍 Environment',
                action: () => this.togglePanel('environmental')
            }
        ];
    }
    
    /**
     * Extend mobile HUD with tactical information
     */
    extendMobileHUD() {
        const tacticalSection = document.createElement('div');
        tacticalSection.className = 'mobile-tactical-section';
        tacticalSection.innerHTML = `
            <div class="mobile-formation-indicator">
                <span class="formation-icon">⚖️</span>
                <span class="formation-name">Balanced</span>
            </div>
        `;
        
        this.mobileUI.elements.hud.appendChild(tacticalSection);
    }
    
    /**
     * Setup responsive behavior handlers
     */
    setupResponsiveHandlers() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustForOrientation();
            }, 100);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.adjustForScreenSize();
        });
    }
    
    /**
     * Adjust UI for orientation changes
     */
    adjustForOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.classList.toggle('portrait-mode', isPortrait);
                element.classList.toggle('landscape-mode', !isPortrait);
            }
        });
    }
    
    /**
     * Adjust UI for screen size changes
     */
    adjustForScreenSize() {
        const screenWidth = window.innerWidth;
        const isSmallScreen = screenWidth < 768;
        const isMediumScreen = screenWidth >= 768 && screenWidth < 1024;
        const isLargeScreen = screenWidth >= 1024;
        
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.classList.toggle('small-screen', isSmallScreen);
                element.classList.toggle('medium-screen', isMediumScreen);
                element.classList.toggle('large-screen', isLargeScreen);
            }
        });
    }
    
    /**
     * Public API methods for tactical UI management
     */
    
    /**
     * Show formation selector
     */
    showFormationSelector() {
        if (this.elements.formationSelector) {
            this.elements.formationSelector.style.display = 'flex';
            this.uiState.formationSelectorVisible = true;
            
            // Focus first formation option for accessibility
            const firstOption = this.elements.formationSelector.querySelector('.formation-card');
            if (firstOption) {
                firstOption.focus();
            }
        }
    }
    
    /**
     * Hide formation selector
     */
    hideFormationSelector() {
        if (this.elements.formationSelector) {
            this.elements.formationSelector.style.display = 'none';
            this.uiState.formationSelectorVisible = false;
        }
    }
    
    /**
     * Apply selected formation
     */
    applySelectedFormation() {
        if (this.selectedFormation && this.game.ui.selectedArmy) {
            this.tacticalCombat.setArmyFormation(this.game.ui.selectedArmy, this.selectedFormation);
            this.hideFormationSelector();
            
            // Update displays
            this.updateFormationDisplay({
                army: this.game.ui.selectedArmy,
                formation: this.selectedFormation
            });
        }
    }
    
    /**
     * Select formation (quick selection)
     */
    selectFormation(formation) {
        if (this.game.ui.selectedArmy) {
            this.tacticalCombat.setArmyFormation(this.game.ui.selectedArmy, formation);
        } else {
            // Show notification about selecting army first
            if (this.mobileUI && this.mobileUI.elements.notifications) {
                this.mobileUI.elements.notifications.show(
                    'Select an army first to change formation',
                    'warning',
                    2000
                );
            }
        }
    }
    
    /**
     * Select terrain type
     */
    selectTerrain(terrain) {
        // Remove selection from other terrain options
        document.querySelectorAll('.terrain-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select new terrain
        const terrainOption = document.querySelector(`[data-terrain="${terrain}"]`);
        if (terrainOption) {
            terrainOption.classList.add('selected');
        }
        
        // Update terrain effects display
        this.updateTerrainEffectsDisplay(terrain);
        
        // Update game state
        this.game.currentTerrain = terrain;
        
        // Trigger terrain change event
        window.dispatchEvent(new CustomEvent('terrainChanged', {
            detail: { terrain: terrain }
        }));
    }
    
    /**
     * Select weather condition
     */
    selectWeather(weather) {
        // Remove selection from other weather options
        document.querySelectorAll('.weather-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select new weather
        const weatherOption = document.querySelector(`[data-weather="${weather}"]`);
        if (weatherOption) {
            weatherOption.classList.add('selected');
        }
        
        // Update weather effects display
        this.updateWeatherEffectsDisplay(weather);
        
        // Update game state
        this.game.currentWeather = weather;
        
        // Trigger weather change event
        window.dispatchEvent(new CustomEvent('weatherChanged', {
            detail: { weather: weather }
        }));
    }
    
    /**
     * Toggle tactical panel visibility
     */
    togglePanel(panelType) {
        const panelMap = {
            'tactical': this.elements.tacticalPanel,
            'analysis': this.elements.battleAnalysis,
            'environmental': this.elements.environmentalInfo
        };
        
        const panel = panelMap[panelType];
        if (panel) {
            const isVisible = !panel.classList.contains('hidden');
            panel.classList.toggle('hidden', isVisible);
            
            // Update state
            this.uiState[`${panelType}PanelVisible`] = !isVisible;
        }
    }
    
    /**
     * Update tactical analysis display
     */
    updateTacticalAnalysis(army) {
        if (!army) return;
        
        // Update power analysis
        const power = this.tacticalCombat.mobileCombat.calculateArmyPower(army);
        const composition = this.tacticalCombat.mobileCombat.calculateArmyComposition(army);
        
        // Update UI elements
        if (document.getElementById('attackerPower')) {
            document.getElementById('attackerPower').textContent = power.toLocaleString();
        }
        
        // Update formation display
        if (army.formation) {
            this.updateFormationDisplay({ army, formation: army.formation });
        }
        
        // Generate tactical recommendations
        if (this.game.ui.selectedTarget) {
            const recommendations = this.tacticalCombat.getTacticalRecommendations(
                army,
                this.game.ui.selectedTarget,
                {
                    terrain: this.game.currentTerrain,
                    weather: this.game.currentWeather
                }
            );
            
            this.updateRecommendationsDisplay(recommendations);
        }
    }
    
    /**
     * Update battle analysis after tactical battle
     */
    updateBattleAnalysis(battleData) {
        const { result, tacticalData } = battleData;
        
        // Update power displays
        if (document.getElementById('analysisAttackerPower')) {
            document.getElementById('analysisAttackerPower').textContent = 
                result.mobileDisplay.attackerPowerAfter.toLocaleString();
        }
        
        if (document.getElementById('analysisDefenderPower')) {
            document.getElementById('analysisDefenderPower').textContent = 
                result.mobileDisplay.defenderPowerAfter.toLocaleString();
        }
        
        // Update tactical factors
        this.updateTacticalFactorsDisplay(tacticalData);
        
        // Update battle prediction
        this.updateBattlePredictionDisplay(result);
    }
    
    /**
     * Update formation display in UI
     */
    updateFormationDisplay(data) {
        const { formation } = data;
        const formationData = this.tacticalCombat.formationSystem.constructor.TACTICAL_FORMATIONS?.[formation];
        
        if (!formationData) return;
        
        // Update HUD
        const currentFormation = document.getElementById('currentFormation');
        if (currentFormation) {
            currentFormation.innerHTML = `
                <span class="formation-icon">${formationData.mobileIcon}</span>
                <span class="formation-text">${formationData.name}</span>
            `;
        }
        
        // Update tactical panel
        document.querySelectorAll('.formation-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.formation === formation);
        });
    }
    
    /**
     * Update terrain effects display
     */
    updateTerrainEffectsDisplay(terrain) {
        const terrainData = this.tacticalCombat.terrainSystem.constructor.TERRAIN_TYPES?.[terrain];
        if (!terrainData) return;
        
        const effectsElement = document.getElementById('terrainEffects');
        if (effectsElement) {
            let effectsHTML = `<h5>${terrainData.mobileIcon} ${terrainData.name}</h5>`;
            effectsHTML += `<p>${terrainData.description}</p>`;
            
            if (terrainData.modifiers) {
                effectsHTML += '<ul class="effects-list">';
                Object.entries(terrainData.modifiers).forEach(([modifier, value]) => {
                    const effectText = this.formatModifierText(modifier, value);
                    if (effectText) {
                        effectsHTML += `<li>${effectText}</li>`;
                    }
                });
                effectsHTML += '</ul>';
            }
            
            effectsElement.innerHTML = effectsHTML;
        }
    }
    
    /**
     * Update weather effects display
     */
    updateWeatherEffectsDisplay(weather) {
        const weatherData = this.tacticalCombat.weatherSystem.constructor.WEATHER_CONDITIONS?.[weather];
        if (!weatherData) return;
        
        const effectsElement = document.getElementById('weatherEffects');
        if (effectsElement) {
            let effectsHTML = `<h5>${weatherData.mobileIcon} ${weatherData.name}</h5>`;
            effectsHTML += `<p>${weatherData.description}</p>`;
            
            if (weatherData.modifiers && Object.keys(weatherData.modifiers).length > 0) {
                effectsHTML += '<ul class="effects-list">';
                Object.entries(weatherData.modifiers).forEach(([modifier, value]) => {
                    const effectText = this.formatModifierText(modifier, value);
                    if (effectText) {
                        effectsHTML += `<li>${effectText}</li>`;
                    }
                });
                effectsHTML += '</ul>';
            } else {
                effectsHTML += '<p>No special effects</p>';
            }
            
            effectsElement.innerHTML = effectsHTML;
        }
    }
    
    /**
     * Format modifier text for display
     */
    formatModifierText(modifier, value) {
        const modifierDescriptions = {
            cavalryBonus: `+${Math.round(value * 100)}% cavalry effectiveness`,
            cavalryPenalty: `-${Math.round(value * 100)}% cavalry effectiveness`,
            archerBonus: `+${Math.round(value * 100)}% archer effectiveness`,
            archerPenalty: `-${Math.round(value * 100)}% archer effectiveness`,
            infantryBonus: `+${Math.round(value * 100)}% infantry effectiveness`,
            defenseBonus: `+${Math.round(value * 100)}% defensive bonus`,
            moveSpeedReduction: `-${Math.round(value * 100)}% movement speed`,
            visibilityReduction: `-${Math.round(value * 100)}% visibility range`
        };
        
        return modifierDescriptions[modifier] || `${modifier}: ${value}`;
    }
    
    /**
     * Update tactical factors display
     */
    updateTacticalFactorsDisplay(tacticalData) {
        const factorsElement = document.getElementById('tacticalFactors');
        if (!factorsElement || !tacticalData) return;
        
        let factorsHTML = '';
        
        // Formation advantages
        if (tacticalData.formationAdvantages) {
            tacticalData.formationAdvantages.forEach(advantage => {
                factorsHTML += `
                    <div class="factor-item">
                        <span class="factor-icon">⚔️</span>
                        <span class="factor-text">${advantage.description}</span>
                    </div>
                `;
            });
        }
        
        // Environmental effects
        if (tacticalData.environmentalEffects) {
            tacticalData.environmentalEffects.forEach(effect => {
                factorsHTML += `
                    <div class="factor-item">
                        <span class="factor-icon">🌍</span>
                        <span class="factor-text">${effect.description}</span>
                    </div>
                `;
            });
        }
        
        factorsElement.innerHTML = factorsHTML;
    }
    
    /**
     * Update battle prediction display
     */
    updateBattlePredictionDisplay(result) {
        const outcomeElement = document.getElementById('outcomeIndicator');
        if (!outcomeElement) return;
        
        const attackerPower = result.mobileDisplay.attackerPowerAfter;
        const defenderPower = result.mobileDisplay.defenderPowerAfter;
        
        let outcome, icon, confidence;
        
        if (attackerPower > defenderPower * 1.5) {
            outcome = 'Likely Victory';
            icon = '🎉';
            confidence = 0.8;
        } else if (attackerPower > defenderPower * 1.2) {
            outcome = 'Probable Victory';
            icon = '✅';
            confidence = 0.65;
        } else if (attackerPower < defenderPower * 0.7) {
            outcome = 'Likely Defeat';
            icon = '💀';
            confidence = 0.8;
        } else if (attackerPower < defenderPower * 0.9) {
            outcome = 'Difficult Battle';
            icon = '⚔️';
            confidence = 0.6;
        } else {
            outcome = 'Close Battle';
            icon = '🎯';
            confidence = 0.5;
        }
        
        outcomeElement.innerHTML = `
            <div class="outcome-icon">${icon}</div>
            <div class="outcome-text">${outcome}</div>
            <div class="confidence-meter">
                <div class="confidence-fill" style="width: ${confidence * 100}%"></div>
            </div>
        `;
    }
    
    /**
     * Update recommendations display
     */
    updateRecommendationsDisplay(recommendations) {
        const recommendationsElement = document.getElementById('battleRecommendations');
        if (!recommendationsElement || !recommendations) return;
        
        let recHTML = '';
        
        if (recommendations.formation) {
            recHTML += `
                <div class="recommendation">
                    <span class="rec-icon">🎯</span>
                    <span class="rec-text">Formation: ${recommendations.formation.formation} - ${recommendations.formation.reasoning}</span>
                </div>
            `;
        }
        
        if (recommendations.tactics && recommendations.tactics.length > 0) {
            recommendations.tactics.forEach(tactic => {
                recHTML += `
                    <div class="recommendation">
                        <span class="rec-icon">💡</span>
                        <span class="rec-text">${tactic}</span>
                    </div>
                `;
            });
        }
        
        recommendationsElement.innerHTML = recHTML;
    }
    
    /**
     * Get current tactical state
     */
    getTacticalState() {
        return {
            ...this.uiState,
            currentTerrain: this.game.currentTerrain,
            currentWeather: this.game.currentWeather,
            selectedFormation: this.selectedFormation
        };
    }
    
    /**
     * Cleanup and destroy tactical UI
     */
    destroy() {
        // Remove all created elements
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clean up event listeners
        window.removeEventListener('tacticalBattleResolved', this.updateBattleAnalysis);
        window.removeEventListener('armySelected', this.updateTacticalAnalysis);
        window.removeEventListener('formationChanged', this.updateFormationDisplay);
        
        console.log('🎮 TacticalUIManager destroyed');
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TacticalUIManager;
}

// Global reference for easy access
window.TacticalUIManager = TacticalUIManager;