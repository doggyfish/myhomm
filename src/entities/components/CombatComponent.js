export class CombatComponent {
    constructor(power, isRanged = false) {
        this.basePower = power;
        this.power = power;
        this.isRanged = isRanged;
        this.bonuses = [];
    }
    
    addBonus(bonus) {
        this.bonuses.push(bonus);
        this.recalculatePower();
    }
    
    removeBonus(bonusId) {
        this.bonuses = this.bonuses.filter(bonus => bonus.id !== bonusId);
        this.recalculatePower();
    }
    
    recalculatePower() {
        let totalPower = this.basePower;
        
        for (const bonus of this.bonuses) {
            if (bonus.type === 'additive') {
                totalPower += bonus.value;
            } else if (bonus.type === 'multiplicative') {
                totalPower *= bonus.value;
            }
        }
        
        this.power = Math.max(0, totalPower);
    }
    
    getEffectivePower(terrainModifier = 1.0) {
        return this.power * terrainModifier;
    }
    
    clearBonuses() {
        this.bonuses = [];
        this.recalculatePower();
    }
}