/**
 * Base Component class for Entity Component System
 */
export class Component {
    constructor(type = 'component') {
        this.type = type;
        this.active = true;
        this.entity = null;
    }

    /**
     * Set the entity this component is attached to
     * @param {Entity} entity - The parent entity
     */
    setEntity(entity) {
        this.entity = entity;
    }

    /**
     * Update method called each frame
     * @param {number} delta - Time since last update in milliseconds
     */
    update(delta) {
        // Override in subclasses
    }

    /**
     * Activate the component
     */
    activate() {
        this.active = true;
    }

    /**
     * Deactivate the component
     */
    deactivate() {
        this.active = false;
    }

    /**
     * Check if component is active
     * @returns {boolean} True if active
     */
    isActive() {
        return this.active;
    }

    /**
     * Destroy the component and clean up resources
     */
    destroy() {
        this.entity = null;
        this.active = false;
    }
}