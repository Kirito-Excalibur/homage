export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        // Create simple colored rectangles as placeholder UI elements
        this.load.image('menu-bg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        
        // Create placeholder button graphics using canvas
        this.load.image('button-bg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    }

    create() {
        // Add background
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);
        
        // Add game title
        this.add.text(400, 150, 'Top-Down Web RPG', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add subtitle
        this.add.text(400, 200, 'A Story-Driven Adventure', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        }).setOrigin(0.5);

        // Create "Start New Adventure" button
        const startButton = this.add.rectangle(400, 300, 300, 60, 0x3498db);
        startButton.setStroke(2, 0x2980b9);
        
        const startButtonText = this.add.text(400, 300, 'Start New Adventure', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Make button interactive
        startButton.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x2980b9);
            startButtonText.setScale(1.05);
        });
        
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x3498db);
            startButtonText.setScale(1);
        });
        
        // Button click handler - transition to game world
        startButton.on('pointerdown', () => {
            this.startNewGame();
        });

        // Add keyboard support for starting game
        this.input.keyboard.on('keydown-ENTER', () => {
            this.startNewGame();
        });

        // Add instructions
        this.add.text(400, 450, 'Press ENTER or click to start', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#95a5a6'
        }).setOrigin(0.5);
    }

    startNewGame() {
        // Transition to GameWorldScene
        this.scene.start('GameWorldScene');
    }

    update() {
        // Main menu doesn't need continuous updates
    }
}