/**
 * SaveSystem - Manages game state persistence using Phaser's data manager and LocalStorage
 * Handles automatic saving at story checkpoints, manual saves, and load functionality
 */
export default class SaveSystem {
    constructor(scene = null) {
        this.scene = scene;
        this.gameManager = null;
        this.autoSaveEnabled = true;
        this.saveSlots = 3; // Number of save slots available
        this.currentSaveSlot = 0;
        
        // Initialize save system
        this.initializeSaveSystem();
    }

    /**
     * Initialize the save system
     */
    initializeSaveSystem() {
        // Skip initialization if no scene is available yet
        if (!this.scene || !this.scene.plugins) {
            console.log('SaveSystem: Scene not available, deferring initialization');
            return;
        }

        // Get GameManager reference
        this.gameManager = this.scene.plugins.get('GameManager');
        
        if (!this.gameManager) {
            console.warn('GameManager not found - save system may not function properly');
            return;
        }

        // Set up automatic saving on story checkpoints
        this.setupAutoSave();
        
        console.log('SaveSystem initialized');
    }

    /**
     * Set up automatic saving on story checkpoints
     */
    setupAutoSave() {
        if (!this.gameManager) {
            // Retry setup after a delay if GameManager isn't ready
            setTimeout(() => this.setupAutoSave(), 100);
            return;
        }

        const storySystem = this.gameManager.getStorySystem();
        if (!storySystem) {
            // Retry setup after a delay if StorySystem isn't ready
            setTimeout(() => this.setupAutoSave(), 100);
            return;
        }
        
        // Listen for checkpoint events
        storySystem.addEventListener('checkpoint_reached', (data) => {
            if (this.autoSaveEnabled) {
                this.autoSave(data.checkpointId);
            }
        });

        // Listen for significant story events
        storySystem.addEventListener('power_unlocked', () => {
            if (this.autoSaveEnabled) {
                this.autoSave('power_unlock');
            }
        });

        console.log('Auto-save event listeners set up');
    }

    /**
     * Perform automatic save at story checkpoints
     * @param {string} trigger - What triggered the auto-save
     */
    autoSave(trigger) {
        try {
            const saveData = this.createSaveData();
            if (!saveData) {
                console.warn('Failed to create save data for auto-save');
                return;
            }

            saveData.saveType = 'auto';
            saveData.trigger = trigger;
            
            const success = this.saveToPersistentStorage('auto_save', saveData);
            if (success) {
                console.log(`Auto-save completed (trigger: ${trigger})`);
                this.showSaveNotification('Game auto-saved');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    /**
     * Perform manual save
     * @param {number} slotIndex - Save slot index (0-2)
     * @returns {boolean} - Success status
     */
    manualSave(slotIndex = this.currentSaveSlot) {
        if (slotIndex < 0 || slotIndex >= this.saveSlots) {
            console.error(`Invalid save slot: ${slotIndex}`);
            return false;
        }

        try {
            const saveData = this.createSaveData();
            if (!saveData) {
                console.warn('Failed to create save data for manual save');
                return false;
            }

            saveData.saveType = 'manual';
            saveData.slotIndex = slotIndex;
            
            const success = this.saveToPersistentStorage(`manual_save_${slotIndex}`, saveData);
            if (success) {
                console.log(`Manual save completed (slot ${slotIndex})`);
                this.showSaveConfirmation(slotIndex);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Manual save failed:', error);
            return false;
        }
    }

    /**
     * Create save data from current game state
     * @returns {Object|null} - Save data object or null if failed
     */
    createSaveData() {
        if (!this.gameManager) {
            console.error('GameManager not available for save data creation');
            return null;
        }

        try {
            // Use GameManager's getCurrentCompleteState for consistent state gathering
            const gameState = this.gameManager.getCurrentCompleteState();
            
            // Validate the state before creating save data
            const validation = this.gameManager.validateGameState(gameState);
            if (!validation.isValid) {
                console.error('Cannot create save data from invalid state:', validation.errors);
                
                // Attempt to use last valid state
                const recoveredState = this.gameManager.recoverGameState(gameState);
                if (!recoveredState) {
                    console.error('State recovery failed during save creation');
                    return null;
                }
                gameState = recoveredState;
            }

            const storySystem = this.gameManager.getStorySystem();
            const saveData = {
                version: gameState.version || '1.0.0',
                timestamp: Date.now(),
                gameState: gameState,
                metadata: {
                    playTime: this.calculatePlayTime(),
                    saveCount: this.getSaveCount() + 1,
                    lastCheckpoint: storySystem ? storySystem.getCurrentCheckpoint() : null,
                    currentScene: gameState.currentScene
                }
            };

            // Store this as a valid state in GameManager
            this.gameManager.storeValidState();

            return saveData;
        } catch (error) {
            console.error('Error creating save data:', error);
            return null;
        }
    }

    /**
     * Get current player state
     * @returns {Object} - Player state data
     */
    getPlayerState() {
        // Get player data from GameWorldScene if available
        const gameWorldScene = this.scene.scene.get('GameWorldScene');
        if (gameWorldScene && gameWorldScene.player) {
            return {
                position: {
                    x: gameWorldScene.player.x,
                    y: gameWorldScene.player.y
                },
                health: gameWorldScene.player.health || 100,
                facingDirection: gameWorldScene.player.facingDirection || 'down'
            };
        }
        
        return {
            position: { x: 400, y: 300 },
            health: 100,
            facingDirection: 'down'
        };
    }

    /**
     * Get current world state
     * @returns {Object} - World state data
     */
    getWorldState() {
        return {
            currentMap: 'main_world',
            visitedAreas: ['starting_area']
        };
    }

    /**
     * Calculate total play time
     * @returns {number} - Play time in milliseconds
     */
    calculatePlayTime() {
        // Simple implementation - in a real game you'd track this more accurately
        const startTime = localStorage.getItem('game_start_time');
        if (startTime) {
            return Date.now() - parseInt(startTime);
        }
        return 0;
    }

    /**
     * Get current save count
     * @returns {number} - Number of saves performed
     */
    getSaveCount() {
        const count = localStorage.getItem('save_count');
        return count ? parseInt(count) : 0;
    }

    /**
     * Save data to persistent storage
     * @param {string} key - Storage key
     * @param {Object} data - Data to save
     * @returns {boolean} - Success status
     */
    saveToPersistentStorage(key, data) {
        try {
            // Validate data before saving
            if (!this.validateSaveData(data)) {
                console.error('Save data validation failed');
                return false;
            }

            const serializedData = JSON.stringify(data);
            
            // Check storage space
            if (!this.checkStorageSpace(serializedData)) {
                console.error('Insufficient storage space');
                this.handleStorageSpaceError();
                return false;
            }

            // Save to localStorage
            localStorage.setItem(`rpg_${key}`, serializedData);
            
            // Update save count
            const saveCount = this.getSaveCount() + 1;
            localStorage.setItem('save_count', saveCount.toString());
            
            // Set game start time if not set
            if (!localStorage.getItem('game_start_time')) {
                localStorage.setItem('game_start_time', Date.now().toString());
            }

            return true;
        } catch (error) {
            console.error('Error saving to persistent storage:', error);
            this.handleSaveError(error);
            return false;
        }
    }

    /**
     * Validate save data structure
     * @param {Object} data - Data to validate
     * @returns {boolean} - Validation result
     */
    validateSaveData(data) {
        return data &&
               data.version &&
               data.timestamp &&
               data.gameState &&
               typeof data.gameState === 'object';
    }

    /**
     * Check if there's enough storage space
     * @param {string} data - Serialized data to check
     * @returns {boolean} - Whether there's enough space
     */
    checkStorageSpace(data) {
        try {
            // Estimate storage usage (rough calculation)
            const currentUsage = this.getStorageUsage();
            const dataSize = new Blob([data]).size;
            const availableSpace = 5 * 1024 * 1024; // Assume 5MB limit
            
            return (currentUsage + dataSize) < availableSpace;
        } catch (error) {
            console.warn('Could not check storage space:', error);
            return true; // Assume it's fine if we can't check
        }
    }

    /**
     * Get current storage usage
     * @returns {number} - Storage usage in bytes
     */
    getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('rpg_')) {
                total += localStorage[key].length;
            }
        }
        return total;
    }

    /**
     * Handle storage space error
     */
    handleStorageSpaceError() {
        console.warn('Storage space full - attempting cleanup');
        this.cleanupOldSaves();
    }

    /**
     * Clean up old save files to free space
     */
    cleanupOldSaves() {
        try {
            // Remove old auto-saves (keep only the most recent)
            const autoSaveKeys = [];
            for (let key in localStorage) {
                if (key.startsWith('rpg_auto_save_')) {
                    autoSaveKeys.push(key);
                }
            }
            
            // Sort by timestamp and remove older ones
            autoSaveKeys.sort((a, b) => {
                const dataA = JSON.parse(localStorage[a]);
                const dataB = JSON.parse(localStorage[b]);
                return dataB.timestamp - dataA.timestamp;
            });
            
            // Keep only the most recent auto-save
            for (let i = 1; i < autoSaveKeys.length; i++) {
                localStorage.removeItem(autoSaveKeys[i]);
            }
            
            console.log('Old saves cleaned up');
        } catch (error) {
            console.error('Error cleaning up saves:', error);
        }
    }

    /**
     * Handle save errors
     * @param {Error} error - The error that occurred
     */
    handleSaveError(error) {
        if (error.name === 'QuotaExceededError') {
            this.handleStorageSpaceError();
        } else {
            console.error('Unexpected save error:', error);
        }
    }

    /**
     * Load game from save data
     * @param {string} key - Storage key to load from
     * @returns {boolean} - Success status
     */
    loadGame(key = 'auto_save') {
        try {
            const saveKey = key.startsWith('rpg_') ? key : `rpg_${key}`;
            const savedData = localStorage.getItem(saveKey);
            
            if (!savedData) {
                console.log(`No save data found for key: ${key}`);
                return false;
            }

            const gameState = JSON.parse(savedData);
            
            // Validate loaded data
            if (!this.validateSaveData(gameState)) {
                console.error('Loaded save data is invalid');
                this.handleCorruptedSave(saveKey);
                return false;
            }

            // Check version compatibility
            if (!this.isVersionCompatible(gameState.version)) {
                console.warn('Save data version incompatible, attempting migration');
                const migrated = this.migrateSaveData(gameState);
                if (!migrated) {
                    return false;
                }
            }

            // Load game state into systems
            return this.loadGameState(gameState.gameState);
        } catch (error) {
            console.error('Error loading game:', error);
            this.handleCorruptedSave(`rpg_${key}`);
            return false;
        }
    }

    /**
     * Load game state into game systems
     * @param {Object} gameState - Game state to load
     * @returns {boolean} - Success status
     */
    loadGameState(gameState) {
        if (!this.gameManager) {
            console.error('GameManager not available for loading');
            return false;
        }

        try {
            // Validate game state before loading
            const validation = this.gameManager.validateGameState(gameState);
            if (!validation.isValid) {
                console.error('Cannot load invalid game state:', validation.errors);
                
                // Attempt state recovery
                const recoveredState = this.gameManager.recoverGameState(gameState);
                if (recoveredState) {
                    console.log('Using recovered state for loading');
                    gameState = recoveredState;
                } else {
                    console.error('State recovery failed during load');
                    return false;
                }
            }

            // Use GameManager's applyGameState method for consistent state application
            this.gameManager.applyGameState(gameState);

            console.log('Game state loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading game state:', error);
            return false;
        }
    }

    /**
     * Load player state
     * @param {Object} playerState - Player state to load
     */
    loadPlayerState(playerState) {
        const gameWorldScene = this.scene.scene.get('GameWorldScene');
        if (gameWorldScene && gameWorldScene.player && playerState.position) {
            gameWorldScene.player.setPosition(playerState.position.x, playerState.position.y);
            if (playerState.health !== undefined) {
                gameWorldScene.player.health = playerState.health;
            }
        }
    }

    /**
     * Check if save data version is compatible
     * @param {string} version - Save data version
     * @returns {boolean} - Compatibility status
     */
    isVersionCompatible(version) {
        // Simple version check - in a real game you'd have more sophisticated logic
        const currentVersion = '1.0.0';
        return version === currentVersion;
    }

    /**
     * Migrate save data to current version
     * @param {Object} saveData - Save data to migrate
     * @returns {boolean} - Migration success
     */
    migrateSaveData(saveData) {
        // Placeholder for save data migration logic
        console.log('Save data migration not implemented');
        return false;
    }

    /**
     * Handle corrupted save data
     * @param {string} saveKey - Key of corrupted save
     */
    handleCorruptedSave(saveKey) {
        console.error(`Corrupted save detected: ${saveKey}`);
        
        // Try to create a backup before removing
        try {
            const corruptedData = localStorage.getItem(saveKey);
            if (corruptedData) {
                localStorage.setItem(`${saveKey}_corrupted_backup`, corruptedData);
            }
        } catch (error) {
            console.error('Could not create backup of corrupted save:', error);
        }

        // Remove corrupted save
        localStorage.removeItem(saveKey);
        
        // Show error message to user
        this.showCorruptedSaveError();
    }

    /**
     * Get list of available saves
     * @returns {Array} - Array of save information
     */
    getAvailableSaves() {
        const saves = [];
        
        // Check for auto-save
        const autoSave = localStorage.getItem('rpg_auto_save');
        if (autoSave) {
            try {
                const data = JSON.parse(autoSave);
                saves.push({
                    type: 'auto',
                    key: 'auto_save',
                    timestamp: data.timestamp,
                    metadata: data.metadata
                });
            } catch (error) {
                console.warn('Invalid auto-save data');
            }
        }

        // Check for manual saves
        for (let i = 0; i < this.saveSlots; i++) {
            const manualSave = localStorage.getItem(`rpg_manual_save_${i}`);
            if (manualSave) {
                try {
                    const data = JSON.parse(manualSave);
                    saves.push({
                        type: 'manual',
                        slot: i,
                        key: `manual_save_${i}`,
                        timestamp: data.timestamp,
                        metadata: data.metadata
                    });
                } catch (error) {
                    console.warn(`Invalid manual save data for slot ${i}`);
                }
            }
        }

        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Delete a save file
     * @param {string} key - Save key to delete
     * @returns {boolean} - Success status
     */
    deleteSave(key) {
        try {
            const saveKey = key.startsWith('rpg_') ? key : `rpg_${key}`;
            localStorage.removeItem(saveKey);
            console.log(`Save deleted: ${key}`);
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            return false;
        }
    }

    /**
     * Show save notification
     * @param {string} message - Notification message
     */
    showSaveNotification(message) {
        // Simple console notification - in a real game you'd show UI notification
        console.log(`[SAVE NOTIFICATION] ${message}`);
        
        // Emit event for UI to handle
        if (this.scene && this.scene.events) {
            this.scene.events.emit('save_notification', message);
        }
    }

    /**
     * Show save confirmation
     * @param {number} slotIndex - Save slot index
     */
    showSaveConfirmation(slotIndex) {
        const message = `Game saved to slot ${slotIndex + 1}`;
        this.showSaveNotification(message);
    }

    /**
     * Show corrupted save error
     */
    showCorruptedSaveError() {
        const message = 'Save file corrupted and has been removed. Starting new game.';
        console.error(`[SAVE ERROR] ${message}`);
        
        if (this.scene && this.scene.events) {
            this.scene.events.emit('save_error', message);
        }
    }

    /**
     * Enable or disable auto-save
     * @param {boolean} enabled - Whether auto-save should be enabled
     */
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        console.log(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if auto-save is enabled
     * @returns {boolean} - Auto-save status
     */
    isAutoSaveEnabled() {
        return this.autoSaveEnabled;
    }

    /**
     * Get save system status
     * @returns {Object} - Status information
     */
    getStatus() {
        return {
            autoSaveEnabled: this.autoSaveEnabled,
            availableSaves: this.getAvailableSaves().length,
            storageUsage: this.getStorageUsage(),
            saveCount: this.getSaveCount()
        };
    }
}