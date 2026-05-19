import { GAME, PALETTE, PALETTE_CSS, FONTS } from '../config.js';

const FLOOR_HEIGHT   = 80;
const HUD_HEIGHT     = 70;
const PBOT_SCALE     = 0.20;
const PBOT_START_X   = 130;
const PIPE_GAP       = 220;       // px between top and bottom pipe
const PIPE_MIN_TOP   = 90;        // min y for bottom edge of top pipe
const PIPE_MAX_TOP   = GAME.height - FLOOR_HEIGHT - PIPE_GAP - 60;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.score          = 0;
    this.started        = false;
    this.gameOver       = false;
    this.timeRemainingMs = GAME.roundDurationMs;
    this.elapsedMs      = 0;

    this._drawBackground();
    this._createFloorAndCeiling();
    this._createPbot();
    this._createGroups();
    this._createHud();
    this._createPrompt();
    this._bindInput();
  }

  update(_, deltaMs) {
    if (this.gameOver) return;

    if (this.started) {
      this.elapsedMs       += deltaMs;
      this.timeRemainingMs -= deltaMs;
      if (this.timeRemainingMs <= 0) {
        this.timeRemainingMs = 0;
        this._endRound('time');
      }
      this._updateHud();

      // tilt pbot toward velocity for a satisfying arc
      const vy = this.pbot.body.velocity.y;
      const target = Phaser.Math.Clamp(vy * 0.08, -25, 70);
      this.pbot.angle += (target - this.pbot.angle) * 0.1;

      // cleanup off-screen obstacles + rubies
      this.pipes.children.iterate((p) => {
        if (p && p.x < -100) p.destroy();
      });
      this.rubies.children.iterate((r) => {
        if (r && r.x < -40) r.destroy();
      });
    }
  }

  // ---------------------------------------------------------------------
  _drawBackground() {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, 'bg');
    const tex = this.textures.get('bg').getSourceImage();
    const scale = Math.max(width / tex.width, height / tex.height);
    bg.setScale(scale);

    // subtle dim so gameplay elements pop against the busy bg
    this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navy, 0.28);
  }

  _createFloorAndCeiling() {
    const { width, height } = this.scale;

    // visual floor band + frosty edge highlight
    this.floor = this.add.rectangle(width / 2, height - FLOOR_HEIGHT / 2,
      width, FLOOR_HEIGHT, PALETTE.navy, 0.55);
    this.add.rectangle(width / 2, height - FLOOR_HEIGHT, width, 4,
      PALETTE.yellow, 0.7);

    // give the floor visual a static physics body for collision
    this.physics.add.existing(this.floor, true);

    // invisible ceiling just to prevent pbot escaping up
    this.ceiling = this.add.rectangle(width / 2, -10, width, 20, 0x000000, 0);
    this.physics.add.existing(this.ceiling, true);
  }

  _createPbot() {
    this.pbot = this.physics.add.image(PBOT_START_X, this.scale.height * 0.45, 'pbot')
      .setScale(PBOT_SCALE);

    // tighter hitbox than the full sprite to keep collisions feeling fair
    // (pbot.png is 432x578; central body roughly fills the middle 70%).
    this.pbot.body.setSize(280, 380);
    this.pbot.body.setOffset(76, 90);
    this.pbot.body.setCollideWorldBounds(false);
    this.pbot.body.allowGravity = false; // turned on at first flap
  }

  _createGroups() {
    this.pipes  = this.physics.add.group({ allowGravity: false, immovable: true });
    this.rubies = this.physics.add.group({ allowGravity: false });

    this.physics.add.collider(this.pbot, this.pipes,   (_p, pillar) => this._onHitPillar(pillar));
    this.physics.add.collider(this.pbot, this.floor,   () => this._endRound('crash'));
    this.physics.add.collider(this.pbot, this.ceiling, () => this._endRound('crash'));
    this.physics.add.overlap (this.pbot, this.rubies,  (_p, r) => this._collectRuby(r));
  }

  _createHud() {
    const { width } = this.scale;

    // translucent HUD strip
    this.add.rectangle(width / 2, HUD_HEIGHT / 2, width, HUD_HEIGHT,
      PALETTE.navy, 0.65).setDepth(50);

    // ruby icon + count (left)
    this.add.image(28, HUD_HEIGHT / 2, 'ruby').setScale(0.9).setDepth(51);
    this.rubyText = this.add.text(50, HUD_HEIGHT / 2, '0', {
      fontFamily: FONTS.ui,
      fontSize:   '28px',
      fontStyle:  'bold',
      color:      PALETTE_CSS.yellow,
    }).setOrigin(0, 0.5).setDepth(51);

    // timer (right)
    this.add.text(width - 14, HUD_HEIGHT / 2 - 13, 'TIME', {
      fontFamily: FONTS.ui,
      fontSize:   '11px',
      color:      PALETTE_CSS.white,
    }).setOrigin(1, 0.5).setAlpha(0.7).setDepth(51);
    this.timeText = this.add.text(width - 14, HUD_HEIGHT / 2 + 8, '3:00', {
      fontFamily: FONTS.ui,
      fontSize:   '26px',
      fontStyle:  'bold',
      color:      PALETTE_CSS.yellow,
    }).setOrigin(1, 0.5).setDepth(51);
  }

  _updateHud() {
    this.rubyText.setText(String(this.score));

    const totalSec = Math.ceil(this.timeRemainingMs / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = (totalSec % 60).toString().padStart(2, '0');
    this.timeText.setText(`${mm}:${ss}`);
    this.timeText.setColor(totalSec <= 10 ? PALETTE_CSS.ruby : PALETTE_CSS.yellow);
  }

  _createPrompt() {
    const { width, height } = this.scale;
    this.promptContainer = this.add.container(width / 2, height * 0.65);

    const plaque = this.add.graphics();
    plaque.fillStyle(PALETTE.navy, 0.7);
    plaque.fillRoundedRect(-150, -40, 300, 80, 16);
    plaque.lineStyle(2, PALETTE.yellow, 0.7);
    plaque.strokeRoundedRect(-150, -40, 300, 80, 16);
    this.promptContainer.add(plaque);

    const heading = this.add.text(0, -14, 'TAP TO FLY', {
      fontFamily: FONTS.ui,
      fontSize:   '22px',
      fontStyle:  'bold',
      color:      PALETTE_CSS.yellow,
    }).setOrigin(0.5);
    const sub = this.add.text(0, 14, 'avoid obstacles  •  grab rubies', {
      fontFamily: FONTS.ui,
      fontSize:   '12px',
      color:      PALETTE_CSS.white,
    }).setOrigin(0.5).setAlpha(0.9);
    this.promptContainer.add([heading, sub]);

    this.tweens.add({
      targets: this.promptContainer,
      alpha: { from: 1, to: 0.55 },
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // gentle bob for pbot while waiting to start
    this.idleBob = this.tweens.add({
      targets: this.pbot,
      y: this.pbot.y - 14,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _bindInput() {
    this.input.on('pointerdown', () => this._handleInput());
    this.input.keyboard?.on('keydown-SPACE', () => this._handleInput());
    this.input.keyboard?.on('keydown-UP',    () => this._handleInput());
  }

  _handleInput() {
    if (this.gameOver) return;
    if (!this.started) this._startRound();
    this._flap();
  }

  _startRound() {
    this.started = true;
    if (this.idleBob) this.idleBob.stop();
    this.tweens.add({
      targets: this.promptContainer,
      alpha: 0, duration: 200,
      onComplete: () => this.promptContainer.destroy(),
    });

    this.pbot.body.allowGravity = true;
    this.physics.world.gravity.y = GAME.gravity;

    // start obstacle and ruby spawners
    this.pipeTimer = this.time.addEvent({
      delay: GAME.pipeSpawnEveryMs,
      loop:  true,
      callback: () => this._spawnPipePair(),
    });
    this.rubyTimer = this.time.addEvent({
      delay: GAME.rubySpawnEveryMs,
      loop:  true,
      callback: () => this._spawnSoloRuby(),
    });

    // first pair immediately so the player has something to dodge
    this._spawnPipePair();
  }

  _flap() {
    if (this.gameOver) return;
    this.pbot.body.setVelocityY(GAME.flapVelocity);
    // small squash for feel
    this.tweens.add({
      targets: this.pbot,
      scaleX: PBOT_SCALE * 1.08,
      scaleY: PBOT_SCALE * 0.92,
      duration: 80, yoyo: true, ease: 'Sine.easeOut',
    });
  }

  _spawnPipePair() {
    if (this.gameOver) return;
    const { width } = this.scale;
    const gapTop = Phaser.Math.Between(PIPE_MIN_TOP, PIPE_MAX_TOP);

    // Top pipe: a `pipe` texture (64x600) positioned so its bottom is gapTop
    const top = this.pipes.create(width + 40, gapTop, 'pipe')
      .setOrigin(0.5, 1)
      .setDepth(10);
    top.body.setVelocityX(-GAME.pipeSpeed);
    top.body.setAllowGravity(false);
    top.body.setImmovable(true);
    // hitbox matches visible texture
    top.body.setSize(64, 600);
    top.body.setOffset(0, 0);

    const bottom = this.pipes.create(width + 40, gapTop + PIPE_GAP, 'pipe')
      .setOrigin(0.5, 0)
      .setDepth(10);
    bottom.body.setVelocityX(-GAME.pipeSpeed);
    bottom.body.setAllowGravity(false);
    bottom.body.setImmovable(true);
    bottom.body.setSize(64, 600);
    bottom.body.setOffset(0, 0);

    // 60% chance of a ruby in the gap
    if (Math.random() < 0.6) {
      const rubyY = gapTop + PIPE_GAP / 2 + Phaser.Math.Between(-40, 40);
      this._spawnRubyAt(width + 40, rubyY);
    }
  }

  _spawnSoloRuby() {
    if (this.gameOver) return;
    const { width, height } = this.scale;
    const y = Phaser.Math.Between(
      HUD_HEIGHT + 60,
      height - FLOOR_HEIGHT - 60,
    );
    this._spawnRubyAt(width + 20, y);
  }

  _spawnRubyAt(x, y) {
    const ruby = this.rubies.create(x, y, 'ruby').setDepth(11);
    ruby.body.setVelocityX(-GAME.pipeSpeed);
    ruby.body.setAllowGravity(false);
    ruby.body.setCircle(18);
    this.tweens.add({
      targets: ruby,
      angle: 360,
      duration: 1600,
      repeat: -1,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: ruby,
      y: y - 8,
      duration: 900,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _collectRuby(ruby) {
    if (!ruby.active) return;
    this.score += GAME.rubyValue;
    // sparkle pop
    const pop = this.add.image(ruby.x, ruby.y, 'ruby').setDepth(20);
    this.tweens.add({
      targets: pop,
      scale: 2.2, alpha: 0,
      duration: 300, ease: 'Cubic.easeOut',
      onComplete: () => pop.destroy(),
    });
    // floating "+1"
    const plus = this.add.text(ruby.x, ruby.y, '+1', {
      fontFamily: FONTS.ui,
      fontSize:   '18px',
      fontStyle:  'bold',
      color:      PALETTE_CSS.yellow,
      stroke:     PALETTE_CSS.darkRed,
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(21);
    this.tweens.add({
      targets: plus,
      y: ruby.y - 40, alpha: 0,
      duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => plus.destroy(),
    });

    ruby.destroy();
  }

  _onHitPillar(pillar) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.sound.play('on-hit', { volume: 0.7 });

    this._freezeGameplay();
    this.pbot.body.enable = false;
    this.pbot.setDepth(150);

    const impactX = this.pbot.x;
    const impactY = this.pbot.y;

    // Phase 1 — instant impact: white flash + first shake
    this.cameras.main.flash(100, 255, 255, 255);
    this.cameras.main.shake(420, 0.018);

    // Phase 2 — pillar flashes white then cracks appear, then it shatters
    pillar.setTintFill(0xffffff);
    const pillarCracks = this._drawPillarCracks(pillar, impactX, impactY);
    this.time.delayedCall(120, () => {
      pillar.clearTint();
      pillarCracks.destroy();
      this._shatterPillar(pillar);
    });

    // Phase 3 — pbot flies toward the camera with an afterimage trail
    this.time.delayedCall(180, () => this._mascotFliesIntoScreen());

    // Phase 4 — full-screen glass cracks when pbot "hits the screen"
    this.time.delayedCall(880, () => {
      this.cameras.main.shake(520, 0.03);
      this._drawScreenCracks(this.scale.width / 2, this.scale.height / 2);
      this.pbot.setTintFill(0xffffff);
      this.time.delayedCall(90, () => this.pbot.setTint(0xff7766));
    });

    // Final hand-off
    this.time.delayedCall(1900, () => {
      this.scene.start('GameOverScene', {
        score:      this.score,
        timeUsedMs: this.elapsedMs,
        cause:      'crash',
      });
    });
  }

  _freezeGameplay() {
    if (this.pipeTimer) this.pipeTimer.remove();
    if (this.rubyTimer) this.rubyTimer.remove();
    this.pipes.children.iterate((p) => {
      if (p && p.body) p.body.setVelocity(0, 0);
    });
    this.rubies.children.iterate((r) => {
      if (r && r.body) r.body.setVelocity(0, 0);
    });
    this.physics.world.gravity.y = 0;
    if (this.pbot.body) {
      this.pbot.body.allowGravity = false;
      this.pbot.body.setVelocity(0, 0);
    }
  }

  _drawPillarCracks(pillar, impactX, impactY) {
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(2, PALETTE.white, 0.95);

    for (let i = 0; i < 5; i += 1) {
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const len   = Phaser.Math.Between(50, 110);
      g.beginPath();
      g.moveTo(impactX, impactY);
      const segs = 4;
      for (let s = 1; s <= segs; s += 1) {
        const t = s / segs;
        const x = impactX + Math.cos(angle) * len * t + Phaser.Math.Between(-7, 7);
        const y = impactY + Math.sin(angle) * len * t + Phaser.Math.Between(-7, 7);
        g.lineTo(x, y);
      }
      g.strokePath();
    }
    return g;
  }

  _shatterPillar(pillar) {
    const isTop = pillar.originY === 1;
    const px = pillar.x;
    const py = pillar.y;
    const pillarLen = 600;

    pillar.setVisible(false);
    if (pillar.body) pillar.body.enable = false;

    // 8 debris chunks spread along the original pillar extent
    for (let i = 0; i < 8; i += 1) {
      const along = Phaser.Math.FloatBetween(0, 1);
      const chunkY = isTop
        ? py - pillarLen * along
        : py + pillarLen * along;
      const chunkX = px + Phaser.Math.Between(-18, 18);

      const chunk = this.add.rectangle(
        chunkX, chunkY,
        Phaser.Math.Between(18, 32),
        Phaser.Math.Between(18, 32),
        PALETTE.royalBlue,
      ).setDepth(14);
      chunk.setStrokeStyle(1, PALETTE.navy);

      this.physics.add.existing(chunk);
      chunk.body.setVelocity(
        Phaser.Math.Between(-280, 280),
        Phaser.Math.Between(-420, -120),
      );
      chunk.body.setGravityY(900);
      chunk.body.setAngularVelocity(Phaser.Math.Between(-360, 360));

      this.tweens.add({
        targets: chunk,
        alpha: 0,
        delay: 700,
        duration: 600,
        onComplete: () => chunk.destroy(),
      });
    }

    // small icy puff at the original pillar's mid-band
    for (let i = 0; i < 14; i += 1) {
      const puff = this.add.image(px + Phaser.Math.Between(-30, 30),
                                  py + (isTop ? -50 : 50) + Phaser.Math.Between(-40, 40),
                                  'star')
        .setScale(Phaser.Math.FloatBetween(0.8, 2))
        .setTint(PALETTE.white)
        .setDepth(15);
      this.tweens.add({
        targets: puff,
        x: puff.x + Phaser.Math.Between(-120, 120),
        y: puff.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(500, 900),
        ease: 'Cubic.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
  }

  _mascotFliesIntoScreen() {
    const targetX = this.scale.width / 2;
    const targetY = this.scale.height / 2;
    const finalScale = PBOT_SCALE * 3.5; // ~0.7

    // afterimage trail — 7 fading copies along the path
    let i = 0;
    this.time.addEvent({
      delay: 55,
      repeat: 7,
      callback: () => {
        const trail = this.add.image(this.pbot.x, this.pbot.y, 'pbot')
          .setScale(this.pbot.scaleX)
          .setAngle(this.pbot.angle)
          .setAlpha(0.45)
          .setTint(PALETTE.ruby)
          .setDepth(149);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 350,
          onComplete: () => trail.destroy(),
        });
        i += 1;
      },
    });

    // the actual fly-in: scale up, rotate, drift to centre
    this.tweens.add({
      targets: this.pbot,
      x: targetX,
      y: targetY,
      scaleX: finalScale,
      scaleY: finalScale,
      angle: '+=540',
      duration: 700,
      ease: 'Cubic.easeOut',
    });
  }

  _drawScreenCracks(cx, cy) {
    const cracks = this.add.graphics().setDepth(200).setScrollFactor(0);

    // big radial cracks
    cracks.lineStyle(3, PALETTE.white, 0.95);
    const numMain = 12;
    for (let i = 0; i < numMain; i += 1) {
      const angle = (i / numMain) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.18, 0.18);
      const len   = Phaser.Math.Between(320, 560);
      cracks.beginPath();
      cracks.moveTo(cx, cy);
      const segs = 6;
      for (let s = 1; s <= segs; s += 1) {
        const t = s / segs;
        const x = cx + Math.cos(angle) * len * t + Phaser.Math.Between(-14, 14);
        const y = cy + Math.sin(angle) * len * t + Phaser.Math.Between(-14, 14);
        cracks.lineTo(x, y);
      }
      cracks.strokePath();

      // optional branch
      if (Math.random() < 0.55) {
        const branchT = Phaser.Math.FloatBetween(0.3, 0.7);
        const bx = cx + Math.cos(angle) * len * branchT;
        const by = cy + Math.sin(angle) * len * branchT;
        const ba = angle + Phaser.Math.FloatBetween(-1.2, 1.2);
        const bl = Phaser.Math.Between(60, 140);
        cracks.lineStyle(2, PALETTE.white, 0.8);
        cracks.beginPath();
        cracks.moveTo(bx, by);
        cracks.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl);
        cracks.strokePath();
        cracks.lineStyle(3, PALETTE.white, 0.95);
      }
    }

    // concentric impact rings
    cracks.lineStyle(4, PALETTE.white, 0.9);
    cracks.strokeCircle(cx, cy, 30);
    cracks.lineStyle(2, PALETTE.white, 0.5);
    cracks.strokeCircle(cx, cy, 56);

    // animate cracks fading in
    cracks.setAlpha(0);
    this.tweens.add({
      targets: cracks,
      alpha: 1,
      duration: 80,
      ease: 'Linear',
    });

    // dim the whole frame as cracks settle
    const dim = this.add.rectangle(this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, PALETTE.navy, 0)
      .setDepth(199).setScrollFactor(0);
    this.tweens.add({
      targets: dim,
      alpha: 0.35,
      duration: 600,
      delay: 300,
    });
  }

  _endRound(cause) {
    if (this.gameOver) return;
    this.gameOver = true;

    this._freezeGameplay();

    // brief death animation, then go to game over
    this.cameras.main.shake(220, 0.008);
    this.tweens.add({
      targets: this.pbot,
      angle: '+=30',
      alpha: 0.5,
      duration: 400,
      ease: 'Cubic.easeIn',
    });

    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score:      this.score,
        timeUsedMs: this.elapsedMs,
        cause,
      });
    });
  }
}
