/**
 * PowerSystem - Manages character abilities and their integration with story progression
 * Handles power unlocking, activation, cooldowns, and visual feedback
 */
export default class PowerSystem {
    constructor(scene) {
        this.scene = scene;
        this.powers = new Map();
        this.unlockedPowers = new Set();
        this.activePowers = new Map();
        this.cooldowns = new Map();
        this.eventListeners = new Map();
        
        // Initialize power definitions
        this.initializePowerDefinitions();
        
        // Set up input controls for power activation
        this.setupPowerControls();
        
        console.log('PowerSystem initialized');
    }

    /**
     * Initialize power definitions with their properties and effects
     */
    initializePowerDefinitions() {
        // Define available powers in the game
        const powerDefinitions = [
            {
                id: 'telekinesis',
                name: 'Telekinesis',
                description: 'Move objects with your mind',
                type: 'active',
                cooldown: 3000, // 3 seconds
                range: 64, // 2 tiles
                effects: [
                    { type: 'move_object', strength: 1 },
                    { type: 'visual_effect', effect: 'telekinesis_glow' }
                ],
                unlockCondition: 'first_power_unlock',
                activationKey: 'Q'
            },
            {
                id: 'enhanced_vision',
                name: 'Enhanced Vision',
                description: 'See hidden objects and secrets',
                type: 'toggle',
                cooldown: 0,
                range: 0,
                effects: [
                    { type: 'reveal_hidden', duration: -1 },
                    { type: 'visual_effect', effect: 'vision_overlay' }
                ],
                unlockCondition: 'vision_power_unlock',
                activationKey: 'E'
            },
            {
                id: 'time_slow',
                name: 'Time Slow',
                description: 'Slow down time around you',
                type: 'active',
                cooldown: 10000, // 10 seconds
                range: 0,
                effects: [
                    { type: 'time_manipulation', factor: 0.5, duration: 3000 },
                    { type: 'visual_effect', effect: 'time_distortion' }
                ],
                unlockCondition: 'time_power_unlock',
                activationKey: 'R'
            },
            {
                id: 'phase_walk',
                name: 'Phase Walk',
                description: 'Walk through certain obstacles',
                type: 'active',
                cooldown: 8000, // 8 seconds
                range: 0,
                effects: [
                    { type: 'phase_through', duration: 2000 },
                    { type: 'visual_effect', effect: 'phase_glow' }
                ],
                unlockCondition: 'phase_power_unlock',
                activationKey: 'F'
            }
        ];

        // Store power definitions
        powerDefinitions.forEach(power => {
            this.powers.set(power.id, power);
        });
    }

    /**
     * Set up keyboard controls for power activation
     */
    setupPowerControls() {
        if (!this.scene || !this.scene.input) return;

        this.powerKeys = {};
        
        // Set up keys for each power
        this.powers.forEach(power => {
            if (power.activationKey) {
                const keyCode = Phaser.Input.Keyboard.KeyCodes[power.activationKey];
                if (keyCode) {
                    this.powerKeys[power.id] = this.scene.input.keyboard.addKey(keyCode);
                }
            }
        });

        console.log('Power controls set up');
    }

    /**
     * Unlock a power through story milestone triggers
     * @param {string} powerId - ID of the power to unlock
     * @param {string} storyTrigger - Story event that triggered the unlock
     */
    unlockPower(powerId, storyTrigger = null) {
        if (!this.powers.has(powerId)) {
            console.warn(`Power not found: ${powerId}`);
            return false;
        }

        if (this.unlockedPowers.has(powerId)) {
            console.log(`Power already unlocked: ${powerId}`);
            return false;
        }

        const power = this.powers.get(powerId);
        
        // Add to unlocked powers
        this.unlockedPowers.add(powerId);
        
        // Show unlock notification
        this.showPowerUnlockNotification(power, storyTrigger);
        
        // Emit power unlock event
        this.emitPowerEvent('power_unlocked', { powerId, power, storyTrigger });
        
        console.log(`Power unlocked: ${powerId} (triggered by: ${storyTrigger || 'unknown'})`);
        return true;
    }

    /**
     * Check if a power is available for use
     * @param {string} powerId - ID of the power to check
     * @returns {boolean} - Whether power can be activated
     */
    checkPowerAvailability(powerId) {
        if (!this.unlockedPowers.has(powerId)) {
            return false;
        }

        // Check if power is on cooldown
        if (this.cooldowns.has(powerId)) {
            const cooldownEnd = this.cooldowns.get(powerId);
            if (Date.now() < cooldownEnd) {
                return false;
            } else {
                // Cooldown expired, remove it
                this.cooldowns.delete(powerId);
            }
        }

        return true;
    }

    /**
     * Activate a power with the specified context
     * @param {string} powerId - ID of the power to activate
     * @param {Object} context - Activation context (target, position, etc.)
     * @returns {boolean} - Whether activation was successful
     */
    activatePower(powerId, context = {}) {
        if (!this.checkPowerAvailability(powerId)) {
            console.log(`Power not available: ${powerId}`);
            return false;
        }

        const power = this.powers.get(powerId);
        if (!power) {
            console.warn(`Power not found: ${powerId}`);
            return false;
        }

        // Set cooldown if applicable
        if (power.cooldown > 0) {
            this.cooldowns.set(powerId, Date.now() + power.cooldown);
        }

        // Handle different power types
        switch (power.type) {
            case 'active':
                this.activateActivePower(power, context);
                break;
            case 'toggle':
                this.togglePower(power, context);
                break;
            case 'passive':
                // Passive powers are always active once unlocked
                console.log(`Passive power ${powerId} is always active`);
                break;
            default:
                console.warn(`Unknown power type: ${power.type}`);
                return false;
        }

        // Show activation feedback
        this.showPowerActivationFeedback(power, context);
        
        // Emit power activation event
        this.emitPowerEvent('power_activated', { powerId, power, context });
        
        console.log(`Power activated: ${powerId}`);
        return true;
    }

    /**
     * Activate an active-type power
     * @param {Object} power - Power definition
     * @param {Object} context - Activation context
     */
    activateActivePower(power, context) {
        // Apply power effects
        power.effects.forEach(effect => {
            this.applyPowerEffect(effect, power, context);
        });

        // Store active power with duration if applicable
        const duration = power.effects.find(e => e.duration)?.duration || 1000;
        if (duration > 0) {
            this.activePowers.set(power.id, {
                power,
                context,
                startTime: Date.now(),
                duration
            });

            // Set timer to deactivate power
            setTimeout(() => {
                this.deactivatePower(power.id);
            }, duration);
        }
    }

    /**
     * Toggle a toggle-type power on/off
     * @param {Object} power - Power definition
     * @param {Object} context - Activation context
     */
    togglePower(power, context) {
        if (this.activePowers.has(power.id)) {
            // Power is active, deactivate it
            this.deactivatePower(power.id);
        } else {
            // Power is inactive, activate it
            power.effects.forEach(effect => {
                this.applyPowerEffect(effect, power, context);
            });

            this.activePowers.set(power.id, {
                power,
                context,
                startTime: Date.now(),
                duration: -1 // Indefinite duration
            });
        }
    }

    /**
     * Deactivate a power
     * @param {string} powerId - ID of the power to deactivate
     */
    deactivatePower(powerId) {
        if (!this.activePowers.has(powerId)) {
            return;
        }

        const activePower = this.activePowers.get(powerId);
        const power = activePower.power;

        // Remove power effects
        power.effects.forEach(effect => {
            this.removePowerEffect(effect, power, activePower.context);
        });

        this.activePowers.delete(powerId);
        
        // Emit power deactivation event
        this.emitPowerEvent('power_deactivated', { powerId, power });
        
        console.log(`Power deactivated: ${powerId}`);
    }

    /**
     * Apply a power effect
     * @param {Object} effect - Effect definition
     * @param {Object} power - Power definition
     * @param {Object} context - Activation context
     */
    applyPowerEffect(effect, power, context) {
        switch (effect.type) {
            case 'move_object':
                this.applyTelekinesisEffect(effect, power, context);
                break;
            case 'reveal_hidden':
                this.applyVisionEffect(effect, power, context);
                break;
            case 'time_manipulation':
                this.applyTimeEffect(effect, power, context);
                break;
            case 'phase_through':
                this.applyPhaseEffect(effect, power, context);
                break;
            case 'visual_effect':
                this.applyVisualEffect(effect, power, context);
                break;
            default:
                console.warn(`Unknown effect type: ${effect.type}`);
        }
    }

    /**
     * Remove a power effect
     * @param {Object} effect - Effect definition
     * @param {Object} power - Power definition
     * @param {Object} context - Activation context
     */
    removePowerEffect(effect, power, context) {
        switch (effect.type) {
            case 'reveal_hidden':
                this.removeVisionEffect(effect, power, context);
                break;
            case 'time_manipulation':
                this.removeTimeEffect(effect, power, context);
                break;
            case 'phase_through':
                this.removePhaseEffect(effect, power, context);
                break;
            case 'visual_effect':
                this.removeVisualEffect(effect, power, context);
                break;
        }
    }

    /**
     * Apply telekinesis effect
     */
    applyTelekinesisEffect(effect, power, context) {
        if (!this.scene.player) return;

        const playerPos = this.scene.player.getPosition();
        const range = power.range || 64;

        // Create telekinesis visual effect
        const telekinesisEffect = this.scene.add.circle(
            playerPos.x + 16, 
            playerPos.y + 16, 
            range, 
            0x9b59b6, 
            0.3
        );
        telekinesisEffect.setDepth(1000);

        // Animate the effect
        this.scene.tweens.add({
            targets: telekinesisEffect,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 1000,
            onComplete: () => telekinesisEffect.destroy()
        });

        console.log('Telekinesis effect applied');
    }

    /**
     * Apply enhanced vision effect
     */
    applyVisionEffect(effect, power, context) {
        // Create vision overlay
        this.visionOverlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x00ffff,
            0.1
        );
        this.visionOverlay.setScrollFactor(0);
        this.visionOverlay.setDepth(500);

        console.log('Enhanced vision effect applied');
    }

    /**
     * Remove enhanced vision effect
     */
    removeVisionEffect(effect, power, context) {
        if (this.visionOverlay) {
            this.visionOverlay.destroy();
            this.visionOverlay = null;
        }
        console.log('Enhanced vision effect removed');
    }

    /**
     * Apply time manipulation effect
     */
    applyTimeEffect(effect, power, context) {
        if (this.scene.physics && this.scene.physics.world) {
            // Slow down physics
            this.originalTimeScale = this.scene.physics.world.timeScale;
            this.scene.physics.world.timeScale = effect.factor || 0.5;
        }

        // Create time distortion visual effect
        this.timeDistortionEffect = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffffff,
            0.05
        );
        this.timeDistortionEffect.setScrollFactor(0);
        this.timeDistortionEffect.setDepth(600);

        console.log('Time manipulation effect applied');
    }

    /**
     * Remove time manipulation effect
     */
    removeTimeEffect(effect, power, context) {
        if (this.scene.physics && this.scene.physics.world && this.originalTimeScale !== undefined) {
            this.scene.physics.world.timeScale = this.originalTimeScale;
        }

        if (this.timeDistortionEffect) {
            this.timeDistortionEffect.destroy();
            this.timeDistortionEffect = null;
        }

        console.log('Time manipulation effect removed');
    }

    /**
     * Apply phase walk effect
     */
    applyPhaseEffect(effect, power, context) {
        if (this.scene.player && this.scene.player.sprite) {
            // Make player semi-transparent and able to phase through obstacles
            this.scene.player.sprite.setAlpha(0.5);
            this.scene.player.sprite.setTint(0x00ffff);
            
            // Set phase flag for collision detection
            this.scene.player.isPhasing = true;
        }

        console.log('Phase walk effect applied');
    }

    /**
     * Remove phase walk effect
     */
    removePhaseEffect(effect, power, context) {
        if (this.scene.player && this.scene.player.sprite) {
            this.scene.player.sprite.setAlpha(1);
            this.scene.player.sprite.clearTint();
            this.scene.player.isPhasing = false;
        }

        console.log('Phase walk effect removed');
    }

    /**
     * Apply visual effect
     */
    applyVisualEffect(effect, power, context) {
        const effectName = effect.effect;
        
        switch (effectName) {
            case 'telekinesis_glow':
                this.createGlowEffect(0x9b59b6);
                break;
            case 'vision_overlay':
                // Already handled in applyVisionEffect
                break;
            case 'time_distortion':
                // Already handled in applyTimeEffect
                break;
            case 'phase_glow':
                this.createGlowEffect(0x00ffff);
                break;
        }
    }

    /**
     * Remove visual effect
     */
    removeVisualEffect(effect, power, context) {
        // Visual effects are typically temporary and self-cleaning
    }

    /**
     * Create a glow effect around the player
     */
    createGlowEffect(color) {
        if (!this.scene.player) return;

        const playerPos = this.scene.player.getPosition();
        const glow = this.scene.add.circle(
            playerPos.x + 16,
            playerPos.y + 16,
            20,
            color,
            0.4
        );
        glow.setDepth(this.scene.player.sprite.depth - 1);

        this.scene.tweens.add({
            targets: glow,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            onComplete: () => glow.destroy()
        });
    }

    /**
     * Update power system (called from scene update loop)
     * @param {number} time - Current time
     * @param {number} delta - Time delta
     */
    update(time, delta) {
        // Handle power input
        this.handlePowerInput();
        
        // Update active powers
        this.updateActivePowers(time, delta);
        
        // Update cooldown displays
        this.updateCooldownDisplays();
    }

    /**
     * Handle power activation input
     */
    handlePowerInput() {
        if (!this.powerKeys) return;

        this.powers.forEach((power, powerId) => {
            const key = this.powerKeys[powerId];
            if (key && Phaser.Input.Keyboard.JustDown(key)) {
                this.activatePower(powerId);
            }
        });
    }

    /**
     * Update active powers
     */
    updateActivePowers(time, delta) {
        this.activePowers.forEach((activePower, powerId) => {
            if (activePower.duration > 0) {
                const elapsed = time - activePower.startTime;
                if (elapsed >= activePower.duration) {
                    this.deactivatePower(powerId);
                }
            }
        });
    }

    /**
     * Update cooldown displays
     */
    updateCooldownDisplays() {
        // This would update UI elements showing cooldown status
        // Implementation depends on UI system
    }

    /**
     * Show power unlock notification
     * @param {Object} power - Power that was unlocked
     * @param {string} storyTrigger - Story trigger that caused unlock
     */
    showPowerUnlockNotification(power, storyTrigger) {
        if (!this.scene) return;

        const notification = this.scene.add.container(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100
        );
        notification.setScrollFactor(0);
        notification.setDepth(5000);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 400, 120, 0x2c3e50, 0.9);

        // Title
        const title = this.scene.add.text(0, -30, 'NEW POWER UNLOCKED!', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#f39c12',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // Power name
        const powerName = this.scene.add.text(0, 0, power.name, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            fontStyle: 'bold'
        });
        powerName.setOrigin(0.5);

        // Description
        const description = this.scene.add.text(0, 25, power.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        });
        description.setOrigin(0.5);

        // Activation key
        const keyHint = this.scene.add.text(0, 45, `Press ${power.activationKey} to use`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#95a5a6'
        });
        keyHint.setOrigin(0.5);

        notification.add([bg, title, powerName, description, keyHint]);

        // Animate notification
        notification.setScale(0);
        this.scene.tweens.add({
            targets: notification,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 1000,
                    delay: 3000,
                    onComplete: () => notification.destroy()
                });
            }
        });
    }

    /**
     * Show power activation feedback
     * @param {Object} power - Power that was activated
     * @param {Object} context - Activation context
     */
    showPowerActivationFeedback(power, context) {
        if (!this.scene) return;

        // Show power name briefly
        const feedback = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 150,
            power.name,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#f39c12',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 10, y: 5 }
            }
        );
        feedback.setOrigin(0.5);
        feedback.setScrollFactor(0);
        feedback.setDepth(4000);

        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            y: feedback.y - 30,
            duration: 1500,
            onComplete: () => feedback.destroy()
        });
    }

    /**
     * Get list of all available powers
     * @returns {Array} - Array of power objects
     */
    getPowerList() {
        return Array.from(this.powers.values());
    }

    /**
     * Get list of unlocked powers
     * @returns {Array} - Array of unlocked power objects
     */
    getUnlockedPowerList() {
        return Array.from(this.unlockedPowers).map(powerId => this.powers.get(powerId));
    }

    /**
     * Get power by ID
     * @param {string} powerId - Power ID
     * @returns {Object|null} - Power object or null
     */
    getPower(powerId) {
        return this.powers.get(powerId) || null;
    }

    /**
     * Check if power is currently active
     * @param {string} powerId - Power ID
     * @returns {boolean} - Whether power is active
     */
    isPowerActive(powerId) {
        return this.activePowers.has(powerId);
    }

    /**
     * Get remaining cooldown time for a power
     * @param {string} powerId - Power ID
     * @returns {number} - Remaining cooldown in milliseconds
     */
    getRemainingCooldown(powerId) {
        if (!this.cooldowns.has(powerId)) {
            return 0;
        }

        const cooldownEnd = this.cooldowns.get(powerId);
        const remaining = cooldownEnd - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Add event listener for power events
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
     * Emit power event to listeners
     * @param {string} eventType - Type of event
     * @param {*} data - Event data
     */
    emitPowerEvent(eventType, data) {
        if (!this.eventListeners.has(eventType)) return;
        
        this.eventListeners.get(eventType).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in power event listener for ${eventType}:`, error);
            }
        });
    }

    /**
     * Get power system state for saving
     * @returns {Object} - Serializable power system state
     */
    getPowerSystemState() {
        return {
            unlockedPowers: Array.from(this.unlockedPowers),
            activePowers: Array.from(this.activePowers.keys()),
            cooldowns: Object.fromEntries(this.cooldowns)
        };
    }

    /**
     * Load power system state from save data
     * @param {Object} powerState - Power system state to load
     */
    loadPowerSystemState(powerState) {
        if (!powerState) return;

        this.unlockedPowers = new Set(powerState.unlockedPowers || []);
        this.cooldowns = new Map(Object.entries(powerState.cooldowns || {}));
        
        // Note: Active powers are not restored on load as they are temporary
        this.activePowers.clear();
        
        console.log('Power system state loaded');
    }

    /**
     * Reset power system to initial state
     */
    resetPowerSystem() {
        this.unlockedPowers.clear();
        this.activePowers.clear();
        this.cooldowns.clear();
        
        console.log('Power system reset to initial state');
    }

    /**
     * Destroy power system and clean up resources
     */
    destroy() {
        // Deactivate all powers
        this.activePowers.forEach((_, powerId) => {
            this.deactivatePower(powerId);
        });

        // Clear all data
        this.powers.clear();
        this.unlockedPowers.clear();
        this.activePowers.clear();
        this.cooldowns.clear();
        this.eventListeners.clear();

        // Clean up input
        this.powerKeys = null;

        console.log('PowerSystem destroyed');
    }
}