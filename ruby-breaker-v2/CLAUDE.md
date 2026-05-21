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
- **pbot-shield character:** peeks up from the bottom and follows the paddle (`buildPermanentShieldChar`).

## Audio

All SFX/BGM are **synthesized at runtime** via the Web Audio API in `src/utils/AudioManager.js`
(no files), EXCEPT the **game-over jingle**, which plays `public/game-over.m4a`:
- Loaded + decoded in `AudioManager.init()` (`loadGameoverSound`), routed through `masterGain`
  so it respects the mute toggle. Falls back to the synth jingle if the file fails to load.
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
