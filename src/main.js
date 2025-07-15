import Phaser from 'phaser';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameWorldScene from './scenes/GameWorldScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import GameManager from './managers/GameManager.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        MainMenuScene,
        GameWorldScene,
        DialogueScene,
        InventoryScene
    ],
    plugins: {
        global: [
            {
                key: 'GameManager',
                plugin: GameManager,
                start: true
            }
        ]
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Initialize the game
const game = new Phaser.Game(config);

// Export game instance for debugging
window.game = game;