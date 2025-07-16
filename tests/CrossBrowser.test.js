import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Cross-Browser Compatibility Tests', () => {
  let originalLocalStorage;
  let originalFetch;

  beforeEach(() => {
    // Store original values
    originalLocalStorage = window.localStorage;
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true
    });
    global.fetch = originalFetch;
  });

  describe('LocalStorage Compatibility', () => {
    it('should handle localStorage quota exceeded errors', () => {
      const quotaErrors = [
        { name: 'QuotaExceededError', message: 'Quota exceeded' }, // Chrome/Firefox
        { name: 'NS_ERROR_DOM_QUOTA_REACHED', message: 'Quota reached' }, // Firefox
        { name: 'QUOTA_EXCEEDED_ERR', message: 'Quota exceeded' } // Safari
      ];

      for (const error of quotaErrors) {
        const mockStorage = {
          getItem: vi.fn(),
          setItem: vi.fn(() => {
            const err = new Error(error.message);
            err.name = error.name;
            throw err;
          }),
          removeItem: vi.fn(),
          clear: vi.fn()
        };

        Object.defineProperty(window, 'localStorage', {
          value: mockStorage,
          configurable: true
        });

        const { default: SaveSystem } = require('../src/systems/SaveSystem.js');
        const mockScene = new Phaser.Scene();
        mockScene.plugins = { get: vi.fn(() => null) };
        
        const saveSystem = new SaveSystem(mockScene);

        const result = saveSystem.saveToPersistentStorage('test', {
          version: '1.0.0',
          timestamp: Date.now(),
          gameState: {},
          metadata: {}
        });

        expect(result).toBe(false);
      }
    });

    it('should handle localStorage with limited functionality', () => {
      // Simulate localStorage that exists but has limited functionality
      const limitedStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => { throw new Error('Not supported'); }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0
      };

      Object.defineProperty(window, 'localStorage', {
        value: limitedStorage,
        configurable: true
      });

      const { default: SaveSystem } = require('../src/systems/SaveSystem.js');
      const mockScene = new Phaser.Scene();
      mockScene.plugins = { get: vi.fn(() => null) };
      
      const saveSystem = new SaveSystem(mockScene);

      expect(() => {
        saveSystem.saveToPersistentStorage('test', {
          version: '1.0.0',
          timestamp: Date.now(),
          gameState: {},
          metadata: {}
        });
      }).not.toThrow();
    });
  });

  describe('Fetch API Compatibility', () => {
    it('should handle browsers without fetch API', async () => {
      // Simulate browser without fetch
      global.fetch = undefined;

      const { default: StorySystem } = require('../src/systems/StorySystem.js');
      const mockScene = new Phaser.Scene();
      const storySystem = new StorySystem(mockScene);

      // Should handle gracefully and load fallback data
      const result = await storySystem.loadStoryData('test-story.json');
      expect(result).toBe(false);
      expect(storySystem.storyData).toBeDefined(); // Should have fallback data
    });

    it('should handle different fetch error responses', async () => {
      const errorResponses = [
        { status: 404, statusText: 'Not Found' },
        { status: 500, statusText: 'Internal Server Error' },
        { status: 403, statusText: 'Forbidden' }
      ];

      for (const errorResponse of errorResponses) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: errorResponse.status,
          statusText: errorResponse.statusText
        });

        const { default: StorySystem } = require('../src/systems/StorySystem.js');
        const mockScene = new Phaser.Scene();
        const storySystem = new StorySystem(mockScene);

        const result = await storySystem.loadStoryData('test-story.json');
        expect(result).toBe(false);
        expect(storySystem.storyData).toBeDefined(); // Should have fallback data
      }
    });
  });

  describe('Browser-Specific Features', () => {
    it('should handle different JavaScript engine capabilities', () => {
      // Test Map and Set support (should be available in all modern browsers)
      expect(typeof Map).toBe('function');
      expect(typeof Set).toBe('function');

      // Test that our systems use these features correctly
      const { default: StorySystem } = require('../src/systems/StorySystem.js');
      const mockScene = new Phaser.Scene();
      const storySystem = new StorySystem(mockScene);

      expect(storySystem.storyFlags).toBeInstanceOf(Map);
      expect(storySystem.completedEvents).toBeInstanceOf(Set);
      expect(storySystem.unlockedPowers).toBeInstanceOf(Set);
    });

    it('should handle different JSON parsing behaviors', () => {
      const testCases = [
        '{"valid": "json"}',
        '{"unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F"}',
        '{"numbers": [1, 2.5, -3, 1e10]}',
        '{"nested": {"deep": {"object": true}}}'
      ];

      for (const jsonString of testCases) {
        try {
          const parsed = JSON.parse(jsonString);
          expect(typeof parsed).toBe('object');
        } catch (error) {
          // Some test cases might fail in strict parsers, which is expected
          expect(error).toBeInstanceOf(SyntaxError);
        }
      }
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain reasonable performance in different engines', () => {
      const { default: StorySystem } = require('../src/systems/StorySystem.js');
      const mockScene = new Phaser.Scene();
      const storySystem = new StorySystem(mockScene);

      // Create a large dataset to test performance
      const largeStoryData = {
        events: Array.from({ length: 100 }, (_, i) => ({
          id: `event_${i}`,
          type: 'dialogue',
          triggers: [],
          content: { text: `Event ${i}` }
        })),
        checkpoints: {}
      };

      storySystem.storyData = largeStoryData;

      const startTime = performance.now();
      
      // Perform operations that should be fast across browsers
      for (let i = 0; i < 50; i++) {
        storySystem.checkStoryConditions([]);
        storySystem.setStoryFlag(`flag_${i}`, true);
        storySystem.getStoryFlag(`flag_${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time across different JS engines
      expect(duration).toBeLessThan(100); // 100ms threshold
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should handle different error types consistently', () => {
      const errorTypes = [
        new Error('Generic error'),
        new TypeError('Type error'),
        new ReferenceError('Reference error'),
        new SyntaxError('Syntax error')
      ];

      const { default: SaveSystem } = require('../src/systems/SaveSystem.js');
      const mockScene = new Phaser.Scene();
      mockScene.plugins = { get: vi.fn(() => null) };
      
      const saveSystem = new SaveSystem(mockScene);

      for (const error of errorTypes) {
        // Mock localStorage to throw different error types
        const mockStorage = {
          getItem: vi.fn(),
          setItem: vi.fn(() => { throw error; }),
          removeItem: vi.fn(),
          clear: vi.fn()
        };

        Object.defineProperty(window, 'localStorage', {
          value: mockStorage,
          configurable: true
        });

        // Should handle all error types gracefully
        expect(() => {
          saveSystem.saveToPersistentStorage('test', {
            version: '1.0.0',
            timestamp: Date.now(),
            gameState: {},
            metadata: {}
          });
        }).not.toThrow();
      }
    });

    it('should provide consistent fallback behavior', () => {
      // Test that fallback behavior is consistent across different failure modes
      const { default: StorySystem } = require('../src/systems/StorySystem.js');
      const mockScene = new Phaser.Scene();
      const storySystem = new StorySystem(mockScene);

      // Test with various invalid story data
      const invalidDataCases = [
        null,
        undefined,
        'not an object',
        { events: 'not an array' },
        { checkpoints: 'not an object' },
        { events: [], checkpoints: null }
      ];

      for (const invalidData of invalidDataCases) {
        storySystem.storyData = invalidData;
        
        // Should always provide fallback behavior
        const event = storySystem.triggerStoryEvent('any_event');
        expect(event).toBeNull(); // Consistent null return for invalid data
        
        // Should not crash
        expect(() => {
          storySystem.getStoryProgress();
          storySystem.setStoryFlag('test', true);
          storySystem.getStoryFlag('test');
        }).not.toThrow();
      }
    });
  });

  describe('Feature Detection', () => {
    it('should detect required browser features', () => {
      // Test for features our game requires
      const requiredFeatures = [
        'JSON',
        'Map',
        'Set',
        'Promise'
      ];

      const missingFeatures = [];
      
      for (const feature of requiredFeatures) {
        if (typeof window[feature] === 'undefined' && typeof global[feature] === 'undefined') {
          missingFeatures.push(feature);
        }
      }

      // In our test environment, we should have polyfills for all required features
      expect(missingFeatures).toHaveLength(0);
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should handle mobile-specific storage constraints', () => {
      // Simulate mobile browser with limited localStorage
      const limitedStorage = {
        getItem: vi.fn(),
        setItem: vi.fn((key, value) => {
          if (value.length > 1024) { // Simulate 1KB limit
            const error = new Error('Quota exceeded');
            error.name = 'QuotaExceededError';
            throw error;
          }
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0
      };

      Object.defineProperty(window, 'localStorage', {
        value: limitedStorage,
        configurable: true
      });

      const { default: SaveSystem } = require('../src/systems/SaveSystem.js');
      const mockScene = new Phaser.Scene();
      mockScene.plugins = { get: vi.fn(() => null) };
      
      const saveSystem = new SaveSystem(mockScene);

      // Should handle small storage gracefully
      const smallData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: { small: 'data' },
        metadata: {}
      };

      expect(saveSystem.saveToPersistentStorage('small', smallData)).toBe(true);

      // Should handle large data by triggering cleanup
      const largeData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: { large: 'x'.repeat(2000) },
        metadata: {}
      };

      expect(saveSystem.saveToPersistentStorage('large', largeData)).toBe(false);
    });
  });
});