export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenuScene" });
  }

  preload() {
    // Assets are now loaded by LoadingScene and AssetManager
    // Check if critical assets are available, use fallbacks if needed
    this.ensureCriticalAssets();
  }

  /**
   * Ensure critical assets are available, create fallbacks if needed
   */
  ensureCriticalAssets() {
    // Check if button texture exists, create fallback if not
    if (!this.textures.exists('button')) {
      console.warn('Button texture not found, creating fallback');
      this.createFallbackButton();
    }
  }

  /**
   * Create fallback button texture
   */
  createFallbackButton() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3498db);
    graphics.fillRoundedRect(0, 0, 64, 32, 8);
    graphics.generateTexture('button', 64, 32);
    graphics.destroy();
  }

  create() {
    // Initialize audio for this scene
    this.initializeAudio();
    
    // Add animated background
    this.createAnimatedBackground();
    
    // Add game title with entrance animation
    const title = this.add
      .text(400, 150, "Top-Down Web RPG", {
        fontSize: "48px",
        fontFamily: "Arial",
        color: "#ecf0f1",
        fontStyle: "bold",
        stroke: "#2c3e50",
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.8);

    // Animate title entrance
    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 1000,
      ease: 'Back.easeOut'
    });

    // Add subtitle with delayed entrance
    const subtitle = this.add
      .text(400, 200, "A Story-Driven Adventure", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#bdc3c7",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: 500,
      ease: 'Power2.easeOut'
    });

    // Add floating title effect
    this.tweens.add({
      targets: title,
      y: title.y - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Check if save data exists
    const gameManager = this.plugins.get('GameManager');
    const hasSaveData = gameManager && gameManager.getAvailableSaves().length > 0;

    // Create "Start New Adventure" button
    const startButton = this.add.rectangle(400, hasSaveData ? 280 : 300, 300, 60, 0x3498db);
    const startButtonText = this.add
      .text(400, hasSaveData ? 280 : 300, "Start New Adventure", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Make start button interactive
    startButton.setInteractive({ useHandCursor: true });
    startButton.on("pointerover", () => {
      startButton.setFillStyle(0x2980b9);
      startButtonText.setScale(1.05);
    });
    startButton.on("pointerout", () => {
      startButton.setFillStyle(0x3498db);
      startButtonText.setScale(1);
    });
    startButton.on("pointerdown", () => {
      // Play menu select sound
      if (this.audioManager) {
        this.audioManager.playSfx('menu_select');
      }
      this.startNewGame();
    });

    // Create "Continue Game" button if save data exists
    let continueButton = null;
    let continueButtonText = null;
    if (hasSaveData) {
      continueButton = this.add.rectangle(400, 360, 300, 60, 0x27ae60);
      continueButtonText = this.add
        .text(400, 360, "Continue Game", {
          fontSize: "20px",
          fontFamily: "Arial",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // Make continue button interactive
      continueButton.setInteractive({ useHandCursor: true });
      continueButton.on("pointerover", () => {
        continueButton.setFillStyle(0x229954);
        continueButtonText.setScale(1.05);
      });
      continueButton.on("pointerout", () => {
        continueButton.setFillStyle(0x27ae60);
        continueButtonText.setScale(1);
      });
      continueButton.on("pointerdown", () => {
        // Play menu select sound
        if (this.audioManager) {
          this.audioManager.playSfx('menu_select');
        }
        this.continueGame();
      });
    }

    // Add keyboard support
    this.input.keyboard.on("keydown-ENTER", () => {
      if (hasSaveData) {
        this.continueGame();
      } else {
        this.startNewGame();
      }
    });

    this.input.keyboard.on("keydown-N", () => {
      this.startNewGame();
    });

    if (hasSaveData) {
      this.input.keyboard.on("keydown-C", () => {
        this.continueGame();
      });
    }

    // Add instructions
    const instructionY = hasSaveData ? 450 : 430;
    let instructions = "Press ENTER or click to start";
    if (hasSaveData) {
      instructions = "Press N for New Game, C to Continue, or click buttons";
    }
    
    this.add
      .text(400, instructionY, instructions, {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#95a5a6",
      })
      .setOrigin(0.5);

    // Add save notification listener
    this.events.on('save_notification', (message) => {
      this.showNotification(message, 0x27ae60);
    });

    this.events.on('save_error', (message) => {
      this.showNotification(message, 0xe74c3c);
    });

    // Add audio controls
    this.addAudioControls();
  }

  /**
   * Create animated background with particles and gradients
   */
  createAnimatedBackground() {
    // Create gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 1);
    graphics.fillRect(0, 0, 800, 600);
    
    // Create floating particles for ambiance
    if (this.textures.exists('grass-tile')) {
      this.backgroundParticles = this.add.particles(0, 0, 'grass-tile', {
        x: { min: 0, max: 800 },
        y: { min: 0, max: 600 },
        scale: { start: 0.02, end: 0.01 },
        alpha: { start: 0.3, end: 0 },
        speed: { min: 10, max: 30 },
        lifespan: 8000,
        quantity: 1,
        frequency: 200,
        tint: [0x3498db, 0x9b59b6, 0xe74c3c, 0xf39c12],
        blendMode: 'ADD'
      });
    }
    
    // Create animated geometric shapes
    this.createFloatingShapes();
  }

  /**
   * Create floating geometric shapes for visual interest
   */
  createFloatingShapes() {
    const shapes = [];
    
    for (let i = 0; i < 8; i++) {
      const shape = this.add.graphics();
      const size = Phaser.Math.Between(20, 40);
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const color = Phaser.Math.RND.pick([0x3498db, 0x9b59b6, 0xe74c3c, 0xf39c12]);
      
      shape.fillStyle(color, 0.1);
      shape.lineStyle(2, color, 0.3);
      
      if (i % 2 === 0) {
        shape.fillCircle(0, 0, size);
        shape.strokeCircle(0, 0, size);
      } else {
        shape.fillRect(-size/2, -size/2, size, size);
        shape.strokeRect(-size/2, -size/2, size, size);
      }
      
      shape.setPosition(x, y);
      shapes.push(shape);
      
      // Animate the shapes
      this.tweens.add({
        targets: shape,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, 100),
        rotation: Math.PI * 2,
        alpha: 0.5,
        duration: Phaser.Math.Between(8000, 12000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 500
      });
    }
    
    this.backgroundShapes = shapes;
  }

  /**
   * Add audio controls to the main menu
   */
  addAudioControls() {
    if (!this.audioManager) return;

    // Create audio controls in the top-right corner
    this.audioControls = this.audioManager.createAudioControls(this, 600, 80);
  }

  startNewGame() {
    // Reset any existing game state and start fresh
    const gameManager = this.plugins.get('GameManager');
    if (gameManager) {
      // Don't reset saves, just start a new game session
      console.log('Starting new game');
    }
    
    // Transition to GameWorldScene
    this.scene.start("GameWorldScene");
  }

  continueGame() {
    const gameManager = this.plugins.get('GameManager');
    if (gameManager) {
      const success = gameManager.loadGame();
      if (success) {
        console.log('Game loaded successfully');
        this.scene.start("GameWorldScene");
      } else {
        this.showNotification('Failed to load game. Starting new adventure.', 0xe74c3c);
        // Fall back to new game
        setTimeout(() => {
          this.startNewGame();
        }, 2000);
      }
    } else {
      this.showNotification('Game system not ready. Please try again.', 0xe74c3c);
    }
  }

  showNotification(message, color = 0x27ae60) {
    // Create notification text
    const notification = this.add
      .text(400, 500, message, {
        fontSize: "18px",
        fontFamily: "Arial",
        color: "#ffffff",
        backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5);

    // Fade out after 3 seconds
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        notification.destroy();
      }
    });
  }

  /**
   * Initialize audio for this scene
   */
  initializeAudio() {
    const gameManager = this.plugins.get('GameManager');
    if (gameManager && gameManager.getAudioManager()) {
      this.audioManager = gameManager.getAudioManager();
      // Start menu theme music
      this.audioManager.playBackgroundMusic('menu_theme');
      console.log('MainMenuScene audio initialized');
    } else {
      console.warn('AudioManager not available in MainMenuScene');
    }
  }

  update() {
    // Update audio manager if available
    if (this.audioManager) {
      this.audioManager.update(this.time.now, this.game.loop.delta);
    }
  }
}
