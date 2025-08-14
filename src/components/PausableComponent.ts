import { Component } from './Component.js';
import { CONFIG } from '../config/ConfigurationManager.js';

/**
 * Component for entities that respond to pause state
 */
export class PausableComponent extends Component {
    public isPaused: boolean;
    public pausedState: any;
    public lastUpdateTime: number;
    public pauseStartTime: number;
    public totalPausedTime: number;
    public pauseHistory: Array<{ startTime: number; endTime?: number; duration?: number }>;

    constructor() {
        super();
        this.isPaused = false;
        this.pausedState = null;
        this.lastUpdateTime = 0;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.pauseHistory = [];
    }

    /**
     * Pause the component and preserve current state
     * @param currentTime Current timestamp
     * @param preserveState Optional state data to preserve
     */
    public pause(currentTime: number, preserveState?: any): void {
        if (this.isPaused) {
            return; // Already paused
        }

        this.isPaused = true;
        this.pauseStartTime = currentTime;
        this.lastUpdateTime = currentTime;
        
        // Preserve state if provided
        if (preserveState !== undefined) {
            this.pausedState = this.deepClone(preserveState);
        }

        // Add to pause history
        this.pauseHistory.push({
            startTime: currentTime
        });
    }

    /**
     * Unpause the component and restore timing
     * @param currentTime Current timestamp
     * @returns Restored state data if any
     */
    public unpause(currentTime: number): any {
        if (!this.isPaused) {
            return null; // Not paused
        }

        // Calculate pause duration
        const pauseDuration = currentTime - this.pauseStartTime;
        this.totalPausedTime += pauseDuration;

        // Update pause history
        const lastPause = this.pauseHistory[this.pauseHistory.length - 1];
        if (lastPause && !lastPause.endTime) {
            lastPause.endTime = currentTime;
            lastPause.duration = pauseDuration;
        }

        this.isPaused = false;
        this.pauseStartTime = 0;

        // Return preserved state and clear it
        const restoredState = this.pausedState;
        this.pausedState = null;

        return restoredState;
    }

    /**
     * Get adjusted time accounting for pause duration
     * @param currentTime Current timestamp
     * @returns Adjusted time with pause duration subtracted
     */
    public getAdjustedTime(currentTime: number): number {
        let adjustedTime = currentTime - this.totalPausedTime;
        
        // If currently paused, subtract current pause duration
        if (this.isPaused) {
            const currentPauseDuration = currentTime - this.pauseStartTime;
            adjustedTime -= currentPauseDuration;
        }

        return adjustedTime;
    }

    /**
     * Get total time spent paused
     * @param currentTime Current timestamp for calculating ongoing pause
     * @returns Total pause duration in milliseconds
     */
    public getTotalPausedTime(currentTime: number): number {
        let total = this.totalPausedTime;
        
        // Add current pause duration if paused
        if (this.isPaused) {
            total += currentTime - this.pauseStartTime;
        }

        return total;
    }

    /**
     * Check if the component should process updates
     * @returns True if updates should be processed (not paused)
     */
    public shouldUpdate(): boolean {
        return !this.isPaused;
    }

    /**
     * Get pause statistics
     * @param currentTime Current timestamp
     * @returns Pause statistics object
     */
    public getPauseStats(currentTime: number): {
        isPaused: boolean;
        totalPausedTime: number;
        pauseCount: number;
        currentPauseDuration: number;
        lastPauseStartTime: number;
    } {
        return {
            isPaused: this.isPaused,
            totalPausedTime: this.getTotalPausedTime(currentTime),
            pauseCount: this.pauseHistory.length,
            currentPauseDuration: this.isPaused ? currentTime - this.pauseStartTime : 0,
            lastPauseStartTime: this.pauseStartTime
        };
    }

    /**
     * Reset pause state and history
     */
    public reset(): void {
        this.isPaused = false;
        this.pausedState = null;
        this.lastUpdateTime = 0;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.pauseHistory = [];
    }

    /**
     * Deep clone an object to prevent reference issues
     */
    private deepClone(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (typeof obj === 'object') {
            const cloned: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }

        return obj;
    }
}