import { GameScene } from './scenes/GameScene.js';
import { GardenScene } from './scenes/GardenScene.js';
import { GAME_CONFIG } from './utils/Constants.js';

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down
      debug: false,
    },
  },
  scene: [GameScene, GardenScene],
};

// Start the game
const game = new Phaser.Game(config);