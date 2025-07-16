import StorySystem from '../systems/StorySystem.js';
import PowerSystem from '../systems/PowerSystem.js';
import InventorySystem from '../systems/InventorySystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from './AudioManager.js';

/**
 * GameManager Plugin - Manages overall game state and coordinates systems
 */
export default class GameManager extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        this.storySystem = null;
        this.powerSystem = null;
        this.inventorySystem = null;
        this.saveSystem = null;
        this.audioManager = null;
        this.gameState = {
            initialized: false,
            currentScene: null,
            lastValidState: null,
            stateVersion: '1.0.0',
            debugMode: false,
            syncInProgress: false
        };
        this.stateValidators = new Map();
        this.sceneStates = new Map();
        this.debugTools = null;
        this.eventListeners = new Map();
        this.stateHistory = [];
        this.maxStateHistory = 10;
    }

    /**
     * Initialize the GameManager
     */
    init() {
        console.log('GameManager initialized');
        this.setupStateValidators();
        this.setupSceneStateTracking();
        this.initializeDebugTools();
    }

    /**
     * Start the GameManager and initialize systems
     */
    start() {
        console.log('GameManager started');
        this.initializeSystems();
    }

    /**
     * Initialize game systems
     */
    initializeSystems() {
        const gameWorldScene = this.game.scene.getScene('GameWorldScene');
        
        // Initialize AudioManager first (other systems may need it)
        this.audioManager = new AudioManager(gameWorldScene);
        
        // Initialize StorySystem
        this.storySystem = new StorySystem(gameWorldScene);
        
        // Initialize PowerSystem
        this.powerSystem = new PowerSystem(gameWorldScene);
        
        // Initialize InventorySystem
        this.inventorySystem = new InventorySystem(gameWorldScene);
        
        // Initialize SaveSystem
        this.saveSystem = new SaveSystem(gameWorldScene);
        
        // Set up integration between systems
        this.setupSystemIntegration();
        
        // Load story data
        this.loadStoryData();
        
        this.gameState.initialized = true;
        console.log('Game systems initialized');
    }

    /**
     * Set up integration between different game systems
     */
    setupSystemIntegration() {
        if (!this.storySystem || !this.powerSystem || !this.audioManager) return;

        // Listen for story events that should unlock powers
        this.storySystem.addEventListener('power_unlocked', (data) => {
            this.powerSystem.unlockPower(data.powerId, 'story_progression');
            // Play power unlock sound
            this.audioManager.playStoryEventSfx('power_unlock', data);
        });

        // Listen for power activations that might trigger story events
        this.powerSystem.addEventListener('power_activated', (data) => {
            // Check if power activation should trigger story events
            this.checkPowerStoryTriggers(data.powerId, data.context);
            // Play power activation sound
            this.audioManager.playCharacterActionSfx('power_use', data);
        });

        // Listen for story events to play appropriate audio
        this.storySystem.addEventListener('story_event_triggered', (data) => {
            if (data.type === 'dialogue') {
                this.audioManager.playStoryEventSfx('dialogue_start', data);
            } else if (data.type === 'checkpoint') {
                this.audioManager.playStoryEventSfx('checkpoint_reached', data);
            }
        });

        // Listen for inventory events
        if (this.inventorySystem) {
            this.inventorySystem.addEventListener('item_added', (data) => {
                this.audioManager.playStoryEventSfx('item_collect', data);
            });
        }

        console.log('System integration set up');
    }

    /**
     * Check if power activation should trigger story events
     * @param {string} powerId - ID of activated power
     * @param {Object} context - Activation context
     */
    checkPowerStoryTriggers(powerId, context) {
        // Define power-to-story mappings
        const powerStoryTriggers = {
            'telekinesis': 'first_telekinesis_use',
            'enhanced_vision': 'first_vision_use',
            'time_slow': 'first_time_manipulation',
            'phase_walk': 'first_phase_walk'
        };

        const storyEvent = powerStoryTriggers[powerId];
        if (storyEvent) {
            this.storySystem.triggerStoryEvent(storyEvent);
        }
    }

    /**
     * Load story data
     */
    async loadStoryData() {
        try {
            const success = await this.storySystem.loadStoryData('./src/assets/story/main-story.json');
            if (success) {
                console.log('Story data loaded successfully');
                // Trigger initial story event
                this.storySystem.triggerStoryEvent('game_start');
            } else {
                console.warn('Failed to load story data, using fallback');
            }
        } catch (error) {
            console.error('Error loading story data:', error);
        }
    }

    /**
     * Get the story system instance
     * @returns {StorySystem} - Story system instance
     */
    getStorySystem() {
        return this.storySystem;
    }

    /**
     * Get the power system instance
     * @returns {PowerSystem} - Power system instance
     */
    getPowerSystem() {
        return this.powerSystem;
    }

    /**
     * Get the inventory system instance
     * @returns {InventorySystem} - Inventory system instance
     */
    getInventorySystem() {
        return this.inventorySystem;
    }

    /**
     * Get the save system instance
     * @returns {SaveSystem} - Save system instance
     */
    getSaveSystem() {
        return this.saveSystem;
    }

    /**
     * Get the audio manager instance
     * @returns {AudioManager} - Audio manager instance
     */
    getAudioManager() {
        return this.audioManager;
    }

    /**
     * Save game state (manual save)
     * @param {number} slotIndex - Save slot index (optional)
     * @returns {boolean} - Success status
     */
    saveGame(slotIndex = 0) {
        if (!this.saveSystem) {
            console.warn('Cannot save game: SaveSystem not initialized');
            return false;
        }

        return this.saveSystem.manualSave(slotIndex);
    }

    /**
     * Load game state
     * @param {string} saveKey - Save key to load from (optional, defaults to auto_save)
     * @returns {boolean} - Success status
     */
    loadGame(saveKey = 'auto_save') {
        if (!this.saveSystem) {
            console.warn('Cannot load game: SaveSystem not initialized');
            return false;
        }

        return this.saveSystem.loadGame(saveKey);
    }

    /**
     * Get current game state
     * @returns {Object} - Current game state
     */
    getGameState() {
        return {
            ...this.gameState,
            story: this.storySystem ? this.storySystem.getStoryProgress() : null
        };
    }

    /**
     * Reset game to initial state
     */
    resetGame() {
        if (this.storySystem) {
            this.storySystem.resetStory();
        }
        
        if (this.powerSystem) {
            this.powerSystem.resetPowerSystem();
        }
        
        if (this.inventorySystem) {
            this.inventorySystem.resetInventory();
        }
        
        // Clear all save data using SaveSystem
        if (this.saveSystem) {
            const saves = this.saveSystem.getAvailableSaves();
            saves.forEach(save => {
                this.saveSystem.deleteSave(save.key);
            });
        }
        
        // Clear legacy save data
        localStorage.removeItem('rpg_save_data');
        localStorage.removeItem('save_count');
        localStorage.removeItem('game_start_time');
        
        console.log('Game reset to initial state');
    }

    /**
     * Get available save files
     * @returns {Array} - Array of save information
     */
    getAvailableSaves() {
        if (!this.saveSystem) {
            return [];
        }
        return this.saveSystem.getAvailableSaves();
    }

    /**
     * Delete a save file
     * @param {string} saveKey - Save key to delete
     * @returns {boolean} - Success status
     */
    deleteSave(saveKey) {
        if (!this.saveSystem) {
            return false;
        }
        return this.saveSystem.deleteSave(saveKey);
    }

    /**
     * Check if auto-save is enabled
     * @returns {boolean} - Auto-save status
     */
    isAutoSaveEnabled() {
        if (!this.saveSystem) {
            return false;
        }
        return this.saveSystem.isAutoSaveEnabled();
    }

    /**
     * Enable or disable auto-save
     * @param {boolean} enabled - Whether auto-save should be enabled
     */
    setAutoSaveEnabled(enabled) {
        if (this.saveSystem) {
            this.saveSystem.setAutoSaveEnabled(enabled);
        }
    }

    // ===== STATE VALIDATION AND ERROR RECOVERY =====

    /**
     * Set up state validators for different game systems
     */
    setupStateValidators() {
        // Story system validator
        this.stateValidators.set('story', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('currentCheckpoint') && 
                   state.hasOwnProperty('completedEvents') && 
                   Array.isArray(state.completedEvents);
        });

        // Power system validator
        this.stateValidators.set('power', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('unlockedPowers') && 
                   Array.isArray(state.unlockedPowers);
        });

        // Inventory system validator
        this.stateValidators.set('inventory', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('items') && 
                   Array.isArray(state.items) &&
                   typeof state.maxCapacity === 'number';
        });

        // Player state validator
        this.stateValidators.set('player', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('position') && 
                   state.position.hasOwnProperty('x') && 
                   state.position.hasOwnProperty('y') &&
                   typeof state.health === 'number';
        });

        console.log('State validators initialized');
    }

    /**
     * Validate game state using registered validators
     * @param {Object} gameState - Game state to validate
     * @returns {Object} - Validation result with details
     */
    validateGameState(gameState) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!gameState || typeof gameState !== 'object') {
            result.isValid = false;
            result.errors.push('Game state is not a valid object');
            return result;
        }

        // Validate each system's state
        for (const [systemName, validator] of this.stateValidators) {
            const systemState = gameState[systemName];
            
            if (systemState === undefined) {
                result.warnings.push(`${systemName} state is missing`);
                continue;
            }

            try {
                if (!validator(systemState)) {
                    result.isValid = false;
                    result.errors.push(`${systemName} state validation failed`);
                }
            } catch (error) {
                result.isValid = false;
                result.errors.push(`${systemName} state validation error: ${error.message}`);
            }
        }

        // Validate state version compatibility
        if (gameState.version && gameState.version !== this.gameState.stateVersion) {
            result.warnings.push(`State version mismatch: expected ${this.gameState.stateVersion}, got ${gameState.version}`);
        }

        return result;
    }

    /**
     * Attempt to recover from invalid game state
     * @param {Object} invalidState - The invalid state to recover from
     * @returns {Object|null} - Recovered state or null if recovery failed
     */
    recoverGameState(invalidState) {
        console.warn('Attempting game state recovery...');
        
        try {
            // Try to use last valid state if available
            if (this.gameState.lastValidState) {
                console.log('Using last valid state for recovery');
                return this.gameState.lastValidState;
            }

            // Try to recover from state history
            for (let i = this.stateHistory.length - 1; i >= 0; i--) {
                const historicalState = this.stateHistory[i];
                const validation = this.validateGameState(historicalState);
                
                if (validation.isValid) {
                    console.log(`Recovered state from history (${i} steps back)`);
                    return historicalState;
                }
            }

            // Create minimal valid state as last resort
            console.log('Creating minimal valid state');
            return this.createMinimalValidState();
        } catch (error) {
            console.error('State recovery failed:', error);
            return null;
        }
    }

    /**
     * Create a minimal valid game state
     * @returns {Object} - Minimal valid state
     */
    createMinimalValidState() {
        return {
            version: this.gameState.stateVersion,
            story: {
                currentCheckpoint: 'game_start',
                completedEvents: [],
                unlockedPowers: [],
                storyFlags: {}
            },
            power: {
                unlockedPowers: [],
                activePowers: []
            },
            inventory: {
                items: [],
                maxCapacity: 20
            },
            player: {
                position: { x: 400, y: 300 },
                health: 100,
                facingDirection: 'down'
            },
            world: {
                currentMap: 'main_world',
                visitedAreas: ['starting_area']
            }
        };
    }

    /**
     * Store current state as valid backup
     */
    storeValidState() {
        try {
            const currentState = this.getCurrentCompleteState();
            const validation = this.validateGameState(currentState);
            
            if (validation.isValid) {
                this.gameState.lastValidState = JSON.parse(JSON.stringify(currentState));
                
                // Add to state history
                this.stateHistory.push(JSON.parse(JSON.stringify(currentState)));
                
                // Limit history size
                if (this.stateHistory.length > this.maxStateHistory) {
                    this.stateHistory.shift();
                }
                
                if (this.gameState.debugMode) {
                    console.log('Valid state stored');
                }
            }
        } catch (error) {
            console.error('Failed to store valid state:', error);
        }
    }

    // ===== SCENE STATE SYNCHRONIZATION =====

    /**
     * Set up scene state tracking
     */
    setupSceneStateTracking() {
        // Listen for scene transitions
        this.game.events.on('step', () => {
            this.updateCurrentScene();
        });

        // Set up scene-specific event listeners
        this.game.events.on('scene-transition', (data) => {
            this.handleSceneTransition(data.from, data.to);
        });

        console.log('Scene state tracking initialized');
    }

    /**
     * Update current scene tracking
     */
    updateCurrentScene() {
        const activeScenes = this.game.scene.getScenes(true);
        const currentScene = activeScenes.length > 0 ? activeScenes[0].scene.key : null;
        
        if (currentScene !== this.gameState.currentScene) {
            const previousScene = this.gameState.currentScene;
            this.gameState.currentScene = currentScene;
            
            if (previousScene && currentScene) {
                this.synchronizeSceneStates(previousScene, currentScene);
            }
        }
    }

    /**
     * Handle scene transitions and state synchronization
     * @param {string} fromScene - Scene being left
     * @param {string} toScene - Scene being entered
     */
    handleSceneTransition(fromScene, toScene) {
        console.log(`Scene transition: ${fromScene} -> ${toScene}`);
        
        // Handle audio scene transition
        if (this.audioManager) {
            this.audioManager.handleSceneTransition(fromScene, toScene);
        }
        
        // Store state from the scene being left
        this.captureSceneState(fromScene);
        
        // Synchronize state to the scene being entered
        this.synchronizeSceneStates(fromScene, toScene);
        
        // Store valid state after successful transition
        this.storeValidState();
    }

    /**
     * Capture state from a specific scene
     * @param {string} sceneKey - Key of the scene to capture state from
     */
    captureSceneState(sceneKey) {
        const scene = this.game.scene.getScene(sceneKey);
        if (!scene) return;

        const sceneState = {
            timestamp: Date.now(),
            sceneKey: sceneKey,
            data: {}
        };

        // Capture scene-specific data
        switch (sceneKey) {
            case 'GameWorldScene':
                if (scene.player) {
                    sceneState.data.playerPosition = {
                        x: scene.player.x || scene.player.sprite?.x,
                        y: scene.player.y || scene.player.sprite?.y
                    };
                    sceneState.data.playerHealth = scene.player.health;
                }
                break;
            case 'InventoryScene':
                sceneState.data.selectedSlot = scene.selectedSlot;
                break;
            case 'DialogueScene':
                sceneState.data.currentDialogue = scene.currentDialogue;
                break;
        }

        this.sceneStates.set(sceneKey, sceneState);
        
        if (this.gameState.debugMode) {
            console.log(`Captured state for scene: ${sceneKey}`, sceneState.data);
        }
    }

    /**
     * Synchronize state between scenes
     * @param {string} fromScene - Source scene
     * @param {string} toScene - Target scene
     */
    synchronizeSceneStates(fromScene, toScene) {
        if (this.gameState.syncInProgress) {
            console.warn('Scene synchronization already in progress');
            return;
        }

        this.gameState.syncInProgress = true;

        try {
            // Get current complete game state
            const gameState = this.getCurrentCompleteState();
            
            // Validate state before synchronization
            const validation = this.validateGameState(gameState);
            if (!validation.isValid) {
                console.error('Cannot synchronize invalid state:', validation.errors);
                
                // Attempt recovery
                const recoveredState = this.recoverGameState(gameState);
                if (recoveredState) {
                    this.applyGameState(recoveredState);
                } else {
                    console.error('State recovery failed during synchronization');
                }
                return;
            }

            // Apply state to target scene
            this.applyStateToScene(toScene, gameState);
            
            // Emit synchronization event
            this.game.events.emit('state-synchronized', {
                from: fromScene,
                to: toScene,
                timestamp: Date.now()
            });

            if (this.gameState.debugMode) {
                console.log(`State synchronized: ${fromScene} -> ${toScene}`);
            }
        } catch (error) {
            console.error('Scene state synchronization failed:', error);
        } finally {
            this.gameState.syncInProgress = false;
        }
    }

    /**
     * Apply game state to a specific scene
     * @param {string} sceneKey - Target scene key
     * @param {Object} gameState - Game state to apply
     */
    applyStateToScene(sceneKey, gameState) {
        const scene = this.game.scene.getScene(sceneKey);
        if (!scene) return;

        try {
            switch (sceneKey) {
                case 'GameWorldScene':
                    if (gameState.player && scene.player) {
                        if (gameState.player.position) {
                            scene.player.setPosition(gameState.player.position.x, gameState.player.position.y);
                        }
                        if (gameState.player.health !== undefined) {
                            scene.player.health = gameState.player.health;
                        }
                    }
                    break;
                case 'MainMenuScene':
                    // Update menu based on available saves
                    break;
            }
        } catch (error) {
            console.error(`Failed to apply state to scene ${sceneKey}:`, error);
        }
    }

    /**
     * Get current complete game state from all systems
     * @returns {Object} - Complete current game state
     */
    getCurrentCompleteState() {
        const state = {
            version: this.gameState.stateVersion,
            timestamp: Date.now(),
            currentScene: this.gameState.currentScene
        };

        // Gather state from all systems
        if (this.storySystem) {
            state.story = this.storySystem.getStoryState ? this.storySystem.getStoryState() : null;
        }

        if (this.powerSystem) {
            state.power = this.powerSystem.getPowerSystemState ? this.powerSystem.getPowerSystemState() : null;
        }

        if (this.inventorySystem) {
            state.inventory = this.inventorySystem.getInventoryState ? this.inventorySystem.getInventoryState() : null;
        }

        // Get player state from current scene
        const gameWorldScene = this.game.scene.getScene('GameWorldScene');
        if (gameWorldScene && gameWorldScene.player) {
            state.player = {
                position: {
                    x: gameWorldScene.player.x || gameWorldScene.player.sprite?.x || 400,
                    y: gameWorldScene.player.y || gameWorldScene.player.sprite?.y || 300
                },
                health: gameWorldScene.player.health || 100,
                facingDirection: gameWorldScene.player.facingDirection || 'down'
            };
        }

        state.world = {
            currentMap: 'main_world',
            visitedAreas: ['starting_area']
        };

        return state;
    }

    /**
     * Apply complete game state to all systems
     * @param {Object} gameState - Game state to apply
     */
    applyGameState(gameState) {
        try {
            // Apply to story system
            if (gameState.story && this.storySystem && this.storySystem.loadStoryState) {
                this.storySystem.loadStoryState(gameState.story);
            }

            // Apply to power system
            if (gameState.power && this.powerSystem && this.powerSystem.loadPowerSystemState) {
                this.powerSystem.loadPowerSystemState(gameState.power);
            }

            // Apply to inventory system
            if (gameState.inventory && this.inventorySystem && this.inventorySystem.loadInventoryState) {
                this.inventorySystem.loadInventoryState(gameState.inventory);
            }

            // Apply to current scene
            if (this.gameState.currentScene) {
                this.applyStateToScene(this.gameState.currentScene, gameState);
            }

            console.log('Game state applied successfully');
        } catch (error) {
            console.error('Failed to apply game state:', error);
        }
    }

    // ===== DEBUG TOOLS =====

    /**
     * Initialize debugging tools for development
     */
    initializeDebugTools() {
        // Enable debug mode if in development
        this.gameState.debugMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

        if (this.gameState.debugMode) {
            this.debugTools = {
                stateInspector: this.createStateInspector(),
                stateHistory: this.stateHistory,
                validators: this.stateValidators
            };

            // Add debug commands to window for console access
            window.gameDebug = {
                getState: () => this.getCurrentCompleteState(),
                validateState: (state) => this.validateGameState(state || this.getCurrentCompleteState()),
                recoverState: () => this.recoverGameState(this.getCurrentCompleteState()),
                getHistory: () => this.stateHistory,
                clearHistory: () => { this.stateHistory = []; },
                toggleDebug: () => { this.gameState.debugMode = !this.gameState.debugMode; },
                getSceneStates: () => Object.fromEntries(this.sceneStates),
                forceSync: () => this.synchronizeSceneStates(this.gameState.currentScene, this.gameState.currentScene),
                resetToMinimal: () => this.applyGameState(this.createMinimalValidState())
            };

            console.log('Debug tools initialized. Use window.gameDebug for debugging.');
        }
    }

    /**
     * Create state inspector for debugging
     * @returns {Object} - State inspector object
     */
    createStateInspector() {
        return {
            inspect: (state) => {
                const inspection = {
                    timestamp: Date.now(),
                    state: state || this.getCurrentCompleteState(),
                    validation: null,
                    size: 0,
                    systems: []
                };

                inspection.validation = this.validateGameState(inspection.state);
                inspection.size = JSON.stringify(inspection.state).length;
                inspection.systems = Object.keys(inspection.state).filter(key => 
                    ['story', 'power', 'inventory', 'player', 'world'].includes(key)
                );

                return inspection;
            },
            
            compare: (state1, state2) => {
                const differences = [];
                
                const compareObjects = (obj1, obj2, path = '') => {
                    for (const key in obj1) {
                        const currentPath = path ? `${path}.${key}` : key;
                        
                        if (!(key in obj2)) {
                            differences.push({ path: currentPath, type: 'missing', value: obj1[key] });
                        } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
                            compareObjects(obj1[key], obj2[key], currentPath);
                        } else if (obj1[key] !== obj2[key]) {
                            differences.push({ 
                                path: currentPath, 
                                type: 'changed', 
                                oldValue: obj2[key], 
                                newValue: obj1[key] 
                            });
                        }
                    }
                };

                compareObjects(state1, state2);
                return differences;
            }
        };
    }

    /**
     * Get debug information
     * @returns {Object} - Debug information
     */
    getDebugInfo() {
        return {
            gameState: this.gameState,
            stateHistory: this.stateHistory.length,
            sceneStates: this.sceneStates.size,
            validators: Array.from(this.stateValidators.keys()),
            currentState: this.getCurrentCompleteState(),
            validation: this.validateGameState(this.getCurrentCompleteState())
        };
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.gameState.debugMode = enabled;
        console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
}