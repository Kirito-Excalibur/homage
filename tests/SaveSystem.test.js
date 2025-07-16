import { describe, it, expect, beforeEach, vi } from 'vitest';
import SaveSystem from '../src/systems/SaveSystem.js';

describe('SaveSystem', () => {
  let saveSystem;
  let mockScene;
  let mockGameManager;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    
    // Mock GameManager
    mockGameManager = {
      getStorySystem: vi.fn(() => ({
        addEventListener: vi.fn(),
        getCurrentCheckpoint: vi.fn(() => ({ id: 'test_checkpoint' }))
      })),
      getCurrentCompleteState: vi.fn(() => ({
        version: '1.0.0',
        story: { currentCheckpoint: 'test_checkpoint' },
        player: { position: { x: 100, y: 100 }, health: 100 },
        world: { currentMap: 'test_map' }
      })),
      validateGameState: vi.fn(() => ({ isValid: true, errors: [] })),
      recoverGameState: vi.fn(),
      applyGameState: vi.fn(),
      storeValidState: vi.fn()
    };
    
    mockScene.plugins = {
      get: vi.fn(() => mockGameManager)
    };
    
    mockScene.scene = {
      get: vi.fn(() => ({
        player: {
          setPosition: vi.fn(),
          health: 100
        }
      }))
    };
    
    saveSystem = new SaveSystem(mockScene);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(saveSystem.scene).toBe(mockScene);
      expect(saveSystem.autoSaveEnabled).toBe(true);
      expect(saveSystem.saveSlots).toBe(3);
      expect(saveSystem.currentSaveSlot).toBe(0);
    });

    it('should get GameManager reference', () => {
      expect(saveSystem.gameManager).toBe(mockGameManager);
    });

    it('should set up auto-save listeners', () => {
      const storySystem = mockGameManager.getStorySystem();
      expect(storySystem.addEventListener).toHaveBeenCalledWith('checkpoint_reached', expect.any(Function));
      expect(storySystem.addEventListener).toHaveBeenCalledWith('power_unlocked', expect.any(Function));
    });
  });

  describe('Auto Save', () => {
    it('should perform auto-save when enabled', () => {
      const saveSpy = vi.spyOn(saveSystem, 'saveToPersistentStorage').mockReturnValue(true);
      
      saveSystem.autoSave('test_trigger');
      
      expect(saveSpy).toHaveBeenCalledWith('auto_save', expect.objectContaining({
        saveType: 'auto',
        trigger: 'test_trigger'
      }));
    });

    it('should not auto-save when disabled', () => {
      saveSystem.setAutoSaveEnabled(false);
      const saveSpy = vi.spyOn(saveSystem, 'saveToPersistentStorage');
      
      saveSystem.autoSave('test_trigger');
      
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should handle auto-save failures gracefully', () => {
      mockGameManager.getCurrentCompleteState.mockReturnValue(null);
      
      expect(() => saveSystem.autoSave('test_trigger')).not.toThrow();
    });
  });

  describe('Manual Save', () => {
    it('should perform manual save successfully', () => {
      const saveSpy = vi.spyOn(saveSystem, 'saveToPersistentStorage').mockReturnValue(true);
      
      const result = saveSystem.manualSave(1);
      
      expect(result).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith('manual_save_1', expect.objectContaining({
        saveType: 'manual',
        slotIndex: 1
      }));
    });

    it('should reject invalid save slots', () => {
      const result = saveSystem.manualSave(5);
      expect(result).toBe(false);
      
      const result2 = saveSystem.manualSave(-1);
      expect(result2).toBe(false);
    });

    it('should handle manual save failures', () => {
      vi.spyOn(saveSystem, 'saveToPersistentStorage').mockReturnValue(false);
      
      const result = saveSystem.manualSave(0);
      expect(result).toBe(false);
    });

    it('should use default slot when none specified', () => {
      const saveSpy = vi.spyOn(saveSystem, 'saveToPersistentStorage').mockReturnValue(true);
      
      saveSystem.manualSave();
      
      expect(saveSpy).toHaveBeenCalledWith('manual_save_0', expect.any(Object));
    });
  });

  describe('Save Data Creation', () => {
    it('should create valid save data', () => {
      const saveData = saveSystem.createSaveData();
      
      expect(saveData).toBeDefined();
      expect(saveData.version).toBe('1.0.0');
      expect(saveData.timestamp).toBeDefined();
      expect(saveData.gameState).toBeDefined();
      expect(saveData.metadata).toBeDefined();
    });

    it('should handle invalid game state during save creation', () => {
      mockGameManager.validateGameState.mockReturnValue({ 
        isValid: false, 
        errors: ['test error'] 
      });
      mockGameManager.recoverGameState.mockReturnValue({
        version: '1.0.0',
        story: { currentCheckpoint: 'recovered' }
      });
      
      const saveData = saveSystem.createSaveData();
      
      expect(saveData).toBeDefined();
      expect(mockGameManager.recoverGameState).toHaveBeenCalled();
    });

    it('should return null when state recovery fails', () => {
      mockGameManager.validateGameState.mockReturnValue({ 
        isValid: false, 
        errors: ['test error'] 
      });
      mockGameManager.recoverGameState.mockReturnValue(null);
      
      const saveData = saveSystem.createSaveData();
      
      expect(saveData).toBeNull();
    });

    it('should handle GameManager unavailability', () => {
      saveSystem.gameManager = null;
      
      const saveData = saveSystem.createSaveData();
      
      expect(saveData).toBeNull();
    });
  });

  describe('Persistent Storage', () => {
    it('should save to localStorage successfully', () => {
      const testData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: { test: 'data' },
        metadata: {}
      };
      
      const result = saveSystem.saveToPersistentStorage('test_save', testData);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'rpg_test_save',
        JSON.stringify(testData)
      );
    });

    it('should handle storage quota exceeded', () => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      localStorage.setItem.mockImplementation(() => { throw error; });
      
      const cleanupSpy = vi.spyOn(saveSystem, 'handleStorageSpaceError');
      
      const result = saveSystem.saveToPersistentStorage('test_save', { test: 'data' });
      
      expect(result).toBe(false);
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should validate save data before saving', () => {
      const invalidData = { invalid: 'data' };
      
      const result = saveSystem.saveToPersistentStorage('test_save', invalidData);
      
      expect(result).toBe(false);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should check storage space', () => {
      const largeSpy = vi.spyOn(saveSystem, 'checkStorageSpace').mockReturnValue(false);
      const handleSpy = vi.spyOn(saveSystem, 'handleStorageSpaceError');
      
      const result = saveSystem.saveToPersistentStorage('test_save', {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: {},
        metadata: {}
      });
      
      expect(result).toBe(false);
      expect(handleSpy).toHaveBeenCalled();
    });
  });

  describe('Save Data Validation', () => {
    it('should validate correct save data', () => {
      const validData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: { test: 'data' },
        metadata: {}
      };
      
      expect(saveSystem.validateSaveData(validData)).toBe(true);
    });

    it('should reject invalid save data', () => {
      expect(saveSystem.validateSaveData(null)).toBe(false);
      expect(saveSystem.validateSaveData({})).toBe(false);
      expect(saveSystem.validateSaveData({ version: '1.0.0' })).toBe(false);
    });
  });

  describe('Storage Management', () => {
    it('should calculate storage usage', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key.startsWith('rpg_')) return 'test data';
        return null;
      });
      
      Object.defineProperty(localStorage, 'length', { value: 2 });
      Object.defineProperty(localStorage, '0', { value: 'rpg_save1' });
      Object.defineProperty(localStorage, '1', { value: 'rpg_save2' });
      
      const usage = saveSystem.getStorageUsage();
      expect(usage).toBeGreaterThan(0);
    });

    it('should check storage space availability', () => {
      vi.spyOn(saveSystem, 'getStorageUsage').mockReturnValue(1000);
      
      const smallData = 'small';
      const largeData = 'x'.repeat(6 * 1024 * 1024); // 6MB
      
      expect(saveSystem.checkStorageSpace(smallData)).toBe(true);
      expect(saveSystem.checkStorageSpace(largeData)).toBe(false);
    });

    it('should handle storage space check errors', () => {
      vi.spyOn(saveSystem, 'getStorageUsage').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(saveSystem.checkStorageSpace('test')).toBe(true);
    });

    it('should clean up old saves', () => {
      // Mock localStorage with old auto-saves
      const oldSaves = {
        'rpg_auto_save_1': JSON.stringify({ timestamp: Date.now() - 10000 }),
        'rpg_auto_save_2': JSON.stringify({ timestamp: Date.now() - 5000 }),
        'rpg_auto_save_3': JSON.stringify({ timestamp: Date.now() - 1000 })
      };
      
      Object.keys(oldSaves).forEach(key => {
        localStorage.getItem.mockImplementation((k) => k === key ? oldSaves[k] : null);
      });
      
      Object.defineProperty(localStorage, 'length', { value: 3 });
      Object.keys(oldSaves).forEach((key, index) => {
        Object.defineProperty(localStorage, index.toString(), { value: key });
      });
      
      saveSystem.cleanupOldSaves();
      
      expect(localStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Game Loading', () => {
    it('should load game successfully', () => {
      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: { test: 'data' },
        metadata: {}
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(saveData));
      vi.spyOn(saveSystem, 'loadGameState').mockReturnValue(true);
      
      const result = saveSystem.loadGame('test_save');
      
      expect(result).toBe(true);
      expect(saveSystem.loadGameState).toHaveBeenCalledWith(saveData.gameState);
    });

    it('should handle missing save data', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = saveSystem.loadGame('non_existent');
      
      expect(result).toBe(false);
    });

    it('should handle corrupted save data', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      const handleCorruptedSpy = vi.spyOn(saveSystem, 'handleCorruptedSave');
      
      const result = saveSystem.loadGame('corrupted_save');
      
      expect(result).toBe(false);
      expect(handleCorruptedSpy).toHaveBeenCalled();
    });

    it('should handle invalid save data structure', () => {
      const invalidSave = { invalid: 'structure' };
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidSave));
      const handleCorruptedSpy = vi.spyOn(saveSystem, 'handleCorruptedSave');
      
      const result = saveSystem.loadGame('invalid_save');
      
      expect(result).toBe(false);
      expect(handleCorruptedSpy).toHaveBeenCalled();
    });

    it('should handle version incompatibility', () => {
      const saveData = {
        version: '0.5.0',
        timestamp: Date.now(),
        gameState: { test: 'data' },
        metadata: {}
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(saveData));
      vi.spyOn(saveSystem, 'isVersionCompatible').mockReturnValue(false);
      vi.spyOn(saveSystem, 'migrateSaveData').mockReturnValue(false);
      
      const result = saveSystem.loadGame('old_version');
      
      expect(result).toBe(false);
    });
  });

  describe('Game State Loading', () => {
    it('should load valid game state', () => {
      const gameState = {
        story: { currentCheckpoint: 'test' },
        player: { position: { x: 100, y: 100 } }
      };
      
      const result = saveSystem.loadGameState(gameState);
      
      expect(result).toBe(true);
      expect(mockGameManager.applyGameState).toHaveBeenCalledWith(gameState);
    });

    it('should handle invalid game state during loading', () => {
      mockGameManager.validateGameState.mockReturnValue({
        isValid: false,
        errors: ['test error']
      });
      mockGameManager.recoverGameState.mockReturnValue({
        story: { currentCheckpoint: 'recovered' }
      });
      
      const result = saveSystem.loadGameState({ invalid: 'state' });
      
      expect(result).toBe(true);
      expect(mockGameManager.recoverGameState).toHaveBeenCalled();
      expect(mockGameManager.applyGameState).toHaveBeenCalled();
    });

    it('should fail when state recovery fails during loading', () => {
      mockGameManager.validateGameState.mockReturnValue({
        isValid: false,
        errors: ['test error']
      });
      mockGameManager.recoverGameState.mockReturnValue(null);
      
      const result = saveSystem.loadGameState({ invalid: 'state' });
      
      expect(result).toBe(false);
    });

    it('should handle GameManager unavailability during loading', () => {
      saveSystem.gameManager = null;
      
      const result = saveSystem.loadGameState({ test: 'state' });
      
      expect(result).toBe(false);
    });
  });

  describe('Version Compatibility', () => {
    it('should check version compatibility', () => {
      expect(saveSystem.isVersionCompatible('1.0.0')).toBe(true);
      expect(saveSystem.isVersionCompatible('0.9.0')).toBe(false);
      expect(saveSystem.isVersionCompatible('2.0.0')).toBe(false);
    });

    it('should handle save data migration', () => {
      const result = saveSystem.migrateSaveData({ version: '0.9.0' });
      expect(result).toBe(false); // Not implemented
    });
  });

  describe('Corrupted Save Handling', () => {
    it('should handle corrupted saves', () => {
      localStorage.getItem.mockReturnValue('corrupted data');
      
      saveSystem.handleCorruptedSave('rpg_corrupted_save');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'rpg_corrupted_save_corrupted_backup',
        'corrupted data'
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith('rpg_corrupted_save');
    });

    it('should handle backup creation errors', () => {
      localStorage.getItem.mockReturnValue('corrupted data');
      localStorage.setItem.mockImplementation(() => { throw new Error('Backup failed'); });
      
      expect(() => saveSystem.handleCorruptedSave('rpg_corrupted_save')).not.toThrow();
      expect(localStorage.removeItem).toHaveBeenCalledWith('rpg_corrupted_save');
    });
  });

  describe('Save Management', () => {
    it('should get available saves', () => {
      const autoSave = {
        timestamp: Date.now(),
        metadata: { playTime: 1000 }
      };
      const manualSave = {
        timestamp: Date.now() - 5000,
        metadata: { playTime: 2000 }
      };
      
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'rpg_auto_save') return JSON.stringify(autoSave);
        if (key === 'rpg_manual_save_0') return JSON.stringify(manualSave);
        return null;
      });
      
      const saves = saveSystem.getAvailableSaves();
      
      expect(saves).toHaveLength(2);
      expect(saves[0].type).toBe('auto');
      expect(saves[1].type).toBe('manual');
    });

    it('should handle invalid save data in available saves', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'rpg_auto_save') return 'invalid json';
        return null;
      });
      
      const saves = saveSystem.getAvailableSaves();
      
      expect(saves).toHaveLength(0);
    });

    it('should delete saves', () => {
      const result = saveSystem.deleteSave('test_save');
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('rpg_test_save');
    });

    it('should handle delete errors', () => {
      localStorage.removeItem.mockImplementation(() => { throw new Error('Delete failed'); });
      
      const result = saveSystem.deleteSave('test_save');
      
      expect(result).toBe(false);
    });
  });

  describe('Auto-Save Settings', () => {
    it('should enable/disable auto-save', () => {
      saveSystem.setAutoSaveEnabled(false);
      expect(saveSystem.isAutoSaveEnabled()).toBe(false);
      
      saveSystem.setAutoSaveEnabled(true);
      expect(saveSystem.isAutoSaveEnabled()).toBe(true);
    });
  });

  describe('Status and Notifications', () => {
    it('should show save notifications', () => {
      const eventSpy = vi.fn();
      mockScene.events = { emit: eventSpy };
      
      saveSystem.showSaveNotification('Test message');
      
      expect(eventSpy).toHaveBeenCalledWith('save_notification', 'Test message');
    });

    it('should show save confirmation', () => {
      const notificationSpy = vi.spyOn(saveSystem, 'showSaveNotification');
      
      saveSystem.showSaveConfirmation(1);
      
      expect(notificationSpy).toHaveBeenCalledWith('Game saved to slot 2');
    });

    it('should show corrupted save error', () => {
      const eventSpy = vi.fn();
      mockScene.events = { emit: eventSpy };
      
      saveSystem.showCorruptedSaveError();
      
      expect(eventSpy).toHaveBeenCalledWith('save_error', expect.any(String));
    });

    it('should get system status', () => {
      vi.spyOn(saveSystem, 'getAvailableSaves').mockReturnValue([{}, {}]);
      vi.spyOn(saveSystem, 'getStorageUsage').mockReturnValue(1024);
      vi.spyOn(saveSystem, 'getSaveCount').mockReturnValue(5);
      
      const status = saveSystem.getStatus();
      
      expect(status.autoSaveEnabled).toBe(true);
      expect(status.availableSaves).toBe(2);
      expect(status.storageUsage).toBe(1024);
      expect(status.saveCount).toBe(5);
    });
  });

  describe('Utility Functions', () => {
    it('should calculate play time', () => {
      const startTime = Date.now() - 10000;
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'game_start_time') return startTime.toString();
        return null;
      });
      
      const playTime = saveSystem.calculatePlayTime();
      
      expect(playTime).toBeGreaterThan(9000);
      expect(playTime).toBeLessThan(11000);
    });

    it('should handle missing start time', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const playTime = saveSystem.calculatePlayTime();
      
      expect(playTime).toBe(0);
    });

    it('should get save count', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'save_count') return '5';
        return null;
      });
      
      const count = saveSystem.getSaveCount();
      
      expect(count).toBe(5);
    });

    it('should handle missing save count', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const count = saveSystem.getSaveCount();
      
      expect(count).toBe(0);
    });
  });
});