import { ConfigurationManager } from '../config/ConfigurationManager.js';
import { EconomicStrategy } from './strategies/EconomicStrategy.js';
import { MilitaryStrategy } from './strategies/MilitaryStrategy.js';
import { MovementStrategy } from './strategies/MovementStrategy.js';

const CONFIG = ConfigurationManager.getInstance();

export class AIController {
    constructor(player, difficulty = 'medium') {
        this.player = player;
        this.difficulty = difficulty;
        this.strategies = new Map();
        this.decisionQueue = [];
        this.lastDecisionTime = 0;
        this.decisionInterval = CONFIG.get('ai.decisionInterval') || 2000;
        this.maxDecisionTime = CONFIG.get('ai.maxDecisionTime') || 500;
        this.isActive = true;
        this.debugMode = CONFIG.get('ai.debugMode') || false;

        this.initializeStrategies();
        this.setupEventListeners();
    }

    initializeStrategies() {
        this.addStrategy('economic', new EconomicStrategy(this));
        this.addStrategy('military', new MilitaryStrategy(this));
        this.addStrategy('movement', new MovementStrategy(this));
    }

    setupEventListeners() {
        // Listen for pause events - will be connected by game system
        // Using a more robust event system integration
        this.pauseEventHandler = () => this.pause();
        this.resumeEventHandler = () => this.resume();
        
        // Store handlers for cleanup
        this.eventHandlers = {
            pause: this.pauseEventHandler,
            resume: this.resumeEventHandler
        };
    }

    update(gameState, deltaTime) {
        if (!this.isActive || !gameState || gameState.isPaused) {
            return;
        }

        if (this.shouldMakeDecision(deltaTime)) {
            this.makeDecisions(gameState);
        }
    }

    shouldMakeDecision(deltaTime) {
        const currentTime = Date.now();
        return currentTime - this.lastDecisionTime >= this.decisionInterval;
    }

    makeDecisions(gameState) {
        const startTime = performance.now();
        
        try {
            // Gather decisions from all strategies
            const allDecisions = this.gatherDecisions(gameState);
            
            // Prioritize and execute decisions
            const prioritizedDecisions = this.prioritizeDecisions(allDecisions);
            this.executeDecisions(prioritizedDecisions, gameState);
            
            this.lastDecisionTime = Date.now();
            
            // Emit decision event
            this.emitEvent('ai:decision-made', {
                playerId: this.player.id,
                decisionsCount: prioritizedDecisions.length,
                decisionTime: performance.now() - startTime
            });
            
        } catch (error) {
            console.error(`AI decision error for player ${this.player.id}:`, error);
            try {
                this.emitEvent('ai:decision-error', {
                    playerId: this.player.id,
                    error: error.message
                });
            } catch (eventError) {
                console.error('Failed to emit AI error event:', eventError);
            }
        }

        const decisionTime = performance.now() - startTime;
        if (decisionTime > this.maxDecisionTime) {
            console.warn(`AI decision cycle took ${decisionTime}ms, exceeding ${this.maxDecisionTime}ms limit`);
        }
    }

    gatherDecisions(gameState) {
        const allDecisions = [];
        const currentTime = Date.now();

        this.strategies.forEach((strategy, name) => {
            if (strategy.enabled && strategy.shouldEvaluate(currentTime)) {
                try {
                    const decisions = strategy.evaluate(gameState);
                    if (Array.isArray(decisions)) {
                        allDecisions.push(...decisions);
                    }
                    strategy.markEvaluated(currentTime);
                    
                    if (this.debugMode) {
                        console.log(`AI ${this.player.id} ${name} strategy generated ${decisions.length} decisions`);
                    }
                } catch (error) {
                    console.error(`Strategy ${name} evaluation error:`, error);
                }
            }
        });

        this.emitEvent('ai:strategy-evaluation', {
            playerId: this.player.id,
            strategiesEvaluated: this.strategies.size,
            decisionsGenerated: allDecisions.length
        });

        return allDecisions;
    }

    addStrategy(name, strategy) {
        this.strategies.set(name, strategy);
    }

    removeStrategy(name) {
        return this.strategies.delete(name);
    }

    getStrategy(name) {
        return this.strategies.get(name);
    }

    prioritizeDecisions(decisions) {
        // Sort by priority (highest first), then by expected benefit
        return decisions
            .filter(decision => decision.isValid())
            .sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return b.expectedBenefit - a.expectedBenefit;
            });
    }

    executeDecisions(decisions, gameState) {
        const executionStartTime = performance.now();
        let executedCount = 0;
        let failedCount = 0;

        for (const decision of decisions) {
            // Check time budget
            const currentExecutionTime = performance.now() - executionStartTime;
            if (currentExecutionTime > this.maxDecisionTime * 0.8) {
                if (this.debugMode) {
                    console.log(`AI ${this.player.id} stopping execution due to time budget`);
                }
                break;
            }

            try {
                const success = this.executeDecision(decision, gameState);
                if (success) {
                    executedCount++;
                    this.emitEvent('ai:action-executed', {
                        playerId: this.player.id,
                        decision: decision.toString()
                    });
                } else {
                    failedCount++;
                    this.emitEvent('ai:action-failed', {
                        playerId: this.player.id,
                        decision: decision.toString(),
                        reason: 'Execution failed'
                    });
                }
            } catch (error) {
                failedCount++;
                console.error(`AI decision execution error:`, error);
                this.emitEvent('ai:action-failed', {
                    playerId: this.player.id,
                    decision: decision.toString(),
                    reason: error.message
                });
            }
        }

        if (this.debugMode) {
            console.log(`AI ${this.player.id} executed ${executedCount} decisions, ${failedCount} failed`);
        }
    }

    executeDecision(decision, gameState) {
        switch (decision.type) {
            case 'build':
                return this.executeBuildDecision(decision, gameState);
            case 'produce':
                return this.executeProduceDecision(decision, gameState);
            case 'move':
                return this.executeMoveDecision(decision, gameState);
            case 'attack':
                return this.executeAttackDecision(decision, gameState);
            default:
                console.warn(`Unknown decision type: ${decision.type}`);
                return false;
        }
    }

    executeBuildDecision(decision, gameState) {
        // Implementation will depend on building system
        // For now, return false to indicate not implemented
        return false;
    }

    executeProduceDecision(decision, gameState) {
        // Implementation will depend on unit production system
        return false;
    }

    executeMoveDecision(decision, gameState) {
        // Implementation will depend on movement system
        return false;
    }

    executeAttackDecision(decision, gameState) {
        // Implementation will depend on combat system
        return false;
    }

    pause() {
        const wasActive = this.isActive;
        this.isActive = false;
        
        if (this.debugMode && wasActive) {
            console.log(`AI ${this.player.id} paused`);
        }
        
        // Pause all strategies
        this.strategies.forEach(strategy => {
            if (strategy.pause && typeof strategy.pause === 'function') {
                strategy.pause();
            }
        });
        
        this.emitEvent('ai:paused', {
            playerId: this.player.id,
            timestamp: Date.now()
        });
    }

    resume() {
        const wasInactive = !this.isActive;
        this.isActive = true;
        
        if (this.debugMode && wasInactive) {
            console.log(`AI ${this.player.id} resumed`);
        }
        
        // Resume all strategies
        this.strategies.forEach(strategy => {
            if (strategy.resume && typeof strategy.resume === 'function') {
                strategy.resume();
            }
        });
        
        this.emitEvent('ai:resumed', {
            playerId: this.player.id,
            timestamp: Date.now()
        });
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Update decision interval based on difficulty
        const difficultyConfig = CONFIG.get(`ai.difficulty.${difficulty}`) || {};
        this.decisionInterval = difficultyConfig.decisionInterval || this.decisionInterval;
        
        // Update strategies based on difficulty
        this.strategies.forEach(strategy => {
            if (strategy.setDifficulty) {
                strategy.setDifficulty(difficulty);
            }
        });
    }

    emitEvent(eventName, data) {
        if (typeof window !== 'undefined' && window.game && window.game.events) {
            window.game.events.emit(eventName, data);
        }
    }

    getStatus() {
        return {
            playerId: this.player.id,
            isActive: this.isActive,
            difficulty: this.difficulty,
            strategiesCount: this.strategies.size,
            lastDecisionTime: this.lastDecisionTime,
            decisionInterval: this.decisionInterval
        };
    }

    destroy() {
        this.isActive = false;
        this.strategies.clear();
        this.decisionQueue = [];
    }
}