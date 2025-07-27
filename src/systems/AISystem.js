class AISystem {
    constructor(scene) {
        this.scene = scene;
        this.lastAIUpdate = 0;
        this.aiUpdateInterval = 2000; // 2 seconds
        console.log('🤖 AISystem initialized');
    }
    
    update(time, delta) {
        if (time - this.lastAIUpdate > this.aiUpdateInterval) {
            this.updateAI();
            this.lastAIUpdate = time;
        }
    }
    
    updateAI() {
        const aiPlayer = this.scene.players.find(p => !p.isHuman);
        if (!aiPlayer) return;
        
        const aiCastles = this.scene.castles.filter(c => c.owner === aiPlayer);
        
        // Simple AI: create armies from castles with enough units
        aiCastles.forEach(castle => {
            if (castle.unitCount > 15) {
                this.createAIArmy(castle);
            }
        });
    }
    
    createAIArmy(castle) {
        // Find empty adjacent position
        const directions = [[0,1], [1,0], [0,-1], [-1,0]];
        
        for (const [dx, dy] of directions) {
            const targetX = castle.gridX + dx;
            const targetY = castle.gridY + dy;
            
            if (targetX >= 0 && targetX < this.scene.mapWidth && 
                targetY >= 0 && targetY < this.scene.mapHeight) {
                
                const occupied = this.scene.castles.find(c => c.gridX === targetX && c.gridY === targetY) ||
                               this.scene.armies.find(a => a.gridX === targetX && a.gridY === targetY);
                
                if (!occupied) {
                    const armySize = Math.floor(castle.unitCount / 2);
                    castle.unitCount -= armySize;
                    castle.updateVisuals();
                    
                    this.scene.createArmy(targetX, targetY, castle.owner, armySize);
                    console.log(`AI created army of ${armySize} units`);
                    return;
                }
            }
        }
    }
}

window.AISystem = AISystem;