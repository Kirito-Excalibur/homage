const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Create directories for organizing assets
const assetDirs = [
  'src/assets/characters',
  'src/assets/tiles',
  'src/assets/ui',
  'src/assets/items',
  'src/assets/objects'
];

assetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Enhanced color palettes for better visual appeal
const PALETTES = {
  character: {
    skin: ['#FFDBAC', '#F4C2A1', '#E8A87C', '#D49C6B'],
    hair: ['#8B4513', '#654321', '#A0522D', '#D2691E', '#FFD700', '#FF6347'],
    clothing: ['#4A90E2', '#E24A4A', '#7ED321', '#9013FE', '#F5A623', '#50E3C2'],
    accent: ['#FFFFFF', '#000000', '#696969', '#D4AF37']
  },
  environment: {
    grass: ['#7ED321', '#9AE34A', '#5CB01A', '#B8F55A', '#4A7C0A'],
    stone: ['#9B9B9B', '#BBBBBB', '#7B7B7B', '#DBDBDB', '#5B5B5B'],
    water: ['#50E3C2', '#70F3D2', '#30C3A2', '#90FFF2', '#10B392'],
    dirt: ['#8B572A', '#AB773A', '#6B371A', '#CB974A', '#4B271A'],
    wood: ['#8B4513', '#A0522D', '#654321', '#D2691E', '#4A2C17']
  },
  ui: {
    primary: '#4A90E2',
    secondary: '#E24A4A',
    accent: '#D4AF37',
    neutral: ['#F8F8F8', '#E8E8E8', '#D8D8D8', '#C8C8C8'],
    dark: ['#333333', '#444444', '#555555', '#666666']
  }
};

// Enhanced helper functions for better sprite creation
function drawPixel(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
}

function addGradient(ctx, x, y, width, height, color1, color2, direction = 'vertical') {
  const gradient = direction === 'vertical' 
    ? ctx.createLinearGradient(x, y, x, y + height)
    : ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
}

function addShadow(ctx, x, y, width, height, shadowColor = 'rgba(0,0,0,0.3)', offset = 2) {
  ctx.fillStyle = shadowColor;
  ctx.fillRect(x + offset, y + offset, width, height);
}

// Enhanced character sprite creation with better detail
function createDetailedCharacterSprite(filename, config) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.clearRect(0, 0, 32, 32);
  
  // Draw character with enhanced detail
  const { body, head, clothing, accessories } = config;
  
  // Shadow
  addShadow(ctx, 8, 28, 16, 4, 'rgba(0,0,0,0.2)', 0);
  
  // Body base
  ctx.fillStyle = body.skin;
  ctx.fillRect(12, 8, 8, 12); // torso
  ctx.fillRect(10, 20, 4, 8); // left leg
  ctx.fillRect(18, 20, 4, 8); // right leg
  ctx.fillRect(8, 12, 4, 6);  // left arm
  ctx.fillRect(20, 12, 4, 6); // right arm
  
  // Head
  ctx.fillStyle = head.skin;
  ctx.fillRect(11, 4, 10, 8); // head
  
  // Hair
  ctx.fillStyle = head.hair;
  ctx.fillRect(10, 3, 12, 4); // hair top
  ctx.fillRect(9, 4, 2, 6);   // hair sides
  ctx.fillRect(21, 4, 2, 6);
  
  // Facial features
  ctx.fillStyle = '#000000';
  ctx.fillRect(13, 6, 1, 1); // left eye
  ctx.fillRect(18, 6, 1, 1); // right eye
  ctx.fillRect(15, 8, 2, 1); // mouth
  
  // Clothing
  if (clothing.robe) {
    addGradient(ctx, 11, 12, 10, 12, clothing.robe.light, clothing.robe.dark);
    // Robe details
    ctx.fillStyle = clothing.robe.accent;
    ctx.fillRect(12, 14, 8, 1); // belt
    ctx.fillRect(15, 13, 2, 8); // center line
  }
  
  // Boots
  ctx.fillStyle = clothing.boots;
  ctx.fillRect(10, 26, 4, 4); // left boot
  ctx.fillRect(18, 26, 4, 4); // right boot
  
  // Accessories
  if (accessories && accessories.weapon) {
    ctx.fillStyle = accessories.weapon;
    ctx.fillRect(6, 10, 2, 8); // weapon handle
    ctx.fillRect(4, 8, 6, 2);  // weapon blade
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created detailed sprite: ${filename}`);
}

// Enhanced tile sprite creation with better textures and detail
function createEnhancedTileSprite(filename, tileType) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 32, 32);
  
  switch (tileType) {
    case 'grass':
      // Base grass with gradient
      addGradient(ctx, 0, 0, 32, 32, PALETTES.environment.grass[1], PALETTES.environment.grass[0]);
      
      // Add detailed grass texture
      ctx.fillStyle = PALETTES.environment.grass[3];
      for (let i = 0; i < 25; i++) {
        const x = Math.floor(Math.random() * 30) + 1;
        const y = Math.floor(Math.random() * 30) + 1;
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x + 1, y - 1, 1, 2);
      }
      
      // Add darker grass details
      ctx.fillStyle = PALETTES.environment.grass[2];
      for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * 28) + 2;
        const y = Math.floor(Math.random() * 28) + 2;
        ctx.fillRect(x, y, 1, 3);
      }
      
      // Add small flowers
      ctx.fillStyle = '#FFB6C1';
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 28) + 2;
        const y = Math.floor(Math.random() * 28) + 2;
        ctx.fillRect(x, y, 1, 1);
      }
      break;
      
    case 'stone':
      // Stone base with gradient
      addGradient(ctx, 0, 0, 32, 32, PALETTES.environment.stone[1], PALETTES.environment.stone[0]);
      
      // Add stone blocks pattern
      ctx.fillStyle = PALETTES.environment.stone[2];
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillRect(18, 2, 12, 12);
      ctx.fillRect(2, 18, 12, 12);
      ctx.fillRect(18, 18, 12, 12);
      
      // Add mortar lines
      ctx.fillStyle = PALETTES.environment.stone[4];
      ctx.fillRect(0, 14, 32, 2);
      ctx.fillRect(14, 0, 2, 32);
      
      // Add highlights
      ctx.fillStyle = PALETTES.environment.stone[3];
      ctx.fillRect(3, 3, 10, 1);
      ctx.fillRect(19, 3, 10, 1);
      ctx.fillRect(3, 19, 10, 1);
      ctx.fillRect(19, 19, 10, 1);
      break;
      
    case 'water':
      // Water base with animated-looking waves
      addGradient(ctx, 0, 0, 32, 32, PALETTES.environment.water[1], PALETTES.environment.water[0]);
      
      // Add wave patterns
      ctx.fillStyle = PALETTES.environment.water[2];
      for (let y = 2; y < 30; y += 6) {
        ctx.fillRect(0, y, 32, 2);
        ctx.fillRect(2, y + 3, 28, 1);
      }
      
      // Add water highlights
      ctx.fillStyle = PALETTES.environment.water[3];
      for (let y = 4; y < 28; y += 8) {
        ctx.fillRect(4, y, 24, 1);
      }
      
      // Add sparkles
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 30) + 1;
        const y = Math.floor(Math.random() * 30) + 1;
        ctx.fillRect(x, y, 1, 1);
      }
      break;
      
    case 'dirt':
      // Dirt base with gradient
      addGradient(ctx, 0, 0, 32, 32, PALETTES.environment.dirt[1], PALETTES.environment.dirt[0]);
      
      // Add dirt texture
      ctx.fillStyle = PALETTES.environment.dirt[2];
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * 32);
        const y = Math.floor(Math.random() * 32);
        ctx.fillRect(x, y, 1, 1);
      }
      
      // Add larger dirt clumps
      ctx.fillStyle = PALETTES.environment.dirt[3];
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * 28) + 2;
        const y = Math.floor(Math.random() * 28) + 2;
        ctx.fillRect(x, y, 2, 2);
      }
      
      // Add small rocks
      ctx.fillStyle = PALETTES.environment.stone[2];
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(Math.random() * 30) + 1;
        const y = Math.floor(Math.random() * 30) + 1;
        ctx.fillRect(x, y, 2, 1);
      }
      break;
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created enhanced tile: ${filename}`);
}

// Helper function to create UI elements
function createUIElement(width, height, backgroundColor, borderColor, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Add border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Generate enhanced character sprites (32x32px)
console.log('Generating enhanced character sprites...');

// Player character - blue robed adventurer with detailed design
const playerConfig = {
  body: {
    skin: PALETTES.character.skin[0]
  },
  head: {
    skin: PALETTES.character.skin[0],
    hair: PALETTES.character.hair[0]
  },
  clothing: {
    robe: {
      light: '#6AA0F2',
      dark: PALETTES.character.clothing[0],
      accent: PALETTES.character.accent[3]
    },
    boots: PALETTES.environment.wood[2]
  },
  accessories: {
    weapon: '#C0C0C0'
  }
};

createDetailedCharacterSprite('src/assets/characters/player.png', playerConfig);

// NPC character - red robed villager with detailed design
const npcConfig = {
  body: {
    skin: PALETTES.character.skin[1]
  },
  head: {
    skin: PALETTES.character.skin[1],
    hair: PALETTES.character.hair[1]
  },
  clothing: {
    robe: {
      light: '#FF6B6B',
      dark: PALETTES.character.clothing[1],
      accent: PALETTES.character.accent[3]
    },
    boots: PALETTES.environment.wood[1]
  }
};

createDetailedCharacterSprite('src/assets/characters/npc.png', npcConfig);

// Generate enhanced tile sprites (32x32px)
console.log('Generating enhanced tile sprites...');

createEnhancedTileSprite('src/assets/tiles/grass.png', 'grass');
createEnhancedTileSprite('src/assets/tiles/stone.png', 'stone');
createEnhancedTileSprite('src/assets/tiles/water.png', 'water');
createEnhancedTileSprite('src/assets/tiles/dirt.png', 'dirt');

// Enhanced tree sprite with detailed foliage
function createEnhancedTreeSprite() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 32, 32);
  
  // Tree shadow
  addShadow(ctx, 10, 28, 12, 4, 'rgba(0,0,0,0.2)', 0);
  
  // Tree trunk with gradient
  addGradient(ctx, 12, 18, 8, 14, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
  
  // Trunk texture
  ctx.fillStyle = PALETTES.environment.wood[4];
  ctx.fillRect(13, 20, 1, 10);
  ctx.fillRect(18, 22, 1, 8);
  
  // Tree foliage base
  addGradient(ctx, 4, 4, 24, 18, PALETTES.environment.grass[1], PALETTES.environment.grass[2]);
  
  // Foliage layers for depth
  ctx.fillStyle = PALETTES.environment.grass[0];
  ctx.fillRect(6, 6, 20, 14);
  
  ctx.fillStyle = PALETTES.environment.grass[3];
  ctx.fillRect(8, 8, 16, 10);
  
  // Foliage highlights and details
  ctx.fillStyle = PALETTES.environment.grass[4];
  ctx.fillRect(10, 10, 4, 4);
  ctx.fillRect(18, 12, 4, 4);
  ctx.fillRect(14, 14, 4, 2);
  
  // Add small fruits/berries
  ctx.fillStyle = '#DC143C';
  ctx.fillRect(12, 11, 1, 1);
  ctx.fillRect(19, 13, 1, 1);
  ctx.fillRect(16, 15, 1, 1);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/tiles/tree.png', buffer);
  console.log('Created enhanced tree: src/assets/tiles/tree.png');
}

createEnhancedTreeSprite();

// Enhanced UI element creation functions
function createEnhancedDialogueBox() {
  const canvas = createCanvas(400, 120);
  const ctx = canvas.getContext('2d');
  
  // Background with subtle gradient
  addGradient(ctx, 0, 0, 400, 120, PALETTES.ui.neutral[0], PALETTES.ui.neutral[1]);
  
  // Ornate outer border
  ctx.strokeStyle = PALETTES.environment.wood[2];
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 396, 116);
  
  // Inner decorative border
  ctx.strokeStyle = PALETTES.ui.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 388, 108);
  
  // Corner ornaments
  ctx.fillStyle = PALETTES.environment.wood[2];
  // Top corners
  ctx.fillRect(8, 8, 12, 12);
  ctx.fillRect(380, 8, 12, 12);
  // Bottom corners
  ctx.fillRect(8, 100, 12, 12);
  ctx.fillRect(380, 100, 12, 12);
  
  // Corner highlights
  ctx.fillStyle = PALETTES.ui.accent;
  ctx.fillRect(10, 10, 8, 8);
  ctx.fillRect(382, 10, 8, 8);
  ctx.fillRect(10, 102, 8, 8);
  ctx.fillRect(382, 102, 8, 8);
  
  // Decorative side elements
  ctx.fillStyle = PALETTES.ui.accent;
  ctx.fillRect(30, 10, 340, 2);
  ctx.fillRect(30, 108, 340, 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/ui/dialogue-box.png', buffer);
  console.log('Created enhanced dialogue box: src/assets/ui/dialogue-box.png');
}

function createEnhancedButton() {
  const canvas = createCanvas(120, 40);
  const ctx = canvas.getContext('2d');
  
  // Button shadow
  addShadow(ctx, 0, 0, 120, 40, 'rgba(0,0,0,0.3)', 2);
  
  // Button gradient background
  addGradient(ctx, 0, 0, 120, 40, '#6AA0F2', PALETTES.ui.primary);
  
  // Button border
  ctx.strokeStyle = '#2E5C8A';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 118, 38);
  
  // Top highlight for 3D effect
  addGradient(ctx, 2, 2, 116, 8, '#8AB4F8', 'rgba(138, 180, 248, 0.5)');
  
  // Side highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(2, 2, 2, 36);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/ui/button.png', buffer);
  console.log('Created enhanced button: src/assets/ui/button.png');
}

function createEnhancedInventorySlot() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  
  // Slot background with inset gradient
  addGradient(ctx, 0, 0, 48, 48, PALETTES.ui.neutral[2], PALETTES.ui.neutral[1]);
  
  // Inset border effect (dark top/left, light bottom/right)
  ctx.strokeStyle = PALETTES.ui.dark[2];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 48);
  ctx.lineTo(0, 0);
  ctx.lineTo(48, 0);
  ctx.stroke();
  
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 0);
  ctx.lineTo(48, 48);
  ctx.lineTo(0, 48);
  ctx.stroke();
  
  // Inner highlight
  ctx.strokeStyle = PALETTES.ui.neutral[0];
  ctx.lineWidth = 1;
  ctx.strokeRect(3, 3, 42, 42);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/ui/inventory-slot.png', buffer);
  console.log('Created enhanced inventory slot: src/assets/ui/inventory-slot.png');
}

function createEnhancedInventoryPanel() {
  const canvas = createCanvas(300, 200);
  const ctx = canvas.getContext('2d');
  
  // Panel background
  addGradient(ctx, 0, 0, 300, 200, PALETTES.ui.neutral[0], PALETTES.ui.neutral[1]);
  
  // Panel border
  ctx.strokeStyle = PALETTES.environment.wood[2];
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 296, 196);
  
  // Inner border
  ctx.strokeStyle = PALETTES.ui.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(5, 5, 290, 190);
  
  // Title area
  addGradient(ctx, 8, 8, 284, 24, PALETTES.ui.primary, '#6AA0F2');
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/ui/inventory-panel.png', buffer);
  console.log('Created enhanced inventory panel: src/assets/ui/inventory-panel.png');
}

function createEnhancedHealthBar() {
  // Health bar background
  const bgCanvas = createCanvas(200, 30);
  const bgCtx = bgCanvas.getContext('2d');
  
  addGradient(bgCtx, 0, 0, 200, 30, PALETTES.ui.dark[0], PALETTES.ui.dark[1]);
  
  // Border
  bgCtx.strokeStyle = PALETTES.ui.dark[2];
  bgCtx.lineWidth = 2;
  bgCtx.strokeRect(1, 1, 198, 28);
  
  const bgBuffer = bgCanvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/ui/health-bar-bg.png', bgBuffer);
  
  // Health bar fill
  const fillCanvas = createCanvas(196, 26);
  const fillCtx = fillCanvas.getContext('2d');
  
  addGradient(fillCtx, 0, 0, 196, 26, '#FF6B6B', PALETTES.ui.secondary);
  
  // Add shine effect
  addGradient(fillCtx, 0, 0, 196, 8, 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)');
  
  const fillBuffer = fillCanvas.toBuffer('image/png');
  fs.writeFileSync('src/assets/ui/health-bar-fill.png', fillBuffer);
  
  console.log('Created enhanced health bar components');
}

// Generate enhanced UI elements
console.log('Generating enhanced UI elements...');

createEnhancedDialogueBox();
createEnhancedButton();
createEnhancedInventorySlot();
createEnhancedInventoryPanel();
createEnhancedHealthBar();

// Enhanced item sprite creation functions
function createEnhancedItemSprite(filename, itemType) {
  const canvas = createCanvas(24, 24);
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 24, 24);
  
  switch (itemType) {
    case 'key':
      // Key shadow
      addShadow(ctx, 2, 6, 18, 6, 'rgba(0,0,0,0.2)', 1);
      
      // Key shaft with gradient
      addGradient(ctx, 4, 8, 16, 4, PALETTES.character.accent[3], '#F5A623');
      
      // Key head
      addGradient(ctx, 16, 6, 4, 8, '#FFD700', PALETTES.character.accent[3]);
      
      // Key teeth
      ctx.fillStyle = '#E6AC00';
      ctx.fillRect(4, 10, 2, 2);
      ctx.fillRect(4, 14, 2, 2);
      ctx.fillRect(6, 12, 1, 1);
      
      // Metallic highlights
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(5, 9, 14, 1);
      ctx.fillRect(17, 7, 2, 1);
      break;
      
    case 'potion':
      // Bottle shadow
      addShadow(ctx, 6, 2, 10, 18, 'rgba(0,0,0,0.2)', 1);
      
      // Bottle with gradient
      addGradient(ctx, 8, 4, 8, 16, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      
      // Liquid with magical glow
      addGradient(ctx, 9, 8, 6, 10, '#E6A0FF', '#BD10E0');
      
      // Cork
      ctx.fillStyle = PALETTES.environment.wood[3];
      ctx.fillRect(9, 4, 6, 4);
      
      // Bottle highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(10, 5, 1, 14);
      
      // Magical sparkles
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(11, 10, 1, 1);
      ctx.fillRect(13, 13, 1, 1);
      ctx.fillRect(12, 15, 1, 1);
      break;
      
    case 'scroll':
      // Scroll shadow
      addShadow(ctx, 1, 4, 20, 14, 'rgba(0,0,0,0.15)', 1);
      
      // Scroll paper with aged gradient
      addGradient(ctx, 4, 6, 16, 12, '#F5F5DC', '#E6E6D3');
      
      // Scroll ends with wood texture
      addGradient(ctx, 2, 6, 4, 12, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      addGradient(ctx, 18, 6, 4, 12, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      
      // Text lines with varying lengths
      ctx.fillStyle = '#333333';
      ctx.fillRect(6, 8, 10, 1);
      ctx.fillRect(6, 10, 8, 1);
      ctx.fillRect(6, 12, 12, 1);
      ctx.fillRect(6, 14, 6, 1);
      ctx.fillRect(6, 16, 9, 1);
      
      // Decorative elements
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(3, 7, 1, 10);
      ctx.fillRect(20, 7, 1, 10);
      break;
      
    case 'gem':
      // Gem shadow
      addShadow(ctx, 6, 6, 10, 10, 'rgba(0,0,0,0.3)', 1);
      
      // Gem base with crystal effect
      addGradient(ctx, 8, 8, 8, 8, '#B347FF', '#9013FE');
      
      // Gem facets for depth
      ctx.fillStyle = '#E6B3FF';
      ctx.fillRect(6, 10, 12, 4);
      ctx.fillStyle = '#7A00CC';
      ctx.fillRect(10, 6, 4, 12);
      
      // Crystal highlights
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(11, 9, 2, 2);
      ctx.fillRect(9, 11, 1, 1);
      ctx.fillRect(14, 13, 1, 1);
      
      // Magical glow
      ctx.fillStyle = 'rgba(230, 179, 255, 0.5)';
      ctx.fillRect(7, 7, 10, 10);
      break;
      
    case 'coin':
      // Coin shadow
      addShadow(ctx, 4, 4, 14, 14, 'rgba(0,0,0,0.3)', 1);
      
      // Coin base with metallic gradient
      addGradient(ctx, 6, 6, 12, 12, '#FFB366', '#FF6900');
      
      // Inner circle detail
      addGradient(ctx, 8, 8, 8, 8, '#FFCC99', '#FFB366');
      
      // Center emblem
      ctx.fillStyle = '#CC5500';
      ctx.fillRect(10, 10, 4, 4);
      ctx.fillStyle = '#FF6900';
      ctx.fillRect(11, 11, 2, 2);
      
      // Coin edge details
      ctx.fillStyle = '#E6AC00';
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = 12 + Math.cos(angle) * 5;
        const y = 12 + Math.sin(angle) * 5;
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
      }
      
      // Metallic highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(9, 8, 4, 1);
      ctx.fillRect(8, 9, 1, 2);
      break;
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created enhanced item: ${filename}`);
}

// Generate enhanced item sprites (24x24px for inventory)
console.log('Generating enhanced item sprites...');

createEnhancedItemSprite('src/assets/items/key.png', 'key');
createEnhancedItemSprite('src/assets/items/potion.png', 'potion');
createEnhancedItemSprite('src/assets/items/scroll.png', 'scroll');
createEnhancedItemSprite('src/assets/items/gem.png', 'gem');
createEnhancedItemSprite('src/assets/items/coin.png', 'coin');

// Enhanced interactive object sprite creation functions
function createEnhancedObjectSprite(filename, objectType) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 32, 32);
  
  switch (objectType) {
    case 'chest':
      // Chest shadow
      addShadow(ctx, 2, 14, 28, 16, 'rgba(0,0,0,0.3)', 1);
      
      // Chest base with gradient
      addGradient(ctx, 4, 16, 24, 12, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      
      // Chest lid with gradient
      addGradient(ctx, 4, 8, 24, 10, PALETTES.environment.wood[0], PALETTES.environment.wood[1]);
      
      // Metal bands with metallic effect
      addGradient(ctx, 2, 14, 28, 2, '#A9A9A9', '#696969');
      addGradient(ctx, 2, 20, 28, 2, '#A9A9A9', '#696969');
      
      // Lock with golden gradient
      addGradient(ctx, 14, 18, 4, 4, PALETTES.character.accent[3], '#FFD700');
      
      // Chest highlights
      ctx.fillStyle = PALETTES.environment.wood[3];
      ctx.fillRect(5, 9, 22, 2);
      
      // Metal band highlights
      ctx.fillStyle = '#DCDCDC';
      ctx.fillRect(3, 14, 26, 1);
      ctx.fillRect(3, 20, 26, 1);
      
      // Lock keyhole
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(15, 19, 2, 2);
      break;
      
    case 'door':
      // Door shadow
      addShadow(ctx, -1, 0, 34, 32, 'rgba(0,0,0,0.2)', 1);
      
      // Door frame with gradient
      addGradient(ctx, 0, 0, 32, 32, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      
      // Door panel with gradient
      addGradient(ctx, 4, 2, 24, 28, PALETTES.environment.wood[2], PALETTES.environment.wood[3]);
      
      // Door decorative panels
      addGradient(ctx, 6, 4, 20, 10, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      addGradient(ctx, 6, 18, 20, 10, PALETTES.environment.wood[1], PALETTES.environment.wood[2]);
      
      // Door handle with golden gradient
      addGradient(ctx, 22, 14, 3, 4, PALETTES.character.accent[3], '#FFD700');
      
      // Door panel borders
      ctx.strokeStyle = PALETTES.environment.wood[4];
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 4, 20, 10);
      ctx.strokeRect(6, 18, 20, 10);
      
      // Handle highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(22, 14, 1, 2);
      break;
      
    case 'crystal':
      // Crystal shadow
      addShadow(ctx, 10, 26, 12, 6, 'rgba(0,0,0,0.3)', 1);
      
      // Crystal base with golden gradient
      addGradient(ctx, 12, 20, 8, 8, PALETTES.character.accent[3], '#FFD700');
      
      // Crystal body with magical gradient
      addGradient(ctx, 10, 12, 12, 12, '#FFFF99', '#FFF700');
      
      // Crystal top with bright gradient
      addGradient(ctx, 14, 6, 4, 10, '#FFFFFF', '#FFFF99');
      
      // Crystal facets for depth
      ctx.fillStyle = 'rgba(255, 255, 204, 0.8)';
      ctx.fillRect(11, 13, 2, 10);
      ctx.fillRect(19, 13, 2, 10);
      ctx.fillRect(15, 7, 2, 8);
      
      // Magical glow effect
      ctx.fillStyle = 'rgba(255, 255, 224, 0.6)';
      ctx.fillRect(9, 11, 14, 14);
      
      // Bright highlights
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(15, 8, 2, 2);
      ctx.fillRect(12, 14, 1, 1);
      ctx.fillRect(19, 16, 1, 1);
      ctx.fillRect(16, 20, 1, 1);
      break;
      
    case 'statue':
      // Statue shadow
      addShadow(ctx, 6, 30, 20, 4, 'rgba(0,0,0,0.4)', 1);
      
      // Statue base with stone gradient
      addGradient(ctx, 8, 24, 16, 8, PALETTES.environment.stone[1], PALETTES.environment.stone[0]);
      
      // Statue body with stone gradient
      addGradient(ctx, 12, 12, 8, 16, PALETTES.environment.stone[2], PALETTES.environment.stone[1]);
      
      // Statue head with lighter stone
      addGradient(ctx, 13, 8, 6, 6, PALETTES.environment.stone[3], PALETTES.environment.stone[2]);
      
      // Statue arms
      addGradient(ctx, 8, 14, 4, 8, PALETTES.environment.stone[2], PALETTES.environment.stone[1]);
      addGradient(ctx, 20, 14, 4, 8, PALETTES.environment.stone[2], PALETTES.environment.stone[1]);
      
      // Facial details
      ctx.fillStyle = PALETTES.environment.stone[4];
      ctx.fillRect(14, 10, 1, 1); // left eye
      ctx.fillRect(17, 10, 1, 1); // right eye
      ctx.fillRect(15, 12, 2, 1); // mouth
      
      // Stone texture details
      ctx.fillStyle = PALETTES.environment.stone[4];
      ctx.fillRect(13, 15, 1, 1);
      ctx.fillRect(18, 17, 1, 1);
      ctx.fillRect(15, 19, 1, 1);
      
      // Highlights
      ctx.fillStyle = PALETTES.environment.stone[3];
      ctx.fillRect(13, 9, 1, 1);
      ctx.fillRect(18, 9, 1, 1);
      ctx.fillRect(13, 13, 6, 1);
      break;
      
    case 'bush':
      // Bush shadow
      addShadow(ctx, 2, 28, 28, 6, 'rgba(0,0,0,0.2)', 1);
      
      // Bush base layer with gradient
      addGradient(ctx, 4, 16, 24, 16, PALETTES.environment.grass[2], PALETTES.environment.grass[4]);
      
      // Bush middle layer
      addGradient(ctx, 6, 12, 20, 16, PALETTES.environment.grass[1], PALETTES.environment.grass[2]);
      
      // Bush top layer
      addGradient(ctx, 8, 8, 16, 16, PALETTES.environment.grass[0], PALETTES.environment.grass[1]);
      
      // Bush highlights and texture
      ctx.fillStyle = PALETTES.environment.grass[3];
      ctx.fillRect(10, 10, 4, 4);
      ctx.fillRect(18, 14, 4, 4);
      ctx.fillRect(14, 18, 4, 2);
      
      // Small berries
      ctx.fillStyle = '#DC143C';
      ctx.fillRect(12, 12, 2, 2);
      ctx.fillRect(18, 16, 2, 2);
      ctx.fillRect(15, 20, 1, 1);
      
      // Berry highlights
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(12, 12, 1, 1);
      ctx.fillRect(18, 16, 1, 1);
      
      // Leaf details
      ctx.fillStyle = PALETTES.environment.grass[4];
      for (let i = 0; i < 8; i++) {
        const x = 9 + Math.floor(Math.random() * 14);
        const y = 10 + Math.floor(Math.random() * 12);
        ctx.fillRect(x, y, 1, 2);
      }
      break;
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created enhanced object: ${filename}`);
}

// Generate enhanced interactive object sprites (32x32px)
console.log('Generating enhanced interactive object sprites...');

createEnhancedObjectSprite('src/assets/objects/chest.png', 'chest');
createEnhancedObjectSprite('src/assets/objects/door.png', 'door');
createEnhancedObjectSprite('src/assets/objects/crystal.png', 'crystal');
createEnhancedObjectSprite('src/assets/objects/statue.png', 'statue');
createEnhancedObjectSprite('src/assets/objects/bush.png', 'bush');

console.log('All placeholder assets generated successfully!');