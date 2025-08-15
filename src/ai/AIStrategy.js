import { ConfigurationManager } from '../config/ConfigurationManager.js';

const CONFIG = ConfigurationManager.getInstance();

export class AIStrategy {
    constructor(aiController) {
        this.ai = aiController;
        this.enabled = true;
        this.lastEvaluation = 0;
        this.evaluationInterval = CONFIG.get('ai.strategyEvaluationInterval') || 1000; // ms
    }

    evaluate(gameState) {
        // Return array of AIDecision objects
        throw new Error('Strategy must implement evaluate method');
    }

    canExecute(decision, gameState) {
        // Check if decision can be executed
        return true;
    }

    shouldEvaluate(currentTime) {
        return currentTime - this.lastEvaluation >= this.evaluationInterval;
    }

    markEvaluated(currentTime) {
        this.lastEvaluation = currentTime;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    pause() {
        // Override in subclasses if strategy needs specific pause behavior
        this.enabled = false;
    }

    resume() {
        // Override in subclasses if strategy needs specific resume behavior
        this.enabled = true;
    }
}