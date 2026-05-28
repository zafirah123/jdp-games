// Shared mute toggle.
//
// State handling: Phaser's WebAudio `sound.mute` getter is unreliable (it
// reads a gain-node value back), so we never read it — we track the state
// ourselves. localStorage persists it across reloads when available, but a
// module-level `muteState` is the in-session source of truth: sandboxed
// webviews (e.g. VS Code's Simple Browser) and private mode make
// localStorage *throw*, so every access is guarded.

// Canonical key per DESIGN.md §5.11 (`<game-name>:mute`). The legacy
// `:muted` key shipped briefly; we migrate it on read so returning players
// keep their preference, then drop the old entry.
const MUTE_KEY        = 'flying-ruby:mute';
const LEGACY_MUTE_KEY = 'flying-ruby:muted';

// in-session source of truth; mirrors localStorage when that is available
let muteState = false;

// Refresh muteState from localStorage. If storage is unavailable the call
// throws — we swallow it and keep whatever muteState already held.
function loadMuteState() {
  try {
    let v = window.localStorage.getItem(MUTE_KEY);
    if (v === null) {
      // one-shot migration from the legacy `:muted` key
      const legacy = window.localStorage.getItem(LEGACY_MUTE_KEY);
      if (legacy !== null) {
        window.localStorage.setItem(MUTE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_MUTE_KEY);
        v = legacy;
      }
    }
    muteState = v === '1';
  } catch { /* storage blocked — keep the in-memory value */ }
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

// Adds a speaker on/off toggle at (x, y). The tap target is a circle
// concentric with the visible button so every pixel inside the rendered
// circle (and a comfortable ring beyond it) is clickable — a square hit
// area on a round button reads as "the icon misses". Returns the button
// container with `hitRadius` attached so scenes can do their own
// position-based tests (currentlyOver can be empty on a fresh mobile tap).
export function addMuteButton(scene, x, y) {
  scene.sound.mute = loadMuteState();

  const R = 22;       // visual background radius (44 px diameter — §5.11)
  const HIT_R = 36;   // circular tap radius — fully contains the visible R=22 circle

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
  const r  = btn.hitRadius || 36;
  // Circular distance check — matches the Phaser.Geom.Circle hit shape so
  // the manual fallback agrees with the interactive area pixel-for-pixel.
  return (dx * dx + dy * dy) <= (r * r);
}
