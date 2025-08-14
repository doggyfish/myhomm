/**
 * Pause system event definitions and interfaces
 */

export interface IPauseState {
    isPaused: boolean;
    pauseStartTime: number;
    totalPausedTime: number;
    pauseReason: 'user' | 'system' | 'emergency';
    systemStates: Map<string, any>;
}

export interface IPausableSystem {
    pause(): void;
    unpause(): void;
    isPaused(): boolean;
    getState(): any;
    setState(state: any): void;
}

export interface IPauseEventData {
    reason: 'user' | 'system' | 'emergency';
    timestamp: number;
    pauseDuration?: number;
}

export interface ISystemStateData {
    systemId: string;
    state: any;
    timestamp: number;
}

export class PauseEvents {
    // Event names
    static readonly PAUSE_ACTIVATED = 'pause:activated';
    static readonly PAUSE_DEACTIVATED = 'pause:deactivated';
    static readonly SYSTEM_REGISTERED = 'pause:system-registered';
    static readonly STATE_PRESERVED = 'pause:state-preserved';
    static readonly STATE_RESTORED = 'pause:state-restored';
    static readonly PAUSE_REQUESTED = 'input:pause-requested';
    static readonly SCENE_TRANSITION_STARTING = 'scene:transition-starting';
    static readonly PAUSE_ERROR = 'pause:error';

    /**
     * Create pause activated event data
     */
    static createPauseActivatedData(reason: 'user' | 'system' | 'emergency'): IPauseEventData {
        return {
            reason,
            timestamp: Date.now()
        };
    }

    /**
     * Create pause deactivated event data
     */
    static createPauseDeactivatedData(reason: 'user' | 'system' | 'emergency', pauseDuration: number): IPauseEventData {
        return {
            reason,
            timestamp: Date.now(),
            pauseDuration
        };
    }

    /**
     * Create system state data
     */
    static createSystemStateData(systemId: string, state: any): ISystemStateData {
        return {
            systemId,
            state,
            timestamp: Date.now()
        };
    }
}