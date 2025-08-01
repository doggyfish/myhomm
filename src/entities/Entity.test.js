import { Entity } from './Entity.js';
import { PositionComponent, CombatComponent, MovementComponent } from './components/index.js';

describe('Entity', () => {
    let entity;
    
    beforeEach(() => {
        entity = new Entity('test-id', 'test-type', 'test-owner');
    });
    
    describe('constructor', () => {
        test('should create entity with correct properties', () => {
            expect(entity.id).toBe('test-id');
            expect(entity.type).toBe('test-type');
            expect(entity.owner).toBe('test-owner');
            expect(entity.components).toBeInstanceOf(Map);
            expect(entity.components.size).toBe(0);
        });
    });
    
    describe('component management', () => {
        test('should add component', () => {
            const position = new PositionComponent(100, 200);
            entity.addComponent('position', position);
            
            expect(entity.components.size).toBe(1);
            expect(entity.getComponent('position')).toBe(position);
        });
        
        test('should return entity instance for method chaining', () => {
            const position = new PositionComponent(100, 200);
            const result = entity.addComponent('position', position);
            
            expect(result).toBe(entity);
        });
        
        test('should check if component exists', () => {
            const position = new PositionComponent(100, 200);
            
            expect(entity.hasComponent('position')).toBe(false);
            entity.addComponent('position', position);
            expect(entity.hasComponent('position')).toBe(true);
        });
        
        test('should get component', () => {
            const position = new PositionComponent(100, 200);
            entity.addComponent('position', position);
            
            expect(entity.getComponent('position')).toBe(position);
            expect(entity.getComponent('nonexistent')).toBeUndefined();
        });
        
        test('should remove component', () => {
            const position = new PositionComponent(100, 200);
            entity.addComponent('position', position);
            
            expect(entity.removeComponent('position')).toBe(true);
            expect(entity.hasComponent('position')).toBe(false);
            expect(entity.removeComponent('nonexistent')).toBe(false);
        });
        
        test('should get all components', () => {
            const position = new PositionComponent(100, 200);
            const combat = new CombatComponent(50);
            
            entity.addComponent('position', position);
            entity.addComponent('combat', combat);
            
            const components = entity.getAllComponents();
            expect(components).toHaveLength(2);
            expect(components).toContainEqual(['position', position]);
            expect(components).toContainEqual(['combat', combat]);
        });
        
        test('should destroy entity and clear components', () => {
            const position = new PositionComponent(100, 200);
            entity.addComponent('position', position);
            
            entity.destroy();
            expect(entity.components.size).toBe(0);
        });
    });
});