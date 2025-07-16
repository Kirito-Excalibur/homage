import { describe, it, expect, beforeEach, vi } from 'vitest';
import StorySystem from '../src/systems/StorySystem.js';
import PowerSystem from '../src/systems/PowerSystem.js';
import GameManager from '../src/managers/GameManager.js';

describe('Story Progression and Power Unlocking Integration', () => {
  let storySystem;
  let powerSystem;
  let gameManager;
  let mockScene;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    mockScene.player = {
      getPosition: () => ({ x: 100, y: 100 }),
      sprite: { x: 100, y: 100, setAlpha: vi.fn(), setTint: vi.fn(), clearTint: vi.fn(), depth: 10 }
    };

    storySystem = new StorySystem(mockScene);
    powerSystem = new PowerSystem(mockScene);
    
    // Set up integration between systems
    storySystem.addEventListener('power_unlocked', (data) => {
      powerSystem.unlockPower(data.powerId, 'story_progression');
    });
  });

  describe('Linear Story Progression', () => {
    beforeEach(() => {
      // Set up a linear story progression
      storySystem.storyData = {
        events: [
          {
            id: 'game_start',
            type: 'dialogue',
            triggers: [],
            content: { text: 'Welcome to your adventure!' },
            effects: [
              { type: 'set_flag', flag: 'game_started', value: true }
            ]
          },
          {
            id: 'first_dialogue',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'game_started', value: true }
            ],
            content: { text: 'You feel a strange power awakening...' },
            effects: [
              { type: 'unlock_power', powerId: 'telekinesis' },
              { type: 'set_flag', flag: 'first_power_unlocked', value: true }
            ]
          },
          {
            id: 'power_tutorial',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'first_power_unlocked', value: true }
            ],
            content: { text: 'Try using your new telekinesis power!' },
            effects: [
              { type: 'set_checkpoint', checkpointId: 'tutorial_complete' }
            ]
          },
          {
            id: 'second_power_unlock',
            type: 'dialogue',
            triggers: [
              { type: 'checkpoint_reached', checkpointId: 'tutorial_complete' },
              { type: 'power_unlocked', powerId: 'telekinesis' }
            ],
            content: { text: 'Your abilities are growing stronger...' },
            effects: [
              { type: 'unlock_power', powerId: 'enhanced_vision' }
            ]
          }
        ],
        checkpoints: {
          'game_start': { id: 'game_start', name: 'Beginning' },
          'tutorial_complete': { id: 'tutorial_complete', name: 'Tutorial Complete' }
        }
      };
    });

    it('should progress through story events in order', () => {
      // Start the story
      const event1 = storySystem.triggerStoryEvent('game_start');
      expect(event1).toBeDefined();
      expect(storySystem.getStoryFlag('game_started')).toBe(true);

      // First dialogue should now be available
      const event2 = storySystem.triggerStoryEvent('first_dialogue');
      expect(event2).toBeDefined();
      expect(storySystem.isPowerUnlocked('telekinesis')).toBe(true);
      expect(powerSystem.unlockedPowers.has('telekinesis')).toBe(true);

      // Tutorial dialogue should be available
      const event3 = storySystem.triggerStoryEvent('power_tutorial');
      expect(event3).toBeDefined();
      expect(storySystem.currentCheckpoint).toBe('tutorial_complete');

      // Second power unlock should be available
      const event4 = storySystem.triggerStoryEvent('second_power_unlock');
      expect(event4).toBeDefined();
      expect(storySystem.isPowerUnlocked('enhanced_vision')).toBe(true);
      expect(powerSystem.unlockedPowers.has('enhanced_vision')).toBe(true);
    });

    it('should not allow skipping story events', () => {
      // Try to trigger later events without prerequisites
      const event = storySystem.triggerStoryEvent('first_dialogue');
      expect(event).toBeNull();
      expect(storySystem.isPowerUnlocked('telekinesis')).toBe(false);
    });

    it('should track story progress correctly', () => {
      storySystem.triggerStoryEvent('game_start');
      storySystem.triggerStoryEvent('first_dialogue');
      
      const progress = storySystem.getStoryProgress();
      expect(progress.completedEvents).toBe(2);
      expect(progress.totalEvents).toBe(4);
      expect(progress.progressPercentage).toBe(50);
      expect(progress.unlockedPowers).toBe(1);
    });
  });

  describe('Branching Story Paths', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [
          {
            id: 'choice_point',
            type: 'dialogue',
            triggers: [],
            content: { 
              text: 'Choose your path...',
              choices: [
                { text: 'Path of Power', effects: [{ type: 'set_flag', flag: 'chose_power', value: true }] },
                { text: 'Path of Wisdom', effects: [{ type: 'set_flag', flag: 'chose_wisdom', value: true }] }
              ]
            }
          },
          {
            id: 'power_path',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'chose_power', value: true }
            ],
            content: { text: 'You gain destructive powers!' },
            effects: [
              { type: 'unlock_power', powerId: 'time_slow' }
            ]
          },
          {
            id: 'wisdom_path',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'chose_wisdom', value: true }
            ],
            content: { text: 'You gain insight and vision!' },
            effects: [
              { type: 'unlock_power', powerId: 'enhanced_vision' }
            ]
          },
          {
            id: 'convergence',
            type: 'dialogue',
            triggers: [
              { type: 'event_completed', eventId: 'power_path' }
            ],
            content: { text: 'Your power grows...' },
            effects: [
              { type: 'unlock_power', powerId: 'phase_walk' }
            ]
          }
        ],
        checkpoints: {}
      };
    });

    it('should handle branching story paths', () => {
      // Make initial choice
      storySystem.triggerStoryEvent('choice_point');
      storySystem.setStoryFlag('chose_power', true);

      // Follow power path
      const powerEvent = storySystem.triggerStoryEvent('power_path');
      expect(powerEvent).toBeDefined();
      expect(storySystem.isPowerUnlocked('time_slow')).toBe(true);
      expect(powerSystem.unlockedPowers.has('time_slow')).toBe(true);

      // Wisdom path should not be available
      const wisdomEvent = storySystem.triggerStoryEvent('wisdom_path');
      expect(wisdomEvent).toBeNull();
      expect(storySystem.isPowerUnlocked('enhanced_vision')).toBe(false);

      // Convergence should be available after power path
      const convergenceEvent = storySystem.triggerStoryEvent('convergence');
      expect(convergenceEvent).toBeDefined();
      expect(storySystem.isPowerUnlocked('phase_walk')).toBe(true);
    });

    it('should handle alternative story path', () => {
      // Make different choice
      storySystem.triggerStoryEvent('choice_point');
      storySystem.setStoryFlag('chose_wisdom', true);

      // Follow wisdom path
      const wisdomEvent = storySystem.triggerStoryEvent('wisdom_path');
      expect(wisdomEvent).toBeDefined();
      expect(storySystem.isPowerUnlocked('enhanced_vision')).toBe(true);
      expect(powerSystem.unlockedPowers.has('enhanced_vision')).toBe(true);

      // Power path should not be available
      const powerEvent = storySystem.triggerStoryEvent('power_path');
      expect(powerEvent).toBeNull();
      expect(storySystem.isPowerUnlocked('time_slow')).toBe(false);
    });
  });

  describe('Power-Triggered Story Events', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [
          {
            id: 'power_unlock_event',
            type: 'dialogue',
            triggers: [],
            content: { text: 'You unlock telekinesis!' },
            effects: [
              { type: 'unlock_power', powerId: 'telekinesis' }
            ]
          },
          {
            id: 'first_telekinesis_use',
            type: 'dialogue',
            triggers: [],
            content: { text: 'You used telekinesis for the first time!' },
            effects: [
              { type: 'set_flag', flag: 'used_telekinesis', value: true }
            ]
          },
          {
            id: 'power_mastery',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'used_telekinesis', value: true }
            ],
            content: { text: 'Your mastery grows...' },
            effects: [
              { type: 'unlock_power', powerId: 'enhanced_vision' }
            ]
          }
        ],
        checkpoints: {}
      };

      // Set up power-to-story integration
      powerSystem.addEventListener('power_activated', (data) => {
        if (data.powerId === 'telekinesis') {
          storySystem.triggerStoryEvent('first_telekinesis_use');
        }
      });
    });

    it('should trigger story events when powers are used', () => {
      // Unlock the power first
      storySystem.triggerStoryEvent('power_unlock_event');
      expect(powerSystem.unlockedPowers.has('telekinesis')).toBe(true);

      // Use the power
      powerSystem.activatePower('telekinesis');

      // Check that story event was triggered
      expect(storySystem.completedEvents.has('first_telekinesis_use')).toBe(true);
      expect(storySystem.getStoryFlag('used_telekinesis')).toBe(true);

      // Check that subsequent story event is now available
      const masteryEvent = storySystem.triggerStoryEvent('power_mastery');
      expect(masteryEvent).toBeDefined();
      expect(storySystem.isPowerUnlocked('enhanced_vision')).toBe(true);
    });

    it('should not trigger story events for locked powers', () => {
      // Try to use power without unlocking it first
      const result = powerSystem.activatePower('telekinesis');
      expect(result).toBe(false);

      // Story event should not have been triggered
      expect(storySystem.completedEvents.has('first_telekinesis_use')).toBe(false);
    });
  });

  describe('Complex Story Conditions', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [
          {
            id: 'setup_event',
            type: 'dialogue',
            triggers: [],
            content: { text: 'Setting up the scenario...' },
            effects: [
              { type: 'unlock_power', powerId: 'telekinesis' },
              { type: 'unlock_power', powerId: 'enhanced_vision' },
              { type: 'set_flag', flag: 'scenario_ready', value: true }
            ]
          },
          {
            id: 'complex_condition_event',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'scenario_ready', value: true },
              { type: 'power_unlocked', powerId: 'telekinesis' },
              { type: 'power_unlocked', powerId: 'enhanced_vision' },
              { type: 'event_completed', eventId: 'setup_event' }
            ],
            content: { text: 'All conditions met!' },
            effects: [
              { type: 'unlock_power', powerId: 'time_slow' }
            ]
          },
          {
            id: 'partial_condition_event',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'scenario_ready', value: true },
              { type: 'power_unlocked', powerId: 'telekinesis' },
              { type: 'power_unlocked', powerId: 'non_existent_power' }
            ],
            content: { text: 'This should not trigger' }
          }
        ],
        checkpoints: {}
      };
    });

    it('should handle multiple AND conditions correctly', () => {
      // Set up the scenario
      storySystem.triggerStoryEvent('setup_event');
      
      // All conditions should now be met
      const complexEvent = storySystem.triggerStoryEvent('complex_condition_event');
      expect(complexEvent).toBeDefined();
      expect(storySystem.isPowerUnlocked('time_slow')).toBe(true);
    });

    it('should not trigger events with unmet conditions', () => {
      // Set up the scenario
      storySystem.triggerStoryEvent('setup_event');
      
      // This event has an impossible condition
      const partialEvent = storySystem.triggerStoryEvent('partial_condition_event');
      expect(partialEvent).toBeNull();
    });

    it('should handle missing conditions gracefully', () => {
      // Try to trigger complex event without setup
      const complexEvent = storySystem.triggerStoryEvent('complex_condition_event');
      expect(complexEvent).toBeNull();
    });
  });

  describe('Story State Persistence', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [
          {
            id: 'persistent_event',
            type: 'dialogue',
            triggers: [],
            content: { text: 'This unlocks a power' },
            effects: [
              { type: 'unlock_power', powerId: 'telekinesis' },
              { type: 'set_flag', flag: 'power_unlocked', value: true },
              { type: 'set_checkpoint', checkpointId: 'first_power' }
            ]
          }
        ],
        checkpoints: {
          'first_power': { id: 'first_power', name: 'First Power Unlocked' }
        }
      };
    });

    it('should save and restore story progression state', () => {
      // Progress through story
      storySystem.triggerStoryEvent('persistent_event');
      expect(storySystem.isPowerUnlocked('telekinesis')).toBe(true);
      expect(powerSystem.unlockedPowers.has('telekinesis')).toBe(true);

      // Get state for saving
      const storyState = storySystem.getStoryState();
      const powerState = powerSystem.getPowerSystemState();

      // Create new systems (simulating game reload)
      const newStorySystem = new StorySystem(mockScene);
      const newPowerSystem = new PowerSystem(mockScene);
      newStorySystem.storyData = storySystem.storyData;

      // Restore state
      newStorySystem.loadStoryState(storyState);
      newPowerSystem.loadPowerSystemState(powerState);

      // Verify state was restored
      expect(newStorySystem.isPowerUnlocked('telekinesis')).toBe(true);
      expect(newPowerSystem.unlockedPowers.has('telekinesis')).toBe(true);
      expect(newStorySystem.currentCheckpoint).toBe('first_power');
      expect(newStorySystem.getStoryFlag('power_unlocked')).toBe(true);
    });

    it('should maintain story consistency after state restoration', () => {
      // Progress and save
      storySystem.triggerStoryEvent('persistent_event');
      const storyState = storySystem.getStoryState();

      // Restore to new system
      const newStorySystem = new StorySystem(mockScene);
      newStorySystem.storyData = storySystem.storyData;
      newStorySystem.loadStoryState(storyState);

      // Verify event cannot be triggered again
      const event = newStorySystem.triggerStoryEvent('persistent_event');
      expect(event).toBeDefined(); // Event can be triggered but...
      expect(newStorySystem.completedEvents.has('persistent_event')).toBe(true);
      
      // Power should not be duplicated
      const unlockedPowers = newStorySystem.getUnlockedPowers();
      expect(unlockedPowers.filter(p => p === 'telekinesis')).toHaveLength(1);
    });
  });

  describe('Error Handling in Story Progression', () => {
    it('should handle missing story data gracefully', () => {
      storySystem.storyData = null;
      
      const event = storySystem.triggerStoryEvent('any_event');
      expect(event).toBeNull();
    });

    it('should handle invalid power IDs in story effects', () => {
      storySystem.storyData = {
        events: [
          {
            id: 'invalid_power_event',
            type: 'dialogue',
            triggers: [],
            content: { text: 'This tries to unlock invalid power' },
            effects: [
              { type: 'unlock_power', powerId: 'non_existent_power' }
            ]
          }
        ],
        checkpoints: {}
      };

      const event = storySystem.triggerStoryEvent('invalid_power_event');
      expect(event).toBeDefined(); // Event should still trigger
      
      // But power should not be unlocked
      expect(storySystem.isPowerUnlocked('non_existent_power')).toBe(true); // Story system tracks it
      expect(powerSystem.unlockedPowers.has('non_existent_power')).toBe(false); // But power system rejects it
    });

    it('should handle circular story dependencies', () => {
      storySystem.storyData = {
        events: [
          {
            id: 'event_a',
            type: 'dialogue',
            triggers: [
              { type: 'event_completed', eventId: 'event_b' }
            ],
            content: { text: 'Event A' }
          },
          {
            id: 'event_b',
            type: 'dialogue',
            triggers: [
              { type: 'event_completed', eventId: 'event_a' }
            ],
            content: { text: 'Event B' }
          }
        ],
        checkpoints: {}
      };

      // Neither event should be triggerable
      expect(storySystem.triggerStoryEvent('event_a')).toBeNull();
      expect(storySystem.triggerStoryEvent('event_b')).toBeNull();
    });
  });

  describe('Performance with Large Story Trees', () => {
    beforeEach(() => {
      // Create a large story tree
      const events = [];
      const checkpoints = {};
      
      for (let i = 0; i < 100; i++) {
        events.push({
          id: `event_${i}`,
          type: 'dialogue',
          triggers: i > 0 ? [{ type: 'event_completed', eventId: `event_${i-1}` }] : [],
          content: { text: `Event ${i}` },
          effects: i % 10 === 0 ? [{ type: 'unlock_power', powerId: `power_${Math.floor(i/10)}` }] : []
        });
        
        if (i % 20 === 0) {
          checkpoints[`checkpoint_${i}`] = { id: `checkpoint_${i}`, name: `Checkpoint ${i}` };
        }
      }
      
      storySystem.storyData = { events, checkpoints };
    });

    it('should handle large story progression efficiently', () => {
      const startTime = performance.now();
      
      // Progress through first 50 events
      for (let i = 0; i < 50; i++) {
        const event = storySystem.triggerStoryEvent(`event_${i}`);
        expect(event).toBeDefined();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms threshold
      
      // Verify correct number of powers unlocked
      expect(storySystem.getUnlockedPowers()).toHaveLength(5); // Powers at events 0, 10, 20, 30, 40
    });

    it('should maintain performance with complex condition checking', () => {
      const startTime = performance.now();
      
      // Check conditions for all events multiple times
      for (let i = 0; i < 100; i++) {
        const event = storySystem.storyData.events.find(e => e.id === `event_${i}`);
        storySystem.checkStoryConditions(event.triggers);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50ms threshold for condition checking
    });
  });
});