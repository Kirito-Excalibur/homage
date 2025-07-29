import { UI_CONFIG } from '../utils/Constants.js';

export class UI {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
  }

  createGameUI(title, gold = 0, health = 100) {
    this.elements.title = this.scene.add.text(16, 16, title, {
      fontSize: UI_CONFIG.FONT_SIZE,
      fill: UI_CONFIG.COLORS.WHITE,
      backgroundColor: UI_CONFIG.COLORS.BLACK,
      padding: UI_CONFIG.PADDING,
    });

    this.elements.scoreText = this.scene.add.text(16, 50, `Gold: ${gold}`, {
      fontSize: UI_CONFIG.FONT_SIZE,
      fill: UI_CONFIG.COLORS.GOLD,
      backgroundColor: UI_CONFIG.COLORS.BLACK,
      padding: UI_CONFIG.PADDING,
    });

    this.elements.healthText = this.scene.add.text(16, 84, `Health: ${health}`, {
      fontSize: UI_CONFIG.FONT_SIZE,
      fill: UI_CONFIG.COLORS.RED,
      backgroundColor: UI_CONFIG.COLORS.BLACK,
      padding: UI_CONFIG.PADDING,
    });

    this.elements.helpText = this.scene.add.text(200, 50, this.getHelpMessage(false), {
      fontSize: "18px",
      fill: UI_CONFIG.COLORS.WHITE,
    });

    // Set UI to not scroll with camera
    Object.values(this.elements).forEach(element => {
      element.setScrollFactor(0);
    });
  }

  updateGold(gold) {
    if (this.elements.scoreText) {
      this.elements.scoreText.setText(`Gold: ${gold}`);
    }
  }

  updateHealth(health) {
    if (this.elements.healthText) {
      this.elements.healthText.setText(`Health: ${health}`);
    }
  }

  updateHelpText(showDebug) {
    if (this.elements.helpText) {
      this.elements.helpText.setText(this.getHelpMessage(showDebug));
    }
  }

  getHelpMessage(showDebug) {
    return `Arrow keys to move.\nPress "C" to toggle debug visuals: ${showDebug ? "on" : "off"}`;
  }

  showDialog(message, x = 400, y = 100) {
    const dialog = this.scene.add
      .text(x, y, message, {
        fontSize: UI_CONFIG.FONT_SIZE,
        fill: UI_CONFIG.COLORS.BLACK,
        backgroundColor: UI_CONFIG.COLORS.WHITE,
        padding: { x: 12, y: 8 },
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Auto-remove dialog after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      dialog.destroy();
    });

    return dialog;
  }
}