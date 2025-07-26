/**
 * PlatformDetector - Intelligent platform detection and conditional system loading
 * Determines whether to run in mobile mode or desktop mode
 */
class PlatformDetector {
    constructor() {
        this.platform = this.detectPlatform();
        this.capabilities = this.detectCapabilities();
        this.systemsToLoad = this.determineSystemsToLoad();
        
        console.log(`🔍 Platform detected: ${this.platform.type} (${this.platform.os})`);
        console.log(`📱 Mobile mode: ${this.isMobile()}`);
        console.log(`🎮 Systems to load:`, this.systemsToLoad);
    }
    
    /**
     * Detect the current platform
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        // Mobile device detection
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Screen size detection
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Device pixel ratio
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Platform categorization
        let type = 'desktop';
        let os = 'unknown';
        
        if (isMobileDevice) {
            type = isTablet ? 'tablet' : 'mobile';
        } else if (isTouchDevice && (screenWidth < 1024 || viewportWidth < 1024)) {
            type = 'tablet';
        }
        
        // OS detection
        if (/android/i.test(userAgent)) os = 'android';
        else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'ios';
        else if (/windows/i.test(userAgent)) os = 'windows';
        else if (/mac/i.test(userAgent)) os = 'macos';
        else if (/linux/i.test(userAgent)) os = 'linux';
        
        return {
            type,
            os,
            isMobileDevice,
            isTablet,
            isTouchDevice,
            screenWidth,
            screenHeight,
            viewportWidth,
            viewportHeight,
            pixelRatio,
            userAgent
        };
    }
    
    /**
     * Detect device capabilities
     */
    detectCapabilities() {
        return {
            touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            multitouch: navigator.maxTouchPoints > 1,
            orientation: 'orientation' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            deviceOrientation: 'DeviceOrientationEvent' in window,
            vibration: 'vibrate' in navigator,
            geolocation: 'geolocation' in navigator,
            localStorage: 'localStorage' in window,
            webGL: this.detectWebGL(),
            webGL2: this.detectWebGL2(),
            canvas: this.detectCanvas(),
            audioContext: this.detectAudioContext(),
            gamepad: 'getGamepads' in navigator,
            fullscreen: this.detectFullscreen(),
            battery: 'getBattery' in navigator,
            connection: 'connection' in navigator,
            memory: 'memory' in performance
        };
    }
    
    /**
     * Determine which systems should be loaded based on platform
     */
    determineSystemsToLoad() {
        const systems = {
            // Core systems - always load
            core: true,
            entities: true,
            systems: true,
            ui: true,
            
            // Mobile systems - conditional
            mobile: this.shouldUseMobileMode(),
            touch: this.shouldUseTouchControls(),
            performance: this.shouldUsePerformanceOptimizations(),
            
            // Desktop systems - conditional  
            desktop: this.shouldUseDesktopMode(),
            keyboard: this.shouldUseKeyboardControls(),
            mouse: this.shouldUseMouseControls(),
            
            // Feature systems - conditional
            tactical: this.shouldUseTacticalSystems(),
            specialization: this.shouldUseCastleSpecialization(),
            advanced: this.shouldUseAdvancedFeatures()
        };
        
        return systems;
    }
    
    /**
     * Platform detection helpers
     */
    isMobile() {
        return this.platform.type === 'mobile';
    }
    
    isTablet() {
        return this.platform.type === 'tablet';
    }
    
    isDesktop() {
        return this.platform.type === 'desktop';
    }
    
    isTouchDevice() {
        return this.platform.isTouchDevice;
    }
    
    /**
     * System loading decision methods
     */
    shouldUseMobileMode() {
        // Use mobile mode for actual mobile devices or small screens
        return this.isMobile() || 
               this.platform.viewportWidth < 768 ||
               (this.isTouchDevice() && this.platform.viewportWidth < 1024);
    }
    
    shouldUseTouchControls() {
        // Enable touch controls for touch devices
        return this.capabilities.touch;
    }
    
    shouldUsePerformanceOptimizations() {
        // Use performance optimizations for mobile or low-end devices
        return this.isMobile() || 
               this.platform.pixelRatio > 2 ||
               (this.capabilities.memory && performance.memory.jsHeapSizeLimit < 1024 * 1024 * 1024); // Less than 1GB
    }
    
    shouldUseDesktopMode() {
        // Use desktop mode for desktop browsers
        return this.isDesktop() && !this.shouldUseMobileMode();
    }
    
    shouldUseKeyboardControls() {
        // Enable keyboard controls for desktop
        return this.shouldUseDesktopMode();
    }
    
    shouldUseMouseControls() {
        // Enable mouse controls for non-touch or desktop devices
        return !this.isMobile() || !this.capabilities.touch;
    }
    
    shouldUseTacticalSystems() {
        // Enable tactical systems for devices that can handle them
        return this.isDesktop() || 
               this.isTablet() || 
               (this.capabilities.webGL && this.platform.screenWidth >= 720);
    }
    
    shouldUseCastleSpecialization() {
        // Enable castle specialization for capable devices
        return this.shouldUseTacticalSystems();
    }
    
    shouldUseAdvancedFeatures() {
        // Enable advanced features for high-end devices
        return (this.isDesktop() && this.capabilities.webGL2) ||
               (this.capabilities.memory && performance.memory && 
                performance.memory.jsHeapSizeLimit > 512 * 1024 * 1024); // More than 512MB
    }
    
    /**
     * Capability detection helpers
     */
    detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    detectWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }
    
    detectCanvas() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }
    
    detectAudioContext() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
    
    detectFullscreen() {
        return !!(document.fullscreenEnabled || 
                 document.webkitFullscreenEnabled || 
                 document.mozFullScreenEnabled ||
                 document.msFullscreenEnabled);
    }
    
    /**
     * Get optimized game settings based on platform
     */
    getOptimizedSettings() {
        const settings = {
            // Rendering settings
            maxFPS: this.isMobile() ? 30 : 60,
            vsync: this.isDesktop(),
            antialiasing: this.isDesktop() && this.capabilities.webGL2,
            shadows: this.isDesktop(),
            particles: this.shouldUseAdvancedFeatures(),
            
            // Performance settings
            maxUnits: this.isMobile() ? 100 : 500,
            maxCastles: this.isMobile() ? 10 : 50,
            aiUpdateInterval: this.isMobile() ? 2000 : 1000,
            renderDistance: this.isMobile() ? 'low' : 'high',
            
            // UI settings
            uiScale: this.calculateUIScale(),
            touchTargetSize: this.isTouchDevice() ? 44 : 32,
            showAdvancedControls: this.shouldUseAdvancedFeatures(),
            
            // Audio settings
            enableAudio: this.capabilities.audioContext,
            maxAudioSources: this.isMobile() ? 4 : 16,
            
            // Network settings
            updateFrequency: this.isMobile() ? 500 : 100,
            compressionLevel: this.isMobile() ? 'high' : 'medium'
        };
        
        return settings;
    }
    
    /**
     * Calculate optimal UI scale based on device
     */
    calculateUIScale() {
        const baseScale = 1.0;
        const pixelRatio = this.platform.pixelRatio;
        const screenWidth = this.platform.screenWidth;
        
        if (this.isMobile()) {
            // Scale up for high-DPI mobile screens
            if (pixelRatio >= 3) return baseScale * 1.2;
            if (pixelRatio >= 2) return baseScale * 1.1;
            return baseScale;
        } else {
            // Scale based on screen size for desktop
            if (screenWidth >= 2560) return baseScale * 1.3;
            if (screenWidth >= 1920) return baseScale * 1.1;
            if (screenWidth < 1366) return baseScale * 0.9;
            return baseScale;
        }
    }
    
    /**
     * Get platform-specific CSS classes
     */
    getPlatformClasses() {
        const classes = [];
        
        classes.push(`platform-${this.platform.type}`);
        classes.push(`os-${this.platform.os}`);
        
        if (this.isTouchDevice()) classes.push('touch-enabled');
        if (this.capabilities.multitouch) classes.push('multitouch');
        if (this.shouldUseMobileMode()) classes.push('mobile-mode');
        if (this.shouldUseDesktopMode()) classes.push('desktop-mode');
        if (this.capabilities.webGL) classes.push('webgl-enabled');
        if (this.capabilities.webGL2) classes.push('webgl2-enabled');
        
        // Performance classes
        if (this.shouldUsePerformanceOptimizations()) classes.push('performance-mode');
        if (this.shouldUseAdvancedFeatures()) classes.push('advanced-features');
        
        return classes;
    }
    
    /**
     * Update platform detection on window resize/orientation change
     */
    updateDetection() {
        const oldPlatform = this.platform;
        this.platform = this.detectPlatform();
        this.systemsToLoad = this.determineSystemsToLoad();
        
        // Check if platform type changed
        if (oldPlatform.type !== this.platform.type) {
            console.log(`🔄 Platform changed: ${oldPlatform.type} → ${this.platform.type}`);
            
            // Dispatch custom event for platform change
            window.dispatchEvent(new CustomEvent('platformChanged', {
                detail: {
                    old: oldPlatform,
                    new: this.platform,
                    systemsToLoad: this.systemsToLoad
                }
            }));
        }
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            platform: this.platform,
            capabilities: this.capabilities,
            systemsToLoad: this.systemsToLoad,
            optimizedSettings: this.getOptimizedSettings(),
            platformClasses: this.getPlatformClasses()
        };
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformDetector;
}