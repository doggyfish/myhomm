/**
 * CombatSystem for MyHoMM Phaser 3 Version
 */

class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        console.log('⚔️ CombatSystem initialized');
    }
    
    handleCombatResult(attacker, defender, result) {
        console.log('Combat result handled:', result);
        
        if (this.scene.gameManager) {
            this.scene.gameManager.onBattleResolved(attacker, defender, result);
        }
    }
}

window.CombatSystem = CombatSystem;