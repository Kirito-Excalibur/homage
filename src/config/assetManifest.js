/**
 * Asset Manifest - Defines all game assets for loading
 * Organized by category for efficient loading and management
 */

export const ASSET_MANIFEST = {
    // Sprite assets (characters, objects, tiles)
    sprites: {
        // Character sprites
        'player-idle-0': { url: 'src/assets/characters/player/idle_0.png', type: 'image' },
        'player-idle-1': { url: 'src/assets/characters/player/idle_1.png', type: 'image' },
        'player-walk-0': { url: 'src/assets/characters/player/walk_0.png', type: 'image' },
        'player-walk-1': { url: 'src/assets/characters/player/walk_1.png', type: 'image' },
        'player-walk-2': { url: 'src/assets/characters/player/walk_2.png', type: 'image' },
        'player-walk-3': { url: 'src/assets/characters/player/walk_3.png', type: 'image' },
        
        'npc-idle-0': { url: 'src/assets/characters/npc/idle_0.png', type: 'image' },
        'npc-idle-1': { url: 'src/assets/characters/npc/idle_1.png', type: 'image' },
        'npc-walk-0': { url: 'src/assets/characters/npc/walk_0.png', type: 'image' },
        'npc-walk-1': { url: 'src/assets/characters/npc/walk_1.png', type: 'image' },
        'npc-walk-2': { url: 'src/assets/characters/npc/walk_2.png', type: 'image' },
        'npc-walk-3': { url: 'src/assets/characters/npc/walk_3.png', type: 'image' },
        
        // Tile sprites
        'grass-tile': { url: 'src/assets/tiles/grass.png', type: 'image' },
        'stone-tile': { url: 'src/assets/tiles/stone.png', type: 'image' },
        'water-tile': { url: 'src/assets/tiles/water.png', type: 'image' },
        'tree-tile': { url: 'src/assets/tiles/tree.png', type: 'image' },
        'dirt-tile': { url: 'src/assets/tiles/dirt.png', type: 'image' },
        
        // Object sprites
        'object-chest': { url: 'src/assets/objects/chest.png', type: 'image' },
        'object-door': { url: 'src/assets/objects/door.png', type: 'image' },
        'object-crystal': { url: 'src/assets/objects/crystal.png', type: 'image' },
        'object-statue': { url: 'src/assets/objects/statue.png', type: 'image' },
        'object-bush': { url: 'src/assets/objects/bush.png', type: 'image' },
        
        // Item sprites
        'item-key': { url: 'src/assets/items/key.png', type: 'image' },
        'item-potion': { url: 'src/assets/items/potion.png', type: 'image' },
        'item-scroll': { url: 'src/assets/items/scroll.png', type: 'image' },
        'item-gem': { url: 'src/assets/items/gem.png', type: 'image' },
        'item-coin': { url: 'src/assets/items/coin.png', type: 'image' }
    },
    
    // UI assets
    ui: {
        'button': { url: 'src/assets/ui/button.png', type: 'image' },
        'dialogue-box': { url: 'src/assets/ui/dialogue-box.png', type: 'image' },
        'inventory-slot': { url: 'src/assets/ui/inventory-slot.png', type: 'image' },
        'inventory-panel': { url: 'src/assets/ui/inventory-panel.png', type: 'image' },
        'health-bar-bg': { url: 'src/assets/ui/health-bar-bg.png', type: 'image' },
        'health-bar-fill': { url: 'src/assets/ui/health-bar-fill.png', type: 'image' }
    },
    
    // Audio assets
    audio: {
        // Background music
        'menu_theme': { url: 'src/assets/audio/music/menu_theme.ogg', type: 'music' },
        'world_ambient': { url: 'src/assets/audio/music/world_ambient.ogg', type: 'music' },
        'loading_theme': { url: 'src/assets/audio/music/loading_theme.ogg', type: 'music' },
        
        // Sound effects
        'dialogue_open': { url: 'src/assets/audio/sfx/dialogue_open.ogg', type: 'sfx' },
        'dialogue_next': { url: 'src/assets/audio/sfx/dialogue_next.ogg', type: 'sfx' },
        'power_unlock': { url: 'src/assets/audio/sfx/power_unlock.ogg', type: 'sfx' },
        'power_activate': { url: 'src/assets/audio/sfx/power_activate.ogg', type: 'sfx' },
        'item_pickup': { url: 'src/assets/audio/sfx/item_pickup.ogg', type: 'sfx' },
        'checkpoint': { url: 'src/assets/audio/sfx/checkpoint.ogg', type: 'sfx' },
        'menu_select': { url: 'src/assets/audio/sfx/menu_select.ogg', type: 'sfx' },
        'footstep': { url: 'src/assets/audio/sfx/footstep.ogg', type: 'sfx' },
        'interact': { url: 'src/assets/audio/sfx/interact.ogg', type: 'sfx' },
        'attack': { url: 'src/assets/audio/sfx/attack.ogg', type: 'sfx' },
        'hit': { url: 'src/assets/audio/sfx/hit.ogg', type: 'sfx' },
        'defeat': { url: 'src/assets/audio/sfx/defeat.ogg', type: 'sfx' },
        'story_complete': { url: 'src/assets/audio/sfx/story_complete.ogg', type: 'sfx' }
    },
    
    // Data assets (JSON, text files)
    data: {
        'main-story': { url: 'src/assets/story/main-story.json', type: 'json' },
        'dialogue-data': { url: 'src/assets/story/dialogue-data.json', type: 'json' },
        'power-definitions': { url: 'src/assets/data/power-definitions.json', type: 'json' },
        'item-definitions': { url: 'src/assets/data/item-definitions.json', type: 'json' },
        'world-maps': { url: 'src/assets/data/world-maps.json', type: 'json' }
    }
};

// Critical assets that should be loaded first for faster startup
export const CRITICAL_ASSETS = {
    sprites: {
        'player-idle-0': ASSET_MANIFEST.sprites['player-idle-0'],
        'grass-tile': ASSET_MANIFEST.sprites['grass-tile'],
        'stone-tile': ASSET_MANIFEST.sprites['stone-tile']
    },
    ui: {
        'button': ASSET_MANIFEST.ui['button'],
        'dialogue-box': ASSET_MANIFEST.ui['dialogue-box']
    },
    data: {
        'main-story': ASSET_MANIFEST.data['main-story']
    }
};

// Asset loading priorities (lower number = higher priority)
export const ASSET_PRIORITIES = {
    // Critical UI and player assets
    'button': 1,
    'dialogue-box': 1,
    'player-idle-0': 1,
    'main-story': 1,
    
    // Core gameplay assets
    'grass-tile': 2,
    'stone-tile': 2,
    'water-tile': 2,
    'player-walk-0': 2,
    'player-walk-1': 2,
    'player-walk-2': 2,
    'player-walk-3': 2,
    
    // Secondary assets
    'tree-tile': 3,
    'dirt-tile': 3,
    'npc-idle-0': 3,
    'npc-idle-1': 3,
    
    // Optional assets (can be loaded later)
    'item-key': 4,
    'item-potion': 4,
    'item-scroll': 4,
    'item-gem': 4,
    'item-coin': 4,
    'object-chest': 4,
    'object-door': 4,
    'object-crystal': 4,
    'object-statue': 4,
    'object-bush': 4,
    
    // Audio assets
    'menu_theme': 2,
    'world_ambient': 2,
    'dialogue_open': 3,
    'dialogue_next': 3,
    'power_unlock': 3,
    'menu_select': 3,
    'item_pickup': 4,
    'footstep': 4,
    'interact': 4,
    'power_activate': 4,
    'checkpoint': 4,
    'loading_theme': 5,
    'attack': 5,
    'hit': 5,
    'defeat': 5,
    'story_complete': 5
};

// Asset categories for organized loading
export const ASSET_CATEGORIES = {
    SPRITES: 'sprites',
    UI: 'ui',
    AUDIO: 'audio',
    DATA: 'data'
};

// Memory management settings
export const MEMORY_SETTINGS = {
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MEMORY_THRESHOLD: 100 * 1024 * 1024, // 100MB
    MAX_CACHED_TEXTURES: 50,
    TEXTURE_COMPRESSION: true
};

/**
 * Get assets by priority level
 * @param {number} maxPriority - Maximum priority level to include
 * @returns {Object} Filtered asset manifest
 */
export function getAssetsByPriority(maxPriority = 5) {
    const filteredManifest = {
        sprites: {},
        ui: {},
        audio: {},
        data: {}
    };
    
    for (const [category, assets] of Object.entries(ASSET_MANIFEST)) {
        for (const [key, assetData] of Object.entries(assets)) {
            const priority = ASSET_PRIORITIES[key] || 5;
            if (priority <= maxPriority) {
                filteredManifest[category][key] = assetData;
            }
        }
    }
    
    return filteredManifest;
}

/**
 * Get assets by category
 * @param {string} category - Asset category
 * @returns {Object} Assets in the specified category
 */
export function getAssetsByCategory(category) {
    return ASSET_MANIFEST[category] || {};
}

/**
 * Check if an asset exists in the manifest
 * @param {string} category - Asset category
 * @param {string} key - Asset key
 * @returns {boolean} True if asset exists
 */
export function assetExists(category, key) {
    return !!(ASSET_MANIFEST[category] && ASSET_MANIFEST[category][key]);
}

/**
 * Get asset URL
 * @param {string} category - Asset category
 * @param {string} key - Asset key
 * @returns {string|null} Asset URL or null if not found
 */
export function getAssetUrl(category, key) {
    const asset = ASSET_MANIFEST[category] && ASSET_MANIFEST[category][key];
    return asset ? asset.url : null;
}