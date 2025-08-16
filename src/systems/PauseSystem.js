import { PauseEvents } from '../events/PauseEvents.js';
import { CONFIG } from '../config/ConfigurationManager.js';

/**
 * Comprehensive pause system for coordinating game-wide pause state
 */
export class PauseSystem extends Phaser.Events.EventEmitter {
    constructor(gameState = null) {
        super();
        this.config = CONFIG;
        this.gameState = gameState;
        this.pauseState = this.initializePauseState();
        this.pausableSystems = new Set();
        this.lastPauseToggle = 0;
        this.pauseInputCooldown = this.config.get('pause.inputCooldown') || 100;
    }

    /**
     * Initialize the pause state
     */
    initializePauseState() {
        return {
            isPaused: false,
            pauseStartTime: 0,
            totalPausedTime: 0,
            pauseReason: 'user',
            systemStates: new Map()
        };
    }

    /**
     * Pause the game with specified reason
     */
    pause(reason = 'user') {
        // Check cooldown to prevent rapid toggling
        const currentTime = Date.now();
        if (currentTime - this.lastPauseToggle < this.pauseInputCooldown) {
            return false;
        }

        if (this.pauseState.isPaused) {
            return false; // Already paused
        }

        this.lastPauseToggle = currentTime;
        this.pauseState.isPaused = true;
        this.pauseState.pauseStartTime = currentTime;
        this.pauseState.pauseReason = reason;

        // Preserve states of all registered systems
        this.preserveSystemStates();

        // Pause game state if available
        if (this.gameState && this.gameState.pause) {
            this.gameState.pause(reason);
        }

        // Emit pause activated event
        const eventData = PauseEvents.createPauseActivatedData(reason);
        this.emit(PauseEvents.PAUSE_ACTIVATED, eventData);

        return true;
    }

    /**
     * Unpause the game
     */
    unpause() {
        if (!this.pauseState.isPaused) {
            return false; // Not paused
        }

        const currentTime = Date.now();
        const pauseDuration = currentTime - this.pauseState.pauseStartTime;
        
        this.pauseState.totalPausedTime += pauseDuration;
        this.pauseState.isPaused = false;
        this.lastPauseToggle = currentTime;

        // Restore states of all registered systems
        this.restoreSystemStates();

        // Unpause game state if available
        if (this.gameState && this.gameState.unpause) {
            this.gameState.unpause();
        }

        // Emit pause deactivated event
        const eventData = PauseEvents.createPauseDeactivatedData(this.pauseState.pauseReason, pauseDuration);
        this.emit(PauseEvents.PAUSE_DEACTIVATED, eventData);

        return true;
    }

    /**
     * Toggle pause state
     */
    toggle(reason = 'user') {
        if (this.pauseState.isPaused) {
            this.unpause();
            return false; // Now unpaused
        } else {
            this.pause(reason);
            return true; // Now paused
        }
    }

    /**
     * Check if game is paused
     */
    isPaused() {
        return this.pauseState.isPaused;
    }

    /**
     * Get current pause state
     */
    getState() {
        return { ...this.pauseState };
    }

    /**
     * Set pause state (for restoration)
     */
    setState(state) {
        this.pauseState = { ...state };
    }

    /**
     * Register a pausable system
     */
    registerSystem(system) {
        if (system && typeof system.pause === 'function' && typeof system.unpause === 'function') {
            this.pausableSystems.add(system);
            this.emit(PauseEvents.SYSTEM_REGISTERED, { system });
            return true;
        }
        return false;
    }

    /**
     * Unregister a pausable system
     */
    unregisterSystem(system) {
        return this.pausableSystems.delete(system);
    }

    /**
     * Preserve states of all registered systems
     */
    preserveSystemStates() {
        this.pausableSystems.forEach(system => {
            if (typeof system.getState === 'function') {
                const systemId = system.constructor.name || 'UnknownSystem';
                const state = system.getState();
                this.pauseState.systemStates.set(systemId, state);
                
                const stateData = PauseEvents.createSystemStateData(systemId, state);
                this.emit(PauseEvents.STATE_PRESERVED, stateData);
            }
            
            if (typeof system.pause === 'function') {
                system.pause();
            }
        });
    }

    /**
     * Restore states of all registered systems
     */
    restoreSystemStates() {
        this.pausableSystems.forEach(system => {
            if (typeof system.unpause === 'function') {
                system.unpause();
            }
            
            if (typeof system.setState === 'function') {
                const systemId = system.constructor.name || 'UnknownSystem';
                const state = this.pauseState.systemStates.get(systemId);
                
                if (state) {
                    system.setState(state);
                    
                    const stateData = PauseEvents.createSystemStateData(systemId, state);
                    this.emit(PauseEvents.STATE_RESTORED, stateData);
                }
            }
        });
        
        // Clear preserved states
        this.pauseState.systemStates.clear();
    }

    /**
     * Get total paused time
     */
    getTotalPausedTime() {
        let total = this.pauseState.totalPausedTime;
        
        if (this.pauseState.isPaused) {
            total += Date.now() - this.pauseState.pauseStartTime;
        }
        
        return total;
    }

    /**
     * Clean up the pause system
     */
    cleanup() {
        this.pausableSystems.clear();
        this.pauseState.systemStates.clear();
        this.removeAllListeners();
    }
}