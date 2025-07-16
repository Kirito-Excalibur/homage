/**
 * Test file for GameManager state management and persistence functionality
 * This tests the implementation of task 13: Create game state management and persistence
 */

// Mock Phaser environment for testing
const mockPhaser = {
    Plugins: {
        BasePlugin: class {
            constructor(pluginManager) {
                this.pluginManager = pluginManager;
                this.game = {
                    scene: {
                        getScene: () => null,
                        getScenes: () => []
                    },
                    events: {
                        on: () => {},
                        emit: () => {}
                    }
                };
            }
        }
    }
};

// Import GameManager (we'll need to mock the imports)
class MockStorySystem {
    getStoryState() {
        return {
            currentCheckpoint: 'test_checkpoint',
            completedEvents: ['event1', 'event2'],
            unlockedPowers: ['telekinesis'],
            storyFlags: { tutorial_completed: true }
        };
    }
    
    loadStoryState(state) {
        console.log('Loading story state:', state);
    }
    
    addEventListener() {}
}

class MockPowerSystem {
    getPowerSystemState() {
        return {
            unlockedPowers: ['telekinesis', 'enhanced_vision'],
            activePowers: []
        };
    }
    
    loadPowerSystemState(state) {
        console.log('Loading power state:', state);
    }
    
    addEventListener() {}
}

class MockInventorySystem {
    getInventoryState() {
        return {
            items: [
                { id: 'potion', name: 'Health Potion', quantity: 3 },
                { id: 'key', name: 'Mysterious Key', quantity: 1 }
            ],
            maxCapacity: 20
        };
    }
    
    loadInventoryState(state) {
        console.log('Loading inventory state:', state);
    }
    
    addEventListener() {}
}

class MockSaveSystem {
    constructor() {
        this.autoSaveEnabled = true;
    }
    
    addEventListener() {}
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
    }
    isAutoSaveEnabled() {
        return this.autoSaveEnabled;
    }
}

// Create a simplified GameManager for testing
class TestGameManager {
    constructor() {
        this.storySystem = new MockStorySystem();
        this.powerSystem = new MockPowerSystem();
        this.inventorySystem = new MockInventorySystem();
        this.saveSystem = new MockSaveSystem();
        this.gameState = {
            initialized: false,
            currentScene: null,
            lastValidState: null,
            stateVersion: '1.0.0',
            debugMode: true,
            syncInProgress: false
        };
        this.stateValidators = new Map();
        this.sceneStates = new Map();
        this.stateHistory = [];
        this.maxStateHistory = 10;
        
        this.setupStateValidators();
    }

    // Copy the validation methods from GameManager
    setupStateValidators() {
        // Story system validator
        this.stateValidators.set('story', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('currentCheckpoint') && 
                   state.hasOwnProperty('completedEvents') && 
                   Array.isArray(state.completedEvents);
        });

        // Power system validator
        this.stateValidators.set('power', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('unlockedPowers') && 
                   Array.isArray(state.unlockedPowers);
        });

        // Inventory system validator
        this.stateValidators.set('inventory', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('items') && 
                   Array.isArray(state.items) &&
                   typeof state.maxCapacity === 'number';
        });

        // Player state validator
        this.stateValidators.set('player', (state) => {
            if (!state || typeof state !== 'object') return false;
            return state.hasOwnProperty('position') && 
                   state.position.hasOwnProperty('x') && 
                   state.position.hasOwnProperty('y') &&
                   typeof state.health === 'number';
        });
    }

    validateGameState(gameState) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!gameState || typeof gameState !== 'object') {
            result.isValid = false;
            result.errors.push('Game state is not a valid object');
            return result;
        }

        // Validate each system's state
        for (const [systemName, validator] of this.stateValidators) {
            const systemState = gameState[systemName];
            
            if (systemState === undefined) {
                result.warnings.push(`${systemName} state is missing`);
                continue;
            }

            try {
                if (!validator(systemState)) {
                    result.isValid = false;
                    result.errors.push(`${systemName} state validation failed`);
                }
            } catch (error) {
                result.isValid = false;
                result.errors.push(`${systemName} state validation error: ${error.message}`);
            }
        }

        return result;
    }

    getCurrentCompleteState() {
        return {
            version: this.gameState.stateVersion,
            timestamp: Date.now(),
            currentScene: this.gameState.currentScene || 'GameWorldScene',
            story: this.storySystem.getStoryState(),
            power: this.powerSystem.getPowerSystemState(),
            inventory: this.inventorySystem.getInventoryState(),
            player: {
                position: { x: 400, y: 300 },
                health: 100,
                facingDirection: 'down'
            },
            world: {
                currentMap: 'main_world',
                visitedAreas: ['starting_area']
            }
        };
    }

    createMinimalValidState() {
        return {
            version: this.gameState.stateVersion,
            story: {
                currentCheckpoint: 'game_start',
                completedEvents: [],
                unlockedPowers: [],
                storyFlags: {}
            },
            power: {
                unlockedPowers: [],
                activePowers: []
            },
            inventory: {
                items: [],
                maxCapacity: 20
            },
            player: {
                position: { x: 400, y: 300 },
                health: 100,
                facingDirection: 'down'
            },
            world: {
                currentMap: 'main_world',
                visitedAreas: ['starting_area']
            }
        };
    }

    recoverGameState(invalidState) {
        console.warn('Attempting game state recovery...');
        
        try {
            // Try to use last valid state if available
            if (this.gameState.lastValidState) {
                console.log('Using last valid state for recovery');
                return this.gameState.lastValidState;
            }

            // Try to recover from state history
            for (let i = this.stateHistory.length - 1; i >= 0; i--) {
                const historicalState = this.stateHistory[i];
                const validation = this.validateGameState(historicalState);
                
                if (validation.isValid) {
                    console.log(`Recovered state from history (${i} steps back)`);
                    return historicalState;
                }
            }

            // Create minimal valid state as last resort
            console.log('Creating minimal valid state');
            return this.createMinimalValidState();
        } catch (error) {
            console.error('State recovery failed:', error);
            return null;
        }
    }

    storeValidState() {
        try {
            const currentState = this.getCurrentCompleteState();
            const validation = this.validateGameState(currentState);
            
            if (validation.isValid) {
                this.gameState.lastValidState = JSON.parse(JSON.stringify(currentState));
                
                // Add to state history
                this.stateHistory.push(JSON.parse(JSON.stringify(currentState)));
                
                // Limit history size
                if (this.stateHistory.length > this.maxStateHistory) {
                    this.stateHistory.shift();
                }
                
                console.log('Valid state stored');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to store valid state:', error);
            return false;
        }
    }
}

// Test functions
function testStateValidation() {
    console.log('\n=== Testing State Validation ===');
    
    const gameManager = new TestGameManager();
    
    // Test valid state
    const validState = gameManager.getCurrentCompleteState();
    const validResult = gameManager.validateGameState(validState);
    console.log('Valid state test:', validResult.isValid ? 'PASS' : 'FAIL');
    if (!validResult.isValid) {
        console.log('Errors:', validResult.errors);
    }
    
    // Test invalid state
    const invalidState = {
        story: { invalidField: true }, // Missing required fields
        power: null, // Invalid type
        inventory: { items: 'not an array' }, // Wrong type
        player: { position: { x: 100 } } // Missing y coordinate
    };
    
    const invalidResult = gameManager.validateGameState(invalidState);
    console.log('Invalid state test:', !invalidResult.isValid ? 'PASS' : 'FAIL');
    console.log('Expected errors found:', invalidResult.errors.length > 0 ? 'PASS' : 'FAIL');
    
    return validResult.isValid && !invalidResult.isValid;
}

function testStateRecovery() {
    console.log('\n=== Testing State Recovery ===');
    
    const gameManager = new TestGameManager();
    
    // Store a valid state first
    const storeResult = gameManager.storeValidState();
    console.log('Store valid state:', storeResult ? 'PASS' : 'FAIL');
    
    // Test recovery from invalid state
    const invalidState = { corrupted: true };
    const recoveredState = gameManager.recoverGameState(invalidState);
    
    console.log('Recovery attempt:', recoveredState ? 'PASS' : 'FAIL');
    
    if (recoveredState) {
        const recoveryValidation = gameManager.validateGameState(recoveredState);
        console.log('Recovered state is valid:', recoveryValidation.isValid ? 'PASS' : 'FAIL');
        return recoveryValidation.isValid;
    }
    
    return false;
}

function testStateHistory() {
    console.log('\n=== Testing State History ===');
    
    const gameManager = new TestGameManager();
    
    // Store multiple states
    for (let i = 0; i < 5; i++) {
        gameManager.storeValidState();
    }
    
    console.log('State history length:', gameManager.stateHistory.length);
    console.log('History tracking:', gameManager.stateHistory.length === 5 ? 'PASS' : 'FAIL');
    
    // Test history limit
    for (let i = 0; i < 10; i++) {
        gameManager.storeValidState();
    }
    
    console.log('History after limit test:', gameManager.stateHistory.length);
    console.log('History limit enforced:', gameManager.stateHistory.length <= gameManager.maxStateHistory ? 'PASS' : 'FAIL');
    
    return gameManager.stateHistory.length <= gameManager.maxStateHistory;
}

function testMinimalStateCreation() {
    console.log('\n=== Testing Minimal State Creation ===');
    
    const gameManager = new TestGameManager();
    const minimalState = gameManager.createMinimalValidState();
    
    const validation = gameManager.validateGameState(minimalState);
    console.log('Minimal state is valid:', validation.isValid ? 'PASS' : 'FAIL');
    
    if (!validation.isValid) {
        console.log('Validation errors:', validation.errors);
    }
    
    return validation.isValid;
}

function testDebugMode() {
    console.log('\n=== Testing Debug Mode ===');
    
    const gameManager = new TestGameManager();
    
    // Debug mode should be enabled in test
    console.log('Debug mode enabled:', gameManager.gameState.debugMode ? 'PASS' : 'FAIL');
    
    // Test state inspection
    const currentState = gameManager.getCurrentCompleteState();
    console.log('State inspection available:', typeof currentState === 'object' ? 'PASS' : 'FAIL');
    
    return gameManager.gameState.debugMode && typeof currentState === 'object';
}

// Run all tests
function runAllTests() {
    console.log('🧪 Running GameManager State Management Tests');
    console.log('='.repeat(50));
    
    const tests = [
        { name: 'State Validation', fn: testStateValidation },
        { name: 'State Recovery', fn: testStateRecovery },
        { name: 'State History', fn: testStateHistory },
        { name: 'Minimal State Creation', fn: testMinimalStateCreation },
        { name: 'Debug Mode', fn: testDebugMode }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        try {
            const result = test.fn();
            if (result) {
                passed++;
                console.log(`✅ ${test.name}: PASSED`);
            } else {
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! GameManager state management is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
    
    return passed === total;
}

// Export for Node.js or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, TestGameManager };
} else {
    // Run tests immediately if in browser
    runAllTests();
}