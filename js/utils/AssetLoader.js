import { ASSET_KEYS } from './Constants.js';

export class AssetLoader {
  static loadGameAssets(scene) {
    // Load images
    scene.load.image(ASSET_KEYS.IMAGES.FENCES, "assets/images/Fences.png");
    scene.load.image(ASSET_KEYS.IMAGES.GRASS, "assets/images/Grass.png");
    scene.load.image(ASSET_KEYS.IMAGES.FLOORING, "assets/images/Sprite-0003.png");
    scene.load.image(ASSET_KEYS.IMAGES.GATE, "assets/images/gate.png");

    // Load tilemaps
    scene.load.tilemapTiledJSON(ASSET_KEYS.MAPS.FLOORING, "assets/flooring.json");
    scene.load.tilemapTiledJSON(ASSET_KEYS.MAPS.GARDEN, "assets/garden.json");

    // Load spritesheets
    scene.load.spritesheet(ASSET_KEYS.SPRITES.PLAYER, "assets/images/sprite.png", {
      frameWidth: 48,
      frameHeight: 48,
    });

    scene.load.spritesheet(ASSET_KEYS.SPRITES.STARMAN, "assets/images/swordsman.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }
}