import { CONFIG } from '../../config/ConfigurationManager.js';

export class MovementComponent {
    constructor(speed) {
        this.baseSpeed = speed;
        this.currentSpeed = speed;
        this.path = [];
        this.isMoving = false;
        this.movementProgress = 0;
        this.targetTile = null;
    }
    
    calculateEffectiveSpeed(terrainConfig) {
        const modifier = terrainConfig?.movementModifier || 1.0;
        const effectiveSpeed = this.baseSpeed * modifier;
        
        const minSpeed = CONFIG.get('movement.minEffectiveSpeed');
        const maxSpeed = CONFIG.get('movement.maxEffectiveSpeed');
        
        return Math.max(minSpeed, Math.min(maxSpeed, effectiveSpeed));
    }
    
    calculateTimePerTile(terrainConfig) {
        const baseTimePerTile = CONFIG.get('movement.baseTimePerTile');
        const effectiveSpeed = this.calculateEffectiveSpeed(terrainConfig);
        
        return baseTimePerTile / effectiveSpeed;
    }
    
    startMovement(path) {
        if (path && path.length > 0) {
            this.path = [...path];
            this.isMoving = true;
            this.movementProgress = 0;
            this.targetTile = this.path[0];
        }
    }
    
    stopMovement() {
        this.isMoving = false;
        this.path = [];
        this.movementProgress = 0;
        this.targetTile = null;
    }
    
    updateMovement(delta, currentTerrain) {
        if (!this.isMoving || this.path.length === 0) {
            return false;
        }
        
        const timePerTile = this.calculateTimePerTile(currentTerrain);
        const progressThisFrame = delta / timePerTile;
        this.movementProgress += progressThisFrame;
        
        // Check if reached next tile
        if (this.movementProgress >= 1.0) {
            this.movementProgress = 0;
            this.path.shift(); // Remove completed tile
            
            if (this.path.length === 0) {
                this.stopMovement();
                return true; // Movement completed
            } else {
                this.targetTile = this.path[0];
            }
        }
        
        return false; // Movement in progress
    }
    
    getInterpolatedPosition(startPos, targetPos) {
        if (!this.isMoving || !targetPos) {
            return { x: startPos.x, y: startPos.y };
        }
        
        const progress = Math.min(1.0, this.movementProgress);
        const x = startPos.x + (targetPos.x - startPos.x) * progress;
        const y = startPos.y + (targetPos.y - startPos.y) * progress;
        
        return { x, y };
    }
}