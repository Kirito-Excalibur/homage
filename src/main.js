import Phaser from 'phaser';
import LoadingScene from './scenes/LoadingScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameWorldScene from './scenes/GameWorldScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import GameManager from './managers/GameManager.js';
import ResponsiveDesign from './utils/ResponsiveDesign.js';

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
        LoadingScene,
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
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
        powerPreference: 'high-performance'
    },
    fps: {
        target: 60,
        forceSetTimeOut: true
    },
    disableContextMenu: true
};

// Initialize the game
const game = new Phaser.Game(config);

// Initialize responsive design system
const responsiveDesign = new ResponsiveDesign(game);

// Export game instance and utilities for debugging
window.game = game;
window.responsiveDesign = responsiveDesign;

// Handle loading overlay
const loadingOverlay = document.getElementById('loading-overlay');

// Hide loading overlay when game is ready
game.events.once('ready', () => {
    const gameManager = game.plugins.get('GameManager');
    if (gameManager) {
        // Enable debug mode in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            gameManager.setDebugMode(true);
            console.log('🔧 GameManager debug mode enabled');
            console.log('Use window.gameDebug for debugging tools');
        }
    }
    
    // Hide loading overlay with smooth transition
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }, 1000); // Show loading for at least 1 second
});

// Handle scene transitions with smooth effects
game.events.on('step', () => {
    // Add any global per-frame updates here
});

// Add smooth scene transition effects
game.scene.getScenes().forEach(scene => {
    scene.events.on('create', () => {
        // Fade in effect for new scenes
        scene.cameras.main.fadeIn(300, 0, 0, 0);
    });
});

// Handle window focus/blur for performance optimization
window.addEventListener('focus', () => {
    game.loop.targetFps = 60;
    console.log('Game focused, restoring full performance');
});

window.addEventListener('blur', () => {
    game.loop.targetFps = 30;
    console.log('Game blurred, reducing performance');
});