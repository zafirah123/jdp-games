import Phaser from 'phaser';
import AudioManager from '../utils/AudioManager';
import StorageManager from '../utils/StorageManager';
import { GAME_W, GAME_H, P } from '../config/gameConfig';
import { COPY } from '../copy.js';
import { claimScore } from '../claimScore.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.won     = data.won     || false;
    this.timesUp = data.timesUp || false;
    this.score   = data.score   || 0;
    this.level   = data.level   || 1;
    this.isNew   = data.isNew   || false;
  }

  create() {
    const W = GAME_W, H = GAME_H;

    this.add.image(W / 2, H / 2, 'background');
    this.spawnCelebrationParticles(W, H);

    // pixel panel
    const panel = this.add.graphics();
    panel.fillStyle(0x000011, 0.96);
    panel.fillRect(W / 2 - 200, H / 2 - 280, 400, 540);
    panel.lineStyle(3, this.won ? P.GOLD : P.B_RED, 1);
    panel.strokeRect(W / 2 - 200, H / 2 - 280, 400, 540);
    panel.lineStyle(1, this.won ? P.AMBER : P.CRIMSON, 0.4);
    panel.strokeRect(W / 2 - 196, H / 2 - 276, 392, 532);

    // mascot
    const mascot = this.add.image(W / 2, H / 2 - 180, 'pbot').setScale(0.45);
    if (!this.won) mascot.setTint(0x6699cc); // blue-grey tint for sad state
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 12,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // result title — §6.4: TIME'S UP! only when the timer expired, GAME OVER
    // for any other end; VICTORY! is the game-specific cap-reached headline.
    const titleText  = this.won ? COPY.victory : this.timesUp ? COPY.timeUp : COPY.gameOver;
    const titleColor = this.won ? '#ffc72c' : this.timesUp ? '#f5a000' : '#cc1222';

    this.add.text(W / 2, H / 2 - 60, titleText, {
      fontSize: '20px', fontFamily: '"Press Start 2P", monospace',
      color: titleColor, stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // level reached
    this.add.text(W / 2, H / 2 - 22, COPY.levelReached(this.level), {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaff',
    }).setOrigin(0.5);

    // rubies collected label
    this.add.text(W / 2, H / 2 + 10, COPY.rubiesCollected, {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
    }).setOrigin(0.5);

    const scoreDisplay = this.add.text(W / 2, H / 2 + 40, '0', {
      fontSize: '36px', fontFamily: '"Press Start 2P", monospace',
      color: '#cc1222', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // animate count up
    const targetScore = this.score;
    let currentScore = 0;
    const steps = Math.min(targetScore, 60);
    const inc = Math.max(1, Math.ceil(targetScore / steps));
    this.time.addEvent({
      delay: 30,
      repeat: steps,
      callback: () => {
        currentScore = Math.min(currentScore + inc, targetScore);
        scoreDisplay.setText(String(currentScore));
      },
    });

    // high score indicator
    if (this.isNew && this.score > 0) {
      const newBest = this.add.text(W / 2, H / 2 + 106, COPY.newBest, {
        fontSize: '12px', fontFamily: '"Press Start 2P", monospace',
        color: '#ffc72c', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({ targets: newBest, scaleX: 1.08, scaleY: 1.08, duration: 500, yoyo: true, repeat: -1 });
    } else {
      const hs = StorageManager.getHighScore();
      this.add.text(W / 2, H / 2 + 106, `${COPY.best}  ${hs}`, {
        fontSize: '9px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
      }).setOrigin(0.5);
    }

    // Single end-of-game CTA (§6.5): CLAIM SCORE sends the player back to the
    // Pandai app via the callback flow. No in-game retry / main-menu button —
    // the player replays by relaunching from the app.
    const claimBtn = this.makeBtn(W / 2, H / 2 + 188, COPY.claimScore, P.B_RED, P.CRIMSON);
    claimBtn.on('pointerdown', () => {
      AudioManager.play('click');
      AudioManager.stopBGM();
      AudioManager.stopGameover();
      claimScore(this.score, {
        cause: this.won ? 'cap' : this.timesUp ? 'timeup' : 'gameover',
      });
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  makeBtn(x, y, label, col, hoverCol) {
    const W = 210, H = 50;
    const container = this.add.container(x, y);

    const draw = (color) => {
      bg.clear();
      bg.fillStyle(0x000000, 0.6);
      bg.fillRect(-W/2+3, -H/2+3, W, H);
      bg.fillStyle(color, 1);
      bg.fillRect(-W/2, -H/2, W, H);
      bg.fillStyle(0xffffff, 0.22);
      bg.fillRect(-W/2+2, -H/2+2, W-4, 4);
      bg.fillStyle(0x000000, 0.25);
      bg.fillRect(-W/2, H/2-4, W, 4);
    };

    const bg = this.add.graphics();
    draw(col);
    const tx = this.add.text(0, 1, label, {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([bg, tx]);
    container.setSize(W, H);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover',  () => { draw(hoverCol); this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 }); });
    container.on('pointerout',   () => { draw(col);      this.tweens.add({ targets: container, scaleX: 1,    scaleY: 1,    duration: 100 }); });
    container.on('pointerdown',  () => this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80 }));
    container.on('pointerup',    () => this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 80 }));

    return container;
  }

  spawnCelebrationParticles(W, H) {
    const colors = this.won
      ? [P.GOLD, P.AMBER, P.B_RED, P.BLUE, P.WHITE]
      : [P.D_RED, P.MAROON, P.NAVY];

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(-50, H);
      const col = Phaser.Utils.Array.GetRandom(colors);
      const g = this.add.graphics();
      g.fillStyle(col, 0.65);
      g.fillRect(-4, -4, 8, 8);
      g.setPosition(x, y);

      this.tweens.add({
        targets: g,
        y: y + Phaser.Math.Between(100, 300),
        x: x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 2500),
        repeat: -1,
        onRepeat: (tw, tgt) => {
          tgt.setPosition(Phaser.Math.Between(0, W), -30);
          tgt.setAlpha(0.65);
        },
      });
    }
  }
}
