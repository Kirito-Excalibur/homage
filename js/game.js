class GameScene extends Phaser.Scene {
  showDebug = false;
  debugGraphics;
  cursors;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.load.image("Fences", "assets/images/Fences.png");
    this.load.image("Grass", "assets/images/Grass.png");
    this.load.tilemapTiledJSON("map", "assets/images/TestMap2.json");

    // Load player sprite
    this.load.spritesheet("player", "assets/images/sprite.png", {
      frameWidth: 48,
      frameHeight: 48,
    });



    //Load starman sprite
    this.load.spritesheet("starman","assets/images/swordsman.png",{
      frameWidth: 64,
      frameHeight: 64,
    })


  }

  create() {
    // Add grass background
    //this.cameras.main.setBackgroundColor("#4a7c59");

    // Create tilemap
    this.map = this.make.tilemap({ key: "map" });
    const GrassSet = this.map.addTilesetImage("Grass");
    const Grasslayer = this.map.createLayer(0, GrassSet, 0, 0);

    const FenceSet = this.map.addTilesetImage("Fences");
    const FenceLayer = this.map.createLayer(1, FenceSet, 0, 0);
    // Set collision on fences layer
    if (FenceLayer) {
      FenceLayer.setCollisionBetween(78, 89);
    }

    // Create world boundaries (invisible walls)
    // this.walls = this.physics.add.staticGroup();

    // Create some obstacles/walls
    // this.createWall(200, 150, 100, 20, 0x8b4513); // Brown wall
    // this.createWall(500, 300, 20, 150, 0x8b4513);
    // this.createWall(300, 450, 200, 20, 0x8b4513);
    // this.createWall(600, 200, 80, 80, 0x696969); // Stone block

    // Create some trees
    // this.createTree(100, 100);
    // this.createTree(700, 150);
    // this.createTree(150, 500);
    // this.createTree(650, 450);

    // Create world boundaries (invisible walls)
    this.walls = this.physics.add.staticGroup();

    // Create player
    this.player = this.physics.add.sprite(400, 300, "starman");
    this.player.setDisplaySize(48, 48); // Better size for 128x128 sprite
    this.player.setCollideWorldBounds(true);

    // Set collision box to be smaller than the sprite for better gameplay
    this.player.body.setSize(32, 32);

    // Set world bounds to match the tilemap size
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // Set camera bounds and follow player
    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.cameras.main.startFollow(this.player);

    // Player physics - collide with walls and fences
    this.physics.add.collider(this.player, this.walls);
    if (FenceLayer) {
      this.physics.add.collider(this.player, FenceLayer);
    }

    //Player movement
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("starman", {
        start: 8,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("starman", {
        start: 16,
        end: 23,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("starman", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("starman", {
        start: 24,
        end: 31,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Create NPCs
    this.npcs = this.physics.add.staticGroup();
    this.createNPC(150, 200, 0xff69b4, "Villager");
    this.createNPC(550, 400, 0x32cd32, "Merchant");

    // Create collectibles
    this.collectibles = this.physics.add.group();
    this.createCollectible(250, 100);
    this.createCollectible(450, 150);
    this.createCollectible(350, 500);
    this.createCollectible(700, 300);

    // Collectible physics
    this.physics.add.overlap(
      this.player,
      this.collectibles,
      this.collectItem,
      null,
      this
    );

    this.input.keyboard.on("keydown-C", (event) => {
      this.showDebug = !this.showDebug;
      this.drawDebug();
    });

    this.debugGraphics = this.add.graphics();

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,S,A,D");
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.debugKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.C
    );

    // Debug mode
    this.debugMode = false;

    // UI
    this.title=this.add.text(16, 16, "Simon's Homage - Use WASD/Arrows to move", {
      fontSize: "16px",
      fill: "#fff",
      backgroundColor: "#000",
      padding: { x: 8, y: 4 },
    });

    this.scoreText = this.add.text(16, 50, "Gold: 0", {
      fontSize: "16px",
      fill: "#FFD700",
      backgroundColor: "#000",
      padding: { x: 8, y: 4 },
    });

    this.healthText = this.add.text(16, 84, "Health: 100", {
      fontSize: "16px",
      fill: "#FF0000",
      backgroundColor: "#000",
      padding: { x: 8, y: 4 },
    });

    this.helpText = this.add.text(200, 50, this.getHelpMessage(), {
      fontSize: "18px",
      fill: "#ffffff",
    });



    this.title.setScrollFactor(0);

    this.scoreText.setScrollFactor(0);

    this.healthText.setScrollFactor(0);

    this.helpText.setScrollFactor(0);

    // Game state
    this.gold = 0;
    this.health = 100;
    this.playerSpeed = 150;
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
    this.scoreText.setText("Gold: " + this.gold);

    // Play collect sound effect (visual feedback)
    const flash = this.add.circle(
      collectible.x,
      collectible.y,
      20,
      0xffffff,
      0.8
    );
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  update() {
    // Reset velocity
    this.player.body.setVelocity(0);

    // 8-directional movement
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -this.playerSpeed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = this.playerSpeed;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -this.playerSpeed;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = this.playerSpeed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707; // cos(45°)
      velocityY *= 0.707;
    }

    this.player.body.setVelocity(velocityX, velocityY);

    // Update animations based on movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.anims.play("right", true);
    } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.anims.play("up", true);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.anims.play("down", true);
    } else {
      this.player.anims.stop();
    }

    // Update debug graphics every frame if debug is enabled
    if (this.showDebug) {
      this.drawDebug();
    }

    // Interaction with NPCs
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.checkNPCInteraction();
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

    // Simple dialog display
    const dialog = this.add
      .text(400, 100, message, {
        fontSize: "16px",
        fill: "#000",
        backgroundColor: "#fff",
        padding: { x: 12, y: 8 },
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Auto-remove dialog after 2 seconds
    this.time.delayedCall(2000, () => {
      dialog.destroy();
    });
  }

  //Debug

  drawDebug() {
    this.debugGraphics.clear();

    if (this.showDebug) {
      // Pass in null for any of the style options to disable drawing that component
      this.map.renderDebug(this.debugGraphics, {
        tileColor: null, // Non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200), // Colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Colliding face edges
      });

      // Draw sprite boundary (full frame)
      this.debugGraphics.lineStyle(2, 0x00ff00); // Green line, 2px thick
      this.debugGraphics.strokeRect(
        this.player.x - this.player.width / 2,
        this.player.y - this.player.height / 2,
        this.player.width,
        this.player.height
      );

      // Draw physics body boundary
      this.debugGraphics.lineStyle(2, 0xff0000); // Red line, 2px thick
      this.debugGraphics.strokeRect(
        this.player.body.x,
        this.player.body.y,
        this.player.body.width,
        this.player.body.height
      );

      // Draw a smaller boundary that might fit your actual sprite better
      this.debugGraphics.lineStyle(1, 0xffff00); // Yellow line, 1px thick
      const smallerSize = 16; // Adjust this value to match your actual sprite size
      this.debugGraphics.strokeRect(
        this.player.x - smallerSize / 2,
        this.player.y - smallerSize / 2,
        smallerSize,
        smallerSize
      );
    }

    this.helpText.setText(this.getHelpMessage());
  }

  getHelpMessage() {
    return `Arrow keys to move.\nPress "C" to toggle debug visuals: ${
      this.showDebug ? "on" : "off"
    }`;
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down
      debug: false,
    },
  },
  scene: GameScene,
};

// Start the game
const game = new Phaser.Game(config);
