/**
 * ResponsiveDesign - Handles responsive design and screen adaptation
 */
export default class ResponsiveDesign {
    constructor(game) {
        this.game = game;
        this.currentBreakpoint = 'desktop';
        this.breakpoints = {
            mobile: { max: 768 },
            tablet: { min: 769, max: 1024 },
            desktop: { min: 1025 }
        };
        this.orientationChangeHandlers = [];
        this.resizeHandlers = [];
        
        this.init();
    }

    /**
     * Initialize responsive design system
     */
    init() {
        this.detectBreakpoint();
        this.setupEventListeners();
        this.adaptGameToScreen();
        this.setupPerformanceMonitoring();
    }

    /**
     * Detect current screen breakpoint
     */
    detectBreakpoint() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.mobile.max) {
            this.currentBreakpoint = 'mobile';
        } else if (width >= this.breakpoints.tablet.min && width <= this.breakpoints.tablet.max) {
            this.currentBreakpoint = 'tablet';
        } else {
            this.currentBreakpoint = 'desktop';
        }
    }

    /**
     * Set up event listeners for responsive behavior
     */
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Orientation change handler
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100); // Small delay to ensure dimensions are updated
        });

        // Visibility change handler for performance optimization
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const oldBreakpoint = this.currentBreakpoint;
        this.detectBreakpoint();
        
        if (oldBreakpoint !== this.currentBreakpoint) {
            this.adaptGameToScreen();
            this.notifyBreakpointChange(oldBreakpoint, this.currentBreakpoint);
        }
        
        // Update game scale
        this.updateGameScale();
        
        // Notify resize handlers
        this.resizeHandlers.forEach(handler => handler(this.currentBreakpoint));
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        this.detectBreakpoint();
        this.adaptGameToScreen();
        
        // Notify orientation change handlers
        this.orientationChangeHandlers.forEach(handler => handler(this.currentBreakpoint));
    }

    /**
     * Handle visibility change for performance optimization
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Game is not visible, reduce performance
            this.game.loop.targetFps = 30;
            console.log('Game hidden, reducing FPS to 30');
        } else {
            // Game is visible, restore performance
            this.game.loop.targetFps = 60;
            console.log('Game visible, restoring FPS to 60');
        }
    }

    /**
     * Adapt game settings to current screen size
     */
    adaptGameToScreen() {
        const config = this.getBreakpointConfig(this.currentBreakpoint);
        
        // Update game scale
        this.game.scale.setGameSize(config.width, config.height);
        
        // Update UI scaling for different screen sizes
        this.updateUIScaling(config.uiScale);
        
        // Update input handling for touch devices
        if (this.currentBreakpoint === 'mobile') {
            this.enableTouchControls();
        } else {
            this.disableTouchControls();
        }
        
        console.log(`Adapted to ${this.currentBreakpoint} breakpoint:`, config);
    }

    /**
     * Get configuration for specific breakpoint
     * @param {string} breakpoint - Breakpoint name
     * @returns {Object} Configuration object
     */
    getBreakpointConfig(breakpoint) {
        const configs = {
            mobile: {
                width: 480,
                height: 320,
                uiScale: 0.8,
                showPerformanceIndicator: false,
                enableTouchControls: true,
                reducedParticles: true
            },
            tablet: {
                width: 640,
                height: 480,
                uiScale: 0.9,
                showPerformanceIndicator: false,
                enableTouchControls: true,
                reducedParticles: false
            },
            desktop: {
                width: 800,
                height: 600,
                uiScale: 1.0,
                showPerformanceIndicator: true,
                enableTouchControls: false,
                reducedParticles: false
            }
        };
        
        return configs[breakpoint] || configs.desktop;
    }

    /**
     * Update game scale based on container size
     */
    updateGameScale() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const gameAspectRatio = this.game.config.width / this.game.config.height;
        const containerAspectRatio = containerRect.width / containerRect.height;
        
        let scale = 1;
        
        if (containerAspectRatio > gameAspectRatio) {
            // Container is wider than game aspect ratio
            scale = containerRect.height / this.game.config.height;
        } else {
            // Container is taller than game aspect ratio
            scale = containerRect.width / this.game.config.width;
        }
        
        // Ensure minimum scale for readability
        scale = Math.max(scale, 0.5);
        
        this.game.scale.setZoom(scale);
    }

    /**
     * Update UI scaling for different screen sizes
     * @param {number} scale - UI scale factor
     */
    updateUIScaling(scale) {
        // Update all active scenes
        this.game.scene.getScenes(true).forEach(scene => {
            if (scene.uiContainer) {
                scene.uiContainer.setScale(scale);
            }
            
            // Update text sizes
            scene.children.list.forEach(child => {
                if (child.type === 'Text') {
                    const originalSize = child.getData('originalFontSize') || parseInt(child.style.fontSize);
                    child.setData('originalFontSize', originalSize);
                    child.setFontSize(Math.round(originalSize * scale));
                }
            });
        });
    }

    /**
     * Enable touch controls for mobile devices
     */
    enableTouchControls() {
        // Add virtual joystick or touch controls
        const activeScenes = this.game.scene.getScenes(true);
        
        activeScenes.forEach(scene => {
            if (scene.scene.key === 'GameWorldScene' && !scene.touchControls) {
                this.addTouchControls(scene);
            }
        });
    }

    /**
     * Disable touch controls for non-mobile devices
     */
    disableTouchControls() {
        const activeScenes = this.game.scene.getScenes(true);
        
        activeScenes.forEach(scene => {
            if (scene.touchControls) {
                scene.touchControls.destroy();
                scene.touchControls = null;
            }
        });
    }

    /**
     * Add touch controls to a scene
     * @param {Phaser.Scene} scene - Scene to add controls to
     */
    addTouchControls(scene) {
        const controlsContainer = scene.add.container(0, 0);
        controlsContainer.setScrollFactor(0);
        controlsContainer.setDepth(9999);
        
        // Virtual D-pad
        const dpadSize = 80;
        const dpadX = dpadSize + 20;
        const dpadY = scene.cameras.main.height - dpadSize - 20;
        
        // D-pad background
        const dpadBg = scene.add.circle(dpadX, dpadY, dpadSize / 2, 0x000000, 0.3);
        dpadBg.setStrokeStyle(2, 0xffffff, 0.5);
        
        // D-pad center
        const dpadCenter = scene.add.circle(dpadX, dpadY, 15, 0xffffff, 0.8);
        
        controlsContainer.add([dpadBg, dpadCenter]);
        
        // Touch input handling
        scene.input.on('pointerdown', (pointer) => {
            this.handleTouchInput(scene, pointer, dpadX, dpadY, dpadSize);
        });
        
        scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.handleTouchInput(scene, pointer, dpadX, dpadY, dpadSize);
            }
        });
        
        scene.input.on('pointerup', () => {
            this.clearTouchInput(scene);
        });
        
        scene.touchControls = controlsContainer;
    }

    /**
     * Handle touch input for virtual controls
     * @param {Phaser.Scene} scene - Scene handling input
     * @param {Phaser.Input.Pointer} pointer - Touch pointer
     * @param {number} dpadX - D-pad center X
     * @param {number} dpadY - D-pad center Y
     * @param {number} dpadSize - D-pad size
     */
    handleTouchInput(scene, pointer, dpadX, dpadY, dpadSize) {
        const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, dpadX, dpadY);
        
        if (distance <= dpadSize / 2) {
            const angle = Phaser.Math.Angle.Between(dpadX, dpadY, pointer.x, pointer.y);
            const normalizedAngle = Phaser.Math.Angle.Normalize(angle);
            
            // Convert angle to direction
            const directions = {
                up: normalizedAngle > -2.356 && normalizedAngle < -0.785,
                down: normalizedAngle > 0.785 && normalizedAngle < 2.356,
                left: normalizedAngle > 2.356 || normalizedAngle < -2.356,
                right: normalizedAngle > -0.785 && normalizedAngle < 0.785
            };
            
            // Set virtual input state
            if (scene.player && scene.player.setInputState) {
                scene.player.setInputState('up', directions.up);
                scene.player.setInputState('down', directions.down);
                scene.player.setInputState('left', directions.left);
                scene.player.setInputState('right', directions.right);
            }
        }
    }

    /**
     * Clear touch input state
     * @param {Phaser.Scene} scene - Scene to clear input for
     */
    clearTouchInput(scene) {
        if (scene.player && scene.player.setInputState) {
            scene.player.setInputState('up', false);
            scene.player.setInputState('down', false);
            scene.player.setInputState('left', false);
            scene.player.setInputState('right', false);
        }
    }

    /**
     * Set up performance monitoring display
     */
    setupPerformanceMonitoring() {
        const indicator = document.getElementById('performance-indicator');
        if (!indicator) return;
        
        // Show performance indicator based on breakpoint
        const config = this.getBreakpointConfig(this.currentBreakpoint);
        if (config.showPerformanceIndicator && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            indicator.classList.add('visible');
            this.startPerformanceMonitoring();
        } else {
            indicator.classList.remove('visible');
        }
    }

    /**
     * Start performance monitoring updates
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceDisplay();
        }, 1000);
    }

    /**
     * Update performance display
     */
    updatePerformanceDisplay() {
        const fpsCounter = document.getElementById('fps-counter');
        const objectCounter = document.getElementById('object-counter');
        const memoryCounter = document.getElementById('memory-counter');
        
        if (!fpsCounter || !objectCounter || !memoryCounter) return;
        
        // Get performance data from game
        const gameWorldScene = this.game.scene.getScene('GameWorldScene');
        let metrics = { fps: 60, objectsRendered: 0, memoryUsed: 0 };
        
        if (gameWorldScene && gameWorldScene.performanceOptimizer) {
            metrics = gameWorldScene.performanceOptimizer.getPerformanceMetrics();
        }
        
        fpsCounter.textContent = Math.round(metrics.fps);
        objectCounter.textContent = metrics.visibleObjects || metrics.objectsRendered;
        memoryCounter.textContent = Math.round(metrics.memoryUsage / 1024 / 1024) + 'MB';
        
        // Color code FPS
        if (metrics.fps < 30) {
            fpsCounter.style.color = '#ff6b6b';
        } else if (metrics.fps < 50) {
            fpsCounter.style.color = '#ffa500';
        } else {
            fpsCounter.style.color = '#51cf66';
        }
    }

    /**
     * Notify breakpoint change
     * @param {string} oldBreakpoint - Previous breakpoint
     * @param {string} newBreakpoint - New breakpoint
     */
    notifyBreakpointChange(oldBreakpoint, newBreakpoint) {
        console.log(`Breakpoint changed: ${oldBreakpoint} -> ${newBreakpoint}`);
        
        // Emit custom event
        const event = new CustomEvent('breakpointchange', {
            detail: { oldBreakpoint, newBreakpoint }
        });
        window.dispatchEvent(event);
    }

    /**
     * Add resize handler
     * @param {Function} handler - Handler function
     */
    addResizeHandler(handler) {
        this.resizeHandlers.push(handler);
    }

    /**
     * Add orientation change handler
     * @param {Function} handler - Handler function
     */
    addOrientationChangeHandler(handler) {
        this.orientationChangeHandlers.push(handler);
    }

    /**
     * Get current breakpoint
     * @returns {string} Current breakpoint
     */
    getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }

    /**
     * Check if current device is mobile
     * @returns {boolean} True if mobile
     */
    isMobile() {
        return this.currentBreakpoint === 'mobile';
    }

    /**
     * Check if current device is tablet
     * @returns {boolean} True if tablet
     */
    isTablet() {
        return this.currentBreakpoint === 'tablet';
    }

    /**
     * Check if current device is desktop
     * @returns {boolean} True if desktop
     */
    isDesktop() {
        return this.currentBreakpoint === 'desktop';
    }

    /**
     * Destroy responsive design system
     */
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        this.resizeHandlers = [];
        this.orientationChangeHandlers = [];
    }
}