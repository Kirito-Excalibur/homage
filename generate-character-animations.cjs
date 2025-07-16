const fs = require('fs');
const { createCanvas } = require('canvas');

// Enhanced color palettes for character animations
const PALETTES = {
  character: {
    skin: ['#FFDBAC', '#F4C2A1', '#E8A87C', '#D49C6B'],
    hair: ['#8B4513', '#654321', '#A0522D', '#D2691E', '#FFD700', '#FF6347'],
    clothing: ['#4A90E2', '#E24A4A', '#7ED321', '#9013FE', '#F5A623', '#50E3C2'],
    accent: ['#FFFFFF', '#000000', '#696969', '#D4AF37']
  },
  environment: {
    wood: ['#8B4513', '#A0522D', '#654321', '#D2691E', '#4A2C17']
  }
};

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

// Create character animation frames
function createCharacterAnimationFrame(filename, config, animationType, frameIndex) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 32, 32);
  
  const { body, head, clothing, accessories } = config;
  
  // Animation offsets and modifications
  let bodyOffsetY = 0;
  let armOffset = 0;
  let legOffset = 0;
  let headBob = 0;
  
  if (animationType === 'walk') {
    // Walking animation - subtle movement
    bodyOffsetY = Math.sin(frameIndex * Math.PI / 2) * 0.5;
    armOffset = Math.sin(frameIndex * Math.PI / 2) * 1;
    legOffset = Math.sin(frameIndex * Math.PI / 2) * 1;
    headBob = Math.sin(frameIndex * Math.PI / 2) * 0.3;
  }
  
  // Shadow
  addShadow(ctx, 8, 28, 16, 4, 'rgba(0,0,0,0.2)', 0);
  
  // Legs with animation offset
  ctx.fillStyle = body.skin;
  ctx.fillRect(10 + legOffset, 20 + bodyOffsetY, 4, 8); // left leg
  ctx.fillRect(18 - legOffset, 20 + bodyOffsetY, 4, 8); // right leg
  
  // Body base
  ctx.fillStyle = body.skin;
  ctx.fillRect(12, 8 + bodyOffsetY, 8, 12); // torso
  
  // Arms with animation offset
  ctx.fillRect(8 + armOffset, 12 + bodyOffsetY, 4, 6);  // left arm
  ctx.fillRect(20 - armOffset, 12 + bodyOffsetY, 4, 6); // right arm
  
  // Head with subtle bob
  ctx.fillStyle = head.skin;
  ctx.fillRect(11, 4 + headBob, 10, 8); // head
  
  // Hair
  ctx.fillStyle = head.hair;
  ctx.fillRect(10, 3 + headBob, 12, 4); // hair top
  ctx.fillRect(9, 4 + headBob, 2, 6);   // hair sides
  ctx.fillRect(21, 4 + headBob, 2, 6);
  
  // Facial features
  ctx.fillStyle = '#000000';
  ctx.fillRect(13, 6 + headBob, 1, 1); // left eye
  ctx.fillRect(18, 6 + headBob, 1, 1); // right eye
  ctx.fillRect(15, 8 + headBob, 2, 1); // mouth
  
  // Clothing
  if (clothing.robe) {
    addGradient(ctx, 11, 12 + bodyOffsetY, 10, 12, clothing.robe.light, clothing.robe.dark);
    // Robe details
    ctx.fillStyle = clothing.robe.accent;
    ctx.fillRect(12, 14 + bodyOffsetY, 8, 1); // belt
    ctx.fillRect(15, 13 + bodyOffsetY, 2, 8); // center line
  }
  
  // Boots
  ctx.fillStyle = clothing.boots;
  ctx.fillRect(10 + legOffset, 26 + bodyOffsetY, 4, 4); // left boot
  ctx.fillRect(18 - legOffset, 26 + bodyOffsetY, 4, 4); // right boot
  
  // Accessories
  if (accessories && accessories.weapon) {
    ctx.fillStyle = accessories.weapon;
    ctx.fillRect(6 + armOffset, 10 + bodyOffsetY, 2, 8); // weapon handle
    ctx.fillRect(4 + armOffset, 8 + bodyOffsetY, 6, 2);  // weapon blade
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created animation frame: ${filename}`);
}

// Create directories for character animations
const animDirs = [
  'src/assets/characters/player',
  'src/assets/characters/npc'
];

animDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('Generating character animation frames...');

// Player character animation frames
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

// Create player idle animation (2 frames)
createCharacterAnimationFrame('src/assets/characters/player/idle_0.png', playerConfig, 'idle', 0);
createCharacterAnimationFrame('src/assets/characters/player/idle_1.png', playerConfig, 'idle', 1);

// Create player walk animation (4 frames)
for (let i = 0; i < 4; i++) {
  createCharacterAnimationFrame(`src/assets/characters/player/walk_${i}.png`, playerConfig, 'walk', i);
}

// NPC character animation frames
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

// Create NPC idle animation (2 frames)
createCharacterAnimationFrame('src/assets/characters/npc/idle_0.png', npcConfig, 'idle', 0);
createCharacterAnimationFrame('src/assets/characters/npc/idle_1.png', npcConfig, 'idle', 1);

// Create NPC walk animation (4 frames)
for (let i = 0; i < 4; i++) {
  createCharacterAnimationFrame(`src/assets/characters/npc/walk_${i}.png`, npcConfig, 'walk', i);
}

console.log('Character animation frames generated successfully!');