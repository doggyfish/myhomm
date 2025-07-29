# Settings UI Implementation Plan

## Overview

A comprehensive settings UI system that allows players to configure game preferences including map size, difficulty, player count, and audio settings. The system will handle both immediate effects (music) and future game settings (map size, difficulty, player count).

## Core Architecture

### Settings Manager Class
```javascript
class SettingsManager {
    constructor() {
        this.currentSettings = this.loadSettings();
        this.defaultSettings = this.getDefaultSettings();
        this.pendingGameSettings = { ...this.currentSettings.gameSettings };
        this.listeners = {};
        
        this.initializeSettings();
    }
    
    getDefaultSettings() {
        return {
            // Immediate effect settings
            audio: {
                musicEnabled: true,
                musicVolume: 0.7,
                soundEffectsEnabled: true,
                soundEffectsVolume: 0.8
            },
            
            // Future game settings
            gameSettings: {
                mapSize: 64,        // 32, 64, 128, 256
                difficulty: 'normal', // easy, normal, hard
                playerCount: 3,     // 2-8 players
                gameSpeed: 1.0      // 0.5x to 2.0x
            },
            
            // UI preferences
            ui: {
                showNotifications: true,
                showMinimap: true,
                autoSave: true
            }
        };
    }
    
    // Apply immediate settings (like music)
    applyImmediateSettings(setting, value) {
        switch(setting) {
            case 'musicEnabled':
                this.currentSettings.audio.musicEnabled = value;
                AudioManager.toggleMusic(value);
                break;
            case 'musicVolume':
                this.currentSettings.audio.musicVolume = value;
                AudioManager.setMusicVolume(value);
                break;
            case 'soundEffectsEnabled':
                this.currentSettings.audio.soundEffectsEnabled = value;
                AudioManager.toggleSoundEffects(value);
                break;
            case 'soundEffectsVolume':
                this.currentSettings.audio.soundEffectsVolume = value;
                AudioManager.setSoundEffectsVolume(value);
                break;
        }
        
        this.saveSettings();
        this.notifyListeners(setting, value);
    }
    
    // Update pending game settings (for next game)
    updateGameSetting(setting, value) {
        this.pendingGameSettings[setting] = value;
        this.notifyListeners(setting, value);
    }
    
    // Apply pending settings to current settings (when starting new game)
    applyPendingGameSettings() {
        this.currentSettings.gameSettings = { ...this.pendingGameSettings };
        this.saveSettings();
    }
    
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.currentSettings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        return saved ? JSON.parse(saved) : this.getDefaultSettings();
    }
}
```

### Settings UI Class
```javascript
class SettingsUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isVisible = false;
        this.uiElements = {};
        this.tabSystem = null;
        
        this.createUI();
        this.bindEvents();
    }
    
    createUI() {
        // Main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000);
        this.container.setVisible(false);
        
        // Background overlay
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.7
        );
        overlay.setInteractive();
        
        // Settings panel
        const panelWidth = 600;
        const panelHeight = 500;
        const panel = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            panelWidth,
            panelHeight,
            0x2a2a2a
        );
        panel.setStrokeStyle(3, 0x4a4a4a);
        
        // Title
        const title = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 220,
            'Game Settings',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);
        
        this.container.add([overlay, panel, title]);
        
        // Create tab system
        this.createTabSystem();
        
        // Create settings sections
        this.createGameplaySettings();
        this.createAudioSettings();
        this.createUISettings();
        
        // Create control buttons
        this.createControlButtons();
    }
    
    createTabSystem() {
        const tabY = this.scene.cameras.main.centerY - 180;
        const tabs = [
            { key: 'gameplay', label: 'Gameplay', x: -100 },
            { key: 'audio', label: 'Audio', x: 0 },
            { key: 'interface', label: 'Interface', x: 100 }
        ];
        
        this.tabSystem = {
            activeTab: 'gameplay',
            tabs: {}
        };
        
        tabs.forEach(tab => {
            const tabButton = this.scene.add.rectangle(
                this.scene.cameras.main.centerX + tab.x,
                tabY,
                90, 35,
                0x3a3a3a
            );
            tabButton.setStrokeStyle(2, 0x5a5a5a);
            tabButton.setInteractive();
            
            const tabLabel = this.scene.add.text(
                this.scene.cameras.main.centerX + tab.x,
                tabY,
                tab.label,
                {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: '#CCCCCC'
                }
            );
            tabLabel.setOrigin(0.5);
            
            tabButton.on('pointerdown', () => this.switchTab(tab.key));
            tabButton.on('pointerover', () => {
                if (this.tabSystem.activeTab !== tab.key) {
                    tabButton.setFillStyle(0x4a4a4a);
                }
            });
            tabButton.on('pointerout', () => {
                if (this.tabSystem.activeTab !== tab.key) {
                    tabButton.setFillStyle(0x3a3a3a);
                }
            });
            
            this.tabSystem.tabs[tab.key] = {
                button: tabButton,
                label: tabLabel,
                content: null
            };
            
            this.container.add([tabButton, tabLabel]);
        });
        
        this.updateTabVisuals();
    }
    
    createGameplaySettings() {
        const contentY = this.scene.cameras.main.centerY - 100;
        const gameplayContent = this.scene.add.container(0, 0);
        
        // Map Size Setting
        this.createDropdownSetting(
            gameplayContent,
            'Map Size',
            'mapSize',
            contentY - 80,
            [
                { value: 32, label: 'Small (32x32)' },
                { value: 64, label: 'Medium (64x64)' },
                { value: 128, label: 'Large (128x128)' },
                { value: 256, label: 'Huge (256x256)' }
            ],
            SettingsManager.pendingGameSettings.mapSize,
            true // isGameSetting
        );
        
        // Difficulty Setting
        this.createDropdownSetting(
            gameplayContent,
            'Difficulty',
            'difficulty',
            contentY - 20,
            [
                { value: 'easy', label: 'Easy' },
                { value: 'normal', label: 'Normal' },
                { value: 'hard', label: 'Hard' }
            ],
            SettingsManager.pendingGameSettings.difficulty,
            true // isGameSetting
        );
        
        // Player Count Setting
        this.createSliderSetting(
            gameplayContent,
            'Player Count',
            'playerCount',
            contentY + 40,
            2, 8, 1,
            SettingsManager.pendingGameSettings.playerCount,
            true // isGameSetting
        );
        
        // Game Speed Setting
        this.createSliderSetting(
            gameplayContent,
            'Game Speed',
            'gameSpeed',
            contentY + 100,
            0.5, 2.0, 0.1,
            SettingsManager.pendingGameSettings.gameSpeed,
            true // isGameSetting
        );
        
        // Future games notice
        const notice = this.scene.add.text(
            this.scene.cameras.main.centerX,
            contentY + 160,
            'Note: Gameplay settings will apply to new games only',
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#FFAA00',
                fontStyle: 'italic'
            }
        );
        notice.setOrigin(0.5);
        gameplayContent.add(notice);
        
        this.tabSystem.tabs.gameplay.content = gameplayContent;
        this.container.add(gameplayContent);
    }
    
    createAudioSettings() {
        const contentY = this.scene.cameras.main.centerY - 100;
        const audioContent = this.scene.add.container(0, 0);
        
        // Music On/Off Toggle
        this.createToggleSetting(
            audioContent,
            'Music',
            'musicEnabled',
            contentY - 60,
            SettingsManager.currentSettings.audio.musicEnabled,
            false // immediate setting
        );
        
        // Music Volume Slider
        this.createSliderSetting(
            audioContent,
            'Music Volume',
            'musicVolume',
            contentY - 10,
            0.0, 1.0, 0.1,
            SettingsManager.currentSettings.audio.musicVolume,
            false // immediate setting
        );
        
        // Sound Effects Toggle
        this.createToggleSetting(
            audioContent,
            'Sound Effects',
            'soundEffectsEnabled',
            contentY + 40,
            SettingsManager.currentSettings.audio.soundEffectsEnabled,
            false // immediate setting
        );
        
        // Sound Effects Volume
        this.createSliderSetting(
            audioContent,
            'SFX Volume',
            'soundEffectsVolume',
            contentY + 90,
            0.0, 1.0, 0.1,
            SettingsManager.currentSettings.audio.soundEffectsVolume,
            false // immediate setting
        );
        
        // Immediate effect notice
        const notice = this.scene.add.text(
            this.scene.cameras.main.centerX,
            contentY + 140,
            'Note: Audio settings take effect immediately',
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#00AAFF',
                fontStyle: 'italic'
            }
        );
        notice.setOrigin(0.5);
        audioContent.add(notice);
        
        audioContent.setVisible(false);
        this.tabSystem.tabs.audio.content = audioContent;
        this.container.add(audioContent);
    }
    
    createUISettings() {
        const contentY = this.scene.cameras.main.centerY - 100;
        const uiContent = this.scene.add.container(0, 0);
        
        // Show Notifications Toggle
        this.createToggleSetting(
            uiContent,
            'Show Notifications',
            'showNotifications',
            contentY - 40,
            SettingsManager.currentSettings.ui.showNotifications,
            false // immediate setting
        );
        
        // Show Minimap Toggle
        this.createToggleSetting(
            uiContent,
            'Show Minimap',
            'showMinimap',
            contentY + 10,
            SettingsManager.currentSettings.ui.showMinimap,
            false // immediate setting
        );
        
        // Auto Save Toggle
        this.createToggleSetting(
            uiContent,
            'Auto Save',
            'autoSave',
            contentY + 60,
            SettingsManager.currentSettings.ui.autoSave,
            false // immediate setting
        );
        
        uiContent.setVisible(false);
        this.tabSystem.tabs.interface.content = uiContent;
        this.container.add(uiContent);
    }
    
    createToggleSetting(container, label, settingKey, y, currentValue, isGameSetting) {
        const centerX = this.scene.cameras.main.centerX;
        
        // Label
        const labelText = this.scene.add.text(centerX - 150, y, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        
        // Toggle button
        const toggleBg = this.scene.add.rectangle(centerX + 100, y, 60, 30, 
            currentValue ? 0x00AA00 : 0x666666);
        toggleBg.setStrokeStyle(2, 0x888888);
        toggleBg.setInteractive();
        
        const toggleText = this.scene.add.text(centerX + 100, y, 
            currentValue ? 'ON' : 'OFF', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        toggleText.setOrigin(0.5);
        
        // Click handler
        toggleBg.on('pointerdown', () => {
            const newValue = !currentValue;
            currentValue = newValue;
            
            toggleBg.setFillStyle(newValue ? 0x00AA00 : 0x666666);
            toggleText.setText(newValue ? 'ON' : 'OFF');
            
            if (isGameSetting) {
                SettingsManager.updateGameSetting(settingKey, newValue);
            } else {
                SettingsManager.applyImmediateSettings(settingKey, newValue);
            }
        });
        
        // Hover effects
        toggleBg.on('pointerover', () => toggleBg.setAlpha(0.8));
        toggleBg.on('pointerout', () => toggleBg.setAlpha(1.0));
        
        container.add([labelText, toggleBg, toggleText]);
    }
    
    createSliderSetting(container, label, settingKey, y, min, max, step, currentValue, isGameSetting) {
        const centerX = this.scene.cameras.main.centerX;
        
        // Label
        const labelText = this.scene.add.text(centerX - 150, y, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        
        // Slider track
        const trackWidth = 200;
        const track = this.scene.add.rectangle(centerX + 50, y, trackWidth, 6, 0x444444);
        
        // Slider handle
        const handlePos = ((currentValue - min) / (max - min)) * trackWidth;
        const handle = this.scene.add.circle(centerX + 50 - trackWidth/2 + handlePos, y, 10, 0xAAAAA);
        handle.setInteractive();
        
        // Value display
        const valueText = this.scene.add.text(centerX + 170, y, currentValue.toString(), {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFF00'
        });
        valueText.setOrigin(0.5);
        
        // Drag functionality
        let isDragging = false;
        
        handle.on('pointerdown', () => { isDragging = true; });
        
        this.scene.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const localX = pointer.x - (centerX + 50 - trackWidth/2);
                const clampedX = Phaser.Math.Clamp(localX, 0, trackWidth);
                const ratio = clampedX / trackWidth;
                const newValue = min + (ratio * (max - min));
                const steppedValue = Math.round(newValue / step) * step;
                
                handle.x = centerX + 50 - trackWidth/2 + clampedX;
                valueText.setText(steppedValue.toFixed(step < 1 ? 1 : 0));
                
                if (isGameSetting) {
                    SettingsManager.updateGameSetting(settingKey, steppedValue);
                } else {
                    SettingsManager.applyImmediateSettings(settingKey, steppedValue);
                }
            }
        });
        
        this.scene.input.on('pointerup', () => { isDragging = false; });
        
        container.add([labelText, track, handle, valueText]);
    }
    
    createDropdownSetting(container, label, settingKey, y, options, currentValue, isGameSetting) {
        const centerX = this.scene.cameras.main.centerX;
        
        // Label
        const labelText = this.scene.add.text(centerX - 150, y, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        
        // Dropdown button
        const currentOption = options.find(opt => opt.value === currentValue);
        const dropdown = this.scene.add.rectangle(centerX + 80, y, 160, 35, 0x444444);
        dropdown.setStrokeStyle(2, 0x666666);
        dropdown.setInteractive();
        
        const dropdownText = this.scene.add.text(centerX + 80, y, currentOption.label, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        dropdownText.setOrigin(0.5);
        
        // Dropdown arrow
        const arrow = this.scene.add.text(centerX + 140, y, '▼', {
            fontSize: '12px',
            color: '#FFFFFF'
        });
        arrow.setOrigin(0.5);
        
        // Dropdown menu (hidden initially)
        const menu = this.scene.add.container(0, 0);
        menu.setVisible(false);
        
        options.forEach((option, index) => {
            const optionBg = this.scene.add.rectangle(
                centerX + 80, y + 40 + (index * 30), 160, 30, 0x333333);
            optionBg.setStrokeStyle(1, 0x555555);
            optionBg.setInteractive();
            
            const optionText = this.scene.add.text(
                centerX + 80, y + 40 + (index * 30), option.label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            });
            optionText.setOrigin(0.5);
            
            optionBg.on('pointerdown', () => {
                dropdownText.setText(option.label);
                menu.setVisible(false);
                
                if (isGameSetting) {
                    SettingsManager.updateGameSetting(settingKey, option.value);
                } else {
                    SettingsManager.applyImmediateSettings(settingKey, option.value);
                }
            });
            
            optionBg.on('pointerover', () => optionBg.setFillStyle(0x444444));
            optionBg.on('pointerout', () => optionBg.setFillStyle(0x333333));
            
            menu.add([optionBg, optionText]);
        });
        
        // Toggle dropdown
        dropdown.on('pointerdown', () => {
            menu.setVisible(!menu.visible);
        });
        
        container.add([labelText, dropdown, dropdownText, arrow, menu]);
    }
    
    createControlButtons() {
        const buttonY = this.scene.cameras.main.centerY + 200;
        const centerX = this.scene.cameras.main.centerX;
        
        // Apply/Save Button
        const applyButton = this.scene.add.rectangle(centerX - 100, buttonY, 120, 40, 0x00AA00);
        applyButton.setStrokeStyle(2, 0x00CC00);
        applyButton.setInteractive();
        
        const applyText = this.scene.add.text(centerX - 100, buttonY, 'Apply', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        applyText.setOrigin(0.5);
        
        // Reset to Defaults Button
        const resetButton = this.scene.add.rectangle(centerX, buttonY, 120, 40, 0xAA6600);
        resetButton.setStrokeStyle(2, 0xCC7700);
        resetButton.setInteractive();
        
        const resetText = this.scene.add.text(centerX, buttonY, 'Reset', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        resetText.setOrigin(0.5);
        
        // Close Button
        const closeButton = this.scene.add.rectangle(centerX + 100, buttonY, 120, 40, 0xAA0000);
        closeButton.setStrokeStyle(2, 0xCC0000);
        closeButton.setInteractive();
        
        const closeText = this.scene.add.text(centerX + 100, buttonY, 'Close', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        closeText.setOrigin(0.5);
        
        // Button events
        applyButton.on('pointerdown', () => this.applySettings());
        resetButton.on('pointerdown', () => this.resetToDefaults());
        closeButton.on('pointerdown', () => this.hide());
        
        // Hover effects
        [applyButton, resetButton, closeButton].forEach(button => {
            button.on('pointerover', () => button.setAlpha(0.8));
            button.on('pointerout', () => button.setAlpha(1.0));
        });
        
        this.container.add([
            applyButton, applyText, 
            resetButton, resetText, 
            closeButton, closeText
        ]);
    }
    
    switchTab(tabKey) {
        // Hide all content
        Object.values(this.tabSystem.tabs).forEach(tab => {
            if (tab.content) {
                tab.content.setVisible(false);
            }
        });
        
        // Show selected content
        this.tabSystem.activeTab = tabKey;
        if (this.tabSystem.tabs[tabKey].content) {
            this.tabSystem.tabs[tabKey].content.setVisible(true);
        }
        
        this.updateTabVisuals();
    }
    
    updateTabVisuals() {
        Object.entries(this.tabSystem.tabs).forEach(([key, tab]) => {
            if (key === this.tabSystem.activeTab) {
                tab.button.setFillStyle(0x5a5a5a);
                tab.label.setColor('#FFFFFF');
            } else {
                tab.button.setFillStyle(0x3a3a3a);
                tab.label.setColor('#CCCCCC');
            }
        });
    }
    
    show() {
        this.isVisible = true;
        this.container.setVisible(true);
        
        // Entrance animation
        this.container.setAlpha(0);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        // Pause game while settings are open
        if (this.scene.game.gameState) {
            this.scene.game.gameState.pause();
        }
    }
    
    hide() {
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.isVisible = false;
                this.container.setVisible(false);
                
                // Resume game
                if (this.scene.game.gameState) {
                    this.scene.game.gameState.resume();
                }
            }
        });
    }
    
    applySettings() {
        // Game settings will be applied when starting new game
        SettingsManager.saveSettings();
        
        // Show confirmation
        this.showConfirmation('Settings saved successfully!');
    }
    
    resetToDefaults() {
        // Reset to default values
        const defaults = SettingsManager.getDefaultSettings();
        
        // Apply immediate settings
        Object.entries(defaults.audio).forEach(([key, value]) => {
            SettingsManager.applyImmediateSettings(key, value);
        });
        
        // Reset pending game settings
        SettingsManager.pendingGameSettings = { ...defaults.gameSettings };
        
        // Refresh UI
        this.refreshUI();
        
        this.showConfirmation('Settings reset to defaults!');
    }
    
    showConfirmation(message) {
        const confirmText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 250,
            message,
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#00FF00',
                fontStyle: 'bold'
            }
        );
        confirmText.setOrigin(0.5);
        confirmText.setAlpha(0);
        
        // Fade in and out
        this.scene.tweens.add({
            targets: confirmText,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                confirmText.destroy();
            }
        });
    }
}
```

## Integration with Game Systems

### Main Menu Integration
```javascript
// In MainMenuScene.js
class MainMenuScene extends Phaser.Scene {
    create() {
        // ... existing menu code ...
        
        // Settings button
        const settingsButton = this.add.rectangle(100, 50, 120, 40, 0x444444);
        settingsButton.setStrokeStyle(2, 0x666666);
        settingsButton.setInteractive();
        
        const settingsText = this.add.text(100, 50, 'Settings', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        settingsText.setOrigin(0.5);
        
        settingsButton.on('pointerdown', () => {
            if (!this.settingsUI) {
                this.settingsUI = new SettingsUI(this);
            }
            this.settingsUI.show();
        });
    }
}
```

### In-Game Settings Access
```javascript
// In GameScene.js
class GameScene extends Phaser.Scene {
    create() {
        // ... existing game code ...
        
        // ESC key for settings
        this.input.keyboard.on('keydown-ESC', () => {
            if (!this.settingsUI) {
                this.settingsUI = new SettingsUI(this);
            }
            
            if (this.settingsUI.isVisible) {
                this.settingsUI.hide();
            } else {
                this.settingsUI.show();
            }
        });
        
        // Settings button in pause menu
        this.createPauseMenu();
    }
}
```

### Game Initialization with Settings
```javascript
// When starting a new game
function startNewGame() {
    // Apply pending game settings
    SettingsManager.applyPendingGameSettings();
    
    const gameSettings = SettingsManager.currentSettings.gameSettings;
    
    // Initialize game with current settings
    const gameConfig = {
        mapSize: gameSettings.mapSize,
        difficulty: gameSettings.difficulty,
        playerCount: gameSettings.playerCount,
        gameSpeed: gameSettings.gameSpeed
    };
    
    // Start game with these settings
    GameManager.initializeNewGame(gameConfig);
}
```

### Audio System Integration
```javascript
class AudioManager {
    static toggleMusic(enabled) {
        if (enabled) {
            if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
                this.backgroundMusic.resume();
            }
        } else {
            if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
                this.backgroundMusic.pause();
            }
        }
    }
    
    static setMusicVolume(volume) {
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(volume);
        }
    }
    
    static toggleSoundEffects(enabled) {
        this.soundEffectsEnabled = enabled;
    }
    
    static setSoundEffectsVolume(volume) {
        this.soundEffectsVolume = volume;
        
        // Update all active sound effects
        this.activeSounds.forEach(sound => {
            sound.setVolume(volume);
        });
    }
    
    static playSound(soundKey, config = {}) {
        if (!this.soundEffectsEnabled) return;
        
        const volume = (config.volume || 1.0) * this.soundEffectsVolume;
        const sound = this.scene.sound.add(soundKey, { volume });
        sound.play();
        
        return sound;
    }
}
```

## Keyboard Shortcuts
```javascript
class SettingsKeyboardHandler {
    constructor(scene) {
        this.scene = scene;
        this.setupKeyboardShortcuts();
    }
    
    setupKeyboardShortcuts() {
        // ESC - Toggle settings
        this.scene.input.keyboard.on('keydown-ESC', () => {
            SettingsUI.toggle();
        });
        
        // F1 - Quick help
        this.scene.input.keyboard.on('keydown-F1', () => {
            HelpUI.show();
        });
        
        // M - Toggle music quickly
        this.scene.input.keyboard.on('keydown-M', () => {
            const current = SettingsManager.currentSettings.audio.musicEnabled;
            SettingsManager.applyImmediateSettings('musicEnabled', !current);
        });
        
        // S - Toggle sound effects quickly
        this.scene.input.keyboard.on('keydown-S', () => {
            const current = SettingsManager.currentSettings.audio.soundEffectsEnabled;
            SettingsManager.applyImmediateSettings('soundEffectsEnabled', !current);
        });
    }
}
```

## Settings Persistence and Validation
```javascript
class SettingsValidator {
    static validateMapSize(size) {
        const validSizes = [32, 64, 128, 256];
        return validSizes.includes(size) ? size : 64;
    }
    
    static validateDifficulty(difficulty) {
        const validDifficulties = ['easy', 'normal', 'hard'];
        return validDifficulties.includes(difficulty) ? difficulty : 'normal';
    }
    
    static validatePlayerCount(count) {
        return Math.max(2, Math.min(8, count));
    }
    
    static validateVolume(volume) {
        return Math.max(0.0, Math.min(1.0, volume));
    }
    
    static validateAllSettings(settings) {
        return {
            audio: {
                musicEnabled: Boolean(settings.audio.musicEnabled),
                musicVolume: this.validateVolume(settings.audio.musicVolume),
                soundEffectsEnabled: Boolean(settings.audio.soundEffectsEnabled),
                soundEffectsVolume: this.validateVolume(settings.audio.soundEffectsVolume)
            },
            gameSettings: {
                mapSize: this.validateMapSize(settings.gameSettings.mapSize),
                difficulty: this.validateDifficulty(settings.gameSettings.difficulty),
                playerCount: this.validatePlayerCount(settings.gameSettings.playerCount),
                gameSpeed: Math.max(0.5, Math.min(2.0, settings.gameSettings.gameSpeed))
            },
            ui: {
                showNotifications: Boolean(settings.ui.showNotifications),
                showMinimap: Boolean(settings.ui.showMinimap),
                autoSave: Boolean(settings.ui.autoSave)
            }
        };
    }
}
```

## Implementation Checklist

### Phase 1: Core Settings System
- [ ] Create SettingsManager class
- [ ] Implement settings persistence with localStorage
- [ ] Create basic settings validation
- [ ] Test immediate vs pending setting types

### Phase 2: UI Framework
- [ ] Create SettingsUI class with tabbed interface
- [ ] Implement toggle, slider, and dropdown controls
- [ ] Add entrance/exit animations
- [ ] Create responsive layout system

### Phase 3: Setting Controls
- [ ] Map size dropdown (32, 64, 128, 256)
- [ ] Difficulty dropdown (easy, normal, hard)
- [ ] Player count slider (2-8)
- [ ] Music toggle with immediate effect
- [ ] Volume sliders with real-time updates

### Phase 4: Integration
- [ ] Connect to AudioManager for immediate audio changes
- [ ] Integrate with game initialization for map/difficulty
- [ ] Add keyboard shortcuts (ESC, M, S)
- [ ] Test settings persistence across sessions

### Phase 5: Polish and Testing
- [ ] Add confirmation messages
- [ ] Implement reset to defaults
- [ ] Test all setting combinations
- [ ] Validate settings on load
- [ ] Add hover effects and visual feedback

This settings system provides comprehensive control over game preferences with clear separation between immediate effects (audio) and future game settings (map size, difficulty, player count).