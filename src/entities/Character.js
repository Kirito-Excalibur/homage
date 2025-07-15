export default class Character {
    constructor(scene, x, y) {
        this.scene = scene;
        this.tileSize = 32;
        
        // Create the character sprite
        this.sprite = this.scene.add.sprite(x, y, 'player-sprite');
        this.sprite.setOrigin(0, 0);
        
        // Movement properties
        this.speed = 120; // pixels per second
        this.isMoving = false;
        this.facingDirection = 'down';
        
        // Animation properties
        this.animationTint = 0xffffff;
        this.animationTimer = 0;
        this.animationDuration = 200; // milliseconds
        
        // Store grid position for collision checking
        this.gridX = Math.floor(x / this.tileSize);
        this.gridY = Math.floor(y / this.tileSize);
        
        // Movement input state
        this.inputState = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }

    createPlaceholderSprite() {
        // Create simple character sprite (blue square with white center)
        const charGraphics = this.scene.add.graphics();
        charGraphics.fillStyle(0x3498db);
        charGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
        charGraphics.fillStyle(0xffffff);
        charGraphics.fillCircle(this.tileSize/2, this.tileSize/2, 8);
        charGraphics.generateTexture('player-sprite', this.tileSize, this.tileSize);
        charGraphics.destroy();
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.updateAnimation(time, delta);
    }

    handleMovement(delta) {
        let velocityX = 0;
        let velocityY = 0;
        let newFacingDirection = this.facingDirection;

        // Calculate movement based on input
        if (this.inputState.left) {
            velocityX = -this.speed;
            newFacingDirection = 'left';
        } else if (this.inputState.right) {
            velocityX = this.speed;
            newFacingDirection = 'right';
        }

        if (this.inputState.up) {
            velocityY = -this.speed;
            newFacingDirection = 'up';
        } else if (this.inputState.down) {
            velocityY = this.speed;
            newFacingDirection = 'down';
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707; // 1/sqrt(2)
            velocityY *= 0.707;
        }

        // Update facing direction
        if (velocityX !== 0 || velocityY !== 0) {
            this.facingDirection = newFacingDirection;
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }

        // Calculate new position
        const deltaSeconds = delta / 1000;
        let newX = this.sprite.x + (velocityX * deltaSeconds);
        let newY = this.sprite.y + (velocityY * deltaSeconds);

        // Check collision boundaries
        const collision = this.checkCollision(newX, newY);
        
        if (!collision.x) {
            this.sprite.x = newX;
            this.gridX = Math.floor(this.sprite.x / this.tileSize);
        }
        
        if (!collision.y) {
            this.sprite.y = newY;
            this.gridY = Math.floor(this.sprite.y / this.tileSize);
        }
    }

    checkCollision(newX, newY) {
        const worldBounds = this.scene.getWorldBounds();
        const collision = { x: false, y: false };

        // Check world boundaries
        if (newX < 0 || newX >= worldBounds.width - this.tileSize) {
            collision.x = true;
        }
        
        if (newY < 0 || newY >= worldBounds.height - this.tileSize) {
            collision.y = true;
        }

        // Check tile-based collisions (water, trees, stones)
        const gridX = Math.floor(newX / this.tileSize);
        const gridY = Math.floor(newY / this.tileSize);
        
        if (this.scene.isCollisionTile && this.scene.isCollisionTile(gridX, gridY)) {
            // Determine which axis to block based on movement direction
            if (Math.abs(newX - this.sprite.x) > Math.abs(newY - this.sprite.y)) {
                collision.x = true;
            } else {
                collision.y = true;
            }
        }

        return collision;
    }

    updateAnimation(time, delta) {
        if (this.isMoving) {
            // Simple animation using tint changes
            this.animationTimer += delta;
            
            if (this.animationTimer >= this.animationDuration) {
                this.animationTimer = 0;
                
                // Cycle through different tints to simulate movement
                const tints = [0xffffff, 0xe8f4f8, 0xd1e9f2, 0xe8f4f8];
                const currentTintIndex = Math.floor(time / this.animationDuration) % tints.length;
                this.sprite.setTint(tints[currentTintIndex]);
            }
        } else {
            // Reset to normal tint when not moving
            this.sprite.setTint(0xffffff);
            this.animationTimer = 0;
        }

        // Add subtle directional visual feedback
        this.updateDirectionalVisual();
    }

    updateDirectionalVisual() {
        // Slightly adjust sprite position or rotation based on facing direction
        // This provides visual feedback for the direction the character is facing
        switch (this.facingDirection) {
            case 'up':
                this.sprite.setScale(1, 0.95);
                break;
            case 'down':
                this.sprite.setScale(1, 1.05);
                break;
            case 'left':
                this.sprite.setScale(0.95, 1);
                break;
            case 'right':
                this.sprite.setScale(1.05, 1);
                break;
            default:
                this.sprite.setScale(1, 1);
        }
    }

    // Input handling methods
    setInputState(direction, isPressed) {
        if (this.inputState.hasOwnProperty(direction)) {
            this.inputState[direction] = isPressed;
        }
    }

    // Utility methods
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    setPosition(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
        this.gridX = Math.floor(x / this.tileSize);
        this.gridY = Math.floor(y / this.tileSize);
    }

    getFacingDirection() {
        return this.facingDirection;
    }

    isCharacterMoving() {
        return this.isMoving;
    }

    // Method for future power system integration
    usePower(powerId) {
        // Placeholder for power usage - will be implemented in later tasks
        console.log(`Character attempting to use power: ${powerId}`);
    }

    // Method for future interaction system
    interact(target) {
        // Placeholder for interaction system - will be implemented in later tasks
        console.log(`Character interacting with:`, target);
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}