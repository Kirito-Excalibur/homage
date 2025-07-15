export default class GameWorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameWorldScene' });
        this.tileSize = 32;
        this.worldWidth = 25;
        this.worldHeight = 19;
    }

    preload() {
        // Create placeholder tile graphics using canvas
        this.createPlaceholderTiles();
        
        // Create placeholder character sprite
        this.createPlaceholderCharacter();
    }

    createPlaceholderTiles() {
        // Create grass tile (green)
        const grassGraphics = this.add.graphics();
        grassGraphics.fillStyle(0x27ae60);
        grassGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
        grassGraphics.generateTexture('grass-tile', this.tileSize, this.tileSize);
        grassGraphics.destroy();

        // Create stone tile (gray)
        const stoneGraphics = this.add.graphics();
        stoneGraphics.fillStyle(0x7f8c8d);
        stoneGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
        stoneGraphics.lineStyle(1, 0x95a5a6);
        stoneGraphics.strokeRect(0, 0, this.tileSize, this.tileSize);
        stoneGraphics.generateTexture('stone-tile', this.tileSize, this.tileSize);
        stoneGraphics.destroy();

        // Create water tile (blue)
        const waterGraphics = this.add.graphics();
        waterGraphics.fillStyle(0x3498db);
        waterGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
        waterGraphics.generateTexture('water-tile', this.tileSize, this.tileSize);
        waterGraphics.destroy();

        // Create tree tile (dark green)
        const treeGraphics = this.add.graphics();
        treeGraphics.fillStyle(0x27ae60);
        treeGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
        treeGraphics.fillStyle(0x1e8449);
        treeGraphics.fillCircle(this.tileSize/2, this.tileSize/2, this.tileSize/3);
        treeGraphics.generateTexture('tree-tile', this.tileSize, this.tileSize);
        treeGraphics.destroy();
    }

    createPlaceholderCharacter() {
        // Create simple character sprite (blue square with white center)
        const charGraphics = this.add.graphics();
        charGraphics.fillStyle(0x3498db);
        charGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
        charGraphics.fillStyle(0xffffff);
        charGraphics.fillCircle(this.tileSize/2, this.tileSize/2, 8);
        charGraphics.generateTexture('player-sprite', this.tileSize, this.tileSize);
        charGraphics.destroy();
    }

    create() {
        // Create the world map
        this.createWorld();
        
        // Create player character
        this.createPlayer();
        
        // Set up camera to follow player
        this.setupCamera();
        
        // Set up input controls
        this.setupControls();
        
        // Add UI elements
        this.createUI();
    }

    createWorld() {
        // Create a simple world layout
        const worldData = this.generateWorldData();
        
        // Create tile group for better performance
        this.worldTiles = this.add.group();
        
        // Render the world tiles
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tileType = worldData[y][x];
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                let tileSprite;
                switch (tileType) {
                    case 'grass':
                        tileSprite = this.add.image(tileX, tileY, 'grass-tile');
                        break;
                    case 'stone':
                        tileSprite = this.add.image(tileX, tileY, 'stone-tile');
                        break;
                    case 'water':
                        tileSprite = this.add.image(tileX, tileY, 'water-tile');
                        break;
                    case 'tree':
                        tileSprite = this.add.image(tileX, tileY, 'tree-tile');
                        break;
                    default:
                        tileSprite = this.add.image(tileX, tileY, 'grass-tile');
                }
                
                tileSprite.setOrigin(0, 0);
                this.worldTiles.add(tileSprite);
            }
        }
    }

    generateWorldData() {
        // Create a simple world pattern
        const world = [];
        
        for (let y = 0; y < this.worldHeight; y++) {
            world[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                // Create borders with stone
                if (x === 0 || x === this.worldWidth - 1 || y === 0 || y === this.worldHeight - 1) {
                    world[y][x] = 'stone';
                }
                // Add some water patches
                else if ((x >= 5 && x <= 7 && y >= 8 && y <= 10) || 
                         (x >= 15 && x <= 17 && y >= 4 && y <= 6)) {
                    world[y][x] = 'water';
                }
                // Add some trees
                else if ((x + y) % 7 === 0 && Math.random() > 0.5) {
                    world[y][x] = 'tree';
                }
                // Default to grass
                else {
                    world[y][x] = 'grass';
                }
            }
        }
        
        return world;
    }

    createPlayer() {
        // Place player in the center of the world
        const startX = Math.floor(this.worldWidth / 2) * this.tileSize;
        const startY = Math.floor(this.worldHeight / 2) * this.tileSize;
        
        this.player = this.add.image(startX, startY, 'player-sprite');
        this.player.setOrigin(0, 0);
        
        // Store player's grid position
        this.playerGridX = Math.floor(this.worldWidth / 2);
        this.playerGridY = Math.floor(this.worldHeight / 2);
    }

    setupCamera() {
        // Set world bounds
        this.cameras.main.setBounds(0, 0, this.worldWidth * this.tileSize, this.worldHeight * this.tileSize);
        
        // Make camera follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);
    }

    setupControls() {
        // Create cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Create WASD keys
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Add ESC key to return to menu
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    createUI() {
        // Create UI elements that stay fixed on screen
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0); // Keep UI fixed to camera
        
        // Add simple health indicator
        const healthBg = this.add.rectangle(100, 30, 200, 20, 0x2c3e50);
        healthBg.setStroke(2, 0x34495e);
        const healthBar = this.add.rectangle(100, 30, 180, 16, 0xe74c3c);
        
        this.uiContainer.add([healthBg, healthBar]);
        
        // Add instructions
        const instructions = this.add.text(10, 60, 'Use WASD or Arrow Keys to move\nPress ESC to return to menu', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 8, y: 4 }
        });
        this.uiContainer.add(instructions);
    }

    update() {
        // Handle input
        this.handleInput();
        
        // Handle ESC key to return to menu
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.scene.start('MainMenuScene');
        }
    }

    handleInput() {
        // Simple movement - will be enhanced in later tasks
        const speed = 2;
        
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.x -= speed;
        }
        else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.x += speed;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.player.y -= speed;
        }
        else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.player.y += speed;
        }
        
        // Keep player within world bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 0, (this.worldWidth - 1) * this.tileSize);
        this.player.y = Phaser.Math.Clamp(this.player.y, 0, (this.worldHeight - 1) * this.tileSize);
    }
}