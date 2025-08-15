import { GAME_CONFIG } from './GameConfig.js';

export class ConfigurationManager {
    constructor() {
        this.config = this.deepClone(GAME_CONFIG);
        this.listeners = new Map();
    }
    
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    set(path, newValue) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        const oldValue = target[lastKey];
        target[lastKey] = newValue;
        
        // Notify listeners
        this.notifyListeners(path, oldValue, newValue);
    }
    
    addListener(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(callback);
    }
    
    removeListener(path, callback) {
        if (this.listeners.has(path)) {
            const callbacks = this.listeners.get(path);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
            if (callbacks.length === 0) {
                this.listeners.delete(path);
            }
        }
    }
    
    notifyListeners(path, oldValue, newValue) {
        // Notify exact path listeners
        if (this.listeners.has(path)) {
            this.listeners.get(path).forEach(callback => {
                callback(oldValue, newValue, path);
            });
        }
        
        // Notify parent path listeners
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            if (this.listeners.has(parentPath)) {
                this.listeners.get(parentPath).forEach(callback => {
                    callback(oldValue, newValue, path);
                });
            }
        }
    }
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    exportConfig() {
        return this.deepClone(this.config);
    }
    
    importConfig(newConfig) {
        const oldConfig = this.config;
        this.config = this.deepClone(newConfig);
        this.notifyListeners('', oldConfig, this.config);
    }
    
    reset() {
        const oldConfig = this.config;
        this.config = this.deepClone(GAME_CONFIG);
        this.notifyListeners('', oldConfig, this.config);
    }
    
    has(path) {
        return this.get(path) !== undefined;
    }
}

// Singleton instance
let instance = null;

// Singleton pattern implementation
ConfigurationManager.getInstance = function() {
    if (!instance) {
        instance = new ConfigurationManager();
    }
    return instance;
};

// Global configuration instance
export const CONFIG = new ConfigurationManager();