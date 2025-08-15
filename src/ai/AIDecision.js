export class AIDecision {
    constructor(type, priority, action, target, cost = 0, expectedBenefit = 0) {
        this.type = type; // 'build', 'produce', 'move', 'attack'
        this.priority = priority; // 0-100
        this.action = action; // specific action to take
        this.target = target; // target entity or position
        this.cost = cost; // resource cost
        this.expectedBenefit = expectedBenefit; // estimated benefit
        this.timestamp = Date.now();
    }

    isValid() {
        return this.type && this.priority >= 0 && this.action;
    }

    toString() {
        return `AIDecision(${this.type}: ${this.action}, priority: ${this.priority})`;
    }
}