/**
 * InputHandler manages all user input events for the game
 * Handles mouse, keyboard, and touch events
 */
class InputHandler {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.isEnabled = true;
        
        // Input state tracking
        this.mouseState = {
            x: 0,
            y: 0,
            isDown: false,
            button: null,
            lastClickTime: 0
        };
        
        this.keyState = new Map();
        this.touchState = new Map();
        
        // Event listeners array for cleanup
        this.eventListeners = [];
        
        this.initialize();
    }
    
    /**
     * Initialize all event listeners
     */
    initialize() {
        if (!this.canvas) {
            console.warn('InputHandler: No canvas provided, input events will not work');
            return;
        }
        
        // Mouse events
        this.addEventListeners();
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        console.log('InputHandler initialized successfully');
    }
    
    /**
     * Add all event listeners with proper cleanup tracking
     */
    addEventListeners() {
        // Mouse events
        this.addEventListener(this.canvas, 'mousedown', this.handleMouseDown.bind(this));
        this.addEventListener(this.canvas, 'mouseup', this.handleMouseUp.bind(this));
        this.addEventListener(this.canvas, 'mousemove', this.handleMouseMove.bind(this));
        this.addEventListener(this.canvas, 'click', this.handleClick.bind(this));
        
        // Touch events for mobile compatibility
        this.addEventListener(this.canvas, 'touchstart', this.handleTouchStart.bind(this));
        this.addEventListener(this.canvas, 'touchend', this.handleTouchEnd.bind(this));
        this.addEventListener(this.canvas, 'touchmove', this.handleTouchMove.bind(this));
        
        // Keyboard events
        this.addEventListener(document, 'keydown', this.handleKeyDown.bind(this));
        this.addEventListener(document, 'keyup', this.handleKeyUp.bind(this));
        
        // Window events
        this.addEventListener(window, 'blur', this.handleWindowBlur.bind(this));
    }
    
    /**
     * Add event listener with cleanup tracking
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }
    
    /**
     * Handle mouse down events
     */
    handleMouseDown(event) {
        if (!this.isEnabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseState.x = event.clientX - rect.left;
        this.mouseState.y = event.clientY - rect.top;
        this.mouseState.isDown = true;
        this.mouseState.button = event.button;
        
        // Delegate to game
        if (this.game && this.game.onMouseDown) {
            this.game.onMouseDown(this.mouseState.x, this.mouseState.y, event.button);
        }
    }
    
    /**
     * Handle mouse up events
     */
    handleMouseUp(event) {
        if (!this.isEnabled) return;
        
        this.mouseState.isDown = false;
        this.mouseState.button = null;
        
        // Delegate to game
        if (this.game && this.game.onMouseUp) {
            this.game.onMouseUp(this.mouseState.x, this.mouseState.y, event.button);
        }
    }
    
    /**
     * Handle mouse move events
     */
    handleMouseMove(event) {
        if (!this.isEnabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseState.x = event.clientX - rect.left;
        this.mouseState.y = event.clientY - rect.top;
        
        // Delegate to game
        if (this.game && this.game.onMouseMove) {
            this.game.onMouseMove(this.mouseState.x, this.mouseState.y);
        }
    }
    
    /**
     * Handle click events
     */
    handleClick(event) {
        if (!this.isEnabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const currentTime = Date.now();
        const isDoubleClick = currentTime - this.mouseState.lastClickTime < 300;
        this.mouseState.lastClickTime = currentTime;
        
        // Delegate to game
        if (this.game && this.game.onTileClicked) {
            this.game.onTileClicked(x, y, isDoubleClick);
        } else if (this.game && this.game.onClick) {
            this.game.onClick(x, y, isDoubleClick);
        }
    }
    
    /**
     * Handle touch start events
     */
    handleTouchStart(event) {
        if (!this.isEnabled) return;
        
        event.preventDefault();
        
        for (const touch of event.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.touchState.set(touch.identifier, { x, y, startTime: Date.now() });
            
            // Delegate to game
            if (this.game && this.game.onTouchStart) {
                this.game.onTouchStart(x, y, touch.identifier);
            }
        }
    }
    
    /**
     * Handle touch end events
     */
    handleTouchEnd(event) {
        if (!this.isEnabled) return;
        
        event.preventDefault();
        
        for (const touch of event.changedTouches) {
            const touchData = this.touchState.get(touch.identifier);
            if (!touchData) continue;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const duration = Date.now() - touchData.startTime;
            const isLongPress = duration > 500;
            
            // Delegate to game
            if (this.game && this.game.onTouchEnd) {
                this.game.onTouchEnd(x, y, touch.identifier, isLongPress);
            } else if (this.game && this.game.onTileClicked) {
                // Fallback to click handler
                this.game.onTileClicked(x, y, isLongPress);
            }
            
            this.touchState.delete(touch.identifier);
        }
    }
    
    /**
     * Handle touch move events
     */
    handleTouchMove(event) {
        if (!this.isEnabled) return;
        
        event.preventDefault();
        
        for (const touch of event.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Update touch state
            const touchData = this.touchState.get(touch.identifier);
            if (touchData) {
                touchData.x = x;
                touchData.y = y;
            }
            
            // Delegate to game
            if (this.game && this.game.onTouchMove) {
                this.game.onTouchMove(x, y, touch.identifier);
            }
        }
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(event) {
        if (!this.isEnabled) return;
        
        this.keyState.set(event.code, true);
        
        // Delegate to game
        if (this.game && this.game.onKeyDown) {
            this.game.onKeyDown(event.code, event.key);
        }
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(event) {
        if (!this.isEnabled) return;
        
        this.keyState.set(event.code, false);
        
        // Delegate to game
        if (this.game && this.game.onKeyUp) {
            this.game.onKeyUp(event.code, event.key);
        }
    }
    
    /**
     * Handle window blur (lose focus)
     */
    handleWindowBlur() {
        // Clear all key states when window loses focus
        this.keyState.clear();
        this.mouseState.isDown = false;
        this.touchState.clear();
    }
    
    /**
     * Check if a key is currently pressed
     */
    isKeyPressed(code) {
        return this.keyState.get(code) || false;
    }
    
    /**
     * Get current mouse position
     */
    getMousePosition() {
        return { x: this.mouseState.x, y: this.mouseState.y };
    }
    
    /**
     * Enable/disable input handling
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            // Clear all states when disabled
            this.keyState.clear();
            this.mouseState.isDown = false;
            this.touchState.clear();
        }
    }
    
    /**
     * Get input state for debugging
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            mouseState: { ...this.mouseState },
            activeKeys: Array.from(this.keyState.entries()).filter(([_, pressed]) => pressed),
            activeTouches: this.touchState.size,
            eventListenersCount: this.eventListeners.length
        };
    }
    
    /**
     * Clean up all event listeners
     */
    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        
        this.eventListeners = [];
        this.keyState.clear();
        this.touchState.clear();
        this.mouseState.isDown = false;
        
        console.log('InputHandler destroyed');
    }
}

console.log('🔍 InputHandler class defined, checking availability:', typeof InputHandler, typeof window.InputHandler);
window.InputHandler = InputHandler; // Explicitly ensure it's in global scope

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}