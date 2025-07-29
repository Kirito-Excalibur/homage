import { ASSET_KEYS } from '../utils/Constants.js';

export class MapLoader {
  static loadFlooringMap(scene) {
    const map = scene.make.tilemap({ key: ASSET_KEYS.MAPS.FLOORING });
    
    // Add tilesets
    const FlooringSet = map.addTilesetImage("flooring", ASSET_KEYS.IMAGES.FLOORING);
    const GateSet = map.addTilesetImage("p", ASSET_KEYS.IMAGES.GATE);
    
    // Create layers
    const FlooringLayer = map.createLayer(0, FlooringSet, 0, 0);
    
    // Set collision on border tiles
    if (FlooringLayer) {
      FlooringLayer.setCollisionByExclusion([327, 347, 367]);
    }
    
    // Process object layers to create sprites from objects with gid
    map.objects.forEach(objectLayer => {
      if (objectLayer.objects) {
        objectLayer.objects.forEach(obj => {
          if (obj.gid) {
            const sprite = scene.add.image(obj.x, obj.y - obj.height, GateSet.image.key);
            sprite.setOrigin(0, 0);
            sprite.setDisplaySize(obj.width, obj.height);
            sprite.setVisible(obj.visible);
          }
        });
      }
    });
    
    return { map, FlooringLayer };
  }

  static loadGardenMap(scene) {
    const map = scene.make.tilemap({ key: ASSET_KEYS.MAPS.GARDEN });
    
    // Add grass tileset
    const GrassSet = map.addTilesetImage("grass", ASSET_KEYS.IMAGES.GRASS);
    const GrassLayer = map.createLayer(0, GrassSet, 0, 0);
    
    // Set collision on border tiles
    if (GrassLayer) {
      GrassLayer.setCollisionByExclusion([13, 24]);
    }
    
    return { map, GrassLayer };
  }

  static setupWorldBounds(scene, map) {
    // Set world bounds to match the tilemap size
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // Set camera bounds and follow player
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.startFollow(scene.player.sprite);
  }

  static createPortalZone(scene, map) {
    if (map.objects && map.objects[0] && map.objects[0].objects[0]) {
      const portal = map.objects[0].objects[0];
      return new Phaser.Geom.Rectangle(portal.x, portal.y, portal.width, portal.height);
    }
    return null;
  }

  static createExitZone(scene, map) {
    return new Phaser.Geom.Rectangle(0, 0, map.widthInPixels, 50);
  }
}