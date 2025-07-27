class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }
    
    create() {
        console.log('🎯 HUD Scene created');
    }
}

window.HUDScene = HUDScene;