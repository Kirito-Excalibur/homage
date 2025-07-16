/**
 * Test script for PowerSystem functionality
 * Run this in the browser console to test power system features
 */

// Test PowerSystem functionality
function testPowerSystem() {
    console.log('=== Testing PowerSystem ===');
    
    // Get game instance
    const game = window.game;
    if (!game) {
        console.error('Game instance not found');
        return;
    }
    
    // Get GameManager
    const gameManager = game.plugins.get('GameManager');
    if (!gameManager) {
        console.error('GameManager not found');
        return;
    }
    
    // Get PowerSystem
    const powerSystem = gameManager.getPowerSystem();
    if (!powerSystem) {
        console.error('PowerSystem not found');
        return;
    }
    
    console.log('PowerSystem found:', powerSystem);
    
    // Test 1: Check initial state
    console.log('\n--- Test 1: Initial State ---');
    console.log('Available powers:', powerSystem.getPowerList().map(p => p.id));
    console.log('Unlocked powers:', powerSystem.getUnlockedPowerList().map(p => p.id));
    
    // Test 2: Unlock a power
    console.log('\n--- Test 2: Unlock Telekinesis ---');
    const unlockResult = powerSystem.unlockPower('telekinesis', 'test_trigger');
    console.log('Unlock result:', unlockResult);
    console.log('Unlocked powers after unlock:', powerSystem.getUnlockedPowerList().map(p => p.id));
    
    // Test 3: Check power availability
    console.log('\n--- Test 3: Check Power Availability ---');
    console.log('Can use telekinesis:', powerSystem.checkPowerAvailability('telekinesis'));
    console.log('Can use enhanced_vision:', powerSystem.checkPowerAvailability('enhanced_vision'));
    
    // Test 4: Activate power
    console.log('\n--- Test 4: Activate Telekinesis ---');
    const activateResult = powerSystem.activatePower('telekinesis', { test: true });
    console.log('Activation result:', activateResult);
    console.log('Is telekinesis active:', powerSystem.isPowerActive('telekinesis'));
    console.log('Remaining cooldown:', powerSystem.getRemainingCooldown('telekinesis'));
    
    // Test 5: Try to activate power on cooldown
    setTimeout(() => {
        console.log('\n--- Test 5: Try Activation During Cooldown ---');
        const cooldownResult = powerSystem.activatePower('telekinesis', { test: true });
        console.log('Activation during cooldown result:', cooldownResult);
        console.log('Remaining cooldown:', powerSystem.getRemainingCooldown('telekinesis'));
    }, 1000);
    
    // Test 6: Test story integration
    console.log('\n--- Test 6: Story Integration ---');
    const storySystem = gameManager.getStorySystem();
    if (storySystem) {
        console.log('Story system found, testing power unlock through story');
        storySystem.unlockPower('enhanced_vision');
        console.log('Powers after story unlock:', powerSystem.getUnlockedPowerList().map(p => p.id));
    }
    
    console.log('\n=== PowerSystem Test Complete ===');
}

// Test StorySystem integration with PowerSystem
function testStoryPowerIntegration() {
    console.log('=== Testing Story-Power Integration ===');
    
    const game = window.game;
    const gameManager = game?.plugins.get('GameManager');
    const storySystem = gameManager?.getStorySystem();
    const powerSystem = gameManager?.getPowerSystem();
    
    if (!storySystem || !powerSystem) {
        console.error('Required systems not found');
        return;
    }
    
    // Test story event that unlocks power
    console.log('Triggering first_power_unlock story event...');
    const event = storySystem.triggerStoryEvent('first_power_unlock');
    console.log('Story event result:', event);
    
    // Check if power was unlocked
    setTimeout(() => {
        console.log('Powers after story event:', powerSystem.getUnlockedPowerList().map(p => p.id));
    }, 500);
    
    console.log('=== Story-Power Integration Test Complete ===');
}

// Export test functions for browser console use
window.testPowerSystem = testPowerSystem;
window.testStoryPowerIntegration = testStoryPowerIntegration;

console.log('Power system test functions loaded. Use testPowerSystem() or testStoryPowerIntegration() in console.');