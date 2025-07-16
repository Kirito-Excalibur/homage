/**
 * StorySystem - Manages narrative progression, story events, and branching storylines
 * Handles story data loading, event triggering, progress tracking, and flag management
 */
export default class StorySystem {
    constructor(scene = null) {
        this.scene = scene;
        this.storyData = null;
        this.currentCheckpoint = 'game_start';
        this.completedEvents = new Set();
        this.storyFlags = new Map();
        this.unlockedPowers = new Set();
        this.eventListeners = new Map();
        
        // Initialize with default story state
        this.initializeStoryState();
    }

    /**
     * Initialize default story state
     */
    initializeStoryState() {
        this.storyFlags.set('game_started', false);
        this.storyFlags.set('first_dialogue_seen', false);
        this.storyFlags.set('tutorial_completed', false);
    }

    /**
     * Load story data from JSON file
     * @param {string} storyFile - Path to the story JSON file
     * @returns {Promise<boolean>} - Success status
     */
    async loadStoryData(storyFile) {
        try {
            const response = await fetch(storyFile);
            if (!response.ok) {
                throw new Error(`Failed to load story data: ${response.status}`);
            }
            
            this.storyData = await response.json();
            
            // Validate story data structure
            if (!this.validateStoryData(this.storyData)) {
                throw new Error('Invalid story data structure');
            }
            
            console.log('Story data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading story data:', error);
            // Load fallback story data
            this.loadFallbackStoryData();
            return false;
        }
    }

    /**
     * Validate story data structure
     * @param {Object} data - Story data to validate
     * @returns {boolean} - Validation result
     */
    validateStoryData(data) {
        return data && 
               data.events && 
               Array.isArray(data.events) &&
               data.checkpoints &&
               typeof data.checkpoints === 'object';
    }

    /**
     * Load fallback story data when main data fails
     */
    loadFallbackStoryData() {
        this.storyData = {
            events: [
                {
                    id: 'game_start',
                    type: 'dialogue',
                    triggers: [],
                    content: {
                        text: 'Welcome to your adventure!',
                        speaker: 'Narrator',
                        nextEvent: null
                    }
                }
            ],
            checkpoints: {
                'game_start': {
                    id: 'game_start',
                    name: 'Beginning',
                    description: 'The start of your journey'
                }
            }
        };
        console.log('Fallback story data loaded');
    }

    /**
     * Trigger a story event by ID
     * @param {string} eventId - ID of the event to trigger
     * @returns {Object|null} - Event data or null if not found/conditions not met
     */
    triggerStoryEvent(eventId) {
        if (!this.storyData || !this.storyData.events) {
            console.warn('No story data available');
            return null;
        }

        const event = this.storyData.events.find(e => e.id === eventId);
        if (!event) {
            console.warn(`Story event not found: ${eventId}`);
            return null;
        }

        // Check if event conditions are met
        if (!this.checkStoryConditions(event.triggers || [])) {
            console.log(`Story event conditions not met: ${eventId}`);
            return null;
        }

        // Mark event as completed
        this.completedEvents.add(eventId);
        
        // Process event effects
        this.processEventEffects(event);
        
        // Emit event for listeners
        this.emitStoryEvent(eventId, event);
        this.emitStoryEvent('story_event_triggered', event);
        
        console.log(`Story event triggered: ${eventId}`);
        return event;
    }

    /**
     * Check if story conditions are met
     * @param {Array} conditions - Array of condition objects
     * @returns {boolean} - Whether all conditions are met
     */
    checkStoryConditions(conditions) {
        if (!conditions || conditions.length === 0) {
            return true;
        }

        return conditions.every(condition => {
            switch (condition.type) {
                case 'flag':
                    return this.storyFlags.get(condition.flag) === condition.value;
                case 'event_completed':
                    return this.completedEvents.has(condition.eventId);
                case 'power_unlocked':
                    return this.unlockedPowers.has(condition.powerId);
                case 'checkpoint_reached':
                    return this.hasReachedCheckpoint(condition.checkpointId);
                default:
                    console.warn(`Unknown condition type: ${condition.type}`);
                    return false;
            }
        });
    }

    /**
     * Process event effects (power unlocks, flag changes, etc.)
     * @param {Object} event - Event object
     */
    processEventEffects(event) {
        if (!event.effects) return;

        event.effects.forEach(effect => {
            switch (effect.type) {
                case 'unlock_power':
                    this.unlockPower(effect.powerId);
                    break;
                case 'set_flag':
                    this.setStoryFlag(effect.flag, effect.value);
                    break;
                case 'set_checkpoint':
                    this.setCheckpoint(effect.checkpointId);
                    break;
                default:
                    console.warn(`Unknown effect type: ${effect.type}`);
            }
        });
    }

    /**
     * Set story progress to a specific checkpoint
     * @param {string} checkpointId - ID of the checkpoint
     */
    setCheckpoint(checkpointId) {
        if (!this.storyData || !this.storyData.checkpoints || !this.storyData.checkpoints[checkpointId]) {
            console.warn(`Invalid checkpoint: ${checkpointId}`);
            return;
        }

        this.currentCheckpoint = checkpointId;
        console.log(`Checkpoint set: ${checkpointId}`);
        
        // Emit checkpoint event
        this.emitStoryEvent('checkpoint_reached', { checkpointId });
    }

    /**
     * Check if a checkpoint has been reached
     * @param {string} checkpointId - ID of the checkpoint to check
     * @returns {boolean} - Whether checkpoint has been reached
     */
    hasReachedCheckpoint(checkpointId) {
        if (!this.storyData || !this.storyData.checkpoints) {
            return false;
        }

        // Simple implementation: check if current checkpoint is the same or later
        // In a more complex system, you'd have checkpoint ordering
        return this.currentCheckpoint === checkpointId || this.completedEvents.has(`checkpoint_${checkpointId}`);
    }

    /**
     * Get current checkpoint information
     * @returns {Object|null} - Current checkpoint data
     */
    getCurrentCheckpoint() {
        if (!this.storyData || !this.storyData.checkpoints) {
            return null;
        }
        return this.storyData.checkpoints[this.currentCheckpoint] || null;
    }

    /**
     * Set a story flag value
     * @param {string} flag - Flag name
     * @param {*} value - Flag value
     */
    setStoryFlag(flag, value) {
        const oldValue = this.storyFlags.get(flag);
        this.storyFlags.set(flag, value);
        
        console.log(`Story flag set: ${flag} = ${value} (was: ${oldValue})`);
        
        // Emit flag change event
        this.emitStoryEvent('flag_changed', { flag, value, oldValue });
    }

    /**
     * Get a story flag value
     * @param {string} flag - Flag name
     * @returns {*} - Flag value
     */
    getStoryFlag(flag) {
        return this.storyFlags.get(flag);
    }

    /**
     * Check if a story flag has a specific value
     * @param {string} flag - Flag name
     * @param {*} value - Expected value
     * @returns {boolean} - Whether flag matches value
     */
    checkStoryFlag(flag, value) {
        return this.storyFlags.get(flag) === value;
    }

    /**
     * Unlock a power through story progression
     * @param {string} powerId - ID of the power to unlock
     */
    unlockPower(powerId) {
        if (this.unlockedPowers.has(powerId)) {
            console.log(`Power already unlocked: ${powerId}`);
            return;
        }

        this.unlockedPowers.add(powerId);
        console.log(`Power unlocked: ${powerId}`);
        
        // Emit power unlock event
        this.emitStoryEvent('power_unlocked', { powerId });
    }

    /**
     * Check if a power is unlocked
     * @param {string} powerId - ID of the power to check
     * @returns {boolean} - Whether power is unlocked
     */
    isPowerUnlocked(powerId) {
        return this.unlockedPowers.has(powerId);
    }

    /**
     * Get all unlocked powers
     * @returns {Array<string>} - Array of unlocked power IDs
     */
    getUnlockedPowers() {
        return Array.from(this.unlockedPowers);
    }

    /**
     * Add event listener for story events
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Callback function
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} eventType - Type of event
     * @param {Function} callback - Callback function to remove
     */
    removeEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) return;
        
        const listeners = this.eventListeners.get(eventType);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emit story event to listeners
     * @param {string} eventType - Type of event
     * @param {*} data - Event data
     */
    emitStoryEvent(eventType, data) {
        if (!this.eventListeners.has(eventType)) return;
        
        this.eventListeners.get(eventType).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in story event listener for ${eventType}:`, error);
            }
        });
    }

    /**
     * Get current story state for saving
     * @returns {Object} - Serializable story state
     */
    getStoryState() {
        return {
            currentCheckpoint: this.currentCheckpoint,
            completedEvents: Array.from(this.completedEvents),
            storyFlags: Object.fromEntries(this.storyFlags),
            unlockedPowers: Array.from(this.unlockedPowers)
        };
    }

    /**
     * Load story state from save data
     * @param {Object} storyState - Story state to load
     */
    loadStoryState(storyState) {
        if (!storyState) return;

        this.currentCheckpoint = storyState.currentCheckpoint || 'game_start';
        this.completedEvents = new Set(storyState.completedEvents || []);
        this.storyFlags = new Map(Object.entries(storyState.storyFlags || {}));
        this.unlockedPowers = new Set(storyState.unlockedPowers || []);
        
        console.log('Story state loaded');
    }

    /**
     * Reset story to initial state
     */
    resetStory() {
        this.currentCheckpoint = 'game_start';
        this.completedEvents.clear();
        this.storyFlags.clear();
        this.unlockedPowers.clear();
        this.initializeStoryState();
        
        console.log('Story reset to initial state');
    }

    /**
     * Get story progress information
     * @returns {Object} - Progress information
     */
    getStoryProgress() {
        const totalEvents = this.storyData ? this.storyData.events.length : 0;
        const completedCount = this.completedEvents.size;
        
        return {
            currentCheckpoint: this.currentCheckpoint,
            completedEvents: completedCount,
            totalEvents: totalEvents,
            progressPercentage: totalEvents > 0 ? (completedCount / totalEvents) * 100 : 0,
            unlockedPowers: this.getUnlockedPowers().length
        };
    }
}