/**
 * Test script for SaveSystem functionality
 * Run this in the browser console to test save/load operations
 */

// Test SaveSystem functionality
function testSaveSystem() {
    console.log('Testing SaveSystem...');
    
    // Get game instance and GameManager
    const game = window.game;
    if (!game) {
        console.error('Game instance not found');
        return;
    }
    
    const gameManager = game.plugins.get('GameManager');
    if (!gameManager) {
        console.error('GameManager not found');
        return;
    }
    
    const saveSystem = gameManager.getSaveSystem();
    if (!saveSystem) {
        console.error('SaveSystem not found');
        return;
    }
    
    console.log('SaveSystem found, running tests...');
    
    // Test 1: Manual save
    console.log('\n--- Test 1: Manual Save ---');
    const saveResult = saveSystem.manualSave(0);
    console.log('Manual save result:', saveResult);
    
    // Test 2: Get available saves
    console.log('\n--- Test 2: Available Saves ---');
    const saves = saveSystem.getAvailableSaves();
    console.log('Available saves:', saves);
    
    // Test 3: Save system status
    console.log('\n--- Test 3: Save System Status ---');
    const status = saveSystem.getStatus();
    console.log('Save system status:', status);
    
    // Test 4: Auto-save settings
    console.log('\n--- Test 4: Auto-save Settings ---');
    console.log('Auto-save enabled:', saveSystem.isAutoSaveEnabled());
    
    // Test 5: Load game
    console.log('\n--- Test 5: Load Game ---');
    if (saves.length > 0) {
        const loadResult = saveSystem.loadGame(saves[0].key);
        console.log('Load game result:', loadResult);
    } else {
        console.log('No saves available to load');
    }
    
    console.log('\nSaveSystem tests completed!');
}

// Test story system integration
function testStorySystemIntegration() {
    console.log('\nTesting Story System Integration...');
    
    const game = window.game;
    const gameManager = game.plugins.get('GameManager');
    const storySystem = gameManager.getStorySystem();
    
    if (!storySystem) {
        console.error('StorySystem not found');
        return;
    }
    
    // Trigger a story event to test auto-save
    console.log('Triggering story event to test auto-save...');
    storySystem.setCheckpoint('test_checkpoint');
    
    // Check if auto-save was triggered
    setTimeout(() => {
        const saves = gameManager.getSaveSystem().getAvailableSaves();
        const autoSave = saves.find(save => save.type === 'auto');
        console.log('Auto-save after checkpoint:', autoSave ? 'Found' : 'Not found');
    }, 1000);
}

// Export test functions to global scope
window.testSaveSystem = testSaveSystem;
window.testStorySystemIntegration = testStorySystemIntegration;

console.log('Save system test functions loaded. Run testSaveSystem() or testStorySystemIntegration() in console.');