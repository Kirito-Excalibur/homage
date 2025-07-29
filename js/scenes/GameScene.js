import { AssetLoader } from '../utils/AssetLoader.js';
import { Player } from '../components/Player.js';
import { UI } from '../components/UI.js';
import { Debug } from '../components/Debug.js';
import { MapLoader } from '../components/MapLoader.js';
import { SCENE_KEYS } from '../utils/Constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  init(data) {
    // Receive data when returning from other scenes
    this.playerStartX = data.playerX || 400;
    this.playerStartY = data.playerY || 300;
    this.gold = data.gold || 0;
    this.health = data.health || 100;
  }

  preload() {
    AssetLoader.loadGameAssets(this);
  }

  create() {
    // Load map
    const { map, FlooringLayer } = MapLoader.loadFlooringMap(this);
    this.map = map;

    // Create world boundaries
    this.walls = this.physics.add.staticGroup();

    // Create player
    this.player = new Player(this, this.playerStartX, this.playerStartY);

    // Setup world bounds and camera
    MapLoader.setupWorldBounds(this, this.map);

    // Player physics - collide with walls and flooring borders
    this.physics.add.collider(this.player.sprite, this.walls);
    if (FlooringLayer) {
      this.physics.add.collider(this.player.sprite, FlooringLayer);
    }

    // Create portal zone
    this.alertZone = MapLoader.createPortalZone(this, this.map);

    // Create NPCs
    this.createNPCs();

    // Create collectibles
    this.createCollectibles();

    // Setup UI
    this.ui = new UI(this);
    this.ui.createGameUI("Simon's Homage - Use WASD/Arrows to move", this.gold, this.health);

    // Setup debug
    this.debug = new Debug(this);

    // Game state
    this.alertTriggered = false;
  }

  createNPCs() {
    this.npcs = this.physics.add.staticGroup();
    this.createNPC(150, 200, 0xff69b4, "Villager");
    this.createNPC(550, 400, 0x32cd32, "Merchant");
  }

  createNPC(x, y, color, name) {
    const npc = this.npcs.create(x, y, null);
    npc.setSize(24, 24);
    npc.name = name;

    // NPC graphic
    const npcGraphics = this.add.graphics();
    npcGraphics.fillStyle(color);
    npcGraphics.fillRect(-12, -12, 24, 24);
    npcGraphics.fillStyle(0x000000);
    npcGraphics.fillCircle(-4, -4, 2);
    npcGraphics.fillCircle(4, -4, 2);
    const npcTexture = npcGraphics.generateTexture("npc_" + name, 24, 24);
    npc.setTexture(npcTexture);
    npcGraphics.destroy();

    // Name label
    this.add.text(x - 20, y - 30, name, {
      fontSize: "12px",
      fill: "#fff",
      backgroundColor: "#000",
      padding: { x: 4, y: 2 },
    });
  }

  createCollectibles() {
    this.collectibles = this.physics.add.group();
    this.createCollectible(250, 100);
    this.createCollectible(450, 150);
    this.createCollectible(350, 500);
    this.createCollectible(700, 300);

    // Collectible physics
    this.physics.add.overlap(
      this.player.sprite,
      this.collectibles,
      this.collectItem,
      null,
      this
    );
  }

  createCollectible(x, y) {
    const collectible = this.collectibles.create(x, y, null);
    collectible.setSize(16, 16);

    // Gold coin graphic
    const coinGraphics = this.add.graphics();
    coinGraphics.fillStyle(0xffd700);
    coinGraphics.fillCircle(0, 0, 8);
    coinGraphics.fillStyle(0xffa500);
    coinGraphics.fillCircle(0, 0, 5);
    collectible.setTexture(coinGraphics.generateTexture("coin", 16, 16));
    coinGraphics.destroy();

    // Add floating animation
    this.tweens.add({
      targets: collectible,
      y: y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  collectItem(player, collectible) {
    collectible.destroy();
    this.gold += 10;
    this.ui.updateGold(this.gold);

    // Play collect sound effect (visual feedback)
    const flash = this.add.circle(collectible.x, collectible.y, 20, 0xffffff, 0.8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  update() {
    // Update player
    this.player.update();

    // Check for teleportation
    this.checkTeleportation();

    // Update debug graphics
    if (this.debug.isEnabled()) {
      this.debug.draw();
      this.ui.updateHelpText(true);
    } else {
      this.ui.updateHelpText(false);
    }

    // Interaction with NPCs
    if (Phaser.Input.Keyboard.JustDown(this.player.spaceKey)) {
      this.checkNPCInteraction();
    }
  }

  checkTeleportation() {
    if (!this.alertZone) return;

    const playerInZone = this.alertZone.contains(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2
    );

    if (playerInZone && !this.alertTriggered) {
      // Store player state and teleport to garden
      this.scene.start(SCENE_KEYS.GARDEN, {
        playerX: 400,
        playerY: 500,
        gold: this.gold,
        health: this.health
      });
      this.alertTriggered = true;
    } else if (!playerInZone && this.alertTriggered) {
      this.alertTriggered = false;
    }
  }

  checkNPCInteraction() {
    this.npcs.children.entries.forEach((npc) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );

      if (distance < 50) {
        this.showDialog(npc.name);
      }
    });
  }

  showDialog(npcName) {
    const messages = {
      Villager: "Hello traveler! Welcome to our village!",
      Merchant: "I have wares if you have coin! Gold: " + this.gold,
    };

    const message = messages[npcName] || "Hello there!";
    this.ui.showDialog(message);
  }
}