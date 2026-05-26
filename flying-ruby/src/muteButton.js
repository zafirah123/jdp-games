// Shared mute toggle.
//
// State handling: Phaser's WebAudio `sound.mute` getter is unreliable (it
// reads a gain-node value back), so we never read it — we track the state
// ourselves. localStorage persists it across reloads when available, but a
// module-level `muteState` is the in-session source of truth: sandboxed
// webviews (e.g. VS Code's Simple Browser) and private mode make
// localStorage *throw*, so every access is guarded.

const MUTE_KEY = 'flying-ruby:muted';

// in-session source of truth; mirrors localStorage when that is available
let muteState = false;

// Refresh muteState from localStorage. If storage is unavailable the call
// throws — we swallow it and keep whatever muteState already held.
function loadMuteState() {
  try { muteState = window.localStorage.getItem(MUTE_KEY) === '1'; }
  catch { /* storage blocked — keep the in-memory value */ }
  return muteState;
}

export function isMuted() {
  return muteState;
}

function setMuted(scene, muted) {
  muteState = muted;
  try { window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); }
  catch { /* storage blocked — state still held in memory for the session */ }
  scene.sound.mute = muted; // write-only — drives the master gain node
}

// Sync the game's global sound manager with the saved preference.
export function applyMutePreference(scene) {
  scene.sound.mute = loadMuteState();
}

// Audio toggle — DESIGN.md §5.11. Canonical look: 44 px circle, brick-red
// fill, dark-yellow border, light-yellow icon. Hard-coded hex values match
// the JDP 2026 design tokens (not Flying Ruby's legacy palette) so the
// button looks identical across every game.
const MUTE_BG     = 0x9E131F; // Brick Red
const MUTE_BORDER = 0xFFB603; // Dark Yellow
const MUTE_ICON   = 0xFFD633; // Light Yellow

// Adds a speaker on/off toggle at (x, y). The tap target is padded well
// beyond the icon so it is easy to hit with a mouse or finger. Returns the
// button container with `hitRadius` attached so scenes can do their own
// position-based tests (currentlyOver can be empty on a fresh mobile tap).
export function addMuteButton(scene, x, y) {
  scene.sound.mute = loadMuteState();

  const R = 22;       // visual background radius (44 px diameter — §5.11)
  const HIT_R = 38;   // generous tap radius — beats finger-sized touches

  const btn = scene.add.container(x, y).setDepth(1000).setScrollFactor(0);
  btn.hitRadius = HIT_R; // exposed so scenes can hit-test by pointer position

  const bg = scene.add.graphics();
  bg.fillStyle(MUTE_BG, 1);
  bg.fillCircle(0, 0, R);
  bg.lineStyle(2, MUTE_BORDER, 1);
  bg.strokeCircle(0, 0, R);
  btn.add(bg);

  // Icon — vertices traced from the JDP 2048 mute SVG (viewBox 0 0 24 24,
  // centred on 12,12) so every JDP game shows the same speaker shape.
  // Speaker body + cone, always shown.
  const speaker = scene.add.graphics();
  speaker.fillStyle(MUTE_ICON, 1);
  speaker.fillPoints([
    { x: -9, y: -3 }, { x: -5, y: -3 }, { x: 0, y: -7 },
    { x:  0, y:  7 }, { x: -5, y:  3 }, { x: -9, y: 3 },
  ], true);
  btn.add(speaker);

  // Sound waves — two arcs on the right, shown when NOT muted
  const waves = scene.add.graphics();
  waves.lineStyle(2, MUTE_ICON, 1);
  waves.beginPath(); waves.arc(2, 0, 4.5, -1.1,  1.1 ); waves.strokePath();
  waves.beginPath(); waves.arc(2, 0, 8,   -0.95, 0.95); waves.strokePath();
  btn.add(waves);

  // "x" — shown when muted. Strokes through the wave area.
  const cross = scene.add.graphics();
  cross.lineStyle(2.5, MUTE_ICON, 1);
  cross.beginPath(); cross.moveTo(2,  -6); cross.lineTo(10, 6); cross.strokePath();
  cross.beginPath(); cross.moveTo(10, -6); cross.lineTo(2,  6); cross.strokePath();
  btn.add(cross);

  const render = (muted) => {
    waves.setVisible(!muted);
    cross.setVisible(muted);
  };
  render(isMuted());

  // Rectangle hit area — easier to land a tap on than a circle of the same
  // span. The circle look stays, only the hit zone differs.
  btn.setSize(HIT_R * 2, HIT_R * 2);
  btn.setInteractive(
    new Phaser.Geom.Rectangle(-HIT_R, -HIT_R, HIT_R * 2, HIT_R * 2),
    Phaser.Geom.Rectangle.Contains,
  );
  btn.on('pointerover', () => scene.input.setDefaultCursor('pointer'));
  btn.on('pointerout',  () => scene.input.setDefaultCursor('default'));
  btn.on('pointerdown', () => {
    const next = !isMuted();
    setMuted(scene, next);
    render(next);
    scene.tweens.add({
      targets: btn, scale: 0.92, duration: 80, yoyo: true, ease: 'Sine.easeOut',
    });
  });

  return btn;
}

// Reliable hit-test against a mute button's tap zone using raw pointer
// position — `currentlyOver` on Phaser's scene pointerdown can be empty on a
// fresh mobile touch (no preceding pointermove), so scenes that share an
// input handler with the mute button should call this too.
export function pointerHitsMuteButton(btn, pointer) {
  if (!btn || !btn.active) return false;
  const dx = pointer.x - btn.x;
  const dy = pointer.y - btn.y;
  const r  = btn.hitRadius || 38;
  return Math.abs(dx) <= r && Math.abs(dy) <= r;
}
