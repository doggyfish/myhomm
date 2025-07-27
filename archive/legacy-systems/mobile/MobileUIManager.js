/**
 * MobileUIManager - Responsive mobile-first UI system for 2025 standards
 * Handles adaptive layouts, touch targets, and accessibility
 */
class MobileUIManager {
    constructor(game, mobileOptimizer) {
        this.game = game;
        this.mobileOptimizer = mobileOptimizer;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        
        // Screen and orientation tracking
        this.screenInfo = this.mobileOptimizer.screenSize;
        this.orientation = this.screenInfo.isPortrait ? 'portrait' : 'landscape';
        this.deviceType = this.mobileOptimizer.deviceType;
        
        // UI scaling and measurements
        this.uiScale = this.calculateUIScale();
        this.touchTargetSize = Math.max(44, this.uiScale * 40); // iOS HIG minimum
        this.safeAreaInsets = this.screenInfo.safeAreaInsets;
        
        // Layout configurations
        this.layouts = {
            portrait: this.createPortraitLayout(),
            landscape: this.createLandscapeLayout()
        };
        
        // UI element managers
        this.elements = {
            gameHUD: new MobileGameHUD(this),
            contextMenu: new MobileContextMenu(this),
            bottomSheet: new MobileBottomSheet(this),
            actionBar: new MobileActionBar(this),
            notifications: new MobileNotificationManager(this)
        };
        
        // UI state
        this.currentLayout = null;
        this.activeElements = new Set();
        this.animationsEnabled = true;
        this.highContrastMode = false;
        
        this.initialize();
    }
    
    /**
     * Initialize mobile UI system
     */
    initialize() {
        console.log('📱 MobileUIManager initializing...');
        console.log(`   📏 Screen: ${this.screenInfo.width}x${this.screenInfo.height}`);
        console.log(`   📱 Device: ${this.deviceType}, Scale: ${this.uiScale.toFixed(2)}`);
        console.log(`   🔄 Orientation: ${this.orientation}`);
        
        this.setupResponsiveLayout();
        this.setupOrientationHandling();
        this.setupAccessibility();
        this.setupUIElementManagers();
        
        // Apply initial layout
        this.applyLayout(this.orientation);
        
        console.log('📱 Mobile UI system initialized');
    }
    
    /**
     * Calculate appropriate UI scale factor
     */
    calculateUIScale() {
        const baseWidth = 375; // iPhone X width as baseline
        const currentWidth = this.screenInfo.width;
        const baseScale = currentWidth / baseWidth;
        
        // Apply constraints and device-specific adjustments
        let scale = Math.max(0.7, Math.min(2.5, baseScale));
        
        // Adjust for device pixel ratio
        if (this.screenInfo.dpr > 2) {
            scale *= 1.1; // Slightly larger on high-DPI screens
        }
        
        // Device type adjustments
        switch (this.deviceType) {
            case 'phone_small':
                scale *= 1.15; // Larger elements on small screens
                break;
            case 'tablet':
                scale *= 0.9; // Slightly smaller on tablets
                break;
        }
        
        return scale;
    }
    
    /**
     * Create layout configurations
     */
    createPortraitLayout() {
        return {
            name: 'portrait',
            gameArea: {
                x: this.safeAreaInsets.left,
                y: this.safeAreaInsets.top,
                width: this.screenInfo.width - this.safeAreaInsets.left - this.safeAreaInsets.right,
                height: this.screenInfo.height - this.safeAreaInsets.top - this.safeAreaInsets.bottom - this.touchTargetSize * 2
            },
            hud: {
                position: 'bottom',
                x: this.safeAreaInsets.left,
                y: this.screenInfo.height - this.safeAreaInsets.bottom - this.touchTargetSize * 2,
                width: this.screenInfo.width - this.safeAreaInsets.left - this.safeAreaInsets.right,
                height: this.touchTargetSize * 2
            },
            actionBar: {
                position: 'top',
                x: this.safeAreaInsets.left,
                y: this.safeAreaInsets.top,
                width: this.screenInfo.width - this.safeAreaInsets.left - this.safeAreaInsets.right,
                height: this.touchTargetSize
            },
            bottomSheet: {
                maxHeight: this.screenInfo.height * 0.6,
                position: 'bottom'
            }
        };
    }
    
    createLandscapeLayout() {
        const sidebarWidth = Math.min(this.screenInfo.width * 0.25, this.touchTargetSize * 4);
        
        return {
            name: 'landscape',
            gameArea: {
                x: this.safeAreaInsets.left,
                y: this.safeAreaInsets.top,
                width: this.screenInfo.width - this.safeAreaInsets.left - this.safeAreaInsets.right - sidebarWidth,
                height: this.screenInfo.height - this.safeAreaInsets.top - this.safeAreaInsets.bottom
            },
            hud: {
                position: 'right',
                x: this.screenInfo.width - this.safeAreaInsets.right - sidebarWidth,
                y: this.safeAreaInsets.top,
                width: sidebarWidth,
                height: this.screenInfo.height - this.safeAreaInsets.top - this.safeAreaInsets.bottom
            },
            actionBar: {
                position: 'right_top',
                x: this.screenInfo.width - this.safeAreaInsets.right - sidebarWidth,
                y: this.safeAreaInsets.top,
                width: sidebarWidth,
                height: this.touchTargetSize
            },
            bottomSheet: {
                maxWidth: this.screenInfo.width * 0.4,
                position: 'right'
            }
        };
    }
    
    /**
     * Setup responsive layout system
     */
    setupResponsiveLayout() {
        // Handle viewport changes
        const updateViewport = () => {
            this.updateScreenInfo();
            this.recalculateLayouts();
            this.applyLayout(this.orientation);
        };
        
        // Debounce viewport updates
        let viewportUpdateTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(viewportUpdateTimeout);
            viewportUpdateTimeout = setTimeout(updateViewport, 100);
        });
        
        // Handle visibility changes (app backgrounding)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppBackground();
            } else {
                this.handleAppForeground();
            }
        });
    }
    
    /**
     * Setup orientation change handling
     */
    setupOrientationHandling() {
        window.addEventListener('mobileOrientationChange', (event) => {
            this.handleOrientationChange(event.detail.screenSize);
        });
    }
    
    /**
     * Handle orientation changes
     */
    handleOrientationChange(newScreenSize) {
        const oldOrientation = this.orientation;
        this.screenInfo = newScreenSize;
        this.orientation = newScreenSize.isPortrait ? 'portrait' : 'landscape';
        
        console.log(`📱 UI Orientation change: ${oldOrientation} → ${this.orientation}`);
        
        // Recalculate UI measurements
        this.uiScale = this.calculateUIScale();
        this.touchTargetSize = Math.max(44, this.uiScale * 40);
        this.safeAreaInsets = newScreenSize.safeAreaInsets;
        
        // Update layouts
        this.layouts.portrait = this.createPortraitLayout();
        this.layouts.landscape = this.createLandscapeLayout();
        
        // Apply new layout with animation
        this.applyLayoutWithTransition(this.orientation);
        
        // Notify UI elements
        Object.values(this.elements).forEach(element => {
            if (element.onOrientationChange) {
                element.onOrientationChange(this.orientation, this.screenInfo);
            }
        });
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Check for user preferences
        this.checkAccessibilityPreferences();
        
        // Setup accessibility event listeners
        this.setupAccessibilityEventListeners();
        
        console.log('♿ Accessibility features initialized');
    }
    
    /**
     * Check accessibility preferences
     */
    checkAccessibilityPreferences() {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.animationsEnabled = false;
            console.log('♿ Reduced motion enabled');
        }
        
        // Check for high contrast preference
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        if (prefersHighContrast) {
            this.highContrastMode = true;
            console.log('♿ High contrast mode enabled');
        }
        
        // Check for large text preference
        const prefersLargeText = window.matchMedia('(prefers-reduced-data: reduce)').matches;
        if (prefersLargeText) {
            this.uiScale *= 1.2;
            console.log('♿ Large text mode enabled');
        }
    }
    
    /**
     * Setup accessibility event listeners
     */
    setupAccessibilityEventListeners() {
        // Listen for preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.animationsEnabled = !e.matches;
            this.updateAnimationSettings();
        });
        
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.highContrastMode = e.matches;
            this.updateContrastSettings();
        });
    }
    
    /**
     * Setup UI element managers
     */
    setupUIElementManagers() {
        // Initialize all UI elements
        Object.values(this.elements).forEach(element => {
            if (element.initialize) {
                element.initialize();
            }
        });
    }
    
    /**
     * Apply layout configuration
     */
    applyLayout(orientation) {
        const layout = this.layouts[orientation];
        if (!layout) {
            console.error('📱 Invalid layout orientation:', orientation);
            return;
        }
        
        this.currentLayout = layout;
        
        // Update canvas/game area
        this.updateGameArea(layout.gameArea);
        
        // Update UI elements
        this.updateUIElements(layout);
        
        console.log(`📱 Applied ${orientation} layout`);
    }
    
    /**
     * Apply layout with smooth transition
     */
    applyLayoutWithTransition(orientation) {
        if (!this.animationsEnabled) {
            this.applyLayout(orientation);
            return;
        }
        
        // Add transition class
        document.body.classList.add('ui-transitioning');
        
        // Apply layout
        this.applyLayout(orientation);
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('ui-transitioning');
        }, 300);
    }
    
    /**
     * Update game area dimensions
     */
    updateGameArea(gameArea) {
        if (this.game.updateGameArea) {
            this.game.updateGameArea(gameArea);
        }
        
        // Update canvas size if needed
        if (this.canvas.width !== gameArea.width || this.canvas.height !== gameArea.height) {
            this.canvas.width = gameArea.width;
            this.canvas.height = gameArea.height;
            
            // Update game settings
            if (this.game.settings) {
                this.game.settings.gameArea = gameArea;
            }
        }
    }
    
    /**
     * Update UI elements with layout
     */
    updateUIElements(layout) {
        // Update HUD
        if (this.elements.gameHUD) {
            this.elements.gameHUD.updateLayout(layout.hud);
        }
        
        // Update action bar
        if (this.elements.actionBar) {
            this.elements.actionBar.updateLayout(layout.actionBar);
        }
        
        // Update bottom sheet
        if (this.elements.bottomSheet) {
            this.elements.bottomSheet.updateLayout(layout.bottomSheet);
        }
    }
    
    /**
     * Screen and layout utilities
     */
    updateScreenInfo() {
        this.screenInfo = {
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: window.devicePixelRatio || 1,
            isPortrait: window.innerHeight > window.innerWidth,
            safeAreaInsets: this.getSafeAreaInsets()
        };
    }
    
    getSafeAreaInsets() {
        // Try to get CSS environment variables
        const style = getComputedStyle(document.documentElement);
        
        return {
            top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
            right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
            bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
            left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
        };
    }
    
    recalculateLayouts() {
        this.layouts.portrait = this.createPortraitLayout();
        this.layouts.landscape = this.createLandscapeLayout();
    }
    
    /**
     * App lifecycle handlers
     */
    handleAppBackground() {
        console.log('📱 App backgrounded - pausing UI animations');
        
        // Pause expensive UI operations
        Object.values(this.elements).forEach(element => {
            if (element.onAppBackground) {
                element.onAppBackground();
            }
        });
    }
    
    handleAppForeground() {
        console.log('📱 App foregrounded - resuming UI');
        
        // Resume UI operations
        Object.values(this.elements).forEach(element => {
            if (element.onAppForeground) {
                element.onAppForeground();
            }
        });
        
        // Refresh layout in case screen changed
        this.updateScreenInfo();
        this.applyLayout(this.orientation);
    }
    
    /**
     * Accessibility updates
     */
    updateAnimationSettings() {
        // Update all UI elements with animation preference
        Object.values(this.elements).forEach(element => {
            if (element.setAnimationsEnabled) {
                element.setAnimationsEnabled(this.animationsEnabled);
            }
        });
        
        console.log(`♿ Animations ${this.animationsEnabled ? 'enabled' : 'disabled'}`);
    }
    
    updateContrastSettings() {
        // Apply high contrast styles
        if (this.highContrastMode) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        console.log(`♿ High contrast ${this.highContrastMode ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * UI element access methods
     */
    showContextMenu(x, y, options) {
        if (this.elements.contextMenu) {
            this.elements.contextMenu.show(x, y, options);
        }
    }
    
    hideContextMenu() {
        if (this.elements.contextMenu) {
            this.elements.contextMenu.hide();
        }
    }
    
    showBottomSheet(content, options = {}) {
        if (this.elements.bottomSheet) {
            this.elements.bottomSheet.show(content, options);
        }
    }
    
    hideBottomSheet() {
        if (this.elements.bottomSheet) {
            this.elements.bottomSheet.hide();
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        if (this.elements.notifications) {
            this.elements.notifications.show(message, type, duration);
        }
    }
    
    updateHUD(data) {
        if (this.elements.gameHUD) {
            this.elements.gameHUD.update(data);
        }
    }
    
    /**
     * Public API methods
     */
    getLayoutInfo() {
        return {
            orientation: this.orientation,
            deviceType: this.deviceType,
            screenInfo: this.screenInfo,
            uiScale: this.uiScale,
            touchTargetSize: this.touchTargetSize,
            currentLayout: this.currentLayout,
            animationsEnabled: this.animationsEnabled,
            highContrastMode: this.highContrastMode
        };
    }
    
    isPortrait() {
        return this.orientation === 'portrait';
    }
    
    isLandscape() {
        return this.orientation === 'landscape';
    }
    
    getTouchTargetSize() {
        return this.touchTargetSize;
    }
    
    getUIScale() {
        return this.uiScale;
    }
    
    getSafeArea() {
        return this.currentLayout ? this.currentLayout.gameArea : null;
    }
    
    /**
     * Utility methods for touch target optimization
     */
    optimizeTouchTarget(element, minSize = null) {
        const targetSize = minSize || this.touchTargetSize;
        
        // Ensure minimum touch target size
        if (element.width < targetSize) {
            element.width = targetSize;
        }
        if (element.height < targetSize) {
            element.height = targetSize;
        }
        
        return element;
    }
    
    createTouchFriendlyButton(text, x, y, callback, options = {}) {
        const button = {
            text: text,
            x: x,
            y: y,
            width: options.width || this.touchTargetSize * 2,
            height: options.height || this.touchTargetSize,
            callback: callback,
            style: {
                fontSize: this.uiScale * 16,
                fontFamily: 'Arial, sans-serif',
                backgroundColor: options.backgroundColor || '#4CAF50',
                textColor: options.textColor || '#FFFFFF',
                borderRadius: options.borderRadius || 8,
                ...options.style
            }
        };
        
        return this.optimizeTouchTarget(button);
    }
    
    /**
     * Responsive text sizing
     */
    getResponsiveFontSize(baseSize) {
        return Math.round(baseSize * this.uiScale);
    }
    
    getResponsiveSpacing(baseSpacing) {
        return Math.round(baseSpacing * this.uiScale);
    }
    
    /**
     * Color and contrast utilities
     */
    getContrastColor(backgroundColor) {
        if (!this.highContrastMode) {
            return null; // Use default colors
        }
        
        // Return high contrast alternatives
        const contrastColors = {
            '#FFFFFF': '#000000',
            '#000000': '#FFFFFF',
            '#4CAF50': '#FFFFFF',
            '#F44336': '#FFFFFF',
            '#2196F3': '#FFFFFF'
        };
        
        return contrastColors[backgroundColor] || '#FFFFFF';
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Clean up event listeners
        window.removeEventListener('mobileOrientationChange', this.handleOrientationChange);
        
        // Destroy UI elements
        Object.values(this.elements).forEach(element => {
            if (element.destroy) {
                element.destroy();
            }
        });
        
        console.log('📱 MobileUIManager destroyed');
    }
}

/**
 * Mobile Game HUD - Top-level game information display
 */
class MobileGameHUD {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.layout = null;
        this.visible = true;
        this.elements = {};
    }
    
    initialize() {
        console.log('📱 MobileGameHUD initialized');
    }
    
    updateLayout(layout) {
        this.layout = layout;
        this.repositionElements();
    }
    
    repositionElements() {
        // Reposition HUD elements based on current layout
        if (!this.layout) return;
        
        const { x, y, width, height } = this.layout;
        const elementWidth = width / 4; // Divide into 4 sections
        
        this.elements = {
            gold: { x: x, y: y, width: elementWidth, height: height },
            population: { x: x + elementWidth, y: y, width: elementWidth, height: height },
            time: { x: x + elementWidth * 2, y: y, width: elementWidth, height: height },
            menu: { x: x + elementWidth * 3, y: y, width: elementWidth, height: height }
        };
    }
    
    update(data) {
        // Update HUD with game data
        this.data = data;
    }
    
    render(ctx) {
        if (!this.visible || !this.layout) return;
        
        // Render HUD background
        ctx.fillStyle = this.uiManager.highContrastMode ? '#000000' : 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.layout.x, this.layout.y, this.layout.width, this.layout.height);
        
        // Render HUD elements
        this.renderHUDElements(ctx);
    }
    
    renderHUDElements(ctx) {
        const fontSize = this.uiManager.getResponsiveFontSize(14);
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Render each element
        Object.entries(this.elements).forEach(([key, element]) => {
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            
            let text = key;
            if (this.data) {
                switch (key) {
                    case 'gold':
                        text = `💰 ${this.data.gold || 0}`;
                        break;
                    case 'population':
                        text = `👥 ${this.data.population || 0}`;
                        break;
                    case 'time':
                        text = `⏱️ ${this.data.time || '00:00'}`;
                        break;
                    case 'menu':
                        text = '☰';
                        break;
                }
            }
            
            ctx.fillText(text, centerX, centerY);
        });
    }
    
    onOrientationChange(orientation, screenInfo) {
        console.log(`📱 HUD orientation changed to ${orientation}`);
    }
    
    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
    }
}

/**
 * Mobile Context Menu - Touch-optimized context menu
 */
class MobileContextMenu {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.visible = false;
        this.position = { x: 0, y: 0 };
        this.options = [];
        this.selectedIndex = -1;
    }
    
    initialize() {
        console.log('📱 MobileContextMenu initialized');
    }
    
    show(x, y, options) {
        this.position = { x, y };
        this.options = options || [];
        this.visible = true;
        this.selectedIndex = -1;
        
        // Adjust position to stay within screen bounds
        this.adjustPosition();
        
        console.log('📱 Context menu shown at', this.position);
    }
    
    hide() {
        this.visible = false;
        this.selectedIndex = -1;
        console.log('📱 Context menu hidden');
    }
    
    adjustPosition() {
        const menuWidth = this.uiManager.touchTargetSize * 3;
        const menuHeight = this.options.length * this.uiManager.touchTargetSize;
        
        // Adjust horizontal position
        if (this.position.x + menuWidth > this.uiManager.screenInfo.width) {
            this.position.x = this.uiManager.screenInfo.width - menuWidth;
        }
        
        // Adjust vertical position
        if (this.position.y + menuHeight > this.uiManager.screenInfo.height) {
            this.position.y = this.uiManager.screenInfo.height - menuHeight;
        }
        
        // Ensure minimum margins
        this.position.x = Math.max(10, this.position.x);
        this.position.y = Math.max(10, this.position.y);
    }
    
    render(ctx) {
        if (!this.visible || this.options.length === 0) return;
        
        const menuWidth = this.uiManager.touchTargetSize * 3;
        const itemHeight = this.uiManager.touchTargetSize;
        const menuHeight = this.options.length * itemHeight;
        
        // Draw menu background
        ctx.fillStyle = this.uiManager.highContrastMode ? '#000000' : 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(this.position.x, this.position.y, menuWidth, menuHeight);
        
        // Draw menu border
        ctx.strokeStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, menuWidth, menuHeight);
        
        // Draw menu items
        this.renderMenuItems(ctx, menuWidth, itemHeight);
    }
    
    renderMenuItems(ctx, menuWidth, itemHeight) {
        const fontSize = this.uiManager.getResponsiveFontSize(16);
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        this.options.forEach((option, index) => {
            const itemY = this.position.y + index * itemHeight;
            
            // Highlight selected item
            if (index === this.selectedIndex) {
                ctx.fillStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#4CAF50';
                ctx.fillRect(this.position.x, itemY, menuWidth, itemHeight);
            }
            
            // Draw text
            ctx.fillStyle = index === this.selectedIndex ? 
                (this.uiManager.highContrastMode ? '#000000' : '#FFFFFF') :
                (this.uiManager.highContrastMode ? '#FFFFFF' : '#FFFFFF');
            
            const textX = this.position.x + menuWidth / 2;
            const textY = itemY + itemHeight / 2;
            ctx.fillText(option.text, textX, textY);
            
            // Draw separator line
            if (index < this.options.length - 1) {
                ctx.strokeStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#444444';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.position.x, itemY + itemHeight);
                ctx.lineTo(this.position.x + menuWidth, itemY + itemHeight);
                ctx.stroke();
            }
        });
    }
}

/**
 * Mobile Bottom Sheet - Swipeable content panel
 */
class MobileBottomSheet {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.visible = false;
        this.content = null;
        this.height = 0;
        this.maxHeight = 0;
        this.dragOffset = 0;
        this.isDragging = false;
    }
    
    initialize() {
        console.log('📱 MobileBottomSheet initialized');
    }
    
    updateLayout(layout) {
        this.maxHeight = layout.maxHeight || this.uiManager.screenInfo.height * 0.6;
    }
    
    show(content, options = {}) {
        this.content = content;
        this.height = options.height || this.maxHeight * 0.5;
        this.visible = true;
        
        console.log('📱 Bottom sheet shown');
    }
    
    hide() {
        this.visible = false;
        this.content = null;
        this.height = 0;
        this.dragOffset = 0;
        
        console.log('📱 Bottom sheet hidden');
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        const screenHeight = this.uiManager.screenInfo.height;
        const sheetY = screenHeight - this.height + this.dragOffset;
        const sheetWidth = this.uiManager.screenInfo.width;
        
        // Draw sheet background
        ctx.fillStyle = this.uiManager.highContrastMode ? '#000000' : 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, sheetY, sheetWidth, this.height);
        
        // Draw drag handle
        this.renderDragHandle(ctx, sheetWidth, sheetY);
        
        // Draw content
        if (this.content) {
            this.renderContent(ctx, sheetWidth, sheetY);
        }
    }
    
    renderDragHandle(ctx, width, y) {
        const handleWidth = 60;
        const handleHeight = 4;
        const handleX = (width - handleWidth) / 2;
        const handleY = y + 10;
        
        ctx.fillStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#CCCCCC';
        ctx.fillRect(handleX, handleY, handleWidth, handleHeight);
    }
    
    renderContent(ctx, width, y) {
        // Render sheet content
        const contentY = y + 30; // Account for drag handle
        const contentHeight = this.height - 30;
        
        if (typeof this.content === 'string') {
            // Simple text content
            const fontSize = this.uiManager.getResponsiveFontSize(16);
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(this.content, width / 2, contentY + contentHeight / 2);
        }
        // Add more content types as needed
    }
}

/**
 * Mobile Action Bar - Quick access toolbar
 */
class MobileActionBar {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.layout = null;
        this.actions = [];
        this.visible = true;
    }
    
    initialize() {
        this.setupDefaultActions();
        console.log('📱 MobileActionBar initialized');
    }
    
    setupDefaultActions() {
        this.actions = [
            { icon: '🏰', label: 'Castles', action: () => this.showCastleList() },
            { icon: '⚔️', label: 'Armies', action: () => this.showArmyList() },
            { icon: '📊', label: 'Stats', action: () => this.showStats() },
            { icon: '⚙️', label: 'Settings', action: () => this.showSettings() }
        ];
    }
    
    updateLayout(layout) {
        this.layout = layout;
    }
    
    render(ctx) {
        if (!this.visible || !this.layout) return;
        
        // Render action bar background
        ctx.fillStyle = this.uiManager.highContrastMode ? '#000000' : 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.layout.x, this.layout.y, this.layout.width, this.layout.height);
        
        // Render actions
        this.renderActions(ctx);
    }
    
    renderActions(ctx) {
        const actionWidth = this.layout.width / this.actions.length;
        const fontSize = this.uiManager.getResponsiveFontSize(12);
        
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#FFFFFF';
        
        this.actions.forEach((action, index) => {
            const x = this.layout.x + index * actionWidth;
            const centerX = x + actionWidth / 2;
            const centerY = this.layout.y + this.layout.height / 2;
            
            // Draw action
            ctx.fillText(`${action.icon} ${action.label}`, centerX, centerY);
        });
    }
    
    // Action handlers
    showCastleList() {
        console.log('📱 Show castle list');
    }
    
    showArmyList() {
        console.log('📱 Show army list');
    }
    
    showStats() {
        console.log('📱 Show stats');
    }
    
    showSettings() {
        console.log('📱 Show settings');
    }
}

/**
 * Mobile Notification Manager - Toast notifications
 */
class MobileNotificationManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.notifications = [];
        this.maxNotifications = 3;
    }
    
    initialize() {
        console.log('📱 MobileNotificationManager initialized');
    }
    
    show(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            startTime: Date.now(),
            duration,
            opacity: 1.0
        };
        
        this.notifications.push(notification);
        
        // Remove old notifications if we have too many
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }
        
        // Auto-remove after duration
        setTimeout(() => {
            this.remove(notification.id);
        }, duration);
        
        console.log(`📱 Notification: ${message}`);
    }
    
    remove(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    render(ctx) {
        if (this.notifications.length === 0) return;
        
        const notificationHeight = this.uiManager.touchTargetSize * 0.8;
        const notificationWidth = Math.min(300, this.uiManager.screenInfo.width - 40);
        const startY = this.uiManager.safeAreaInsets.top + 10;
        
        this.notifications.forEach((notification, index) => {
            const y = startY + index * (notificationHeight + 10);
            const x = (this.uiManager.screenInfo.width - notificationWidth) / 2;
            
            this.renderNotification(ctx, notification, x, y, notificationWidth, notificationHeight);
        });
    }
    
    renderNotification(ctx, notification, x, y, width, height) {
        // Calculate fade out
        const elapsed = Date.now() - notification.startTime;
        const fadeStartTime = notification.duration - 500; // Start fading 500ms before removal
        
        if (elapsed > fadeStartTime) {
            notification.opacity = Math.max(0, 1 - (elapsed - fadeStartTime) / 500);
        }
        
        // Set opacity
        ctx.globalAlpha = notification.opacity;
        
        // Draw background
        const colors = {
            info: this.uiManager.highContrastMode ? '#000000' : '#2196F3',
            success: this.uiManager.highContrastMode ? '#000000' : '#4CAF50',
            warning: this.uiManager.highContrastMode ? '#000000' : '#FF9800',
            error: this.uiManager.highContrastMode ? '#000000' : '#F44336'
        };
        
        ctx.fillStyle = colors[notification.type] || colors.info;
        ctx.fillRect(x, y, width, height);
        
        // Draw text
        const fontSize = this.uiManager.getResponsiveFontSize(14);
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = this.uiManager.highContrastMode ? '#FFFFFF' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(notification.message, x + width / 2, y + height / 2);
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        MobileUIManager, 
        MobileGameHUD, 
        MobileContextMenu, 
        MobileBottomSheet, 
        MobileActionBar, 
        MobileNotificationManager 
    };
}