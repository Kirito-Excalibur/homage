import { DEBUG_COLORS } from '../utils/Constants.js';

export class Debug {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.debugTexts = [];
    this.showDebug = false;
    
    this.setupControls();
  }

  setupControls() {
    this.scene.input.keyboard.on("keydown-C", () => {
      this.showDebug = !this.showDebug;
      this.draw();
    });
  }

  draw() {
    this.graphics.clear();
    this.clearTexts();

    if (!this.showDebug) return;

    this.drawTilemapDebug();
    this.drawPlayerDebug();
    this.drawZoneDebug();
    this.drawObjectDebug();
  }

  drawTilemapDebug() {
    if (this.scene.map) {
      this.scene.map.renderDebug(this.graphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(
          DEBUG_COLORS.COLLISION.r,
          DEBUG_COLORS.COLLISION.g,
          DEBUG_COLORS.COLLISION.b,
          DEBUG_COLORS.COLLISION.a
        ),
        faceColor: new Phaser.Display.Color(
          DEBUG_COLORS.FACE.r,
          DEBUG_COLORS.FACE.g,
          DEBUG_COLORS.FACE.b,
          DEBUG_COLORS.FACE.a
        ),
      });
    }
  }

  drawPlayerDebug() {
    if (!this.scene.player) return;

    const player = this.scene.player;

    // Draw sprite boundary (full frame)
    this.graphics.lineStyle(2, DEBUG_COLORS.PLAYER_SPRITE);
    this.graphics.strokeRect(
      player.x - player.width / 2,
      player.y - player.height / 2,
      player.width,
      player.height
    );

    // Draw physics body boundary
    this.graphics.lineStyle(2, DEBUG_COLORS.PLAYER_BODY);
    this.graphics.strokeRect(
      player.body.x,
      player.body.y,
      player.body.width,
      player.body.height
    );

    // Draw smaller boundary
    this.graphics.lineStyle(1, DEBUG_COLORS.PLAYER_SMALL);
    const smallerSize = 16;
    this.graphics.strokeRect(
      player.x - smallerSize / 2,
      player.y - smallerSize / 2,
      smallerSize,
      smallerSize
    );
  }

  drawZoneDebug() {
    // Draw alert/portal zone
    if (this.scene.alertZone) {
      this.graphics.lineStyle(3, DEBUG_COLORS.PORTAL);
      this.graphics.strokeRect(
        this.scene.alertZone.x,
        this.scene.alertZone.y,
        this.scene.alertZone.width,
        this.scene.alertZone.height
      );

      this.graphics.fillStyle(DEBUG_COLORS.PORTAL, 0.2);
      this.graphics.fillRect(
        this.scene.alertZone.x,
        this.scene.alertZone.y,
        this.scene.alertZone.width,
        this.scene.alertZone.height
      );
    }

    // Draw exit zone
    if (this.scene.exitZone) {
      this.graphics.lineStyle(3, DEBUG_COLORS.EXIT);
      this.graphics.strokeRect(
        this.scene.exitZone.x,
        this.scene.exitZone.y,
        this.scene.exitZone.width,
        this.scene.exitZone.height
      );

      this.graphics.fillStyle(DEBUG_COLORS.EXIT, 0.2);
      this.graphics.fillRect(
        this.scene.exitZone.x,
        this.scene.exitZone.y,
        this.scene.exitZone.width,
        this.scene.exitZone.height
      );
    }
  }

  drawObjectDebug() {
    if (!this.scene.map || !this.scene.map.objects) return;

    this.scene.map.objects.forEach((objectLayer) => {
      if (objectLayer.objects) {
        objectLayer.objects.forEach((obj, objIndex) => {
          let debugX = obj.x;
          let debugY = obj.y;
          let debugWidth = obj.width || 16;
          let debugHeight = obj.height || 16;

          // If object has gid (like gateImg), adjust for Tiled coordinate system
          if (obj.gid) {
            debugY = obj.y - obj.height;
          }

          // Draw object boundary
          this.graphics.lineStyle(2, DEBUG_COLORS.OBJECT);
          this.graphics.strokeRect(debugX, debugY, debugWidth, debugHeight);

          // Add object label
          const objText = this.scene.add.text(
            debugX,
            debugY - 15,
            obj.name || `Object ${objIndex}`,
            {
              fontSize: '10px',
              fill: '#00ffff',
              backgroundColor: '#000000',
              padding: { x: 2, y: 1 }
            }
          );
          objText.setDepth(1000);
          this.debugTexts.push(objText);
        });
      }
    });
  }

  clearTexts() {
    this.debugTexts.forEach(text => text.destroy());
    this.debugTexts = [];
  }

  toggle() {
    this.showDebug = !this.showDebug;
    this.draw();
  }

  isEnabled() {
    return this.showDebug;
  }
}