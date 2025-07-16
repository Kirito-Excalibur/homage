import AssetManager from '../managers/AssetManager.js';
import { ASSET_MANIFEST, CRITICAL_ASSETS, getAssetsByPriority } from '../config/assetManifest.js';

/**
 * LoadingScene - Handles initial asset loading with progress indicators
 * Shows loading screen while assets are being loaded
 */
export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
        this.assetManager = null;
        this.loadingComplete = false;
        this.targetScene = 'MainMenuScene';
        this.loadingStartTime = 0;
        this.minimumLoadingTime = 1000; // Minimum 1 second loading screen
    }

    init(data) {
        // Allow specifying target scene and loading options
        this.targetScene = data.targetScene || 'MainMenuScene';
        this.loadCriticalOnly = data.criticalOnly || false;
        this.showProgress = data.showProgress !== false; // Default to true
    }

    preload() {
        // Set up basic loading for the loading screen itself
        this.loadingStartTime = Date.now();
        
        // Create asset manager
        this.assetManager = new AssetManager(this);
        
        // Set up loading event listeners
        this.setupLoadingEvents();
        
        // Start loading assets
        this.startAssetLoading();
    }

    create() {
        // Initialize audio for this scene
        this.initializeAudio();
        
        // Create loading screen UI
        this.createLoadingScreen();
        
        // Add input handling for skip option (development only)
        this.setupInputHandling();
        
        // Start loading animation
        this.startLoadingAnimation();
    }

    /**
     * Initialize audio for this scene
     */
    initializeAudio() {
        const gameManager = this.plugins.get('GameManager');
        if (gameManager && gameManager.getAudioManager()) {
            this.audioManager = gameManager.getAudioManager();
            // Start loading theme music
            this.audioManager.playBackgroundMusic('loading_theme');
            console.log('LoadingScene audio initialized');
        } else {
            console.warn('AudioManager not available in LoadingScene');
        }
    }

    /**
     * Set up loading event listeners
     */
    setupLoadingEvents() {
        // Listen for individual file loading
        this.load.on('progress', (progress) => {
            this.updateProgress(progress * 100);
        });

        this.load.on('complete', () => {
            this.onLoadingComplete();
        });

        this.load.on('fileerror', (file) => {
            console.warn(`Failed to load file: ${file.src}`);
        });

        // Listen for asset manager events
        if (this.assetManager) {
            // Custom progress updates from asset manager
            this.events.on('asset-progress', (data) => {
                this.updateDetailedProgress(data);
            });
        }
    }

    /**
     * Start loading assets based on configuration
     */
    async startAssetLoading() {
        try {
            if (this.loadCriticalOnly) {
                // Load only critical assets for faster startup
                await this.assetManager.preloadCriticalAssets(CRITICAL_ASSETS);
            } else {
                // Load assets by priority (load high priority first)
                const highPriorityAssets = getAssetsByPriority(2);
                await this.assetManager.preloadAssets(
                    highPriorityAssets,
                    (progress) => this.events.emit('asset-progress', progress),
                    (stats) => this.onAssetLoadingComplete(stats)
                );
                
                // Load remaining assets in background
                this.loadRemainingAssets();
            }
        } catch (error) {
            console.error('Asset loading failed:', error);
            this.onLoadingError(error);
        }
    }

    /**
     * Load remaining lower priority assets in background
     */
    async loadRemainingAssets() {
        try {
            const lowPriorityAssets = getAssetsByPriority(5);
            
            // Remove already loaded assets
            const remainingAssets = this.filterUnloadedAssets(lowPriorityAssets);
            
            if (Object.keys(remainingAssets.sprites).length > 0 || 
                Object.keys(remainingAssets.ui).length > 0 ||
                Object.keys(remainingAssets.audio).length > 0 ||
                Object.keys(remainingAssets.data).length > 0) {
                
                console.log('Loading remaining assets in background...');
                
                // Load in background without blocking scene transition
                setTimeout(async () => {
                    await this.assetManager.preloadAssets(remainingAssets);
                    console.log('Background asset loading complete');
                }, 100);
            }
        } catch (error) {
            console.warn('Background asset loading failed:', error);
        }
    }

    /**
     * Filter out already loaded assets
     * @param {Object} assetManifest - Full asset manifest
     * @returns {Object} Filtered manifest with only unloaded assets
     */
    filterUnloadedAssets(assetManifest) {
        const filtered = {
            sprites: {},
            ui: {},
            audio: {},
            data: {}
        };

        for (const [category, assets] of Object.entries(assetManifest)) {
            for (const [key, assetData] of Object.entries(assets)) {
                if (!this.assetManager.isAssetLoaded(category, key)) {
                    filtered[category][key] = assetData;
                }
            }
        }

        return filtered;
    }

    /**
     * Create loading screen UI elements
     */
    createLoadingScreen() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Background
        this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x1a1a1a);

        // Game title
        this.titleText = this.add.text(centerX, centerY - 150, 'Top-Down Web RPG', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Loading text
        this.loadingText = this.add.text(centerX, centerY - 50, 'Loading...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Progress bar background
        this.progressBarBg = this.add.rectangle(centerX, centerY, 400, 20, 0x333333);
        this.progressBarBg.setStrokeStyle(2, 0x666666);

        // Progress bar fill
        this.progressBar = this.add.rectangle(centerX - 200, centerY, 0, 16, 0x3498db);
        this.progressBar.setOrigin(0, 0.5);

        // Progress percentage
        this.progressText = this.add.text(centerX, centerY + 40, '0%', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Detailed loading info
        this.detailText = this.add.text(centerX, centerY + 80, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        // Loading tips (optional)
        this.createLoadingTips(centerY + 120);

        // Skip button (development only)
        if (this.isDevelopmentMode()) {
            this.createSkipButton(centerY + 200);
        }
    }

    /**
     * Create loading tips display
     * @param {number} y - Y position for tips
     */
    createLoadingTips(y) {
        const tips = [
            "Use WASD or arrow keys to move your character",
            "Press ESC to return to the main menu",
            "F5 to quick save, F9 to quick load",
            "Explore the world to discover story events",
            "Powers unlock as you progress through the story",
            "Check your inventory with the I key"
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        this.add.text(this.cameras.main.centerX, y, 'Tip: ' + randomTip, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#f39c12',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);
    }

    /**
     * Create skip button for development
     * @param {number} y - Y position for button
     */
    createSkipButton(y) {
        const skipButton = this.add.rectangle(this.cameras.main.centerX, y, 150, 40, 0x666666);
        const skipText = this.add.text(this.cameras.main.centerX, y, 'Skip Loading', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        skipButton.setInteractive({ useHandCursor: true });
        skipButton.on('pointerdown', () => {
            this.skipLoading();
        });

        skipButton.on('pointerover', () => {
            skipButton.setFillStyle(0x888888);
        });

        skipButton.on('pointerout', () => {
            skipButton.setFillStyle(0x666666);
        });
    }

    /**
     * Set up input handling
     */
    setupInputHandling() {
        // Allow skipping with spacebar in development
        if (this.isDevelopmentMode()) {
            this.input.keyboard.on('keydown-SPACE', () => {
                this.skipLoading();
            });
        }
    }

    /**
     * Start loading animation
     */
    startLoadingAnimation() {
        // Animate loading text
        this.tweens.add({
            targets: this.loadingText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });

        // Animate title
        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Update loading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgress(progress) {
        if (this.progressBar) {
            this.progressBar.width = (progress / 100) * 400;
        }
        
        if (this.progressText) {
            this.progressText.setText(`${Math.round(progress)}%`);
        }
    }

    /**
     * Update detailed progress information
     * @param {Object} data - Detailed progress data
     */
    updateDetailedProgress(data) {
        if (this.detailText) {
            this.detailText.setText(`Loading ${data.category}: ${data.key} (${data.loaded}/${data.total})`);
        }
        
        this.updateProgress(data.progress);
    }

    /**
     * Handle loading completion
     */
    onLoadingComplete() {
        this.loadingComplete = true;
        
        // Ensure minimum loading time has passed
        const elapsedTime = Date.now() - this.loadingStartTime;
        const remainingTime = Math.max(0, this.minimumLoadingTime - elapsedTime);
        
        setTimeout(() => {
            this.transitionToTargetScene();
        }, remainingTime);
    }

    /**
     * Handle asset loading completion
     * @param {Object} stats - Loading statistics
     */
    onAssetLoadingComplete(stats) {
        console.log('Asset loading complete:', stats);
        
        if (this.loadingText) {
            this.loadingText.setText('Loading Complete!');
        }
        
        if (this.detailText) {
            this.detailText.setText(`Loaded ${stats.loaded} assets, ${stats.failed} failed`);
        }
        
        this.onLoadingComplete();
    }

    /**
     * Handle loading errors
     * @param {Error} error - Loading error
     */
    onLoadingError(error) {
        console.error('Loading error:', error);
        
        if (this.loadingText) {
            this.loadingText.setText('Loading Error - Continuing with fallbacks');
            this.loadingText.setColor('#e74c3c');
        }
        
        if (this.detailText) {
            this.detailText.setText('Some assets failed to load, using fallbacks');
        }
        
        // Continue to game even with errors
        setTimeout(() => {
            this.transitionToTargetScene();
        }, 2000);
    }

    /**
     * Transition to the target scene
     */
    transitionToTargetScene() {
        // Fade out loading screen
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Clean up asset manager
            if (this.assetManager) {
                // Don't destroy completely, just clean up loading screen
                this.assetManager.hideLoadingScreen();
            }
            
            // Start target scene
            this.scene.start(this.targetScene);
        });
    }

    /**
     * Skip loading (development only)
     */
    skipLoading() {
        if (!this.isDevelopmentMode()) {
            return;
        }
        
        console.log('Skipping loading (development mode)');
        this.transitionToTargetScene();
    }

    /**
     * Check if in development mode
     * @returns {boolean} True if in development
     */
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('dev=true');
    }

    update() {
        // Update asset manager if it exists
        if (this.assetManager) {
            this.assetManager.update();
        }
    }

    /**
     * Clean up when scene is destroyed
     */
    destroy() {
        if (this.assetManager) {
            this.assetManager.destroy();
        }
        super.destroy();
    }
}