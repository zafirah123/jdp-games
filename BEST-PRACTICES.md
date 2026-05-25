# Best Practices — Flying Ruby Case Study

> The canonical reference for how to design, build, and ship a short-session
> arcade game in this repo. Derived from the **Flying Ruby** implementation
> (`flying-ruby/`) and originally published as
> [`flying-ruby-case-study.html`](./flying-ruby-case-study.html) — that HTML
> remains the live, slideable version; this Markdown is the in-repo,
> diff-able source of truth.

When this document and the HTML disagree, **this Markdown wins** — open a PR
to update the HTML if the two drift. When [CLAUDE.md](./CLAUDE.md) or
[AGENTS.md](./AGENTS.md) cite "the case study," they mean this file.

---

## Table of contents

1. [Overview — what Flying Ruby actually is](#01--overview)
2. [Architecture — four scenes, one config file](#02--architecture)
3. [The core loop — endless within a timer](#03--the-core-loop)
4. [Gamification — one currency, two power-ups, many shapes](#04--gamification)
5. [Economy control — the cap the player must not see](#05--economy-control)
6. [Asset management & optimization](#06--asset-management--optimization)
7. [Visual reference — the cast on screen](#06b--visual-reference)
8. [Game feel — the polish budget](#07--game-feel)
9. [Replication patterns — ten things to copy](#08--replication-patterns)
10. [Build checklist](#09--build-checklist)
11. [TL;DR](#10--tldr)

---

## 01 — Overview

**What Flying Ruby actually is.** A Flappy-Bird descendant starring the
Pandai mascot `pbot`. The player flaps through gold pillars, vacuums rubies,
and rides power-ups inside a single, continuous 3-minute round. There are
no levels, no boss, no progression screens — just one long survival arc you
fully spend.

| | |
|---|---|
| **Format** | Single endless round of **3:00**. Crashing doesn't end the run if time remains — you "Continue" with the same score and the leftover timer. |
| **Goal** | Collect as many **rubies** as possible before the clock hits zero. One currency. One number to beat. |
| **Feel** | Tap-to-flap, gravity `1200`, jump `-380`. Tilt-toward-velocity, squash on flap, glass-crack death sequence. |
| **Tech** | Phaser 3 loaded from CDN. ES modules. Static site. No build step, no bundler, no dependencies to update. |

---

## 02 — Architecture

**Four scenes, one config file.** Everything that designers and PMs care
about — tuning, difficulty, drop rates, palette — lives in a single file.
Scenes stay lean and focused on one responsibility each.

| File | Responsibility | Why it's split this way |
|---|---|---|
| `src/config.js` | Palette, round length, gravity, drop rates, power-up tuning | One source of truth. Designers tune here without touching scenes. |
| `BootScene.js` | Preload assets · generate placeholder textures · honour mute pref · dev `?scene=` jump | Lets gameplay be built before final art exists. |
| `StartScene.js` | Logo, mascot idle, Start Game button (Pandai DS spec) | Title screen is mostly brand presentation, not logic. |
| `GameScene.js` | Full gameplay loop, difficulty ramp, spawning, power-ups, crash FX | One big scene is fine when the game has one round. |
| `GameOverScene.js` | Score count-up, best-score persistence, Continue vs Home routing | Continue logic lives where time/score state arrives. |
| `muteButton.js` | Shared mute toggle + `localStorage` preference | Shared widget extracted because every scene needs it. |

### Config that designers can read

```js
// src/config.js — the only file most tuning ever needs to touch
export const GAME = {
  width: 480, height: 854,
  roundDurationMs: 3 * 60 * 1000,   // 3-minute round
  gravity: 1200, flapVelocity: -380,
  rubyValue: 1,
};

export const DIFFICULTY = {
  rampCompleteAt:   0.85,                  // peak by 85% of round
  pipeSpeed:        { start: 234,  end: 410  },
  pipeGap:          { start: 230,  end: 160  },
  pipeSpawnEveryMs: { start: 1700, end: 1100 },
};

export const MAGNET = { spawnEveryMs: 8000,  spawnChance: 0.7, durationMs: 5000, pullSpeed: 560 };
export const RUSH   = { spawnEveryMs: 21000, spawnChance: 0.6, durationMs: 7000, speedMultiplier: 1.6, rubyCount: 50 };
```

> **Pattern.** A flat `config.js` with named ranges (`{ start, end }`) makes
> the difficulty ramp self-documenting. Anyone can re-tune the game in 30
> seconds without reading scene code.

---

## 03 — The core loop

**Endless gameplay, time-boxed run.** "Endless but with a fixed clock" is
the structural backbone. There are no stages or level transitions.
Difficulty is a smooth interpolation across the round. The "Continue"
mechanic is what makes the 3:00 feel like a budget the player wants to
spend completely — not a sudden-death wall.

| | |
|---|---|
| **Round = budget** | The 3-minute timer is a *shared budget across continues*, not a per-life timer. Crash early, resume with whatever time you had left. |
| **Two exit conditions** | Only **Time's Up** permanently ends a run. **Crash** with time remaining shows Continue. Once budget is spent, only Home remains. |
| **Difficulty arc** | Linear ramp from start values to end values, finished at **85%** of the round so the final ~27s sits at peak — natural climax. |

### How the ramp is computed

```js
_rampProgress() {
  const rampMs = GAME.roundDurationMs * DIFFICULTY.rampCompleteAt;
  return Phaser.Math.Clamp(this.elapsedMs / rampMs, 0, 1);
}

_ramp(range) {
  return Phaser.Math.Linear(range.start, range.end, this._rampProgress());
}
```

> **Why no stages?** Stages create friction for short-session play. A
> 3-minute window is short enough that the player can finish a satisfying
> arc in one sitting; long enough that the difficulty ramp has somewhere to
> go. Use stages only when sessions are longer than ~5 minutes or when you
> want narrative beats.

---

## 04 — Gamification

**One currency, two power-ups, many shapes.** Flying Ruby keeps the scoring
legible (one number, one icon) but injects variety through *how* rubies
appear — formations, gap rewards, magnet pulls, and a screen-shaking Power
Rush — so the same scoring system feels different minute-to-minute.

| Element | Mechanic | Player benefit | Designer lever |
|---|---|---|---|
| **Ruby (currency)** | +1 on overlap | Single, legible goal | `GAME.rubyValue` |
| **Gap reward** | Per-pillar-pair: empty / single / trio | Risk-vs-reward through the gap | Drop probabilities |
| **Lane collectibles** | Between pillars: empty / single / line / wave / circle | Visual rhythm and choreographed beats | Spawn odds + formations |
| **Magnet** | 5s pull on every on-screen ruby | Collection aid — turns near-misses into pickups | `MAGNET` config |
| **Power Rush** | 7s frenzy: pillars retract, world speeds up ×1.6, sine-line of 50 rubies | Big payout window, momentum reset | `RUSH` config |
| **Best score** | `localStorage['flying-ruby:best']` | Meta-progression hook | Storage key |
| **Continue** | Resume after crash with leftover time | Reduces frustration, encourages full 3:00 use | Time budget logic |

### Formations turn one ruby into a moment

Three formations — `line5`, `wave`, `circle` — all share a single velocity
so the shape holds together as it scrolls. This is much cheaper than
authoring real animations and produces the "ribbon of rubies" feel that
defines the game.

```js
// Lane spawn odds — most lanes empty so the rare formations feel special
const roll = Math.random();
if (roll < 0.73) return;                // 73% empty (breather)
if (roll < 0.85) spawnSingle();         // 12% single ruby
else if (roll < 0.91) spawnFormation('line5');
else if (roll < 0.96) spawnFormation('wave');
else                  spawnFormation('circle');
```

---

## 05 — Economy control

**The 500-ruby cap the player must not see.** Flying Ruby currently has
**no cap** — score is unbounded. To enforce a soft ceiling of 500 without
breaking the fantasy, do *not* clamp the counter. Instead, taper supply so
the world organically thins as the player approaches the cap.

### Why a visible clamp fails

- **Stuck counter** — Score stops moving while sparkle "+1" pops keep
  playing. Players notice instantly and feel cheated.
- **Empty world** — Killing all spawns above 500 leaves the player flying
  through nothing for the final minute. Reads as a bug.
- **Hard freeze** — Ending the round early at 500 breaks the "spend the
  full 3:00" contract the game made on the title screen.

### Approaches ranked by how invisible they are

| Approach | How it works | Visibility |
|---|---|---|
| Hard clamp | `score = Math.min(500, score + 1)` | Very obvious |
| Stop all spawns past threshold | Lane & gap rolls return empty after 500 | Obvious |
| **Soft taper (recommended)** | Multiply spawn probabilities by `1 − smoothstep(420, 520, score)`. Suppress new Power Rush bubbles within ~70 of cap. | Invisible |
| Pre-rolled per-round budget | Pick a target 460–500 at round start; spread spawns via inverse-CDF across the timeline | Invisible but rigid |

### The soft-taper pattern

```js
// Add to config.js
export const ECONOMY = {
  softCap:       500,
  taperStart:    420,   // begin thinning supply at this score
  taperEnd:      520,   // effectively no spawns past this
  rushBlockedAt: 430,   // don't arm new Power Rush bubbles here
};

// In GameScene — a single multiplier applied to every spawn roll
_supplyMultiplier() {
  const { taperStart, taperEnd } = ECONOMY;
  const t = Phaser.Math.Clamp(
    (this.score - taperStart) / (taperEnd - taperStart), 0, 1
  );
  return 1 - (t * t * (3 - 2 * t));   // smoothstep
}

// Then in _spawnGapReward / _spawnLaneCollectible:
if (Math.random() > this._supplyMultiplier()) return;
// ...existing odds roll continues here
```

> **Why this works.** From the player's perspective the world simply "calms
> down" near the end — which already happens naturally with the difficulty
> ramp. Empty lanes during the final stretch feel like difficulty, not
> deprivation. The HUD keeps counting up; sparkles keep popping; the game
> keeps its promise.

---

## 06 — Asset management & optimization

**Every kilobyte is a deliberate choice.** The entire game — five sprites,
one background, seven SFX, three BGM tracks — fits in **2.8 MB**. Folder
structure mirrors load order, formats are chosen per-asset-type, and
runtime-generated textures sidestep shipping art that maths can produce.

> **Total payload: 2.8 MB · 16 files · first-load complete.**

### Folder layout — sorted by load order & intent

```
flying-ruby/
├── index.html                       # entry · loads Phaser from CDN + src/main.js
├── src/                             # scenes + config — code only, no bundler
├── assets/
│   ├── sprites/                     # character art with transparency
│   │   ├── pbot.webp                #  80 KB · 432×578
│   │   ├── ruby.webp                #  68 KB · 512×512
│   │   ├── magnet.webp              #  52 KB · 1024×1024
│   │   ├── pwr.webp                 #  76 KB · 1024×1024
│   │   └── game_logo.webp           #  80 KB · 350×338
│   └── backgrounds/                 # solid art, no transparency channel
│       └── bg.webp                  # 720 KB · 768×1376
├── sfx/                             # short, one-shot AAC clips
│   ├── jump.m4a                     #  16 KB
│   ├── collect.m4a                  #  20 KB
│   ├── on-hit.m4a                   #  12 KB
│   └── ... (4 more)                 # ~200 KB total
└── bgm/                             # looping AAC tracks per scene
    ├── start-bgm.m4a                # 128 KB
    ├── game-bgm.m4a                 # 1.3 MB
    └── pwr-up.m4a                   # 116 KB
```

> **Foldering principle.** Folder name = file family + lifecycle.
> `sprites/` = drawn-frequently with alpha. `backgrounds/` = drawn-once, no
> alpha. `sfx/` = one-shot. `bgm/` = looped. A new engineer never has to
> ask where to put a new file.

### Format choices — and what each one saved us

| Asset family | Format | Alternative | Saving | Why this format |
|---|---|---|---|---|
| Sprites & logo | **WebP (lossless, RGBA)** | PNG-24 | ~30–50% | Same crisp transparency as PNG, smaller file. Universal browser support since 2020. |
| Background | **WebP (lossy, RGB)** | JPEG | ~25–35% | No alpha needed; lossy WebP beats JPEG at the same perceptual quality. |
| SFX (short clips) | **AAC / m4a** | WAV / MP3 | ~10× vs WAV | Sounds identical at gameplay volumes; plays on every browser without licensing. |
| BGM (long loops) | **AAC / m4a** | MP3 | ~15% smaller | Better quality-per-byte than MP3 at the same bitrate; loops cleanly. |
| Pillars, sparkles, vignette | **Generated at runtime** | PNG | ~100% saved | A gradient or a 4-point star is cheaper to draw than to download. |

### Six optimization tactics in play

1. **WebP everywhere.** Every image is WebP. Lossless for sprites, lossy
   for the background. No PNG, no JPEG anywhere in the bundle.
2. **Generate before download.** Pillars, sparkles, dust, and the rush
   vignette are drawn in code at boot. **Zero bytes** shipped for any of
   them.
3. **Mirror to tile.** The background ships as a single image. BootScene
   mirrors it horizontally in a canvas to produce a seamless loop — no
   second image, no artist-authored tile.
4. **Source sprites stay oversized.** Power-up orbs are 1024×1024 source;
   rendered at 58–68 px via `setDisplaySize()`. Authoring once at high-res
   means no swapping per device.
5. **AAC over WAV.** Seven SFX total ~200 KB. The same clips as WAV would
   push past 2 MB on their own.
6. **No bundler, no framework.** Phaser loads from a CDN. ES modules import
   directly. **0 KB of build tooling, polyfills, or dependency duplication**
   ships to the player.

### How runtime generation looks in code

```js
// BootScene · zero-byte texture, drawn once at boot
_makePipe() {
  const w = 64, h = this.scale.height;
  const tex = this.textures.createCanvas('pipe', w, h);
  const ctx = tex.context;

  // gold cylinder: dark edges → bright highlight band ~42% across
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0.00, '#9a6e00');
  grad.addColorStop(0.42, '#ffd633');
  grad.addColorStop(1.00, '#9a6e00');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  tex.refresh();
}
```

> **Pattern: shared keys for placeholder & final art.** Placeholder textures
> use the same key the real file will use (`'pipe'`, `'star'`, `'sparkle'`).
> Swapping in real art is a one-line change in `BootScene.preload()` — every
> scene that uses the key picks it up automatically. Gameplay can be built
> and tested before any artist delivers a final asset.

---

## 06b — Visual reference

**The actual art, and how it composes on screen.** The five sprites below
are the entire visible cast of the game. Everything else — pillars,
particles, glows, vignettes — is drawn from code.

| Sprite | Source size | File size |
|---|---|---|
| `pbot.webp` — mascot | 432×578 | 80 KB |
| `ruby.webp` — currency | 512×512 | 68 KB |
| `magnet.webp` — aid power-up | 1024×1024 | 52 KB |
| `pwr.webp` — frenzy power-up | 1024×1024 | 76 KB |
| `game_logo.webp` — title art | 350×338 | 80 KB |

### What you see, layer by layer

1. **Background** — single WebP, mirrored at runtime into a seamless
   scrolling tile.
2. **Navy dim overlay** — 28% opacity rectangle. Pure code, makes the
   playfield pop.
3. **HUD strip** — translucent navy bar. Ruby count (left), TIME (right).
   Brand colors, no chrome.
4. **Gold pillars** — generated canvas gradient. Same texture, scaled to
   gap position.
5. **pbot** — single sprite, tilted toward velocity, squashed on flap.
6. **Rubies** — single sprite, spawned in singles or in line / wave /
   circle formations.
7. **Floor band** — translucent navy + yellow trim line. Two rectangles.

> **Observation.** Of the seven visible layers above, only three are loaded
> from disk (background, pbot, ruby). The remaining four are constructed in
> code. This is what keeps the bundle under 3 MB and the first frame fast.

---

## 07 — Game feel

**The polish budget.** Almost every interaction has a small response. None
of it is expensive, but the cumulative effect is the difference between a
prototype and a shippable game.

- **Tilt-to-velocity** — pbot rotates toward its vertical velocity each
  frame, clamped −25° to +70°. Sells the arc of a flap.
- **Squash on flap** — 80 ms scale yoyo (1.08× / 0.92×). Free, but makes the
  input feel tactile.
- **Sparkle + "+1"** — every ruby pickup emits a fading sparkle pop and a
  floating "+1". Reinforces the scoring loop visually.
- **Multi-phase crash** — flash → pillar white-out → cracks → shatter →
  mascot flies into camera → glass screen-crack → fade to Game Over. ~1.9s
  of pure drama.
- **Magnet aura** — pulsing concentric rings around pbot while the power-up
  is active. Status that doesn't need HUD real estate.
- **Rush visuals** — red vignette + speed lines + faint red mascot
  afterimages + the background races at 10× scroll speed.
- **Mirrored bg loop** — BootScene bakes a horizontal mirror so any
  background image loops seamlessly — no artist needs to author a tileable
  version.
- **Generous hit pads** — buttons have ~40 px invisible hit padding on
  every side. Edge taps still register on mobile.

---

## 08 — Replication patterns

Ten patterns to copy into your next game. Each is a self-contained design
or engineering choice that travelled well in Flying Ruby and should
transplant cleanly to any short-session arcade game.

### 1. One config file, named ranges
Put every tuning value in `config.js`. Use `{ start, end }` for anything
that ramps. Designers should never need to read scene code to re-tune.
**Why:** decouples designers from engineers. Most arguments about "make it
harder" become a one-line PR.

### 2. Endless within a fixed timer
Avoid stages for short sessions. Use one continuous round with a smooth
difficulty interpolation that peaks at ~85% of the round.
**Why:** players in a 3-minute window want one satisfying arc, not a
fragmented one with loading screens between bites.

### 3. Time as shared budget, not per-life cap
When the player crashes, give them a "Continue" that resumes with the same
score and the leftover clock. End the run only when the clock hits zero.
**Why:** reduces frustration; ensures the player always spends the full
advertised round; produces comparable leaderboard scores.

### 4. One currency, one number on the HUD
Resist multiple scores, tiers, or multipliers. Variety belongs in *how* the
currency appears, not in the currency itself.
**Why:** a single legible goal beats five competing ones. Players brag
about one number.

### 5. Cap the economy by tapering supply, never by clamping the counter
If you must cap a score for fairness or brand reasons, thin out spawn
probabilities as the player approaches the cap. Never freeze the counter
while pickups still spawn.
**Why:** the world calming down feels like difficulty. A frozen counter
feels like a bug.

### 6. Formations as cheap content
Build a handful of formation shapes (line, wave, circle) that share one
velocity. Rotate which one spawns. You get visual variety from a single
sprite.
**Why:** ten formations × one ruby sprite = ten distinct "moments" with no
extra art.

### 7. Two power-ups, two purposes
One *aid* power-up (magnet — makes the existing loop easier) and one
*frenzy* power-up (Power Rush — changes the loop briefly). Don't ship four.
**Why:** two power-ups can be balanced and explained on a title screen.
Four becomes a tutorial problem.

### 8. Placeholder textures with final keys
Generate stand-in textures in `BootScene` using the exact texture keys the
final art will use. Swapping later is a single `this.load.image()` line.
**Why:** gameplay can ship and be playtested before final art arrives. Art
and code parallelise.

### 9. Polish budget on every interaction
Every input gets a tactile response (squash, flash, sparkle, +1 float).
Death sequences earn 1–2 seconds of drama. Magnet and Rush each get a
distinct visual language.
**Why:** the gap between "prototype" and "shippable" is mostly tiny
tweens. They're cheap; ship them.

### 10. Dev shortcuts inside BootScene
Read a `?scene=` query param and jump straight to any scene with mocked
data. Persist user prefs (mute) before any audio plays.
**Why:** saves hours of click-through during testing. Costs four lines of
code.

---

## 09 — Build checklist

Use this as a pre-implementation worksheet. Each item maps directly to a
pattern from §08.

- [ ] Decide the session length first. Under 5 minutes? Use
      endless-with-timer; skip stages.
- [ ] Stand up `config.js` with palette, gravity, round duration, and
      `{ start, end }` ranges before writing any scene.
- [ ] Pick one currency. Name it. That's the only number on the HUD.
- [ ] Define two exit conditions: a soft one (crash with time remaining →
      continue) and a hard one (time up → final).
- [ ] Specify the difficulty arc: which values ramp, and at what % of the
      round they peak.
- [ ] List your power-ups. Cap at two: one aid, one frenzy. Each gets a
      distinct visual language.
- [ ] Decide drop odds as a probability table. Most rolls should be empty
      so the rare drops feel special.
- [ ] Specify any economy caps now. Implement as a taper on spawn
      probability, not as a counter clamp.
- [ ] Identify which textures are art (mascot, currency, power-ups,
      background) and which are generated (obstacles, particles, glows).
- [ ] Reserve a polish budget per interaction: flap response, pickup
      feedback, death sequence, power-up activation.
- [ ] Add a `?scene=` dev jump in BootScene from day one.
- [ ] Persist best score and mute preference in `localStorage`; guard with
      try/catch for sandboxed webviews.

---

## 10 — TL;DR

If you remember three things:

1. **Time-box, don't stage.** Short-session arcade games belong in one
   endless round with a smooth difficulty ramp. Stages are friction.
2. **One currency, one HUD number.** Make variety come from *how* rewards
   appear (formations, power-ups), not from competing score systems.
3. **Cap economies by thinning supply.** Never freeze a visible counter.
   Taper spawn probabilities as the player nears the cap — the world simply
   "calms down".

> **Closing thought.** Flying Ruby is small on purpose. Four scenes, one
> config file, two power-ups, one currency. The discipline of *not adding
> more* is what lets the polish budget land — and it's what makes the game
> feel finished in a way most prototypes never do.
