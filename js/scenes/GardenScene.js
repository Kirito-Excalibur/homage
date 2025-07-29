import { Player } from '../components/Player.js';
import { UI } from '../components/UI.js';
import { Debug } from '../components/Debug.js';
import { MapLoader } from '../components/MapLoader.js';
import { SCENE_KEYS } from '../utils/Constants.js';

export class GardenScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GARDEN });
  }

  init(data) {
    // Receive data from previous scene
    this.playerStartX = data.playerX || 400;
    this.playerStartY = data.playerY || 500;
    this.gold = data.gold || 0;
    this.health = data.health || 100;
  }

  preload() {
    // Assets should already be loaded from GameScene
  }

  create() {
    // Load garden map
    const { map, GrassLayer } = MapLoader.loadGardenMap(this);
    this.map = map;

    // Create world boundaries
    this.walls = this.physics.add.staticGroup();

    // Create player
    this.player = new Player(this, this.playerStartX, this.playerStartY);

    // Setup world bounds and camera
    MapLoader.setupWorldBounds(this, this.map);

    // Player physics - collide with walls and grass borders
    this.physics.add.collider(this.player.sprite, this.walls);
    if (GrassLayer) {
      this.physics.add.collider(this.player.sprite, GrassLayer);
    }

    // Create exit zone (top of the map to return to flooring)
    this.exitZone = MapLoader.createExitZone(this, this.map);

    // Setup UI
    this.ui = new UI(this);
    this.ui.createGameUI("Garden Area - Walk to top to return", this.gold, this.health);

    // Setup debug
    this.debug = new Debug(this);

    // Game state
    this.exitTriggered = false;
  }

  update() {
    // Update player
    this.player.update();

    // Check for exit
    this.checkExit();

    // Update debug graphics
    if (this.debug.isEnabled()) {
      this.debug.draw();
      this.ui.updateHelpText(true);
    } else {
      this.ui.updateHelpText(false);
    }
  }

  checkExit() {
    if (!this.exitZone) return;

    const playerInExitZone = this.exitZone.contains(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2
    );

    if (playerInExitZone && !this.exitTriggered) {
      // Return to GameScene
      this.scene.start(SCENE_KEYS.GAME, {
        playerX: 390,
        playerY: 280,
        gold: this.gold,
        health: this.health
      });
      this.exitTriggered = true;
    } else if (!playerInExitZone && this.exitTriggered) {
      this.exitTriggered = false;
    }
  }
}