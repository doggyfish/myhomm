import { CONFIG } from '../../config/ConfigurationManager.js';

export class PositionComponent {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.updateTilePosition();
    }
    
    updateTilePosition() {
        const tileSize = CONFIG.get('map.tileSize');
        this.tileX = Math.floor(this.x / tileSize);
        this.tileY = Math.floor(this.y / tileSize);
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateTilePosition();
    }
    
    setTilePosition(tileX, tileY) {
        const tileSize = CONFIG.get('map.tileSize');
        this.tileX = tileX;
        this.tileY = tileY;
        this.x = tileX * tileSize;
        this.y = tileY * tileSize;
    }
    
    distanceTo(otherPosition) {
        const dx = this.x - otherPosition.x;
        const dy = this.y - otherPosition.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    tileDistanceTo(otherPosition) {
        const dx = this.tileX - otherPosition.tileX;
        const dy = this.tileY - otherPosition.tileY;
        return Math.abs(dx) + Math.abs(dy); // Manhattan distance
    }
}