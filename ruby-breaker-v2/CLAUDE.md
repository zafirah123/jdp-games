# Ruby Breaker — Dev Notes

Brick-breaker / gem-collector game. Phaser 3, served as a static site (no build step in this repo).

## IMPORTANT: this is a minified bundle

There is **no source code** in the repo. The entire game lives in one committed,
minified file:

```
ruby-breaker-v2/assets/index-D3MXnwhp.js   (~1.5 MB, bundled Phaser + game)
ruby-breaker-v2/index.html                 (loads the bundle)
```

All gameplay edits are made **directly to the minified JS**. After editing,
always validate syntax before committing:

```
cd ruby-breaker-v2/assets && node --check index-D3MXnwhp.js
```

If you ever find/restore the original (un-minified) source, prefer editing that
and rebuilding instead of hand-patching the bundle.

## Run locally

From the repo root (`jdp-games/`):

```
python3 -m http.server 8080
```

Then open **http://localhost:8080/ruby-breaker-v2/**

## Minified identifier cheat-sheet

The bundle minifies names. Key aliases used by the game logic:

| Minified | Meaning |
|----------|---------|
| `lt`     | Phaser namespace — `lt.Math.Between`, `lt.Math.DegToRad`, `lt.Math.Clamp`, `lt.Utils.Array.GetRandom` |
| `gt`     | Audio/sound manager — `gt.play("hit"|"break"|"combo"|"wall"|...)`, `gt.playBGM()`, `gt.stopBGM()` |
| `Ut`     | High-score store — `Ut.getHighScore()`, `Ut.saveHighScore()` |
| `nt`     | Color palette constants — `nt.B_RED`, `nt.CRIMSON`, `nt.GOLD`, `nt.WHITE`, etc. |

### Tunable constants (one place, comma-separated)

Find the run of `...,Qt=10,zt=510,ne=38,re=3,...`:

| Const | Value | Meaning |
|-------|-------|---------|
| `Et`  | 480   | canvas width |
| `At`  | 800   | canvas height |
| `zt`  | 510   | **base ball speed** (was 340; +50%) |
| `ne`  | 38    | per-level speed increment (was 25; +50%) — speed = `zt+(level-1)*ne` |
| `Qt`  | 10    | ball radius-ish offset for paddle rest position |

### Key GameScene methods (search by name in the bundle)

- `spawnBall(H,K,$,j)` — creates a ball; called **twice** at each spawn point to give 2 balls.
- `dropRubies(H,K)` — drops `getComboMult()` rubies (loops `dropRuby`).
- `dropRuby(H,K)` — single falling ruby with bounce physics.
- `catchRuby(H)` — paddle catches a ruby: `combo++`, awards `getComboMult()` points.
- `getComboMult()` — combo → multiplier. Currently `combo<3?1:2` (capped at **x2**).
- `breakBrick(H)` — on brick destroyed, calls `dropRubies` (skips type `9` = unbreakable).
- `onBrickHit` / `onBallLost` / `nextWave` — combo also increments on brick hits; resets to 0 on ball-lost.
- `addScore(H)` — `score = Math.min(500, score + round(H))` → **hard cap 500**.
- `update(H,K)` — repositions resting balls (spread 16px apart), culls fallen balls/rubies, runs timer.

## Game rules / balance (current)

- **Goal:** reach **500 points** within **3:00** (180 s). 500 is the intended max.
- **Score cap:** hard-capped at 500 in `addScore` — multipliers only let you reach it *faster*, never exceed it. Keep it easy.
- **Balls:** 2 in play. Lose a life only when **both** are gone (`$.length===0` check in `update`). Ball sprite scaled to `0.7` (−30%) with matching physics body.
- **Combo:** builds from catching rubies *and* breaking bricks; resets on ball-lost. Multiplier maxes at **x2** (combo ≥ 3).
- **Combo effects:** at x2 → bricks drop 2 rubies and each ruby is worth 2 points. At x1 → 1 ruby / 1 point.
- **Ruby physics:** rubies bounce off left/right/top walls (`setCollideWorldBounds` + `setBounce(.7,.7)`), but `body.checkCollision.down=false` so they still fall through the bottom if missed.

## Changes made 2026-05-20 (today's session)

1. **Ruby bounce physics** — falling rubies now ricochet off side/top walls instead of vanishing; still fall through the bottom when missed.
2. **Two balls** — spawn 2 balls at game start, life-respawn, and each new wave; they rest spread apart on the paddle and launch together with diverging angles.
3. **Ball speed +50%** — `zt` 340→510, `ne` 25→38.
4. **Ball size −30%** — `setScale(.7)` + resized physics body.
5. **Ruby-streak combo** — catching rubies builds the combo and applies the multiplier to points; floating "+N" popup shows real value.
6. **Combo-scaled drops** — bricks drop a number of rubies equal to the combo multiplier.
7. **Multiplier capped at x2** — `getComboMult` returns `combo<3?1:2` (earlier iterations tried up to x5; deliberately reduced to keep the game easy).

## Ideas / next dev steps

- Consider whether **missing** a ruby should break the combo streak (currently only ball-loss resets it). Trade-off: more "streak" feel vs. harder game — current design favors easy.
- Tune the x2 threshold (`combo<3`) if x2 comes too early/late.
- The bundle filename (`index-D3MXnwhp.js`) is referenced in `index.html` — if you ever regenerate the bundle, update the `<script>`/asset reference there to match the new hashed name.
- No automated tests / type-checking exist — verify changes by playing in the browser. `node --check` only catches syntax errors, not gameplay regressions.
