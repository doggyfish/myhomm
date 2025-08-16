/**
 * Pause system event definitions and interfaces
 */

export class PauseEvents {
    // Event names
    static PAUSE_ACTIVATED = 'pause:activated';
    static PAUSE_DEACTIVATED = 'pause:deactivated';
    static SYSTEM_REGISTERED = 'pause:system-registered';
    static STATE_PRESERVED = 'pause:state-preserved';
    static STATE_RESTORED = 'pause:state-restored';
    static PAUSE_REQUESTED = 'input:pause-requested';
    static SCENE_TRANSITION_STARTING = 'scene:transition-starting';
    static PAUSE_ERROR = 'pause:error';

    /**
     * Create pause activated event data
     */
    static createPauseActivatedData(reason) {
        return {
            reason,
            timestamp: Date.now()
        };
    }

    /**
     * Create pause deactivated event data
     */
    static createPauseDeactivatedData(reason, pauseDuration) {
        return {
            reason,
            timestamp: Date.now(),
            pauseDuration
        };
    }

    /**
     * Create system state data
     */
    static createSystemStateData(systemId, state) {
        return {
            systemId,
            state,
            timestamp: Date.now()
        };
    }
}