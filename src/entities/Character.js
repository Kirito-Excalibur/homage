export default class Character {
    constructor(scene, x, y, characterType = 'player') {
        this.scene = scene;
        this.tileSize = 32;
        this.characterType = characterType;
        
        // Audio integration
        this.audioManager = null;
        this.initializeAudio();
        
        // Create the character sprite using the new animation system
        this.sprite = this.scene.add.sprite(x, y, `${characterType}-idle`);
        this.sprite.setOrigin(0, 0);
        
        // Set initial depth based on Y position for proper layering
        this.updateDepth();
        
        // Movement properties
        this.speed = 120; // pixels per second
        this.isMoving = false;
        this.facingDirection = 'down';
        
        // Animation properties
        this.currentAnimation = 'idle';
        this.animationTimer = 0;
        this.animationDuration = 300; // milliseconds per frame
        this.currentFrame = 0;
        
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
        
        // Audio properties for movement sounds
        this.lastFootstepTime = 0;
        this.footstepInterval = 400; // milliseconds between footstep sounds
        
        // Create animations for this character
        this.createAnimations();
    }

    /**
     * Initialize audio integration
     */
    initializeAudio() {
        const gameManager = this.scene.plugins.get('GameManager');
        if (gameManager && gameManager.getAudioManager()) {
            this.audioManager = gameManager.getAudioManager();
        }
    }

    createAnimations() {
        // Create animation configurations for this character type
        const animKey = this.characterType;
        
        // Create idle animation
        if (!this.scene.anims.exists(`${animKey}-idle`)) {
            this.scene.anims.create({
                key: `${animKey}-idle`,
                frames: [
                    { key: `${animKey}-idle-0` },
                    { key: `${animKey}-idle-1` }
                ],
                frameRate: 2,
                repeat: -1
            });
        }
        
        // Create walk animation
        if (!this.scene.anims.exists(`${animKey}-walk`)) {
            this.scene.anims.create({
                key: `${animKey}-walk`,
                frames: [
                    { key: `${animKey}-walk-0` },
                    { key: `${animKey}-walk-1` },
                    { key: `${animKey}-walk-2` },
                    { key: `${animKey}-walk-3` }
                ],
                frameRate: 8,
                repeat: -1
            });
        }
        
        // Start with idle animation
        this.playAnimation('idle');
    }
    
    playAnimation(animationType) {
        const animKey = `${this.characterType}-${animationType}`;
        
        if (this.currentAnimation !== animationType) {
            this.currentAnimation = animationType;
            
            if (this.scene.anims.exists(animKey)) {
                this.sprite.play(animKey);
            } else {
                console.warn(`Animation ${animKey} does not exist`);
            }
        }
    }

    update(time, delta) {
        this.handleMovement(time, delta);
        this.updateAnimation(time, delta);
    }

    handleMovement(time, delta) {
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

        // Update facing direction and handle movement audio
        if (velocityX !== 0 || velocityY !== 0) {
            this.facingDirection = newFacingDirection;
            this.isMoving = true;
            
            // Play footstep sounds at intervals while moving
            this.handleMovementAudio(time);
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
            // Update depth when Y position changes for proper layering
            this.updateDepth();
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
        // Switch between idle and walk animations based on movement
        if (this.isMoving) {
            this.playAnimation('walk');
        } else {
            this.playAnimation('idle');
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

    updateDepth() {
        // Set depth based on Y position for proper layering with world objects
        // Objects lower on screen (higher Y values) should appear in front
        this.sprite.setDepth(this.sprite.y + this.tileSize);
    }

    /**
     * Handle movement audio (footstep sounds)
     * @param {number} time - Current game time
     */
    handleMovementAudio(time) {
        if (!this.audioManager || !this.isMoving) return;
        
        // Play footstep sound at intervals while moving
        if (time - this.lastFootstepTime > this.footstepInterval) {
            this.audioManager.playCharacterActionSfx('walk');
            this.lastFootstepTime = time;
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

    /**
     * Use a power through the power system
     * @param {string} powerId - ID of the power to use
     * @param {Object} context - Additional context for power usage
     * @returns {boolean} - Whether power was successfully used
     */
    usePower(powerId, context = {}) {
        // Get power system from GameManager
        const gameManager = this.scene.plugins.get('GameManager');
        if (!gameManager || !gameManager.getPowerSystem()) {
            console.warn('Power system not available');
            return false;
        }

        const powerSystem = gameManager.getPowerSystem();
        
        // Add character context to power usage
        const powerContext = {
            ...context,
            character: this,
            position: this.getPosition(),
            gridPosition: this.getGridPosition(),
            facingDirection: this.facingDirection
        };

        return powerSystem.activatePower(powerId, powerContext);
    }

    /**
     * Check if character can use a specific power
     * @param {string} powerId - ID of the power to check
     * @returns {boolean} - Whether power can be used
     */
    canUsePower(powerId) {
        const gameManager = this.scene.plugins.get('GameManager');
        if (!gameManager || !gameManager.getPowerSystem()) {
            return false;
        }

        const powerSystem = gameManager.getPowerSystem();
        return powerSystem.checkPowerAvailability(powerId);
    }

    /**
     * Get list of unlocked powers for this character
     * @returns {Array} - Array of unlocked power objects
     */
    getUnlockedPowers() {
        const gameManager = this.scene.plugins.get('GameManager');
        if (!gameManager || !gameManager.getPowerSystem()) {
            return [];
        }

        const powerSystem = gameManager.getPowerSystem();
        return powerSystem.getUnlockedPowerList();
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