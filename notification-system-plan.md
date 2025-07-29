# Notification System - Detailed Implementation Plan

## Overview

A comprehensive notification system to inform players of major game events in real-time. The system will display notifications on the UI and allow players to quickly navigate to event locations by clicking on the notifications.

## Core Architecture

### Notification Manager Class
```javascript
class NotificationManager {
    constructor(scene) {
        this.scene = scene;
        this.notifications = [];
        this.notificationContainer = null;
        this.maxNotifications = 5;
        this.notificationDuration = 8000; // 8 seconds default
        this.soundManager = new NotificationSoundManager();
        
        this.initializeUI();
    }
    
    initializeUI() {
        // Create notification container in UI layer
        this.notificationContainer = this.scene.add.container(20, 100);
        this.notificationContainer.setDepth(1000); // High z-index
    }
    
    addNotification(type, data) {
        const notification = new GameNotification(type, data);
        this.notifications.push(notification);
        
        // Remove oldest if exceeding max
        if (this.notifications.length > this.maxNotifications) {
            this.removeOldestNotification();
        }
        
        this.displayNotification(notification);
        this.playNotificationSound(type);
        
        // Auto-remove after duration
        this.scene.time.delayedCall(this.notificationDuration, () => {
            this.removeNotification(notification);
        });
    }
    
    removeNotification(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
            notification.destroy();
            this.repositionNotifications();
        }
    }
}
```

### Game Notification Class
```javascript
class GameNotification {
    constructor(type, data) {
        this.type = type;
        this.data = data;
        this.timestamp = Date.now();
        this.id = this.generateId();
        this.uiElement = null;
        this.isClickable = this.shouldBeClickable();
        
        this.createUIElement();
    }
    
    shouldBeClickable() {
        // Events with location data should be clickable
        return ['army_fight', 'siege_fight'].includes(this.type);
    }
    
    createUIElement() {
        const config = this.getNotificationConfig();
        
        // Create notification panel
        this.uiElement = this.scene.add.container(0, 0);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 300, 60, config.backgroundColor, 0.9);
        bg.setStrokeStyle(2, config.borderColor);
        
        // Icon
        const icon = this.scene.add.image(-120, 0, config.iconKey);
        icon.setDisplaySize(32, 32);
        
        // Title text
        const title = this.scene.add.text(-80, -15, config.title, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: config.textColor,
            fontStyle: 'bold'
        });
        
        // Description text
        const description = this.scene.add.text(-80, 5, config.description, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: config.textColor
        });
        
        // Time indicator
        const timeText = this.scene.add.text(100, -20, this.getTimeString(), {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#CCCCCC'
        });
        
        this.uiElement.add([bg, icon, title, description, timeText]);
        
        // Add click handler if clickable
        if (this.isClickable) {
            bg.setInteractive();
            bg.on('pointerdown', () => this.handleClick());
            bg.on('pointerover', () => bg.setAlpha(1.0));
            bg.on('pointerout', () => bg.setAlpha(0.9));
            
            // Add click indicator
            const clickIndicator = this.scene.add.text(100, 10, '📍 Click to view', {
                fontSize: '9px',
                fontFamily: 'Arial',
                color: '#FFFF00'
            });
            this.uiElement.add(clickIndicator);
        }
        
        // Add entrance animation
        this.uiElement.setAlpha(0);
        this.uiElement.setScale(0.8);
        
        this.scene.tweens.add({
            targets: this.uiElement,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    handleClick() {
        if (this.data.location) {
            // Navigate camera to event location
            CameraManager.focusOnPosition(this.data.location.x, this.data.location.y);
            
            // Optional: Add visual indicator at location
            VisualEffectManager.addLocationIndicator(this.data.location);
            
            // Play click sound
            SoundManager.playSound('ui_click');
        }
    }
}
```

## Event Types and Configurations

### Army Fight Notifications
```javascript
const ArmyFightNotification = {
    type: 'army_fight',
    config: {
        backgroundColor: 0xFF4444,
        borderColor: 0xFF0000,
        iconKey: 'icon_battle',
        textColor: '#FFFFFF'
    },
    
    createFromCombatData(combatResult) {
        return {
            type: 'army_fight',
            title: 'Army Battle',
            description: `${combatResult.winner.name} defeated ${combatResult.loser.name}`,
            location: combatResult.battleLocation,
            severity: 'high',
            data: {
                winner: combatResult.winner,
                loser: combatResult.loser,
                location: combatResult.battleLocation,
                casualities: combatResult.casualities,
                spellsUsed: combatResult.spellEffects?.length || 0
            }
        };
    }
};
```

### Siege Fight Notifications
```javascript
const SiegeFightNotification = {
    type: 'siege_fight',
    config: {
        backgroundColor: 0x8B4513,
        borderColor: 0xA0522D,
        iconKey: 'icon_castle_battle',
        textColor: '#FFFFFF'
    },
    
    createFromSiegeData(siegeResult) {
        const isSuccess = siegeResult.siegeSuccessful;
        return {
            type: 'siege_fight',
            title: isSuccess ? 'Castle Captured!' : 'Siege Repelled',
            description: isSuccess ? 
                `${siegeResult.newOwner.name} captured castle from ${siegeResult.previousOwner.name}` :
                `${siegeResult.defender.name} defended castle against ${siegeResult.attacker.name}`,
            location: siegeResult.castleLocation,
            severity: 'critical',
            data: {
                success: isSuccess,
                attacker: siegeResult.attacker,
                defender: siegeResult.defender,
                location: siegeResult.castleLocation,
                resourcesCaptured: siegeResult.capturedResources || 0
            }
        };
    }
};
```

### Instant Spell Cast Notifications
```javascript
const SpellCastNotification = {
    type: 'spell_cast',
    config: {
        backgroundColor: 0x4B0082,
        borderColor: 0x8A2BE2,
        iconKey: 'icon_magic',
        textColor: '#FFFFFF'
    },
    
    createFromSpellData(spellData) {
        return {
            type: 'spell_cast',
            title: 'Spell Cast',
            description: `${spellData.caster.name} cast ${spellData.spellName}`,
            location: spellData.targetLocation,
            severity: 'medium',
            data: {
                caster: spellData.caster,
                spellName: spellData.spellName,
                target: spellData.target,
                location: spellData.targetLocation,
                effect: spellData.result
            }
        };
    }
};
```

## UI Layout and Positioning

### Notification Container Layout
```javascript
class NotificationLayout {
    static positionNotifications(notificationContainer, notifications) {
        notifications.forEach((notification, index) => {
            const yOffset = index * 70; // 70px spacing between notifications
            
            // Animate to new position
            notification.scene.tweens.add({
                targets: notification.uiElement,
                y: yOffset,
                duration: 200,
                ease: 'Power2'
            });
        });
    }
    
    static getNotificationPosition() {
        return {
            x: 20,           // 20px from left edge
            y: 100,          // 100px from top (below UI panels)
            spacing: 70,     // 70px between notifications
            maxVisible: 5    // Maximum visible notifications
        };
    }
}
```

### Responsive Design
```javascript
class ResponsiveNotificationLayout {
    static adjustForScreenSize(screenWidth, screenHeight) {
        if (screenWidth < 1024) {
            // Mobile/small screen adjustments
            return {
                x: 10,
                y: 80,
                width: Math.min(280, screenWidth - 40),
                fontSize: 12
            };
        } else {
            // Desktop layout
            return {
                x: 20,
                y: 100,
                width: 300,
                fontSize: 14
            };
        }
    }
}
```

## Camera Navigation System

### Camera Manager Integration
```javascript
class CameraManager {
    static focusOnPosition(x, y, duration = 1000) {
        const camera = game.scene.getScene('GameScene').cameras.main;
        
        // Calculate world position from grid coordinates
        const worldX = x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Smooth camera pan
        camera.pan(worldX, worldY, duration, 'Power2', false, (camera, progress) => {
            if (progress === 1) {
                // Camera reached destination
                SoundManager.playSound('camera_focus');
            }
        });
        
        // Optional zoom adjustment
        if (camera.zoom < 1.0) {
            camera.zoomTo(1.0, duration);
        }
    }
    
    static addLocationIndicator(location) {
        const indicator = new LocationIndicator(location.x, location.y);
        indicator.show(3000); // Show for 3 seconds
    }
}
```

### Location Indicator Visual
```javascript
class LocationIndicator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.scene = game.scene.getScene('GameScene');
        this.graphics = null;
        this.createIndicator();
    }
    
    createIndicator() {
        const worldX = this.x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = this.y * TILE_SIZE + TILE_SIZE / 2;
        
        // Create pulsing circle indicator
        this.graphics = this.scene.add.graphics();
        this.graphics.setPosition(worldX, worldY);
        
        // Pulsing animation
        this.scene.tweens.add({
            targets: this.graphics,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
    
    show(duration) {
        // Draw indicator
        this.graphics.clear();
        this.graphics.lineStyle(3, 0xFFFF00, 1);
        this.graphics.strokeCircle(0, 0, 30);
        this.graphics.lineStyle(2, 0xFF0000, 1);
        this.graphics.strokeCircle(0, 0, 20);
        
        // Auto-remove after duration
        this.scene.time.delayedCall(duration, () => {
            this.destroy();
        });
    }
    
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
    }
}
```

## Sound System Integration

### Notification Sound Manager
```javascript
class NotificationSoundManager {
    constructor() {
        this.sounds = {
            army_fight: 'sound_battle_alert',
            siege_fight: 'sound_siege_alert',
            spell_cast: 'sound_magic_alert',
            critical: 'sound_critical_alert'
        };
    }
    
    playNotificationSound(type, severity = 'medium') {
        let soundKey;
        
        if (severity === 'critical') {
            soundKey = this.sounds.critical;
        } else {
            soundKey = this.sounds[type] || 'sound_generic_alert';
        }
        
        SoundManager.playSound(soundKey, { volume: 0.7 });
    }
}
```

## Integration with Game Events

### Combat System Integration
```javascript
// In CombatSystem.js
function resolveArmyVsArmyCombat(army1, army2) {
    // ... existing combat logic ...
    
    const combatResult = {
        winner: result.winner,
        loser: result.loser,
        battleLocation: { x: army1.x, y: army1.y },
        casualities: result.casualities,
        spellEffects: result.spellEffects
    };
    
    // Trigger notification
    NotificationManager.addNotification('army_fight', 
        ArmyFightNotification.createFromCombatData(combatResult)
    );
    
    return combatResult;
}

function resolveArmyVsCastleCombat(attackingArmy, targetCastle) {
    // ... existing siege logic ...
    
    const siegeResult = {
        siegeSuccessful: result.siegeSuccessful,
        attacker: attackingArmy.owner,
        defender: targetCastle.owner,
        castleLocation: { x: targetCastle.x, y: targetCastle.y },
        capturedResources: result.capturedResources
    };
    
    // Trigger notification
    NotificationManager.addNotification('siege_fight',
        SiegeFightNotification.createFromSiegeData(siegeResult)
    );
    
    return siegeResult;
}
```

### Magic System Integration
```javascript
// In Magic System when instant spells are cast
function castInstantSpell(spell, caster, target) {
    const result = spell.effect(target);
    
    const spellData = {
        caster: caster,
        spellName: spell.name,
        target: target,
        targetLocation: target.position || target.location,
        result: result
    };
    
    // Trigger notification for significant spells
    if (spell.notificationWorthy) {
        NotificationManager.addNotification('spell_cast',
            SpellCastNotification.createFromSpellData(spellData)
        );
    }
    
    return result;
}
```

## Notification History System

### Notification Log
```javascript
class NotificationHistory {
    constructor() {
        this.history = [];
        this.maxHistorySize = 100;
    }
    
    addToHistory(notification) {
        this.history.unshift({
            ...notification,
            timestamp: Date.now(),
            read: false
        });
        
        // Maintain history size
        if (this.history.length > this.maxHistorySize) {
            this.history.pop();
        }
    }
    
    getUnreadCount() {
        return this.history.filter(n => !n.read).length;
    }
    
    markAsRead(notificationId) {
        const notification = this.history.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }
    
    getHistoryForUI() {
        return this.history.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            description: n.description,
            timestamp: n.timestamp,
            read: n.read,
            clickable: n.isClickable
        }));
    }
}
```

## Configuration and Settings

### Notification Settings
```javascript
const NotificationConfig = {
    maxNotifications: 5,
    defaultDuration: 8000,
    
    priorities: {
        critical: { duration: 12000, sound: true, persistent: true },
        high: { duration: 8000, sound: true, persistent: false },
        medium: { duration: 6000, sound: true, persistent: false },
        low: { duration: 4000, sound: false, persistent: false }
    },
    
    positions: {
        desktop: { x: 20, y: 100, width: 300 },
        mobile: { x: 10, y: 80, width: 280 }
    },
    
    eventSettings: {
        army_fight: { priority: 'high', clickable: true },
        siege_fight: { priority: 'critical', clickable: true },
        spell_cast: { priority: 'medium', clickable: false },
        resource_depleted: { priority: 'medium', clickable: false },
        unit_produced: { priority: 'low', clickable: false }
    }
};
```

## Implementation Checklist

### Phase 1: Core System
- [ ] Create NotificationManager class
- [ ] Implement GameNotification class  
- [ ] Set up basic UI container and positioning
- [ ] Add notification creation and removal logic

### Phase 2: Event Integration
- [ ] Integrate with combat system for battle notifications
- [ ] Add siege fight notifications
- [ ] Connect spell casting to notification system
- [ ] Test event triggering and display

### Phase 3: Interactivity
- [ ] Implement camera navigation on click
- [ ] Add location indicator system
- [ ] Create smooth camera transitions
- [ ] Test click-to-view functionality

### Phase 4: Polish and Features
- [ ] Add sound system integration
- [ ] Implement notification history
- [ ] Create settings and configuration
- [ ] Add animations and visual effects
- [ ] Responsive design for different screen sizes

This notification system provides comprehensive event tracking with intuitive UI feedback and navigation capabilities, enhancing the strategic gameplay experience.