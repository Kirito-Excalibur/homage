// Simple test script to verify StorySystem functionality
import StorySystem from './src/systems/StorySystem.js';

// Mock scene object for testing
const mockScene = {
    load: {
        json: () => {}
    }
};

// Create story system instance
const storySystem = new StorySystem(mockScene);

console.log('Testing StorySystem...');

// Test 1: Initial state
console.log('\n1. Testing initial state:');
console.log('Current checkpoint:', storySystem.currentCheckpoint);
console.log('Completed events:', Array.from(storySystem.completedEvents));
console.log('Story flags:', Object.fromEntries(storySystem.storyFlags));
console.log('Unlocked powers:', Array.from(storySystem.unlockedPowers));

// Test 2: Story flags
console.log('\n2. Testing story flags:');
storySystem.setStoryFlag('test_flag', true);
console.log('Set test_flag to true:', storySystem.getStoryFlag('test_flag'));
console.log('Check test_flag === true:', storySystem.checkStoryFlag('test_flag', true));
console.log('Check test_flag === false:', storySystem.checkStoryFlag('test_flag', false));

// Test 3: Power system
console.log('\n3. Testing power system:');
storySystem.unlockPower('telekinesis');
console.log('Unlocked telekinesis:', storySystem.isPowerUnlocked('telekinesis'));
console.log('Unlocked powers:', storySystem.getUnlockedPowers());

// Test 4: Checkpoint system
console.log('\n4. Testing checkpoint system:');
storySystem.setCheckpoint('tutorial_checkpoint');
console.log('Current checkpoint:', storySystem.currentCheckpoint);
console.log('Has reached tutorial_checkpoint:', storySystem.hasReachedCheckpoint('tutorial_checkpoint'));

// Test 5: Condition checking
console.log('\n5. Testing condition checking:');
const conditions = [
    { type: 'flag', flag: 'test_flag', value: true },
    { type: 'power_unlocked', powerId: 'telekinesis' }
];
console.log('Conditions met:', storySystem.checkStoryConditions(conditions));

// Test 6: Story state serialization
console.log('\n6. Testing story state serialization:');
const storyState = storySystem.getStoryState();
console.log('Story state:', storyState);

// Test 7: Story progress
console.log('\n7. Testing story progress:');
const progress = storySystem.getStoryProgress();
console.log('Story progress:', progress);

// Test 8: Load fallback story data
console.log('\n8. Testing fallback story data:');
storySystem.loadFallbackStoryData();
console.log('Story data loaded:', !!storySystem.storyData);
console.log('Events count:', storySystem.storyData.events.length);

// Test 9: Event triggering with fallback data
console.log('\n9. Testing event triggering:');
const event = storySystem.triggerStoryEvent('game_start');
console.log('Triggered game_start event:', !!event);
console.log('Event completed:', storySystem.completedEvents.has('game_start'));

console.log('\nStorySystem tests completed!');