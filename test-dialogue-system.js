/**
 * Test script for the dialogue system
 * This script tests the DialogueScene functionality without running the full game
 */

// Mock Phaser objects for testing
const mockPhaser = {
    Scene: class {
        constructor(config) {
            this.key = config.key;
            this.events = {
                on: () => {},
                emit: () => {}
            };
            this.cameras = {
                main: {
                    height: 600,
                    width: 800,
                    centerX: 400,
                    centerY: 300
                }
            };
            this.add = {
                graphics: () => ({
                    fillStyle: () => {},
                    fillRoundedRect: () => {},
                    lineStyle: () => {},
                    strokeRoundedRect: () => {},
                    generateTexture: () => {},
                    destroy: () => {},
                    fillTriangle: () => {}
                }),
                image: () => ({
                    setOrigin: () => {},
                    setVisible: () => {},
                    setTexture: () => {}
                }),
                text: () => ({
                    setOrigin: () => {},
                    setVisible: () => {},
                    setText: () => {},
                    setColor: () => {}
                }),
                container: () => ({
                    add: () => {},
                    setVisible: () => {},
                    removeAll: () => {}
                })
            };
            this.input = {
                keyboard: {
                    addKey: () => ({}),
                    createCursorKeys: () => ({})
                },
                on: () => {}
            };
            this.tweens = {
                add: () => {}
            };
            this.plugins = {
                get: () => null
            };
            this.scene = {
                launch: () => {},
                pause: () => {},
                resume: () => {},
                stop: () => {},
                sleep: () => {},
                wake: () => {}
            };
        }
    },
    Input: {
        Keyboard: {
            KeyCodes: {
                SPACE: 32,
                ENTER: 13,
                ESC: 27
            },
            JustDown: () => false
        }
    }
};

// Set up global Phaser mock
global.Phaser = mockPhaser;

// Import the DialogueScene
import DialogueScene from './src/scenes/DialogueScene.js';

// Test dialogue data
const testDialogueEvent = {
    id: 'test_dialogue',
    type: 'dialogue',
    content: {
        text: 'This is a test dialogue message to verify the dialogue system is working correctly.',
        speaker: 'Test Speaker',
        nextEvent: null
    }
};

const testChoiceDialogueEvent = {
    id: 'test_choice_dialogue',
    type: 'dialogue',
    content: {
        text: 'This is a test dialogue with choices. What would you like to do?',
        speaker: 'Test Speaker',
        choices: [
            {
                text: 'Choose option A',
                nextEvent: null,
                effects: []
            },
            {
                text: 'Choose option B',
                nextEvent: null,
                effects: []
            }
        ]
    }
};

// Test the DialogueScene
console.log('Testing DialogueScene...');

try {
    // Create dialogue scene instance
    const dialogueScene = new DialogueScene();
    console.log('✓ DialogueScene created successfully');
    
    // Test scene initialization
    dialogueScene.preload();
    console.log('✓ DialogueScene preload completed');
    
    dialogueScene.create();
    console.log('✓ DialogueScene create completed');
    
    // Test dialogue starting
    dialogueScene.startDialogue(testDialogueEvent, 'TestScene');
    console.log('✓ Basic dialogue started successfully');
    
    // Test choice dialogue
    dialogueScene.startDialogue(testChoiceDialogueEvent, 'TestScene');
    console.log('✓ Choice dialogue started successfully');
    
    // Test dialogue closing
    dialogueScene.closeDialogue();
    console.log('✓ Dialogue closed successfully');
    
    console.log('\n🎉 All DialogueScene tests passed!');
    
} catch (error) {
    console.error('❌ DialogueScene test failed:', error.message);
    console.error(error.stack);
}