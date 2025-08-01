import { PositionComponent } from './PositionComponent.js';
import { CONFIG } from '../../config/ConfigurationManager.js';

// Mock the CONFIG
jest.mock('../../config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn()
    }
}));

describe('PositionComponent', () => {
    beforeEach(() => {
        CONFIG.get.mockImplementation((path) => {
            if (path === 'map.tileSize') return 64;
            return undefined;
        });
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('constructor', () => {
        test('should create position with correct coordinates', () => {
            const position = new PositionComponent(128, 192);
            
            expect(position.x).toBe(128);
            expect(position.y).toBe(192);
            expect(position.tileX).toBe(2); // 128 / 64
            expect(position.tileY).toBe(3); // 192 / 64
        });
    });
    
    describe('setPosition', () => {
        test('should update position and tile coordinates', () => {
            const position = new PositionComponent(0, 0);
            position.setPosition(256, 320);
            
            expect(position.x).toBe(256);
            expect(position.y).toBe(320);
            expect(position.tileX).toBe(4); // 256 / 64
            expect(position.tileY).toBe(5); // 320 / 64
        });
    });
    
    describe('setTilePosition', () => {
        test('should update tile and world coordinates', () => {
            const position = new PositionComponent(0, 0);
            position.setTilePosition(3, 4);
            
            expect(position.tileX).toBe(3);
            expect(position.tileY).toBe(4);
            expect(position.x).toBe(192); // 3 * 64
            expect(position.y).toBe(256); // 4 * 64
        });
    });
    
    describe('distance calculations', () => {
        test('should calculate distance to another position', () => {
            const pos1 = new PositionComponent(0, 0);
            const pos2 = new PositionComponent(3, 4);
            
            expect(pos1.distanceTo(pos2)).toBe(5); // 3-4-5 triangle
        });
        
        test('should calculate tile distance (Manhattan)', () => {
            const pos1 = new PositionComponent(64, 64); // tile 1,1
            const pos2 = new PositionComponent(192, 256); // tile 3,4
            
            expect(pos1.tileDistanceTo(pos2)).toBe(5); // |3-1| + |4-1| = 2 + 3 = 5
        });
    });
});