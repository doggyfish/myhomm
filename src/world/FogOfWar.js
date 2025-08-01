export class FogOfWar {
    constructor(mapWidth, mapHeight, playerCount) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.playerCount = playerCount;
        
        // Visibility states: 0 = unexplored, 1 = explored, 2 = visible
        this.visibility = {};
        this.initializeVisibility();
        
        this.currentPlayer = 0;
        this.visionRange = 3; // Default vision range for units/castles
    }

    initializeVisibility() {
        for (let playerId = 0; playerId < this.playerCount; playerId++) {
            this.visibility[playerId] = [];
            for (let y = 0; y < this.mapHeight; y++) {
                this.visibility[playerId][y] = [];
                for (let x = 0; x < this.mapWidth; x++) {
                    this.visibility[playerId][y][x] = 0; // Unexplored
                }
            }
        }
    }

    setCurrentPlayer(playerId) {
        this.currentPlayer = playerId;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }

    getTileVisibility(x, y, playerId = this.currentPlayer) {
        if (!this.isValidPosition(x, y)) return 0;
        return this.visibility[playerId][y][x];
    }

    setTileVisibility(x, y, visibility, playerId = this.currentPlayer) {
        if (!this.isValidPosition(x, y)) return;
        
        // Once explored, visibility can only increase (explored -> visible)
        if (this.visibility[playerId][y][x] < visibility) {
            this.visibility[playerId][y][x] = visibility;
        }
    }

    isExplored(x, y, playerId = this.currentPlayer) {
        return this.getTileVisibility(x, y, playerId) >= 1;
    }

    isVisible(x, y, playerId = this.currentPlayer) {
        return this.getTileVisibility(x, y, playerId) >= 2;
    }

    exploreArea(centerX, centerY, range = this.visionRange, playerId = this.currentPlayer) {
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (this.isValidPosition(x, y)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= range) {
                        this.setTileVisibility(x, y, 1, playerId); // Mark as explored
                    }
                }
            }
        }
    }

    setVisionArea(centerX, centerY, range = this.visionRange, playerId = this.currentPlayer) {
        // First, reset all visible areas to explored for this player
        this.resetVisibleToExplored(playerId);
        
        // Then set the new vision area
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (this.isValidPosition(x, y)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= range) {
                        this.setTileVisibility(x, y, 2, playerId); // Mark as visible
                    }
                }
            }
        }
    }

    resetVisibleToExplored(playerId = this.currentPlayer) {
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.visibility[playerId][y][x] === 2) {
                    this.visibility[playerId][y][x] = 1; // Visible -> Explored
                }
            }
        }
    }

    updateVisionFromUnits(units, playerId = this.currentPlayer) {
        // Reset current vision
        this.resetVisibleToExplored(playerId);
        
        // Add vision from all units
        units.forEach(unit => {
            if (unit.playerId === playerId) {
                const range = unit.visionRange || this.visionRange;
                this.setVisionArea(unit.x, unit.y, range, playerId);
            }
        });
    }

    updateVisionFromCastles(castlePositions, playerId = this.currentPlayer) {
        castlePositions.forEach(castle => {
            if (castle.playerId === playerId) {
                // Castles provide both exploration and vision
                const range = this.visionRange + 2; // Castles see further
                this.exploreArea(castle.x, castle.y, range, playerId);
                this.setVisionArea(castle.x, castle.y, range, playerId);
            }
        });
    }

    getFogAlpha(x, y, playerId = this.currentPlayer) {
        const visibility = this.getTileVisibility(x, y, playerId);
        switch (visibility) {
            case 0: return 1.0;   // Fully fogged (unexplored)
            case 1: return 0.5;   // Partially fogged (explored but not visible)
            case 2: return 0.0;   // No fog (visible)
            default: return 1.0;
        }
    }

    getVisibilityData(playerId = this.currentPlayer) {
        return {
            playerId,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            visibility: this.visibility[playerId]
        };
    }

    serialize() {
        return {
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            playerCount: this.playerCount,
            visibility: this.visibility,
            currentPlayer: this.currentPlayer,
            visionRange: this.visionRange
        };
    }

    static deserialize(data) {
        const fog = new FogOfWar(data.mapWidth, data.mapHeight, data.playerCount);
        fog.visibility = data.visibility;
        fog.currentPlayer = data.currentPlayer;
        fog.visionRange = data.visionRange;
        return fog;
    }
}