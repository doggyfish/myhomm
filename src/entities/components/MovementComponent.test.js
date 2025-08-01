import { MovementComponent } from './MovementComponent.js';
import { CONFIG } from '../../config/ConfigurationManager.js';

// Mock the CONFIG
jest.mock('../../config/ConfigurationManager.js', () => ({
    CONFIG: {
        get: jest.fn()
    }
}));

describe('MovementComponent', () => {
    let movement;
    
    beforeEach(() => {
        CONFIG.get.mockImplementation((path) => {
            const configValues = {
                'movement.baseTimePerTile': 1000,
                'movement.minEffectiveSpeed': 0.1,
                'movement.maxEffectiveSpeed': 1000
            };
            return configValues[path];
        });
        
        movement = new MovementComponent(10); // 10 tiles per second
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('constructor', () => {
        test('should create movement component with correct initial values', () => {
            expect(movement.baseSpeed).toBe(10);
            expect(movement.currentSpeed).toBe(10);
            expect(movement.path).toEqual([]);
            expect(movement.isMoving).toBe(false);
            expect(movement.movementProgress).toBe(0);
            expect(movement.targetTile).toBeNull();
        });
    });
    
    describe('speed calculations', () => {
        test('should calculate effective speed with terrain modifier', () => {
            const terrainConfig = { movementModifier: 2.0 }; // Road
            const effectiveSpeed = movement.calculateEffectiveSpeed(terrainConfig);
            
            expect(effectiveSpeed).toBe(20); // 10 * 2.0
        });
        
        test('should use default modifier of 1.0 for undefined terrain', () => {
            const effectiveSpeed = movement.calculateEffectiveSpeed(null);
            expect(effectiveSpeed).toBe(10);
        });
        
        test('should clamp speed to min/max values', () => {
            CONFIG.get.mockImplementation((path) => {
                if (path === 'movement.minEffectiveSpeed') return 5;
                if (path === 'movement.maxEffectiveSpeed') return 15;
                if (path === 'movement.baseTimePerTile') return 1000;
                return undefined;
            });
            
            // Test minimum clamping
            const slowTerrain = { movementModifier: 0.1 }; // Would give 1, but min is 5
            expect(movement.calculateEffectiveSpeed(slowTerrain)).toBe(5);
            
            // Test maximum clamping
            const fastTerrain = { movementModifier: 3.0 }; // Would give 30, but max is 15
            expect(movement.calculateEffectiveSpeed(fastTerrain)).toBe(15);
        });
        
        test('should calculate time per tile', () => {
            const terrainConfig = { movementModifier: 2.0 };
            const timePerTile = movement.calculateTimePerTile(terrainConfig);
            
            expect(timePerTile).toBe(50); // 1000 / (10 * 2.0) = 50ms
        });
    });
    
    describe('movement control', () => {
        test('should start movement with path', () => {
            const path = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
            movement.startMovement(path);
            
            expect(movement.isMoving).toBe(true);
            expect(movement.path).toEqual(path);
            expect(movement.movementProgress).toBe(0);
            expect(movement.targetTile).toEqual({ x: 1, y: 1 });
        });
        
        test('should not start movement with empty path', () => {
            movement.startMovement([]);
            
            expect(movement.isMoving).toBe(false);
            expect(movement.path).toEqual([]);
        });
        
        test('should stop movement', () => {
            movement.startMovement([{ x: 1, y: 1 }]);
            movement.stopMovement();
            
            expect(movement.isMoving).toBe(false);
            expect(movement.path).toEqual([]);
            expect(movement.movementProgress).toBe(0);
            expect(movement.targetTile).toBeNull();
        });
    });
    
    describe('movement updates', () => {
        test('should update movement progress', () => {
            const path = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
            const terrainConfig = { movementModifier: 1.0 };
            
            movement.startMovement(path);
            
            // Time per tile = 1000 / 10 = 100ms
            // Delta of 50ms should give 50% progress
            const completed = movement.updateMovement(50, terrainConfig);
            
            expect(completed).toBe(false);
            expect(movement.movementProgress).toBe(0.5);
            expect(movement.path).toHaveLength(2);
        });
        
        test('should advance to next tile when progress >= 1.0', () => {
            const path = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
            const terrainConfig = { movementModifier: 1.0 };
            
            movement.startMovement(path);
            
            // Time per tile = 100ms, so delta of 100ms should complete one tile
            const completed = movement.updateMovement(100, terrainConfig);
            
            expect(completed).toBe(false);
            expect(movement.movementProgress).toBe(0);
            expect(movement.path).toHaveLength(1);
            expect(movement.targetTile).toEqual({ x: 2, y: 2 });
        });
        
        test('should complete movement when path is empty', () => {
            const path = [{ x: 1, y: 1 }];
            const terrainConfig = { movementModifier: 1.0 };
            
            movement.startMovement(path);
            const completed = movement.updateMovement(100, terrainConfig);
            
            expect(completed).toBe(true);
            expect(movement.isMoving).toBe(false);
            expect(movement.path).toEqual([]);
        });
        
        test('should return false when not moving', () => {
            const terrainConfig = { movementModifier: 1.0 };
            const completed = movement.updateMovement(100, terrainConfig);
            
            expect(completed).toBe(false);
        });
    });
    
    describe('position interpolation', () => {
        test('should return start position when not moving', () => {
            const startPos = { x: 100, y: 200 };
            const targetPos = { x: 164, y: 264 };
            
            const interpolated = movement.getInterpolatedPosition(startPos, targetPos);
            
            expect(interpolated).toEqual(startPos);
        });
        
        test('should interpolate position based on movement progress', () => {
            const startPos = { x: 100, y: 200 };
            const targetPos = { x: 200, y: 400 };
            
            movement.startMovement([{ x: 1, y: 1 }]);
            movement.movementProgress = 0.5;
            
            const interpolated = movement.getInterpolatedPosition(startPos, targetPos);
            
            expect(interpolated.x).toBe(150); // 100 + (200-100) * 0.5
            expect(interpolated.y).toBe(300); // 200 + (400-200) * 0.5
        });
    });
});