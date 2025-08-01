import { ConfigurationManager } from './ConfigurationManager.js';

describe('ConfigurationManager', () => {
    let configManager;
    
    beforeEach(() => {
        configManager = new ConfigurationManager();
    });
    
    describe('get method', () => {
        test('should get nested configuration values', () => {
            const tileSize = configManager.get('map.tileSize');
            expect(tileSize).toBe(64);
        });
        
        test('should return undefined for non-existent paths', () => {
            const nonExistent = configManager.get('invalid.path');
            expect(nonExistent).toBeUndefined();
        });
        
        test('should get top-level configuration objects', () => {
            const mapConfig = configManager.get('map');
            expect(mapConfig).toHaveProperty('tileSize');
            expect(mapConfig).toHaveProperty('defaultSize');
        });
    });
    
    describe('set method', () => {
        test('should set configuration values', () => {
            configManager.set('map.tileSize', 128);
            expect(configManager.get('map.tileSize')).toBe(128);
        });
        
        test('should create nested paths that do not exist', () => {
            configManager.set('new.nested.path', 'test');
            expect(configManager.get('new.nested.path')).toBe('test');
        });
    });
    
    describe('listener system', () => {
        test('should notify listeners when values change', () => {
            const listener = jest.fn();
            configManager.addListener('map.tileSize', listener);
            
            configManager.set('map.tileSize', 128);
            
            expect(listener).toHaveBeenCalledWith(64, 128, 'map.tileSize');
        });
        
        test('should notify parent path listeners', () => {
            const mapListener = jest.fn();
            configManager.addListener('map', mapListener);
            
            configManager.set('map.tileSize', 128);
            
            expect(mapListener).toHaveBeenCalledWith(64, 128, 'map.tileSize');
        });
        
        test('should remove listeners', () => {
            const listener = jest.fn();
            configManager.addListener('map.tileSize', listener);
            configManager.removeListener('map.tileSize', listener);
            
            configManager.set('map.tileSize', 128);
            
            expect(listener).not.toHaveBeenCalled();
        });
        
        test('should handle multiple listeners for same path', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            configManager.addListener('map.tileSize', listener1);
            configManager.addListener('map.tileSize', listener2);
            
            configManager.set('map.tileSize', 128);
            
            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });
    });
    
    describe('export/import functionality', () => {
        test('should export configuration', () => {
            const exported = configManager.exportConfig();
            expect(exported).toHaveProperty('map');
            expect(exported).toHaveProperty('time');
            expect(exported.map.tileSize).toBe(64);
        });
        
        test('should import configuration', () => {
            const newConfig = { test: { value: 123 } };
            const listener = jest.fn();
            
            configManager.addListener('', listener);
            configManager.importConfig(newConfig);
            
            expect(configManager.get('test.value')).toBe(123);
            expect(listener).toHaveBeenCalled();
        });
        
        test('should not modify original config when exporting', () => {
            const exported = configManager.exportConfig();
            exported.map.tileSize = 999;
            
            expect(configManager.get('map.tileSize')).toBe(64);
        });
    });
    
    describe('utility methods', () => {
        test('should reset to default configuration', () => {
            configManager.set('map.tileSize', 999);
            configManager.reset();
            
            expect(configManager.get('map.tileSize')).toBe(64);
        });
        
        test('should check if path exists', () => {
            expect(configManager.has('map.tileSize')).toBe(true);
            expect(configManager.has('invalid.path')).toBe(false);
        });
    });
    
    describe('deep cloning', () => {
        test('should properly deep clone objects', () => {
            const original = { nested: { value: 123 } };
            const cloned = configManager.deepClone(original);
            
            cloned.nested.value = 456;
            expect(original.nested.value).toBe(123);
        });
    });
});