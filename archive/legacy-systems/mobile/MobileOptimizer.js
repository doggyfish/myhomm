/**
 * MobileOptimizer - Critical mobile detection and performance optimization for 2025
 * Addresses the 54% mobile game abandonment rate within first hour
 */
class MobileOptimizer {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobileDevice();
        this.deviceType = this.detectDeviceType();
        this.screenSize = this.getScreenCategories();
        this.performanceLevel = this.detectPerformanceLevel();
        this.batteryOptimized = false;
        
        // Mobile-specific settings
        this.mobileSettings = {
            maxParticles: 25,
            targetFPS: 30,
            reducedAnimations: true,
            minTouchTarget: 44, // iOS HIG minimum
            maxAudioChannels: 2,
            textureResolution: 0.75,
            shadowQuality: 'low',
            autoSaveInterval: 30000, // 30 seconds
            networkTimeout: 5000
        };
        
        // Desktop fallback settings
        this.desktopSettings = {
            maxParticles: 100,
            targetFPS: 60,
            reducedAnimations: false,
            minTouchTarget: 32,
            maxAudioChannels: 8,
            textureResolution: 1.0,
            shadowQuality: 'high',
            autoSaveInterval: 60000,
            networkTimeout: 10000
        };
        
        this.initialize();
    }
    
    /**
     * Comprehensive mobile device detection
     * @returns {boolean} True if mobile device detected
     */
    detectMobileDevice() {
        // Primary user agent detection
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'iemobile', 'opera mini', 'mobile', 'tablet'
        ];
        
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Secondary checks
        const hasTouchscreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallScreen = window.innerWidth < 1024;
        const mobileOrientation = 'orientation' in window;
        
        // Device memory check (mobile devices typically have less)
        const limitedMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        // Combination check for accuracy
        return isMobileUA || (hasTouchscreen && (smallScreen || mobileOrientation || limitedMemory));
    }
    
    /**
     * Detect specific device type for optimization
     * @returns {string} Device category
     */
    detectDeviceType() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const minDimension = Math.min(width, height);
        const maxDimension = Math.max(width, height);
        
        if (minDimension < 480) return 'phone_small';
        if (minDimension < 768) return 'phone_large';
        if (minDimension < 1024) return 'tablet';
        return 'desktop';
    }
    
    /**
     * Categorize screen size for responsive design
     * @returns {Object} Screen size information
     */
    getScreenCategories() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        
        return {
            width,
            height,
            dpr,
            category: this.deviceType,
            isPortrait: height > width,
            isRetina: dpr > 1,
            safeAreaInsets: this.getSafeAreaInsets()
        };
    }
    
    /**
     * Get safe area insets for modern mobile devices
     * @returns {Object} Safe area measurements
     */
    getSafeAreaInsets() {
        // Try to get CSS environment variables for safe area
        const style = getComputedStyle(document.documentElement);
        
        return {
            top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
            right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
            bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
            left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
        };
    }
    
    /**
     * Detect device performance level for optimization
     * @returns {string} Performance category
     */
    detectPerformanceLevel() {
        let performanceScore = 0;
        
        // CPU cores
        const cores = navigator.hardwareConcurrency || 4;
        performanceScore += Math.min(cores, 8) * 10;
        
        // Device memory
        const memory = navigator.deviceMemory || 4;
        performanceScore += Math.min(memory, 8) * 15;
        
        // GPU detection via WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER).toLowerCase();
            
            // High-end mobile GPUs
            if (renderer.includes('adreno 6') || renderer.includes('mali-g7') || 
                renderer.includes('apple') || renderer.includes('powervr gt7')) {
                performanceScore += 30;
            }
            // Mid-range mobile GPUs
            else if (renderer.includes('adreno 5') || renderer.includes('mali-g5') || 
                     renderer.includes('powervr gt6')) {
                performanceScore += 20;
            }
            // Low-end mobile GPUs
            else if (renderer.includes('adreno 3') || renderer.includes('mali-4')) {
                performanceScore += 10;
            }
            // Desktop/unknown GPUs
            else {
                performanceScore += 25;
            }
        }
        
        // Performance classification
        if (performanceScore >= 80) return 'high';
        if (performanceScore >= 50) return 'medium';
        return 'low';
    }
    
    /**
     * Initialize mobile optimizations
     */
    initialize() {
        console.log(`🚀 Mobile Optimizer Initialized:`);
        console.log(`   📱 Mobile Device: ${this.isMobile}`);
        console.log(`   📏 Device Type: ${this.deviceType}`);
        console.log(`   ⚡ Performance Level: ${this.performanceLevel}`);
        console.log(`   🔋 Screen: ${this.screenSize.width}x${this.screenSize.height} (DPR: ${this.screenSize.dpr})`);
        
        this.applyMobileOptimizations();
        this.setupOrientationHandling();
        this.setupPerformanceMonitoring();
        this.setupBatteryOptimization();
        
        // Apply settings to game
        if (this.game) {
            this.updateGameSettings();
        }
    }
    
    /**
     * Apply mobile-specific optimizations
     */
    applyMobileOptimizations() {
        const settings = this.isMobile ? this.mobileSettings : this.desktopSettings;
        
        // Performance adjustments based on device capability
        if (this.performanceLevel === 'low') {
            settings.maxParticles = Math.floor(settings.maxParticles * 0.5);
            settings.targetFPS = 24;
            settings.textureResolution = 0.5;
            settings.shadowQuality = 'disabled';
        } else if (this.performanceLevel === 'medium') {
            settings.maxParticles = Math.floor(settings.maxParticles * 0.75);
            settings.targetFPS = this.isMobile ? 30 : 45;
            settings.textureResolution = 0.75;
        }
        
        // Screen size adjustments
        if (this.deviceType === 'phone_small') {
            settings.minTouchTarget = 48; // Larger targets for small screens
            settings.maxParticles = Math.floor(settings.maxParticles * 0.6);
        }
        
        this.optimizedSettings = settings;
        console.log(`⚙️ Applied ${this.isMobile ? 'mobile' : 'desktop'} optimizations:`, settings);
    }
    
    /**
     * Setup orientation change handling
     */
    setupOrientationHandling() {
        if (!this.isMobile) return;
        
        const handleOrientationChange = () => {
            // Delay to allow for orientation change to complete
            setTimeout(() => {
                this.screenSize = this.getScreenCategories();
                this.onOrientationChange();
                console.log(`📱 Orientation changed: ${this.screenSize.isPortrait ? 'Portrait' : 'Landscape'}`);
            }, 100);
        };
        
        // Modern approach
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }
        // Fallback for older devices
        else {
            window.addEventListener('orientationchange', handleOrientationChange);
        }
        
        // Window resize as additional fallback
        window.addEventListener('resize', () => {
            if (this.isMobile) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(handleOrientationChange, 200);
            }
        });
    }
    
    /**
     * Handle orientation changes
     */
    onOrientationChange() {
        if (this.game && this.game.ui && this.game.ui.mobileManager) {
            this.game.ui.mobileManager.handleOrientationChange(this.screenSize);
        }
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
            detail: { screenSize: this.screenSize }
        }));
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            batteryLevel: 1.0,
            lastFrameTime: performance.now(),
            frameCount: 0
        };
        
        // FPS monitoring
        this.startFPSMonitoring();
        
        // Memory monitoring
        if (performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
                this.checkMemoryUsage();
            }, 5000);
        }
    }
    
    /**
     * Start FPS monitoring
     */
    startFPSMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                this.performanceMetrics.frameTime = (currentTime - lastTime) / frameCount;
                
                // Adaptive performance adjustment
                if (this.performanceMetrics.fps < this.optimizedSettings.targetFPS * 0.8) {
                    this.reducePerformanceLevel();
                } else if (this.performanceMetrics.fps > this.optimizedSettings.targetFPS * 1.2 && 
                          this.performanceLevel !== 'high') {
                    this.increasePerformanceLevel();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * Setup battery optimization
     */
    setupBatteryOptimization() {
        if (!this.isMobile || !('getBattery' in navigator)) return;
        
        navigator.getBattery().then(battery => {
            this.performanceMetrics.batteryLevel = battery.level;
            console.log(`🔋 Battery Level: ${Math.round(battery.level * 100)}%`);
            
            // Monitor battery changes
            battery.addEventListener('levelchange', () => {
                this.performanceMetrics.batteryLevel = battery.level;
                this.adaptPerformanceToBattery();
            });
            
            battery.addEventListener('chargingchange', () => {
                this.adaptPerformanceToBattery();
            });
            
            // Initial battery optimization
            this.adaptPerformanceToBattery();
        }).catch(error => {
            console.warn('Battery API not available:', error);
        });
    }
    
    /**
     * Adapt performance based on battery level
     */
    adaptPerformanceToBattery() {
        const batteryPercent = this.performanceMetrics.batteryLevel * 100;
        
        if (batteryPercent < 20 && !this.batteryOptimized) {
            console.log('🔋 Low battery detected - enabling power saving mode');
            this.batteryOptimized = true;
            
            // Reduce performance for battery saving
            this.optimizedSettings.targetFPS = Math.max(20, this.optimizedSettings.targetFPS * 0.7);
            this.optimizedSettings.maxParticles = Math.floor(this.optimizedSettings.maxParticles * 0.5);
            this.optimizedSettings.reducedAnimations = true;
            
            this.updateGameSettings();
        } else if (batteryPercent > 50 && this.batteryOptimized) {
            console.log('🔋 Battery level restored - disabling power saving mode');
            this.batteryOptimized = false;
            this.applyMobileOptimizations(); // Restore normal settings
            this.updateGameSettings();
        }
    }
    
    /**
     * Check memory usage and optimize if needed
     */
    checkMemoryUsage() {
        const memoryMB = this.performanceMetrics.memoryUsage;
        const memoryLimit = this.isMobile ? 150 : 500; // MB
        
        if (memoryMB > memoryLimit) {
            console.warn(`⚠️ High memory usage: ${memoryMB.toFixed(1)}MB`);
            this.triggerMemoryCleanup();
        }
    }
    
    /**
     * Trigger memory cleanup
     */
    triggerMemoryCleanup() {
        if (this.game) {
            // Clear cached resources
            if (this.game.renderer && this.game.renderer.clearCache) {
                this.game.renderer.clearCache();
            }
            
            // Reduce particle systems
            this.optimizedSettings.maxParticles = Math.floor(this.optimizedSettings.maxParticles * 0.7);
            this.updateGameSettings();
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
        }
    }
    
    /**
     * Reduce performance level
     */
    reducePerformanceLevel() {
        if (this.performanceLevel === 'high') {
            this.performanceLevel = 'medium';
        } else if (this.performanceLevel === 'medium') {
            this.performanceLevel = 'low';
        }
        
        console.log(`📉 Performance level reduced to: ${this.performanceLevel}`);
        this.applyMobileOptimizations();
        this.updateGameSettings();
    }
    
    /**
     * Increase performance level
     */
    increasePerformanceLevel() {
        if (this.performanceLevel === 'low') {
            this.performanceLevel = 'medium';
        } else if (this.performanceLevel === 'medium') {
            this.performanceLevel = 'high';
        }
        
        console.log(`📈 Performance level increased to: ${this.performanceLevel}`);
        this.applyMobileOptimizations();
        this.updateGameSettings();
    }
    
    /**
     * Update game settings with optimized values
     */
    updateGameSettings() {
        if (!this.game || !this.game.settings) return;
        
        // Apply optimized settings to game
        Object.assign(this.game.settings, this.optimizedSettings);
        
        // Notify game systems of changes
        if (this.game.systems) {
            Object.values(this.game.systems).forEach(system => {
                if (system && typeof system.onSettingsChange === 'function') {
                    system.onSettingsChange(this.optimizedSettings);
                }
            });
        }
        
        console.log('⚙️ Game settings updated with mobile optimizations');
    }
    
    /**
     * Get current performance metrics
     * @returns {Object} Performance data
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            deviceType: this.deviceType,
            performanceLevel: this.performanceLevel,
            isMobile: this.isMobile,
            batteryOptimized: this.batteryOptimized
        };
    }
    
    /**
     * Get device information
     * @returns {Object} Device data
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            deviceType: this.deviceType,
            screenSize: this.screenSize,
            performanceLevel: this.performanceLevel,
            settings: this.optimizedSettings
        };
    }
    
    /**
     * Force performance level (for testing)
     * @param {string} level - Performance level (low, medium, high)
     */
    setPerformanceLevel(level) {
        if (['low', 'medium', 'high'].includes(level)) {
            this.performanceLevel = level;
            this.applyMobileOptimizations();
            this.updateGameSettings();
            console.log(`🎛️ Performance level manually set to: ${level}`);
        }
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}