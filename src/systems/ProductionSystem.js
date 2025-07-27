class ProductionSystem {
    constructor(scene) {
        this.scene = scene;
        console.log('🏭 ProductionSystem initialized');
    }
    
    updateProduction() {
        this.scene.castles.forEach(castle => {
            if (castle.canProduceUnit()) {
                castle.produceUnit();
                if (this.scene.gameManager) {
                    this.scene.gameManager.onUnitProduced(castle, 1);
                }
            }
        });
    }
}

window.ProductionSystem = ProductionSystem;