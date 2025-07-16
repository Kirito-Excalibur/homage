import Character from '../entities/Character.js';
import Enemy from '../entities/Enemy.js';
import PerformanceOptimizer from '../utils/PerformanceOptimizer.js';

export default class GameWorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameWorldScene' });
        this.tileSize = 32;
        this.worldWidth = 25;
        this.worldHeight = 19;
        this.worldData = null;
    }

    preload() {
        // Assets are now loaded by LoadingScene and AssetManager
        // Check if critical assets are available, create fallbacks if needed
        this.ensureCriticalAssets();
    }

    /**
     * Ensure critical assets are available, create fallbacks if needed
     */
    ensureCriticalAssets() {
        const criticalAssets = [
            'grass-tile', 'stone-tile', 'water-tile', 'tree-tile',
            'player-idle-0', 'player-walk-0', 'player-walk-1', 'player-walk-2', 'player-walk-3'
        ];

        criticalAssets.forEach(assetKey => {
            if (!this.textures.exists(assetKey)) {
                console.warn(`Critical asset not found: ${assetKey}, creating fallback`);
                this.createFallbackAsset(assetKey);
            }
        });
    }

    /**
     * Create fallback asset for missing textures
     * @param {string} assetKey - Asset key to create fallback for
     */
    createFallbackAsset(assetKey) {
        const graphics = this.add.graphics();
        
        // Different colors for different asset types
        let color = 0x888888; // Default gray
        let width = 32;
        let height = 32;
        
        if (assetKey.includes('grass')) color = 0x2ecc71;
        else if (assetKey.includes('stone')) color = 0x7f8c8d;
        else if (assetKey.includes('water')) color = 0x3498db;
        else if (assetKey.includes('tree')) color = 0x27ae60;
        else if (assetKey.includes('player')) color = 0xe74c3c;
        else if (assetKey.includes('npc')) color = 0xf39c12;
        
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(assetKey, width, height);
        graphics.destroy();
    }



    create() {
        // Initialize performance optimizer
        this.performanceOptimizer = new PerformanceOptimizer(this);
        
        // Initialize audio for this scene
        this.initializeAudio();
        
        // Create the world map
        this.createWorld();
        
        // Create player character
        this.createPlayer();
        
        // Set up camera to follow player
        this.setupCamera();
        
        // Set up input controls
        this.setupControls();
        
        // Add UI elements
        this.createUI();
        
        // Initialize story system integration
        this.initializeStorySystem();
        
        // Set up scene event handlers
        this.setupSceneEvents();
        
        // Initialize combat system
        this.initializeCombatSystem();
        
        // Initialize particle systems for visual polish
        this.initializeParticleEffects();
    }

    createWorld() {
        // Create a simple world layout
        this.worldData = this.generateWorldData();
        
        // Create separate groups for different layers to control depth rendering
        this.backgroundLayer = this.add.group(); // Ground tiles (grass, stone, water)
        this.objectLayer = this.add.group();     // Objects that can be behind or in front of player
        this.foregroundLayer = this.add.group(); // Objects that are always in front of player
        
        // Render the world tiles with proper layering
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tileType = this.worldData[y][x];
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                let tileSprite;
                let targetLayer = this.backgroundLayer;
                
                switch (tileType) {
                    case 'grass':
                        tileSprite = this.add.image(tileX, tileY, 'grass-tile');
                        break;
                    case 'stone':
                        tileSprite = this.add.image(tileX, tileY, 'stone-tile');
                        break;
                    case 'water':
                        tileSprite = this.add.image(tileX, tileY, 'water-tile');
                        break;
                    case 'tree':
                        tileSprite = this.add.image(tileX, tileY, 'tree-tile');
                        targetLayer = this.objectLayer; // Trees can be behind or in front of player
                        break;
                    default:
                        tileSprite = this.add.image(tileX, tileY, 'grass-tile');
                }
                
                tileSprite.setOrigin(0, 0);
                
                // Set depth based on Y position for proper layering
                tileSprite.setDepth(tileY + (tileType === 'tree' ? this.tileSize : 0));
                
                targetLayer.add(tileSprite);
            }
        }
        
        // Add area transition zones
        this.createAreaTransitions();
    }

    generateWorldData() {
        // Create a simple world pattern with clear boundaries
        const world = [];
        
        for (let y = 0; y < this.worldHeight; y++) {
            world[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                // Create borders with stone (except at transition points)
                if (x === 0 || x === this.worldWidth - 1 || y === 0 || y === this.worldHeight - 1) {
                    // Leave gaps for area transitions
                    if ((x === 12 && y === 0) || // North transition
                        (x === this.worldWidth - 1 && y === 9) || // East transition  
                        (x === 12 && y === this.worldHeight - 1)) { // South transition
                        world[y][x] = 'grass';
                    } else {
                        world[y][x] = 'stone';
                    }
                }
                // Add some water patches
                else if ((x >= 5 && x <= 7 && y >= 8 && y <= 10) || 
                         (x >= 15 && x <= 17 && y >= 4 && y <= 6)) {
                    world[y][x] = 'water';
                }
                // Add some trees for depth testing
                else if ((x + y) % 7 === 0 && Math.random() > 0.5) {
                    world[y][x] = 'tree';
                }
                // Add some strategic trees near transition zones
                else if ((x === 11 || x === 13) && (y === 1 || y === this.worldHeight - 2)) {
                    world[y][x] = 'tree';
                }
                // Default to grass
                else {
                    world[y][x] = 'grass';
                }
            }
        }
        
        return world;
    }

    createPlayer() {
        // Place player in the center of the world
        const startX = Math.floor(this.worldWidth / 2) * this.tileSize;
        const startY = Math.floor(this.worldHeight / 2) * this.tileSize;
        
        // Create character using the new Character class
        this.player = new Character(this, startX, startY);
    }

    setupCamera() {
        // Set world bounds
        this.cameras.main.setBounds(0, 0, this.worldWidth * this.tileSize, this.worldHeight * this.tileSize);
        
        // Make camera follow player sprite with smooth following
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5); // Slightly zoomed in for better view
        
        // Set camera deadzone for smoother following
        this.cameras.main.setDeadzone(100, 100);
        
        // Enable camera bounds to prevent showing areas outside the world
        this.cameras.main.useBounds = true;
    }

    setupControls() {
        // Create cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Create WASD keys
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Add ESC key to return to menu
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Add save controls
        this.saveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5); // Quick save
        this.loadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F9); // Quick load
    }

    createUI() {
        // Create UI elements that stay fixed on screen
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0); // Keep UI fixed to camera
        
        // Add simple health indicator
        const healthBg = this.add.rectangle(100, 30, 200, 20, 0x2c3e50);
        const healthBar = this.add.rectangle(100, 30, 180, 16, 0xe74c3c);
        
        this.uiContainer.add([healthBg, healthBar]);
        
        // Add instructions
        const instructions = this.add.text(10, 60, 'Use WASD or Arrow Keys to move\nPress ESC to return to menu\nF5 - Quick Save | F9 - Quick Load', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 8, y: 4 }
        });
        this.uiContainer.add(instructions);
    }

    update(time, delta) {
        // Update performance optimizer
        if (this.performanceOptimizer) {
            this.performanceOptimizer.update(time, delta);
        }
        
        // Update audio manager
        if (this.audioManager) {
            this.audioManager.update(time, delta);
        }
        
        // Update character with new input system
        this.handleInput();
        this.player.update(time, delta);
        
        // Update power system
        if (this.powerSystem) {
            this.powerSystem.update(time, delta);
        }
        
        // Update combat system
        this.updateCombatSystem(time, delta);
        
        // Update particle effects
        this.updateParticleEffects(time, delta);
        
        // Check for area transitions
        this.checkAreaTransitions();
        
        // Handle story test controls
        this.handleStoryTestControls();
        
        // Handle inventory controls
        this.handleInventoryControls();
        
        // Handle save/load controls
        this.handleSaveLoadControls();
        
        // Handle ESC key to return to menu
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.scene.start('MainMenuScene');
        }
    }

    handleInput() {
        // Update character input state based on keyboard input
        this.player.setInputState('left', this.cursors.left.isDown || this.wasd.A.isDown);
        this.player.setInputState('right', this.cursors.right.isDown || this.wasd.D.isDown);
        this.player.setInputState('up', this.cursors.up.isDown || this.wasd.W.isDown);
        this.player.setInputState('down', this.cursors.down.isDown || this.wasd.S.isDown);
    }

    /**
     * Handle save and load controls
     */
    handleSaveLoadControls() {
        const gameManager = this.plugins.get('GameManager');
        if (!gameManager) return;

        // Quick save (F5)
        if (Phaser.Input.Keyboard.JustDown(this.saveKey)) {
            const success = gameManager.saveGame(0); // Save to slot 0
            if (success) {
                this.showSaveLoadNotification('Game Saved!', 0x27ae60);
            } else {
                this.showSaveLoadNotification('Save Failed!', 0xe74c3c);
            }
        }

        // Quick load (F9)
        if (Phaser.Input.Keyboard.JustDown(this.loadKey)) {
            const success = gameManager.loadGame('manual_save_0');
            if (success) {
                this.showSaveLoadNotification('Game Loaded!', 0x3498db);
                // Update UI after loading
                this.updateStoryProgressUI();
                this.updatePowerUI();
                if (this.updateInventoryUI) {
                    this.updateInventoryUI();
                }
            } else {
                this.showSaveLoadNotification('Load Failed!', 0xe74c3c);
            }
        }
    }

    /**
     * Show save/load notification
     * @param {string} message - Notification message
     * @param {number} color - Notification color
     */
    showSaveLoadNotification(message, color = 0x27ae60) {
        const notification = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 200,
            message,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.9)`,
                padding: { x: 15, y: 8 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(5000);

        // Animate the notification
        this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    // Methods for Character class collision detection
    getWorldBounds() {
        return {
            width: this.worldWidth * this.tileSize,
            height: this.worldHeight * this.tileSize
        };
    }

    createAreaTransitions() {
        // Create invisible transition zones at world edges for future area loading
        this.transitionZones = this.add.group();
        
        // Create transition zones (invisible rectangles) at specific locations
        // These will be used for area transitions in future story implementation
        const transitionData = [
            { x: 12 * this.tileSize, y: 0, width: this.tileSize, height: this.tileSize, direction: 'north', targetArea: 'forest_entrance' },
            { x: 24 * this.tileSize, y: 9 * this.tileSize, width: this.tileSize, height: this.tileSize, direction: 'east', targetArea: 'village_outskirts' },
            { x: 12 * this.tileSize, y: 18 * this.tileSize, width: this.tileSize, height: this.tileSize, direction: 'south', targetArea: 'cave_entrance' }
        ];
        
        transitionData.forEach(zone => {
            const transitionZone = this.add.zone(zone.x, zone.y, zone.width, zone.height);
            transitionZone.setOrigin(0, 0);
            transitionZone.setData('direction', zone.direction);
            transitionZone.setData('targetArea', zone.targetArea);
            
            // Add visual indicator for transition zones (temporary for development)
            const indicator = this.add.rectangle(zone.x + zone.width/2, zone.y + zone.height/2, zone.width, zone.height, 0xffff00, 0.3);
            indicator.setDepth(1000); // Always visible on top
            
            this.transitionZones.add(transitionZone);
        });
    }

    checkAreaTransitions() {
        // Check if player is in any transition zone
        const playerPos = this.player.getPosition();
        const playerGridX = Math.floor(playerPos.x / this.tileSize);
        const playerGridY = Math.floor(playerPos.y / this.tileSize);
        
        this.transitionZones.children.entries.forEach(zone => {
            const zoneGridX = Math.floor(zone.x / this.tileSize);
            const zoneGridY = Math.floor(zone.y / this.tileSize);
            
            if (playerGridX === zoneGridX && playerGridY === zoneGridY) {
                this.triggerAreaTransition(zone.getData('direction'), zone.getData('targetArea'));
            }
        });
    }

    triggerAreaTransition(direction, targetArea) {
        // For now, just show a message about the transition
        // In future tasks, this will load new areas and handle story progression
        console.log(`Area transition triggered: ${direction} to ${targetArea}`);
        
        // Add visual feedback for the transition
        const transitionText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY - 50, 
            `Entering ${targetArea.replace('_', ' ')}...`, 
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: { x: 20, y: 10 }
            }
        );
        transitionText.setOrigin(0.5);
        transitionText.setScrollFactor(0);
        transitionText.setDepth(2000);
        
        // Fade out the transition text after 2 seconds
        this.tweens.add({
            targets: transitionText,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => {
                transitionText.destroy();
            }
        });
    }

    initializeStorySystem() {
        // Get the story system from GameManager
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getStorySystem()) {
            this.storySystem = gameManager.getStorySystem();
            
            // Set up story event listeners
            this.setupStoryEventListeners();
            
            // Add story progress indicator to UI
            this.addStoryProgressUI();
            
            // Add test controls for story system (development only)
            this.addStoryTestControls();
            
            console.log('Story system integrated with GameWorldScene');
        } else {
            console.warn('Story system not available');
        }

        // Initialize power system integration
        this.initializePowerSystem();

        // Initialize inventory system integration
        this.initializeInventorySystem();
    }

    /**
     * Initialize power system integration
     */
    initializePowerSystem() {
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getPowerSystem()) {
            this.powerSystem = gameManager.getPowerSystem();
            
            // Set up power event listeners
            this.setupPowerEventListeners();
            
            // Add power UI elements
            this.addPowerUI();
            
            console.log('Power system integrated with GameWorldScene');
        } else {
            console.warn('Power system not available');
        }
    }

    /**
     * Initialize inventory system integration
     */
    initializeInventorySystem() {
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getInventorySystem()) {
            this.inventorySystem = gameManager.getInventorySystem();
            
            // Set up inventory event listeners
            this.setupInventoryEventListeners();
            
            // Add inventory UI elements
            this.addInventoryUI();
            
            // Add inventory controls
            this.addInventoryControls();
            
            console.log('Inventory system integrated with GameWorldScene');
        } else {
            console.warn('Inventory system not available');
        }
    }

    /**
     * Initialize audio for this scene
     */
    initializeAudio() {
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getAudioManager()) {
            this.audioManager = gameManager.getAudioManager();
            // Start world ambient music
            this.audioManager.playBackgroundMusic('world_ambient');
            console.log('GameWorldScene audio initialized');
        } else {
            console.warn('AudioManager not available in GameWorldScene');
        }
    }

    /**
     * Set up inventory system event listeners
     */
    setupInventoryEventListeners() {
        if (!this.inventorySystem) return;

        // Listen for item additions
        this.inventorySystem.addEventListener('item_added', (data) => {
            this.showItemCollectedNotification(data.item);
            this.updateInventoryUI();
        });

        // Listen for item usage
        this.inventorySystem.addEventListener('item_used', (data) => {
            console.log(`Item used: ${data.item.name}`);
            this.updateInventoryUI();
        });

        // Listen for inventory full events
        this.inventorySystem.addEventListener('inventory_full', (data) => {
            this.showInventoryFullNotification();
        });
    }

    /**
     * Set up power system event listeners
     */
    setupPowerEventListeners() {
        if (!this.powerSystem) return;

        // Listen for power unlocks
        this.powerSystem.addEventListener('power_unlocked', (data) => {
            this.showPowerUnlockNotification(data.power, data.storyTrigger);
            this.updatePowerUI();
        });

        // Listen for power activations
        this.powerSystem.addEventListener('power_activated', (data) => {
            this.showPowerActivationFeedback(data.power, data.context);
        });

        // Listen for power deactivations
        this.powerSystem.addEventListener('power_deactivated', (data) => {
            console.log(`Power deactivated: ${data.power.name}`);
        });
    }

    setupStoryEventListeners() {
        if (!this.storySystem) return;

        // Listen for story events that should trigger dialogue
        this.storySystem.addEventListener('story_event_triggered', (eventData) => {
            if (eventData && eventData.type === 'dialogue') {
                this.triggerDialogue(eventData);
            }
        });

        // Listen for power unlocks
        this.storySystem.addEventListener('power_unlocked', (data) => {
            this.showPowerUnlockNotification(data.powerId);
        });

        // Listen for checkpoint changes
        this.storySystem.addEventListener('checkpoint_reached', (data) => {
            this.showCheckpointNotification(data.checkpointId);
        });

        // Listen for flag changes
        this.storySystem.addEventListener('flag_changed', (data) => {
            console.log(`Story flag changed: ${data.flag} = ${data.value}`);
        });
    }

    /**
     * Set up scene event handlers
     */
    setupSceneEvents() {
        // Handle scene resume when dialogue closes
        this.events.on('resume', () => {
            console.log('GameWorldScene resumed from dialogue');
            // Update story progress UI when returning from dialogue
            this.updateStoryProgressUI();
            
            // Notify GameManager of scene transition
            const gameManager = this.plugins.get('GameManager');
            if (gameManager) {
                gameManager.handleSceneTransition('DialogueScene', 'GameWorldScene');
            }
        });

        // Handle scene pause when transitioning to other scenes
        this.events.on('pause', () => {
            console.log('GameWorldScene paused');
            
            // Capture current scene state before pausing
            const gameManager = this.plugins.get('GameManager');
            if (gameManager) {
                gameManager.captureSceneState('GameWorldScene');
            }
        });

        // Handle scene start/create
        this.events.on('create', () => {
            console.log('GameWorldScene created');
            
            // Notify GameManager that this scene is now active
            const gameManager = this.plugins.get('GameManager');
            if (gameManager) {
                gameManager.gameState.currentScene = 'GameWorldScene';
            }
        });

        // Listen for state synchronization events
        this.game.events.on('state-synchronized', (data) => {
            if (data.to === 'GameWorldScene') {
                console.log('State synchronized to GameWorldScene');
                this.updateAllUI();
            }
        });
    }

    /**
     * Trigger dialogue scene with story event data
     * @param {Object} dialogueEvent - Story event with dialogue content
     */
    triggerDialogue(dialogueEvent) {
        console.log('Triggering dialogue:', dialogueEvent.id);
        
        // Launch dialogue scene with the event data
        this.scene.launch('DialogueScene', {
            dialogueEvent: dialogueEvent,
            previousScene: 'GameWorldScene'
        });
        
        // Pause this scene while dialogue is active
        this.scene.pause();
    }

    addStoryProgressUI() {
        if (!this.storySystem) return;

        // Add story progress indicator
        const progress = this.storySystem.getStoryProgress();
        this.storyProgressText = this.add.text(10, 120, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        this.storyProgressText.setScrollFactor(0);
        this.updateStoryProgressUI();
        
        this.uiContainer.add(this.storyProgressText);
    }

    updateStoryProgressUI() {
        if (!this.storySystem || !this.storyProgressText) return;

        const progress = this.storySystem.getStoryProgress();
        const checkpoint = this.storySystem.getCurrentCheckpoint();
        
        this.storyProgressText.setText([
            `Checkpoint: ${checkpoint ? checkpoint.name : 'Unknown'}`,
            `Events: ${progress.completedEvents}/${progress.totalEvents}`,
            `Powers: ${progress.unlockedPowers}`
        ]);
    }

    addStoryTestControls() {
        if (!this.storySystem) return;

        // Add test keys for story system (development only)
        this.testKeys = {
            T: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T), // Trigger next story event
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), // Trigger dialogue
            P: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P), // Unlock power
            F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F), // Toggle flag
            R: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)  // Reset story
        };

        // Add test instructions to UI
        const testInstructions = this.add.text(10, 180, 
            'Story Test Controls:\nT - Trigger story event\nD - Test dialogue\nP - Unlock power\nF - Toggle flag\nR - Reset story', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#f39c12',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        testInstructions.setScrollFactor(0);
        this.uiContainer.add(testInstructions);
    }

    showPowerUnlockNotification(powerId) {
        const notification = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `Power Unlocked: ${powerId.toUpperCase()}!`,
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#f1c40f',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: { x: 20, y: 10 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(3000);

        // Animate the notification
        this.tweens.add({
            targets: notification,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 1500,
                    delay: 1000,
                    onComplete: () => notification.destroy()
                });
            }
        });
    }

    showCheckpointNotification(checkpointId) {
        const checkpoint = this.storySystem.getCurrentCheckpoint();
        const notification = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 50,
            `Checkpoint: ${checkpoint ? checkpoint.name : checkpointId}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#2ecc71',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: { x: 15, y: 8 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(3000);

        this.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 2000,
            delay: 1500,
            onComplete: () => notification.destroy()
        });

        // Update story progress UI
        this.updateStoryProgressUI();
    }

    handleStoryTestControls() {
        if (!this.storySystem || !this.testKeys) return;

        // Trigger story events
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.T)) {
            // Cycle through story events for testing
            const events = ['first_dialogue', 'tutorial_start', 'first_power_unlock', 'story_branch_choice'];
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            this.storySystem.triggerStoryEvent(randomEvent);
        }

        // Test dialogue directly
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.D)) {
            // Trigger a dialogue event directly
            const dialogueEvents = ['game_start', 'first_dialogue', 'story_branch_choice'];
            const randomDialogue = dialogueEvents[Math.floor(Math.random() * dialogueEvents.length)];
            const event = this.storySystem.triggerStoryEvent(randomDialogue);
            if (event && event.type === 'dialogue') {
                this.triggerDialogue(event);
            }
        }

        // Test power unlock
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.P)) {
            this.storySystem.unlockPower('telekinesis');
        }

        // Test flag toggle
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.F)) {
            const currentFlag = this.storySystem.getStoryFlag('tutorial_completed');
            this.storySystem.setStoryFlag('tutorial_completed', !currentFlag);
        }

        // Reset story
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.R)) {
            this.storySystem.resetStory();
        }
    }

    /**
     * Initialize particle effects for visual polish
     */
    initializeParticleEffects() {
        // Create particle emitters for various effects
        this.particleEffects = {
            footsteps: null,
            powerActivation: null,
            itemCollection: null,
            ambientSparkles: null
        };

        // Create footstep particles (dust clouds)
        this.particleEffects.footsteps = this.add.particles(0, 0, 'grass-tile', {
            scale: { start: 0.1, end: 0.05 },
            alpha: { start: 0.3, end: 0 },
            speed: { min: 10, max: 30 },
            lifespan: 300,
            quantity: 2,
            tint: 0x8B4513,
            emitting: false
        });

        // Create power activation particles (energy burst)
        this.particleEffects.powerActivation = this.add.particles(0, 0, 'grass-tile', {
            scale: { start: 0.2, end: 0.1 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 500,
            quantity: 10,
            tint: 0x00FFFF,
            emitting: false
        });

        // Create item collection particles (sparkles)
        this.particleEffects.itemCollection = this.add.particles(0, 0, 'grass-tile', {
            scale: { start: 0.15, end: 0.05 },
            alpha: { start: 1, end: 0 },
            speed: { min: 20, max: 60 },
            lifespan: 800,
            quantity: 8,
            tint: 0xFFD700,
            emitting: false
        });

        // Create ambient sparkles for magical areas
        this.particleEffects.ambientSparkles = this.add.particles(0, 0, 'grass-tile', {
            scale: { start: 0.05, end: 0.02 },
            alpha: { start: 0.6, end: 0 },
            speed: { min: 5, max: 15 },
            lifespan: 2000,
            quantity: 1,
            frequency: 500,
            tint: 0x9370DB,
            emitting: true,
            x: { min: 0, max: this.worldWidth * this.tileSize },
            y: { min: 0, max: this.worldHeight * this.tileSize }
        });

        console.log('Particle effects initialized');
    }

    /**
     * Update particle effects
     * @param {number} time - Current time
     * @param {number} delta - Time delta
     */
    updateParticleEffects(time, delta) {
        if (!this.particleEffects) return;

        // Update footstep particles based on player movement
        if (this.player && this.player.isMoving && this.player.isMoving()) {
            const playerPos = this.player.getPosition();
            
            // Emit footstep particles occasionally while moving
            if (time % 200 < delta) { // Every 200ms
                this.particleEffects.footsteps.setPosition(playerPos.x, playerPos.y + 16);
                this.particleEffects.footsteps.explode(2);
            }
        }

        // Update ambient sparkles position to follow camera for magical effect
        if (this.particleEffects.ambientSparkles) {
            const camera = this.cameras.main;
            this.particleEffects.ambientSparkles.setEmitZone({
                source: new Phaser.Geom.Rectangle(
                    camera.scrollX,
                    camera.scrollY,
                    camera.width,
                    camera.height
                ),
                type: 'random'
            });
        }
    }

    /**
     * Trigger power activation particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} powerType - Type of power for color variation
     */
    triggerPowerParticles(x, y, powerType = 'default') {
        if (!this.particleEffects.powerActivation) return;

        // Set color based on power type
        const powerColors = {
            telekinesis: 0x00FFFF,
            enhanced_vision: 0xFF69B4,
            time_slow: 0x9370DB,
            phase_walk: 0x32CD32,
            default: 0x00FFFF
        };

        this.particleEffects.powerActivation.setTint(powerColors[powerType] || powerColors.default);
        this.particleEffects.powerActivation.setPosition(x, y);
        this.particleEffects.powerActivation.explode(15);
    }

    /**
     * Trigger item collection particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    triggerItemCollectionParticles(x, y) {
        if (!this.particleEffects.itemCollection) return;

        this.particleEffects.itemCollection.setPosition(x, y);
        this.particleEffects.itemCollection.explode(8);
    }

    /**
     * Show power activation feedback with particles
     * @param {Object} power - Power object
     * @param {Object} context - Activation context
     */
    showPowerActivationFeedback(power, context) {
        const playerPos = this.player.getPosition();
        
        // Trigger particle effect
        this.triggerPowerParticles(playerPos.x, playerPos.y, power.id);
        
        // Show text feedback
        const feedbackText = this.add.text(
            playerPos.x,
            playerPos.y - 40,
            power.name.toUpperCase(),
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        feedbackText.setOrigin(0.5);
        feedbackText.setDepth(4000);

        // Animate feedback text
        this.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });

        // Screen flash effect for powerful abilities
        if (power.type === 'ultimate') {
            this.cameras.main.flash(200, 255, 255, 255, false);
        }
    }

    /**
     * Show item collected notification with particles
     * @param {Object} item - Item object
     */
    showItemCollectedNotification(item) {
        const playerPos = this.player.getPosition();
        
        // Trigger particle effect
        this.triggerItemCollectionParticles(playerPos.x, playerPos.y);
        
        // Show notification
        const notification = this.add.text(
            playerPos.x,
            playerPos.y - 50,
            `+${item.name}`,
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(4000);

        this.tweens.add({
            targets: notification,
            y: notification.y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    /**
     * Show inventory full notification
     */
    showInventoryFullNotification() {
        const notification = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'Inventory Full!',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ff6b6b',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: { x: 15, y: 8 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(4000);

        this.tweens.add({
            targets: notification,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => notification.destroy()
                });
            }
        });
    }

        // Test power unlock
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.P)) {
            this.storySystem.unlockPower('telekinesis');
        }

        // Test flag toggle
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.F)) {
            const currentFlag = this.storySystem.getStoryFlag('tutorial_completed');
            this.storySystem.setStoryFlag('tutorial_completed', !currentFlag);
        }

        // Reset story
        if (Phaser.Input.Keyboard.JustDown(this.testKeys.R)) {
            this.storySystem.resetStory();
            this.updateStoryProgressUI();
        }
    }

    /**
     * Add power UI elements to the scene
     */
    addPowerUI() {
        if (!this.powerSystem) return;

        // Add power list indicator
        this.powerListText = this.add.text(10, 280, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#e67e22',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        this.powerListText.setScrollFactor(0);
        this.updatePowerUI();
        
        this.uiContainer.add(this.powerListText);

        // Add power controls instructions
        const powerInstructions = this.add.text(10, 350, 
            'Power Controls:\nQ - Telekinesis\nE - Enhanced Vision\nR - Time Slow\nF - Phase Walk', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#9b59b6',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        powerInstructions.setScrollFactor(0);
        this.uiContainer.add(powerInstructions);
    }

    /**
     * Update power UI display
     */
    updatePowerUI() {
        if (!this.powerSystem || !this.powerListText) return;

        const unlockedPowers = this.powerSystem.getUnlockedPowerList();
        
        if (unlockedPowers.length === 0) {
            this.powerListText.setText('No powers unlocked');
        } else {
            const powerTexts = unlockedPowers.map(power => {
                const cooldown = this.powerSystem.getRemainingCooldown(power.id);
                const isActive = this.powerSystem.isPowerActive(power.id);
                let status = '';
                
                if (isActive) {
                    status = ' [ACTIVE]';
                } else if (cooldown > 0) {
                    status = ` [${Math.ceil(cooldown / 1000)}s]`;
                } else {
                    status = ' [READY]';
                }
                
                return `${power.name}${status}`;
            });
            
            this.powerListText.setText([
                'Unlocked Powers:',
                ...powerTexts
            ]);
        }
    }

    /**
     * Show power activation feedback (overrides the one from PowerSystem for scene-specific behavior)
     * @param {Object} power - Power that was activated
     * @param {Object} context - Activation context
     */
    showPowerActivationFeedback(power, context) {
        if (!power) return;

        // Show power name briefly
        const feedback = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 150,
            `${power.name} Activated!`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#9b59b6',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 10, y: 5 }
            }
        );
        feedback.setOrigin(0.5);
        feedback.setScrollFactor(0);
        feedback.setDepth(4000);

        this.tweens.add({
            targets: feedback,
            alpha: 0,
            y: feedback.y - 30,
            duration: 1500,
            onComplete: () => feedback.destroy()
        });

        // Update power UI to show cooldowns
        this.updatePowerUI();
    }

    isCollisionTile(gridX, gridY) {
        // Check if coordinates are within world bounds
        if (gridX < 0 || gridX >= this.worldWidth || gridY < 0 || gridY >= this.worldHeight) {
            return true; // Out of bounds is considered collision
        }

        // Check if the tile type is collidable
        const tileType = this.worldData[gridY][gridX];
        
        // Check if player is phasing through obstacles
        if (this.player && this.player.isPhasing) {
            // Allow phasing through trees and water, but not stone walls
            return tileType === 'stone';
        }
        
        return tileType === 'stone' || tileType === 'water' || tileType === 'tree';
    }

    /**
     * Add inventory UI elements to the scene
     */
    addInventoryUI() {
        if (!this.inventorySystem) return;

        // Add inventory indicator
        this.inventoryText = this.add.text(10, 420, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#3498db',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        this.inventoryText.setScrollFactor(0);
        this.updateInventoryUI();
        
        this.uiContainer.add(this.inventoryText);

        // Add inventory controls instructions
        const inventoryInstructions = this.add.text(10, 480, 
            'Inventory Controls:\nI - Open Inventory\nG - Collect nearby items', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#1abc9c',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        inventoryInstructions.setScrollFactor(0);
        this.uiContainer.add(inventoryInstructions);
    }

    /**
     * Update inventory UI display
     */
    updateInventoryUI() {
        if (!this.inventorySystem || !this.inventoryText) return;

        const capacity = this.inventorySystem.getCapacityInfo();
        const storyItems = this.inventorySystem.getStoryItems();
        
        this.inventoryText.setText([
            `Inventory: ${capacity.current}/${capacity.max}`,
            `Story Items: ${storyItems.length}`
        ]);
    }

    /**
     * Add inventory controls
     */
    addInventoryControls() {
        if (!this.inventorySystem) return;

        // Add inventory key
        this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        
        // Add collect items key
        this.collectKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);

        // Add inventory test controls (development only)
        this.addInventoryTestControls();
    }

    /**
     * Add inventory test controls for development
     */
    addInventoryTestControls() {
        if (!this.inventorySystem) return;

        // Add test keys for inventory system (development only)
        this.inventoryTestKeys = {
            ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),   // Add healing potion
            TWO: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),   // Add crystal gem
            THREE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE), // Add gold coins
            FOUR: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),  // Add mysterious orb
            FIVE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE)   // Clear inventory
        };

        // Add test instructions to UI
        const inventoryTestInstructions = this.add.text(10, 520, 
            'Inventory Test:\n1-Potion 2-Gem 3-Coins 4-Orb 5-Clear', {
            fontSize: '9px',
            fontFamily: 'Arial',
            color: '#16a085',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 6, y: 3 }
        });
        inventoryTestInstructions.setScrollFactor(0);
        this.uiContainer.add(inventoryTestInstructions);
    }

    /**
     * Handle inventory controls in the update loop
     */
    handleInventoryControls() {
        if (!this.inventorySystem) return;

        // Open inventory
        if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
            this.openInventory();
        }

        // Collect nearby items
        if (Phaser.Input.Keyboard.JustDown(this.collectKey)) {
            this.collectNearbyItems();
        }

        // Handle inventory test controls
        this.handleInventoryTestControls();
    }

    /**
     * Handle inventory test controls
     */
    handleInventoryTestControls() {
        if (!this.inventorySystem || !this.inventoryTestKeys) return;

        // Add healing potion
        if (Phaser.Input.Keyboard.JustDown(this.inventoryTestKeys.ONE)) {
            this.inventorySystem.addItem({
                id: 'healing-potion',
                name: 'Healing Potion',
                description: 'A red potion that glows with restorative energy.',
                type: 'consumable',
                quantity: 1,
                usable: true,
                storyRelevant: false,
                rarity: 'common'
            });
        }

        // Add crystal gem
        if (Phaser.Input.Keyboard.JustDown(this.inventoryTestKeys.TWO)) {
            this.inventorySystem.addItem({
                id: 'crystal-gem',
                name: 'Crystal Gem',
                description: 'A beautiful crystal that resonates with magical energy.',
                type: 'material',
                quantity: 1,
                usable: false,
                storyRelevant: true,
                rarity: 'rare'
            });
        }

        // Add gold coins
        if (Phaser.Input.Keyboard.JustDown(this.inventoryTestKeys.THREE)) {
            this.inventorySystem.addItem({
                id: 'gold-coin',
                name: 'Gold Coins',
                description: 'Shiny gold coins from an ancient civilization.',
                type: 'currency',
                quantity: 5,
                usable: false,
                storyRelevant: false,
                rarity: 'common'
            });
        }

        // Add mysterious orb
        if (Phaser.Input.Keyboard.JustDown(this.inventoryTestKeys.FOUR)) {
            this.inventorySystem.addItem({
                id: 'mysterious-orb',
                name: 'Mysterious Orb',
                description: 'An orb that pulses with unknown energy.',
                type: 'artifact',
                quantity: 1,
                usable: true,
                storyRelevant: true,
                rarity: 'epic'
            });
        }

        // Clear inventory
        if (Phaser.Input.Keyboard.JustDown(this.inventoryTestKeys.FIVE)) {
            this.inventorySystem.clearInventory();
            this.inventorySystem.initializeStartingItems();
        }
    }

    /**
     * Open the inventory scene
     */
    openInventory() {
        console.log('Opening inventory');
        
        // Launch inventory scene with current inventory data
        this.scene.launch('InventoryScene', {
            inventory: this.inventorySystem,
            previousScene: 'GameWorldScene'
        });
        
        // Pause this scene while inventory is active
        this.scene.pause();
    }

    /**
     * Collect nearby items (placeholder for future item collection system)
     */
    collectNearbyItems() {
        // For now, just show a message
        // In a full implementation, this would check for nearby item objects
        const message = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'No items nearby to collect',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#95a5a6',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 10, y: 5 }
            }
        );
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(4000);

        this.tweens.add({
            targets: message,
            alpha: 0,
            duration: 1500,
            delay: 1000,
            onComplete: () => message.destroy()
        });
    }

    /**
     * Show item collected notification
     * @param {Object} item - Collected item
     */
    showItemCollectedNotification(item) {
        const notification = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            `Collected: ${item.name}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#2ecc71',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: { x: 15, y: 8 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(4000);

        // Animate the notification
        this.tweens.add({
            targets: notification,
            y: notification.y - 30,
            alpha: 0,
            duration: 2000,
            onComplete: () => notification.destroy()
        });
    }

    /**
     * Show inventory full notification
     */
    showInventoryFullNotification() {
        const notification = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'Inventory is full!',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#e74c3c',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: { x: 15, y: 8 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(4000);

        // Animate the notification
        this.tweens.add({
            targets: notification,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 1500,
                    delay: 1000,
                    onComplete: () => notification.destroy()
                });
            }
        });
    }

    /**
     * Initialize combat system
     */
    initializeCombatSystem() {
        // Combat state
        this.combatActive = false;
        this.currentEnemy = null;
        this.playerHealth = 100;
        this.maxPlayerHealth = 100;
        
        // Combat UI elements
        this.combatUI = null;
        this.combatContainer = null;
        
        // Enemy management
        this.enemies = this.add.group();
        this.spawnEnemies();
        
        // Combat controls
        this.setupCombatControls();
        
        console.log('Combat system initialized');
    }

    /**
     * Set up combat controls
     */
    setupCombatControls() {
        // Space bar for basic attack
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Number keys for power attacks (1-4)
        this.powerAttackKeys = {
            1: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            3: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            4: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
        };
    }

    /**
     * Spawn enemies in the world
     */
    spawnEnemies() {
        // Define enemy spawn points (avoiding player start area and water/stone tiles)
        const spawnPoints = [
            { x: 3 * this.tileSize, y: 3 * this.tileSize, type: 'basic' },
            { x: 20 * this.tileSize, y: 5 * this.tileSize, type: 'guard' },
            { x: 8 * this.tileSize, y: 15 * this.tileSize, type: 'scout' },
            { x: 18 * this.tileSize, y: 12 * this.tileSize, type: 'basic' },
            { x: 5 * this.tileSize, y: 6 * this.tileSize, type: 'scout' }
        ];

        spawnPoints.forEach(spawn => {
            const enemy = new Enemy(this, spawn.x, spawn.y, spawn.type);
            this.enemies.add(enemy);
        });

        console.log(`Spawned ${spawnPoints.length} enemies`);
    }

    /**
     * Update combat system
     */
    updateCombatSystem(time, delta) {
        // Update all enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.update) {
                enemy.update(time, delta);
            }
        });

        // Handle combat input
        this.handleCombatInput();

        // Check for combat initiation
        if (!this.combatActive) {
            this.checkCombatInitiation();
        }

        // Update combat UI if active
        if (this.combatActive && this.combatUI) {
            this.updateCombatUI();
        }
    }

    /**
     * Handle combat input
     */
    handleCombatInput() {
        // Basic attack (Space)
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.performBasicAttack();
        }

        // Power attacks (1-4)
        Object.keys(this.powerAttackKeys).forEach(key => {
            if (Phaser.Input.Keyboard.JustDown(this.powerAttackKeys[key])) {
                this.performPowerAttack(parseInt(key));
            }
        });
    }

    /**
     * Check if combat should be initiated
     */
    checkCombatInitiation() {
        if (!this.player) return;

        const playerPos = this.player.getPosition();
        
        // Check if any enemy is close enough to initiate combat
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.isDefeated) return;
            
            const enemyPos = enemy.getPosition();
            const distance = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                enemyPos.x, enemyPos.y
            );

            // If enemy is in attack range and not already in combat
            if (distance <= enemy.attackRange && !this.combatActive) {
                this.startCombat(enemy);
            }
        });
    }

    /**
     * Start combat with an enemy
     */
    startCombat(enemy) {
        if (this.combatActive || enemy.isDefeated) return;

        this.combatActive = true;
        this.currentEnemy = enemy;
        enemy.combatActive = true;

        // Show combat UI
        this.showCombatUI();

        // Notify story system of combat start (for story progression)
        if (this.storySystem) {
            this.storySystem.triggerStoryEvent('combat_started', {
                enemyType: enemy.enemyType,
                playerHealth: this.playerHealth
            });
        }

        console.log(`Combat started with ${enemy.enemyType}`);
    }

    /**
     * Show combat UI
     */
    showCombatUI() {
        if (this.combatContainer) {
            this.combatContainer.destroy();
        }

        this.combatContainer = this.add.container(0, 0);
        this.combatContainer.setScrollFactor(0);
        this.combatContainer.setDepth(4000);

        // Combat background
        const combatBg = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.height - 100,
            this.cameras.main.width - 20,
            120,
            0x2c3e50,
            0.9
        );

        // Player health bar
        const playerHealthBg = this.add.rectangle(
            this.cameras.main.centerX - 200,
            this.cameras.main.height - 120,
            200,
            20,
            0x34495e
        );
        
        this.playerHealthBar = this.add.rectangle(
            this.cameras.main.centerX - 200,
            this.cameras.main.height - 120,
            200 * (this.playerHealth / this.maxPlayerHealth),
            20,
            0x27ae60
        );

        // Enemy health bar
        const enemyHealthBg = this.add.rectangle(
            this.cameras.main.centerX + 200,
            this.cameras.main.height - 120,
            200,
            20,
            0x34495e
        );
        
        this.enemyHealthBar = this.add.rectangle(
            this.cameras.main.centerX + 200,
            this.cameras.main.height - 120,
            200 * (this.currentEnemy.health / this.currentEnemy.maxHealth),
            20,
            0xe74c3c
        );

        // Combat instructions
        const instructions = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 80,
            'SPACE - Basic Attack | 1-4 - Power Attacks',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ecf0f1',
                fontStyle: 'bold'
            }
        );
        instructions.setOrigin(0.5);

        // Player and enemy names
        const playerLabel = this.add.text(
            this.cameras.main.centerX - 200,
            this.cameras.main.height - 140,
            'Player',
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#27ae60',
                fontStyle: 'bold'
            }
        );
        playerLabel.setOrigin(0.5);

        const enemyLabel = this.add.text(
            this.cameras.main.centerX + 200,
            this.cameras.main.height - 140,
            this.currentEnemy.enemyType.toUpperCase(),
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#e74c3c',
                fontStyle: 'bold'
            }
        );
        enemyLabel.setOrigin(0.5);

        this.combatContainer.add([
            combatBg, 
            playerHealthBg, 
            this.playerHealthBar,
            enemyHealthBg,
            this.enemyHealthBar,
            instructions,
            playerLabel,
            enemyLabel
        ]);

        this.combatUI = {
            background: combatBg,
            playerHealthBg,
            playerHealthBar: this.playerHealthBar,
            enemyHealthBg,
            enemyHealthBar: this.enemyHealthBar,
            instructions,
            playerLabel,
            enemyLabel
        };
    }

    /**
     * Update combat UI
     */
    updateCombatUI() {
        if (!this.combatUI || !this.currentEnemy) return;

        // Update health bars
        const playerHealthPercent = this.playerHealth / this.maxPlayerHealth;
        const enemyHealthPercent = this.currentEnemy.health / this.currentEnemy.maxHealth;

        this.combatUI.playerHealthBar.scaleX = playerHealthPercent;
        this.combatUI.enemyHealthBar.scaleX = enemyHealthPercent;

        // Change health bar colors based on health level
        if (playerHealthPercent < 0.3) {
            this.combatUI.playerHealthBar.setFillStyle(0xe74c3c);
        } else if (playerHealthPercent < 0.6) {
            this.combatUI.playerHealthBar.setFillStyle(0xf39c12);
        } else {
            this.combatUI.playerHealthBar.setFillStyle(0x27ae60);
        }
    }

    /**
     * Perform basic attack
     */
    performBasicAttack() {
        if (!this.combatActive || !this.currentEnemy) return;

        const baseDamage = 15;
        const damage = baseDamage + Math.floor(Math.random() * 10); // 15-24 damage

        // Apply damage to enemy
        const enemyDefeated = this.currentEnemy.takeDamage(damage);

        // Create attack effect on player
        this.createPlayerAttackEffect();

        console.log(`Player basic attack: ${damage} damage`);

        if (enemyDefeated) {
            this.endCombat(true);
        } else {
            // Enemy counter-attack after a delay
            this.time.delayedCall(800, () => {
                this.enemyCounterAttack();
            });
        }
    }

    /**
     * Perform power attack
     */
    performPowerAttack(powerSlot) {
        if (!this.combatActive || !this.currentEnemy || !this.powerSystem) return;

        // Map power slots to power IDs
        const powerMap = {
            1: 'telekinesis',
            2: 'enhanced_vision',
            3: 'time_slow',
            4: 'phase_walk'
        };

        const powerId = powerMap[powerSlot];
        if (!powerId) return;

        // Check if power is available
        if (!this.powerSystem.checkPowerAvailability(powerId)) {
            this.showCombatMessage('Power not available!', 0xf39c12);
            return;
        }

        // Calculate power damage
        const powerDamage = this.calculatePowerDamage(powerId);
        
        // Use the power
        const powerUsed = this.powerSystem.activatePower(powerId, {
            target: this.currentEnemy,
            combatContext: true
        });

        if (powerUsed) {
            // Apply damage to enemy
            const enemyDefeated = this.currentEnemy.takeDamage(powerDamage);

            // Create power attack effect
            this.createPowerAttackEffect(powerId);

            console.log(`Player power attack (${powerId}): ${powerDamage} damage`);

            if (enemyDefeated) {
                this.endCombat(true);
            } else {
                // Enemy counter-attack after a delay
                this.time.delayedCall(1000, () => {
                    this.enemyCounterAttack();
                });
            }
        }
    }

    /**
     * Calculate power damage based on power type
     */
    calculatePowerDamage(powerId) {
        const baseDamage = {
            'telekinesis': 25,
            'enhanced_vision': 20,
            'time_slow': 30,
            'phase_walk': 22
        };

        const base = baseDamage[powerId] || 20;
        return base + Math.floor(Math.random() * 15); // Add random variance
    }

    /**
     * Create player attack effect
     */
    createPlayerAttackEffect() {
        if (!this.player) return;

        const playerPos = this.player.getPosition();
        const attackEffect = this.add.circle(
            playerPos.x + this.tileSize/2,
            playerPos.y + this.tileSize/2,
            this.tileSize/2,
            0x3498db,
            0.7
        );
        attackEffect.setDepth(this.player.sprite.depth + 1);

        this.tweens.add({
            targets: attackEffect,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 400,
            onComplete: () => attackEffect.destroy()
        });
    }

    /**
     * Create power attack effect
     */
    createPowerAttackEffect(powerId) {
        if (!this.player) return;

        const playerPos = this.player.getPosition();
        const colors = {
            'telekinesis': 0x9b59b6,
            'enhanced_vision': 0x00ffff,
            'time_slow': 0xffffff,
            'phase_walk': 0x00ffff
        };

        const color = colors[powerId] || 0x3498db;
        const powerEffect = this.add.circle(
            playerPos.x + this.tileSize/2,
            playerPos.y + this.tileSize/2,
            this.tileSize,
            color,
            0.6
        );
        powerEffect.setDepth(this.player.sprite.depth + 1);

        this.tweens.add({
            targets: powerEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 600,
            onComplete: () => powerEffect.destroy()
        });
    }

    /**
     * Enemy counter-attack
     */
    enemyCounterAttack() {
        if (!this.combatActive || !this.currentEnemy || this.currentEnemy.isDefeated) return;

        const damage = this.currentEnemy.damage + Math.floor(Math.random() * 5);
        this.playerHealth -= damage;

        // Create damage effect on player
        this.createPlayerDamageEffect(damage);

        console.log(`Enemy counter-attack: ${damage} damage to player`);

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.endCombat(false); // Player defeated
        }
    }

    /**
     * Create player damage effect
     */
    createPlayerDamageEffect(damage) {
        if (!this.player) return;

        const playerPos = this.player.getPosition();
        
        // Damage number
        const damageText = this.add.text(
            playerPos.x + this.tileSize/2,
            playerPos.y,
            `-${damage}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#e74c3c',
                fontStyle: 'bold'
            }
        );
        damageText.setOrigin(0.5);
        damageText.setDepth(this.player.sprite.depth + 2);

        this.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 1200,
            onComplete: () => damageText.destroy()
        });

        // Flash player sprite
        this.player.sprite.setTint(0xff0000);
        this.time.delayedCall(150, () => {
            if (this.player && this.player.sprite) {
                this.player.sprite.clearTint();
            }
        });
    }

    /**
     * End combat
     */
    endCombat(playerWon) {
        if (!this.combatActive) return;

        this.combatActive = false;
        
        if (this.currentEnemy) {
            this.currentEnemy.combatActive = false;
        }

        // Hide combat UI
        if (this.combatContainer) {
            this.tweens.add({
                targets: this.combatContainer,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.combatContainer.destroy();
                    this.combatContainer = null;
                    this.combatUI = null;
                }
            });
        }

        if (playerWon) {
            this.showCombatMessage('Victory!', 0x27ae60);
            
            // Notify story system of combat victory
            if (this.storySystem) {
                this.storySystem.triggerStoryEvent('combat_victory', {
                    enemyType: this.currentEnemy.enemyType,
                    playerHealth: this.playerHealth
                });
            }
        } else {
            this.showCombatMessage('Defeated!', 0xe74c3c);
            
            // Handle player defeat - respawn with reduced health
            this.respawnPlayer();
            
            // Notify story system of combat defeat
            if (this.storySystem) {
                this.storySystem.triggerStoryEvent('combat_defeat', {
                    enemyType: this.currentEnemy.enemyType
                });
            }
        }

        this.currentEnemy = null;
        console.log(`Combat ended - Player ${playerWon ? 'won' : 'lost'}`);
    }

    /**
     * Show combat message
     */
    showCombatMessage(message, color) {
        const messageText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            message,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.8)`,
                padding: { x: 20, y: 10 },
                fontStyle: 'bold'
            }
        );
        messageText.setOrigin(0.5);
        messageText.setScrollFactor(0);
        messageText.setDepth(5000);

        this.tweens.add({
            targets: messageText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.tweens.add({
                    targets: messageText,
                    alpha: 0,
                    duration: 1500,
                    delay: 1000,
                    onComplete: () => messageText.destroy()
                });
            }
        });
    }

    /**
     * Respawn player after defeat
     */
    respawnPlayer() {
        // Restore some health
        this.playerHealth = Math.floor(this.maxPlayerHealth * 0.5);
        
        // Move player to a safe spawn point
        const spawnX = Math.floor(this.worldWidth / 2) * this.tileSize;
        const spawnY = Math.floor(this.worldHeight / 2) * this.tileSize;
        
        if (this.player) {
            this.player.setPosition(spawnX, spawnY);
        }

        this.showCombatMessage('Respawned with reduced health', 0xf39c12);
    }

    /**
     * Handle enemy defeated callback
     */
    onEnemyDefeated(enemy) {
        // Remove enemy from group after a delay
        this.time.delayedCall(2000, () => {
            this.enemies.remove(enemy);
            enemy.destroy();
        });

        // Check if all enemies are defeated for story progression
        const remainingEnemies = this.enemies.children.entries.filter(e => !e.isDefeated);
        if (remainingEnemies.length === 0) {
            if (this.storySystem) {
                this.storySystem.triggerStoryEvent('all_enemies_defeated');
            }
        }
    }

    /**
     * Get player health for external systems
     */
    getPlayerHealth() {
        return {
            current: this.playerHealth,
            max: this.maxPlayerHealth,
            percentage: this.playerHealth / this.maxPlayerHealth
        };
    }

    /**
     * Set player health (for story events, items, etc.)
     */
    setPlayerHealth(health) {
        this.playerHealth = Math.max(0, Math.min(health, this.maxPlayerHealth));
    }

    /**
     * Heal player
     */
    healPlayer(amount) {
        const oldHealth = this.playerHealth;
        this.playerHealth = Math.min(this.playerHealth + amount, this.maxPlayerHealth);
        
        if (this.playerHealth > oldHealth) {
            this.showHealEffect(amount);
        }
    }

    /**
     * Show heal effect
     */
    showHealEffect(amount) {
        if (!this.player) return;

        const playerPos = this.player.getPosition();
        
        // Heal number
        const healText = this.add.text(
            playerPos.x + this.tileSize/2,
            playerPos.y,
            `+${amount}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#27ae60',
                fontStyle: 'bold'
            }
        );
        healText.setOrigin(0.5);
        healText.setDepth(this.player.sprite.depth + 2);

        this.tweens.add({
            targets: healText,
            y: healText.y - 40,
            alpha: 0,
            duration: 1200,
            onComplete: () => healText.destroy()
        });

        // Flash player sprite green
        this.player.sprite.setTint(0x27ae60);
        this.time.delayedCall(150, () => {
            if (this.player && this.player.sprite) {
                this.player.sprite.clearTint();
            }
        });
    }

    /**
     * Update all UI elements after state synchronization
     */
    updateAllUI() {
        try {
            // Update story progress UI
            if (this.updateStoryProgressUI) {
                this.updateStoryProgressUI();
            }

            // Update power UI
            if (this.updatePowerUI) {
                this.updatePowerUI();
            }

            // Update inventory UI
            if (this.updateInventoryUI) {
                this.updateInventoryUI();
            }

            console.log('All UI elements updated after state synchronization');
        } catch (error) {
            console.error('Error updating UI after state synchronization:', error);
        }
    }
}
