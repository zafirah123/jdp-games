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
(no files), EXCEPT the **game-over BGM**, which loops `public/pacman-die.mp3`:
- Loaded + decoded in `AudioManager.init()` (`loadGameoverSound`), routed through `masterGain`
  so it respects the mute toggle. Cache-busted with `?v=${Date.now()}` so swapping the file on
  disk takes effect without a stale browser cache. Falls back to the synth jingle if the file
  fails to load.
- `AudioManager.gameover()` plays the BufferSource with `src.loop = true` and stores it in a
  module-scoped `gameoverSource` variable so it can be stopped later. `AudioManager.stopGameover()`
  stops the source — `GameOverScene` calls this from the **CLAIM SCORE** button before handing off
  to the platform (see the 2026-06-07 checkpoint; PLAY AGAIN / MAIN MENU were removed per root §6.5).
  (Looping was also removed on 2026-05-26 — the clip now plays once. See that checkpoint.)
- **MP3 exception to root §5.2 (AAC mandatory).** During the 2026-05-26 audio swap the
  AAC/.m4a produced by `afconvert` decoded inconsistently through Web Audio's `decodeAudioData`
  — game-over silently fell back to the synth jingle. MP3 decodes universally; for a 19 KB
  short clip the bytes-per-quality tradeoff doesn't matter. If you re-encode game-over audio
  later as a clean AAC and verify it decodes in Chrome + Safari, you can move back to .m4a.
- To swap other sounds for files: add the file to `public/`, decode it the same way, and play a
  `BufferSource` through `masterGain` inside the relevant `SFX.*` entry. **Prefer MP3** for the
  widest browser support given the above.

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

`pacman-die.mp3` loops as game-over BGM (was `game-over.m4a` before 2026-05-26 — see the
MP3-exception note above for why we swapped formats). `AudioManager.gameover()` plays a
`BufferSource` with `src.loop = true`, stored in `gameoverSource`. `AudioManager.stopGameover()`
stops it. `GameOverScene` calls `stopGameover()` on **PLAY AGAIN** and **MAIN MENU**. Retrying
into another game-over stops the previous loop first. Don't touch unless changing the audio
file — and if you do, keep MP3 unless you've re-verified AAC decoding across browsers.

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

---

## STABLE CHECKPOINT — playfield top-bounce, score copy, pacman game-over (2026-05-26)

User confirmed "everything is perfect now" on bundle `index-RzqmVFOx.js`. Three independent
changes layered on top of the 2026-05-25 checkpoint:

### 1. Playfield top now bounces the ball (was: ball flew behind HUD)

Previously `setCollideWorldBounds(true)` bounced balls at world y=0 — the canvas top, which
sits *behind* the HUD strip. Visually the ball disappeared into the HUD before bouncing.
Now `GameScene.create()` shrinks the physics world: `physics.world.setBounds(0, 50, W, H-50)`,
so the top wall is at world y=50 (just under the HUD). `drawBorder()` also moved its red
`strokeRect` down to y=50 so the visible red rectangle exactly matches the wall — left, right,
and top all read as the same playfield boundary. Rubies (also `setCollideWorldBounds(true)`)
bounce off the same top edge for consistency.

If you change the HUD height, update **both** `setBounds(0, 50, ...)` and `strokeRect(1, 50, W-2, H-51)`.

### 2. Score reads "RUBY\n<n>" — no "/500"

`buildHUD` initial text and `addScore`'s `setText` both dropped the `/500` suffix. The cap
still exists in the gameplay logic (`if (this.score >= 500) endGame(true)`), but is no
longer telegraphed to the player. If you ever decide to remove the cap entirely, also delete
the `>= 500` branch in `update()` and the `RUBIES COLLECTED / 500` line in `GameOverScene`.

### 3. Game-over audio: pacman-die.mp3, one-shot, BGM dies cleanly

**File swap.** `game-over.m4a` (the old AAC clip) was replaced with `pacman-die.mp3`
(15 KB, ~1 s). Stored at `public/pacman-die.mp3` in source and at the deployed folder root.
See the "Audio" section above for the MP3-over-AAC rationale (root §5.2 says AAC mandatory;
we documented the exception there).

**No more looping.** `SFX.gameover()` no longer sets `src.loop = true` on the BufferSource —
the clip plays exactly once. `stopGameover()` calls in `GameOverScene` still work (calling
`.stop()` on a finished source throws but is caught).

**BGM tail no longer bleeds into the death jingle.** Root cause: the BGM scheduler
pre-queues 16 oscillators into the Web Audio graph at once; `clearTimeout` only stops the
*next* batch, so up to ~3 seconds of already-scheduled notes still fire after `stopBGM()`.
Fix: introduced a dedicated `bgmGain` sub-bus (BGM notes connect to `bgmGain`, which in turn
connects to `masterGain`). `stopBGM()` now also does
`bgmGain.gain.setValueAtTime(0, ctx.currentTime)` — instantly silencing in-flight notes
without affecting `pacman-die` (which routes directly through `masterGain`). `playBGM()`
restores `bgmGain.gain` to 1.

**"Life lost" arpeggio suppressed on the final ball.** `GameScene.onBallLost()` guards
`AudioManager.play('life')` with `if (this.lives > 0)` so the run-ending death is silent
until pacman-die plays. Same function now also calls `AudioManager.stopBGM()` immediately
when `lives <= 0`, rather than waiting for `endGame`'s `stopBGM` 500 ms later — keeps that
half-second pause silent so the hand-off to pacman-die is clean.

### Audio gotchas if you have to touch this code

- Don't bring back `src.loop = true` on game-over without a UX reason — the 1 s pacman clip
  looping gets annoying fast (we tried).
- Don't connect new BGM-related oscillators directly to `masterGain` — they'll bypass the
  `bgmGain` mute and leak past `stopBGM()`.
- SFX (paddle, hit, break, life, etc.) intentionally still connect to `masterGain` directly,
  so they're not killed by `stopBGM`. That's correct — they're short one-shots, not loops.
- The fetch URL is cache-busted: `pacman-die.mp3?v=${Date.now()}` so swapping the file on
  disk during dev doesn't require a hard refresh of the audio (only the bundle).

---

## CHECKPOINT — CLAIM SCORE callback + language + in-game pause (2026-06-07)

Brings Ruby Breaker up to root CLAUDE.md §6.4 (language) and §6.5 (end-of-game
callback + early-end). Latest deployed bundle `index-C5IS2gzt.js`. Three new/changed pieces,
layered on the 2026-05-26 checkpoint; gameplay/physics/audio untouched.

### 1. `src/claimScore.js` (new) — §6.5 callback contract

Adapted from `flying-ruby/src/claimScore.js`. `claimScore(score, { cause, timeUsedMs })`
resolves the callback target in §6.5 order — `?callback_url=` (https only) →
`window.__JDP_CALLBACK_URL__` → null — appends the payload as query params and redirects
(`window.location.href`), which survives Pandai's in-app WebViews better than `fetch`.

- Payload: `game: 'ruby-breaker-v2'` (matches the games.js path), `score` (clamped ≥0 int),
  fresh `token` (UUID v4 / hex fallback), plus optional `cause` + `timeUsedMs` diagnostics.
- No callback configured (direct play) → logs the would-be payload to console and returns
  instead of redirecting to a 404. Also mirrors every claim to `localStorage`
  (`ruby-breaker-v2:claims`) for QA — wrapped in try/catch for sandboxed webviews.
- **Do not hardcode a public callback URL** — that's the whole point of the resolver.

### 2. `src/copy.js` (new) — §6.4 `?lang=ms` switching

`COPY` object resolved once from `?lang=ms` (anything else → English; not persisted, URL is
the source of truth). Canonical five + `claimScore` use the §6.4 table strings exactly
(`START GAME`/`MULA MAIN`, `TIME'S UP!`/`MASA TAMAT!`, `GAME OVER`/`PERMAINAN TAMAT`,
`CLAIM SCORE`/`TUNTUT SKOR`). Game-specific keys (how-to-play rows, pause copy, level/best
labels, life-left text) live alongside. All three scenes import `COPY` — no hardcoded
player-facing strings remain except the score "RUBY" HUD label.

### 3. `GameScene` — in-game pause / early-end (§6.5 + user request)

New top-right HUD: **pause** `⏸` and **mute** `🔊/🔇` buttons (depth 40, 8px tap padding).
Adding the in-game mute also closes the §6.3 gap — previously only StartScene had one. Lives
text moved to a second row (`y=36`) so it doesn't collide with the buttons.

- `_togglePause()` → `_pauseRound()` sets `this.paused`, calls `physics.pause()`,
  `this.time.paused = true`, and `AudioManager.stopBGM()`, then shows an overlay.
- **`update()` and both `input.on` handlers now bail on `this.paused`** (in addition to
  `!this.gameActive`), so the clock freezes and taps don't launch the ball while paused.
- `_overControl(pointer)` bounds-checks the pause/mute buttons in the scene `pointerdown`
  handler — without it, a tap on a control *also* fires the scene-level launch (Phaser's
  global pointer event is independent of the buttons' own handlers).
- Overlay (`_showPauseOverlay` / `_pauseBtn`) offers **CONTINUE** (resume) and
  **EXIT & CLAIM** → `claimScore(this.score, { cause: 'early', timeUsedMs })`. Saves high
  score first. This is the §6.5 player-accessible early-end.

### 4. `GameOverScene` — single CLAIM SCORE CTA (§6.5)

Removed **PLAY AGAIN** and **MAIN MENU** (the §6.5 no-in-game-retry rule). One CTA now:
**CLAIM SCORE** → `claimScore(this.score, { cause })` where cause is `cap` (won) /
`timeup` / `gameover`. Title uses `COPY.victory` (cap reached) / `COPY.timeUp` (timer) /
`COPY.gameOver` (other), per the §6.4 state distinction.

### If you touch this code

- `claimScore` redirects via `window.location.href` — there's no return path in production.
  Test with `?callback_url=https://example.com/claim` and watch the URL, or play with no
  callback and read the console + `localStorage['ruby-breaker-v2:claims']`.
- The pause button only works while `gameActive` (not after end-of-game).
- If you re-add any scene `pointerdown` behaviour, keep the `_overControl` guard or control
  taps will leak into gameplay.

### 5. `GameScene.buildHUD` — top panel redesign (cosmetic)

The flat `hud_bar` texture (90%-navy rect) read as invisible. Replaced with a drawn
panel: navy base + faint `BLUE` lower band (fake gradient), a `BLUE_LT` top highlight, and a
bold `B_RED` + `GOLD` bottom accent that lines up with the red playfield border at y=50.
Two rounded "chips" group the stats — a `MAROON`/gold **RUBY** chip (gem icon + the single
gold HUD number) on the left and a navy/`BLUE_LT` **LEVEL + TIMER** chip in the center.
Pause/mute are cute gold-rimmed circular buttons (navy fill + white gloss highlight, press
scale-tween) sitting on one right-side row with the lives readout — lives are now **heart
emojis** (`refreshLivesHUD` → `❤️`×n, collapses to `❤️×N` past 5) instead of "HP:n", which
de-crowds the corner. ROUND and TIME are now **two separate chips** (was one "LV+timer"
chip) — "LV n" renamed to a ROUND label + number; `nextWave` sets `levelTx` to the number
only. GameOverScene matches: `COPY.levelReached` → "ROUND n" / "PUSINGAN n", and the "/ 500"
sub-line under the rubies count was removed (score shown bare, per §1.4 no cap telegraphing).
Panel is depth 15; all
HUD text/icons are depth 16+. `hud_bar` texture is still generated in PreloadScene but
unused. `scoreTx` is now the number only (`addScore` sets `String(score)`); the "RUBY" label
is a separate static text. HUD height stays 50px so world bounds / brick layout are untouched.

### 6. Canvas centering fix (`index.html` + `main.js`)

The page used `display:flex` centering on `<body>` **and** Phaser `autoCenter: CENTER_BOTH`
on the FIT canvas — two centering systems fighting, which left the canvas off-center on wide
laptop viewports. Fixed with the canonical Phaser pattern: a `<div id="game">` parent sized
to `100vw × 100vh` (plain block, no flex), `parent: 'game'` in the scale config, and
CENTER_BOTH as the **only** centering mechanism. Don't re-add flex/grid centering to `#game`
or `body` — let Phaser own it.

### 7. BGM audibility + clean start (`AudioManager.js`)

In-game BGM is the synthesized D-minor arpeggio (no file). It was effectively inaudible — lead
notes at `0.06` gain → `bgmGain(1)` → `masterGain(0.4)` ≈ `0.024`. Two fixes: (a) lead note
gain raised to `0.16` and a soft sine **bass** voice (`BGM_BASS`) added on bar downbeats so the
loop reads as music; (b) `scheduleBGMBatch` now **polls until `ctx.state === 'running'`** instead
of queuing oscillators on a suspended (autoplay-blocked) context — previously a start-screen
`playBGM()` piled notes on a frozen clock that blasted at once when audio unlocked. The
AudioContext unlocks on the first user gesture (the START GAME click), so GameScene BGM is
running by the time `create()` calls `playBGM()`.

### Known remaining gaps (not addressed here — flag before "done")

- **Mute is not persisted to `localStorage`** and not applied before first audio (§6.3/§0.4).
  `AudioManager` keeps `muted` in a module variable only; `StorageManager` has `getPrefs`/
  `setPref` ready to wire it.
- **§1.4 / §1.5:** the run hard-ends at 500 (`endGame(true)`) rather than tapering spawns,
  and there are 10 power-up types vs the two-max rule. Both are gameplay-balance changes,
  out of scope for this callback/lang pass.
