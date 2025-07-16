import { describe, it, expect, beforeEach, vi } from 'vitest';
import StorySystem from '../src/systems/StorySystem.js';

describe('StorySystem', () => {
  let storySystem;
  let mockScene;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    storySystem = new StorySystem(mockScene);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(storySystem.scene).toBe(mockScene);
      expect(storySystem.storyData).toBeNull();
      expect(storySystem.currentCheckpoint).toBe('game_start');
      expect(storySystem.completedEvents).toBeInstanceOf(Set);
      expect(storySystem.storyFlags).toBeInstanceOf(Map);
      expect(storySystem.unlockedPowers).toBeInstanceOf(Set);
    });

    it('should initialize default story flags', () => {
      expect(storySystem.getStoryFlag('game_started')).toBe(false);
      expect(storySystem.getStoryFlag('first_dialogue_seen')).toBe(false);
      expect(storySystem.getStoryFlag('tutorial_completed')).toBe(false);
    });
  });

  describe('Story Data Loading', () => {
    it('should load story data successfully', async () => {
      const mockStoryData = {
        events: [
          {
            id: 'test_event',
            type: 'dialogue',
            triggers: [],
            content: { text: 'Test dialogue' }
          }
        ],
        checkpoints: {
          'test_checkpoint': {
            id: 'test_checkpoint',
            name: 'Test Checkpoint'
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStoryData)
      });

      const result = await storySystem.loadStoryData('test-story.json');
      
      expect(result).toBe(true);
      expect(storySystem.storyData).toEqual(mockStoryData);
    });

    it('should handle failed story data loading', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await storySystem.loadStoryData('invalid-story.json');
      
      expect(result).toBe(false);
      expect(storySystem.storyData).toBeDefined(); // Should have fallback data
      expect(storySystem.storyData.events).toBeInstanceOf(Array);
    });

    it('should validate story data structure', () => {
      const validData = {
        events: [],
        checkpoints: {}
      };
      expect(storySystem.validateStoryData(validData)).toBe(true);

      const invalidData = { events: 'not an array' };
      expect(storySystem.validateStoryData(invalidData)).toBe(false);

      expect(storySystem.validateStoryData(null)).toBe(false);
    });
  });

  describe('Story Event Triggering', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [
          {
            id: 'simple_event',
            type: 'dialogue',
            triggers: [],
            content: { text: 'Simple event' }
          },
          {
            id: 'conditional_event',
            type: 'dialogue',
            triggers: [
              { type: 'flag', flag: 'test_flag', value: true }
            ],
            content: { text: 'Conditional event' },
            effects: [
              { type: 'unlock_power', powerId: 'test_power' }
            ]
          }
        ],
        checkpoints: {}
      };
    });

    it('should trigger simple story event', () => {
      const event = storySystem.triggerStoryEvent('simple_event');
      
      expect(event).toBeDefined();
      expect(event.id).toBe('simple_event');
      expect(storySystem.completedEvents.has('simple_event')).toBe(true);
    });

    it('should not trigger event with unmet conditions', () => {
      const event = storySystem.triggerStoryEvent('conditional_event');
      
      expect(event).toBeNull();
      expect(storySystem.completedEvents.has('conditional_event')).toBe(false);
    });

    it('should trigger event when conditions are met', () => {
      storySystem.setStoryFlag('test_flag', true);
      
      const event = storySystem.triggerStoryEvent('conditional_event');
      
      expect(event).toBeDefined();
      expect(event.id).toBe('conditional_event');
      expect(storySystem.completedEvents.has('conditional_event')).toBe(true);
      expect(storySystem.unlockedPowers.has('test_power')).toBe(true);
    });

    it('should return null for non-existent event', () => {
      const event = storySystem.triggerStoryEvent('non_existent');
      expect(event).toBeNull();
    });
  });

  describe('Story Conditions', () => {
    beforeEach(() => {
      storySystem.setStoryFlag('test_flag', true);
      storySystem.completedEvents.add('completed_event');
      storySystem.unlockedPowers.add('unlocked_power');
    });

    it('should check flag conditions correctly', () => {
      const conditions = [
        { type: 'flag', flag: 'test_flag', value: true }
      ];
      expect(storySystem.checkStoryConditions(conditions)).toBe(true);

      const falseConditions = [
        { type: 'flag', flag: 'test_flag', value: false }
      ];
      expect(storySystem.checkStoryConditions(falseConditions)).toBe(false);
    });

    it('should check event completion conditions', () => {
      const conditions = [
        { type: 'event_completed', eventId: 'completed_event' }
      ];
      expect(storySystem.checkStoryConditions(conditions)).toBe(true);

      const falseConditions = [
        { type: 'event_completed', eventId: 'not_completed' }
      ];
      expect(storySystem.checkStoryConditions(falseConditions)).toBe(false);
    });

    it('should check power unlock conditions', () => {
      const conditions = [
        { type: 'power_unlocked', powerId: 'unlocked_power' }
      ];
      expect(storySystem.checkStoryConditions(conditions)).toBe(true);

      const falseConditions = [
        { type: 'power_unlocked', powerId: 'not_unlocked' }
      ];
      expect(storySystem.checkStoryConditions(falseConditions)).toBe(false);
    });

    it('should handle multiple conditions (AND logic)', () => {
      const conditions = [
        { type: 'flag', flag: 'test_flag', value: true },
        { type: 'event_completed', eventId: 'completed_event' }
      ];
      expect(storySystem.checkStoryConditions(conditions)).toBe(true);

      const mixedConditions = [
        { type: 'flag', flag: 'test_flag', value: true },
        { type: 'event_completed', eventId: 'not_completed' }
      ];
      expect(storySystem.checkStoryConditions(mixedConditions)).toBe(false);
    });

    it('should return true for empty conditions', () => {
      expect(storySystem.checkStoryConditions([])).toBe(true);
      expect(storySystem.checkStoryConditions(null)).toBe(true);
    });
  });

  describe('Story Flags', () => {
    it('should set and get story flags', () => {
      storySystem.setStoryFlag('test_flag', 'test_value');
      expect(storySystem.getStoryFlag('test_flag')).toBe('test_value');
    });

    it('should check story flag values', () => {
      storySystem.setStoryFlag('boolean_flag', true);
      expect(storySystem.checkStoryFlag('boolean_flag', true)).toBe(true);
      expect(storySystem.checkStoryFlag('boolean_flag', false)).toBe(false);
    });

    it('should handle undefined flags', () => {
      expect(storySystem.getStoryFlag('undefined_flag')).toBeUndefined();
      expect(storySystem.checkStoryFlag('undefined_flag', true)).toBe(false);
    });
  });

  describe('Power Management', () => {
    it('should unlock powers', () => {
      storySystem.unlockPower('test_power');
      expect(storySystem.isPowerUnlocked('test_power')).toBe(true);
      expect(storySystem.getUnlockedPowers()).toContain('test_power');
    });

    it('should not duplicate unlocked powers', () => {
      storySystem.unlockPower('test_power');
      storySystem.unlockPower('test_power');
      
      const unlockedPowers = storySystem.getUnlockedPowers();
      expect(unlockedPowers.filter(p => p === 'test_power')).toHaveLength(1);
    });

    it('should check power unlock status', () => {
      expect(storySystem.isPowerUnlocked('not_unlocked')).toBe(false);
      
      storySystem.unlockPower('unlocked_power');
      expect(storySystem.isPowerUnlocked('unlocked_power')).toBe(true);
    });
  });

  describe('Checkpoints', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [],
        checkpoints: {
          'checkpoint_1': { id: 'checkpoint_1', name: 'First Checkpoint' },
          'checkpoint_2': { id: 'checkpoint_2', name: 'Second Checkpoint' }
        }
      };
    });

    it('should set checkpoints', () => {
      storySystem.setCheckpoint('checkpoint_1');
      expect(storySystem.currentCheckpoint).toBe('checkpoint_1');
    });

    it('should get current checkpoint', () => {
      storySystem.setCheckpoint('checkpoint_1');
      const checkpoint = storySystem.getCurrentCheckpoint();
      expect(checkpoint.id).toBe('checkpoint_1');
      expect(checkpoint.name).toBe('First Checkpoint');
    });

    it('should handle invalid checkpoints', () => {
      storySystem.setCheckpoint('invalid_checkpoint');
      expect(storySystem.currentCheckpoint).toBe('game_start'); // Should not change
    });

    it('should check if checkpoint has been reached', () => {
      storySystem.setCheckpoint('checkpoint_1');
      expect(storySystem.hasReachedCheckpoint('checkpoint_1')).toBe(true);
      expect(storySystem.hasReachedCheckpoint('checkpoint_2')).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should add and trigger event listeners', () => {
      const mockCallback = vi.fn();
      storySystem.addEventListener('test_event', mockCallback);
      
      storySystem.emitStoryEvent('test_event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockCallback = vi.fn();
      storySystem.addEventListener('test_event', mockCallback);
      storySystem.removeEventListener('test_event', mockCallback);
      
      storySystem.emitStoryEvent('test_event', { data: 'test' });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      storySystem.addEventListener('test_event', callback1);
      storySystem.addEventListener('test_event', callback2);
      
      storySystem.emitStoryEvent('test_event', { data: 'test' });
      
      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle listener errors gracefully', () => {
      const errorCallback = vi.fn(() => { throw new Error('Test error'); });
      const normalCallback = vi.fn();
      
      storySystem.addEventListener('test_event', errorCallback);
      storySystem.addEventListener('test_event', normalCallback);
      
      storySystem.emitStoryEvent('test_event', { data: 'test' });
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should get story state for saving', () => {
      storySystem.setCheckpoint('test_checkpoint');
      storySystem.completedEvents.add('test_event');
      storySystem.setStoryFlag('test_flag', true);
      storySystem.unlockPower('test_power');
      
      const state = storySystem.getStoryState();
      
      expect(state.currentCheckpoint).toBe('test_checkpoint');
      expect(state.completedEvents).toContain('test_event');
      expect(state.storyFlags.test_flag).toBe(true);
      expect(state.unlockedPowers).toContain('test_power');
    });

    it('should load story state from save data', () => {
      const saveState = {
        currentCheckpoint: 'loaded_checkpoint',
        completedEvents: ['loaded_event'],
        storyFlags: { loaded_flag: 'loaded_value' },
        unlockedPowers: ['loaded_power']
      };
      
      storySystem.loadStoryState(saveState);
      
      expect(storySystem.currentCheckpoint).toBe('loaded_checkpoint');
      expect(storySystem.completedEvents.has('loaded_event')).toBe(true);
      expect(storySystem.getStoryFlag('loaded_flag')).toBe('loaded_value');
      expect(storySystem.isPowerUnlocked('loaded_power')).toBe(true);
    });

    it('should handle null save state gracefully', () => {
      const originalCheckpoint = storySystem.currentCheckpoint;
      storySystem.loadStoryState(null);
      expect(storySystem.currentCheckpoint).toBe(originalCheckpoint);
    });

    it('should reset story to initial state', () => {
      storySystem.setCheckpoint('test_checkpoint');
      storySystem.completedEvents.add('test_event');
      storySystem.setStoryFlag('test_flag', true);
      storySystem.unlockPower('test_power');
      
      storySystem.resetStory();
      
      expect(storySystem.currentCheckpoint).toBe('game_start');
      expect(storySystem.completedEvents.size).toBe(0);
      expect(storySystem.unlockedPowers.size).toBe(0);
      expect(storySystem.getStoryFlag('game_started')).toBe(false);
    });
  });

  describe('Story Progress', () => {
    beforeEach(() => {
      storySystem.storyData = {
        events: [
          { id: 'event1' },
          { id: 'event2' },
          { id: 'event3' }
        ],
        checkpoints: {}
      };
    });

    it('should calculate story progress', () => {
      storySystem.completedEvents.add('event1');
      storySystem.unlockPower('power1');
      
      const progress = storySystem.getStoryProgress();
      
      expect(progress.completedEvents).toBe(1);
      expect(progress.totalEvents).toBe(3);
      expect(progress.progressPercentage).toBeCloseTo(33.33, 1);
      expect(progress.unlockedPowers).toBe(1);
    });

    it('should handle empty story data in progress calculation', () => {
      storySystem.storyData = null;
      
      const progress = storySystem.getStoryProgress();
      
      expect(progress.totalEvents).toBe(0);
      expect(progress.progressPercentage).toBe(0);
    });
  });
});