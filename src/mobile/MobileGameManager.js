/**
 * MobileGameManager - Central coordinator for all mobile optimizations
 * Integrates all mobile systems for a cohesive 2025 mobile gaming experience
 */
class MobileGameManager {
    constructor(game) {
        this.game = game;
        this.isInitialized = false;
        this.isActive = false;
        
        // Mobile system components
        this.mobileOptimizer = null;
        this.touchManager = null;
        this.performanceManager = null;
        this.uiManager = null;
        this.combatSystem = null;
        
        // Mobile game state
        this.mobileSettings = {
            touchControlsEnabled: true,
            hapticFeedbackEnabled: true,
            adaptivePerformanceEnabled: true,
            mobileUIEnabled: true,
            batteryOptimizationEnabled: true,
            accessibilityEnabled: true
        };
        
        // Integration state
        this.systemsReady = {
            optimizer: false,
            touch: false,
            performance: false,
            ui: false,
            combat: false
        };
        
        console.log('📱 MobileGameManager created');
    }
    
    /**
     * Initialize all mobile systems
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('📱 MobileGameManager already initialized');
            return;
        }
        
        console.log('📱 Initializing mobile systems...');
        
        try {
            // Initialize systems in dependency order
            await this.initializeMobileOptimizer();
            await this.initializeTouchManager();
            await this.initializePerformanceManager();
            await this.initializeUIManager();
            await this.initializeCombatSystem();
            
            // Setup system integrations
            this.setupSystemIntegrations();
            
            // Apply initial mobile optimizations
            this.applyMobileOptimizations();
            
            // Start mobile-specific game loop enhancements
            this.startMobileGameLoop();
            
            this.isInitialized = true;
            this.isActive = true;
            
            console.log('📱 Mobile systems fully initialized and active');
            
            // Trigger mobile-ready event
            this.triggerMobileReadyEvent();
            
        } catch (error) {
            console.error('📱 Mobile system initialization failed:', error);
            this.handleInitializationFailure(error);
        }
    }
    
    /**
     * Initialize mobile optimizer
     */
    async initializeMobileOptimizer() {
        console.log('📱 Initializing MobileOptimizer...');
        
        try {
            this.mobileOptimizer = new MobileOptimizer(this.game);
            this.systemsReady.optimizer = true;
            
            console.log('✅ MobileOptimizer ready');
        } catch (error) {
            console.error('❌ MobileOptimizer initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize touch manager
     */
    async initializeTouchManager() {
        console.log('📱 Initializing TouchManager...');
        
        try {
            this.touchManager = new TouchManager(this.game.canvas, this.game);
            this.systemsReady.touch = true;
            
            console.log('✅ TouchManager ready');
        } catch (error) {
            console.error('❌ TouchManager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize performance manager
     */
    async initializePerformanceManager() {
        console.log('📱 Initializing MobilePerformanceManager...');
        
        try {
            this.performanceManager = new MobilePerformanceManager(this.game, this.mobileOptimizer);
            this.systemsReady.performance = true;
            
            console.log('✅ MobilePerformanceManager ready');
        } catch (error) {
            console.error('❌ MobilePerformanceManager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize UI manager
     */
    async initializeUIManager() {
        console.log('📱 Initializing MobileUIManager...');
        
        try {
            this.uiManager = new MobileUIManager(this.game, this.mobileOptimizer);
            this.systemsReady.ui = true;
            
            console.log('✅ MobileUIManager ready');
        } catch (error) {
            console.error('❌ MobileUIManager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize combat system
     */
    async initializeCombatSystem() {
        console.log('📱 Initializing MobileCombatSystem...');
        
        try {
            this.combatSystem = new MobileCombatSystem(this.game, this.uiManager);
            this.systemsReady.combat = true;
            
            // Replace game's combat system with mobile version
            if (this.game.systems && this.game.systems.combat) {
                this.game.systems.combat = this.combatSystem;
            }
            
            console.log('✅ MobileCombatSystem ready');
        } catch (error) {
            console.error('❌ MobileCombatSystem initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Setup integrations between mobile systems
     */
    setupSystemIntegrations() {
        console.log('📱 Setting up system integrations...');
        
        // Integrate touch manager with UI manager
        if (this.touchManager && this.uiManager) {
            this.setupTouchUIIntegration();
        }
        
        // Integrate performance manager with all systems
        if (this.performanceManager) {
            this.setupPerformanceIntegrations();
        }
        
        // Integrate mobile optimizer with game systems
        if (this.mobileOptimizer) {
            this.setupOptimizerIntegrations();
        }
        
        // Setup mobile-specific event handlers
        this.setupMobileEventHandlers();
        
        console.log('✅ System integrations complete');
    }
    
    /**
     * Setup touch and UI integration
     */
    setupTouchUIIntegration() {
        // Connect touch events to UI elements
        this.touchManager.callbacks.onTap = (position) => {
            this.handleMobileTap(position);
        };
        
        this.touchManager.callbacks.onLongPress = (position) => {
            this.handleMobileLongPress(position);
        };
        
        this.touchManager.callbacks.onDoubleTap = (position) => {
            this.handleMobileDoubleTap(position);
        };
        
        console.log('📱 Touch-UI integration setup complete');
    }
    
    /**
     * Setup performance manager integrations
     */
    setupPerformanceIntegrations() {
        // Connect performance manager to all systems
        const systems = [
            this.touchManager,
            this.uiManager,
            this.combatSystem,
            this.mobileOptimizer
        ];
        
        systems.forEach(system => {
            if (system && typeof system.onPerformanceChange === 'function') {
                // This would be called when performance levels change
                system.onPerformanceChange = (newSettings) => {
                    console.log(`📱 Performance change applied to ${system.constructor.name}`);
                };
            }
        });
    }
    
    /**
     * Setup mobile optimizer integrations
     */
    setupOptimizerIntegrations() {
        // Apply optimizations to existing game systems
        if (this.game.systems) {
            Object.values(this.game.systems).forEach(system => {
                if (system && typeof system.onSettingsChange === 'function') {
                    system.onSettingsChange(this.mobileOptimizer.optimizedSettings);
                }
            });
        }
    }
    
    /**
     * Setup mobile-specific event handlers
     */
    setupMobileEventHandlers() {
        // App lifecycle events
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppBackground();
            } else {
                this.handleAppForeground();
            }
        });
        
        // Orientation change events
        window.addEventListener('mobileOrientationChange', (event) => {
            this.handleOrientationChange(event.detail);
        });
        
        // Device events
        window.addEventListener('devicemotion', (event) => {
            this.handleDeviceMotion(event);
        });
        
        console.log('📱 Mobile event handlers setup complete');
    }
    
    /**
     * Apply initial mobile optimizations
     */
    applyMobileOptimizations() {
        console.log('📱 Applying mobile optimizations...');
        
        // Apply device-specific optimizations
        const deviceInfo = this.mobileOptimizer.getDeviceInfo();
        
        if (deviceInfo.isMobile) {
            // Mobile-specific game settings
            if (this.game.settings) {
                this.game.settings.isMobile = true;
                this.game.settings.touchControlsEnabled = true;
                this.game.settings.mobileOptimized = true;
                
                // Performance optimizations
                Object.assign(this.game.settings, deviceInfo.settings);
            }
            
            // Add mobile CSS class for styling
            document.body.classList.add('mobile-game');
            
            // Setup mobile viewport
            this.setupMobileViewport();
        }
        
        console.log('✅ Mobile optimizations applied');
    }
    
    /**
     * Setup mobile viewport and meta tags
     */
    setupMobileViewport() {
        // Ensure proper viewport meta tag
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        
        // Add other mobile meta tags
        const mobileMetaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'theme-color', content: '#000000' }
        ];
        
        mobileMetaTags.forEach(tag => {
            let meta = document.querySelector(`meta[name="${tag.name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = tag.name;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });
        
        console.log('📱 Mobile viewport configured');
    }
    
    /**
     * Start mobile-specific game loop enhancements
     */
    startMobileGameLoop() {
        console.log('📱 Starting mobile game loop enhancements...');
        
        // Enhance existing game update loop
        const originalUpdate = this.game.update.bind(this.game);
        
        this.game.update = () => {
            // Run original update
            originalUpdate();
            
            // Mobile-specific updates
            this.updateMobileSystems();
        };
        
        console.log('✅ Mobile game loop active');
    }
    
    /**
     * Update mobile systems each frame
     */
    updateMobileSystems() {
        // Update performance metrics
        if (this.performanceManager && this.performanceManager.isActive) {
            // Performance manager has its own monitoring loops
        }
        
        // Update UI animations if enabled
        if (this.uiManager && this.uiManager.animationsEnabled) {
            // UI manager handles its own animations
        }
        
        // Update mobile-specific game state
        this.updateMobileGameState();
    }
    
    /**
     * Update mobile-specific game state
     */
    updateMobileGameState() {
        // Check for mobile-specific conditions
        if (this.mobileOptimizer && this.mobileOptimizer.isMobile) {
            // Update HUD with mobile-optimized data
            if (this.uiManager && this.game.players) {
                const humanPlayer = this.game.players.find(p => p.isHuman);
                if (humanPlayer) {
                    this.uiManager.updateHUD({
                        gold: humanPlayer.resources?.gold || 0,
                        population: this.calculatePlayerPopulation(humanPlayer),
                        time: this.formatGameTime(Date.now() - this.game.gameStartTime)
                    });
                }
            }
        }
    }
    
    /**
     * Mobile event handlers
     */
    handleMobileTap(position) {
        // Enhanced tap handling for mobile
        console.log('📱 Mobile tap:', position);
        
        // Check if tap hit any UI elements first
        if (this.uiManager && this.uiManager.handleTap) {
            const uiHandled = this.uiManager.handleTap(position);
            if (uiHandled) return;
        }
        
        // Pass to touch manager's game tap handler
        if (this.touchManager && this.touchManager.handleGameTap) {
            this.touchManager.handleGameTap(position);
        }
    }
    
    handleMobileLongPress(position) {
        console.log('📱 Mobile long press:', position);
        
        // Show mobile context menu
        if (this.uiManager) {
            const gridPos = this.game.screenToGrid(position.x, position.y);
            this.showMobileContextMenu(gridPos.x, gridPos.y, position);
        }
    }
    
    handleMobileDoubleTap(position) {
        console.log('📱 Mobile double tap:', position);
        
        // Pass to touch manager
        if (this.touchManager && this.touchManager.handleGameDoubleTap) {
            this.touchManager.handleGameDoubleTap(position);
        }
    }
    
    handleAppBackground() {
        console.log('📱 App backgrounded - activating mobile power saving');
        
        // Pause non-essential systems
        if (this.performanceManager) {
            this.performanceManager.enableEmergencyMode();
        }
        
        // Pause animations
        if (this.uiManager) {
            this.uiManager.animationsEnabled = false;
        }
        
        // Reduce game update frequency
        if (this.game.settings) {
            this.game.settings.backgroundUpdateFrequency = 1; // 1 FPS when backgrounded
        }
    }
    
    handleAppForeground() {
        console.log('📱 App foregrounded - resuming normal operation');
        
        // Resume normal performance
        if (this.performanceManager) {
            this.performanceManager.disableEmergencyMode();
        }
        
        // Resume animations
        if (this.uiManager) {
            this.uiManager.animationsEnabled = true;
        }
        
        // Resume normal update frequency
        if (this.game.settings) {
            delete this.game.settings.backgroundUpdateFrequency;
        }
    }
    
    handleOrientationChange(screenInfo) {
        console.log('📱 Mobile orientation change handled by manager');
        
        // Coordinate orientation change across all systems
        if (this.performanceManager) {
            // Performance manager might need to adjust for new screen size
            this.performanceManager.handleOrientationChange(screenInfo);
        }
    }
    
    handleDeviceMotion(event) {
        // Handle device motion for potential game features
        // (e.g., shake to randomize, tilt for camera)
        if (event.accelerationIncludingGravity) {
            const acceleration = event.accelerationIncludingGravity;
            const magnitude = Math.sqrt(
                acceleration.x * acceleration.x +
                acceleration.y * acceleration.y +
                acceleration.z * acceleration.z
            );
            
            // Detect significant shake
            if (magnitude > 20) {
                this.handleDeviceShake();
            }
        }
    }
    
    handleDeviceShake() {
        console.log('📱 Device shake detected');
        
        // Provide haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Could trigger game features like shuffle, refresh, etc.
    }
    
    /**
     * Mobile-specific game methods
     */
    showMobileContextMenu(gridX, gridY, screenPosition) {
        if (!this.uiManager) return;
        
        const options = [];
        
        // Check what's at this position
        const castle = this.game.getCastleAtPosition(gridX, gridY);
        const army = this.game.getArmyAtPosition(gridX, gridY);
        
        if (castle) {
            if (castle.owner === this.game.getHumanPlayer()) {
                options.push(
                    { text: '🏰 Castle Info', action: () => this.showCastleInfo(castle) },
                    { text: '⚔️ Send Army', action: () => this.showArmySender(castle) },
                    { text: '🔨 Upgrade', action: () => this.showUpgradeMenu(castle) }
                );
            } else {
                options.push(
                    { text: '👁️ View Castle', action: () => this.showCastleInfo(castle) },
                    { text: '⚔️ Attack', action: () => this.prepareAttack(castle) }
                );
            }
        } else if (army) {
            if (army.owner === this.game.getHumanPlayer()) {
                options.push(
                    { text: '📊 Army Info', action: () => this.showArmyInfo(army) },
                    { text: '➡️ Move Army', action: () => this.startArmyMove(army) }
                );
            } else {
                options.push(
                    { text: '👁️ View Army', action: () => this.showArmyInfo(army) }
                );
            }
        } else {
            // Empty tile
            if (this.game.ui.selectedCastle) {
                options.push(
                    { text: '⚔️ Send Army Here', action: () => this.sendArmyToPosition(gridX, gridY) }
                );
            }
            options.push(
                { text: '📍 Center View', action: () => this.centerViewOnPosition(gridX, gridY) }
            );
        }
        
        if (options.length > 0) {
            this.uiManager.showContextMenu(screenPosition.x, screenPosition.y, options);
        }
    }
    
    /**
     * Utility methods
     */
    calculatePlayerPopulation(player) {
        if (!this.game.castles) return 0;
        
        return this.game.castles
            .filter(castle => castle.owner === player)
            .reduce((total, castle) => total + castle.getTotalUnits(), 0);
    }
    
    formatGameTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    triggerMobileReadyEvent() {
        const event = new CustomEvent('mobileGameReady', {
            detail: {
                systems: this.systemsReady,
                deviceInfo: this.mobileOptimizer.getDeviceInfo(),
                performanceLevel: this.performanceManager.currentLevel
            }
        });
        
        window.dispatchEvent(event);
        console.log('📱 Mobile game ready event triggered');
    }
    
    handleInitializationFailure(error) {
        console.error('📱 Mobile initialization failed, falling back to desktop mode');
        
        // Disable mobile features
        this.isActive = false;
        
        // Remove mobile CSS classes
        document.body.classList.remove('mobile-game');
        
        // Notify user
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification(
                'Mobile optimizations unavailable, using desktop mode',
                'warning'
            );
        }
    }
    
    /**
     * Public API methods
     */
    isMobileActive() {
        return this.isActive && this.mobileOptimizer && this.mobileOptimizer.isMobile;
    }
    
    getMobileSystemsStatus() {
        return {
            initialized: this.isInitialized,
            active: this.isActive,
            systems: this.systemsReady,
            settings: this.mobileSettings
        };
    }
    
    getPerformanceReport() {
        if (this.performanceManager) {
            return this.performanceManager.getPerformanceReport();
        }
        return null;
    }
    
    getDeviceInfo() {
        if (this.mobileOptimizer) {
            return this.mobileOptimizer.getDeviceInfo();
        }
        return null;
    }
    
    enableMobileFeature(feature, enabled = true) {
        if (this.mobileSettings.hasOwnProperty(feature)) {
            this.mobileSettings[feature] = enabled;
            console.log(`📱 Mobile feature ${feature}: ${enabled ? 'enabled' : 'disabled'}`);
            
            // Apply feature change
            this.applyFeatureChange(feature, enabled);
        }
    }
    
    applyFeatureChange(feature, enabled) {
        switch (feature) {
            case 'touchControlsEnabled':
                if (this.touchManager) {
                    if (enabled) {
                        this.touchManager.enable();
                    } else {
                        this.touchManager.disable();
                    }
                }
                break;
                
            case 'hapticFeedbackEnabled':
                if (this.touchManager) {
                    // Update haptic feedback settings
                }
                break;
                
            case 'adaptivePerformanceEnabled':
                if (this.performanceManager) {
                    if (enabled) {
                        this.performanceManager.enableAdaptiveOptimization();
                    } else {
                        this.performanceManager.disableAdaptiveOptimization();
                    }
                }
                break;
        }
    }
    
    /**
     * Cleanup and shutdown
     */
    shutdown() {
        console.log('📱 Shutting down mobile systems...');
        
        this.isActive = false;
        
        // Shutdown all systems
        if (this.performanceManager) {
            this.performanceManager.shutdown();
        }
        
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        
        if (this.touchManager) {
            this.touchManager.disable();
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleAppBackground);
        window.removeEventListener('mobileOrientationChange', this.handleOrientationChange);
        
        // Remove mobile CSS classes
        document.body.classList.remove('mobile-game');
        
        console.log('📱 Mobile systems shutdown complete');
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileGameManager;
}