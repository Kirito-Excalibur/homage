// Test setup file for Vitest
import { vi } from 'vitest';

// Mock Phaser 3 for testing
global.Phaser = {
  Scene: class MockScene {
    constructor() {
      this.input = {
        keyboard: {
          addKey: vi.fn(() => ({ isDown: false }))
        }
      };
      this.events = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      };
      this.add = {
        text: vi.fn(() => ({ setOrigin: vi.fn(), setScrollFactor: vi.fn(), setDepth: vi.fn() })),
        rectangle: vi.fn(() => ({ setScrollFactor: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() })),
        circle: vi.fn(() => ({ setDepth: vi.fn(), destroy: vi.fn() })),
        container: vi.fn(() => ({ 
          setScrollFactor: vi.fn(), 
          setDepth: vi.fn(), 
          add: vi.fn(),
          setScale: vi.fn(),
          destroy: vi.fn()
        }))
      };
      this.tweens = {
        add: vi.fn()
      };
      this.cameras = {
        main: {
          centerX: 400,
          centerY: 300,
          width: 800,
          height: 600
        }
      };
      this.physics = {
        world: {
          timeScale: 1
        }
      };
      this.scene = {
        key: 'TestScene',
        get: vi.fn()
      };
      this.plugins = {
        get: vi.fn()
      };
    }
  },
  Plugins: {
    BasePlugin: class MockBasePlugin {
      constructor(pluginManager) {
        this.pluginManager = pluginManager;
        this.game = {
          scene: {
            getScene: vi.fn(),
            getScenes: vi.fn(() => [])
          },
          events: {
            on: vi.fn(),
            emit: vi.fn()
          }
        };
      }
    }
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        Q: 81,
        E: 69,
        R: 82,
        F: 70,
        W: 87,
        A: 65,
        S: 83,
        D: 68
      },
      JustDown: vi.fn(() => false)
    }
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for story data loading
global.fetch = vi.fn();

// Mock Blob for storage calculations
global.Blob = class MockBlob {
  constructor(data) {
    this.size = JSON.stringify(data).length;
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});
  
  // Reset fetch mock
  fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      events: [],
      checkpoints: {}
    })
  });
});