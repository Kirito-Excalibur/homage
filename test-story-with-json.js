// Test StorySystem with actual JSON story data
import StorySystem from './src/systems/StorySystem.js';
import fs from 'fs';

// Mock scene object for testing
const mockScene = {
    load: {
        json: () => {}
    }
};

// Create story system instance
const storySystem = new StorySystem(mockScene);

console.log('Testing StorySystem with JSON data...');

// Load story data from file
try {
    const storyData = JSON.parse(fs.readFileSync('./src/assets/story/main-story.json', 'utf8'));
    storySystem.storyData = storyData;
    console.log('Story data loaded successfully');
    console.log('Events count:', storyData.events.length);
    console.log('Checkpoints count:', Object.keys(storyData.checkpoints).length);
} catch (error) {
    console.error('Error loading story data:', error);
    process.exit(1);
}

// Test story progression
console.log('\n=== Testing Story Progression ===');

// 1. Trigger game start
console.log('\n1. Triggering game_start event:');
let event = storySystem.triggerStoryEvent('game_start');
console.log('Event triggered:', !!event);
console.log('Game started flag:', storySystem.getStoryFlag('game_started'));

// 2. Trigger first dialogue (should work now that game_started is true)
console.log('\n2. Triggering first_dialogue event:');
event = storySystem.triggerStoryEvent('first_dialogue');
console.log('Event triggered:', !!event);
console.log('First dialogue seen flag:', storySystem.getStoryFlag('first_dialogue_seen'));

// 3. Trigger tutorial start
console.log('\n3. Triggering tutorial_start event:');
event = storySystem.triggerStoryEvent('tutorial_start');
console.log('Event triggered:', !!event);
console.log('Current checkpoint:', storySystem.currentCheckpoint);

// 4. Try to trigger power unlock (should work now that tutorial checkpoint is reached)
console.log('\n4. Triggering first_power_unlock event:');
event = storySystem.triggerStoryEvent('first_power_unlock');
console.log('Event triggered:', !!event);
console.log('Telekinesis unlocked:', storySystem.isPowerUnlocked('telekinesis'));
console.log('Tutorial completed flag:', storySystem.getStoryFlag('tutorial_completed'));

// 5. Test story branching
console.log('\n5. Testing story branching:');
event = storySystem.triggerStoryEvent('story_branch_choice');
console.log('Branch choice event triggered:', !!event);

// Simulate choosing dark path
storySystem.setStoryFlag('chose_dark_path', true);
event = storySystem.triggerStoryEvent('dark_path_chosen');
console.log('Dark path event triggered:', !!event);

// 6. Show final story state
console.log('\n=== Final Story State ===');
const progress = storySystem.getStoryProgress();
console.log('Story progress:', progress);
console.log('Current checkpoint:', storySystem.getCurrentCheckpoint());
console.log('Completed events:', Array.from(storySystem.completedEvents));
console.log('Story flags:', Object.fromEntries(storySystem.storyFlags));
console.log('Unlocked powers:', storySystem.getUnlockedPowers());

console.log('\nStory system JSON test completed successfully!');