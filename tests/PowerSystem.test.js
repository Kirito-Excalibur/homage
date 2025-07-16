import { describe, it, expect, beforeEach, vi } from 'vitest';
import PowerSystem from '../src/systems/PowerSystem.js';

describe('PowerSystem', () => {
  let powerSystem;
  let mockScene;

  beforeEach(() => {
    mockScene = new Phaser.Scene();
    mockScene.player = {
      getPosition: () => ({ x: 100, y: 100 }),
      sprite: {
        x: 100,
        y: 100,
        setAlpha: vi.fn(),
        setTint: vi.fn(),
        clearTint: vi.fn(),
        depth: 10
      },
      isPhasing: false
    };
    powerSystem = new PowerSystem(mockScene);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(powerSystem.scene).toBe(mockScene);
      expect(powerSystem.powers).toBeInstanceOf(Map);
      expect(powerSystem.unlockedPowers).toBeInstanceOf(Set);
      expect(powerSystem.activePowers).toBeInstanceOf(Map);
      expect(powerSystem.cooldowns).toBeInstanceOf(Map);
    });

    it('should initialize power definitions', () => {
      expect(powerSystem.powers.size).toBeGreaterThan(0);
      expect(powerSystem.powers.has('telekinesis')).toBe(true);
      expect(powerSystem.powers.has('enhanced_vision')).toBe(true);
      expect(powerSystem.powers.has('time_slow')).toBe(true);
      expect(powerSystem.powers.has('phase_walk')).toBe(true);
    });

    it('should set up power controls', () => {
      expect(powerSystem.powerKeys).toBeDefined();
    });
  });

  describe('Power Definitions', () => {
    it('should have correct power properties', () => {
      const telekinesis = powerSystem.getPower('telekinesis');
      
      expect(telekinesis.id).toBe('telekinesis');
      expect(telekinesis.name).toBe('Telekinesis');
      expect(telekinesis.type).toBe('active');
      expect(telekinesis.cooldown).toBe(3000);
      expect(telekinesis.activationKey).toBe('Q');
      expect(telekinesis.effects).toBeInstanceOf(Array);
    });

    it('should have different power types', () => {
      expect(powerSystem.getPower('telekinesis').type).toBe('active');
      expect(powerSystem.getPower('enhanced_vision').type).toBe('toggle');
    });
  });

  describe('Power Unlocking', () => {
    it('should unlock powers successfully', () => {
      const result = powerSystem.unlockPower('telekinesis', 'story_trigger');
      
      expect(result).toBe(true);
      expect(powerSystem.unlockedPowers.has('telekinesis')).toBe(true);
    });

    it('should not unlock non-existent powers', () => {
      const result = powerSystem.unlockPower('non_existent_power');
      
      expect(result).toBe(false);
      expect(powerSystem.unlockedPowers.has('non_existent_power')).toBe(false);
    });

    it('should not duplicate unlocked powers', () => {
      powerSystem.unlockPower('telekinesis');
      const result = powerSystem.unlockPower('telekinesis');
      
      expect(result).toBe(false);
      expect(powerSystem.getUnlockedPowerList()).toHaveLength(1);
    });

    it('should emit power unlock events', () => {
      const mockCallback = vi.fn();
      powerSystem.addEventListener('power_unlocked', mockCallback);
      
      powerSystem.unlockPower('telekinesis', 'test_trigger');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          powerId: 'telekinesis',
          storyTrigger: 'test_trigger'
        })
      );
    });
  });

  describe('Power Availability', () => {
    beforeEach(() => {
      powerSystem.unlockPower('telekinesis');
    });

    it('should check power availability correctly', () => {
      expect(powerSystem.checkPowerAvailability('telekinesis')).toBe(true);
      expect(powerSystem.checkPowerAvailability('enhanced_vision')).toBe(false);
      expect(powerSystem.checkPowerAvailability('non_existent')).toBe(false);
    });

    it('should respect cooldowns', () => {
      // Set a cooldown
      powerSystem.cooldowns.set('telekinesis', Date.now() + 5000);
      
      expect(powerSystem.checkPowerAvailability('telekinesis')).toBe(false);
    });

    it('should clear expired cooldowns', () => {
      // Set an expired cooldown
      powerSystem.cooldowns.set('telekinesis', Date.now() - 1000);
      
      expect(powerSystem.checkPowerAvailability('telekinesis')).toBe(true);
      expect(powerSystem.cooldowns.has('telekinesis')).toBe(false);
    });
  });

  describe('Power Activation', () => {
    beforeEach(() => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.unlockPower('enhanced_vision');
      powerSystem.unlockPower('time_slow');
      powerSystem.unlockPower('phase_walk');
    });

    it('should activate available powers', () => {
      const result = powerSystem.activatePower('telekinesis');
      
      expect(result).toBe(true);
      expect(powerSystem.cooldowns.has('telekinesis')).toBe(true);
    });

    it('should not activate unavailable powers', () => {
      powerSystem.cooldowns.set('telekinesis', Date.now() + 5000);
      
      const result = powerSystem.activatePower('telekinesis');
      
      expect(result).toBe(false);
    });

    it('should not activate non-existent powers', () => {
      const result = powerSystem.activatePower('non_existent');
      
      expect(result).toBe(false);
    });

    it('should handle toggle powers', () => {
      const result1 = powerSystem.activatePower('enhanced_vision');
      expect(result1).toBe(true);
      expect(powerSystem.isPowerActive('enhanced_vision')).toBe(true);
      
      const result2 = powerSystem.activatePower('enhanced_vision');
      expect(result2).toBe(true);
      expect(powerSystem.isPowerActive('enhanced_vision')).toBe(false);
    });

    it('should emit power activation events', () => {
      const mockCallback = vi.fn();
      powerSystem.addEventListener('power_activated', mockCallback);
      
      powerSystem.activatePower('telekinesis');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          powerId: 'telekinesis'
        })
      );
    });
  });

  describe('Power Effects', () => {
    beforeEach(() => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.unlockPower('enhanced_vision');
      powerSystem.unlockPower('time_slow');
      powerSystem.unlockPower('phase_walk');
    });

    it('should apply telekinesis effects', () => {
      powerSystem.activatePower('telekinesis');
      
      expect(mockScene.add.circle).toHaveBeenCalled();
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('should apply enhanced vision effects', () => {
      powerSystem.activatePower('enhanced_vision');
      
      expect(mockScene.add.rectangle).toHaveBeenCalled();
      expect(powerSystem.visionOverlay).toBeDefined();
    });

    it('should apply time manipulation effects', () => {
      powerSystem.activatePower('time_slow');
      
      expect(mockScene.physics.world.timeScale).toBe(0.5);
      expect(powerSystem.timeDistortionEffect).toBeDefined();
    });

    it('should apply phase walk effects', () => {
      powerSystem.activatePower('phase_walk');
      
      expect(mockScene.player.sprite.setAlpha).toHaveBeenCalledWith(0.5);
      expect(mockScene.player.sprite.setTint).toHaveBeenCalledWith(0x00ffff);
      expect(mockScene.player.isPhasing).toBe(true);
    });
  });

  describe('Power Deactivation', () => {
    beforeEach(() => {
      powerSystem.unlockPower('enhanced_vision');
      powerSystem.unlockPower('time_slow');
      powerSystem.unlockPower('phase_walk');
    });

    it('should deactivate active powers', () => {
      powerSystem.activatePower('enhanced_vision');
      expect(powerSystem.isPowerActive('enhanced_vision')).toBe(true);
      
      powerSystem.deactivatePower('enhanced_vision');
      expect(powerSystem.isPowerActive('enhanced_vision')).toBe(false);
    });

    it('should remove power effects on deactivation', () => {
      powerSystem.activatePower('enhanced_vision');
      const overlay = powerSystem.visionOverlay;
      
      powerSystem.deactivatePower('enhanced_vision');
      
      expect(overlay.destroy).toHaveBeenCalled();
      expect(powerSystem.visionOverlay).toBeNull();
    });

    it('should restore time scale on time power deactivation', () => {
      powerSystem.originalTimeScale = 1;
      powerSystem.activatePower('time_slow');
      
      powerSystem.deactivatePower('time_slow');
      
      expect(mockScene.physics.world.timeScale).toBe(1);
    });

    it('should restore player appearance on phase walk deactivation', () => {
      powerSystem.activatePower('phase_walk');
      
      powerSystem.deactivatePower('phase_walk');
      
      expect(mockScene.player.sprite.setAlpha).toHaveBeenCalledWith(1);
      expect(mockScene.player.sprite.clearTint).toHaveBeenCalled();
      expect(mockScene.player.isPhasing).toBe(false);
    });

    it('should emit power deactivation events', () => {
      const mockCallback = vi.fn();
      powerSystem.addEventListener('power_deactivated', mockCallback);
      
      powerSystem.activatePower('enhanced_vision');
      powerSystem.deactivatePower('enhanced_vision');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          powerId: 'enhanced_vision'
        })
      );
    });
  });

  describe('Cooldown Management', () => {
    beforeEach(() => {
      powerSystem.unlockPower('telekinesis');
    });

    it('should set cooldowns on power activation', () => {
      powerSystem.activatePower('telekinesis');
      
      expect(powerSystem.cooldowns.has('telekinesis')).toBe(true);
      expect(powerSystem.getRemainingCooldown('telekinesis')).toBeGreaterThan(0);
    });

    it('should calculate remaining cooldown correctly', () => {
      const futureTime = Date.now() + 5000;
      powerSystem.cooldowns.set('telekinesis', futureTime);
      
      const remaining = powerSystem.getRemainingCooldown('telekinesis');
      expect(remaining).toBeGreaterThan(4000);
      expect(remaining).toBeLessThanOrEqual(5000);
    });

    it('should return 0 for powers without cooldown', () => {
      expect(powerSystem.getRemainingCooldown('telekinesis')).toBe(0);
    });

    it('should return 0 for expired cooldowns', () => {
      powerSystem.cooldowns.set('telekinesis', Date.now() - 1000);
      
      expect(powerSystem.getRemainingCooldown('telekinesis')).toBe(0);
    });
  });

  describe('Power Information', () => {
    it('should get power list', () => {
      const powers = powerSystem.getPowerList();
      
      expect(powers).toBeInstanceOf(Array);
      expect(powers.length).toBeGreaterThan(0);
      expect(powers.some(p => p.id === 'telekinesis')).toBe(true);
    });

    it('should get unlocked power list', () => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.unlockPower('enhanced_vision');
      
      const unlockedPowers = powerSystem.getUnlockedPowerList();
      
      expect(unlockedPowers).toHaveLength(2);
      expect(unlockedPowers.some(p => p.id === 'telekinesis')).toBe(true);
      expect(unlockedPowers.some(p => p.id === 'enhanced_vision')).toBe(true);
    });

    it('should get power by ID', () => {
      const power = powerSystem.getPower('telekinesis');
      
      expect(power).toBeDefined();
      expect(power.id).toBe('telekinesis');
      expect(power.name).toBe('Telekinesis');
    });

    it('should return null for non-existent power', () => {
      const power = powerSystem.getPower('non_existent');
      expect(power).toBeNull();
    });

    it('should check if power is active', () => {
      powerSystem.unlockPower('enhanced_vision');
      
      expect(powerSystem.isPowerActive('enhanced_vision')).toBe(false);
      
      powerSystem.activatePower('enhanced_vision');
      expect(powerSystem.isPowerActive('enhanced_vision')).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should add and remove event listeners', () => {
      const mockCallback = vi.fn();
      
      powerSystem.addEventListener('test_event', mockCallback);
      powerSystem.emitPowerEvent('test_event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
      
      powerSystem.removeEventListener('test_event', mockCallback);
      powerSystem.emitPowerEvent('test_event', { data: 'test2' });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      powerSystem.addEventListener('test_event', callback1);
      powerSystem.addEventListener('test_event', callback2);
      
      powerSystem.emitPowerEvent('test_event', { data: 'test' });
      
      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle listener errors gracefully', () => {
      const errorCallback = vi.fn(() => { throw new Error('Test error'); });
      const normalCallback = vi.fn();
      
      powerSystem.addEventListener('test_event', errorCallback);
      powerSystem.addEventListener('test_event', normalCallback);
      
      powerSystem.emitPowerEvent('test_event', { data: 'test' });
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should get power system state', () => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.unlockPower('enhanced_vision');
      powerSystem.activatePower('enhanced_vision');
      powerSystem.cooldowns.set('telekinesis', Date.now() + 5000);
      
      const state = powerSystem.getPowerSystemState();
      
      expect(state.unlockedPowers).toContain('telekinesis');
      expect(state.unlockedPowers).toContain('enhanced_vision');
      expect(state.activePowers).toContain('enhanced_vision');
      expect(state.cooldowns.telekinesis).toBeDefined();
    });

    it('should load power system state', () => {
      const state = {
        unlockedPowers: ['telekinesis', 'enhanced_vision'],
        activePowers: [],
        cooldowns: { telekinesis: Date.now() + 5000 }
      };
      
      powerSystem.loadPowerSystemState(state);
      
      expect(powerSystem.unlockedPowers.has('telekinesis')).toBe(true);
      expect(powerSystem.unlockedPowers.has('enhanced_vision')).toBe(true);
      expect(powerSystem.cooldowns.has('telekinesis')).toBe(true);
    });

    it('should handle null state gracefully', () => {
      const originalSize = powerSystem.unlockedPowers.size;
      powerSystem.loadPowerSystemState(null);
      expect(powerSystem.unlockedPowers.size).toBe(originalSize);
    });

    it('should reset power system', () => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.activatePower('telekinesis');
      
      powerSystem.resetPowerSystem();
      
      expect(powerSystem.unlockedPowers.size).toBe(0);
      expect(powerSystem.activePowers.size).toBe(0);
      expect(powerSystem.cooldowns.size).toBe(0);
    });
  });

  describe('Update Loop', () => {
    beforeEach(() => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.unlockPower('enhanced_vision');
    });

    it('should handle power input', () => {
      const mockKey = { isDown: false };
      Phaser.Input.Keyboard.JustDown.mockReturnValue(true);
      powerSystem.powerKeys = { telekinesis: mockKey };
      
      const activateSpy = vi.spyOn(powerSystem, 'activatePower');
      
      powerSystem.handlePowerInput();
      
      expect(activateSpy).toHaveBeenCalledWith('telekinesis');
    });

    it('should update active powers with duration', () => {
      powerSystem.activatePower('enhanced_vision');
      
      // Simulate time passing beyond duration
      const activePower = powerSystem.activePowers.get('enhanced_vision');
      activePower.duration = 1000;
      activePower.startTime = Date.now() - 2000;
      
      const deactivateSpy = vi.spyOn(powerSystem, 'deactivatePower');
      
      powerSystem.updateActivePowers(Date.now(), 16);
      
      expect(deactivateSpy).toHaveBeenCalledWith('enhanced_vision');
    });
  });

  describe('Cleanup', () => {
    it('should destroy power system properly', () => {
      powerSystem.unlockPower('telekinesis');
      powerSystem.unlockPower('enhanced_vision');
      powerSystem.activatePower('enhanced_vision');
      
      const deactivateSpy = vi.spyOn(powerSystem, 'deactivatePower');
      
      powerSystem.destroy();
      
      expect(deactivateSpy).toHaveBeenCalledWith('enhanced_vision');
      expect(powerSystem.powers.size).toBe(0);
      expect(powerSystem.unlockedPowers.size).toBe(0);
      expect(powerSystem.activePowers.size).toBe(0);
      expect(powerSystem.cooldowns.size).toBe(0);
      expect(powerSystem.eventListeners.size).toBe(0);
      expect(powerSystem.powerKeys).toBeNull();
    });
  });
});