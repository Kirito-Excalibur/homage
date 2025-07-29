// Game constants and configuration
export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 592,
  PLAYER_SPEED: 150,
  TILE_SIZE: 16,
};

export const PLAYER_CONFIG = {
  DISPLAY_SIZE: 48,
  BODY_SIZE: 32,
  ANIMATIONS: {
    LEFT: { start: 8, end: 15 },
    RIGHT: { start: 16, end: 23 },
    DOWN: { start: 0, end: 7 },
    UP: { start: 24, end: 31 },
  },
  FRAME_RATE: 10,
};

export const UI_CONFIG = {
  FONT_SIZE: "16px",
  COLORS: {
    WHITE: "#fff",
    BLACK: "#000",
    GOLD: "#FFD700",
    RED: "#FF0000",
  },
  PADDING: { x: 8, y: 4 },
};

export const DEBUG_COLORS = {
  PLAYER_SPRITE: 0x00ff00,
  PLAYER_BODY: 0xff0000,
  PLAYER_SMALL: 0xffff00,
  PORTAL: 0xff00ff,
  EXIT: 0x00ff00,
  OBJECT: 0x00ffff,
  COLLISION: { r: 243, g: 134, b: 48, a: 200 },
  FACE: { r: 40, g: 39, b: 37, a: 255 },
};

export const SCENE_KEYS = {
  GAME: "GameScene",
  GARDEN: "GardenScene",
};

export const ASSET_KEYS = {
  MAPS: {
    FLOORING: "map",
    GARDEN: "gardenMap",
  },
  IMAGES: {
    FENCES: "Fences",
    GRASS: "Grass",
    FLOORING: "flooring",
    GATE: "gate",
  },
  SPRITES: {
    PLAYER: "player",
    STARMAN: "starman",
  },
};