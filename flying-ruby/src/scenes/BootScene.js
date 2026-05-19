import { PALETTE } from '../config.js';

// BootScene preloads any assets the game needs and then hands off to StartScene.
// For now we generate placeholder textures at runtime so the game runs before
// real art arrives in /assets.
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('pbot',   'assets/sprites/pbot.png');
    this.load.image('ruby',   'assets/sprites/ruby.png');
    this.load.image('bg',     'assets/backgrounds/bg.png');
    this.load.audio('on-hit', 'sfx/on-hit.wav');
    // Additional real assets will go here as they arrive, e.g.:
    // this.load.audio('flap', 'sfx/flap.mp3');
    // this.load.audio('bgm-start', 'bgm/start-theme.mp3');
  }

  create() {
    this._buildPlaceholderTextures();

    // Dev hook: ?scene=GameScene or ?scene=GameOverScene jumps straight to
    // a scene, with sensible mock data for GameOver. Default is StartScene.
    const params = new URLSearchParams(window.location.search);
    const target = params.get('scene') || 'StartScene';
    const payload = target === 'GameOverScene'
      ? { score: 12, timeUsedMs: 95000, cause: 'time' }
      : undefined;
    this.scene.start(target, payload);
  }

  // --- placeholder texture factory ---------------------------------------
  // These are simple shape-based textures so we can build & test gameplay
  // before final art is dropped into /assets. They share the names that the
  // final image files will use, so swapping later is a one-line change in
  // BootScene.preload().
  _buildPlaceholderTextures() {
    this._makePipe();
    this._makeStar();
  }

  _makePipe() {
    // A vertical obstacle. Stored as a 64x600 texture; instances are cropped
    // or tiled by the GameScene as needed.
    const w = 64;
    const h = 600;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PALETTE.royalBlue, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(PALETTE.navy, 1);
    g.fillRect(2, 0, 6, h); // left shadow stripe
    g.fillStyle(PALETTE.yellow, 0.4);
    g.fillRect(w - 8, 0, 4, h); // right highlight
    g.generateTexture('pipe', w, h);
    g.destroy();
  }

  _makeStar() {
    const s = 8;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PALETTE.yellow, 1);
    g.fillCircle(s / 2, s / 2, s / 2);
    g.generateTexture('star', s, s);
    g.destroy();
  }
}
