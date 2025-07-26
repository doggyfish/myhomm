/**
 * MobilePerformanceManager - Adaptive performance optimization for 2025 mobile standards
 * Targets: 30 FPS minimum, < 5% battery usage per hour, < 150MB RAM
 */
class MobilePerformanceManager {
    constructor(game, mobileOptimizer) {
        this.game = game;
        this.mobileOptimizer = mobileOptimizer;
        this.isActive = false;
        
        // Performance targets for 2025
        this.targets = {
            minFPS: 24,
            targetFPS: 30,
            maxFPS: 60,
            maxMemoryMB: 150,
            maxBatteryPercentPerHour: 5,
            maxFrameTimeMS: 33.33, // 30 FPS target
            thermalThrottleTemp: 45 // Celsius
        };
        
        // Performance levels with specific optimizations
        this.performanceLevels = {
            ultra: {
                name: 'Ultra Performance',
                particleCount: 150,
                animationQuality: 'high',
                shadowQuality: 'high',
                textureResolution: 1.0,
                effectsQuality: 'high',
                antiAliasing: true,
                targetFPS: 60,
                updateFrequency: 60
            },
            high: {
                name: 'High Performance',
                particleCount: 100,
                animationQuality: 'high',
                shadowQuality: 'medium',
                textureResolution: 1.0,
                effectsQuality: 'medium',
                antiAliasing: true,
                targetFPS: 45,
                updateFrequency: 45
            },
            medium: {
                name: 'Balanced',
                particleCount: 50,
                animationQuality: 'medium',
                shadowQuality: 'medium',
                textureResolution: 0.75,
                effectsQuality: 'medium',
                antiAliasing: false,
                targetFPS: 30,
                updateFrequency: 30
            },
            low: {
                name: 'Power Saving',
                particleCount: 25,
                animationQuality: 'low',
                shadowQuality: 'disabled',
                textureResolution: 0.5,
                effectsQuality: 'low',
                antiAliasing: false,
                targetFPS: 24,
                updateFrequency: 24
            },
            minimal: {
                name: 'Emergency Mode',
                particleCount: 10,
                animationQuality: 'disabled',
                shadowQuality: 'disabled',
                textureResolution: 0.25,
                effectsQuality: 'disabled',
                antiAliasing: false,
                targetFPS: 20,
                updateFrequency: 20
            }
        };
        
        // Current performance state
        this.currentLevel = 'medium';
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            batteryLevel: 1.0,
            temperature: 0,
            networkLatency: 0,
            cpuUsage: 0,
            gpuUsage: 0
        };
        
        // Performance history for trend analysis
        this.performanceHistory = {
            fps: [],
            frameTime: [],
            memory: [],
            battery: [],
            maxHistoryLength: 100
        };
        
        // Adaptive system state
        this.adaptiveSettings = {
            enabled: true,
            aggressiveness: 0.5, // 0 = conservative, 1 = aggressive
            stabilityThreshold: 5, // seconds before changing level
            emergencyMode: false,
            batteryOptimization: true,
            thermalThrottling: true
        };
        
        // Monitoring intervals
        this.intervals = {
            fpsMonitoring: null,
            memoryMonitoring: null,
            batteryMonitoring: null,
            adaptiveOptimization: null
        };
        
        this.initialize();
    }
    
    /**
     * Initialize performance management system
     */
    initialize() {
        console.log('⚡ MobilePerformanceManager initializing...');
        
        this.setupPerformanceMonitoring();
        this.setupAdaptiveOptimization();
        this.setupBatteryMonitoring();
        this.setupThermalMonitoring();
        this.setupMemoryManagement();
        
        // Set initial performance level based on device
        this.setInitialPerformanceLevel();
        
        this.isActive = true;
        console.log(`⚡ Performance management active - Level: ${this.currentLevel}`);
    }
    
    /**
     * Setup comprehensive performance monitoring
     */
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        let frameTimeSum = 0;
        
        const measurePerformance = (currentTime) => {
            if (!this.isActive) return;
            
            frameCount++;
            const deltaTime = currentTime - lastTime;
            frameTimeSum += deltaTime;
            
            // Update FPS every second
            if (frameCount >= 60 || deltaTime >= 1000) {
                this.metrics.fps = Math.round(frameCount * 1000 / frameTimeSum);
                this.metrics.frameTime = frameTimeSum / frameCount;
                
                // Add to history
                this.addToHistory('fps', this.metrics.fps);
                this.addToHistory('frameTime', this.metrics.frameTime);
                
                // Check performance against targets
                this.evaluatePerformance();
                
                // Reset counters
                frameCount = 0;
                frameTimeSum = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measurePerformance);
        };
        
        requestAnimationFrame(measurePerformance);
        
        // Additional performance monitoring
        this.intervals.fpsMonitoring = setInterval(() => {
            this.updatePerformanceMetrics();
        }, 1000);
    }
    
    /**
     * Setup adaptive optimization system
     */
    setupAdaptiveOptimization() {
        this.intervals.adaptiveOptimization = setInterval(() => {
            if (this.adaptiveSettings.enabled) {
                this.performAdaptiveOptimization();
            }
        }, this.adaptiveSettings.stabilityThreshold * 1000);
    }
    
    /**
     * Setup battery monitoring and optimization
     */
    setupBatteryMonitoring() {
        if (!navigator.getBattery) return;
        
        navigator.getBattery().then(battery => {
            this.updateBatteryMetrics(battery);
            
            // Monitor battery changes
            battery.addEventListener('levelchange', () => {
                this.updateBatteryMetrics(battery);
                this.handleBatteryChange();
            });
            
            battery.addEventListener('chargingchange', () => {
                this.updateBatteryMetrics(battery);
                this.handleChargingChange(battery.charging);
            });
            
            // Start battery optimization monitoring
            this.intervals.batteryMonitoring = setInterval(() => {
                this.updateBatteryMetrics(battery);
                              this.optimizeForBattery();
            }, 10000); // Check every 10 seconds
            
        }).catch(error => {
            console.warn('⚡ Battery API not available:', error);
        });
    }
    
    /**
     * Setup thermal monitoring
     */
    setupThermalMonitoring() {
        // Modern thermal API (when available)
        if ('deviceMemory' in navigator && 'hardwareConcurrency' in navigator) {
            this.intervals.thermalMonitoring = setInterval(() => {
                this.estimateThermalState();
            }, 5000);
        }
    }
    
    /**
     * Setup memory management
     */
    setupMemoryManagement() {
        if (performance.memory) {
            this.intervals.memoryMonitoring = setInterval(() => {
                this.updateMemoryMetrics();
                this.manageMemoryUsage();
            }, 2000);
        }
    }
    
    /**
     * Set initial performance level based on device capabilities
     */
    setInitialPerformanceLevel() {
        const deviceInfo = this.mobileOptimizer.getDeviceInfo();
        
        // Base level on device performance
        switch (deviceInfo.performanceLevel) {
            case 'high':
                this.currentLevel = deviceInfo.isMobile ? 'high' : 'ultra';
                break;
            case 'medium':
                this.currentLevel = 'medium';
                break;
            case 'low':
                this.currentLevel = 'low';
                break;
            default:
                this.currentLevel = 'medium';
        }
        
        // Adjust for mobile devices
        if (deviceInfo.isMobile && deviceInfo.deviceType === 'phone_small') {
            this.currentLevel = this.getNextLowerLevel(this.currentLevel);
        }
        
        this.applyPerformanceLevel(this.currentLevel);
    }
    
    /**
     * Update various performance metrics
     */
    updatePerformanceMetrics() {
        // CPU usage estimation (indirect)
        const frameTimeRatio = this.metrics.frameTime / this.targets.maxFrameTimeMS;
        this.metrics.cpuUsage = Math.min(100, frameTimeRatio * 100);
        
        // Update memory if available
        if (performance.memory) {
            this.updateMemoryMetrics();
        }
        
        // Network latency (if network monitoring is active)
        this.updateNetworkMetrics();
    }
    
    /**
     * Update memory metrics
     */
    updateMemoryMetrics() {
        if (!performance.memory) return;
        
        const memoryInfo = performance.memory;
        this.metrics.memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        
        this.addToHistory('memory', this.metrics.memoryUsage);
        
        // Check memory pressure
        if (this.metrics.memoryUsage > this.targets.maxMemoryMB) {
            this.handleMemoryPressure();
        }
    }
    
    /**
     * Update battery metrics
     */
    updateBatteryMetrics(battery) {
        this.metrics.batteryLevel = battery.level;
        this.addToHistory('battery', this.metrics.batteryLevel);
    }
    
    /**
     * Update network metrics
     */
    updateNetworkMetrics() {
        if (navigator.connection) {
            const connection = navigator.connection;
            this.metrics.networkLatency = connection.rtt || 0;
            
            // Adjust performance based on network
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.handleSlowNetwork();
            }
        }
    }
    
    /**
     * Estimate thermal state based on performance indicators
     */
    estimateThermalState() {
        // Indirect thermal estimation based on performance degradation
        const avgFPS = this.getAverageFromHistory('fps', 10);
        const targetFPS = this.performanceLevels[this.currentLevel].targetFPS;
        
        if (avgFPS < targetFPS * 0.7) {
            // Significant performance drop might indicate thermal throttling
            this.handleThermalThrottling();
        }
    }
    
    /**
     * Perform adaptive optimization based on current metrics
     */
    performAdaptiveOptimization() {
        const currentPerformance = this.evaluateCurrentPerformance();
        const recommendedLevel = this.calculateOptimalPerformanceLevel(currentPerformance);
        
        if (recommendedLevel !== this.currentLevel) {
            console.log(`⚡ Performance adaptation: ${this.currentLevel} → ${recommendedLevel}`);
            this.setPerformanceLevel(recommendedLevel);
        }
    }
    
    /**
     * Evaluate current performance against targets
     */
    evaluateCurrentPerformance() {
        const avgFPS = this.getAverageFromHistory('fps', 5);
        const avgFrameTime = this.getAverageFromHistory('frameTime', 5);
        const currentLevel = this.performanceLevels[this.currentLevel];
        
        return {
            fpsRatio: avgFPS / currentLevel.targetFPS,
            frameTimeRatio: avgFrameTime / this.targets.maxFrameTimeMS,
            memoryRatio: this.metrics.memoryUsage / this.targets.maxMemoryMB,
            batteryLevel: this.metrics.batteryLevel,
            stable: this.isPerformanceStable()
        };
    }
    
    /**
     * Calculate optimal performance level
     */
    calculateOptimalPerformanceLevel(performance) {
        const levels = Object.keys(this.performanceLevels);
        const currentIndex = levels.indexOf(this.currentLevel);
        
        // Emergency conditions
        if (this.metrics.batteryLevel < 0.1 || this.metrics.memoryUsage > this.targets.maxMemoryMB * 1.5) {
            return 'minimal';
        }
        
        // Poor performance - reduce level
        if (performance.fpsRatio < 0.8 || performance.frameTimeRatio > 1.2) {
            return this.getNextLowerLevel(this.currentLevel);
        }
        
        // Good performance and stable - potentially increase level
        if (performance.fpsRatio > 1.2 && performance.stable && this.metrics.batteryLevel > 0.5) {
            return this.getNextHigherLevel(this.currentLevel);
        }
        
        return this.currentLevel;
    }
    
    /**
     * Check if performance is stable
     */
    isPerformanceStable() {
        const fpsHistory = this.performanceHistory.fps.slice(-10);
        if (fpsHistory.length < 5) return false;
        
        const variance = this.calculateVariance(fpsHistory);
        return variance < 25; // Low variance indicates stability
    }
    
    /**
     * Handle specific performance scenarios
     */
    handleMemoryPressure() {
        console.warn('⚠️ Memory pressure detected:', this.metrics.memoryUsage, 'MB');
        
        // Immediate memory cleanup
        this.performMemoryCleanup();
        
        // Reduce performance level if necessary
        if (this.metrics.memoryUsage > this.targets.maxMemoryMB * 1.2) {
            const lowerLevel = this.getNextLowerLevel(this.currentLevel);
            this.setPerformanceLevel(lowerLevel);
        }
    }
    
    handleBatteryChange() {
        const batteryPercent = this.metrics.batteryLevel * 100;
        
        if (batteryPercent < 20 && !this.adaptiveSettings.emergencyMode) {
            console.log('🔋 Low battery - enabling emergency mode');
            this.enableEmergencyMode();
        } else if (batteryPercent > 50 && this.adaptiveSettings.emergencyMode) {
            console.log('🔋 Battery restored - disabling emergency mode');
            this.disableEmergencyMode();
        }
    }
    
    handleChargingChange(isCharging) {
        if (isCharging) {
            console.log('🔌 Device charging - performance constraints relaxed');
            this.adaptiveSettings.batteryOptimization = false;
        } else {
            console.log('🔋 Device unplugged - enabling battery optimization');
            this.adaptiveSettings.batteryOptimization = true;
        }
    }
    
    handleThermalThrottling() {
        console.warn('🔥 Thermal throttling detected');
        
        // Immediate performance reduction
        const lowerLevel = this.getNextLowerLevel(this.currentLevel);
        this.setPerformanceLevel(lowerLevel);
        
        // Enable aggressive optimization
        this.adaptiveSettings.aggressiveness = Math.min(1.0, this.adaptiveSettings.aggressiveness + 0.2);
    }
    
    handleSlowNetwork() {
        console.log('📶 Slow network detected - reducing network-dependent features');
        
        if (this.game.settings) {
            this.game.settings.autoSave = false;
            this.game.settings.networkUpdates = false;
            this.game.settings.cloudSync = false;
        }
    }
    
    /**
     * Performance level management
     */
    setPerformanceLevel(level) {
        if (!this.performanceLevels[level]) {
            console.error('⚡ Invalid performance level:', level);
            return;
        }
        
        this.currentLevel = level;
        this.applyPerformanceLevel(level);
        
        console.log(`⚡ Performance level set to: ${this.performanceLevels[level].name}`);
    }
    
    applyPerformanceLevel(level) {
        const settings = this.performanceLevels[level];
        
        // Apply to game settings
        if (this.game.settings) {
            Object.assign(this.game.settings, {
                maxParticles: settings.particleCount,
                animationQuality: settings.animationQuality,
                shadowQuality: settings.shadowQuality,
                textureResolution: settings.textureResolution,
                effectsQuality: settings.effectsQuality,
                antiAliasing: settings.antiAliasing,
                targetFPS: settings.targetFPS,
                updateFrequency: settings.updateFrequency
            });
        }
        
        // Notify game systems
        this.notifySystemsOfChange(settings);
        
        // Update mobile optimizer
        if (this.mobileOptimizer) {
            this.mobileOptimizer.updateGameSettings();
        }
    }
    
    notifySystemsOfChange(settings) {
        if (!this.game.systems) return;
        
        Object.values(this.game.systems).forEach(system => {
            if (system && typeof system.onPerformanceChange === 'function') {
                system.onPerformanceChange(settings);
            }
        });
    }
    
    /**
     * Utility methods
     */
    getNextLowerLevel(currentLevel) {
        const levels = ['ultra', 'high', 'medium', 'low', 'minimal'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.min(levels.length - 1, currentIndex + 1)];
    }
    
    getNextHigherLevel(currentLevel) {
        const levels = ['ultra', 'high', 'medium', 'low', 'minimal'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.max(0, currentIndex - 1)];
    }
    
    addToHistory(metric, value) {
        const history = this.performanceHistory[metric];
        if (history) {
            history.push(value);
            if (history.length > this.performanceHistory.maxHistoryLength) {
                history.shift();
            }
        }
    }
    
    getAverageFromHistory(metric, count = 10) {
        const history = this.performanceHistory[metric];
        if (!history || history.length === 0) return 0;
        
        const slice = history.slice(-count);
        return slice.reduce((sum, val) => sum + val, 0) / slice.length;
    }
    
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    /**
     * Memory management
     */
    performMemoryCleanup() {
        console.log('🧹 Performing memory cleanup');
        
        // Clear game caches
        if (this.game.renderer && this.game.renderer.clearCache) {
            this.game.renderer.clearCache();
        }
        
        // Reduce particle counts temporarily
        const currentSettings = this.performanceLevels[this.currentLevel];
        currentSettings.particleCount = Math.floor(currentSettings.particleCount * 0.7);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear old performance history
        Object.keys(this.performanceHistory).forEach(key => {
            if (Array.isArray(this.performanceHistory[key])) {
                this.performanceHistory[key] = this.performanceHistory[key].slice(-20);
            }
        });
    }
    
    manageMemoryUsage() {
        const memoryMB = this.metrics.memoryUsage;
        const warningThreshold = this.targets.maxMemoryMB * 0.8;
        const criticalThreshold = this.targets.maxMemoryMB;
        
        if (memoryMB > criticalThreshold) {
            this.performMemoryCleanup();
        } else if (memoryMB > warningThreshold) {
            // Preemptive optimization
            this.optimizeMemoryUsage();
        }
    }
    
    optimizeMemoryUsage() {
        // Reduce texture resolution temporarily
        const currentSettings = this.performanceLevels[this.currentLevel];
        currentSettings.textureResolution = Math.max(0.25, currentSettings.textureResolution * 0.9);
        
        this.applyPerformanceLevel(this.currentLevel);
    }
    
    /**
     * Emergency and battery optimization modes
     */
    enableEmergencyMode() {
        this.adaptiveSettings.emergencyMode = true;
        this.setPerformanceLevel('minimal');
        
        // Additional emergency optimizations
        if (this.game.settings) {
            this.game.settings.autoSave = false;
            this.game.settings.backgroundProcessing = false;
            this.game.settings.audioEnabled = false;
        }
    }
    
    disableEmergencyMode() {
        this.adaptiveSettings.emergencyMode = false;
        
        // Restore normal settings
        const deviceInfo = this.mobileOptimizer.getDeviceInfo();
        this.setInitialPerformanceLevel();
        
        if (this.game.settings) {
            this.game.settings.autoSave = true;
            this.game.settings.backgroundProcessing = true;
            this.game.settings.audioEnabled = true;
        }
    }
    
    optimizeForBattery() {
        if (!this.adaptiveSettings.batteryOptimization) return;
        
        const batteryPercent = this.metrics.batteryLevel * 100;
        
        if (batteryPercent < 30) {
            // Aggressive battery saving
            const currentSettings = this.performanceLevels[this.currentLevel];
            currentSettings.targetFPS = Math.max(20, currentSettings.targetFPS * 0.8);
            currentSettings.updateFrequency = Math.max(15, currentSettings.updateFrequency * 0.8);
            
            this.applyPerformanceLevel(this.currentLevel);
        }
    }
    
    /**
     * Public API methods
     */
    getPerformanceReport() {
        return {
            currentLevel: this.currentLevel,
            levelName: this.performanceLevels[this.currentLevel].name,
            metrics: { ...this.metrics },
            targets: { ...this.targets },
            history: {
                fps: this.performanceHistory.fps.slice(-10),
                memory: this.performanceHistory.memory.slice(-10),
                battery: this.performanceHistory.battery.slice(-10)
            },
            adaptiveSettings: { ...this.adaptiveSettings }
        };
    }
    
    forcePerformanceLevel(level) {
        this.adaptiveSettings.enabled = false;
        this.setPerformanceLevel(level);
        console.log(`⚡ Performance level manually forced to: ${level}`);
    }
    
    enableAdaptiveOptimization() {
        this.adaptiveSettings.enabled = true;
        console.log('⚡ Adaptive optimization enabled');
    }
    
    disableAdaptiveOptimization() {
        this.adaptiveSettings.enabled = false;
        console.log('⚡ Adaptive optimization disabled');
    }
    
    /**
     * Cleanup and shutdown
     */
    shutdown() {
        this.isActive = false;
        
        // Clear all intervals
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        console.log('⚡ MobilePerformanceManager shutdown');
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobilePerformanceManager;
}