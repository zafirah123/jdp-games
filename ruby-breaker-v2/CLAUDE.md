# Ruby Breaker — Dev Notes

Brick-breaker / gem-collector game. Phaser 3, built with Vite.

## IMPORTANT: edit the SOURCE, not the bundle

This folder (`Desktop/jdp-games/ruby-breaker-v2/`) is the **deployed build** — a minified
bundle in `assets/` plus `index.html` and image/audio assets. **Do not hand-edit the bundle.**

The readable source project lives at:

```
/Users/hanifanas/Downloads/ruby-breaker-v2/
  src/scenes/{Boot,Preload,Start,Game,GameOver}Scene.js
  src/utils/{AudioManager,StorageManager}.js
  src/config/{gameConfig,levels}.js
  public/            # static assets copied to the build root (pngs, m4a, ...)
  vite.config.js     # base: './'  (note: its build.outDir points elsewhere — see Deploy)
```

> History note: earlier in the project the source and this deployed bundle drifted apart
> (gameplay was hand-patched into the bundle while the source lagged). As of 2026-05-21 the
> source is the single source of truth again. Keep it that way — always edit `src/` then rebuild.

## Build & deploy

From the source project (`Downloads/ruby-breaker-v2/`):

```
npm install                              # first time only
npx vite build --outDir dist --emptyOutDir   # build into a local dist/
```

Then copy the build into this deployed folder (the repo that pushes to origin):

```
DEST=/Users/hanifanas/Desktop/jdp-games/ruby-breaker-v2
rm -f "$DEST/assets/"index-*.js          # drop the old hashed bundle
cp dist/index.html "$DEST/index.html"
cp dist/assets/index-*.js "$DEST/assets/"
cp dist/*.png dist/*.jpeg dist/*.m4a "$DEST/"
```

(`vite.config.js` `build.outDir` is `../jdp-games/ruby-breaker` — the Downloads jdp-games copy,
NOT this Desktop repo — which is why we override `--outDir dist` and copy manually. Fix the
config if you want `npm run build` to target this repo directly.)

## Run locally

From the repo root (`Desktop/jdp-games/`): `python3 -m http.server 8080`
→ open **http://localhost:8080/ruby-breaker-v2/**

Or, while developing the source: `cd Downloads/ruby-breaker-v2 && npm run dev` (Vite, port 3000).

## Game rules / balance (current)

- **Goal:** reach **500 points** within **3:00** (180 s). 500 is the intended max.
- **Score cap:** hard-capped at 500 in `addScore` — multipliers only let you reach it *faster*.
- **Balls:** 2 in play (`spawnBall()` called twice at start / life-respawn / new wave). Lose a life
  only when **both** are gone. Ball sprite scaled to `0.7` (−30%) with matching physics body.
- **Speed:** `BALL_BASE_SPEED = 510`, `BALL_SPEED_LEVEL_INC = 38` (both +50% over the original).
- **Combo:** builds from catching rubies *and* breaking bricks; resets on ball-lost. Multiplier
  capped at **x2** (`getComboMult` returns `combo < 3 ? 1 : 2`).
- **Combo effects:** at x2 → bricks drop 2 rubies (`dropRubies`) and each ruby is worth 2 points.
- **Ruby physics:** rubies bounce off left/right/top walls (`setCollideWorldBounds` + `setBounce(.7)`),
  with `body.checkCollision.down = false` so misses still fall through the bottom.
- **Mascot visual + invisible Rectangle hitbox** (`buildPermanentShieldChar`, `buildShieldHitbox`).
  Three GameObjects work together at the bottom of the play area:
  1. **Paddle** (`createPaddle`) — hidden (`setVisible(false)`) and physics body disabled
     (`body.enable = false`). Only purpose: `paddle.x` is the pointer-following target the
     other two follow each frame.
  2. **Mascot** (`shieldChar`, depth 18) — the visible `pbot-shield.png` image. No physics. Its
     only job is to render the character; it tracks `paddle.x` each frame.
  3. **shieldHitbox** (`shieldHitbox`) — an invisible `add.rectangle(..., 0x000000, 0)` with a
     dynamic immovable physics body. This is what balls actually bounce off and rubies
     overlap. Sized 110 × 60 world px, with its top edge at world y `GAME_H-105` (the visible
     shield disc top of the mascot art — the PNG has ~22 px transparent space above the disc,
     so we offset the hitbox down from the mascot's texture top by that amount). Tracks
     `paddle.x` each frame so it stays under the visible mascot.
  - Ball-hitbox collider has a **process callback** `(b) => b.body.velocity.y > 0` so balls
    only collide when moving DOWNWARD. After a bounce the ball moves up; subsequent frames skip
    the collision entirely, preventing the "stuck inside the body / no more collisions" loop
    that plagued earlier designs.
  - Ruby-hitbox overlap → `catchRuby`. Rubies always fall with positive vy, so they always
    trigger the overlap when they enter the hitbox; no process callback needed.
  - `onPaddleHit` is shared; its 2nd arg is whatever catcher fired the collision (now the
    hitbox). The angle-steering math uses `catcher.x` and `getPaddleHalfW()` (still based on
    the paddle's texture width 114 → halfW 57; close enough to the hitbox's 55 that the feel
    is preserved).
  - **Ball rest/spawn position** = `getRestY()` returns the hardcoded constant `GAME_H - 113`
    (= shieldHitbox top minus ball half + tiny gap). Hardcoded rather than reading
    `shieldHitbox.body.top` so it's safe to call from `spawnBall` before the body's
    `position.y` has been computed.
  - **Why this design and not the previous attempts**: putting physics on the mascot directly
    ran into Phaser body-on-scaled-sprite issues (`preCalc` resetting `setSize` whenever the
    sprite's scale doesn't match the body's stored `_sx`); the transparent PNG top made the
    default body cover empty space; trimming via `setSize`/`setOffset` was unreliable. A
    separate `Rectangle` GameObject at scale 1 has none of those problems — its body matches
    its `width`/`height` directly.

## Audio

All SFX/BGM are **synthesized at runtime** via the Web Audio API in `src/utils/AudioManager.js`
(no files), EXCEPT the **game-over BGM**, which loops `public/game-over.m4a`:
- Loaded + decoded in `AudioManager.init()` (`loadGameoverSound`), routed through `masterGain`
  so it respects the mute toggle. Falls back to the synth jingle if the file fails to load.
- `AudioManager.gameover()` plays the BufferSource with `src.loop = true` and stores it in a
  module-scoped `gameoverSource` variable so it can be stopped later. `AudioManager.stopGameover()`
  stops the looping source — `GameOverScene` calls this when the user clicks PLAY AGAIN or MAIN
  MENU. Calling `gameover()` again (e.g. retry → game over) stops the previous loop first.
- To swap other sounds for files: add the file to `public/`, decode it the same way, and play a
  `BufferSource` through `masterGain` inside the relevant `SFX.*` entry. Prefer **MP3** for the
  widest browser support; m4a works on Safari/Chrome.

## Cosmetics

- **Background:** palette gradient (navy → blue → deep maroon) drawn in `PreloadScene.genBackground`
  as a canvas texture (replaces the old `bg-space.png`). `bg-space.png` is still in `public/` but unused.
- **Title:** start screen uses the `game-logo.png` image (`StartScene.buildTitle`) with a soft
  light-blue radial glow (`logoGlow` canvas texture) behind it. No text title / no "GEM EDITION".

## Notes

- No automated tests / type-checking. Verify changes by playing in the browser.
- Palette lives in `src/config/gameConfig.js` (`P`): NAVY, BLUE, BLUE_LT, CRIMSON, D_RED, MAROON,
  B_RED, GOLD, AMBER, WHITE.

---

## STABLE CHECKPOINT — shield/mascot + game-over audio (2026-05-25)

User confirmed "everything is okay for now" on bundle `index-i8lS3FGF.js`. This section is
the post-mortem of the multi-iteration debugging session that got us here, so future-you
knows what's stable and what's brittle.

### Final design (what's deployed)

Three GameObjects work together at the bottom of the play area:

1. **`paddle`** (`createPaddle`) — `physics.add.image('paddle')`, **hidden**
   (`setVisible(false)`) and **physics disabled** (`body.enable = false`). It exists only so
   `paddle.x` is the pointer-following target that the other two follow each frame.
2. **`shieldChar`** (`buildPermanentShieldChar`) — depth-18 `add.image('pbot-shield')` at
   scale `110/1664 ≈ 0.066`. Pure visual, NO physics. Tracks `paddle.x` each frame.
3. **`shieldHitbox`** (`buildShieldHitbox`) — invisible `add.rectangle(..., 0x000000, 0)`
   sized **110 × 60 world px**, top edge at **world y `GAME_H - 105`** (visible shield-disc
   top of the mascot art — the PNG has ~22 px transparent space above the disc). Has a
   dynamic immovable physics body. Tracks `paddle.x` each frame.

**Ball-hitbox**: `physics.add.collider(ball, shieldHitbox, onPaddleHit, processCallback)`.
The process callback `(b) => b.body.velocity.y > 0` ensures collisions only fire when the
ball is moving downward, so the ball can't get re-bounced while exiting the hitbox after a
hit.

**Ruby-hitbox**: NOT `physics.add.overlap`. A **manual O(N) bounds check in `update()`**
iterates `this.rubies.getChildren()` against `shieldHitbox.body.{left,right,top,bottom}`
and calls `catchRuby` for any ruby inside. See "Why manual?" below.

**Ball rest/spawn**: `getRestY()` returns hardcoded `GAME_H - 113` (= hitbox top minus ball
body half 7 minus 1 px clearance). Balls visibly sit on the shield disc, not floating above.

**`catchRuby` guards**: triple-guarded against multi-catch with `!ruby.active`,
`!ruby.body.enable`, and a `caught` flag set via `setData`. `dropRuby` resets the flag since
`group.create()` may reuse a previously-caught ruby.

### Why manual ruby check, not `physics.add.overlap`?

The most important lesson of the session. We tried every variation of
`physics.add.overlap(rubies, shieldHitbox, catchRuby)` — with multi-catch guards, with
`caught` flags, with throttled effects. Every version **froze the page** when several
rubies entered the hitbox together. Even with guards that proved the freeze WASN'T from our
`catchRuby` re-entering (the guards bailed immediately on the second call), the freeze
persisted — strongly suggesting the freeze is inside Phaser's arcade overlap iteration
itself, not in our code.

Replacing the overlap with a plain JS `forEach` bounds check in `update()` fixed it
completely. **Do not re-introduce `physics.add.overlap` for the rubies + hitbox pair**
unless you've reproduced and root-caused the original freeze.

### Things we tried before landing here (don't re-litigate these)

- Full-width invisible rectangle at the bottom catching everything → user disliked "balls
  bounce everywhere outside the mascot".
- Mascot as `physics.add.image` with custom `setSize`/`setOffset` to trim the body → Phaser
  body `preCalc` resets `sourceWidth`/`sourceHeight` to texture defaults when the sprite's
  `scaleX` differs from the body's stored `_sx` (which happens on the first physics step
  after `setScale`); our trim was silently overwritten.
- Mascot as `physics.add.image` with default body (110×147) → covers ~22 px of transparent
  PNG above the shield (balls bounced off empty space), AND balls "stopped responding after
  the first hit" (suspected: ball entering the tall body got pushed to a bad position by
  Phaser's separation, ending up below the body on the wrong side).
- Paddle visible, hidden, body enlarged via `setSize` → same "stops after first hit"
  symptom. Suspect: similar `preCalc` reset issue on the dynamic body.
- `delayedCall(0)` to defer the trim past the first `preCalc` → made the body trim stick,
  but the user still reported bugs.

**The Rectangle GameObject at scale 1 has none of these issues** — its body matches its
`width`/`height` directly with no scale math, and `preCalc` doesn't reset anything because
the scale never changed.

### Audio (DONE, stable)

`game-over.m4a` loops as game-over BGM. `AudioManager.gameover()` plays a `BufferSource`
with `src.loop = true`, stored in `gameoverSource`. `AudioManager.stopGameover()` stops
it. `GameOverScene` calls `stopGameover()` on **PLAY AGAIN** and **MAIN MENU**. Retrying
into another game-over stops the previous loop first. Don't touch unless changing the
m4a file.

### If you have to change this code

- Don't put physics on the mascot image. The Rectangle is the body.
- Don't switch ruby catching back to `physics.add.overlap`.
- If you change the visible mascot's position or scale, recompute `GAME_H - 105`
  (shield-disc top), `GAME_H - 113` (`getRestY`), and the hitbox height to match.
- `getPaddleHalfW()` still returns `paddle.displayWidth / 2 = 57` (texture is 114 wide).
  Bounce-angle math uses this for normalization; close enough to the hitbox's `55` half-
  width that the feel is preserved. If you tighten the hitbox width, also update
  `getPaddleHalfW` to use the hitbox.

### Mascot artwork reference (for body sizing math)

The mascot PNG (1664 × 2224) has:
- ~0–15% (texture y 0–330) transparent above the visible art
- ~15–30% the floating white "shield disc" with green ball decorations
- ~30–65% the face / head
- ~65–100% the body / torso (extends below the screen when in-game)

At scale `110/1664 ≈ 0.066`, those map to world-pixel zones below `mascot.y` (`GAME_H - 53.5`):
- Texture top → world y `GAME_H - 127` (transparent — DON'T let body extend up to here)
- Visible shield disc top → world y ~`GAME_H - 105`  ← body top should be here
- Visible bottom of mascot → world y `GAME_H + 20` (below screen)
