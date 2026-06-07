import Phaser from 'phaser';
import {
  GAME_W, GAME_H,
  BRICK_W, BRICK_H,
  PADDLE_W, PADDLE_H,
  BALL_RADIUS,
  BRICK_COLORS,
  POWERUP_META,
  P,
} from '../config/gameConfig';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    // Real assets from public/
    this.load.image('bg-space',    'bg-space.png');
    this.load.image('pbot',        'pbot.png');       // transparent PNG — no white bg
    this.load.image('pbot-shield', 'pbot-shield.png');
    this.load.image('game-logo',   'game-logo.png');
  }

  create() {
    const W = GAME_W, H = GAME_H;

    // --- splash text ---
    this.cameras.main.setBackgroundColor('#0d1b2e');

    this.add.text(W / 2, H / 2 - 96, 'RUBY', {
      fontSize: '28px', fontFamily: '"Press Start 2P", monospace',
      color: '#cc1222', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 58, 'BREAKER', {
      fontSize: '22px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffc72c', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 26, 'GEM EDITION', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace',
      color: '#cc1222',
    }).setOrigin(0.5);

    const barBg  = this.add.rectangle(W / 2, H / 2 + 60, 320, 18, P.NAVY);
    const barFg  = this.add.rectangle(W / 2 - 160, H / 2 + 60, 0, 14, P.GOLD).setOrigin(0, 0.5);
    const loadTx = this.add.text(W / 2, H / 2 + 90, 'LOADING...', {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setOrigin(0.5);

    // Generate all textures, spread over ticks so the bar animates
    const steps = [
      () => this.genBall(),
      () => this.genPaddles(),
      () => this.genBricks(),
      () => this.genPowerUps(),
      () => this.genParticles(),
      () => this.genBackground(),
      () => this.genMascot(),
      () => this.genUI(),
      () => this.genRuby(),
    ];

    let i = 0;
    const total = steps.length;

    const tick = this.time.addEvent({
      delay: 50,
      repeat: total - 1,
      callback: () => {
        steps[i]();
        i++;
        barFg.width = 320 * (i / total);
        if (i >= total) {
          loadTx.setText('READY!');
          this.time.delayedCall(250, () => this.scene.start('StartScene'));
        }
      },
    });
  }

  // ─── texture generators ────────────────────────────────────────────

  genBall() {
    const r = BALL_RADIUS;
    const size = (r + 8) * 2;
    const g = this.make.graphics({ add: false });
    // gold glow (JDP gold)
    for (let i = 7; i > 0; i--) {
      g.fillStyle(P.GOLD, (8 - i) / 8 * 0.2);
      g.fillCircle(size / 2, size / 2, r + i);
    }
    g.fillStyle(P.WHITE, 1);
    g.fillCircle(size / 2, size / 2, r);
    g.fillStyle(P.GOLD, 0.55);
    g.fillCircle(size / 2, size / 2, r - 2);
    g.fillStyle(P.WHITE, 0.9);
    g.fillCircle(size / 2 - 3, size / 2 - 3, r * 0.38);
    g.generateTexture('ball', size, size);
    g.destroy();

    // fireball variant – crimson
    const f = this.make.graphics({ add: false });
    for (let i = 7; i > 0; i--) {
      f.fillStyle(P.B_RED, (8 - i) / 8 * 0.25);
      f.fillCircle(size / 2, size / 2, r + i);
    }
    f.fillStyle(P.B_RED, 1);
    f.fillCircle(size / 2, size / 2, r);
    f.fillStyle(P.GOLD, 0.85);
    f.fillCircle(size / 2 - 2, size / 2 - 2, r * 0.45);
    f.generateTexture('ball_fire', size, size);
    f.destroy();
  }

  genPaddles() {
    // normal – royal blue
    this.genOnePaddle('paddle',        PADDLE_W,                    PADDLE_H, P.BLUE,    P.BLUE_LT);
    // wide – gold
    this.genOnePaddle('paddle_wide',   Math.round(PADDLE_W * 1.6), PADDLE_H, P.AMBER,   P.GOLD);
    // narrow – dark crimson
    this.genOnePaddle('paddle_narrow', Math.round(PADDLE_W * 0.6), PADDLE_H, P.D_RED,   P.CRIMSON);
    // laser – bright red
    this.genOnePaddle('paddle_laser',  PADDLE_W,                    PADDLE_H, P.B_RED,   P.CRIMSON);
  }

  genOnePaddle(key, w, h, col, light) {
    const g = this.make.graphics({ add: false });
    // pixel shadow
    g.fillStyle(0x000000, 0.5);
    g.fillRect(2, 2, w, h);
    // body
    g.fillStyle(col, 1);
    g.fillRect(0, 0, w, h);
    // top highlight strip
    g.fillStyle(light, 1);
    g.fillRect(0, 0, w, Math.floor(h / 2));
    // 1-px gloss line
    g.fillStyle(P.WHITE, 0.45);
    g.fillRect(4, 2, w - 8, 2);
    // pixel gem diamond in center
    const cx = w / 2, cy = h / 2;
    g.fillStyle(P.GOLD, 1);
    g.fillRect(cx - 3, cy - 6, 6, 6);
    g.fillRect(cx - 5, cy - 2, 10, 4);
    g.fillRect(cx - 3, cy + 2, 6, 4);
    g.generateTexture(key, w + 4, h + 4);
    g.destroy();
  }

  genBricks() {
    BRICK_COLORS.forEach((c, i) => {
      this.genOneBrick(`brick_${i + 1}`, c.fill, c.shade);
    });
    // indestructible
    this.genOneBrick('brick_9', 0x444466, 0x333355, true);
  }

  genOneBrick(key, col, shade, indestructible = false) {
    const w = BRICK_W, h = BRICK_H;
    const g = this.make.graphics({ add: false });
    // pixel drop shadow
    g.fillStyle(0x000000, 0.4);
    g.fillRect(2, 2, w, h);
    // body
    g.fillStyle(col, 1);
    g.fillRect(0, 0, w, h);
    // bottom shade strip
    g.fillStyle(shade, 0.7);
    g.fillRect(0, Math.round(h * 0.55), w, Math.round(h * 0.45));
    // 2-px gloss line at top
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(3, 2, w - 6, 2);
    // 1-px dark border
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRect(0, 0, w, h);

    if (indestructible) {
      g.lineStyle(2, 0x8888aa, 0.8);
      g.strokeRect(2, 2, w - 4, h - 4);
      g.lineStyle(1.5, 0x9999bb, 0.6);
      g.lineBetween(4, 3, w - 4, h - 3);
      g.lineBetween(w - 4, 3, 4, h - 3);
    }
    g.generateTexture(key, w + 2, h + 2);
    g.destroy();
  }

  genPowerUps() {
    Object.entries(POWERUP_META).forEach(([type, meta]) => {
      const size = 28;
      const g = this.make.graphics({ add: false });
      // pixel-art gem shape: outer border + body + highlight
      g.fillStyle(0x000000, 0.5);
      g.fillRect(2, 2, size - 2, size - 2);       // shadow
      g.fillStyle(meta.color, 1);
      g.fillRect(0, 0, size - 2, size - 2);       // body
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(2, 2, 6, 4);                      // pixel gloss
      g.fillStyle(0x000000, 0.3);
      g.fillRect(0, size - 6, size - 2, 6);        // bottom shadow
      g.lineStyle(1, 0xffffff, 0.4);
      g.strokeRect(0, 0, size - 2, size - 2);
      g.generateTexture(`pu_${type}`, size, size);
      g.destroy();
    });
  }

  genParticles() {
    // square particle
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('particle', 6, 6);
    g.destroy();

    // round particle
    const g2 = this.make.graphics({ add: false });
    g2.fillStyle(0xffffff, 1);
    g2.fillCircle(4, 4, 4);
    g2.generateTexture('dot', 8, 8);
    g2.destroy();

  }

  genBackground() {
    // palette gradient: navy -> blue -> deep maroon (dark enough for gems/bricks to pop)
    const t = this.textures.createCanvas('background', GAME_W, GAME_H);
    const ctx = t.getContext();
    const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
    g.addColorStop(0,    '#0a1426');
    g.addColorStop(0.45, '#13233f');
    g.addColorStop(0.78, '#1a1020');
    g.addColorStop(1,    '#2e0810');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    t.refresh();
  }

  genMascot() {
    // Real assets (pbot.jpeg / pbot-shield.png) already loaded in preload().
    // Scenes reference them as 'pbot' and 'pbot-shield' directly.
    // Nothing to generate — this step is intentionally a no-op.
  }

  genUI() {
    // Pixel-art heart icon
    const g = this.make.graphics({ add: false });
    const heart = [
      [0,1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
      [0,0,0,0,0,0,0,0],
    ];
    heart.forEach((row, ry) => {
      row.forEach((px, rx) => {
        if (!px) return;
        g.fillStyle(P.B_RED, 1);
        g.fillRect(rx * 4, ry * 4, 4, 4);
        if (rx === 1 && ry === 0) { g.fillStyle(P.WHITE, 0.5); g.fillRect(rx * 4, ry * 4, 2, 2); }
      });
    });
    g.generateTexture('heart', 32, 28);
    g.destroy();

    // Shield bar – gold
    const sg = this.make.graphics({ add: false });
    sg.fillStyle(P.GOLD, 0.9);
    sg.fillRect(0, 0, GAME_W, 10);
    sg.generateTexture('shield_bar', GAME_W, 10);
    sg.destroy();

    // HUD top bar – deep navy
    const pg = this.make.graphics({ add: false });
    pg.fillStyle(P.NAVY, 0.9);
    pg.fillRect(0, 0, GAME_W, 50);
    pg.lineStyle(1, P.BLUE, 0.5);
    pg.lineBetween(0, 49, GAME_W, 49);
    pg.generateTexture('hud_bar', GAME_W, 50);
    pg.destroy();

    // Laser beam – gold/amber
    const lg = this.make.graphics({ add: false });
    lg.fillStyle(P.AMBER, 1);
    lg.fillRect(0, 0, 4, 22);
    lg.fillStyle(P.GOLD, 0.85);
    lg.fillRect(1, 0, 2, 22);
    lg.generateTexture('laser_beam', 4, 22);
    lg.destroy();
  }

  genRuby() {
    // 16×14 pixel-art diamond ruby gem
    const g = this.make.graphics({ add: false });
    const px = 2;
    // each row: which columns are filled [0..7]
    const rows = [
      [3, 4],
      [2, 3, 4, 5],
      [1, 2, 3, 4, 5, 6],
      [0, 1, 2, 3, 4, 5, 6, 7],
      [1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5],
      [3, 4],
    ];
    rows.forEach((cols, ry) => {
      cols.forEach(cx => {
        g.fillStyle(ry < 3 ? P.B_RED : P.CRIMSON, 1);
        g.fillRect(cx * px, ry * px, px, px);
      });
    });
    // bright highlight pixels
    g.fillStyle(P.WHITE, 0.85);
    g.fillRect(4 * px, 0,        px, px);
    g.fillRect(3 * px, 1 * px,   px, px);
    // dark bottom shadow
    g.fillStyle(P.MAROON, 0.7);
    g.fillRect(3 * px, 6 * px,   px, px);
    g.fillRect(4 * px, 6 * px,   px, px);

    g.generateTexture('ruby', 8 * px, 7 * px);
    g.destroy();
  }
}
