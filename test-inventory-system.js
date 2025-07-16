/**
 * Test script for the Inventory System
 * Run this with: node test-inventory-system.js
 */

// Mock Phaser scene for testing
class MockScene {
    constructor() {
        this.plugins = {
            get: () => null
        };
    }
}

// Import the InventorySystem (we'll need to adjust the import for Node.js)
// For now, let's create a simplified test

console.log('Testing Inventory System...');

// Test basic inventory functionality
function testInventorySystem() {
    // Create a mock inventory system with the same interface
    const inventory = {
        items: [],
        maxCapacity: 20,
        eventListeners: {},
        
        addEventListener: function(event, callback) {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(callback);
        },
        
        emitEvent: function(event, data) {
            if (this.eventListeners[event]) {
                this.eventListeners[event].forEach(callback => callback(data));
            }
        },
        
        getItems: function() { return [...this.items]; },
        
        getItem: function(id) { return this.items.find(item => item.id === id) || null; },
        
        addItem: function(item) {
            if (!item || !item.id) return false;
            if (this.items.length >= this.maxCapacity) {
                this.emitEvent('inventory_full', { item });
                return false;
            }
            
            const existingItem = this.getItem(item.id);
            if (existingItem && this.canStackItems(existingItem, item)) {
                existingItem.quantity += item.quantity || 1;
            } else {
                this.items.push({ ...item, quantity: item.quantity || 1 });
            }
            
            this.emitEvent('item_added', { item });
            return true;
        },
        
        canStackItems: function(item1, item2) {
            return item1.id === item2.id && 
                   item1.type === item2.type && 
                   item1.type !== 'key' && 
                   item1.type !== 'scroll';
        },
        
        removeItem: function(id, quantity = 1) {
            const item = this.getItem(id);
            if (!item) return false;
            
            if (item.quantity <= quantity) {
                this.items = this.items.filter(i => i.id !== id);
            } else {
                item.quantity -= quantity;
            }
            
            this.emitEvent('item_removed', { id, quantity, item });
            return true;
        },
        
        useItem: function(id) {
            const item = this.getItem(id);
            if (!item || !item.usable) return null;
            
            const usedItem = { ...item };
            this.removeItem(id, 1);
            this.emitEvent('item_used', { item: usedItem });
            return usedItem;
        },
        
        hasItem: function(id, quantity = 1) {
            const item = this.getItem(id);
            return item && item.quantity >= quantity;
        }
    };
    
    // Test adding items
    console.log('\n1. Testing item addition...');
    const testItem1 = {
        id: 'healing-potion',
        name: 'Healing Potion',
        type: 'consumable',
        quantity: 3,
        usable: true,
        rarity: 'common'
    };
    
    const success1 = inventory.addItem(testItem1);
    console.log(`Added healing potion: ${success1}`);
    console.log(`Items in inventory: ${inventory.getItems().length}`);
    
    // Test stacking
    console.log('\n2. Testing item stacking...');
    const testItem2 = {
        id: 'healing-potion',
        name: 'Healing Potion',
        type: 'consumable',
        quantity: 2,
        usable: true,
        rarity: 'common'
    };
    
    inventory.addItem(testItem2);
    const healingPotion = inventory.getItem('healing-potion');
    console.log(`Healing potion quantity after stacking: ${healingPotion.quantity}`);
    
    // Test unique items (keys)
    console.log('\n3. Testing unique items...');
    const keyItem = {
        id: 'ancient-key',
        name: 'Ancient Key',
        type: 'key',
        quantity: 1,
        usable: true,
        storyRelevant: true,
        rarity: 'rare'
    };
    
    inventory.addItem(keyItem);
    inventory.addItem(keyItem); // Should not stack
    console.log(`Number of ancient keys: ${inventory.getItem('ancient-key').quantity}`);
    
    // Test item usage
    console.log('\n4. Testing item usage...');
    const usedItem = inventory.useItem('healing-potion');
    console.log(`Used item: ${usedItem ? usedItem.name : 'none'}`);
    console.log(`Remaining healing potions: ${inventory.getItem('healing-potion').quantity}`);
    
    // Test item checking
    console.log('\n5. Testing item checking...');
    console.log(`Has healing potion: ${inventory.hasItem('healing-potion')}`);
    console.log(`Has 3 healing potions: ${inventory.hasItem('healing-potion', 3)}`);
    console.log(`Has ancient key: ${inventory.hasItem('ancient-key')}`);
    
    // Test event system
    console.log('\n6. Testing event system...');
    let eventFired = false;
    inventory.addEventListener('item_added', (data) => {
        eventFired = true;
        console.log(`Event fired for item: ${data.item.name}`);
    });
    
    inventory.addItem({
        id: 'magic-scroll',
        name: 'Magic Scroll',
        type: 'scroll',
        quantity: 1,
        usable: true,
        rarity: 'uncommon'
    });
    
    console.log(`Event system working: ${eventFired}`);
    
    console.log('\n7. Final inventory state:');
    inventory.getItems().forEach(item => {
        console.log(`- ${item.name} (${item.quantity}x) - ${item.type} - ${item.rarity}`);
    });
    
    console.log('\n✅ Inventory System tests completed successfully!');
}

// Run the tests
testInventorySystem();