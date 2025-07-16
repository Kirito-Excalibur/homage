/**
 * PerformanceOptimizer - Handles rendering optimizations and memory management
 */
export default class PerformanceOptimizer {
    constructor(scene) {
        this.scene = scene;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.memoryUsage = 0;
        this.objectPool = new Map();
        this.cullingBounds = { x: 0, y: 0, width: 0, height: 0 };
        this.visibleObjects = new Set();
        this.lastCullTime = 0;
        this.cullInterval = 100; // Cull every 100ms
        
        // Performance monitoring
        this.performanceMetrics = {
            drawCalls: 0,
            textureSwaps: 0,
            objectsRendered: 0,
            memoryUsed: 0,
            frameTime: 0
        };
        
        this.setupObjectPools();
        this.setupFrustumCulling();
    }

    /**
     * Set up object pools for frequently created/destroyed objects
     */
    setupObjectPools() {
        // Pool for particle effects
        this.objectPool.set('particles', []);
        
        // Pool for UI elements
        this.objectPool.set('ui-text', []);
        
        // Pool for temporary sprites
        this.objectPool.set('temp-sprites', []);
        
        // Pool for tween objects
        this.objectPool.set('tweens', []);
    }

    /**
     * Set up frustum culling for off-screen objects
     */
    setupFrustumCulling() {
        if (this.scene.cameras && this.scene.cameras.main) {
            const camera = this.scene.cameras.main;
            this.updateCullingBounds(camera);
        }
    }

    /**
     * Update culling bounds based on camera position
     * @param {Phaser.Cameras.Scene2D.Camera} camera - Scene camera
     */
    updateCullingBounds(camera) {
        const margin = 100; // Extra margin for smooth transitions
        this.cullingBounds = {
            x: camera.scrollX - margin,
            y: camera.scrollY - margin,
            width: camera.width + (margin * 2),
            height: camera.height + (margin * 2)
        };
    }

    /**
     * Check if object is within culling bounds
     * @param {Phaser.GameObjects.GameObject} obj - Object to check
     * @returns {boolean} True if object should be rendered
     */
    isObjectVisible(obj) {
        if (!obj || !obj.getBounds) return true;
        
        const bounds = obj.getBounds();
        return !(bounds.x + bounds.width < this.cullingBounds.x ||
                bounds.x > this.cullingBounds.x + this.cullingBounds.width ||
                bounds.y + bounds.height < this.cullingBounds.y ||
                bounds.y > this.cullingBounds.y + this.cullingBounds.height);
    }

    /**
     * Perform frustum culling on scene objects
     */
    performFrustumCulling() {
        const now = Date.now();
        if (now - this.lastCullTime < this.cullInterval) return;
        
        this.lastCullTime = now;
        this.visibleObjects.clear();
        
        if (this.scene.cameras && this.scene.cameras.main) {
            this.updateCullingBounds(this.scene.cameras.main);
        }
        
        // Cull background layer objects
        if (this.scene.backgroundLayer) {
            this.scene.backgroundLayer.children.entries.forEach(child => {
                const visible = this.isObjectVisible(child);
                child.setVisible(visible);
                if (visible) this.visibleObjects.add(child);
            });
        }
        
        // Cull object layer objects
        if (this.scene.objectLayer) {
            this.scene.objectLayer.children.entries.forEach(child => {
                const visible = this.isObjectVisible(child);
                child.setVisible(visible);
                if (visible) this.visibleObjects.add(child);
            });
        }
        
        this.performanceMetrics.objectsRendered = this.visibleObjects.size;
    }

    /**
     * Get object from pool or create new one
     * @param {string} poolName - Pool name
     * @param {Function} createFn - Function to create new object if pool is empty
     * @returns {*} Object from pool
     */
    getFromPool(poolName, createFn) {
        const pool = this.objectPool.get(poolName);
        if (!pool) return createFn();
        
        if (pool.length > 0) {
            return pool.pop();
        }
        
        return createFn();
    }

    /**
     * Return object to pool
     * @param {string} poolName - Pool name
     * @param {*} obj - Object to return to pool
     */
    returnToPool(poolName, obj) {
        const pool = this.objectPool.get(poolName);
        if (!pool) return;
        
        // Reset object state
        if (obj.setVisible) obj.setVisible(false);
        if (obj.setActive) obj.setActive(false);
        if (obj.x !== undefined) obj.x = 0;
        if (obj.y !== undefined) obj.y = 0;
        if (obj.alpha !== undefined) obj.alpha = 1;
        if (obj.scaleX !== undefined) obj.scaleX = 1;
        if (obj.scaleY !== undefined) obj.scaleY = 1;
        
        pool.push(obj);
        
        // Limit pool size to prevent memory leaks
        if (pool.length > 50) {
            const excess = pool.splice(50);
            excess.forEach(item => {
                if (item.destroy) item.destroy();
            });
        }
    }

    /**
     * Optimize texture usage by batching similar textures
     */
    optimizeTextureBatching() {
        // Group objects by texture for better batching
        const textureGroups = new Map();
        
        this.visibleObjects.forEach(obj => {
            if (obj.texture && obj.texture.key) {
                const key = obj.texture.key;
                if (!textureGroups.has(key)) {
                    textureGroups.set(key, []);
                }
                textureGroups.get(key).push(obj);
            }
        });
        
        // Sort objects by texture to minimize texture swaps
        let depth = 0;
        textureGroups.forEach((objects, textureKey) => {
            objects.forEach(obj => {
                if (obj.setDepth) {
                    obj.setDepth(depth);
                    depth += 0.001; // Small increment to maintain relative ordering
                }
            });
        });
        
        this.performanceMetrics.textureSwaps = textureGroups.size;
    }

    /**
     * Monitor and update performance metrics
     * @param {number} time - Current time
     * @param {number} delta - Time delta
     */
    updatePerformanceMetrics(time, delta) {
        this.frameCount++;
        
        // Calculate FPS every second
        if (time - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = time;
        }
        
        this.performanceMetrics.frameTime = delta;
        
        // Estimate memory usage
        this.estimateMemoryUsage();
        
        // Log performance warnings
        if (this.fps < 30) {
            console.warn(`Low FPS detected: ${this.fps}`);
        }
        
        if (delta > 33) { // More than 33ms per frame (less than 30 FPS)
            console.warn(`High frame time: ${delta}ms`);
        }
    }

    /**
     * Estimate current memory usage
     */
    estimateMemoryUsage() {
        let usage = 0;
        
        // Estimate texture memory
        if (this.scene.textures) {
            for (const [key, texture] of Object.entries(this.scene.textures.list)) {
                if (texture.source && texture.source[0]) {
                    const source = texture.source[0];
                    usage += (source.width || 32) * (source.height || 32) * 4; // RGBA
                }
            }
        }
        
        // Estimate object memory (rough calculation)
        usage += this.scene.children.list.length * 1024; // ~1KB per object
        
        this.performanceMetrics.memoryUsed = usage;
        this.memoryUsage = usage;
    }

    /**
     * Perform garbage collection optimizations
     */
    performGarbageCollection() {
        // Clean up destroyed objects
        this.scene.children.list = this.scene.children.list.filter(child => child.active);
        
        // Clean up unused textures
        if (this.scene.textures) {
            const unusedTextures = [];
            for (const [key, texture] of Object.entries(this.scene.textures.list)) {
                if (key.startsWith('temp_') && !this.isTextureInUse(key)) {
                    unusedTextures.push(key);
                }
            }
            
            unusedTextures.forEach(key => {
                this.scene.textures.remove(key);
            });
        }
        
        // Clean up object pools
        this.objectPool.forEach((pool, poolName) => {
            if (pool.length > 20) {
                const excess = pool.splice(20);
                excess.forEach(item => {
                    if (item.destroy) item.destroy();
                });
            }
        });
    }

    /**
     * Check if texture is currently in use
     * @param {string} textureKey - Texture key to check
     * @returns {boolean} True if texture is in use
     */
    isTextureInUse(textureKey) {
        return this.scene.children.list.some(child => {
            return child.texture && child.texture.key === textureKey;
        });
    }

    /**
     * Optimize animations by reducing update frequency for distant objects
     * @param {Phaser.GameObjects.GameObject} obj - Object to optimize
     * @param {number} distanceFromCamera - Distance from camera
     */
    optimizeAnimationLOD(obj, distanceFromCamera) {
        if (!obj.anims) return;
        
        // Reduce animation frame rate for distant objects
        if (distanceFromCamera > 500) {
            obj.anims.timeScale = 0.5; // Half speed
        } else if (distanceFromCamera > 300) {
            obj.anims.timeScale = 0.75; // 3/4 speed
        } else {
            obj.anims.timeScale = 1; // Full speed
        }
    }

    /**
     * Main update method to be called in scene update loop
     * @param {number} time - Current time
     * @param {number} delta - Time delta
     */
    update(time, delta) {
        this.updatePerformanceMetrics(time, delta);
        this.performFrustumCulling();
        this.optimizeTextureBatching();
        
        // Perform garbage collection every 5 seconds
        if (time % 5000 < delta) {
            this.performGarbageCollection();
        }
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            fps: this.fps,
            memoryUsage: this.memoryUsage,
            visibleObjects: this.visibleObjects.size
        };
    }

    /**
     * Enable or disable performance optimizations
     * @param {boolean} enabled - Whether optimizations should be enabled
     */
    setOptimizationsEnabled(enabled) {
        this.optimizationsEnabled = enabled;
        console.log(`Performance optimizations ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Destroy the performance optimizer and clean up resources
     */
    destroy() {
        this.visibleObjects.clear();
        
        // Clean up object pools
        this.objectPool.forEach((pool) => {
            pool.forEach(item => {
                if (item.destroy) item.destroy();
            });
            pool.length = 0;
        });
        
        this.objectPool.clear();
    }
}