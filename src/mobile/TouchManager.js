/**
 * TouchManager - Advanced touch controls for mobile strategy gaming
 * Handles all touch gestures with haptic feedback and strategy game optimizations
 */
class TouchManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isEnabled = true;
        
        // Gesture configuration
        this.gestures = {
            tap: { 
                enabled: true, 
                threshold: 150, // Max time for tap (ms)
                tolerance: 10   // Max movement distance (px)
            },
            longPress: { 
                enabled: true, 
                threshold: 500, // Long press duration (ms)
                tolerance: 15   // Max movement during long press
            },
            swipe: { 
                enabled: true, 
                threshold: 50,  // Min distance for swipe (px)
                velocity: 0.3   // Min velocity for swipe
            },
            pinch: { 
                enabled: true, 
                threshold: 0.1, // Min scale change
                maxScale: 3.0,  // Max zoom level
                minScale: 0.5   // Min zoom level
            },
            drag: { 
                enabled: true, 
                threshold: 10,  // Min distance to start drag
                momentum: 0.9   // Momentum decay factor
            },
            doubleTap: {
                enabled: true,
                threshold: 300, // Max time between taps
                tolerance: 20   // Max distance between taps
            }
        };
        
        // Touch state tracking
        this.touchState = {
            touches: new Map(),
            lastTouchTime: 0,
            lastTapTime: 0,
            lastTapPosition: null,
            longPressTimer: null,
            dragInProgress: false,
            pinchInProgress: false,
            currentZoom: 1.0,
            dragMomentum: { x: 0, y: 0 }
        };
        
        // Event callbacks
        this.callbacks = {
            onTap: null,
            onDoubleTap: null,
            onLongPress: null,
            onSwipe: null,
            onPinch: null,
            onDragStart: null,
            onDragMove: null,
            onDragEnd: null
        };
        
        this.initialize();
    }
    
    /**
     * Initialize touch event system
     */
    initialize() {
        console.log('📱 TouchManager initialized');
        
        this.setupTouchEvents();
        this.setupPreventDefaults();
        this.startMomentumDecay();
        
        // Setup game-specific touch handlers
        this.setupGameTouchHandlers();
    }
    
    /**
     * Setup touch event listeners
     */
    setupTouchEvents() {
        // Touch events with passive: false to allow preventDefault
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { 
            passive: false, 
            capture: true 
        });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { 
            passive: false, 
            capture: true 
        });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { 
            passive: false, 
            capture: true 
        });
        this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { 
            passive: false, 
            capture: true 
        });
        
        // Mouse events for desktop testing
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        console.log('👆 Touch events registered');
    }
    
    /**
     * Setup preventDefault for mobile optimization
     */
    setupPreventDefaults() {
        // Prevent context menu on mobile
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        // Prevent zoom and scroll on game canvas
        this.canvas.addEventListener('gesturestart', e => e.preventDefault());
        this.canvas.addEventListener('gesturechange', e => e.preventDefault());
        this.canvas.addEventListener('gestureend', e => e.preventDefault());
        
        // Prevent double-tap zoom
        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';
        this.canvas.style.webkitUserSelect = 'none';
    }
    
    /**
     * Setup game-specific touch handlers
     */
    setupGameTouchHandlers() {
        this.callbacks.onTap = this.handleGameTap.bind(this);
        this.callbacks.onDoubleTap = this.handleGameDoubleTap.bind(this);
        this.callbacks.onLongPress = this.handleGameLongPress.bind(this);
        this.callbacks.onSwipe = this.handleGameSwipe.bind(this);
        this.callbacks.onPinch = this.handleGamePinch.bind(this);
        this.callbacks.onDragStart = this.handleGameDragStart.bind(this);
        this.callbacks.onDragMove = this.handleGameDragMove.bind(this);
        this.callbacks.onDragEnd = this.handleGameDragEnd.bind(this);
    }
    
    /**
     * Handle touch start events
     */
    handleTouchStart(event) {
        if (!this.isEnabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const touches = Array.from(event.changedTouches);
        const currentTime = Date.now();
        
        // Store touch data
        touches.forEach(touch => {
            const position = this.getCanvasPosition(touch.clientX, touch.clientY);
            const touchData = {
                id: touch.identifier,
                startX: position.x,
                startY: position.y,
                currentX: position.x,
                currentY: position.y,
                startTime: currentTime,
                moved: false,
                distance: 0
            };
            
            this.touchState.touches.set(touch.identifier, touchData);
        });
        
        // Handle different touch patterns
        const totalTouches = event.touches.length;
        
        if (totalTouches === 1) {
            this.handleSingleTouchStart(touches[0], currentTime);
        } else if (totalTouches === 2) {
            this.handlePinchStart(Array.from(event.touches));
        } else {
            // Cancel ongoing gestures for 3+ touches
            this.cancelAllGestures();
        }
    }
    
    /**
     * Handle single touch start
     */
    handleSingleTouchStart(touch, currentTime) {
        const position = this.getCanvasPosition(touch.clientX, touch.clientY);
        
        // Check for double tap
        if (this.gestures.doubleTap.enabled && this.lastTapTime && this.lastTapPosition) {
            const timeDelta = currentTime - this.lastTapTime;
            const distance = this.calculateDistance(position, this.lastTapPosition);
            
            if (timeDelta < this.gestures.doubleTap.threshold && 
                distance < this.gestures.doubleTap.tolerance) {
                this.triggerDoubleTap(position);
                this.lastTapTime = 0; // Reset to prevent triple tap
                return;
            }
        }
        
        // Start long press timer
        if (this.gestures.longPress.enabled) {
            this.touchState.longPressTimer = setTimeout(() => {
                const touchData = this.touchState.touches.get(touch.identifier);
                if (touchData && !touchData.moved) {
                    this.triggerLongPress(position);
                }
            }, this.gestures.longPress.threshold);
        }
    }
    
    /**
     * Handle pinch start
     */
    handlePinchStart(touches) {
        if (!this.gestures.pinch.enabled || touches.length !== 2) return;
        
        this.cancelLongPress();
        this.touchState.pinchInProgress = true;
        
        const pos1 = this.getCanvasPosition(touches[0].clientX, touches[0].clientY);
        const pos2 = this.getCanvasPosition(touches[1].clientX, touches[1].clientY);
        
        this.touchState.pinchData = {
            initialDistance: this.calculateDistance(pos1, pos2),
            initialScale: this.touchState.currentZoom,
            center: {
                x: (pos1.x + pos2.x) / 2,
                y: (pos1.y + pos2.y) / 2
            }
        };
    }
    
    /**
     * Handle touch move events
     */
    handleTouchMove(event) {
        if (!this.isEnabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const touches = Array.from(event.changedTouches);
        
        // Update touch data
        touches.forEach(touch => {
            const touchData = this.touchState.touches.get(touch.identifier);
            if (!touchData) return;
            
            const position = this.getCanvasPosition(touch.clientX, touch.clientY);
            const deltaX = position.x - touchData.startX;
            const deltaY = position.y - touchData.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Update touch data
            touchData.currentX = position.x;
            touchData.currentY = position.y;
            touchData.distance = distance;
            
            // Check if touch has moved significantly
            if (!touchData.moved && distance > this.gestures.drag.threshold) {
                touchData.moved = true;
                this.cancelLongPress();
                
                // Start drag if single touch
                if (event.touches.length === 1 && this.gestures.drag.enabled) {
                    this.startDrag(touchData);
                }
            }
        });
        
        // Handle ongoing gestures
        if (event.touches.length === 1 && this.touchState.dragInProgress) {
            this.updateDrag();
        } else if (event.touches.length === 2 && this.touchState.pinchInProgress) {
            this.updatePinch(Array.from(event.touches));
        }
    }
    
    /**
     * Handle touch end events
     */
    handleTouchEnd(event) {
        if (!this.isEnabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const touches = Array.from(event.changedTouches);
        const currentTime = Date.now();
        
        // Process ended touches
        touches.forEach(touch => {
            const touchData = this.touchState.touches.get(touch.identifier);
            if (!touchData) return;
            
            const touchDuration = currentTime - touchData.startTime;
            const position = this.getCanvasPosition(touch.clientX, touch.clientY);
            
            // Handle tap if touch was quick and didn't move much
            if (!touchData.moved && 
                touchDuration < this.gestures.tap.threshold && 
                touchData.distance < this.gestures.tap.tolerance) {
                
                this.triggerTap(position);
                this.lastTapTime = currentTime;
                this.lastTapPosition = position;
            }
            // Handle swipe if moved significantly
            else if (touchData.moved && touchData.distance > this.gestures.swipe.threshold) {
                const velocity = touchData.distance / touchDuration;
                if (velocity > this.gestures.swipe.velocity) {
                    this.triggerSwipe(touchData, velocity);
                }
            }
            
            // Clean up touch data
            this.touchState.touches.delete(touch.identifier);
        });
        
        // End gestures if no more touches
        if (event.touches.length === 0) {
            this.cancelLongPress();
            this.endDrag();
            this.touchState.pinchInProgress = false;
        } else if (event.touches.length === 1 && this.touchState.pinchInProgress) {
            // Pinch ended, one finger remains
            this.touchState.pinchInProgress = false;
        }
    }
    
    /**
     * Handle touch cancel events
     */
    handleTouchCancel(event) {
        this.cancelAllGestures();
        this.touchState.touches.clear();
    }
    
    /**
     * Mouse event handlers for desktop testing
     */
    handleMouseDown(event) {
        if (this.isTouchDevice()) return; // Ignore if touch device
        
        const position = this.getCanvasPosition(event.clientX, event.clientY);
        this.simulateTouchStart(position);
    }
    
    handleMouseMove(event) {
        if (this.isTouchDevice()) return;
        
        const position = this.getCanvasPosition(event.clientX, event.clientY);
        this.simulateTouchMove(position);
    }
    
    handleMouseUp(event) {
        if (this.isTouchDevice()) return;
        
        const position = this.getCanvasPosition(event.clientX, event.clientY);
        this.simulateTouchEnd(position);
    }
    
    /**
     * Game-specific touch handlers
     */
    handleGameTap(position) {
        console.log('👆 Tap at:', position);
        
        const gridPos = this.game.screenToGrid(position.x, position.y);
        
        // Handle castle selection
        const castle = this.game.getCastleAtPosition(gridPos.x, gridPos.y);
        if (castle) {
            this.game.selectCastle(castle);
            this.provideTactileFeedback('selection');
            return;
        }
        
        // Handle army selection
        const army = this.game.getArmyAtPosition(gridPos.x, gridPos.y);
        if (army) {
            this.game.selectArmy(army);
            this.provideTactileFeedback('selection');
            return;
        }
        
        // Handle movement command
        if (this.game.ui.selectedCastle || this.game.ui.selectedArmy) {
            this.game.issueMovementCommand(gridPos.x, gridPos.y);
            this.provideTactileFeedback('action');
        } else {
            // Deselect if tapping empty space
            this.game.clearSelection();
        }
    }
    
    handleGameDoubleTap(position) {
        console.log('👆👆 Double tap at:', position);
        
        const gridPos = this.game.screenToGrid(position.x, position.y);
        
        // Double tap castle to show quick army menu
        const castle = this.game.getCastleAtPosition(gridPos.x, gridPos.y);
        if (castle && castle.owner === this.game.getHumanPlayer()) {
            this.game.showQuickArmyMenu(castle);
            this.provideTactileFeedback('action');
        }
    }
    
    handleGameLongPress(position) {
        console.log('👆⏳ Long press at:', position);
        
        const gridPos = this.game.screenToGrid(position.x, position.y);
        
        // Show context menu
        this.game.showMobileContextMenu(gridPos.x, gridPos.y, position);
        this.provideTactileFeedback('longPress');
    }
    
    handleGameSwipe(touchData, velocity) {
        const deltaX = touchData.currentX - touchData.startX;
        const deltaY = touchData.currentY - touchData.startY;
        const direction = this.getSwipeDirection(deltaX, deltaY);
        
        console.log('👆➡️ Swipe:', direction, 'velocity:', velocity);
        
        // Pan camera based on swipe
        const panDistance = Math.min(200, velocity * 100);
        this.panCamera(direction, panDistance);
    }
    
    handleGamePinch(scale, center) {
        console.log('👆🔍 Pinch zoom:', scale, 'at:', center);
        
        // Apply zoom with constraints
        const newZoom = Math.max(this.gestures.pinch.minScale, 
                         Math.min(this.gestures.pinch.maxScale, scale));
        
        if (this.game.camera) {
            this.game.camera.setZoom(newZoom, center);
        }
        
        this.touchState.currentZoom = newZoom;
        this.provideTactileFeedback('zoom');
    }
    
    handleGameDragStart(touchData) {
        console.log('👆🔄 Drag start');
        
        // Start camera panning
        if (this.game.camera) {
            this.game.camera.startPan();
        }
    }
    
    handleGameDragMove(deltaX, deltaY) {
        // Update camera position
        if (this.game.camera) {
            this.game.camera.pan(-deltaX, -deltaY);
        }
        
        // Store momentum for inertial scrolling
        this.touchState.dragMomentum.x = deltaX;
        this.touchState.dragMomentum.y = deltaY;
    }
    
    handleGameDragEnd() {
        console.log('👆🔄 Drag end');
        
        if (this.game.camera) {
            this.game.camera.endPan();
        }
        
        // Apply momentum scrolling
        this.startMomentumScrolling();
    }
    
    /**
     * Utility methods
     */
    getCanvasPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getSwipeDirection(deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    panCamera(direction, distance) {
        if (!this.game.camera) return;
        
        switch (direction) {
            case 'up':
                this.game.camera.moveBy(0, -distance);
                break;
            case 'down':
                this.game.camera.moveBy(0, distance);
                break;
            case 'left':
                this.game.camera.moveBy(-distance, 0);
                break;
            case 'right':
                this.game.camera.moveBy(distance, 0);
                break;
        }
    }
    
    startMomentumScrolling() {
        const momentum = this.touchState.dragMomentum;
        const threshold = 1; // Minimum velocity to continue scrolling
        
        if (Math.abs(momentum.x) > threshold || Math.abs(momentum.y) > threshold) {
            this.applyMomentum();
        }
    }
    
    applyMomentum() {
        const momentum = this.touchState.dragMomentum;
        const decay = this.gestures.drag.momentum;
        
        if (Math.abs(momentum.x) > 0.1 || Math.abs(momentum.y) > 0.1) {
            if (this.game.camera) {
                this.game.camera.pan(-momentum.x, -momentum.y);
            }
            
            momentum.x *= decay;
            momentum.y *= decay;
            
            requestAnimationFrame(() => this.applyMomentum());
        }
    }
    
    startMomentumDecay() {
        // Reduce momentum over time
        setInterval(() => {
            const momentum = this.touchState.dragMomentum;
            momentum.x *= 0.95;
            momentum.y *= 0.95;
        }, 16); // ~60fps
    }
    
    /**
     * Gesture triggering methods
     */
    triggerTap(position) {
        if (this.callbacks.onTap) {
            this.callbacks.onTap(position);
        }
    }
    
    triggerDoubleTap(position) {
        if (this.callbacks.onDoubleTap) {
            this.callbacks.onDoubleTap(position);
        }
    }
    
    triggerLongPress(position) {
        if (this.callbacks.onLongPress) {
            this.callbacks.onLongPress(position);
        }
    }
    
    triggerSwipe(touchData, velocity) {
        if (this.callbacks.onSwipe) {
            this.callbacks.onSwipe(touchData, velocity);
        }
    }
    
    startDrag(touchData) {
        this.touchState.dragInProgress = true;
        if (this.callbacks.onDragStart) {
            this.callbacks.onDragStart(touchData);
        }
    }
    
    updateDrag() {
        if (!this.touchState.dragInProgress) return;
        
        // Calculate drag delta from the first touch
        const firstTouch = this.touchState.touches.values().next().value;
        if (firstTouch) {
            const deltaX = firstTouch.currentX - firstTouch.startX;
            const deltaY = firstTouch.currentY - firstTouch.startY;
            
            if (this.callbacks.onDragMove) {
                this.callbacks.onDragMove(deltaX, deltaY);
            }
        }
    }
    
    endDrag() {
        if (this.touchState.dragInProgress) {
            this.touchState.dragInProgress = false;
            if (this.callbacks.onDragEnd) {
                this.callbacks.onDragEnd();
            }
        }
    }
    
    updatePinch(touches) {
        if (!this.touchState.pinchInProgress || touches.length !== 2) return;
        
        const pos1 = this.getCanvasPosition(touches[0].clientX, touches[0].clientY);
        const pos2 = this.getCanvasPosition(touches[1].clientX, touches[1].clientY);
        const currentDistance = this.calculateDistance(pos1, pos2);
        
        const pinchData = this.touchState.pinchData;
        const scaleChange = currentDistance / pinchData.initialDistance;
        const newScale = pinchData.initialScale * scaleChange;
        
        if (Math.abs(scaleChange - 1) > this.gestures.pinch.threshold) {
            if (this.callbacks.onPinch) {
                this.callbacks.onPinch(newScale, pinchData.center);
            }
        }
    }
    
    /**
     * Gesture cancellation
     */
    cancelLongPress() {
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }
    }
    
    cancelAllGestures() {
        this.cancelLongPress();
        this.endDrag();
        this.touchState.pinchInProgress = false;
        this.touchState.dragMomentum.x = 0;
        this.touchState.dragMomentum.y = 0;
    }
    
    /**
     * Haptic feedback
     */
    provideTactileFeedback(type) {
        if (!navigator.vibrate) return;
        
        switch (type) {
            case 'selection':
                navigator.vibrate(50);
                break;
            case 'action':
                navigator.vibrate([50, 30, 50]);
                break;
            case 'longPress':
                navigator.vibrate(100);
                break;
            case 'zoom':
                navigator.vibrate(30);
                break;
            default:
                navigator.vibrate(25);
        }
    }
    
    /**
     * Utility methods
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    enable() {
        this.isEnabled = true;
        console.log('👆 Touch controls enabled');
    }
    
    disable() {
        this.isEnabled = false;
        this.cancelAllGestures();
        console.log('👆 Touch controls disabled');
    }
    
    /**
     * Get current touch state for debugging
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            activeTouches: this.touchState.touches.size,
            dragInProgress: this.touchState.dragInProgress,
            pinchInProgress: this.touchState.pinchInProgress,
            currentZoom: this.touchState.currentZoom,
            momentum: this.touchState.dragMomentum
        };
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchManager;
}