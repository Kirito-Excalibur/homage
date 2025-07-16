/**
 * Enemy - Represents enemy entities in the game world
 * Handles enemy behavior, AI, and combat interactions
 */
export default class Enemy {
    constructor(scene, x, y, enemyType = 'basic') {
        this.scene = scene;
        this.tileSize = 32;
        this.enemyType = enemyType;
        
        // Create enemy sprite
        this.createEnemySprite(x, y);
        
        // Enemy properties
        this.health = this.getEnemyStats().health;
        this.maxHealth = this.health;
        this.speed = this.getEnemyStats().speed;
        this.damage = this.getEnemyStats().damage;
        this.detectionRange = this.getEnemyStats().detectionRange;
        this.attackRange = this.getEnemyStats().attackRange;
        
        // AI state
        this.aiState = 'idle'; // idle, patrol, chase, attack, defeated
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000; // 2 seconds
        
        // Movement
        this.isMoving = false;
        this.facingDirection = 'down';
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        
        // Combat
        this.isDefeated = false;
        this.combatActive = false;
        
        // Store grid position
        this.gridX = Math.floor(x / this.tileSize);
        this.gridY = Math.floor(y / this.tileSize);
        
        console.log(`Enemy created: ${enemyType} at (${x}, ${y})`);
    }

    /**
     * Create enemy sprite based on type
     */
    createEnemySprite(x, y) {
        // Create placeholder enemy sprite
        const graphics = this.scene.add.graphics();
        
        switch (this.enemyType) {
            case 'basic':
                graphics.fillStyle(0xe74c3c); // Red
                graphics.fillRect(0, 0, this.tileSize, this.tileSize);
                graphics.fillStyle(0xffffff);
                graphics.fillCircle(this.tileSize/2, this.tileSize/2, 6);
                break;
            case 'guard':
                graphics.fillStyle(0x8e44ad); // Purple
                graphics.fillRect(0, 0, this.tileSize, this.tileSize);
                graphics.fillStyle(0xffffff);
                graphics.fillRect(this.tileSize/4, this.tileSize/4, this.tileSize/2, this.tileSize/2);
                break;
            case 'scout':
                graphics.fillStyle(0xf39c12); // Orange
                graphics.fillRect(0, 0, this.tileSize, this.tileSize);
                graphics.fillStyle(0x2c3e50);
                graphics.fillCircle(this.tileSize/2, this.tileSize/2, 8);
                break;
            default:
                graphics.fillStyle(0x95a5a6); // Gray
                graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        }
        
        graphics.generateTexture(`enemy-${this.enemyType}`, this.tileSize, this.tileSize);
        graphics.destroy();
        
        // Create sprite
        this.sprite = this.scene.add.sprite(x, y, `enemy-${this.enemyType}`);
        this.sprite.setOrigin(0, 0);
        this.sprite.setDepth(y + this.tileSize);
        
        // Add health bar
        this.createHealthBar();
    }

    /**
     * Create health bar above enemy
     */
    createHealthBar() {
        this.healthBarBg = this.scene.add.rectangle(
            this.sprite.x + this.tileSize/2,
            this.sprite.y - 8,
            this.tileSize,
            4,
            0x2c3e50
        );
        this.healthBarBg.setDepth(this.sprite.depth + 1);
        
        this.healthBar = this.scene.add.rectangle(
            this.sprite.x + this.tileSize/2,
            this.sprite.y - 8,
            this.tileSize,
            4,
            0xe74c3c
        );
        this.healthBar.setDepth(this.sprite.depth + 1);
        
        // Initially hide health bars
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
    }

    /**
     * Get enemy stats based on type
     */
    getEnemyStats() {
        const stats = {
            basic: {
                health: 30,
                speed: 60,
                damage: 10,
                detectionRange: 96, // 3 tiles
                attackRange: 32 // 1 tile
            },
            guard: {
                health: 50,
                speed: 40,
                damage: 15,
                detectionRange: 128, // 4 tiles
                attackRange: 32
            },
            scout: {
                health: 20,
                speed: 100,
                damage: 8,
                detectionRange: 160, // 5 tiles
                attackRange: 64 // 2 tiles
            }
        };
        
        return stats[this.enemyType] || stats.basic;
    }

    /**
     * Update enemy AI and behavior
     */
    update(time, delta) {
        if (this.isDefeated) return;
        
        this.updateAI(time, delta);
        this.updateMovement(delta);
        this.updateHealthBar();
    }

    /**
     * Update AI behavior
     */
    updateAI(time, delta) {
        const player = this.scene.player;
        if (!player) return;
        
        const playerPos = player.getPosition();
        const enemyPos = this.getPosition();
        const distanceToPlayer = Phaser.Math.Distance.Between(
            playerPos.x, playerPos.y,
            enemyPos.x, enemyPos.y
        );
        
        switch (this.aiState) {
            case 'idle':
                // Check if player is in detection range
                if (distanceToPlayer <= this.detectionRange) {
                    this.aiState = 'chase';
                    this.target = player;
                    this.showHealthBar();
                }
                break;
                
            case 'chase':
                // Chase the player
                if (distanceToPlayer > this.detectionRange * 1.5) {
                    // Lost player, return to idle
                    this.aiState = 'idle';
                    this.target = null;
                    this.hideHealthBar();
                } else if (distanceToPlayer <= this.attackRange) {
                    // Close enough to attack
                    this.aiState = 'attack';
                } else {
                    // Move towards player
                    this.moveTowards(playerPos);
                }
                break;
                
            case 'attack':
                // Attack the player
                if (distanceToPlayer > this.attackRange) {
                    // Player moved away, chase again
                    this.aiState = 'chase';
                } else if (time - this.lastAttackTime >= this.attackCooldown) {
                    this.attackPlayer(time);
                }
                break;
        }
    }

    /**
     * Move towards a target position
     */
    moveTowards(targetPos) {
        const currentPos = this.getPosition();
        const angle = Phaser.Math.Angle.Between(
            currentPos.x, currentPos.y,
            targetPos.x, targetPos.y
        );
        
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        this.isMoving = true;
        
        // Update facing direction
        if (Math.abs(this.velocityX) > Math.abs(this.velocityY)) {
            this.facingDirection = this.velocityX > 0 ? 'right' : 'left';
        } else {
            this.facingDirection = this.velocityY > 0 ? 'down' : 'up';
        }
    }

    /**
     * Update movement
     */
    updateMovement(delta) {
        if (!this.isMoving) return;
        
        const deltaSeconds = delta / 1000;
        let newX = this.sprite.x + (this.velocityX * deltaSeconds);
        let newY = this.sprite.y + (this.velocityY * deltaSeconds);
        
        // Check collision boundaries
        const collision = this.checkCollision(newX, newY);
        
        if (!collision.x) {
            this.sprite.x = newX;
            this.gridX = Math.floor(this.sprite.x / this.tileSize);
        }
        
        if (!collision.y) {
            this.sprite.y = newY;
            this.gridY = Math.floor(this.sprite.y / this.tileSize);
            this.sprite.setDepth(this.sprite.y + this.tileSize);
        }
        
        // Stop moving if hit collision
        if (collision.x || collision.y) {
            this.isMoving = false;
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }

    /**
     * Check collision with world boundaries and obstacles
     */
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

        return collision;
    }

    /**
     * Attack the player
     */
    attackPlayer(time) {
        this.lastAttackTime = time;
        
        // Create attack visual effect
        this.createAttackEffect();
        
        // Trigger combat in the scene
        if (this.scene.startCombat) {
            this.scene.startCombat(this);
        }
        
        console.log(`Enemy ${this.enemyType} attacks player for ${this.damage} damage`);
    }

    /**
     * Create visual attack effect
     */
    createAttackEffect() {
        const attackEffect = this.scene.add.circle(
            this.sprite.x + this.tileSize/2,
            this.sprite.y + this.tileSize/2,
            this.tileSize/2,
            0xff0000,
            0.6
        );
        attackEffect.setDepth(this.sprite.depth + 1);
        
        this.scene.tweens.add({
            targets: attackEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => attackEffect.destroy()
        });
    }

    /**
     * Take damage from player attack
     */
    takeDamage(damage) {
        if (this.isDefeated) return false;
        
        this.health -= damage;
        this.showHealthBar();
        
        // Create damage effect
        this.createDamageEffect(damage);
        
        if (this.health <= 0) {
            this.defeat();
            return true; // Enemy defeated
        }
        
        // Enter combat state if not already
        if (this.aiState === 'idle') {
            this.aiState = 'chase';
            this.target = this.scene.player;
        }
        
        return false;
    }

    /**
     * Create damage number effect
     */
    createDamageEffect(damage) {
        const damageText = this.scene.add.text(
            this.sprite.x + this.tileSize/2,
            this.sprite.y,
            `-${damage}`,
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        damageText.setOrigin(0.5);
        damageText.setDepth(this.sprite.depth + 2);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => damageText.destroy()
        });
        
        // Flash enemy sprite
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite) {
                this.sprite.clearTint();
            }
        });
    }

    /**
     * Defeat the enemy
     */
    defeat() {
        this.isDefeated = true;
        this.aiState = 'defeated';
        this.isMoving = false;
        
        // Hide health bar
        this.hideHealthBar();
        
        // Create defeat effect
        this.createDefeatEffect();
        
        // Notify scene of enemy defeat
        if (this.scene.onEnemyDefeated) {
            this.scene.onEnemyDefeated(this);
        }
        
        console.log(`Enemy ${this.enemyType} defeated`);
    }

    /**
     * Create defeat visual effect
     */
    createDefeatEffect() {
        // Fade out enemy sprite
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            onComplete: () => {
                // Don't destroy immediately, let scene handle cleanup
                this.sprite.setVisible(false);
            }
        });
        
        // Create defeat particles effect
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(
                this.sprite.x + this.tileSize/2,
                this.sprite.y + this.tileSize/2,
                3,
                0xf39c12
            );
            particle.setDepth(this.sprite.depth + 1);
            particles.push(particle);
            
            const angle = (i / 8) * Math.PI * 2;
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 40,
                y: particle.y + Math.sin(angle) * 40,
                alpha: 0,
                duration: 800,
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Show health bar
     */
    showHealthBar() {
        this.healthBarBg.setVisible(true);
        this.healthBar.setVisible(true);
    }

    /**
     * Hide health bar
     */
    hideHealthBar() {
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
    }

    /**
     * Update health bar display
     */
    updateHealthBar() {
        if (!this.healthBar.visible) return;
        
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scaleX = healthPercent;
        
        // Update health bar position to follow sprite
        this.healthBarBg.x = this.sprite.x + this.tileSize/2;
        this.healthBarBg.y = this.sprite.y - 8;
        this.healthBar.x = this.sprite.x + this.tileSize/2;
        this.healthBar.y = this.sprite.y - 8;
        
        // Update depth
        this.healthBarBg.setDepth(this.sprite.depth + 1);
        this.healthBar.setDepth(this.sprite.depth + 1);
    }

    /**
     * Get enemy position
     */
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    /**
     * Get enemy grid position
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Check if enemy is in combat range of player
     */
    isInCombatRange() {
        if (!this.scene.player) return false;
        
        const playerPos = this.scene.player.getPosition();
        const enemyPos = this.getPosition();
        const distance = Phaser.Math.Distance.Between(
            playerPos.x, playerPos.y,
            enemyPos.x, enemyPos.y
        );
        
        return distance <= this.attackRange;
    }

    /**
     * Get enemy combat stats
     */
    getCombatStats() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            damage: this.damage,
            type: this.enemyType,
            isDefeated: this.isDefeated
        };
    }

    /**
     * Destroy enemy and clean up resources
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
        }
    }
}