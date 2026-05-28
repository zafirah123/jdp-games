// In-game pause button.
//
// Visual styling mirrors the mute button per DESIGN.md §5.11 — 44 px
// brick-red circle, dark-yellow border, light-yellow glyph — so the two
// HUD controls read as a matched pair. Only the glyph differs: two
// vertical bars (the universal pause icon).
//
// Color values are duplicated from muteButton.js rather than imported to
// keep that file's surface focused on the audio toggle; if a third HUD
// button shows up later, lift these into a shared `hudButtons.js`.

const BTN_BG     = 0x9E131F; // Brick Red
const BTN_BORDER = 0xFFB603; // Dark Yellow
const BTN_ICON   = 0xFFD633; // Light Yellow

// Adds a pause toggle at (x, y). `onPress` fires on every tap — the caller
// decides whether to pause, resume, or no-op. Returns the container with
// `hitRadius` attached so the scene's pointerdown handler can reliably
// hit-test by position (currentlyOver is unreliable on a fresh mobile tap;
// see GameScene._bindInput).
export function addPauseButton(scene, x, y, onPress) {
  const R     = 22;
  const HIT_R = 36; // circular tap radius — fully contains the visible R=22 circle

  const btn = scene.add.container(x, y).setDepth(1000).setScrollFactor(0);
  btn.hitRadius = HIT_R;

  const bg = scene.add.graphics();
  bg.fillStyle(BTN_BG, 1);
  bg.fillCircle(0, 0, R);
  bg.lineStyle(2, BTN_BORDER, 1);
  bg.strokeCircle(0, 0, R);
  btn.add(bg);

  // pause glyph — two rounded bars centred in a ~14×16 footprint
  const icon = scene.add.graphics();
  icon.fillStyle(BTN_ICON, 1);
  icon.fillRoundedRect(-7, -8, 5, 16, 1.5);
  icon.fillRoundedRect( 2, -8, 5, 16, 1.5);
  btn.add(icon);

  // Circular hit area concentric with the visible circle — guarantees the
  // tap zone tracks the icon exactly, so players never have to aim "off"
  // the logo to land a hit. The circle is centred at (HIT_R, HIT_R) because
  // Phaser's InputManager.pointWithinHitArea shifts the local pointer by
  // `displayOrigin` (= HIT_R for a Container with default origin 0.5 and
  // size 2*HIT_R) before calling the hit-area callback — so the shape's
  // local origin is at the bounds top-left, not the container's position.
  btn.setSize(HIT_R * 2, HIT_R * 2);
  btn.setInteractive(
    new Phaser.Geom.Circle(HIT_R, HIT_R, HIT_R),
    Phaser.Geom.Circle.Contains,
  );
  btn.on('pointerover', () => scene.input.setDefaultCursor('pointer'));
  btn.on('pointerout',  () => scene.input.setDefaultCursor('default'));
  btn.on('pointerdown', () => {
    scene.tweens.add({
      targets: btn, scale: 0.92, duration: 80, yoyo: true, ease: 'Sine.easeOut',
    });
    onPress();
  });

  return btn;
}
