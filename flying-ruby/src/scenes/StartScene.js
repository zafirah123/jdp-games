import { GAME, PALETTE, PALETTE_CSS, FONTS } from '../config.js';

export class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    const { width, height } = this.scale;

    this._drawBackground(width, height);
    this._drawTitle(width, height);
    this._drawMascot(width, height);
    this._drawPlayButton(width, height);
    this._drawFooter(width, height);
  }

  // ---------------------------------------------------------------------
  // Background — bg.png cover-fit + slight dark overlay so UI reads cleanly.
  _drawBackground(width, height) {
    const bg = this.add.image(width / 2, height / 2, 'bg');
    const tex = this.textures.get('bg').getSourceImage();
    const scale = Math.max(width / tex.width, height / tex.height);
    bg.setScale(scale);

    // dim layer so foreground text and buttons stay readable against the
    // detailed background art.
    this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navy, 0.35);

    // warm glow halo behind the title
    const glow = this.add.graphics();
    glow.fillStyle(PALETTE.orange, 0.22);
    glow.fillCircle(width / 2, height * 0.27, 200);
    glow.fillStyle(PALETTE.yellow, 0.14);
    glow.fillCircle(width / 2, height * 0.27, 130);
  }

  _drawTitle(width, height) {
    const cx = width / 2;
    const titleY = height * 0.22;

    // dark plaque behind the title so it sits cleanly on the busy bg
    const plaque = this.add.graphics();
    plaque.fillStyle(PALETTE.navy, 0.55);
    plaque.fillRoundedRect(cx - 180, titleY - 80, 360, 168, 20);

    const top = this.add.text(cx, titleY - 32, 'FLYING', {
      fontFamily: FONTS.ui,
      fontSize:   '52px',
      fontStyle:  'bold',
      color:      PALETTE_CSS.yellow,
      stroke:     PALETTE_CSS.darkRed,
      strokeThickness: 8,
    }).setOrigin(0.5);

    const bottom = this.add.text(cx, titleY + 32, 'RUBY', {
      fontFamily: FONTS.ui,
      fontSize:   '76px',
      fontStyle:  'bold',
      color:      PALETTE_CSS.ruby,
      stroke:     PALETTE_CSS.yellow,
      strokeThickness: 10,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [top, bottom],
      scale: { from: 1, to: 1.04 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(cx, titleY + 110, 'Tap to fly  •  Collect rubies  •  Beat 3:00', {
      fontFamily: FONTS.ui,
      fontSize:   '15px',
      color:      PALETTE_CSS.white,
    }).setOrigin(0.5).setAlpha(0.95);
  }

  // pbot mascot — central, bobs gently and tilts.
  _drawMascot(width, height) {
    const cx = width / 2;
    const my = height * 0.5;

    const pbot = this.add.image(cx, my, 'pbot').setScale(0.32);
    this.tweens.add({
      targets: pbot,
      y: my - 18,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: pbot,
      angle: { from: -6, to: 6 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // orbiting ruby teaser
    const ruby = this.add.image(cx + 100, my + 30, 'ruby').setScale(1.2);
    this.tweens.add({
      targets: ruby,
      x: cx - 100,
      y: my + 10,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: ruby,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  // PLAY button — Pandai Design System 1.5 "Start Game" Enabled Large.
  // Figma: https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ?node-id=1390-11
  _drawPlayButton(width, height) {
    const cx = width / 2;
    const by = height * 0.76;

    const SPEC = {
      W: 280,
      totalH: 64,
      innerH: 56,
      cornerOuter: 32,
      cornerInner: 28,
      // Enabled state colors (Figma node 1390:12)
      base:        0xde9d00,
      innerTop:    0xffe258,
      innerBot:    0xffba0a,
      innerBorder: 0xffd633,
      text:        '#de0909',
      iconL:       0xde0909,
      iconRTop:    0xfe0601,
      iconRBot:    0x00193b,
      iconRBorder: 0xffd633,
    };

    const btn = this.add.container(cx, by);

    // Outer "base" — the mustard shadow that gives the 3D look.
    const base = this.add.graphics();
    base.fillStyle(SPEC.base, 1);
    base.fillRoundedRect(-SPEC.W / 2, -SPEC.totalH / 2, SPEC.W, SPEC.totalH, SPEC.cornerOuter);
    btn.add(base);

    // Inner button — yellow vertical gradient, sits flush with the top of
    // the base so 8px of mustard is visible underneath as the "shadow".
    const innerTop = -SPEC.totalH / 2;
    const inner = this.add.graphics();
    inner.fillGradientStyle(
      SPEC.innerTop, SPEC.innerTop,
      SPEC.innerBot, SPEC.innerBot,
      1, 1, 1, 1,
    );
    inner.fillRoundedRect(-SPEC.W / 2, innerTop, SPEC.W, SPEC.innerH, SPEC.cornerInner);
    inner.lineStyle(1, SPEC.innerBorder, 1);
    inner.strokeRoundedRect(-SPEC.W / 2, innerTop, SPEC.W, SPEC.innerH, SPEC.cornerInner);
    btn.add(inner);

    // Inner content layout: [pad] [iconL 32] [text] [iconR 32] [pad]
    const innerCenterY = innerTop + SPEC.innerH / 2;
    const padX = 16;
    const iconSize = 32;
    const leftIconX  = -SPEC.W / 2 + padX + iconSize / 2;
    const rightIconX =  SPEC.W / 2 - padX - iconSize / 2;

    const leftIcon = this._drawBarChartIcon(SPEC.iconL, iconSize);
    leftIcon.setPosition(leftIconX, innerCenterY);
    btn.add(leftIcon);

    // Text centred between the two icons
    const textX = (leftIconX + iconSize / 2 + rightIconX - iconSize / 2) / 2;
    const label = this.add.text(textX, innerCenterY, 'Start Game', {
      fontFamily: '"Poppins", "Segoe UI", Tahoma, sans-serif',
      fontSize:   '28px',
      fontStyle:  'bold',
      color:      SPEC.text,
    }).setOrigin(0.5);
    btn.add(label);

    const rightIcon = this._drawArrowCircleIcon(
      SPEC.iconRTop, SPEC.iconRBot, SPEC.iconRBorder, iconSize,
    );
    rightIcon.setPosition(rightIconX, innerCenterY);
    btn.add(rightIcon);

    // Hit area
    btn.setSize(SPEC.W, SPEC.totalH);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(-SPEC.W / 2, -SPEC.totalH / 2, SPEC.W, SPEC.totalH),
      Phaser.Geom.Rectangle.Contains,
    );

    btn.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      this.tweens.add({ targets: btn, scale: 1.03, duration: 120, ease: 'Sine.easeOut' });
    });
    btn.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      this.tweens.add({ targets: btn, scale: 1.0, duration: 120, ease: 'Sine.easeOut' });
    });
    btn.on('pointerdown', () => {
      // Tactile press — shift the whole button down so the mustard base appears at top,
      // mirroring the Figma "Pressed" state's pt-[8px] flip.
      this.tweens.add({
        targets: btn,
        scale: 0.97,
        y: by + 4,
        duration: 80,
        yoyo: true,
        onComplete: () => this.scene.start('GameScene'),
      });
    });
  }

  _drawBarChartIcon(color, size) {
    const g = this.add.graphics();
    const barW = size * 0.18;
    const gap  = size * 0.07;
    const heights = [size * 0.45, size * 0.65, size * 0.85];
    g.fillStyle(color, 1);
    for (let i = 0; i < 3; i += 1) {
      const x = -size / 2 + size * 0.15 + i * (barW + gap);
      const h = heights[i];
      g.fillRect(x, size / 2 - h, barW, h);
    }
    return g;
  }

  _drawArrowCircleIcon(topColor, botColor, borderColor, size) {
    const r = size / 2;
    const g = this.add.graphics();
    g.fillGradientStyle(topColor, topColor, botColor, botColor, 1, 1, 1, 1);
    g.fillCircle(0, 0, r);
    g.lineStyle(1, borderColor, 1);
    g.strokeCircle(0, 0, r);
    // chevron right ›
    g.lineStyle(2.5, PALETTE.white, 1);
    g.beginPath();
    g.moveTo(-size * 0.12, -size * 0.20);
    g.lineTo( size * 0.14,  0);
    g.lineTo(-size * 0.12,  size * 0.20);
    g.strokePath();
    return g;
  }

  _drawFooter(width, height) {
    const minutes = Math.floor(GAME.roundDurationMs / 60000);
    const seconds = Math.floor((GAME.roundDurationMs % 60000) / 1000)
      .toString().padStart(2, '0');

    this.add.text(width / 2, height - 56, `Round time: ${minutes}:${seconds}`, {
      fontFamily: FONTS.ui,
      fontSize:   '13px',
      color:      PALETTE_CSS.yellow,
    }).setOrigin(0.5).setAlpha(0.9);

    this.add.text(width / 2, height - 32, 'Flying Ruby  •  Pandai JDP Games', {
      fontFamily: FONTS.ui,
      fontSize:   '11px',
      color:      PALETTE_CSS.white,
    }).setOrigin(0.5).setAlpha(0.55);
  }
}
