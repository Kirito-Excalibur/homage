import { describe, it, expect, beforeEach, vi } from 'vitest';
import GameManager from '../src/managers/GameManager.js';

describe('GameManager Integration Tests', () => {
  let gameManager;
  let mockPluginManager;
  let mockGame;

  beforeEach(() => {
    // Mock Phaser game instance
    mockGame = {
      scene: {
        getScene: vi.fn(),
        getScenes: vi.fn(() => [])
      },
      events: {
        on: vi.fn(),
        emit: vi.fn()
      }
    };

    mockPluginManager = {
      game: mockGame
    };

    gameManager = new GameManager(mockPluginManager);
    gameManager.game = mockGame;
  });

  describe('System Integration', () => {
    beforeEach(() => {
      // Mock scene for system initialization
      const mockScene = new Phaser.Scene();
      mockGame.scene.getScene.mockReturnValue(mockScene);
      
      gameManager.init();
      gameManager.start();
    });

    it('should initialize all systems', () => {
      expect(gameManager.storySystem).toBeDefined();
      expect(gameManager.powerSystem).toBeDefined();
      expect(gameManager.inventorySystem).toBeDefined();
      expect(gameManager.saveSystem).toBeDefined();
      expect(gameManager.audioManager).toBeDefined();
    });

    it('should set up system integration', () => {
      const storySystem = gameManager.getStorySystem();
      const powerSystem = gameManager.getPowerSystem();
      
      expect(storySystem).toBeDefined();
      expect(powerSystem).toBeDefined();
      
      // Test story-power integration
      const unlockSpy = vi.spyOn(powerSystem, 'unlockPower');
      storySystem.emitStoryEvent('power_unlocked', { powerId: 'test_power' });
      
      expect(unlockSpy).toHaveBeenCalledWith('test_power', 'story_progression');
    });

    it('should handle power activation story triggers', () => {
      const storySystem = gameManager.getStorySystem();
      const triggerSpy = vi.spyOn(storySystem, 'triggerStoryEvent');
      
      gameManager.checkPowerStoryTriggers('telekinesis', {});
      
      expect(triggerSpy).toHaveBeenCalledWith('first_telekinesis_use');
    });
  });

  describe('Scene State Management', () => {
    beforeEach(() => {
      gameManager.init();
      gameManager.setupSceneStateTracking();
    });

    it('should track current scene', () => {
      const mockScene = { scene: { key: 'GameWorldScene' } };
      mockGame.scene.getScenes.mockReturnValue([mockScene]);
      
      gameManager.updateCurrentScene();
      
      expect(gameManager.gameState.currentScene).toBe('GameWorldScene');
    });

    it('should handle scene transitions', () => {
      const syncSpy = vi.spyOn(gameManager, 'synchronizeSceneStates');
      
      gameManager.handleSceneTransition('MainMenuScene', 'GameWorldScene');
      
      expect(syncSpy).toHaveBeenCalledWith('MainMenuScene', 'GameWorldScene');
    });

    it('should capture scene state', () => {
      const mockScene = {
        player: {
          x: 100,
          y: 200,
          health: 80
        }
      };
      mockGame.scene.getScene.mockReturnValue(mockScene);
      
      gameManager.captureSceneState('GameWorldScene');
      
      const sceneState = gameManager.sceneStates.get('GameWorldScene');
      expect(sceneState).toBeDefined();
      expect(sceneState.data.playerPosition).toEqual({ x: 100, y: 200 });
      expect(sceneState.data.playerHealth).toBe(80);
    });

    it('should synchronize state between scenes', () => {
      const mockFromScene = { player: { x: 100, y: 100 } };
      const mockToScene = { player: { setPosition: vi.fn() } };
      
      mockGame.scene.getScene.mockImplementation((key) => {
        if (key === 'GameWorldScene') return mockToScene;
        return mockFromScene;
      });
      
      gameManager.gameState.syncInProgress = false;
      
      const gameState = {
        player: { position: { x: 150, y: 150 }, health: 90 }
      };
      vi.spyOn(gameManager, 'getCurrentCompleteState').mockReturnValue(gameState);
      vi.spyOn(gameManager, 'validateGameState').mockReturnValue({ isValid: true });
      
      gameManager.synchronizeSceneStates('MainMenuScene', 'GameWorldScene');
      
      expect(mockToScene.player.setPosition).toHaveBeenCalledWith(150, 150);
    });

    it('should handle synchronization errors', () => {
      gameManager.gameState.syncInProgress = false;
      
      vi.spyOn(gameManager, 'getCurrentCompleteState').mockImplementation(() => {
        throw new Error('State error');
      });
      
      expect(() => {
        gameManager.synchronizeSceneStates('Scene1', 'Scene2');
      }).not.toThrow();
      
      expect(gameManager.gameState.syncInProgress).toBe(false);
    });

    it('should prevent concurrent synchronization', () => {
      gameManager.gameState.syncInProgress = true;
      
      const getCurrentSpy = vi.spyOn(gameManager, 'getCurrentCompleteState');
      
      gameManager.synchronizeSceneStates('Scene1', 'Scene2');
      
      expect(getCurrentSpy).not.toHaveBeenCalled();
    });
  });

  describe('State Validation and Recovery', () => {
    beforeEach(() => {
      gameManager.init();
    });

    it('should validate game state correctly', () => {
      const validState = {
        story: {
          currentCheckpoint: 'test',
          completedEvents: []
        },
        power: {
          unlockedPowers: []
        },
        inventory: {
          items: [],
          maxCapacity: 20
        },
        player: {
          position: { x: 100, y: 100 },
          health: 100
        }
      };
      
      const result = gameManager.validateGameState(validState);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid game state', () => {
      const invalidState = {
        story: 'not an object',
        power: { unlockedPowers: 'not an array' }
      };
      
      const result = gameManager.validateGameState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should recover from invalid state using last valid state', () => {
      const lastValidState = { valid: 'state' };
      gameManager.gameState.lastValidState = lastValidState;
      
      const recovered = gameManager.recoverGameState({ invalid: 'state' });
      
      expect(recovered).toEqual(lastValidState);
    });

    it('should recover from state history', () => {
      const historicalState = { historical: 'state' };
      gameManager.stateHistory = [{ invalid: 'state' }, historicalState];
      
      vi.spyOn(gameManager, 'validateGameState')
        .mockReturnValueOnce({ isValid: false })
        .mockReturnValueOnce({ isValid: true });
      
      const recovered = gameManager.recoverGameState({ invalid: 'state' });
      
      expect(recovered).toEqual(historicalState);
    });

    it('should create minimal valid state as last resort', () => {
      gameManager.gameState.lastValidState = null;
      gameManager.stateHistory = [];
      
      const recovered = gameManager.recoverGameState({ invalid: 'state' });
      
      expect(recovered).toBeDefined();
      expect(recovered.version).toBe('1.0.0');
      expect(recovered.story).toBeDefined();
      expect(recovered.player).toBeDefined();
    });

    it('should handle recovery failures', () => {
      vi.spyOn(gameManager, 'createMinimalValidState').mockImplementation(() => {
        throw new Error('Recovery failed');
      });
      
      const recovered = gameManager.recoverGameState({ invalid: 'state' });
      
      expect(recovered).toBeNull();
    });

    it('should store valid state', () => {
      const validState = { valid: 'state' };
      vi.spyOn(gameManager, 'getCurrentCompleteState').mockReturnValue(validState);
      vi.spyOn(gameManager, 'validateGameState').mockReturnValue({ isValid: true });
      
      gameManager.storeValidState();
      
      expect(gameManager.gameState.lastValidState).toEqual(validState);
      expect(gameManager.stateHistory).toContain(validState);
    });

    it('should limit state history size', () => {
      gameManager.maxStateHistory = 2;
      
      const state1 = { state: 1 };
      const state2 = { state: 2 };
      const state3 = { state: 3 };
      
      vi.spyOn(gameManager, 'getCurrentCompleteState')
        .mockReturnValueOnce(state1)
        .mockReturnValueOnce(state2)
        .mockReturnValueOnce(state3);
      vi.spyOn(gameManager, 'validateGameState').mockReturnValue({ isValid: true });
      
      gameManager.storeValidState();
      gameManager.storeValidState();
      gameManager.storeValidState();
      
      expect(gameManager.stateHistory).toHaveLength(2);
      expect(gameManager.stateHistory).toContain(state2);
      expect(gameManager.stateHistory).toContain(state3);
      expect(gameManager.stateHistory).not.toContain(state1);
    });
  });

  describe('Complete Game State Management', () => {
    beforeEach(() => {
      gameManager.init();
      gameManager.start();
    });

    it('should get current complete state', () => {
      const mockScene = {
        player: {
          x: 100,
          y: 200,
          health: 90
        }
      };
      mockGame.scene.getScene.mockReturnValue(mockScene);
      
      const state = gameManager.getCurrentCompleteState();
      
      expect(state.version).toBe('1.0.0');
      expect(state.timestamp).toBeDefined();
      expect(state.story).toBeDefined();
      expect(state.power).toBeDefined();
      expect(state.inventory).toBeDefined();
      expect(state.player).toBeDefined();
      expect(state.world).toBeDefined();
    });

    it('should apply complete game state', () => {
      const gameState = {
        story: { currentCheckpoint: 'test' },
        power: { unlockedPowers: ['test_power'] },
        inventory: { items: [] },
        player: { position: { x: 100, y: 100 } }
      };
      
      const storyLoadSpy = vi.spyOn(gameManager.storySystem, 'loadStoryState');
      const powerLoadSpy = vi.spyOn(gameManager.powerSystem, 'loadPowerSystemState');
      const inventoryLoadSpy = vi.spyOn(gameManager.inventorySystem, 'loadInventoryState');
      
      gameManager.applyGameState(gameState);
      
      expect(storyLoadSpy).toHaveBeenCalledWith(gameState.story);
      expect(powerLoadSpy).toHaveBeenCalledWith(gameState.power);
      expect(inventoryLoadSpy).toHaveBeenCalledWith(gameState.inventory);
    });

    it('should handle apply state errors', () => {
      const gameState = { story: { invalid: 'data' } };
      
      vi.spyOn(gameManager.storySystem, 'loadStoryState').mockImplementation(() => {
        throw new Error('Load failed');
      });
      
      expect(() => gameManager.applyGameState(gameState)).not.toThrow();
    });
  });

  describe('Save/Load Integration', () => {
    beforeEach(() => {
      gameManager.init();
      gameManager.start();
    });

    it('should save game through GameManager', () => {
      const saveSpy = vi.spyOn(gameManager.saveSystem, 'manualSave').mockReturnValue(true);
      
      const result = gameManager.saveGame(1);
      
      expect(result).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith(1);
    });

    it('should load game through GameManager', () => {
      const loadSpy = vi.spyOn(gameManager.saveSystem, 'loadGame').mockReturnValue(true);
      
      const result = gameManager.loadGame('test_save');
      
      expect(result).toBe(true);
      expect(loadSpy).toHaveBeenCalledWith('test_save');
    });

    it('should handle save system unavailability', () => {
      gameManager.saveSystem = null;
      
      expect(gameManager.saveGame()).toBe(false);
      expect(gameManager.loadGame()).toBe(false);
    });

    it('should get available saves', () => {
      const mockSaves = [{ type: 'auto' }, { type: 'manual' }];
      vi.spyOn(gameManager.saveSystem, 'getAvailableSaves').mockReturnValue(mockSaves);
      
      const saves = gameManager.getAvailableSaves();
      
      expect(saves).toEqual(mockSaves);
    });

    it('should delete saves', () => {
      const deleteSpy = vi.spyOn(gameManager.saveSystem, 'deleteSave').mockReturnValue(true);
      
      const result = gameManager.deleteSave('test_save');
      
      expect(result).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith('test_save');
    });

    it('should manage auto-save settings', () => {
      const setSpy = vi.spyOn(gameManager.saveSystem, 'setAutoSaveEnabled');
      const getSpy = vi.spyOn(gameManager.saveSystem, 'isAutoSaveEnabled').mockReturnValue(true);
      
      gameManager.setAutoSaveEnabled(false);
      const isEnabled = gameManager.isAutoSaveEnabled();
      
      expect(setSpy).toHaveBeenCalledWith(false);
      expect(isEnabled).toBe(true);
    });
  });

  describe('Game Reset', () => {
    beforeEach(() => {
      gameManager.init();
      gameManager.start();
    });

    it('should reset all systems', () => {
      const storyResetSpy = vi.spyOn(gameManager.storySystem, 'resetStory');
      const powerResetSpy = vi.spyOn(gameManager.powerSystem, 'resetPowerSystem');
      const inventoryResetSpy = vi.spyOn(gameManager.inventorySystem, 'resetInventory');
      
      gameManager.resetGame();
      
      expect(storyResetSpy).toHaveBeenCalled();
      expect(powerResetSpy).toHaveBeenCalled();
      expect(inventoryResetSpy).toHaveBeenCalled();
    });

    it('should clear save data on reset', () => {
      const mockSaves = [
        { key: 'auto_save' },
        { key: 'manual_save_0' }
      ];
      vi.spyOn(gameManager.saveSystem, 'getAvailableSaves').mockReturnValue(mockSaves);
      const deleteSpy = vi.spyOn(gameManager.saveSystem, 'deleteSave');
      
      gameManager.resetGame();
      
      expect(deleteSpy).toHaveBeenCalledWith('auto_save');
      expect(deleteSpy).toHaveBeenCalledWith('manual_save_0');
      expect(localStorage.removeItem).toHaveBeenCalledWith('rpg_save_data');
    });
  });

  describe('Debug Tools', () => {
    beforeEach(() => {
      gameManager.gameState.debugMode = true;
      gameManager.initializeDebugTools();
    });

    it('should initialize debug tools in debug mode', () => {
      expect(gameManager.debugTools).toBeDefined();
      expect(window.gameDebug).toBeDefined();
    });

    it('should provide debug commands', () => {
      expect(typeof window.gameDebug.getState).toBe('function');
      expect(typeof window.gameDebug.validateState).toBe('function');
      expect(typeof window.gameDebug.recoverState).toBe('function');
      expect(typeof window.gameDebug.getHistory).toBe('function');
    });

    it('should create state inspector', () => {
      const inspector = gameManager.debugTools.stateInspector;
      const testState = { test: 'data' };
      
      const inspection = inspector.inspect(testState);
      
      expect(inspection.state).toEqual(testState);
      expect(inspection.validation).toBeDefined();
      expect(inspection.size).toBeGreaterThan(0);
      expect(inspection.systems).toBeInstanceOf(Array);
    });

    it('should compare states', () => {
      const inspector = gameManager.debugTools.stateInspector;
      const state1 = { a: 1, b: { c: 2 } };
      const state2 = { a: 2, b: { c: 2 } };
      
      const differences = inspector.compare(state1, state2);
      
      expect(differences).toHaveLength(1);
      expect(differences[0].path).toBe('a');
      expect(differences[0].type).toBe('changed');
      expect(differences[0].oldValue).toBe(2);
      expect(differences[0].newValue).toBe(1);
    });

    it('should get debug information', () => {
      const debugInfo = gameManager.getDebugInfo();
      
      expect(debugInfo.gameState).toBeDefined();
      expect(debugInfo.stateHistory).toBeDefined();
      expect(debugInfo.sceneStates).toBeDefined();
      expect(debugInfo.validators).toBeDefined();
      expect(debugInfo.currentState).toBeDefined();
      expect(debugInfo.validation).toBeDefined();
    });

    it('should toggle debug mode', () => {
      gameManager.setDebugMode(false);
      expect(gameManager.gameState.debugMode).toBe(false);
      
      gameManager.setDebugMode(true);
      expect(gameManager.gameState.debugMode).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      gameManager.init();
    });

    it('should handle system initialization errors', () => {
      mockGame.scene.getScene.mockReturnValue(null);
      
      expect(() => gameManager.start()).not.toThrow();
    });

    it('should handle story data loading errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(gameManager.loadStoryData()).resolves.not.toThrow();
    });

    it('should handle invalid state during synchronization', () => {
      gameManager.gameState.syncInProgress = false;
      
      vi.spyOn(gameManager, 'getCurrentCompleteState').mockReturnValue({ invalid: 'state' });
      vi.spyOn(gameManager, 'validateGameState').mockReturnValue({ 
        isValid: false, 
        errors: ['test error'] 
      });
      vi.spyOn(gameManager, 'recoverGameState').mockReturnValue(null);
      
      expect(() => {
        gameManager.synchronizeSceneStates('Scene1', 'Scene2');
      }).not.toThrow();
    });
  });
});