import { FogOfWar } from './FogOfWar.js';

describe('FogOfWar', () => {
    let fog;
    
    beforeEach(() => {
        fog = new FogOfWar(10, 10, 2);
    });
    
    describe('constructor', () => {
        test('should create fog with correct dimensions', () => {
            expect(fog.mapWidth).toBe(10);
            expect(fog.mapHeight).toBe(10);
            expect(fog.playerCount).toBe(2);
            expect(fog.currentPlayer).toBe(0);
            expect(fog.visionRange).toBe(3);
        });
        
        test('should initialize all tiles as unexplored', () => {
            for (let playerId = 0; playerId < 2; playerId++) {
                for (let y = 0; y < 10; y++) {
                    for (let x = 0; x < 10; x++) {
                        expect(fog.getTileVisibility(x, y, playerId)).toBe(0);
                    }
                }
            }
        });
    });
    
    describe('player management', () => {
        test('should set and get current player', () => {
            fog.setCurrentPlayer(1);
            expect(fog.getCurrentPlayer()).toBe(1);
        });
        
        test('should use current player by default', () => {
            fog.setCurrentPlayer(1);
            fog.setTileVisibility(5, 5, 2);
            expect(fog.getTileVisibility(5, 5)).toBe(2);
            expect(fog.getTileVisibility(5, 5, 0)).toBe(0);
        });
    });
    
    describe('position validation', () => {
        test('should validate positions correctly', () => {
            expect(fog.isValidPosition(0, 0)).toBe(true);
            expect(fog.isValidPosition(9, 9)).toBe(true);
            expect(fog.isValidPosition(-1, 0)).toBe(false);
            expect(fog.isValidPosition(0, -1)).toBe(false);
            expect(fog.isValidPosition(10, 0)).toBe(false);
            expect(fog.isValidPosition(0, 10)).toBe(false);
        });
        
        test('should return 0 visibility for invalid positions', () => {
            expect(fog.getTileVisibility(-1, -1)).toBe(0);
            expect(fog.getTileVisibility(10, 10)).toBe(0);
        });
    });
    
    describe('visibility states', () => {
        test('should set tile visibility correctly', () => {
            fog.setTileVisibility(5, 5, 1);
            expect(fog.getTileVisibility(5, 5)).toBe(1);
            
            fog.setTileVisibility(5, 5, 2);
            expect(fog.getTileVisibility(5, 5)).toBe(2);
        });
        
        test('should not allow visibility to decrease', () => {
            fog.setTileVisibility(5, 5, 2); // Visible
            fog.setTileVisibility(5, 5, 1); // Try to set to explored
            expect(fog.getTileVisibility(5, 5)).toBe(2); // Should remain visible
        });
        
        test('should check explored status correctly', () => {
            expect(fog.isExplored(5, 5)).toBe(false);
            
            fog.setTileVisibility(5, 5, 1);
            expect(fog.isExplored(5, 5)).toBe(true);
            
            fog.setTileVisibility(5, 5, 2);
            expect(fog.isExplored(5, 5)).toBe(true);
        });
        
        test('should check visible status correctly', () => {
            expect(fog.isVisible(5, 5)).toBe(false);
            
            fog.setTileVisibility(5, 5, 1);
            expect(fog.isVisible(5, 5)).toBe(false);
            
            fog.setTileVisibility(5, 5, 2);
            expect(fog.isVisible(5, 5)).toBe(true);
        });
    });
    
    describe('area exploration', () => {
        test('should explore area around position', () => {
            fog.exploreArea(5, 5, 2);
            
            // Check center is explored
            expect(fog.isExplored(5, 5)).toBe(true);
            
            // Check adjacent tiles are explored
            expect(fog.isExplored(4, 5)).toBe(true);
            expect(fog.isExplored(6, 5)).toBe(true);
            expect(fog.isExplored(5, 4)).toBe(true);
            expect(fog.isExplored(5, 6)).toBe(true);
            
            // Check diagonal tiles within range are explored
            expect(fog.isExplored(4, 4)).toBe(true);
            expect(fog.isExplored(6, 6)).toBe(true);
            
            // Check tiles outside range are not explored
            expect(fog.isExplored(2, 5)).toBe(false);
            expect(fog.isExplored(8, 5)).toBe(false);
        });
        
        test('should respect map boundaries when exploring', () => {
            fog.exploreArea(0, 0, 3);
            
            // Should not crash and should explore valid tiles
            expect(fog.isExplored(0, 0)).toBe(true);
            expect(fog.isExplored(1, 1)).toBe(true);
            expect(fog.isExplored(2, 2)).toBe(true);
        });
    });
    
    describe('vision area management', () => {
        test('should set vision area', () => {
            fog.setVisionArea(5, 5, 2);
            
            // Check center is visible
            expect(fog.isVisible(5, 5)).toBe(true);
            
            // Check adjacent tiles are visible
            expect(fog.isVisible(4, 5)).toBe(true);
            expect(fog.isVisible(6, 5)).toBe(true);
            
            // Check tiles outside range are not visible
            expect(fog.isVisible(2, 5)).toBe(false);
            expect(fog.isVisible(8, 5)).toBe(false);
        });
        
        test('should reset previous vision when setting new vision', () => {
            // Set initial vision
            fog.setVisionArea(3, 3, 2);
            expect(fog.isVisible(3, 3)).toBe(true);
            expect(fog.isVisible(2, 3)).toBe(true);
            
            // Set new vision area
            fog.setVisionArea(7, 7, 2);
            
            // Old area should be explored but not visible
            expect(fog.isExplored(3, 3)).toBe(true);
            expect(fog.isVisible(3, 3)).toBe(false);
            
            // New area should be visible
            expect(fog.isVisible(7, 7)).toBe(true);
            expect(fog.isVisible(6, 7)).toBe(true);
        });
    });
    
    describe('castle vision', () => {
        test('should update vision from castles', () => {
            const castlePositions = [
                { x: 2, y: 2, playerId: 0 },
                { x: 7, y: 7, playerId: 1 }
            ];
            
            fog.updateVisionFromCastles(castlePositions, 0);
            
            // Player 0 should see around their castle
            expect(fog.isVisible(2, 2, 0)).toBe(true);
            expect(fog.isVisible(1, 2, 0)).toBe(true);
            expect(fog.isVisible(3, 2, 0)).toBe(true);
            
            // Player 0 should not see player 1's castle
            expect(fog.isVisible(7, 7, 0)).toBe(false);
        });
        
        test('should provide larger vision range for castles', () => {
            const castlePositions = [{ x: 5, y: 5, playerId: 0 }];
            
            fog.updateVisionFromCastles(castlePositions, 0);
            
            // Castles should see further than normal vision range
            const castleRange = fog.visionRange + 2;
            expect(fog.isVisible(5 + castleRange, 5, 0)).toBe(true);
            expect(fog.isVisible(5 - castleRange, 5, 0)).toBe(true);
        });
    });
    
    describe('unit vision', () => {
        test('should update vision from units', () => {
            const units = [
                { x: 3, y: 3, playerId: 0, visionRange: 2 },
                { x: 6, y: 6, playerId: 0, visionRange: 3 },
                { x: 8, y: 8, playerId: 1, visionRange: 2 }
            ];
            
            fog.updateVisionFromUnits(units, 0);
            
            // Should see around player 0's units
            expect(fog.isVisible(3, 3, 0)).toBe(true);
            expect(fog.isVisible(6, 6, 0)).toBe(true);
            expect(fog.isVisible(1, 3, 0)).toBe(true); // Within unit 1's range
            expect(fog.isVisible(3, 6, 0)).toBe(true); // Within unit 2's range
            
            // Should not see player 1's unit
            expect(fog.isVisible(8, 8, 0)).toBe(false);
        });
        
        test('should use default vision range for units without specified range', () => {
            const units = [{ x: 5, y: 5, playerId: 0 }]; // No visionRange specified
            
            fog.updateVisionFromUnits(units, 0);
            
            expect(fog.isVisible(5, 5, 0)).toBe(true);
            expect(fog.isVisible(5 + fog.visionRange, 5, 0)).toBe(true);
        });
    });
    
    describe('fog alpha calculation', () => {
        test('should return correct alpha values for different visibility states', () => {
            // Unexplored
            expect(fog.getFogAlpha(5, 5)).toBe(1.0);
            
            // Explored
            fog.setTileVisibility(5, 5, 1);
            expect(fog.getFogAlpha(5, 5)).toBe(0.5);
            
            // Visible
            fog.setTileVisibility(5, 5, 2);
            expect(fog.getFogAlpha(5, 5)).toBe(0.0);
        });
    });
    
    describe('serialization', () => {
        test('should serialize and deserialize correctly', () => {
            fog.setTileVisibility(3, 3, 1);
            fog.setTileVisibility(5, 5, 2);
            fog.setCurrentPlayer(1);
            fog.visionRange = 4;
            
            const serialized = fog.serialize();
            const deserialized = FogOfWar.deserialize(serialized);
            
            expect(deserialized.mapWidth).toBe(fog.mapWidth);
            expect(deserialized.mapHeight).toBe(fog.mapHeight);
            expect(deserialized.playerCount).toBe(fog.playerCount);
            expect(deserialized.currentPlayer).toBe(fog.currentPlayer);
            expect(deserialized.visionRange).toBe(fog.visionRange);
            expect(deserialized.getTileVisibility(3, 3, 0)).toBe(1);
            expect(deserialized.getTileVisibility(5, 5, 0)).toBe(2);
        });
    });
    
    describe('visibility data export', () => {
        test('should export visibility data for a player', () => {
            fog.setTileVisibility(2, 2, 1);
            fog.setTileVisibility(4, 4, 2);
            
            const visibilityData = fog.getVisibilityData(0);
            
            expect(visibilityData.playerId).toBe(0);
            expect(visibilityData.mapWidth).toBe(10);
            expect(visibilityData.mapHeight).toBe(10);
            expect(visibilityData.visibility).toBeDefined();
            expect(visibilityData.visibility[2][2]).toBe(1);
            expect(visibilityData.visibility[4][4]).toBe(2);
        });
    });
    
    describe('edge cases', () => {
        test('should handle exploration at map edges', () => {
            fog.exploreArea(0, 0, 5);
            fog.exploreArea(9, 9, 5);
            
            expect(fog.isExplored(0, 0)).toBe(true);
            expect(fog.isExplored(9, 9)).toBe(true);
        });
        
        test('should handle single tile map', () => {
            const smallFog = new FogOfWar(1, 1, 1);
            smallFog.exploreArea(0, 0, 1);
            
            expect(smallFog.isExplored(0, 0)).toBe(true);
        });
        
        test('should handle zero vision range', () => {
            fog.exploreArea(5, 5, 0);
            expect(fog.isExplored(5, 5)).toBe(true);
            expect(fog.isExplored(4, 5)).toBe(false);
        });
    });
});