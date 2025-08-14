import { IPauseState, IPausableSystem, PauseEvents, IPauseEventData } from '../events/PauseEvents.js';
import { CONFIG } from '../config/ConfigurationManager.js';
import { GameStateManager } from '../game/GameStateManager.js';

/**
 * Comprehensive pause system for coordinating game-wide pause state
 */
export class PauseSystem extends Phaser.Events.EventEmitter implements IPausableSystem {
    private config: typeof CONFIG;
    private gameState: GameStateManager | null;
    private pauseState: IPauseState;
    private pausableSystems: Set<IPausableSystem>;
    private lastPauseToggle: number;
    private pauseInputCooldown: number;

    constructor(gameState?: GameStateManager) {
        super();
        this.config = CONFIG;
        this.gameState = gameState || null;
        this.pauseState = this.initializePauseState();
        this.pausableSystems = new Set();
        this.lastPauseToggle = 0;
        this.pauseInputCooldown = this.config.get('pause.inputCooldown') || 100;
    }

    /**
     * Initialize the pause state
     */
    private initializePauseState(): IPauseState {
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
     * @param reason Reason for pausing
     * @returns Success status
     */
    public pause(reason: 'user' | 'system' | 'emergency' = 'user'): boolean {
        // Check cooldown to prevent rapid toggling
        const currentTime = Date.now();
        if (currentTime - this.lastPauseToggle < this.pauseInputCooldown) {
            return false;
        }

        if (this.pauseState.isPaused) {
            return false; // Already paused
        }

        try {
            // Start performance timing
            const startTime = performance.now();

            this.pauseState.isPaused = true;
            this.pauseState.pauseStartTime = currentTime;
            this.pauseState.pauseReason = reason;
            this.lastPauseToggle = currentTime;

            // Preserve system states
            this.preserveSystemStates();

            // Pause GameStateManager if available
            if (this.gameState && typeof this.gameState.pause === 'function') {
                this.gameState.pause();
            }

            // Pause all registered systems
            this.pausableSystems.forEach(system => {
                try {
                    system.pause();
                } catch (error) {
                    console.error('Error pausing system:', error);
                }
            });

            // Emit pause activated event
            const eventData = PauseEvents.createPauseActivatedData(reason);
            this.emit(PauseEvents.PAUSE_ACTIVATED, eventData);

            // Check performance requirement (200ms max)
            const elapsedTime = performance.now() - startTime;
            if (elapsedTime > this.config.get('pause.maxResponseTime') || 200) {
                console.warn(`Pause operation took ${elapsedTime}ms, exceeding 200ms requirement`);
            }

            return true;

        } catch (error) {
            console.error('Error during pause operation:', error);
            this.emit(PauseEvents.PAUSE_ERROR, { error, operation: 'pause' });
            return false;
        }
    }

    /**
     * Unpause the game
     * @returns Success status
     */
    public unpause(): boolean {
        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastPauseToggle < this.pauseInputCooldown) {
            return false;
        }

        if (!this.pauseState.isPaused) {
            return false; // Not paused
        }

        try {
            // Start performance timing
            const startTime = performance.now();

            // Calculate pause duration
            const pauseDuration = currentTime - this.pauseState.pauseStartTime;
            this.pauseState.totalPausedTime += pauseDuration;

            const reason = this.pauseState.pauseReason;
            this.pauseState.isPaused = false;
            this.pauseState.pauseStartTime = 0;
            this.lastPauseToggle = currentTime;

            // Restore system states
            this.restoreSystemStates();

            // Unpause GameStateManager if available
            if (this.gameState && typeof this.gameState.unpause === 'function') {
                this.gameState.unpause();
            }

            // Unpause all registered systems
            this.pausableSystems.forEach(system => {
                try {
                    system.unpause();
                } catch (error) {
                    console.error('Error unpausing system:', error);
                }
            });

            // Emit pause deactivated event
            const eventData = PauseEvents.createPauseDeactivatedData(reason, pauseDuration);
            this.emit(PauseEvents.PAUSE_DEACTIVATED, eventData);

            // Check performance requirement
            const elapsedTime = performance.now() - startTime;
            if (elapsedTime > this.config.get('pause.maxResponseTime') || 200) {
                console.warn(`Unpause operation took ${elapsedTime}ms, exceeding 200ms requirement`);
            }

            return true;

        } catch (error) {
            console.error('Error during unpause operation:', error);
            this.emit(PauseEvents.PAUSE_ERROR, { error, operation: 'unpause' });
            return false;
        }
    }

    /**
     * Toggle pause state
     * @param reason Reason for the pause toggle
     * @returns New pause state
     */
    public toggle(reason: 'user' | 'system' | 'emergency' = 'user'): boolean {
        if (this.pauseState.isPaused) {
            this.unpause();
            return false;
        } else {
            this.pause(reason);
            return true;
        }
    }

    /**
     * Check if the system is paused
     */
    public isPaused(): boolean {
        return this.pauseState.isPaused;
    }

    /**
     * Register a system for pause coordination
     * @param system System to register
     * @param systemId Optional ID for the system
     */
    public registerPausableSystem(system: IPausableSystem, systemId?: string): void {
        this.pausableSystems.add(system);
        
        // Emit system registered event
        this.emit(PauseEvents.SYSTEM_REGISTERED, {
            systemId: systemId || system.constructor.name,
            systemCount: this.pausableSystems.size
        });

        // If already paused, immediately pause the new system
        if (this.pauseState.isPaused) {
            try {
                system.pause();
            } catch (error) {
                console.error('Error pausing newly registered system:', error);
            }
        }
    }

    /**
     * Unregister a system from pause coordination
     * @param system System to unregister
     */
    public unregisterPausableSystem(system: IPausableSystem): void {
        this.pausableSystems.delete(system);
    }

    /**
     * Get current pause state
     */
    public getState(): IPauseState {
        return {
            ...this.pauseState,
            systemStates: new Map(this.pauseState.systemStates)
        };
    }

    /**
     * Set pause state (for loading/restoring)
     * @param state State to set
     */
    public setState(state: any): void {
        if (state && typeof state === 'object') {
            this.pauseState = {
                ...this.pauseState,
                ...state,
                systemStates: state.systemStates || new Map()
            };
        }
    }

    /**
     * Get pause statistics
     */
    public getStats(): {
        isPaused: boolean;
        totalPausedTime: number;
        currentPauseDuration: number;
        systemCount: number;
        pauseReason: string;
    } {
        const currentTime = Date.now();
        const currentPauseDuration = this.pauseState.isPaused ? 
            currentTime - this.pauseState.pauseStartTime : 0;

        return {
            isPaused: this.pauseState.isPaused,
            totalPausedTime: this.pauseState.totalPausedTime + currentPauseDuration,
            currentPauseDuration,
            systemCount: this.pausableSystems.size,
            pauseReason: this.pauseState.pauseReason
        };
    }

    /**
     * Set the game state manager
     * @param gameState Game state manager instance
     */
    public setGameStateManager(gameState: GameStateManager): void {
        this.gameState = gameState;
    }

    /**
     * Emergency pause for critical situations
     */
    public emergencyPause(): boolean {
        return this.pause('emergency');
    }

    /**
     * Preserve system states before pausing
     */
    private preserveSystemStates(): void {
        this.pauseState.systemStates.clear();

        // Store GameStateManager state
        if (this.gameState) {
            this.pauseState.systemStates.set('GameStateManager', {
                currentTick: this.gameState.currentTick,
                gameSpeed: this.gameState.gameSpeed,
                pausedSystems: this.gameState.pausedSystems
            });
        }

        // Store registered system states
        this.pausableSystems.forEach((system, index) => {
            try {
                const systemState = system.getState();
                if (systemState !== undefined) {
                    this.pauseState.systemStates.set(`System_${index}`, systemState);
                }
            } catch (error) {
                console.error('Error preserving system state:', error);
            }
        });

        // Emit state preserved event
        this.emit(PauseEvents.STATE_PRESERVED, {
            stateCount: this.pauseState.systemStates.size,
            timestamp: Date.now()
        });
    }

    /**
     * Restore system states after unpausing
     */
    private restoreSystemStates(): void {
        // Restore GameStateManager state
        const gameStateData = this.pauseState.systemStates.get('GameStateManager');
        if (gameStateData && this.gameState) {
            // Note: GameStateManager already handles its own state restoration
            // This is just for additional validation or future enhancements
        }

        // Restore registered system states
        let systemIndex = 0;
        this.pausableSystems.forEach(system => {
            try {
                const systemState = this.pauseState.systemStates.get(`System_${systemIndex}`);
                if (systemState !== undefined) {
                    system.setState(systemState);
                }
            } catch (error) {
                console.error('Error restoring system state:', error);
            }
            systemIndex++;
        });

        // Emit state restored event
        this.emit(PauseEvents.STATE_RESTORED, {
            stateCount: this.pauseState.systemStates.size,
            timestamp: Date.now()
        });

        // Clear preserved states
        this.pauseState.systemStates.clear();
    }

    /**
     * Handle scene transition during pause
     * @param newScene Scene being transitioned to
     */
    public handleSceneTransition(newScene: string): void {
        // Pause state should persist across scene transitions
        // This method ensures continuity
        if (this.pauseState.isPaused) {
            // Re-emit pause state to new scene
            const eventData = PauseEvents.createPauseActivatedData(this.pauseState.pauseReason);
            // Delay emission to ensure new scene is ready
            setTimeout(() => {
                this.emit(PauseEvents.PAUSE_ACTIVATED, eventData);
            }, 50);
        }
    }

    /**
     * Clean up and destroy the pause system
     */
    public destroy(): void {
        // Unpause if currently paused
        if (this.pauseState.isPaused) {
            this.unpause();
        }

        // Clear all registered systems
        this.pausableSystems.clear();

        // Clear system states
        this.pauseState.systemStates.clear();

        // Remove all event listeners
        this.removeAllListeners();

        // Reset references
        this.gameState = null;
    }
}