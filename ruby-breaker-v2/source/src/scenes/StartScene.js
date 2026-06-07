import Phaser from 'phaser';
import AudioManager from '../utils/AudioManager';
import StorageManager from '../utils/StorageManager';
import { GAME_W, GAME_H, P } from '../config/gameConfig';
import { COPY } from '../copy.js';

export default class StartScene extends Phaser.Scene {
  constructor() { super({ key: 'StartScene' }); }

  create() {
    AudioManager.init();

    const W = GAME_W, H = GAME_H;
    this.add.image(W / 2, H / 2, 'background');

    this.spawnFloatingGems(W, H);
    this.buildTitle(W);
    this.buildMascot(W, H);
    this.buildButtons(W, H);
    this.buildFooter(W, H);

    this.cameras.main.fadeIn(400, 0, 0, 0);
    AudioManager.playBGM();

    // mute button
    const muteBtn = this.add.text(W - 12, 12, '🔊', {
      fontSize: '22px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      const isMuted = AudioManager.toggleMute();
      muteBtn.setText(isMuted ? '🔇' : '🔊');
    });
  }

  buildTitle(W) {
    // soft light-blue radial glow behind the logo so it pops off the dark background
    const gw = 340;
    if (!this.textures.exists('logoGlow')) {
      const t = this.textures.createCanvas('logoGlow', gw, gw);
      const ctx = t.getContext();
      const rg = ctx.createRadialGradient(gw / 2, gw / 2, 0, gw / 2, gw / 2, gw / 2);
      rg.addColorStop(0,    'rgba(132,162,230,0.62)');
      rg.addColorStop(0.45, 'rgba(86,116,190,0.32)');
      rg.addColorStop(1,    'rgba(70,100,170,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, gw, gw);
      t.refresh();
    }
    this.add.image(W / 2, 140, 'logoGlow').setOrigin(0.5);

    const logo = this.add.image(W / 2, 150, 'game-logo').setOrigin(0.5).setScale(0.13);

    this.tweens.add({
      targets: [logo],
      y: '-=6',
      duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  buildMascot(W, H) {
    // pbot.png — 800×800 transparent PNG, display at ~220px wide
    const mascot = this.add.image(W / 2, H * 0.46, 'pbot').setScale(0.28);
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 14,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // sparkle around mascot
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => this.spawnSparkle(mascot.x + Phaser.Math.Between(-50, 50), mascot.y + Phaser.Math.Between(-50, 50)),
    });
  }

  spawnSparkle(x, y) {
    const colors = [P.B_RED, P.GOLD, P.WHITE, P.AMBER, P.BLUE_LT];
    const g = this.add.graphics();
    g.fillStyle(Phaser.Utils.Array.GetRandom(colors), 0.9);
    g.fillRect(-4, -4, 8, 8);
    g.setPosition(x, y);
    this.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 0, scaleY: 0,
      y: y - 30,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  buildButtons(W, H) {
    const by = H * 0.635;

    const playBtn = this.makeBtn(W / 2, by, COPY.start, P.B_RED, P.CRIMSON, 220, 52);
    playBtn.on('pointerdown', () => {
      AudioManager.play('click');
      AudioManager.stopBGM();
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start('GameScene', { level: 1, score: 0, lives: 3 }));
    });

    const howBtn = this.makeBtn(W / 2, by + 68, COPY.howToPlay, P.BLUE, P.BLUE_LT, 220, 46);
    howBtn.on('pointerdown', () => {
      AudioManager.play('click');
      this.showHowToPlay(W, H);
    });
  }

  makeBtn(x, y, label, col, hoverCol, w = 200, h = 46) {
    const container = this.add.container(x, y);

    const draw = (color) => {
      bg.clear();
      // pixel drop shadow
      bg.fillStyle(0x000000, 0.6);
      bg.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);
      // body
      bg.fillStyle(color, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);
      // top highlight bar
      bg.fillStyle(0xffffff, 0.22);
      bg.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 4);
      // bottom dark bar
      bg.fillStyle(0x000000, 0.25);
      bg.fillRect(-w / 2, h / 2 - 4, w, 4);
    };

    const bg = this.add.graphics();
    draw(col);

    const tx = this.add.text(0, 1, label, {
      fontSize: label.length > 10 ? '10px' : '12px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([bg, tx]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover',  () => { draw(hoverCol); this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 }); });
    container.on('pointerout',   () => { draw(col);      this.tweens.add({ targets: container, scaleX: 1,    scaleY: 1,    duration: 100 }); });
    container.on('pointerdown',  () => this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80 }));
    container.on('pointerup',    () => this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 80 }));

    return container;
  }

  buildFooter(W, H) {
    const hs = StorageManager.getHighScore();
    this.add.text(W / 2, H * 0.86, `${COPY.best}: ${hs.toLocaleString()}`, {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffc72c', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(W / 2, H - 16, 'JDP GAMES  v2.0', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#1e3aad',
    }).setOrigin(0.5);
  }

  spawnFloatingGems(W, H) {
    const colors = [P.B_RED, P.GOLD, P.BLUE, P.AMBER, P.CRIMSON, P.WHITE];
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(10, W - 10);
      const y = Phaser.Math.Between(0, H);
      const col = Phaser.Utils.Array.GetRandom(colors);
      const g = this.add.graphics();
      g.fillStyle(col, 0.55);
      g.fillRect(-3, -3, 6, 6);
      g.setPosition(x, y);

      this.tweens.add({
        targets: g,
        y: y - Phaser.Math.Between(120, 320),
        alpha: 0,
        duration: Phaser.Math.Between(2800, 5500),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: (tween, target) => {
          target.setPosition(Phaser.Math.Between(10, W - 10), H + 20);
          target.setAlpha(0.55);
        },
      });
    }
  }

  showHowToPlay(W, H) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82).setInteractive();
    const lines = COPY.howRows;

    const panel = this.add.container(W / 2, H / 2);
    const bg = this.add.graphics();
    bg.fillStyle(0x000011, 1);
    bg.fillRect(-195, -200, 390, 400);
    bg.lineStyle(3, 0xcc1222, 1);
    bg.strokeRect(-195, -200, 390, 400);
    bg.lineStyle(1, 0xffc72c, 0.4);
    bg.strokeRect(-191, -196, 382, 392);
    panel.add(bg);

    panel.add(this.add.text(0, -178, COPY.howToPlay, {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#ffc72c',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5));

    const sep = this.add.graphics();
    sep.lineStyle(1, 0xcc1222, 0.6);
    sep.lineBetween(-175, -155, 175, -155);
    panel.add(sep);

    lines.forEach(([key, val], i) => {
      const isHeader = i < 2;
      panel.add(this.add.text(-178, -140 + i * 30, key, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace',
        color: isHeader ? '#ffc72c' : '#00ffcc',
      }));
      panel.add(this.add.text(178, -140 + i * 30, val, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace',
        color: isHeader ? '#ffc72c' : '#ffffff',
      }).setOrigin(1, 0));
    });

    const closeBtn = this.add.text(0, 168, COPY.tapToClose, {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#cc1222',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { panel.destroy(); overlay.destroy(); });
    panel.add(closeBtn);
  }
}
