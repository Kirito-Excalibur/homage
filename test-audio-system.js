/**
 * Audio System Test - Verify audio integration is working correctly
 */

// Test audio system functionality
function testAudioSystem() {
    console.log('Testing Audio System Integration...');
    
    // Test 1: Check if audio files exist
    const audioFiles = [
        'src/assets/audio/music/menu_theme.ogg',
        'src/assets/audio/music/world_ambient.ogg',
        'src/assets/audio/music/loading_theme.ogg',
        'src/assets/audio/sfx/dialogue_open.ogg',
        'src/assets/audio/sfx/menu_select.ogg',
        'src/assets/audio/sfx/footstep.ogg'
    ];
    
    console.log('Checking audio file existence...');
    audioFiles.forEach(file => {
        fetch(file)
            .then(response => {
                if (response.ok) {
                    console.log(`✓ ${file} exists`);
                } else {
                    console.warn(`✗ ${file} not found`);
                }
            })
            .catch(error => {
                console.warn(`✗ ${file} failed to load:`, error);
            });
    });
    
    // Test 2: Check AudioManager integration
    setTimeout(() => {
        const game = window.game;
        if (game) {
            const gameManager = game.plugins.get('GameManager');
            if (gameManager) {
                const audioManager = gameManager.getAudioManager();
                if (audioManager) {
                    console.log('✓ AudioManager is available');
                    
                    // Test audio status
                    const status = audioManager.getAudioStatus();
                    console.log('Audio Status:', status);
                    
                    // Test volume controls
                    console.log('Testing volume controls...');
                    audioManager.setMasterVolume(0.5);
                    audioManager.setMusicVolume(0.6);
                    audioManager.setSfxVolume(0.7);
                    
                    const newStatus = audioManager.getAudioStatus();
                    console.log('Updated Audio Status:', newStatus);
                    
                    console.log('✓ Audio system integration test complete');
                } else {
                    console.error('✗ AudioManager not found');
                }
            } else {
                console.error('✗ GameManager not found');
            }
        } else {
            console.error('✗ Game instance not found');
        }
    }, 2000);
}

// Test scene audio integration
function testSceneAudioIntegration() {
    console.log('Testing Scene Audio Integration...');
    
    setTimeout(() => {
        const game = window.game;
        if (game) {
            const currentScene = game.scene.getScene('MainMenuScene');
            if (currentScene && currentScene.audioManager) {
                console.log('✓ MainMenuScene has AudioManager');
                
                // Test background music
                if (currentScene.audioManager.currentMusicKey) {
                    console.log(`✓ Background music playing: ${currentScene.audioManager.currentMusicKey}`);
                } else {
                    console.warn('✗ No background music playing');
                }
                
                // Test SFX playback
                console.log('Testing SFX playback...');
                currentScene.audioManager.playSfx('menu_select');
                console.log('✓ SFX test completed');
                
            } else {
                console.error('✗ MainMenuScene AudioManager not found');
            }
        }
    }, 3000);
}

// Run tests when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            testAudioSystem();
            testSceneAudioIntegration();
        }, 1000);
    });
    
    // Export test functions for manual testing
    window.testAudioSystem = testAudioSystem;
    window.testSceneAudioIntegration = testSceneAudioIntegration;
}

console.log('Audio System Test loaded. Tests will run automatically or call window.testAudioSystem() manually.');