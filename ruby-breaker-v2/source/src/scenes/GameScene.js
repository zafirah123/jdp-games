import Phaser from 'phaser';
import AudioManager from '../utils/AudioManager';
import StorageManager from '../utils/StorageManager';
import {
  GAME_W, GAME_H,
  BRICK_W, BRICK_H, BRICK_PAD, BRICK_TOP, BRICK_LEFT,
  PADDLE_H, PADDLE_Y_OFF,
  BALL_RADIUS, BALL_BASE_SPEED, BALL_SPEED_LEVEL_INC,
  LIVES,
  P,
} from '../config/gameConfig';
import { LEVELS } from '../config/levels';
import { COPY } from '../copy.js';
import { claimScore } from '../claimScore.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ─── lifecycle ────────────────────────────────────────────────────

  init(data) {
    this.currentLevel   = data.level    || 1;
    this.score          = data.score    || 0;
    this.lives          = data.lives    !== undefined ? data.lives : LIVES;
    this.timeLeft       = data.timeLeft !== undefined ? data.timeLeft : 3 * 60 * 1000;

    this.balls         = [];
    this.rubies        = null;
    this.shieldChar    = null;
    this.shieldHitbox  = null;
    this.isLaunching   = true;
    this.gameActive    = true;
    this.paused        = false;
    this.pauseOverlay  = null;
    this.combo         = 0;
    this.paddleTargetX = GAME_W / 2;
    this._warned60     = false;
    this._warned30     = false;
    this._lastTickSec  = -1;
    this._waveBuilding = false;
  }

  create() {
    const W = GAME_W, H = GAME_H;

    this.add.image(W / 2, H / 2, 'background');
    this.drawBorder(W, H);

    // Playfield top sits at y=50 (below the HUD strip — see drawBorder's
    // divider). Shrink the world bounds so balls/rubies bounce off the
    // visible top edge instead of flying behind the HUD to y=0.
    this.physics.world.setBounds(0, 50, W, H - 50);
    // left / right / top bounce; bottom open so balls fall through
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.brickGroup = this.physics.add.staticGroup();
    this.rubies     = this.physics.add.group();

    this.buildLevel();
    this.createPaddle(W, H);
    this.buildPermanentShieldChar();   // visible mascot (no physics)
    this.buildShieldHitbox();          // invisible physics rectangle that does the actual catching
    this.buildHUD(W, H);
    this.spawnBall();
    this.spawnBall();
    this.setupInput(W, H);
    this.setupColliders();

    this.cameras.main.fadeIn(300, 0, 0, 0);
    AudioManager.playBGM();
  }

  update(time, delta) {
    if (!this.gameActive || this.paused) return;

    // smooth paddle toward pointer target
    this.paddle.x = Phaser.Math.Linear(this.paddle.x, this.paddleTargetX, 0.22);

    // shield character tracks paddle — recreate if something destroyed it
    if (!this.shieldChar || !this.shieldChar.displayList) {
      this.buildPermanentShieldChar();
    }
    this.shieldChar.x = this.paddle.x;
    this.shieldChar.setVisible(true);
    this.shieldChar.setAlpha(0.95);
    if (this.shieldHitbox) this.shieldHitbox.x = this.paddle.x;

    // keep stuck balls on mascot's top, spread apart so they don't overlap
    const resting = this.balls.filter(b => b.active && b.getData('onPaddle'));
    const restY = this.getRestY();
    resting.forEach((b, i, arr) => {
      const offset = arr.length > 1 ? (i - (arr.length - 1) / 2) * 16 : 0;
      b.setPosition(this.paddle.x + offset, restY);
    });

    // remove dead balls
    this.balls = this.balls.filter(b => {
      if (!b.active) return false;
      if (!b.getData('onPaddle') && b.y > GAME_H + 60) { b.destroy(); return false; }
      return true;
    });

    const flying = this.balls.filter(b => b.active && !b.getData('onPaddle'));

    flying.forEach(b => {
      this.normSpeed(b);
      this.preventFlat(b);
      if (b.body && (b.body.blocked.left || b.body.blocked.right || b.body.blocked.up)) {
        if (!b.getData('wallSfxCd')) {
          AudioManager.play('wall');
          b.setData('wallSfxCd', true);
          this.time.delayedCall(80, () => { if (b.active) b.setData('wallSfxCd', false); });
        }
      }
    });

    if (flying.length === 0 && !this.isLaunching) this.onBallLost();

    // countdown
    this.timeLeft -= delta;
    this.updateTimerHUD();

    const sec = Math.ceil(this.timeLeft / 1000);
    if (sec === 60 && !this._warned60) { this._warned60 = true; AudioManager.play('timeWarning'); }
    if (sec === 30 && !this._warned30) { this._warned30 = true; AudioManager.play('timeWarning'); }
    if (sec <= 10 && sec > 0 && this._lastTickSec !== sec) {
      this._lastTickSec = sec;
      AudioManager.play('timeCritical');
    }

    // Manual ruby-vs-shieldHitbox catch (replaces physics.add.overlap which
    // froze the page). Cheap O(N) bounds check; rubies are typically <30.
    if (this.shieldHitbox && this.shieldHitbox.body) {
      const hb = this.shieldHitbox.body;
      const left = hb.left, right = hb.right, top = hb.top, bottom = hb.bottom;
      this.rubies.getChildren().forEach(ruby => {
        if (!ruby.active || ruby.getData('caught')) return;
        if (ruby.x >= left && ruby.x <= right && ruby.y >= top && ruby.y <= bottom) {
          this.catchRuby(ruby);
        }
      });
    }

    // remove rubies that fell past the bottom
    this.rubies.getChildren().slice().forEach(r => {
      if (r.active && r.y > GAME_H + 40) r.destroy();
    });

    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endGame(false, true); return; }
    if (this.score >= 500)  { this.endGame(true); return; }

    // auto-rebuild wave when all bricks gone
    if (this.brickGroup.countActive() === 0 && !this._waveBuilding) this.nextWave();
  }

  // ─── scene building ───────────────────────────────────────────────

  /**
   * Pbot mascot — visible avatar only. Pure image, no physics. The physics
   * work is done by an invisible Rectangle (`shieldHitbox`) so we don't have
   * to deal with Phaser body-on-scaled-sprite quirks (setSize being reset by
   * preCalc when sprite scale changes, transparent texture areas being part
   * of the body, etc.). This image just follows paddle.x for visual purposes.
   */
  buildPermanentShieldChar() {
    const dispW  = 110;
    const scale  = dispW / 1664;
    const dispH  = 2224 * scale;
    const charY  = GAME_H - dispH / 2 + 20;
    this.shieldChar = this.add.image(this.paddle.x, charY, 'pbot-shield')
      .setScale(scale)
      .setDepth(18)
      .setAlpha(0.95);
  }

  /**
   * Invisible Rectangle GameObject with a dynamic immovable physics body —
   * the ACTUAL collision surface. Positioned and sized so its top edge sits
   * exactly at the visible "shield disc" top of the mascot artwork (world y
   * ≈ GAME_H-105; the mascot PNG has ~22 px transparent space above the
   * visible art, hence the offset from the texture's natural top).
   *
   * Width 110 = visible mascot width (so the catching range matches what the
   * player sees). Height 60 covers the visible shield/head area — large
   * enough to prevent fast-ball tunneling, small enough that balls can't get
   * trapped inside.
   */
  buildShieldHitbox() {
    const w = 110;
    const h = 60;
    const topY = GAME_H - 105;          // visible shield disc top
    const y = topY + h / 2;             // Rectangle origin is center
    this.shieldHitbox = this.add.rectangle(this.paddle.x, y, w, h, 0x000000, 0);
    this.physics.add.existing(this.shieldHitbox);
    this.shieldHitbox.body.setImmovable(true);
    this.shieldHitbox.body.setAllowGravity(false);
  }

  drawBorder(W, H) {
    const g = this.add.graphics();
    // Red border wraps the PLAYFIELD (below the HUD), matching the world
    // bounds set in create() so it visually reads as the wall the ball
    // bounces off.
    g.lineStyle(1.5, 0xDC143C, 0.45);
    g.strokeRect(1, 50, W - 2, H - 51);
  }

  buildLevel() {
    const idx    = (this.currentLevel - 1) % LEVELS.length;
    const layout = LEVELS[idx];
    this.totalBricks = 0;

    layout.forEach((row, ri) => {
      row.forEach((t, ci) => {
        if (t === 0) return;
        const x   = BRICK_LEFT + ci * (BRICK_W + BRICK_PAD) + BRICK_W / 2;
        const y   = BRICK_TOP  + ri * (BRICK_H + BRICK_PAD) + BRICK_H / 2;
        const key = t === 9 ? 'brick_9' : `brick_${Math.min(t, 5)}`;
        const brick = this.brickGroup.create(x, y, key);
        brick.setData('hp',    t === 9 ? Infinity : t);
        brick.setData('maxHp', t === 9 ? Infinity : t);
        brick.setData('type',  t);
        brick.refreshBody();
        if (t !== 9) this.totalBricks++;
      });
    });

    this.remainingBricks = this.totalBricks;
  }

  createPaddle(W, H) {
    // Paddle is invisible AND has no active physics — the pbot-shield mascot
    // takes over both roles. We still create the paddle GameObject because
    // `paddle.x` is the pointer-following target that the mascot tracks each
    // frame (kept for backward compatibility with the rest of the code).
    this.paddle = this.physics.add.image(W / 2, H - PADDLE_Y_OFF, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.body.allowGravity = false;
    this.paddle.setCollideWorldBounds(true);
    this.paddle.setVisible(false);
    this.paddle.body.enable = false;
  }

  spawnBall(x, y, vx, vy) {
    const bx = x !== undefined ? x : this.paddle.x;
    const by = y !== undefined ? y : this.getRestY();

    const ball = this.physics.add.image(bx, by, 'ball');
    ball.setScale(0.7);                                   // -30% sphere
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.body.setSize(ball.width * 0.7, ball.height * 0.7, true);
    ball.body.allowGravity = false;
    ball.setData('speed',    BALL_BASE_SPEED + (this.currentLevel - 1) * BALL_SPEED_LEVEL_INC);
    ball.setData('onPaddle', vx === undefined);

    if (vx !== undefined) ball.setVelocity(vx, vy);
    else ball.setVelocity(0, 0);

    this.physics.add.collider(
      ball,
      this.shieldHitbox,
      (b, h) => this.onPaddleHit(b, h),
      (b) => b.body.velocity.y > 0,   // only collide when moving DOWN
    );
    this.physics.add.collider(ball, this.brickGroup, (b, br) => this.onBrickHit(b, br));

    this.balls.push(ball);
    this.updateBallHUD();
    return ball;
  }

  buildHUD(W, H) {
    const PH = 50;   // HUD panel height — matches the world top bound at y=50

    // ── top panel ── navy base with a faint lighter band (fake gradient),
    // a bright top highlight, and a bold red+gold bottom accent that lines up
    // with the red playfield border drawn in drawBorder() (also at y=50).
    const panel = this.add.graphics().setDepth(15);
    panel.fillStyle(P.NAVY, 1);          panel.fillRect(0, 0, W, PH);
    panel.fillStyle(P.BLUE, 0.16);       panel.fillRect(0, PH / 2, W, PH / 2);
    panel.fillStyle(P.BLUE_LT, 0.55);    panel.fillRect(0, 0, W, 2);
    panel.fillStyle(P.B_RED, 1);         panel.fillRect(0, PH - 3, W, 3);
    panel.fillStyle(P.GOLD, 0.9);        panel.fillRect(0, PH - 4, W, 1);

    // rounded "chip" backgrounds so each stat reads as its own grouped pill
    const chip = (x, y, w, h, fill, border) => {
      panel.fillStyle(fill, 0.92);
      panel.fillRoundedRect(x, y, w, h, 7);
      panel.lineStyle(1.5, border, 0.95);
      panel.strokeRoundedRect(x, y, w, h, 7);
    };
    chip(6, 7, 140, 36, P.MAROON, P.GOLD);     // RUBY (currency)
    chip(150, 7, 84, 36, 0x10204a, P.BLUE_LT); // ROUND
    chip(238, 7, 98, 36, 0x10204a, P.BLUE_LT); // TIME

    // ── RUBY chip ── gem icon + the one HUD number (gold/white, big)
    this.add.image(26, 25, 'ruby').setScale(1.4).setDepth(16);
    this.add.text(46, 12, 'RUBY', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#ffc72c',
    }).setDepth(16);
    this.scoreTx = this.add.text(46, 24, '0', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setDepth(16);

    // ── ROUND chip ── label + number
    const roundCx = 150 + 84 / 2;
    this.add.text(roundCx, 12, 'ROUND', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#aaccff',
    }).setOrigin(0.5, 0).setDepth(16);
    this.levelTx = this.add.text(roundCx, 23, `${this.currentLevel}`, {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(16);

    // ── TIME chip ── separate column on the right
    const timeCx = 238 + 98 / 2;
    this.add.text(timeCx, 12, 'TIME', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#aaccff',
    }).setOrigin(0.5, 0).setDepth(16);
    this.timerTx = this.add.text(timeCx, 23, '3:00', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffc72c', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(16);

    // lives — heart emojis, on the same row as the control buttons (right)
    this.livesTx = this.add.text(W - 90, 25, '', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace',
    }).setOrigin(1, 0.5).setDepth(40);
    this.refreshLivesHUD();

    this.comboTx = this.add.text(W / 2, H / 2, '', {
      fontSize: '22px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffc72c', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    this.ballCountTx = this.add.text(W - 10, H - 14, '', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaff',
    }).setOrigin(1, 1).setDepth(20);

    this.buildControls(W);
  }

  // Top-right HUD controls: pause (opens CONTINUE / EXIT & CLAIM overlay) and
  // mute, drawn as cute gold-rimmed circles with a glossy highlight. Both sit
  // on one row with the heart-lives readout so the corner isn't crowded. Each
  // emoji gets generous tap padding so it clears the §0.2 44px target.
  buildControls(W) {
    const cy = 25, r = 15;
    const pauseCx = W - 62, muteCx = W - 24;

    const g = this.add.graphics().setDepth(39);
    const circle = (cx) => {
      g.fillStyle(P.BLUE, 1);          g.fillCircle(cx, cy, r);
      g.lineStyle(2, P.GOLD, 1);       g.strokeCircle(cx, cy, r);
      g.fillStyle(0xffffff, 0.28);     g.fillCircle(cx - 4, cy - 5, 4); // gloss
    };
    circle(pauseCx);
    circle(muteCx);

    // pause / early-end button (§6.5 — players must be able to end early)
    this.pauseBtn = this.add.text(pauseCx, cy, '⏸', { fontSize: '15px' })
      .setOrigin(0.5).setDepth(40).setPadding(12)
      .setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerdown', (p, x, y, e) => {
      e?.stopPropagation?.();
      this.tweens.add({ targets: this.pauseBtn, scale: 0.85, duration: 70, yoyo: true });
      this._togglePause();
    });

    // mute toggle — visible whenever the game can make sound (§6.3)
    this.muteBtn = this.add.text(muteCx, cy, AudioManager.isMuted() ? '🔇' : '🔊', { fontSize: '15px' })
      .setOrigin(0.5).setDepth(40).setPadding(12)
      .setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', (p, x, y, e) => {
      e?.stopPropagation?.();
      this.tweens.add({ targets: this.muteBtn, scale: 0.85, duration: 70, yoyo: true });
      const isMuted = AudioManager.toggleMute();
      this.muteBtn.setText(isMuted ? '🔇' : '🔊');
    });
  }

  // ─── pause / early-end ────────────────────────────────────────────
  // The pause button opens a small modal: CONTINUE (resume the round) or
  // EXIT & CLAIM (submit the current score via the §6.5 claimScore flow).

  _togglePause() {
    if (!this.gameActive) return;
    if (this.paused) this._resumeRound();
    else             this._pauseRound();
  }

  _pauseRound() {
    if (this.paused) return;
    this.paused = true;
    this.physics.pause();
    this.time.paused = true;          // freeze delayedCalls while paused
    AudioManager.stopBGM();
    this._showPauseOverlay();
  }

  _resumeRound() {
    if (!this.paused) return;
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    this.paused = false;
    this.physics.resume();
    this.time.paused = false;
    AudioManager.playBGM();
  }

  _showPauseOverlay() {
    const W = GAME_W, H = GAME_H;
    const cx = W / 2, cy = H / 2;
    const c = this.add.container(0, 0).setDepth(60);

    // scrim — interactive so taps don't fall through to gameplay
    c.add(this.add.rectangle(cx, cy, W, H, 0x000011, 0.82).setInteractive());

    const pw = 360, ph = 300;
    const bg = this.add.graphics();
    bg.fillStyle(0x000011, 0.98);
    bg.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
    bg.lineStyle(3, P.GOLD, 1);
    bg.strokeRect(cx - pw / 2, cy - ph / 2, pw, ph);
    bg.lineStyle(1, P.AMBER, 0.4);
    bg.strokeRect(cx - pw / 2 + 4, cy - ph / 2 + 4, pw - 8, ph - 8);
    c.add(bg);

    c.add(this.add.text(cx, cy - 110, COPY.paused, {
      fontSize: '20px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffc72c', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5));

    c.add(this.add.text(cx, cy - 64, COPY.pauseSub, {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff', align: 'center', wordWrap: { width: pw - 50 },
    }).setOrigin(0.5).setAlpha(0.85));

    // CONTINUE — primary
    c.add(this._pauseBtn(cx, cy + 2, COPY.resumeBtn, P.B_RED, P.CRIMSON,
      () => this._resumeRound()));

    // EXIT & CLAIM — submits current score through the §6.5 callback
    c.add(this._pauseBtn(cx, cy + 70, COPY.endRunBtn, P.BLUE, P.BLUE_LT, () => {
      this.gameActive = false;
      StorageManager.saveHighScore(this.score);
      AudioManager.play('click');
      claimScore(this.score, {
        cause:      'early',
        timeUsedMs: 3 * 60 * 1000 - this.timeLeft,
      });
    }));

    this.pauseOverlay = c;
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 150, ease: 'Sine.easeOut' });
  }

  _pauseBtn(x, y, label, col, hoverCol, onClick) {
    const w = 240, h = 50;
    const container = this.add.container(x, y);
    const draw = (color) => {
      bg.clear();
      bg.fillStyle(0x000000, 0.6); bg.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);
      bg.fillStyle(color, 1);       bg.fillRect(-w / 2, -h / 2, w, h);
      bg.fillStyle(0xffffff, 0.22); bg.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 4);
      bg.fillStyle(0x000000, 0.25); bg.fillRect(-w / 2, h / 2 - 4, w, 4);
    };
    const bg = this.add.graphics();
    draw(col);
    const tx = this.add.text(0, 1, label, {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add([bg, tx]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => draw(hoverCol));
    container.on('pointerout',  () => draw(col));
    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true,
        onComplete: () => onClick && onClick(),
      });
    });
    return container;
  }

  setupInput(W) {
    this.input.on('pointermove', pointer => {
      if (!this.gameActive || this.paused) return;
      const hw = this.getPaddleHalfW();
      this.paddleTargetX = Phaser.Math.Clamp(pointer.x, hw, W - hw);
    });

    this.input.on('pointerdown', (pointer) => {
      if (!this.gameActive || this.paused) return;
      if (this._overControl(pointer)) return;   // ignore taps on pause / mute
      if (this.isLaunching) this.launchAll();
    });
  }

  // True when the pointer is over the pause or mute HUD button — used to
  // stop a control tap from also launching the ball (the scene-level
  // pointerdown fires independently of the buttons' own handlers).
  _overControl(pointer) {
    const hit = (btn) => btn &&
      Phaser.Geom.Rectangle.Contains(btn.getBounds(), pointer.x, pointer.y);
    return hit(this.pauseBtn) || hit(this.muteBtn);
  }

  setupColliders() {
    // Ruby catching is done MANUALLY in update() via a bounds check against
    // the shieldHitbox, NOT via physics.add.overlap. Phaser's overlap
    // detection between the rubies group and this Rectangle hitbox was
    // consistently freezing the page when multiple rubies entered the hitbox
    // at once (even with active/body.enable/caught guards in catchRuby — the
    // freeze persisted, suggesting the issue is inside Phaser's overlap loop
    // itself, not in our callback). Manual O(N) bounds check is cheap.
  }

  /**
   * Y position where balls rest visually on the mascot. Hardcoded to sit
   * just above the shieldHitbox top (world y GAME_H-105 = visible shield
   * disc top), 8 px = ball body half (7) + 1 px clearance.
   */
  getRestY() {
    return GAME_H - 113;
  }

  // ─── game logic ───────────────────────────────────────────────────

  launchAll() {
    this.balls.forEach(b => {
      if (b.active && b.getData('onPaddle')) {
        const angle = Phaser.Math.DegToRad(-70 + Phaser.Math.Between(-15, 15));
        const speed = b.getData('speed');
        b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        b.setData('onPaddle', false);
      }
    });
    this.isLaunching = false;
    AudioManager.play('launch');
    this.updateBallHUD();
  }

  onPaddleHit(ball, paddle) {
    AudioManager.play('paddle');
    const relX  = Phaser.Math.Clamp((ball.x - paddle.x) / this.getPaddleHalfW(), -1, 1);
    const rad   = Phaser.Math.DegToRad(relX * 65);
    const speed = ball.getData('speed');
    ball.setVelocity(Math.sin(rad) * speed, -Math.abs(Math.cos(rad) * speed));
    // (removed alpha tween — paddle/hitbox is invisible, mascot.alpha is reset
    //  every frame in update() so any tween here would be overridden anyway)
  }

  onBrickHit(ball, brick) {
    if (brick.getData('hp') === Infinity || !brick.active) return;
    this.damageBrick(brick, 1);
    this.combo++;
    this.showCombo(this.getComboMult());
  }

  damageBrick(brick, dmg) {
    if (brick.getData('hp') === Infinity) return;
    const newHp = brick.getData('hp') - dmg;
    if (newHp <= 0) {
      this.breakBrick(brick);
    } else {
      brick.setData('hp', newHp);
      this.tweens.add({ targets: brick, alpha: 0.6, duration: 60, yoyo: true });
      AudioManager.play('hit');
    }
  }

  breakBrick(brick) {
    if (!brick.active) return;
    const x    = brick.x;
    const y    = brick.y;
    const type = brick.getData('type');
    AudioManager.play('break');
    if (type !== 9) this.dropRubies(x, y);
    brick.destroy();
    this.remainingBricks = Math.max(0, this.remainingBricks - 1);
  }

  onBallLost() {
    this.lives--;
    // Skip the descending "life" arpeggio on the final ball so it doesn't
    // bleed into pacman-die.mp3 — only pacman-die should be heard on the
    // run-ending death.
    if (this.lives > 0) AudioManager.play('life');
    this.cameras.main.shake(220, 0.012);
    this.refreshLivesHUD();
    this.combo = 0;

    // clear falling rubies so they don't pile up before relaunch
    this.rubies.clear(false, true);

    if (this.lives <= 0) {
      // Cut BGM now (rather than waiting for endGame's stopBGM in 500 ms) so
      // the half-second pause before the game-over scene is silent — clean
      // hand-off to pacman-die.
      AudioManager.stopBGM();
      this.time.delayedCall(500, () => this.endGame(false));
    } else {
      this.spawnBall();
      this.spawnBall();
      this.isLaunching = true;

      const msg = this.add.text(GAME_W / 2, GAME_H / 2,
        COPY.lifeLeft(this.lives), {
          fontSize: '14px', fontFamily: '"Press Start 2P", monospace',
          color: '#ff4466', stroke: '#000', strokeThickness: 4, align: 'center',
        }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: msg, alpha: 0, delay: 1800, duration: 400, onComplete: () => msg.destroy() });
    }
  }

  nextWave() {
    if (!this.gameActive || this._waveBuilding) return;
    this._waveBuilding = true;

    AudioManager.play('win');
    this.cameras.main.flash(300, 255, 200, 0);

    this.currentLevel++;
    this.levelTx.setText(`${this.currentLevel}`);

    // destroy flying balls first so they can't instantly kill new bricks
    this.balls.forEach(b => { if (b.active) b.destroy(); });
    this.balls = [];

    this.rubies.clear(false, true);
    this.brickGroup.clear(true, true);
    this.buildLevel();

    this.spawnBall();
    this.spawnBall();
    this.isLaunching  = true;
    this._waveBuilding = false;
  }

  endGame(won, timesUp = false) {
    this.gameActive = false;
    StorageManager.saveHighScore(this.score);
    AudioManager.stopBGM();
    AudioManager.play(won ? 'win' : 'gameover');
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      this.scene.start('GameOverScene', {
        won, timesUp,
        score: this.score,
        level: this.currentLevel,
        isNew: StorageManager.getHighScore() === this.score,
      });
    });
  }

  // ─── ruby mechanics ───────────────────────────────────────────────

  // drop a number of rubies equal to the current combo multiplier
  dropRubies(x, y) {
    const n = this.getComboMult();
    for (let i = 0; i < n; i++) this.dropRuby(x, y);
  }

  dropRuby(x, y) {
    const ruby = this.rubies.create(x, y, 'ruby');
    ruby.setData('caught', false);   // reset, since group.create may reuse a previously caught ruby
    ruby.body.allowGravity = true;
    ruby.body.setGravityY(160);
    ruby.setVelocityX(Phaser.Math.Between(-40, 40));
    // bounce off side/top walls like the ball; the shieldHitbox catches any
    // ruby that slips past via overlap → catchRuby
    ruby.setCollideWorldBounds(true);
    ruby.setBounce(0.7, 0.7);
    ruby.setDepth(10);
    this.tweens.add({ targets: ruby, scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true });
  }

  catchRuby(ruby) {
    // Triple guard: bail if ruby is already inactive, already caught (flag),
    // or its body is disabled. Phaser's overlap can fire multiple times for
    // the same pair before `disableBody` propagates; without these guards
    // each "catch" would spawn another 5 particles + audio node, eventually
    // freezing the page when many rubies arrive in quick succession.
    if (!ruby.active) return;
    if (!ruby.body || !ruby.body.enable) return;
    if (ruby.getData('caught')) return;
    ruby.setData('caught', true);

    const x = ruby.x, y = ruby.y;
    ruby.disableBody(true, true);
    AudioManager.play('hit');
    // catching rubies builds the combo; the multiplier scales the points earned
    this.combo++;
    const mult = this.getComboMult();
    this.addScore(mult);
    this.showCombo(mult);
    this.spawnCatchEffect(x, y, mult);
  }

  spawnCatchEffect(x, y, score = 1) {
    const colors = [P.B_RED, P.CRIMSON, P.GOLD, P.WHITE];
    for (let i = 0; i < 5; i++) {
      const g = this.add.graphics().setDepth(25);
      g.fillStyle(Phaser.Utils.Array.GetRandom(colors), 1);
      g.fillRect(-3, -3, 6, 6);
      g.setPosition(x + Phaser.Math.Between(-10, 10), y);
      this.tweens.add({
        targets: g,
        y: y - Phaser.Math.Between(30, 60),
        x: g.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: Phaser.Math.Between(350, 600),
        onComplete: () => g.destroy(),
      });
    }
    const tx = this.add.text(x, y - 10, `+${score}`, {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffc72c', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(26);
    this.tweens.add({ targets: tx, y: y - 45, alpha: 0, duration: 600, onComplete: () => tx.destroy() });
  }

  // ─── helpers ──────────────────────────────────────────────────────

  normSpeed(ball) {
    if (!ball.body) return;
    const vx  = ball.body.velocity.x;
    const vy  = ball.body.velocity.y;
    const spd = ball.getData('speed') || BALL_BASE_SPEED;
    const cur = Math.sqrt(vx * vx + vy * vy);
    if (cur < 20) { ball.setVelocity(spd * 0.6, -spd * 0.8); return; }
    const diff = spd / cur;
    if (Math.abs(diff - 1) > 0.05) ball.setVelocity(vx * diff, vy * diff);
  }

  preventFlat(ball) {
    if (!ball.body) return;
    const vy  = ball.body.velocity.y;
    const spd = ball.getData('speed') || BALL_BASE_SPEED;
    if (Math.abs(vy) < spd * 0.15) {
      ball.setVelocityY((vy < 0 ? -1 : 1) * spd * 0.25);
    }
  }

  getPaddleHalfW() { return this.paddle.displayWidth / 2; }

  addScore(pts) {
    this.score = Math.min(500, this.score + Math.round(pts));
    this.scoreTx.setText(String(this.score));
  }

  getComboMult() {
    return this.combo < 3 ? 1 : 2;
  }

  showCombo(mult) {
    if (mult < 2) return;
    AudioManager.play('combo');
    this.tweens.killTweensOf(this.comboTx);
    this.comboTx.setText(`x${mult} COMBO!`);
    this.comboTx.setAlpha(1).setScale(1);
    this.tweens.add({
      targets: this.comboTx,
      alpha: 0, scaleX: 1.4, scaleY: 1.4,
      y: GAME_H / 2 - 80,
      duration: 900, ease: 'Quad.easeOut',
      onComplete: () => this.comboTx.setY(GAME_H / 2),
    });
  }

  // ─── HUD refreshers ───────────────────────────────────────────────

  refreshLivesHUD() {
    const n = Math.max(0, this.lives);
    // heart emojis read cuter than "HP:n"; collapse to ❤️×N past 5 so the
    // row never overflows when an EXTRA LIFE powerup stacks lives high.
    this.livesTx.setText(n > 5 ? `❤️×${n}` : '❤️'.repeat(n));
  }

  updateBallHUD() {
    const count = this.balls.filter(b => b.active).length;
    this.ballCountTx.setText(count > 1 ? `● ×${count}` : '');
  }

  updateTimerHUD() {
    const totalSec = Math.ceil(this.timeLeft / 1000);
    const m   = Math.floor(totalSec / 60);
    const s   = totalSec % 60;
    this.timerTx.setText(`${m}:${String(s).padStart(2, '0')}`);
    if      (totalSec <= 30) this.timerTx.setColor(totalSec % 2 === 0 ? '#ff3333' : '#ffc72c');
    else if (totalSec <= 60) this.timerTx.setColor('#f5a000');
    else                     this.timerTx.setColor('#ffc72c');
  }
}
