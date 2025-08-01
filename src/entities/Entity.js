export class Entity {
    constructor(id, type, owner) {
        this.id = id;
        this.type = type;
        this.owner = owner;
        this.components = new Map();
    }
    
    addComponent(name, component) {
        this.components.set(name, component);
        return this;
    }
    
    getComponent(name) {
        return this.components.get(name);
    }
    
    hasComponent(name) {
        return this.components.has(name);
    }
    
    removeComponent(name) {
        return this.components.delete(name);
    }
    
    getAllComponents() {
        return Array.from(this.components.entries());
    }
    
    destroy() {
        this.components.clear();
    }
}