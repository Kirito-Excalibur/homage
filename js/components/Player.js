import { PLAYER_CONFIG, GAME_CONFIG, ASSET_KEYS } from '../utils/Constants.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, ASSET_KEYS.SPRITES.STARMAN);
    this.sprite.setDisplaySize(PLAYER_CONFIG.DISPLAY_SIZE, PLAYER_CONFIG.DISPLAY_SIZE);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(PLAYER_CONFIG.BODY_SIZE, PLAYER_CONFIG.BODY_SIZE);
    
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.createAnimations();
    this.setupControls();
  }

  createAnimations() {
    const anims = this.scene.anims;
    
    anims.create({
      key: "left",
      frames: anims.generateFrameNumbers(ASSET_KEYS.SPRITES.STARMAN, PLAYER_CONFIG.ANIMATIONS.LEFT),
      frameRate: PLAYER_CONFIG.FRAME_RATE,
      repeat: -1,
    });

    anims.create({
      key: "right",
      frames: anims.generateFrameNumbers(ASSET_KEYS.SPRITES.STARMAN, PLAYER_CONFIG.ANIMATIONS.RIGHT),
      frameRate: PLAYER_CONFIG.FRAME_RATE,
      repeat: -1,
    });

    anims.create({
      key: "down",
      frames: anims.generateFrameNumbers(ASSET_KEYS.SPRITES.STARMAN, PLAYER_CONFIG.ANIMATIONS.DOWN),
      frameRate: PLAYER_CONFIG.FRAME_RATE,
      repeat: -1,
    });

    anims.create({
      key: "up",
      frames: anims.generateFrameNumbers(ASSET_KEYS.SPRITES.STARMAN, PLAYER_CONFIG.ANIMATIONS.UP),
      frameRate: PLAYER_CONFIG.FRAME_RATE,
      repeat: -1,
    });
  }

  setupControls() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys("W,S,A,D");
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    // Reset velocity
    this.sprite.body.setVelocity(0);

    // 8-directional movement
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -this.speed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = this.speed;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -this.speed;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = this.speed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707; // cos(45°)
      velocityY *= 0.707;
    }

    this.sprite.body.setVelocity(velocityX, velocityY);

    // Update animations
    this.updateAnimations();
  }

  updateAnimations() {
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.sprite.anims.play("left", true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.sprite.anims.play("right", true);
    } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.sprite.anims.play("up", true);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.sprite.anims.play("down", true);
    } else {
      this.sprite.anims.stop();
    }
  }

  // Getters for easy access to sprite properties
  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get width() { return this.sprite.width; }
  get height() { return this.sprite.height; }
  get body() { return this.sprite.body; }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }
}