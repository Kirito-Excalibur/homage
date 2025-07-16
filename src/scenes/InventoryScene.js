export default class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InventoryScene' });
        this.inventory = null;
        this.selectedItem = null;
        this.itemSlots = [];
        this.maxSlots = 20; // 4x5 grid
        this.slotSize = 64;
        this.slotPadding = 8;
    }

    init(data) {
        this.previousScene = data.previousScene || 'GameWorldScene';
        this.inventory = data.inventory || this.getInventorySystem();
    }

    preload() {
        // Load enhanced UI assets
        this.load.image('inventory-panel', 'src/assets/ui/inventory-panel.png');
        this.load.image('inventory-slot', 'src/assets/ui/inventory-slot.png');
        this.load.image('button', 'src/assets/ui/button.png');
        
        // Load enhanced item assets
        this.load.image('item-key', 'src/assets/items/key.png');
        this.load.image('item-potion', 'src/assets/items/potion.png');
        this.load.image('item-scroll', 'src/assets/items/scroll.png');
        this.load.image('item-gem', 'src/assets/items/gem.png');
        this.load.image('item-coin', 'src/assets/items/coin.png');
        
        // Create remaining placeholder assets that aren't available as files
        this.createRemainingPlaceholderAssets();
    }

    createRemainingPlaceholderAssets() {
        // Create selected slot highlight (not available as file asset)
        const highlightGraphics = this.add.graphics();
        highlightGraphics.fillStyle(0xf39c12, 0.3);
        highlightGraphics.fillRoundedRect(0, 0, this.slotSize, this.slotSize, 5);
        highlightGraphics.lineStyle(3, 0xf39c12);
        highlightGraphics.strokeRoundedRect(0, 0, this.slotSize, this.slotSize, 5);
        highlightGraphics.generateTexture('slot-highlight', this.slotSize, this.slotSize);
        highlightGraphics.destroy();

        // Create additional item sprites that aren't available as enhanced assets
        this.createAdditionalItemSprites();
    }

    createAdditionalItemSprites() {
        // Create placeholder sprites for items that don't have enhanced assets yet
        const additionalItemTypes = [
            { key: 'mysterious-orb', color: 0x1abc9c, shape: 'orb' },
            { key: 'ancient-tome', color: 0x8b4513, shape: 'book' },
            { key: 'enchanted-ring', color: 0xe67e22, shape: 'ring' }
        ];

        additionalItemTypes.forEach(item => {
            const graphics = this.add.graphics();
            graphics.fillStyle(item.color);
            
            switch (item.shape) {
                case 'orb':
                    graphics.fillCircle(28, 28, 20);
                    graphics.fillStyle(0xffffff, 0.3);
                    graphics.fillCircle(24, 24, 8);
                    break;
                case 'book':
                    graphics.fillRect(12, 8, 32, 40);
                    graphics.fillStyle(0x654321);
                    graphics.fillRect(14, 10, 28, 36);
                    graphics.fillStyle(0xffd700);
                    graphics.fillRect(16, 15, 24, 2);
                    break;
                case 'ring':
                    graphics.fillCircle(28, 28, 16);
                    graphics.fillStyle(0x2c3e50);
                    graphics.fillCircle(28, 28, 8);
                    graphics.fillStyle(item.color);
                    graphics.fillRect(24, 20, 8, 4);
                    break;
            }
            
            graphics.generateTexture(item.key, 56, 56);
            graphics.destroy();
        });
    }

    create() {
        // Create background overlay
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);

        // Create main inventory panel
        this.inventoryPanel = this.add.image(400, 300, 'inventory-panel');
        
        // Create title
        this.add.text(400, 80, 'INVENTORY', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Create inventory grid
        this.createInventoryGrid();

        // Create item description panel
        this.createDescriptionPanel();

        // Create action buttons
        this.createActionButtons();

        // Set up input handling
        this.setupInput();

        // Initialize inventory display
        this.updateInventoryDisplay();

        // Add close instruction
        this.add.text(400, 550, 'Press ESC or I to close inventory', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        }).setOrigin(0.5);
    }

    createInventoryGrid() {
        this.itemSlots = [];
        const startX = 250;
        const startY = 120;
        const cols = 4;
        const rows = 5;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const slotIndex = row * cols + col;
                const x = startX + col * (this.slotSize + this.slotPadding);
                const y = startY + row * (this.slotSize + this.slotPadding);

                // Create slot background
                const slot = this.add.image(x, y, 'inventory-slot');
                slot.setInteractive();
                slot.setData('slotIndex', slotIndex);

                // Create highlight overlay (initially hidden)
                const highlight = this.add.image(x, y, 'slot-highlight');
                highlight.setVisible(false);

                // Create item sprite container
                const itemSprite = this.add.image(x, y, null);
                itemSprite.setVisible(false);

                // Create quantity text
                const quantityText = this.add.text(x + 20, y + 20, '', {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: { x: 2, y: 1 }
                });
                quantityText.setVisible(false);

                this.itemSlots.push({
                    slot,
                    highlight,
                    itemSprite,
                    quantityText,
                    slotIndex,
                    item: null
                });

                // Set up slot interaction
                slot.on('pointerdown', () => this.selectSlot(slotIndex));
                slot.on('pointerover', () => this.hoverSlot(slotIndex));
                slot.on('pointerout', () => this.unhoverSlot(slotIndex));
            }
        }
    }

    createDescriptionPanel() {
        // Description background
        const descBg = this.add.rectangle(580, 250, 180, 200, 0x34495e, 0.9);

        // Description title
        this.descriptionTitle = this.add.text(580, 170, 'Select an item', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#f39c12',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Description text
        this.descriptionText = this.add.text(580, 250, 'Click on an item to see its description and available actions.', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: 160 }
        }).setOrigin(0.5);

        // Item stats
        this.itemStats = this.add.text(580, 320, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#95a5a6',
            align: 'center',
            wordWrap: { width: 160 }
        }).setOrigin(0.5);
    }

    createActionButtons() {
        // Use button
        this.useButton = this.add.rectangle(520, 380, 80, 30, 0x27ae60);
        this.useButton.setInteractive();
        this.useButton.setVisible(false);
        
        const useText = this.add.text(520, 380, 'USE', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        useText.setVisible(false);

        // Drop button
        this.dropButton = this.add.rectangle(620, 380, 80, 30, 0xe74c3c);
        this.dropButton.setInteractive();
        this.dropButton.setVisible(false);

        const dropText = this.add.text(620, 380, 'DROP', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        dropText.setVisible(false);

        // Store button references
        this.useButtonText = useText;
        this.dropButtonText = dropText;

        // Set up button interactions
        this.useButton.on('pointerdown', () => this.useSelectedItem());
        this.dropButton.on('pointerdown', () => this.dropSelectedItem());

        // Button hover effects
        this.setupButtonHoverEffects();
    }

    setupButtonHoverEffects() {
        [this.useButton, this.dropButton].forEach(button => {
            button.on('pointerover', () => {
                button.setScale(1.1);
            });
            button.on('pointerout', () => {
                button.setScale(1.0);
            });
        });
    }

    setupInput() {
        // ESC and I key to close inventory
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

        // Number keys for quick item selection
        this.numberKeys = {};
        for (let i = 1; i <= 9; i++) {
            this.numberKeys[i] = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes['DIGIT' + i]);
        }
    }

    update() {
        // Handle close inventory
        if (Phaser.Input.Keyboard.JustDown(this.escKey) || 
            Phaser.Input.Keyboard.JustDown(this.iKey)) {
            this.closeInventory();
        }

        // Handle number key selection
        for (let i = 1; i <= 9; i++) {
            if (Phaser.Input.Keyboard.JustDown(this.numberKeys[i])) {
                const slotIndex = i - 1;
                if (slotIndex < this.itemSlots.length) {
                    this.selectSlot(slotIndex);
                }
            }
        }
    }

    getInventorySystem() {
        // Get inventory from GameManager or create a basic one
        const gameManager = this.scene.get('GameWorldScene')?.plugins?.get('GameManager');
        if (gameManager && gameManager.getInventorySystem) {
            return gameManager.getInventorySystem();
        }
        
        // Create basic inventory system if not available
        return this.createBasicInventorySystem();
    }

    createBasicInventorySystem() {
        return {
            items: [
                {
                    id: 'ancient-key',
                    name: 'Ancient Key',
                    description: 'A mysterious key that seems to pulse with ancient magic. It might unlock secrets from a forgotten age.',
                    type: 'key',
                    quantity: 1,
                    usable: true,
                    storyRelevant: true,
                    rarity: 'rare',
                    textureKey: 'item-key'
                },
                {
                    id: 'healing-potion',
                    name: 'Healing Potion',
                    description: 'A red potion that glows with restorative energy. Drinking it will restore your health.',
                    type: 'consumable',
                    quantity: 3,
                    usable: true,
                    storyRelevant: false,
                    rarity: 'common',
                    textureKey: 'item-potion'
                },
                {
                    id: 'magic-scroll',
                    name: 'Magic Scroll',
                    description: 'An ancient scroll covered in mystical runes. Reading it might reveal hidden knowledge.',
                    type: 'scroll',
                    quantity: 1,
                    usable: true,
                    storyRelevant: true,
                    rarity: 'uncommon',
                    textureKey: 'item-scroll'
                },
                {
                    id: 'crystal-gem',
                    name: 'Crystal Gem',
                    description: 'A beautiful crystal that resonates with magical energy. It seems important for something.',
                    type: 'material',
                    quantity: 2,
                    usable: false,
                    storyRelevant: true,
                    rarity: 'rare',
                    textureKey: 'item-gem'
                },
                {
                    id: 'gold-coin',
                    name: 'Gold Coins',
                    description: 'Shiny gold coins from an ancient civilization. They might be valuable to the right person.',
                    type: 'currency',
                    quantity: 15,
                    usable: false,
                    storyRelevant: false,
                    rarity: 'common',
                    textureKey: 'item-coin'
                }
            ],
            maxCapacity: this.maxSlots,
            
            getItems: function() { return this.items; },
            getItem: function(id) { return this.items.find(item => item.id === id); },
            addItem: function(item) { 
                const existing = this.getItem(item.id);
                if (existing && existing.type === item.type) {
                    existing.quantity += item.quantity || 1;
                } else {
                    this.items.push(item);
                }
            },
            removeItem: function(id, quantity = 1) {
                const item = this.getItem(id);
                if (item) {
                    item.quantity -= quantity;
                    if (item.quantity <= 0) {
                        this.items = this.items.filter(i => i.id !== id);
                    }
                }
            },
            useItem: function(id) {
                const item = this.getItem(id);
                if (item && item.usable) {
                    this.removeItem(id, 1);
                    return item;
                }
                return null;
            }
        };
    }

    updateInventoryDisplay() {
        if (!this.inventory) return;

        const items = this.inventory.getItems();
        
        // Clear all slots first
        this.itemSlots.forEach(slot => {
            slot.itemSprite.setVisible(false);
            slot.quantityText.setVisible(false);
            slot.item = null;
        });

        // Fill slots with items
        items.forEach((item, index) => {
            if (index < this.itemSlots.length) {
                const slot = this.itemSlots[index];
                slot.item = item;
                
                // Set item sprite using the correct texture key
                slot.itemSprite.setTexture(item.textureKey || item.id);
                slot.itemSprite.setVisible(true);
                
                // Set quantity if more than 1
                if (item.quantity > 1) {
                    slot.quantityText.setText(item.quantity.toString());
                    slot.quantityText.setVisible(true);
                }
            }
        });
    }

    selectSlot(slotIndex) {
        // Clear previous selection
        this.itemSlots.forEach(slot => slot.highlight.setVisible(false));
        
        const slot = this.itemSlots[slotIndex];
        if (!slot || !slot.item) {
            this.selectedItem = null;
            this.updateDescriptionPanel();
            return;
        }

        // Highlight selected slot
        slot.highlight.setVisible(true);
        this.selectedItem = slot.item;
        
        // Update description panel
        this.updateDescriptionPanel();
    }

    hoverSlot(slotIndex) {
        const slot = this.itemSlots[slotIndex];
        if (slot && slot.item && this.selectedItem !== slot.item) {
            slot.slot.setTint(0xf39c12);
        }
    }

    unhoverSlot(slotIndex) {
        const slot = this.itemSlots[slotIndex];
        if (slot) {
            slot.slot.clearTint();
        }
    }

    updateDescriptionPanel() {
        if (!this.selectedItem) {
            this.descriptionTitle.setText('Select an item');
            this.descriptionText.setText('Click on an item to see its description and available actions.');
            this.itemStats.setText('');
            this.hideActionButtons();
            return;
        }

        const item = this.selectedItem;
        
        // Update title with rarity color
        const rarityColors = {
            common: '#95a5a6',
            uncommon: '#3498db',
            rare: '#9b59b6',
            epic: '#e67e22',
            legendary: '#f1c40f'
        };
        
        this.descriptionTitle.setText(item.name);
        this.descriptionTitle.setColor(rarityColors[item.rarity] || '#f39c12');
        
        // Update description
        this.descriptionText.setText(item.description);
        
        // Update stats
        const stats = [
            `Type: ${item.type}`,
            `Quantity: ${item.quantity}`,
            `Rarity: ${item.rarity}`,
            item.storyRelevant ? 'Story Item' : ''
        ].filter(stat => stat).join('\n');
        
        this.itemStats.setText(stats);
        
        // Show action buttons
        this.showActionButtons();
    }

    showActionButtons() {
        if (!this.selectedItem) return;

        this.useButton.setVisible(this.selectedItem.usable);
        this.useButtonText.setVisible(this.selectedItem.usable);
        this.dropButton.setVisible(true);
        this.dropButtonText.setVisible(true);
    }

    hideActionButtons() {
        this.useButton.setVisible(false);
        this.useButtonText.setVisible(false);
        this.dropButton.setVisible(false);
        this.dropButtonText.setVisible(false);
    }

    useSelectedItem() {
        if (!this.selectedItem || !this.selectedItem.usable) return;

        const item = this.selectedItem;
        console.log(`Using item: ${item.name}`);

        // Handle different item types
        switch (item.type) {
            case 'consumable':
                this.useConsumableItem(item);
                break;
            case 'key':
                this.useKeyItem(item);
                break;
            case 'scroll':
                this.useScrollItem(item);
                break;
            default:
                this.showItemUsageMessage(`You used ${item.name}`);
        }

        // Remove item from inventory
        this.inventory.useItem(item.id);
        
        // Update display
        this.updateInventoryDisplay();
        this.selectedItem = null;
        this.updateDescriptionPanel();

        // Trigger story events if item is story-relevant
        if (item.storyRelevant) {
            this.triggerStoryItemUsage(item);
        }
    }

    useConsumableItem(item) {
        if (item.id === 'healing-potion') {
            this.showItemUsageMessage('You drink the healing potion and feel your wounds mend.');
            // In a full implementation, this would restore player health
        } else {
            this.showItemUsageMessage(`You consume the ${item.name}.`);
        }
    }

    useKeyItem(item) {
        this.showItemUsageMessage(`You examine the ${item.name}. It seems to be waiting for the right lock.`);
        // In a full implementation, this would check for nearby locked objects
    }

    useScrollItem(item) {
        this.showItemUsageMessage(`You read the ${item.name}. Ancient knowledge fills your mind.`);
        // In a full implementation, this might unlock new dialogue options or story paths
    }

    dropSelectedItem() {
        if (!this.selectedItem) return;

        const item = this.selectedItem;
        
        // Prevent dropping story-relevant items
        if (item.storyRelevant) {
            this.showItemUsageMessage(`The ${item.name} seems too important to discard.`);
            return;
        }

        console.log(`Dropping item: ${item.name}`);
        this.showItemUsageMessage(`You drop the ${item.name}.`);

        // Remove item from inventory
        this.inventory.removeItem(item.id, 1);
        
        // Update display
        this.updateInventoryDisplay();
        this.selectedItem = null;
        this.updateDescriptionPanel();
    }

    showItemUsageMessage(message) {
        // Create temporary message overlay
        const messageBox = this.add.rectangle(400, 450, 600, 60, 0x2c3e50, 0.9);
        
        const messageText = this.add.text(400, 450, message, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: 580 }
        }).setOrigin(0.5);

        // Fade out after 3 seconds
        this.tweens.add({
            targets: [messageBox, messageText],
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => {
                messageBox.destroy();
                messageText.destroy();
            }
        });
    }

    triggerStoryItemUsage(item) {
        // Get story system and trigger relevant events
        const gameWorldScene = this.scene.get('GameWorldScene');
        const gameManager = gameWorldScene?.plugins?.get('GameManager');
        const storySystem = gameManager?.getStorySystem();

        if (storySystem) {
            // Define item-to-story-event mappings
            const itemStoryEvents = {
                'ancient-key': 'ancient_key_used',
                'magic-scroll': 'magic_scroll_read',
                'crystal-gem': 'crystal_gem_activated'
            };

            const storyEvent = itemStoryEvents[item.id];
            if (storyEvent) {
                storySystem.triggerStoryEvent(storyEvent);
            }
        }
    }

    closeInventory() {
        console.log('Closing inventory');
        
        // Resume the previous scene
        this.scene.resume(this.previousScene);
        
        // Stop this scene
        this.scene.stop();
    }
}