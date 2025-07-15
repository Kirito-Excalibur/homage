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

// Helper function to create and save a colored rectangle sprite
function createSprite(width, height, color, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill with color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add a simple border for definition
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
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

// Generate character sprites (32x32px)
console.log('Generating character sprites...');
createSprite(32, 32, '#4A90E2', 'src/assets/characters/player.png');
createSprite(32, 32, '#E24A4A', 'src/assets/characters/npc.png');

// Generate tile sprites (32x32px)
console.log('Generating tile sprites...');
createSprite(32, 32, '#7ED321', 'src/assets/tiles/grass.png');
createSprite(32, 32, '#9B9B9B', 'src/assets/tiles/stone.png');
createSprite(32, 32, '#50E3C2', 'src/assets/tiles/water.png');
createSprite(32, 32, '#8B572A', 'src/assets/tiles/dirt.png');
createSprite(32, 32, '#417505', 'src/assets/tiles/tree.png');

// Generate UI elements
console.log('Generating UI elements...');
createUIElement(400, 120, '#F5F5F5', '#333333', 'src/assets/ui/dialogue-box.png');
createUIElement(120, 40, '#4A90E2', '#2E5C8A', 'src/assets/ui/button.png');
createUIElement(48, 48, '#FFFFFF', '#CCCCCC', 'src/assets/ui/inventory-slot.png');
createUIElement(300, 200, '#F8F8F8', '#DDDDDD', 'src/assets/ui/inventory-panel.png');
createUIElement(200, 30, '#333333', '#666666', 'src/assets/ui/health-bar-bg.png');
createUIElement(196, 26, '#E24A4A', '#B83A3A', 'src/assets/ui/health-bar-fill.png');

// Generate item sprites (24x24px for inventory)
console.log('Generating item sprites...');
createSprite(24, 24, '#F5A623', 'src/assets/items/key.png');
createSprite(24, 24, '#BD10E0', 'src/assets/items/potion.png');
createSprite(24, 24, '#B8E986', 'src/assets/items/scroll.png');
createSprite(24, 24, '#9013FE', 'src/assets/items/gem.png');
createSprite(24, 24, '#FF6900', 'src/assets/items/coin.png');

// Generate interactive object sprites (32x32px)
console.log('Generating interactive object sprites...');
createSprite(32, 32, '#8B4513', 'src/assets/objects/chest.png');
createSprite(32, 32, '#654321', 'src/assets/objects/door.png');
createSprite(32, 32, '#FFD700', 'src/assets/objects/crystal.png');
createSprite(32, 32, '#708090', 'src/assets/objects/statue.png');
createSprite(32, 32, '#228B22', 'src/assets/objects/bush.png');

console.log('All placeholder assets generated successfully!');