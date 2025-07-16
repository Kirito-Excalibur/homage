/**
 * AudioManager - Comprehensive audio system for background music and sound effects
 * Handles audio loading, caching, volume management, and scene transitions
 */
export default class AudioManager {
    constructor(scene = null) {
        this.scene = scene;
        this.game = scene ? scene.game : null;
        
        // Audio state
        this.backgroundMusic = null;
        this.currentMusicKey = null;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.masterVolume = 1.0;
        this.isMuted = false;
        
        // Audio caches
        this.loadedMusic = new Map();
        this.loadedSfx = new Map();
        this.playingSounds = new Map();
        
        // Scene-specific music mapping
        this.sceneMusicMap = {
            'MainMenuScene': 'menu_theme',
            'GameWorldScene': 'world_ambient',
            'DialogueScene': null, // Inherit from previous scene
            'InventoryScene': null, // Inherit from previous scene
            'LoadingScene': 'loading_theme'
        };
        
        // Audio configuration
        this.audioConfig = {
            fadeInDuration: 1000,
            fadeOutDuration: 800,
            crossfadeDuration: 1200,
            maxSimultaneousSfx: 8,
            audioFormat: ['ogg', 'mp3', 'wav'] // Preferred order
        };
        
        // Volume settings persistence
        this.storageKey = 'rpg_audio_settings';
        this.loadAudioSettings();
        
        // Initialize audio context handling
        this.initializeAudioContext();
        
        console.log('AudioManager initialized');
    }

    /**
     * Initialize audio context and handle browser audio policies
     */
    initializeAudioContext() {
        // Handle browser audio policy requirements
        this.audioUnlocked = false;
        
        // Skip if no scene available yet
        if (!this.scene) {
            console.log('AudioManager: Scene not available, deferring audio context initialization');
            return;
        }
        
        // Listen for first user interaction to unlock audio
        const unlockAudio = () => {
            if (!this.audioUnlocked && this.scene && this.scene.sound) {
                try {
                    // Try to unlock audio context by resuming it
                    if (this.scene.sound.context && this.scene.sound.context.state === 'suspended') {
                        this.scene.sound.context.resume().then(() => {
                            this.audioUnlocked = true;
                            console.log('Audio context unlocked');
                        }).catch(() => {
                            // Fallback: just mark as unlocked
                            this.audioUnlocked = true;
                            console.log('Audio context unlock attempted');
                        });
                    } else {
                        // Audio context is already running or not available
                        this.audioUnlocked = true;
                        console.log('Audio context already unlocked or not available');
                    }
                } catch (error) {
                    // Fallback: just mark as unlocked
                    this.audioUnlocked = true;
                    console.log('Audio context unlock fallback');
                }
                
                // Remove event listeners
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            }
        };
        
        // Add event listeners for user interaction
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
    }

    /**
     * Load audio settings from localStorage
     */
    loadAudioSettings() {
        try {
            const settings = localStorage.getItem(this.storageKey);
            if (settings) {
                const parsed = JSON.parse(settings);
                this.masterVolume = parsed.masterVolume ?? 1.0;
                this.musicVolume = parsed.musicVolume ?? 0.7;
                this.sfxVolume = parsed.sfxVolume ?? 0.8;
                this.isMuted = parsed.isMuted ?? false;
                console.log('Audio settings loaded:', parsed);
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }

    /**
     * Save audio settings to localStorage
     */
    saveAudioSettings() {
        try {
            const settings = {
                masterVolume: this.masterVolume,
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                isMuted: this.isMuted
            };
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    /**
     * Preload audio assets for a scene
     * @param {Object} audioAssets - Audio assets to preload
     * @param {Function} onProgress - Progress callback
     */
    async preloadAudio(audioAssets, onProgress = null) {
        const audioKeys = Object.keys(audioAssets);
        let loadedCount = 0;
        
        for (const key of audioKeys) {
            try {
                const assetData = audioAssets[key];
                await this.loadAudioAsset(key, assetData);
                loadedCount++;
                
                if (onProgress) {
                    onProgress({
                        key,
                        loaded: loadedCount,
                        total: audioKeys.length,
                        progress: (loadedCount / audioKeys.length) * 100
                    });
                }
            } catch (error) {
                console.warn(`Failed to load audio asset: ${key}`, error);
                loadedCount++; // Count as processed even if failed
            }
        }
        
        console.log(`Audio preloading complete: ${loadedCount}/${audioKeys.length} assets`);
    }

    /**
     * Load a single audio asset
     * @param {string} key - Audio key
     * @param {Object} assetData - Asset data with URL and type
     */
    async loadAudioAsset(key, assetData) {
        return new Promise((resolve, reject) => {
            // Check if scene is available
            if (!this.scene || !this.scene.sound || !this.scene.load) {
                reject(new Error('Scene not available for audio loading'));
                return;
            }
            
            // Check if already loaded
            if (this.scene.sound.get(key)) {
                resolve();
                return;
            }
            
            const loader = this.scene.load;
            
            const onComplete = (file) => {
                if (file.key === key) {
                    loader.off('filecomplete', onComplete);
                    loader.off('fileerror', onError);
                    
                    // Cache the loaded audio
                    if (assetData.type === 'music') {
                        this.loadedMusic.set(key, assetData);
                    } else {
                        this.loadedSfx.set(key, assetData);
                    }
                    
                    resolve();
                }
            };
            
            const onError = (file) => {
                if (file.key === key) {
                    loader.off('filecomplete', onComplete);
                    loader.off('fileerror', onError);
                    reject(new Error(`Failed to load audio: ${file.src}`));
                }
            };
            
            loader.on('filecomplete', onComplete);
            loader.on('fileerror', onError);
            
            // Load audio with multiple format support
            if (Array.isArray(assetData.url)) {
                loader.audio(key, assetData.url);
            } else {
                loader.audio(key, [assetData.url]);
            }
            
            if (!loader.isLoading()) {
                loader.start();
            }
        });
    }

    /**
     * Play background music for a scene
     * @param {string} musicKey - Music asset key
     * @param {Object} options - Playback options
     */
    playBackgroundMusic(musicKey, options = {}) {
        if (!musicKey || this.isMuted) return;
        
        const config = {
            loop: true,
            volume: this.getEffectiveVolume('music', options.volume),
            ...options
        };
        
        // If same music is already playing, don't restart
        if (this.currentMusicKey === musicKey && this.backgroundMusic && this.backgroundMusic.isPlaying) {
            return;
        }
        
        // Stop current music with fade out
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.fadeOutMusic(() => {
                this.startNewMusic(musicKey, config);
            });
        } else {
            this.startNewMusic(musicKey, config);
        }
    }

    /**
     * Start playing new background music
     * @param {string} musicKey - Music asset key
     * @param {Object} config - Audio configuration
     */
    startNewMusic(musicKey, config) {
        try {
            // Check if scene is available
            if (!this.scene || !this.scene.sound || !this.scene.tweens) {
                console.warn('Scene not available for music playback');
                return;
            }
            
            // Check if audio asset exists
            if (!this.scene.sound.get(musicKey)) {
                console.warn(`Music asset not found: ${musicKey}`);
                return;
            }
            
            this.backgroundMusic = this.scene.sound.add(musicKey, config);
            this.currentMusicKey = musicKey;
            
            // Start with fade in
            this.backgroundMusic.setVolume(0);
            this.backgroundMusic.play();
            
            this.scene.tweens.add({
                targets: this.backgroundMusic,
                volume: config.volume,
                duration: this.audioConfig.fadeInDuration,
                ease: 'Power2'
            });
            
            console.log(`Started background music: ${musicKey}`);
            
        } catch (error) {
            console.error(`Failed to play background music: ${musicKey}`, error);
        }
    }

    /**
     * Fade out current background music
     * @param {Function} onComplete - Callback when fade out completes
     */
    fadeOutMusic(onComplete = null) {
        if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) {
            if (onComplete) onComplete();
            return;
        }
        
        // Check if scene is available for tweens
        if (!this.scene || !this.scene.tweens) {
            // Fallback: stop immediately without fade
            this.backgroundMusic.stop();
            this.backgroundMusic.destroy();
            this.backgroundMusic = null;
            this.currentMusicKey = null;
            if (onComplete) onComplete();
            return;
        }
        
        this.scene.tweens.add({
            targets: this.backgroundMusic,
            volume: 0,
            duration: this.audioConfig.fadeOutDuration,
            ease: 'Power2',
            onComplete: () => {
                if (this.backgroundMusic) {
                    this.backgroundMusic.stop();
                    this.backgroundMusic.destroy();
                    this.backgroundMusic = null;
                    this.currentMusicKey = null;
                }
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Play a sound effect
     * @param {string} sfxKey - Sound effect key
     * @param {Object} options - Playback options
     * @returns {Phaser.Sound.BaseSound} Sound instance
     */
    playSfx(sfxKey, options = {}) {
        if (!sfxKey || this.isMuted) return null;
        
        try {
            // Check if scene is available
            if (!this.scene || !this.scene.sound) {
                console.warn('Scene not available for SFX playback');
                return null;
            }
            
            // Check if audio asset exists
            if (!this.scene.sound.get(sfxKey)) {
                console.warn(`SFX asset not found: ${sfxKey}`);
                return null;
            }
            
            // Limit simultaneous sound effects
            if (this.playingSounds.size >= this.audioConfig.maxSimultaneousSfx) {
                // Stop oldest sound
                const oldestSound = this.playingSounds.values().next().value;
                if (oldestSound && oldestSound.isPlaying) {
                    oldestSound.stop();
                }
            }
            
            const config = {
                volume: this.getEffectiveVolume('sfx', options.volume),
                ...options
            };
            
            const sound = this.scene.sound.add(sfxKey, config);
            
            // Track playing sound
            const soundId = Date.now() + Math.random();
            this.playingSounds.set(soundId, sound);
            
            // Clean up when sound completes
            sound.once('complete', () => {
                this.playingSounds.delete(soundId);
                sound.destroy();
            });
            
            sound.play();
            return sound;
            
        } catch (error) {
            console.error(`Failed to play SFX: ${sfxKey}`, error);
            return null;
        }
    }

    /**
     * Handle scene transitions with appropriate music changes
     * @param {string} fromScene - Previous scene key
     * @param {string} toScene - New scene key
     */
    handleSceneTransition(fromScene, toScene) {
        console.log(`Audio scene transition: ${fromScene} -> ${toScene}`);
        
        const newMusicKey = this.sceneMusicMap[toScene];
        
        // Handle special cases
        if (toScene === 'DialogueScene' || toScene === 'InventoryScene') {
            // Keep current music playing for overlay scenes
            return;
        }
        
        // Change music if different from current
        if (newMusicKey && newMusicKey !== this.currentMusicKey) {
            this.playBackgroundMusic(newMusicKey);
        } else if (!newMusicKey && this.backgroundMusic) {
            // Stop music if new scene doesn't have music
            this.fadeOutMusic();
        }
    }

    /**
     * Play story event sound effects
     * @param {string} eventType - Type of story event
     * @param {Object} eventData - Event data
     */
    playStoryEventSfx(eventType, eventData = {}) {
        const sfxMap = {
            'dialogue_start': 'dialogue_open',
            'dialogue_advance': 'dialogue_next',
            'power_unlock': 'power_unlock',
            'item_collect': 'item_pickup',
            'checkpoint_reached': 'checkpoint',
            'choice_select': 'menu_select',
            'story_complete': 'story_complete'
        };
        
        const sfxKey = sfxMap[eventType];
        if (sfxKey) {
            this.playSfx(sfxKey, { volume: 0.6 });
        }
    }

    /**
     * Play character action sound effects
     * @param {string} actionType - Type of character action
     * @param {Object} actionData - Action data
     */
    playCharacterActionSfx(actionType, actionData = {}) {
        const sfxMap = {
            'walk': 'footstep',
            'interact': 'interact',
            'power_use': 'power_activate',
            'combat_attack': 'attack',
            'combat_hit': 'hit',
            'combat_defeat': 'defeat'
        };
        
        const sfxKey = sfxMap[actionType];
        if (sfxKey) {
            // Vary volume and pitch for more natural sound
            const options = {
                volume: 0.4 + Math.random() * 0.2,
                rate: 0.9 + Math.random() * 0.2
            };
            this.playSfx(sfxKey, options);
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        this.saveAudioSettings();
    }

    /**
     * Set music volume
     * @param {number} volume - Volume level (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(this.getEffectiveVolume('music'));
        }
        this.saveAudioSettings();
    }

    /**
     * Set sound effects volume
     * @param {number} volume - Volume level (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
    }

    /**
     * Toggle mute state
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateAllVolumes();
        this.saveAudioSettings();
        return this.isMuted;
    }

    /**
     * Update all playing audio volumes
     */
    updateAllVolumes() {
        // Update background music
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(this.getEffectiveVolume('music'));
        }
        
        // Update playing sound effects
        this.playingSounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.setVolume(this.getEffectiveVolume('sfx'));
            }
        });
    }

    /**
     * Calculate effective volume considering all volume settings
     * @param {string} type - Audio type ('music' or 'sfx')
     * @param {number} baseVolume - Base volume override
     * @returns {number} Effective volume
     */
    getEffectiveVolume(type, baseVolume = null) {
        if (this.isMuted) return 0;
        
        const typeVolume = type === 'music' ? this.musicVolume : this.sfxVolume;
        const volume = baseVolume !== null ? baseVolume : typeVolume;
        
        return volume * this.masterVolume;
    }

    /**
     * Get current audio status
     * @returns {Object} Audio status information
     */
    getAudioStatus() {
        return {
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted,
            currentMusic: this.currentMusicKey,
            playingSfxCount: this.playingSounds.size,
            audioUnlocked: this.audioUnlocked
        };
    }

    /**
     * Stop all audio
     */
    stopAllAudio() {
        // Stop background music
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic.destroy();
            this.backgroundMusic = null;
            this.currentMusicKey = null;
        }
        
        // Stop all sound effects
        this.playingSounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.destroy();
        });
        this.playingSounds.clear();
    }

    /**
     * Create audio controls UI
     * @param {Phaser.Scene} scene - Scene to add controls to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Phaser.GameObjects.Container} Audio controls container
     */
    createAudioControls(scene, x = 10, y = 10) {
        const container = scene.add.container(x, y);
        container.setScrollFactor(0);
        
        // Background panel
        const bg = scene.add.rectangle(0, 0, 200, 120, 0x2c3e50, 0.9);
        bg.setStrokeStyle(2, 0x34495e);
        
        // Title
        const title = scene.add.text(0, -45, 'Audio Controls', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Master volume control
        const masterLabel = scene.add.text(-80, -20, 'Master:', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        });
        
        // Music volume control
        const musicLabel = scene.add.text(-80, 0, 'Music:', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        });
        
        // SFX volume control
        const sfxLabel = scene.add.text(-80, 20, 'SFX:', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        });
        
        // Mute button
        const muteButton = scene.add.text(0, 40, this.isMuted ? 'UNMUTE' : 'MUTE', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: this.isMuted ? '#e74c3c' : '#27ae60',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        
        muteButton.setInteractive({ useHandCursor: true });
        muteButton.on('pointerdown', () => {
            const muted = this.toggleMute();
            muteButton.setText(muted ? 'UNMUTE' : 'MUTE');
            muteButton.setColor(muted ? '#e74c3c' : '#27ae60');
        });
        
        container.add([bg, title, masterLabel, musicLabel, sfxLabel, muteButton]);
        
        return container;
    }

    /**
     * Update method to be called in scene update loop
     * @param {number} time - Current time
     * @param {number} delta - Delta time
     */
    update(time, delta) {
        // Clean up finished sounds
        this.playingSounds.forEach((sound, id) => {
            if (!sound.isPlaying) {
                sound.destroy();
                this.playingSounds.delete(id);
            }
        });
    }

    /**
     * Destroy the audio manager and clean up resources
     */
    destroy() {
        this.stopAllAudio();
        this.loadedMusic.clear();
        this.loadedSfx.clear();
        this.playingSounds.clear();
        
        // Remove event listeners
        document.removeEventListener('click', this.unlockAudio);
        document.removeEventListener('keydown', this.unlockAudio);
        document.removeEventListener('touchstart', this.unlockAudio);
    }
}