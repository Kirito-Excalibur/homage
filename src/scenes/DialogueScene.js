/**
 * DialogueScene - Handles story conversations and dialogue trees
 * Provides UI for displaying dialogue text, speaker names, and choice options
 */
export default class DialogueScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DialogueScene' });
        
        // Dialogue state
        this.currentDialogue = null;
        this.currentText = '';
        this.displayedText = '';
        this.textIndex = 0;
        this.isTyping = false;
        this.typingSpeed = 30; // Characters per second
        this.lastTypeTime = 0;
        
        // UI elements
        this.dialogueBox = null;
        this.speakerText = null;
        this.dialogueText = null;
        this.continueIndicator = null;
        this.choiceButtons = [];
        
        // Input handling
        this.spaceKey = null;
        this.enterKey = null;
        this.escKey = null;
        
        // Scene management
        this.previousScene = null;
        this.storySystem = null;
    }

    preload() {
        // Load enhanced UI assets
        this.load.image('dialogue-box', 'src/assets/ui/dialogue-box.png');
        this.load.image('button', 'src/assets/ui/button.png');
    }

    create(data) {
        // Initialize audio for this scene
        this.initializeAudio();
        
        // Get story system reference
        this.initializeStorySystem();
        
        // Create additional UI graphics that aren't loaded as assets
        this.createDialogueUIGraphics();
        
        // Create dialogue UI
        this.createDialogueUI();
        
        // Set up input controls
        this.setupControls();
        
        // Set up scene events
        this.setupSceneEvents();
        
        // Handle launch data
        if (data && data.dialogueEvent) {
            this.startDialogue(data.dialogueEvent, data.previousScene);
        }
        
        console.log('DialogueScene created');
    }

    createDialogueUIGraphics() {
        // Create speaker name background
        const speakerGraphics = this.add.graphics();
        speakerGraphics.fillStyle(0x34495e, 0.95);
        speakerGraphics.fillRoundedRect(0, 0, 200, 40, 8);
        speakerGraphics.lineStyle(2, 0x5d6d7e, 1);
        speakerGraphics.strokeRoundedRect(0, 0, 200, 40, 8);
        speakerGraphics.generateTexture('speaker-box', 200, 40);
        speakerGraphics.destroy();

        // Create choice button background using enhanced button
        const choiceGraphics = this.add.graphics();
        choiceGraphics.fillStyle(0x3498db, 0.8);
        choiceGraphics.fillRoundedRect(0, 0, 350, 45, 8);
        choiceGraphics.lineStyle(2, 0x2980b9, 1);
        choiceGraphics.strokeRoundedRect(0, 0, 350, 45, 8);
        choiceGraphics.generateTexture('choice-button', 350, 45);
        choiceGraphics.destroy();

        // Create choice button hover state
        const choiceHoverGraphics = this.add.graphics();
        choiceHoverGraphics.fillStyle(0x5dade2, 0.9);
        choiceHoverGraphics.fillRoundedRect(0, 0, 350, 45, 8);
        choiceHoverGraphics.lineStyle(2, 0x3498db, 1);
        choiceHoverGraphics.strokeRoundedRect(0, 0, 350, 45, 8);
        choiceHoverGraphics.generateTexture('choice-button-hover', 350, 45);
        choiceHoverGraphics.destroy();

        // Create continue indicator (small arrow)
        const arrowGraphics = this.add.graphics();
        arrowGraphics.fillStyle(0xf39c12, 1);
        arrowGraphics.fillTriangle(0, 0, 15, 7, 0, 14);
        arrowGraphics.generateTexture('continue-arrow', 15, 14);
        arrowGraphics.destroy();
    }

    createDialogueUI() {
        // Create main dialogue container
        this.dialogueContainer = this.add.container(0, 0);
        
        // Position dialogue box at bottom of screen
        const boxY = this.cameras.main.height - 170;
        
        // Create dialogue box background
        this.dialogueBox = this.add.image(20, boxY, 'dialogue-box');
        this.dialogueBox.setOrigin(0, 0);
        this.dialogueBox.setVisible(false);
        
        // Create speaker name box
        this.speakerBox = this.add.image(30, boxY - 25, 'speaker-box');
        this.speakerBox.setOrigin(0, 0);
        this.speakerBox.setVisible(false);
        
        // Create speaker name text
        this.speakerText = this.add.text(130, boxY - 5, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            fontStyle: 'bold'
        });
        this.speakerText.setOrigin(0.5, 0.5);
        this.speakerText.setVisible(false);
        
        // Create dialogue text
        this.dialogueText = this.add.text(50, boxY + 30, '', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            wordWrap: { width: 700, useAdvancedWrap: true },
            lineSpacing: 5
        });
        this.dialogueText.setOrigin(0, 0);
        this.dialogueText.setVisible(false);
        
        // Create continue indicator
        this.continueIndicator = this.add.image(750, boxY + 120, 'continue-arrow');
        this.continueIndicator.setOrigin(0.5, 0.5);
        this.continueIndicator.setVisible(false);
        
        // Add pulsing animation to continue indicator
        this.tweens.add({
            targets: this.continueIndicator,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add all elements to container
        this.dialogueContainer.add([
            this.dialogueBox,
            this.speakerBox,
            this.speakerText,
            this.dialogueText,
            this.continueIndicator
        ]);
        
        // Create choices container (separate from main dialogue)
        this.choicesContainer = this.add.container(0, 0);
        this.choicesContainer.setVisible(false);
    }

    setupControls() {
        // Create input keys
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Add click input for dialogue advancement
        this.input.on('pointerdown', this.handleDialogueAdvance, this);
    }

    setupSceneEvents() {
        // Listen for scene data when started
        this.events.on('wake', this.handleSceneWake, this);
        this.events.on('sleep', this.handleSceneSleep, this);
    }

    initializeStorySystem() {
        // Get story system from GameManager
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getStorySystem()) {
            this.storySystem = gameManager.getStorySystem();
            console.log('DialogueScene connected to StorySystem');
        } else {
            console.warn('StorySystem not available in DialogueScene');
        }
    }

    /**
     * Initialize audio for this scene
     */
    initializeAudio() {
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getAudioManager()) {
            this.audioManager = gameManager.getAudioManager();
            console.log('DialogueScene audio initialized');
        } else {
            console.warn('AudioManager not available in DialogueScene');
        }
    }

    /**
     * Start dialogue with given event data
     * @param {Object} dialogueData - Dialogue event data
     * @param {string} previousScene - Scene to return to after dialogue
     */
    startDialogue(dialogueData, previousScene = 'GameWorldScene') {
        this.currentDialogue = dialogueData;
        this.previousScene = previousScene;
        
        // Show dialogue UI
        this.showDialogueUI();
        
        // Start typing the dialogue text
        this.startTypingText(dialogueData.content.text, dialogueData.content.speaker);
        
        console.log('Started dialogue:', dialogueData.id);
    }

    showDialogueUI() {
        // Show all dialogue UI elements
        this.dialogueBox.setVisible(true);
        this.speakerBox.setVisible(true);
        this.speakerText.setVisible(true);
        this.dialogueText.setVisible(true);
        
        // Hide continue indicator initially
        this.continueIndicator.setVisible(false);
        
        // Hide choices initially
        this.hideChoices();
    }

    hideDialogueUI() {
        // Hide all dialogue UI elements
        this.dialogueBox.setVisible(false);
        this.speakerBox.setVisible(false);
        this.speakerText.setVisible(false);
        this.dialogueText.setVisible(false);
        this.continueIndicator.setVisible(false);
        
        // Hide choices
        this.hideChoices();
    }

    startTypingText(text, speaker) {
        // Play dialogue open sound
        if (this.audioManager) {
            this.audioManager.playSfx('dialogue_open', { volume: 0.6 });
        }
        
        // Set up typing state
        this.currentText = text;
        this.displayedText = '';
        this.textIndex = 0;
        this.isTyping = true;
        this.lastTypeTime = 0;
        
        // Set speaker name
        this.speakerText.setText(speaker || 'Unknown');
        
        // Clear dialogue text
        this.dialogueText.setText('');
        
        // Hide continue indicator while typing
        this.continueIndicator.setVisible(false);
    }

    update(time, delta) {
        // Handle text typing animation
        if (this.isTyping) {
            this.updateTextTyping(time);
        }
        
        // Handle input
        this.handleInput();
    }

    updateTextTyping(time) {
        // Check if enough time has passed for next character
        if (time - this.lastTypeTime > (1000 / this.typingSpeed)) {
            if (this.textIndex < this.currentText.length) {
                // Add next character
                this.displayedText += this.currentText[this.textIndex];
                this.textIndex++;
                this.lastTypeTime = time;
                
                // Update displayed text
                this.dialogueText.setText(this.displayedText);
            } else {
                // Typing complete
                this.isTyping = false;
                this.onTypingComplete();
            }
        }
    }

    onTypingComplete() {
        // Show continue indicator or choices
        if (this.currentDialogue && this.currentDialogue.content.choices) {
            this.showChoices(this.currentDialogue.content.choices);
        } else {
            this.continueIndicator.setVisible(true);
        }
    }

    handleInput() {
        // Handle dialogue advancement
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || 
            Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.handleDialogueAdvance();
        }
        
        // Handle escape to close dialogue
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.closeDialogue();
        }
    }

    handleDialogueAdvance() {
        if (this.isTyping) {
            // Skip typing animation
            this.skipTyping();
        } else if (this.currentDialogue) {
            // Advance to next dialogue or close
            this.advanceDialogue();
        }
    }

    skipTyping() {
        // Complete typing immediately
        this.isTyping = false;
        this.displayedText = this.currentText;
        this.textIndex = this.currentText.length;
        this.dialogueText.setText(this.displayedText);
        this.onTypingComplete();
    }

    advanceDialogue() {
        // Play dialogue advance sound
        if (this.audioManager) {
            this.audioManager.playSfx('dialogue_next', { volume: 0.5 });
        }
        
        // Check if there are choices to show
        if (this.currentDialogue.content.choices && this.choicesContainer.visible) {
            // Choices are already shown, wait for selection
            return;
        }
        
        // Check if there's a next event
        if (this.currentDialogue.content.nextEvent) {
            // Trigger next story event
            if (this.storySystem) {
                const nextEvent = this.storySystem.triggerStoryEvent(this.currentDialogue.content.nextEvent);
                if (nextEvent) {
                    this.startDialogue(nextEvent, this.previousScene);
                    return;
                }
            }
        }
        
        // No next event, close dialogue
        this.closeDialogue();
    }

    showChoices(choices) {
        // Clear existing choices
        this.hideChoices();
        
        // Create choice buttons
        const startY = this.cameras.main.height - 300;
        const spacing = 60;
        
        choices.forEach((choice, index) => {
            const y = startY + (index * spacing);
            
            // Create choice button
            const button = this.add.image(400, y, 'choice-button');
            button.setOrigin(0.5, 0.5);
            button.setInteractive();
            
            // Create choice text
            const text = this.add.text(400, y, choice.text, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ecf0f1',
                wordWrap: { width: 320, useAdvancedWrap: true },
                align: 'center'
            });
            text.setOrigin(0.5, 0.5);
            
            // Add hover effects
            button.on('pointerover', () => {
                button.setTexture('choice-button-hover');
                text.setColor('#ffffff');
            });
            
            button.on('pointerout', () => {
                button.setTexture('choice-button');
                text.setColor('#ecf0f1');
            });
            
            // Add click handler
            button.on('pointerdown', () => {
                this.selectChoice(choice, index);
            });
            
            // Store references
            this.choiceButtons.push({ button, text });
            this.choicesContainer.add([button, text]);
        });
        
        // Show choices container
        this.choicesContainer.setVisible(true);
    }

    hideChoices() {
        // Clear choice buttons
        this.choiceButtons.forEach(({ button, text }) => {
            button.destroy();
            text.destroy();
        });
        this.choiceButtons = [];
        
        // Clear choices container
        this.choicesContainer.removeAll();
        this.choicesContainer.setVisible(false);
    }

    selectChoice(choice, index) {
        console.log(`Choice selected: ${index} - ${choice.text}`);
        
        // Play choice selection sound
        if (this.audioManager) {
            this.audioManager.playSfx('menu_select', { volume: 0.7 });
        }
        
        // Process choice effects
        if (choice.effects && this.storySystem) {
            choice.effects.forEach(effect => {
                switch (effect.type) {
                    case 'set_flag':
                        this.storySystem.setStoryFlag(effect.flag, effect.value);
                        break;
                    case 'unlock_power':
                        this.storySystem.unlockPower(effect.powerId);
                        break;
                    case 'set_checkpoint':
                        this.storySystem.setCheckpoint(effect.checkpointId);
                        break;
                }
            });
        }
        
        // Hide choices
        this.hideChoices();
        
        // Trigger next event if specified
        if (choice.nextEvent && this.storySystem) {
            const nextEvent = this.storySystem.triggerStoryEvent(choice.nextEvent);
            if (nextEvent) {
                this.startDialogue(nextEvent, this.previousScene);
                return;
            }
        }
        
        // No next event, close dialogue
        this.closeDialogue();
    }

    closeDialogue() {
        // Hide dialogue UI
        this.hideDialogueUI();
        
        // Reset dialogue state
        this.currentDialogue = null;
        this.currentText = '';
        this.displayedText = '';
        this.textIndex = 0;
        this.isTyping = false;
        
        // Return to previous scene
        if (this.previousScene) {
            this.scene.resume(this.previousScene);
            this.scene.stop();
        }
        
        console.log('Dialogue closed, returning to:', this.previousScene);
    }

    handleSceneWake(sys, data) {
        // Handle scene wake with dialogue data
        if (data && data.dialogueEvent) {
            this.startDialogue(data.dialogueEvent, data.previousScene);
        }
    }

    handleSceneSleep() {
        // Clean up when scene sleeps
        this.hideDialogueUI();
    }

    /**
     * Public method to trigger dialogue from other scenes
     * @param {Object} dialogueEvent - Story event with dialogue content
     * @param {string} previousScene - Scene to return to
     */
    static showDialogue(scene, dialogueEvent, previousScene = 'GameWorldScene') {
        // Launch dialogue scene with data
        scene.scene.launch('DialogueScene', {
            dialogueEvent: dialogueEvent,
            previousScene: previousScene
        });
        
        // Pause the current scene
        scene.scene.pause();
    }
}