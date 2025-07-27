/**
 * GameManager for MyHoMM Phaser 3 Version
 * Central controller managing game state and coordination between systems
 */

class GameManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = 'running';
        this.gameStartTime = Date.now();
        
        console.log('🎮 GameManager initialized');
    }
    
    update(time, delta) {
        if (this.gameState !== 'running') return;
    }
    
    onUnitProduced(castle, unitCount) {
        console.log(`Unit produced at castle (${castle.gridX}, ${castle.gridY})`);
    }
    
    onBattleResolved(attacker, defender, result) {
        console.log(`Battle resolved: ${attacker.type} vs ${defender.type}`);
    }
    
    onCastleCaptured(castle, oldOwner, newOwner) {
        console.log(`Castle captured: ${oldOwner.name} → ${newOwner.name}`);
    }
    
    onArmyMoved(army, targetGridX, targetGridY) {
        console.log(`Army moved to (${targetGridX}, ${targetGridY})`);
    }
}

window.GameManager = GameManager;