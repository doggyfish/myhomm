import { Component } from './Component.js';

export class AIComponent extends Component {
    constructor() {
        super();
        this.isAIControlled = true;
        this.aiController = null;
        this.lastDecisionTime = 0;
        this.decisionHistory = [];
        this.maxHistorySize = 10;
    }

    setAIController(aiController) {
        this.aiController = aiController;
    }

    getAIController() {
        return this.aiController;
    }

    recordDecision(decision) {
        this.decisionHistory.push({
            decision: decision,
            timestamp: Date.now()
        });

        // Keep history size manageable
        if (this.decisionHistory.length > this.maxHistorySize) {
            this.decisionHistory.shift();
        }
    }

    getDecisionHistory() {
        return [...this.decisionHistory];
    }

    clearDecisionHistory() {
        this.decisionHistory = [];
    }

    getLastDecision() {
        return this.decisionHistory.length > 0 ? 
            this.decisionHistory[this.decisionHistory.length - 1] : null;
    }

    pause() {
        if (this.aiController) {
            this.aiController.pause();
        }
    }

    resume() {
        if (this.aiController) {
            this.aiController.resume();
        }
    }

    update(deltaTime) {
        if (this.aiController) {
            this.aiController.update(null, deltaTime);
        }
    }

    destroy() {
        if (this.aiController) {
            this.aiController.destroy();
        }
        this.aiController = null;
        this.decisionHistory = [];
    }

    toJSON() {
        return {
            type: 'AIComponent',
            isAIControlled: this.isAIControlled,
            lastDecisionTime: this.lastDecisionTime,
            decisionHistoryCount: this.decisionHistory.length
        };
    }
}