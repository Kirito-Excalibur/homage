/**
 * AssetManager - Comprehensive asset loading and management system
 * Handles preloading, caching, fallbacks, and loading screens
 */
export default class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Map();
        this.failedAssets = new Map();
        this.loadingQueue = [];
        this.isLoading = false;
        this.loadingProgress = 0;
        this.totalAssets = 0;
        this.loadedCount = 0;
        
        // Asset categories for organized loading
        this.assetCategories = {
            sprites: new Map(),
            audio: new Map(),
            data: new Map(),
            ui: new Map()
        };
        
        // Fallback assets
        this.fallbackAssets = new Map();
        this.initializeFallbacks();
        
        // Loading screen elements
        this.loadingScreen = null;
        this.progressBar = null;
        this.loadingText = null;
        
        // Memory management
        this.memoryThreshold = 100 * 1024 * 1024; // 100MB threshold
        this.lastCleanup = Date.now();
        this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize fallback assets for missing or failed loads
     */
    initializeFallbacks() {
        // Create simple colored rectangles as fallback sprites
        this.fallbackAssets.set('sprite', {
            type: 'rectangle',
            width: 32,
            height: 32,
            color: 0x888888
        });
        
        this.fallbackAssets.set('ui', {
            type: 'rectangle',
            width: 64,
            height: 32,
            color: 0x444444
        });
        
        this.fallbackAssets.set('tile', {
            type: 'rectangle',
            width: 32,
            height: 32,
            color: 0x666666
        });
        
        this.fallbackAssets.set('character', {
            type: 'rectangle',
            width: 32,
            height: 32,
            color: 0x3498db
        });
    }

    /**
     * Preload all game assets with progress tracking
     * @param {Object} assetManifest - Manifest of all assets to load
     * @param {Function} onProgress - Progress callback
     * @param {Function} onComplete - Completion callback
     */
    async preloadAssets(assetManifest, onProgress = null, onComplete = null) {
        this.isLoading = true;
        this.loadingProgress = 0;
        this.loadedCount = 0;
        this.totalAssets = this.countTotalAssets(assetManifest);
        
        // Show loading screen
        this.showLoadingScreen();
        
        try {
            // Load assets by category for better organization
            await this.loadAssetCategory('sprites', assetManifest.sprites || {}, onProgress);
            await this.loadAssetCategory('ui', assetManifest.ui || {}, onProgress);
            await this.loadAssetCategory('audio', assetManifest.audio || {}, onProgress);
            await this.loadAssetCategory('data', assetManifest.data || {}, onProgress);
            
            // Wait for all Phaser loading to complete
            await this.waitForPhaserLoading();
            
            this.isLoading = false;
            this.hideLoadingScreen();
            
            if (onComplete) {
                onComplete({
                    loaded: this.loadedCount,
                    failed: this.failedAssets.size,
                    total: this.totalAssets
                });
            }
            
            console.log(`Asset loading complete: ${this.loadedCount}/${this.totalAssets} loaded, ${this.failedAssets.size} failed`);
            
        } catch (error) {
            console.error('Asset loading failed:', error);
            this.isLoading = false;
            this.hideLoadingScreen();
            throw error;
        }
    }

    /**
     * Load assets for a specific category
     * @param {string} category - Asset category name
     * @param {Object} assets - Assets in this category
     * @param {Function} onProgress - Progress callback
     */
    async loadAssetCategory(category, assets, onProgress) {
        const categoryMap = this.assetCategories[category];
        if (!categoryMap) {
            console.warn(`Unknown asset category: ${category}`);
            return;
        }
        
        for (const [key, assetData] of Object.entries(assets)) {
            try {
                await this.loadSingleAsset(category, key, assetData);
                categoryMap.set(key, assetData);
                this.loadedAssets.set(`${category}:${key}`, assetData);
                this.loadedCount++;
                
                this.updateLoadingProgress();
                
                if (onProgress) {
                    onProgress({
                        category,
                        key,
                        loaded: this.loadedCount,
                        total: this.totalAssets,
                        progress: this.loadingProgress
                    });
                }
                
            } catch (error) {
                console.warn(`Failed to load ${category} asset: ${key}`, error);
                this.failedAssets.set(`${category}:${key}`, error);
                
                // Use fallback asset
                this.createFallbackAsset(category, key, assetData);
                this.loadedCount++;
                this.updateLoadingProgress();
            }
        }
    }

    /**
     * Load a single asset
     * @param {string} category - Asset category
     * @param {string} key - Asset key
     * @param {Object} assetData - Asset data
     */
    async loadSingleAsset(category, key, assetData) {
        return new Promise((resolve, reject) => {
            const loader = this.scene.load;
            
            // Set up error handling for this specific asset
            const onError = (file) => {
                if (file.key === key) {
                    loader.off('fileerror', onError);
                    loader.off('filecomplete', onComplete);
                    reject(new Error(`Failed to load ${file.src}`));
                }
            };
            
            const onComplete = (file) => {
                if (file.key === key) {
                    loader.off('fileerror', onError);
                    loader.off('filecomplete', onComplete);
                    resolve();
                }
            };
            
            loader.on('fileerror', onError);
            loader.on('filecomplete', onComplete);
            
            // Load based on asset type
            switch (category) {
                case 'sprites':
                    if (assetData.type === 'spritesheet') {
                        loader.spritesheet(key, assetData.url, assetData.frameConfig);
                    } else {
                        loader.image(key, assetData.url);
                    }
                    break;
                    
                case 'ui':
                    loader.image(key, assetData.url);
                    break;
                    
                case 'audio':
                    if (Array.isArray(assetData.url)) {
                        loader.audio(key, assetData.url);
                    } else {
                        loader.audio(key, [assetData.url]);
                    }
                    break;
                    
                case 'data':
                    if (assetData.type === 'json') {
                        loader.json(key, assetData.url);
                    } else {
                        loader.text(key, assetData.url);
                    }
                    break;
                    
                default:
                    loader.image(key, assetData.url);
            }
            
            // Start loading if not already started
            if (!loader.isLoading()) {
                loader.start();
            }
        });
    }

    /**
     * Create fallback asset when original fails to load
     * @param {string} category - Asset category
     * @param {string} key - Asset key
     * @param {Object} originalData - Original asset data
     */
    createFallbackAsset(category, key, originalData) {
        const fallback = this.fallbackAssets.get(category) || this.fallbackAssets.get('sprite');
        
        // Create a simple colored rectangle as fallback
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(fallback.color);
        graphics.fillRect(0, 0, fallback.width, fallback.height);
        
        // Generate texture from graphics
        graphics.generateTexture(key, fallback.width, fallback.height);
        graphics.destroy();
        
        console.log(`Created fallback asset for ${category}:${key}`);
    }

    /**
     * Wait for Phaser's loading system to complete
     */
    async waitForPhaserLoading() {
        return new Promise((resolve) => {
            if (!this.scene.load.isLoading()) {
                resolve();
                return;
            }
            
            const onComplete = () => {
                this.scene.load.off('complete', onComplete);
                resolve();
            };
            
            this.scene.load.on('complete', onComplete);
        });
    }

    /**
     * Show loading screen with progress indicator
     */
    showLoadingScreen() {
        if (this.loadingScreen) {
            return; // Already showing
        }
        
        // Create loading screen container
        this.loadingScreen = this.scene.add.container(0, 0);
        this.loadingScreen.setScrollFactor(0);
        this.loadingScreen.setDepth(10000);
        
        // Background overlay
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.8
        );
        
        // Loading text
        this.loadingText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 50,
            'Loading Assets...',
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        // Progress bar background
        const progressBg = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 20,
            400,
            20,
            0x333333
        );
        
        // Progress bar fill
        this.progressBar = this.scene.add.rectangle(
            this.scene.cameras.main.centerX - 200,
            this.scene.cameras.main.centerY + 20,
            0,
            16,
            0x3498db
        );
        this.progressBar.setOrigin(0, 0.5);
        
        // Progress percentage text
        this.progressText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 60,
            '0%',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Add all elements to container
        this.loadingScreen.add([overlay, this.loadingText, progressBg, this.progressBar, this.progressText]);
    }

    /**
     * Update loading progress display
     */
    updateLoadingProgress() {
        this.loadingProgress = (this.loadedCount / this.totalAssets) * 100;
        
        if (this.progressBar) {
            this.progressBar.width = (this.loadingProgress / 100) * 400;
        }
        
        if (this.progressText) {
            this.progressText.setText(`${Math.round(this.loadingProgress)}%`);
        }
        
        if (this.loadingText) {
            this.loadingText.setText(`Loading Assets... (${this.loadedCount}/${this.totalAssets})`);
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.destroy();
            this.loadingScreen = null;
            this.progressBar = null;
            this.loadingText = null;
            this.progressText = null;
        }
    }

    /**
     * Count total assets in manifest
     * @param {Object} manifest - Asset manifest
     * @returns {number} Total asset count
     */
    countTotalAssets(manifest) {
        let total = 0;
        for (const category of Object.values(manifest)) {
            if (typeof category === 'object') {
                total += Object.keys(category).length;
            }
        }
        return total;
    }

    /**
     * Get asset by category and key
     * @param {string} category - Asset category
     * @param {string} key - Asset key
     * @returns {*} Asset data or null
     */
    getAsset(category, key) {
        const categoryMap = this.assetCategories[category];
        if (categoryMap && categoryMap.has(key)) {
            return categoryMap.get(key);
        }
        
        // Check if asset exists in Phaser's cache
        const fullKey = `${category}:${key}`;
        if (this.scene.textures.exists(key) || this.scene.cache.json.exists(key) || this.scene.cache.audio.exists(key)) {
            return { key, loaded: true };
        }
        
        return null;
    }

    /**
     * Check if asset is loaded
     * @param {string} category - Asset category
     * @param {string} key - Asset key
     * @returns {boolean} True if loaded
     */
    isAssetLoaded(category, key) {
        return this.loadedAssets.has(`${category}:${key}`) || this.getAsset(category, key) !== null;
    }

    /**
     * Get loading statistics
     * @returns {Object} Loading stats
     */
    getLoadingStats() {
        return {
            isLoading: this.isLoading,
            progress: this.loadingProgress,
            loaded: this.loadedCount,
            failed: this.failedAssets.size,
            total: this.totalAssets,
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Estimate memory usage (rough calculation)
     * @returns {number} Estimated memory usage in bytes
     */
    getMemoryUsage() {
        // This is a rough estimation based on loaded assets
        let usage = 0;
        
        // Estimate texture memory usage
        for (const texture of this.scene.textures.list) {
            if (texture.source && texture.source[0]) {
                const source = texture.source[0];
                usage += (source.width || 32) * (source.height || 32) * 4; // RGBA
            }
        }
        
        return usage;
    }

    /**
     * Clean up unused assets to free memory
     */
    performMemoryCleanup() {
        const now = Date.now();
        if (now - this.lastCleanup < this.cleanupInterval) {
            return;
        }
        
        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage < this.memoryThreshold) {
            return;
        }
        
        console.log(`Performing memory cleanup. Current usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        
        // Remove unused textures (this is a basic implementation)
        // In a real game, you'd track which assets are actually being used
        const textureManager = this.scene.textures;
        const unusedTextures = [];
        
        for (const [key, texture] of Object.entries(textureManager.list)) {
            if (key.startsWith('__') || key === '__DEFAULT' || key === '__MISSING') {
                continue; // Skip system textures
            }
            
            // Check if texture is being used (basic check)
            // This would need more sophisticated tracking in a real implementation
            if (!this.isTextureInUse(key)) {
                unusedTextures.push(key);
            }
        }
        
        // Remove unused textures
        unusedTextures.forEach(key => {
            textureManager.remove(key);
        });
        
        this.lastCleanup = now;
        console.log(`Cleaned up ${unusedTextures.length} unused textures`);
    }

    /**
     * Check if a texture is currently in use (basic implementation)
     * @param {string} textureKey - Texture key to check
     * @returns {boolean} True if in use
     */
    isTextureInUse(textureKey) {
        // This is a simplified check - in a real implementation you'd track usage more precisely
        return this.scene.children.list.some(child => {
            return child.texture && child.texture.key === textureKey;
        });
    }

    /**
     * Preload critical assets first (for faster startup)
     * @param {Object} criticalAssets - Critical assets to load first
     */
    async preloadCriticalAssets(criticalAssets) {
        console.log('Preloading critical assets...');
        
        const criticalCount = this.countTotalAssets(criticalAssets);
        let loadedCritical = 0;
        
        for (const [category, assets] of Object.entries(criticalAssets)) {
            for (const [key, assetData] of Object.entries(assets)) {
                try {
                    await this.loadSingleAsset(category, key, assetData);
                    loadedCritical++;
                    console.log(`Critical asset loaded: ${category}:${key} (${loadedCritical}/${criticalCount})`);
                } catch (error) {
                    console.warn(`Failed to load critical asset ${category}:${key}`, error);
                    this.createFallbackAsset(category, key, assetData);
                }
            }
        }
        
        console.log(`Critical assets loaded: ${loadedCritical}/${criticalCount}`);
    }

    /**
     * Update method to be called in scene update loop
     */
    update() {
        // Perform periodic memory cleanup
        this.performMemoryCleanup();
    }

    /**
     * Destroy the asset manager and clean up resources
     */
    destroy() {
        this.hideLoadingScreen();
        this.loadedAssets.clear();
        this.failedAssets.clear();
        this.loadingQueue = [];
        
        for (const category of Object.values(this.assetCategories)) {
            category.clear();
        }
    }
}