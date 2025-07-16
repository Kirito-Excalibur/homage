/**
 * InventorySystem - Manages player inventory, item collection, and usage
 */
export default class InventorySystem {
    constructor(scene) {
        this.scene = scene;
        this.items = [];
        this.maxCapacity = 20;
        this.eventListeners = {};
        
        // Initialize with some starting items for testing
        this.initializeStartingItems();
    }

    /**
     * Initialize starting items for the player
     */
    initializeStartingItems() {
        const startingItems = [
            {
                id: 'ancient-key',
                name: 'Ancient Key',
                description: 'A mysterious key that seems to pulse with ancient magic. It might unlock secrets from a forgotten age.',
                type: 'key',
                quantity: 1,
                usable: true,
                storyRelevant: true,
                rarity: 'rare'
            },
            {
                id: 'healing-potion',
                name: 'Healing Potion',
                description: 'A red potion that glows with restorative energy. Drinking it will restore your health.',
                type: 'consumable',
                quantity: 3,
                usable: true,
                storyRelevant: false,
                rarity: 'common'
            },
            {
                id: 'magic-scroll',
                name: 'Magic Scroll',
                description: 'An ancient scroll covered in mystical runes. Reading it might reveal hidden knowledge.',
                type: 'scroll',
                quantity: 1,
                usable: true,
                storyRelevant: true,
                rarity: 'uncommon'
            }
        ];

        startingItems.forEach(item => this.addItem(item));
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emitEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Get all items in inventory
     * @returns {Array} - Array of items
     */
    getItems() {
        return [...this.items]; // Return copy to prevent external modification
    }

    /**
     * Get specific item by ID
     * @param {string} id - Item ID
     * @returns {Object|null} - Item object or null if not found
     */
    getItem(id) {
        return this.items.find(item => item.id === id) || null;
    }

    /**
     * Add item to inventory
     * @param {Object} item - Item to add
     * @returns {boolean} - Success status
     */
    addItem(item) {
        if (!item || !item.id) {
            console.warn('Invalid item provided to addItem');
            return false;
        }

        // Check if inventory is full
        if (this.items.length >= this.maxCapacity) {
            console.warn('Inventory is full');
            this.emitEvent('inventory_full', { item });
            return false;
        }

        // Check if item already exists and can be stacked
        const existingItem = this.getItem(item.id);
        if (existingItem && this.canStackItems(existingItem, item)) {
            existingItem.quantity += item.quantity || 1;
            console.log(`Stacked ${item.name}, new quantity: ${existingItem.quantity}`);
        } else if (existingItem && !this.canStackItems(existingItem, item)) {
            // Item exists but can't be stacked (like keys or scrolls)
            console.log(`Cannot stack ${item.name} - item already exists`);
            return false;
        } else {
            // Add as new item
            const newItem = {
                ...item,
                quantity: item.quantity || 1
            };
            this.items.push(newItem);
            console.log(`Added new item: ${item.name}`);
        }

        this.emitEvent('item_added', { item });
        return true;
    }

    /**
     * Check if two items can be stacked together
     * @param {Object} item1 - First item
     * @param {Object} item2 - Second item
     * @returns {boolean} - Can stack status
     */
    canStackItems(item1, item2) {
        return item1.id === item2.id && 
               item1.type === item2.type && 
               item1.type !== 'key' && // Keys are unique
               item1.type !== 'scroll'; // Scrolls are unique
    }

    /**
     * Remove item from inventory
     * @param {string} id - Item ID
     * @param {number} quantity - Quantity to remove (default: 1)
     * @returns {boolean} - Success status
     */
    removeItem(id, quantity = 1) {
        const item = this.getItem(id);
        if (!item) {
            console.warn(`Item ${id} not found in inventory`);
            return false;
        }

        if (item.quantity <= quantity) {
            // Remove item completely
            this.items = this.items.filter(i => i.id !== id);
            console.log(`Removed ${item.name} from inventory`);
        } else {
            // Reduce quantity
            item.quantity -= quantity;
            console.log(`Reduced ${item.name} quantity to ${item.quantity}`);
        }

        this.emitEvent('item_removed', { id, quantity, item });
        return true;
    }

    /**
     * Use an item from inventory
     * @param {string} id - Item ID
     * @returns {Object|null} - Used item or null if failed
     */
    useItem(id) {
        const item = this.getItem(id);
        if (!item) {
            console.warn(`Item ${id} not found in inventory`);
            return null;
        }

        if (!item.usable) {
            console.warn(`Item ${item.name} is not usable`);
            return null;
        }

        // Create copy of item for return
        const usedItem = { ...item };

        // Remove one instance of the item
        this.removeItem(id, 1);

        this.emitEvent('item_used', { item: usedItem });
        console.log(`Used item: ${item.name}`);

        return usedItem;
    }

    /**
     * Check if inventory has specific item
     * @param {string} id - Item ID
     * @param {number} quantity - Required quantity (default: 1)
     * @returns {boolean} - Has item status
     */
    hasItem(id, quantity = 1) {
        const item = this.getItem(id);
        return item && item.quantity >= quantity;
    }

    /**
     * Get inventory capacity info
     * @returns {Object} - Capacity information
     */
    getCapacityInfo() {
        return {
            current: this.items.length,
            max: this.maxCapacity,
            available: this.maxCapacity - this.items.length,
            isFull: this.items.length >= this.maxCapacity
        };
    }

    /**
     * Get items by type
     * @param {string} type - Item type
     * @returns {Array} - Items of specified type
     */
    getItemsByType(type) {
        return this.items.filter(item => item.type === type);
    }

    /**
     * Get story-relevant items
     * @returns {Array} - Story-relevant items
     */
    getStoryItems() {
        return this.items.filter(item => item.storyRelevant);
    }

    /**
     * Get usable items
     * @returns {Array} - Usable items
     */
    getUsableItems() {
        return this.items.filter(item => item.usable);
    }

    /**
     * Clear all items from inventory
     */
    clearInventory() {
        this.items = [];
        this.emitEvent('inventory_cleared', {});
        console.log('Inventory cleared');
    }

    /**
     * Get inventory state for saving
     * @returns {Object} - Serializable inventory state
     */
    getInventoryState() {
        return {
            items: this.items,
            maxCapacity: this.maxCapacity
        };
    }

    /**
     * Load inventory state from save data
     * @param {Object} state - Saved inventory state
     */
    loadInventoryState(state) {
        if (!state) {
            console.warn('No inventory state provided');
            return;
        }

        this.items = state.items || [];
        this.maxCapacity = state.maxCapacity || 20;
        
        console.log('Inventory state loaded');
        this.emitEvent('inventory_loaded', { state });
    }

    /**
     * Reset inventory to initial state
     */
    resetInventory() {
        this.clearInventory();
        this.initializeStartingItems();
        console.log('Inventory reset to initial state');
    }

    /**
     * Sort inventory by various criteria
     * @param {string} sortBy - Sort criteria ('name', 'type', 'rarity', 'quantity')
     */
    sortInventory(sortBy = 'name') {
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        
        switch (sortBy) {
            case 'name':
                this.items.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'type':
                this.items.sort((a, b) => a.type.localeCompare(b.type));
                break;
            case 'rarity':
                this.items.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
                break;
            case 'quantity':
                this.items.sort((a, b) => b.quantity - a.quantity);
                break;
            default:
                console.warn(`Unknown sort criteria: ${sortBy}`);
        }
        
        this.emitEvent('inventory_sorted', { sortBy });
    }

    /**
     * Find items by name (partial match)
     * @param {string} searchTerm - Search term
     * @returns {Array} - Matching items
     */
    findItems(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term)
        );
    }

    /**
     * Get total value of inventory (if items have value property)
     * @returns {number} - Total value
     */
    getTotalValue() {
        return this.items.reduce((total, item) => {
            const itemValue = item.value || 0;
            return total + (itemValue * item.quantity);
        }, 0);
    }
}