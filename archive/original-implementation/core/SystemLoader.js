/**
 * SystemLoader - Conditional loading of game systems based on platform
 * Only loads systems appropriate for the detected platform
 */
class SystemLoader {
    constructor(platformDetector) {
        this.platform = platformDetector;
        this.loadedSystems = new Set();
        this.failedSystems = new Set();
        this.loadPromises = new Map();
        
        console.log('🔧 SystemLoader initialized');
    }
    
    /**
     * Load all required systems for the current platform
     */
    async loadAllSystems() {
        console.log('📦 Loading systems for platform:', this.platform.platform.type);
        
        try {
            // Load systems in order of dependency
            await this.loadCoreSystem();
            await this.loadEntitySystems();
            await this.loadGameSystems();
            await this.loadUISystem();
            
            // Load platform-specific systems
            if (this.platform.systemsToLoad.mobile) {
                await this.loadMobileSystems();
            }
            
            if (this.platform.systemsToLoad.desktop) {
                await this.loadDesktopSystems();
            }
            
            // Load feature systems
            if (this.platform.systemsToLoad.tactical) {
                await this.loadTacticalSystems();
            }
            
            console.log('✅ All systems loaded successfully');
            console.log('📊 Loaded systems:', Array.from(this.loadedSystems));
            
            return {
                success: true,
                loadedSystems: Array.from(this.loadedSystems),
                failedSystems: Array.from(this.failedSystems)
            };
            
        } catch (error) {
            console.error('❌ System loading failed:', error);
            return {
                success: false,
                error: error.message,
                loadedSystems: Array.from(this.loadedSystems),
                failedSystems: Array.from(this.failedSystems)
            };
        }
    }
    
    /**
     * Load core systems (always required)
     */
    async loadCoreSystem() {
        console.log('🔧 Loading core systems...');
        
        // Core systems are already loaded via script tags in HTML
        // We just need to verify they exist
        const coreClasses = ['Game'];
        
        for (const className of coreClasses) {
            if (typeof window[className] !== 'undefined') {
                this.loadedSystems.add(className);
                console.log(`✅ ${className} loaded successfully`);
            } else {
                this.failedSystems.add(className);
                console.error(`❌ ${className} failed to load - check script tag and syntax`);
                console.error(`🔍 Window object contains: ${Object.getOwnPropertyNames(window).filter(prop => prop.includes('Game') || prop.includes('game')).join(', ') || 'no Game-related properties'}`);
            }
        }
        
        if (this.failedSystems.size > 0) {
            console.error('💥 Core system loading failed. Available window properties:', Object.getOwnPropertyNames(window).filter(prop => prop[0] === prop[0].toUpperCase()).slice(0, 10));
        }
    }
    
    /**
     * Load entity systems
     */
    async loadEntitySystems() {
        console.log('🏰 Loading entity systems...');
        
        const entityClasses = ['Player', 'Castle', 'Army'];
        
        for (const className of entityClasses) {
            if (typeof window[className] !== 'undefined') {
                this.loadedSystems.add(className);
                console.log(`✅ ${className} loaded successfully`);
                
                // Validate the class has essential methods
                const classRef = window[className];
                if (typeof classRef === 'function' && classRef.prototype) {
                    console.log(`   🔧 ${className} constructor and prototype validated`);
                } else {
                    console.warn(`   ⚠️ ${className} may not be a proper class constructor`);
                }
            } else {
                this.failedSystems.add(className);
                console.error(`❌ ${className} failed to load - check src/entities/${className}.js`);
                console.error(`🔍 Similar classes available: ${Object.getOwnPropertyNames(window).filter(prop => prop.toLowerCase().includes(className.toLowerCase())).join(', ') || 'none found'}`);
            }
        }
        
        if (this.failedSystems.size > 0) {
            console.error('💥 Entity system loading failed. Checking all loaded classes...');
            const loadedClasses = Object.getOwnPropertyNames(window).filter(prop => 
                typeof window[prop] === 'function' && 
                prop[0] === prop[0].toUpperCase() && 
                prop.length > 2
            );
            console.error('🔍 Available class-like objects:', loadedClasses.slice(0, 15));
        }
    }
    
    /**
     * Load game systems
     */
    async loadGameSystems() {
        console.log('⚙️ Loading game systems...');
        
        const systemClasses = ['ProductionSystem', 'CombatSystem', 'MovementSystem', 'AISystem'];
        
        for (const className of systemClasses) {
            if (typeof window[className] !== 'undefined') {
                this.loadedSystems.add(className);
                console.log(`✅ ${className} loaded successfully`);
                
                // Test instantiation capability
                try {
                    const TestInstance = window[className];
                    if (typeof TestInstance === 'function') {
                        console.log(`   🔧 ${className} constructor validated`);
                    }
                } catch (error) {
                    console.warn(`   ⚠️ ${className} constructor may have issues:`, error.message);
                }
            } else {
                this.failedSystems.add(className);
                console.error(`❌ ${className} failed to load - check src/systems/${className}.js`);
            }
        }
    }
    
    /**
     * Load UI systems
     */
    async loadUISystem() {
        console.log('🖥️ Loading UI systems...');
        
        const uiClasses = ['InputHandler', 'Renderer'];
        
        for (const className of uiClasses) {
            if (typeof window[className] !== 'undefined') {
                this.loadedSystems.add(className);
                console.log(`✅ ${className} loaded successfully`);
            } else {
                this.failedSystems.add(className);
                console.error(`❌ ${className} failed to load - check src/ui/${className}.js`);
            }
        }
        
        // Final summary
        console.log(`📊 System loading summary: ${this.loadedSystems.size} loaded, ${this.failedSystems.size} failed`);
        if (this.failedSystems.size > 0) {
            console.error('🚨 Failed systems:', Array.from(this.failedSystems));
        }
    }
    
    /**
     * Load mobile systems (only if needed)
     */
    async loadMobileSystems() {
        console.log('📱 Loading mobile systems...');
        
        const mobileClasses = [
            'MobileOptimizer',
            'TouchManager', 
            'MobilePerformanceManager',
            'MobileUIManager',
            'MobileCombatSystem',
            'MobileGameManager'
        ];
        
        for (const className of mobileClasses) {
            try {
                if (typeof window[className] !== 'undefined') {
                    this.loadedSystems.add(className);
                    console.log(`✅ ${className} loaded (mobile)`);
                } else {
                    console.warn(`⚠️ ${className} not available - mobile features may be limited`);
                    this.failedSystems.add(className);
                }
            } catch (error) {
                console.error(`❌ Error loading ${className}:`, error);
                this.failedSystems.add(className);
            }
        }
    }
    
    /**
     * Load desktop systems (only if needed)
     */
    async loadDesktopSystems() {
        console.log('🖥️ Loading desktop systems...');
        
        // Desktop systems would be loaded here
        // For now, we use the base UI systems with desktop enhancements
        
        try {
            // Create desktop-specific enhancements
            if (!window.DesktopInputHandler) {
                window.DesktopInputHandler = class extends InputHandler {
                    constructor(canvas, game) {
                        super(canvas, game);
                        this.setupKeyboardControls();
                        this.setupMouseControls();
                        console.log('🖱️ Desktop input controls initialized');
                    }
                    
                    setupKeyboardControls() {
                        document.addEventListener('keydown', (event) => {
                            this.handleKeyDown(event);
                        });
                        
                        document.addEventListener('keyup', (event) => {
                            this.handleKeyUp(event);
                        });
                    }
                    
                    setupMouseControls() {
                        this.canvas.addEventListener('contextmenu', (event) => {
                            event.preventDefault();
                            this.handleRightClick(event);
                        });
                        
                        this.canvas.addEventListener('wheel', (event) => {
                            event.preventDefault();
                            this.handleMouseWheel(event);
                        });
                    }
                    
                    handleKeyDown(event) {
                        // Desktop keyboard shortcuts
                        switch (event.key) {
                            case 'Escape':
                                this.game.toggleMenu();
                                break;
                            case ' ':
                                this.game.togglePause();
                                break;
                            case 'Tab':
                                event.preventDefault();
                                this.game.selectNextUnit();
                                break;
                        }
                    }
                    
                    handleKeyUp(event) {
                        // Handle key releases
                    }
                    
                    handleRightClick(event) {
                        const rect = this.canvas.getBoundingClientRect();
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        
                        // Show context menu or issue move command
                        this.game.handleRightClick(x, y);
                    }
                    
                    handleMouseWheel(event) {
                        // Zoom in/out with mouse wheel
                        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
                        this.game.setZoom(this.game.zoom * zoomFactor);
                    }
                };
            }
            
            this.loadedSystems.add('DesktopInputHandler');
            console.log('✅ Desktop input systems loaded');
            
        } catch (error) {
            console.error('❌ Error loading desktop systems:', error);
            this.failedSystems.add('DesktopSystems');
        }
    }
    
    /**
     * Load tactical systems (only if supported)
     */
    async loadTacticalSystems() {
        console.log('⚔️ Loading tactical systems...');
        
        const tacticalClasses = [
            'TacticalCombatSystem',
            'TacticalUIManager', 
            'CastleSpecializationSystem'
        ];
        
        for (const className of tacticalClasses) {
            try {
                if (typeof window[className] !== 'undefined') {
                    this.loadedSystems.add(className);
                    console.log(`✅ ${className} loaded (tactical)`);
                } else {
                    console.warn(`⚠️ ${className} not available - tactical features disabled`);
                    this.failedSystems.add(className);
                }
            } catch (error) {
                console.error(`❌ Error loading ${className}:`, error);
                this.failedSystems.add(className);
            }
        }
    }
    
    /**
     * Create game instance with appropriate systems
     */
    createGameInstance(canvasId) {
        console.log('🎮 Creating game instance for platform:', this.platform.platform.type);
        
        try {
            // Create base game instance
            const game = new Game(canvasId);
            
            // Configure game based on platform
            this.configureGameForPlatform(game);
            
            // Initialize platform-specific systems
            this.initializePlatformSystems(game);
            
            console.log('✅ Game instance created successfully');
            return game;
            
        } catch (error) {
            console.error('❌ Failed to create game instance:', error);
            throw error;
        }
    }
    
    /**
     * Configure game settings based on platform
     */
    configureGameForPlatform(game) {
        const settings = this.platform.getOptimizedSettings();
        
        // Apply platform-specific settings
        game.settings = {
            ...game.settings,
            ...settings
        };
        
        // Add platform classes to document
        const platformClasses = this.platform.getPlatformClasses();
        document.body.classList.add(...platformClasses);
        
        console.log('⚙️ Game configured for platform:', this.platform.platform.type);
        console.log('📊 Applied settings:', settings);
    }
    
    /**
     * Initialize platform-specific systems
     */
    initializePlatformSystems(game) {
        // Initialize mobile systems if loaded and needed
        if (this.platform.systemsToLoad.mobile && this.loadedSystems.has('MobileGameManager')) {
            try {
                game.mobile = new MobileGameManager(game);
                console.log('📱 Mobile systems initialized');
            } catch (error) {
                console.error('❌ Failed to initialize mobile systems:', error);
            }
        }
        
        // Initialize desktop systems if loaded and needed
        if (this.platform.systemsToLoad.desktop && this.loadedSystems.has('DesktopInputHandler')) {
            try {
                // Replace input handler with desktop version
                game.ui.inputHandler = new DesktopInputHandler(game.canvas, game);
                console.log('🖥️ Desktop systems initialized');
            } catch (error) {
                console.error('❌ Failed to initialize desktop systems:', error);
            }
        }
        
        // Initialize tactical systems if loaded and needed
        if (this.platform.systemsToLoad.tactical) {
            this.initializeTacticalSystems(game);
        }
    }
    
    /**
     * Initialize tactical systems
     */
    initializeTacticalSystems(game) {
        try {
            if (this.loadedSystems.has('TacticalCombatSystem') && game.mobile?.combatSystem) {
                game.tacticalCombat = new TacticalCombatSystem(game.mobile.combatSystem);
                console.log('⚔️ Tactical combat initialized');
            }
            
            if (this.loadedSystems.has('TacticalUIManager') && game.mobile?.uiManager) {
                game.tacticalUI = new TacticalUIManager(game, game.mobile.uiManager, game.tacticalCombat);
                console.log('🎯 Tactical UI initialized');
            }
            
            if (this.loadedSystems.has('CastleSpecializationSystem') && game.mobile?.uiManager) {
                game.castleSpecialization = new CastleSpecializationSystem(game, game.mobile.uiManager);
                console.log('🏰 Castle specialization initialized');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize tactical systems:', error);
        }
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            platform: this.platform.platform.type,
            systemsToLoad: this.platform.systemsToLoad,
            loadedSystems: Array.from(this.loadedSystems),
            failedSystems: Array.from(this.failedSystems),
            loadSuccess: this.failedSystems.size === 0,
            mobileModeActive: this.platform.shouldUseMobileMode(),
            desktopModeActive: this.platform.shouldUseDesktopMode(),
            tacticalSystemsActive: this.platform.systemsToLoad.tactical
        };
    }
    
    /**
     * Handle system loading errors gracefully
     */
    handleSystemError(systemName, error) {
        console.error(`❌ System error in ${systemName}:`, error);
        this.failedSystems.add(systemName);
        
        // Try to recover or provide fallback
        switch (systemName) {
            case 'TouchManager':
                console.log('🔄 Falling back to mouse controls');
                break;
            case 'MobileUIManager':
                console.log('🔄 Using desktop UI');
                break;
            case 'TacticalCombatSystem':
                console.log('🔄 Using basic combat system');
                break;
            default:
                console.log(`🔄 ${systemName} disabled, continuing with available systems`);
        }
    }
}

console.log('🔍 SystemLoader class defined, checking availability:', typeof SystemLoader, typeof window.SystemLoader);
window.SystemLoader = SystemLoader; // Explicitly ensure it's in global scope

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemLoader;
}