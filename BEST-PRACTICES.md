# Best Practices for JDP Arcade Games

> The canonical reference for how to design, build, and ship a short-session
> arcade game in this repo. The patterns below apply to **every new JDP
> game**; **Flying Ruby** (`flying-ruby/`) is the worked example that proves
> they hang together end-to-end, and is cited throughout as the reference
> implementation.

A slideable HTML version of the original Flying Ruby case study lives at
[`flying-ruby-case-study.html`](./flying-ruby-case-study.html) — useful for
presentations, but this Markdown is the in-repo, diff-able source of truth.
When the two disagree, **this Markdown wins** — open a PR to update the
HTML if they drift. When [CLAUDE.md](./CLAUDE.md) or [AGENTS.md](./AGENTS.md)
cite "the case study" or "best practices," they mean this file.

---

## Table of contents

1. [What "good" looks like for a JDP arcade game](#01--what-good-looks-like)
2. [Pick the simplest stack that ships](#01b--pick-the-simplest-stack)
3. [Architecture — scenes, one config file](#02--architecture)
4. [The core loop — endless within a timer](#03--the-core-loop)
5. [Gamification — one currency, two power-ups, many shapes](#04--gamification)
6. [Economy control — caps the player must not see](#05--economy-control)
7. [Asset management & optimization](#06--asset-management--optimization)
8. [Visual composition — drawing more than you ship](#06b--visual-composition)
9. [Game feel — the polish budget](#07--game-feel)
10. [Ten replication patterns](#08--replication-patterns)
11. [Build checklist](#09--build-checklist)
12. [TL;DR](#10--tldr)

Throughout, sidebars labeled **Reference: Flying Ruby** show how the
production game in `flying-ruby/` implements the pattern. Treat those as
worked examples, not as quotas your game must match.

---

## 01 — What "good" looks like

A JDP arcade game is a **short-session, child-safe, browser-native** game
that loads in seconds, plays cleanly on a phone, and gets out of the way.
The shape that consistently works:

| Dimension | Target |
|---|---|
| **Session length** | ~3 minutes of one continuous round (no stages, no loading screens). |
| **Goal** | Beat a single number. One currency on the HUD, full stop. |
| **Input** | Single-action core (tap / swipe / drag) that works on touch and on keyboard. |
| **Difficulty** | A smooth ramp that peaks at ~85% of the round. The final stretch sits at max difficulty. |
| **Failure** | Soft — crashing with time remaining offers a Continue. Only the clock truly ends a run. |
| **Tech** | Static HTML / CSS / JS. No backend, no bundler if avoidable, deployable to any static host. |
| **Polish** | Tactile response on every interaction; multi-phase death; "+1" feedback; mute toggle. |

> **Reference: Flying Ruby.** A Flappy-Bird-shaped game starring the Pandai
> mascot `pbot`. 3-minute round, ruby currency at +1 each, tap-to-flap with
> gravity `1200` / jump `-380`, tilt-toward-velocity body, glass-crack death.
> Phaser 3 from a CDN, ES modules, no build step. Demonstrates every
> pattern below in roughly 2.8 MB of payload.

---

## 01b — Pick the simplest stack that ships

**Default to vanilla.** A new JDP arcade game should start as **a single
`index.html` file with vanilla JavaScript and the HTML5 Canvas 2D API**.
No framework, no bundler, no WebGL shaders, no scene-graph library — just
one file you can open, read end-to-end, and ship. Most short-session
arcade games (one round, one currency, a handful of sprite types, ~30
on-screen entities at a time) do not need anything more than that.

| Decision | Default | Reach for more only when... |
|---|---|---|
| **JS framework** | None — vanilla JS | You need scene-graph, tween manager, or physics you'd otherwise hand-write badly |
| **Rendering** | Canvas 2D | Profiling shows Canvas 2D dropping frames with many sprites — **measure first, don't pre-optimize** |
| **File layout** | One `index.html` (CSS + JS inline). Optionally one sibling `game.js`. | The single file crosses ~1500 lines *and* has clear scene boundaries |
| **Build step** | None | Code-splitting or TypeScript is genuinely required to ship — rare for JDP games |
| **Audio** | Web Audio API (synthesized SFX, no asset files) | Recorded SFX/BGM clips are needed — then `.m4a` per §06 |
| **External assets** | Minimize. Google Fonts via CDN is fine. | The game's identity actually depends on bespoke art |

### Why vanilla first

Phaser is ~1 MB of framework before your first pixel renders. A
`requestAnimationFrame` loop, a few `ctx.fillRect` / `ctx.fillText`
calls, and a tiny `state` object is a few dozen lines. For the JDP
shape — 3-minute round, ~30 entities, one mascot, one currency — the
framework's scene graph, physics engine, and tween system are weight
the player pays for and the reviewer pays for, with little gameplay
benefit. A single self-contained HTML file is also dramatically easier
to review, port, and hand off.

### WebGL isn't "complex" — it's invisible

Phaser uses a WebGL renderer by default and the game developer never
writes a shader or touches the GL API. So the choice is **framework vs.
no framework**, not *Canvas vs. WebGL*. Avoiding WebGL as such is not
the point; avoiding framework weight is.

### When Phaser is the right call

Reach for Phaser (or a similar engine) when the game's polish budget
genuinely depends on its machinery:

- **Heavy particle moments** — multi-phase death sequences, frenzy
  speed-line bursts, mascot afterimages. Phaser's particle and tween
  managers are cheap; rewriting them in vanilla is not.
- **Choreographed tween chains** — e.g. flash → shatter → screen-crack →
  fade, with timing that has to land. Hand-rolled timer cascades get
  brittle fast.
- **Many scenes with managed assets** — Boot / Start / Game / GameOver
  each with their own preloads. Phaser's scene manager earns its weight
  here.

If your design doesn't need those, don't reach for Phaser. **The
default is vanilla.**

> **Reference: Susun** (`susun/`). A single ~920-line `index.html`.
> Vanilla JS, Canvas 2D isometric projection (`COS30` / `SIN30`
> trig constants, no engine), Web Audio synthesis for every SFX,
> `localStorage` for best score and mute, three-minute round, one
> currency capped at 500, streak tiers, multi-phase shake-and-tumble
> miss animation. Total payload well under 200 KB, no asset files
> beyond a Google Fonts CSS link. This is the shape every new JDP
> game should start from.

> **Reference: Flying Ruby** (`flying-ruby/`). Phaser 3 from a CDN, ES
> modules, four scenes, full tween-heavy polish (1.9-second crash
> sequence, magnet aura rings, rush vignette + speed lines). The case
> *for* reaching past vanilla: the crash sequence and frenzy mode
> genuinely benefit from Phaser's tween manager. If your game has
> matching polish ambition, the §02 architecture below applies. If it
> doesn't, stay in one HTML file.

> **Pre-existing single-file games** (`bubble-shooter/`, `liquid-sort/`,
> `puzzle/`, `ruby-rhythm/`, `tetra-blocks/`, `tic-tac-toe/`,
> `Wordscapes/`) already follow this shape. They predate this written
> guidance — and they're proof the pattern works.

---

## 02 — Architecture

> **This section applies when you've reached for Phaser per §01b.** If
> you're staying in a single vanilla HTML file (the default), your
> "architecture" is section comments inside one `<script>` block —
> typically `CONFIG`, `STATE`, `INPUT`, `UPDATE`, `DRAW`, `LIFECYCLE`,
> `AUDIO`. Susun (`susun/index.html`) is the worked example. Skip ahead
> to §03; the *design* patterns below (config-driven tuning, named
> ranges) still apply — they just live in a `const CONFIG = { ... }`
> object at the top of the file instead of a separate `config.js`.

**Scenes for shape, one config file for tuning.** Split your game so the
people who *tune* it (designers, PMs) never have to read the people who
*build* it (engineers, scenes). The canonical Phaser-shaped layout:

| File | Responsibility |
|---|---|
| `src/config.js` | Palette, round length, gravity, drop rates, power-up tuning. **All tuning.** Designers read this file. |
| `BootScene` | Preload assets · generate placeholder textures · honour saved mute pref · dev `?scene=` jump. |
| `StartScene` | Logo, mascot idle, Start button. Brand presentation, not logic. |
| `GameScene` | Full gameplay loop, difficulty ramp, spawning, power-ups, crash FX. One big scene is fine when the game has one round. |
| `GameOverScene` | Score count-up, best-score persistence, Continue vs Home routing. |
| `muteButton` (shared) | Mute toggle + `localStorage` preference. Every scene needs it. |

### Config that designers can read

Use a flat `config.js` with **named ranges** (`{ start, end }`) for any value
that changes over the round. The ramp becomes self-documenting; anyone can
re-tune the game in 30 seconds without reading scene code.

```js
// src/config.js — the only file most tuning ever needs to touch
export const GAME = {
  width: 480, height: 854,
  roundDurationMs: 3 * 60 * 1000,   // 3-minute round
  // ... game-specific physics constants
  rubyValue: 1,                      // payout per pickup
};

export const DIFFICULTY = {
  rampCompleteAt: 0.85,              // peak by 85% of round
  // Each ramping value is a named { start, end } range:
  obstacleSpeed:   { start: 234,  end: 410  },
  obstacleGap:     { start: 230,  end: 160  },
  spawnEveryMs:    { start: 1700, end: 1100 },
};

// Power-ups follow the same shape — one block per power-up
export const AID    = { spawnEveryMs: 8000,  spawnChance: 0.7, durationMs: 5000, /* ... */ };
export const FRENZY = { spawnEveryMs: 21000, spawnChance: 0.6, durationMs: 7000, /* ... */ };
```

> **Reference: Flying Ruby.** Its `config.js` defines `GAME`, `DIFFICULTY`,
> `MAGNET` (aid), and `RUSH` (frenzy). The pipe-gap / pipe-speed /
> spawn-interval ramps shown above are the real values from that file.

---

## 03 — The core loop

**Endless gameplay, time-boxed run.** "Endless but with a fixed clock" is
the structural backbone of a JDP arcade game. No stages, no level
transitions. Difficulty is a smooth interpolation across the round.

| | |
|---|---|
| **Round = budget** | The timer is a *shared budget across continues*, not a per-life timer. Crash early, resume with whatever time you had left. |
| **Two exit conditions** | Only **Time's Up** permanently ends a run. **Crash** with time remaining shows Continue. Once the time budget is spent, only Home remains. |
| **Difficulty arc** | Linear ramp from start values to end values, finished at **85%** of the round so the final ~15% sits at peak — a natural climax. |

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

Any value declared as `{ start, end }` in `config.js` can be ramped through
`_ramp(range)` each frame. New tuning ≈ one new field plus one call site.

> **Why no stages?** Stages create friction for short sessions. A 3-minute
> window is short enough that the player can finish a satisfying arc in one
> sitting; long enough that the difficulty ramp has somewhere to go. Use
> stages only when sessions are >5 minutes or when narrative beats demand
> them.

> **Reference: Flying Ruby.** 3-minute round, ramp peaks at 85% so the last
> ~27 seconds sit at maximum pipe speed and minimum gap. Crashing mid-round
> opens a Continue with the leftover clock.

---

## 04 — Gamification

**One currency, two power-ups, many shapes.** Keep scoring legible (one
number, one icon) but inject variety through *how* the currency appears:
formations, gap rewards, aid pulls, and a periodic frenzy event.

| Element | Mechanic | Player benefit | Designer lever |
|---|---|---|---|
| **Currency** | +1 (or +N) on overlap / collect | Single, legible goal | `GAME.<currency>Value` |
| **Risk reward** | Per-obstacle: empty / single / trio in the danger zone | Risk-vs-reward through the gap | Drop probabilities |
| **Lane / arena collectibles** | Between obstacles: empty / single / line / wave / circle | Visual rhythm and choreographed beats | Spawn odds + formations |
| **Aid power-up** | Brief pull / magnet / shield that *makes the existing loop easier* | Turns near-misses into pickups; reduces frustration | One config block |
| **Frenzy power-up** | Brief mode change: obstacles thin, world speeds up, currency rains | Big payout window, momentum reset | One config block |
| **Best score** | `localStorage['<game-name>:best']` | Meta-progression hook between sessions | Storage key |
| **Continue** | Resume after crash with leftover time | Reduces frustration, encourages full round use | Time-budget logic |

### Formations turn one sprite into a moment

A handful of formation shapes — line, wave, circle, arc — sharing a single
velocity is much cheaper than authoring real animations. The shape holds
together as it scrolls; the player reads each formation as a distinct
choreographed moment.

```js
// Lane spawn odds — most lanes empty so the rare formations feel special
const roll = Math.random();
if (roll < 0.73) return;                // 73% empty (breather)
if (roll < 0.85) spawnSingle();         // 12% single pickup
else if (roll < 0.91) spawnFormation('line5');
else if (roll < 0.96) spawnFormation('wave');
else                  spawnFormation('circle');
```

**Most rolls should be empty.** Empty space is what makes the rare drops
feel special. If every lane spawns something, nothing is special.

> **Reference: Flying Ruby.** Currency = rubies (+1 each). Aid = Magnet
> (5s pull). Frenzy = Power Rush (7s, world ×1.6, sine line of 50 rubies).
> Formations are `line5`, `wave`, `circle` — three shapes, one sprite, a
> dozen distinct beats per round.

---

## 05 — Economy control

**Caps the player must not see.** If a fairness or brand rule demands a
soft ceiling on score per round, do **not** clamp the counter, end the
round early, or stop spawning entirely. Each of those reads as a bug.

### Why a visible clamp fails

- **Stuck counter** — Score stops moving while pickup feedback ("+1" pops,
  sparkles) keeps playing. Players notice instantly and feel cheated.
- **Empty world** — Killing all spawns above the threshold leaves the player
  traversing nothing for the final stretch. Reads as a glitch.
- **Hard freeze** — Ending the round early breaks the "spend the full
  advertised time" contract the title screen made.

### Don't display the cap as a denominator

**Show the score alone — never `46 / 500`.** This is a separate mistake
from clamping, but in the same family: it makes the cap part of the HUD.

- A visible denominator turns the cap into a goal. The HUD reads as a
  checklist toward a known number, not an open run. Every "+1" pop feels
  like a tick toward an inevitable end rather than momentum in a
  continuing round.
- When the soft taper (below) kicks in around 90% of the cap, the
  visible gap slows in a way that reads as broken progression — the
  player can't tell whether their pickup rate dropped or the game
  cheated them. Without the denominator, the same taper is just
  "difficulty calming down."
- The cap is a tuning detail. Players didn't sign up to chase a number
  the dev picked; they signed up to chase the *highest* number they
  can hit. A denominator caps the brag.

```
HUD score pill
  ❌  46 / 500
  ✅  46
```

The same rule applies to the game-over card: `Score: 46` reads cleaner
than `Score: 46 / 500`. If the player maxes the cap, *that* is when a
`500 / 500 — MAX` badge earns its place — as a one-time celebration,
not as ambient HUD chrome.

> **Reference: Susun.** The game-over screen already shows the score
> alone (`b496591`); the in-game HUD pill still renders `0 / 500` and
> is the next thing to fix.

### Approaches ranked by how invisible they are

| Approach | How it works | Visibility |
|---|---|---|
| Hard clamp | `score = Math.min(cap, score + 1)` | Very obvious |
| Stop all spawns past threshold | Lane & gap rolls return empty after cap | Obvious |
| **Soft taper (recommended)** | Multiply spawn probabilities by `1 − smoothstep(taperStart, taperEnd, score)`. Suppress new high-payout power-ups within ~10% of cap. | Invisible |
| Pre-rolled per-round budget | Pick a target near cap at round start; spread spawns via inverse-CDF across the timeline | Invisible but rigid |

### The soft-taper pattern

```js
// Add to config.js
export const ECONOMY = {
  softCap:       500,
  taperStart:    420,   // begin thinning supply at this score
  taperEnd:      520,   // effectively no spawns past this
  frenzyBlockedAt: 430, // don't arm new frenzy bubbles here
};

// In GameScene — a single multiplier applied to every spawn roll
_supplyMultiplier() {
  const { taperStart, taperEnd } = ECONOMY;
  const t = Phaser.Math.Clamp(
    (this.score - taperStart) / (taperEnd - taperStart), 0, 1
  );
  return 1 - (t * t * (3 - 2 * t));   // smoothstep
}

// Then in every spawn function:
if (Math.random() > this._supplyMultiplier()) return;
// ...existing odds roll continues here
```

> **Why this works.** The world simply "calms down" near the end — which
> already happens with the difficulty ramp. Empty lanes during the final
> stretch read as difficulty, not deprivation. The HUD keeps counting up;
> feedback keeps popping; the game keeps its promise.

> **Reference: Flying Ruby.** Today, score is unbounded. If a 500-ruby cap
> is added, the values above (taperStart 420, taperEnd 520, Power Rush
> blocked at 430) are the recommended starting tuning.

---

## 06 — Asset management & optimization

**Every kilobyte is a deliberate choice.** A JDP game should fit comfortably
under the **3 MB** total-payload target (5 MB hard cap). Hit that envelope
by choosing formats per-asset-type, generating runtime art for anything
math can produce, and shipping no build-tooling bytes.

### Folder layout — sorted by load order & intent

**For vanilla single-file games (the §01b default):** the layout is just
`<game-name>/index.html`. If you genuinely need bespoke art or audio,
add `assets/`, `sfx/`, and `bgm/` siblings using the same format rules
below. Skip the rest of this layout.

**For Phaser-shaped games:**

```
<game-name>/
├── index.html                       # entry · loads Phaser from CDN + src/main.js
├── src/                             # scenes + config — code only, no bundler
│   ├── config.js
│   ├── main.js
│   └── scenes/
├── assets/
│   ├── sprites/                     # character art with transparency (WebP lossless)
│   └── backgrounds/                 # solid art, no alpha (WebP lossy)
├── sfx/                             # short, one-shot AAC clips
└── bgm/                             # looping AAC tracks
```

> **Foldering principle.** Folder name = file family + lifecycle.
> `sprites/` = drawn-frequently with alpha. `backgrounds/` = drawn-once, no
> alpha. `sfx/` = one-shot. `bgm/` = looped. A new engineer never has to
> ask where to put a new file.

### Format choices — and what each one saves you

| Asset family | Format | Alternative | Saving | Why this format |
|---|---|---|---|---|
| Sprites & logos | **WebP (lossless, RGBA)** | PNG-24 | ~30–50% | Same crisp transparency as PNG, smaller file. Universal browser support since 2020. |
| Backgrounds | **WebP (lossy, RGB)** | JPEG | ~25–35% | No alpha needed; lossy WebP beats JPEG at the same perceptual quality. |
| SFX (short clips) | **AAC / m4a** | WAV / MP3 | ~10× vs WAV | Sounds identical at gameplay volumes; plays on every browser without licensing concerns. |
| BGM (long loops) | **AAC / m4a** | MP3 | ~15% smaller | Better quality-per-byte than MP3 at the same bitrate; loops cleanly. |
| Pillars, sparkles, vignettes, gradients | **Generated at runtime** | PNG | ~100% saved | A gradient or a 4-point star is cheaper to draw than to download. |

**No PNG. No JPEG. No WAV. No MP3 for new builds.** If a specific asset
needs to break this rule, document why in the game's own `CLAUDE.md`.

### File-size targets per asset

| Asset | Target | Hard cap |
|---|---|---|
| Individual sprite | <100 KB | 200 KB |
| Background image | <800 KB | 1.5 MB |
| SFX clip | <50 KB | 100 KB |
| BGM track | <1.5 MB | 2 MB |
| **Total game payload** | **<3 MB** | **5 MB** |

### Six optimization tactics in play

1. **WebP everywhere.** Lossless for sprites, lossy for the background.
2. **Generate before download.** Obstacles, sparkles, dust, vignettes —
   draw them in code at boot. **Zero bytes** shipped for any of them.
3. **Mirror to tile.** Ship one background image; mirror it horizontally
   in a canvas at boot to produce a seamless loop. No artist-authored tile.
4. **Source sprites stay oversized.** Author at 1024×1024 if you want,
   render via `setDisplaySize()`. One asset, every device.
5. **AAC over WAV** for all audio.
6. **No bundler, no framework** unless required. **0 KB of build tooling,
   polyfills, or dependency duplication** ships to the player.

### How runtime generation looks in code

```js
// BootScene · zero-byte texture, drawn once at boot
_makeObstacle() {
  const w = 64, h = this.scale.height;
  const tex = this.textures.createCanvas('obstacle', w, h);
  const ctx = tex.context;

  // dark edges → bright highlight band ~42% across
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0.00, '#9a6e00');
  grad.addColorStop(0.42, '#ffd633');
  grad.addColorStop(1.00, '#9a6e00');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  tex.refresh();
}
```

> **Pattern: shared keys for placeholder & final art.** Generate
> placeholders in `BootScene` using the **same key** the real file will use
> (`'obstacle'`, `'star'`, `'sparkle'`). Swapping in real art is a one-line
> change in `BootScene.preload()` — every scene that uses the key picks it
> up automatically. Gameplay can be built and playtested before any artist
> delivers a final asset.

> **Reference: Flying Ruby.** Ships in **2.8 MB across 16 files**. Five
> sprites (`pbot`, `ruby`, `magnet`, `pwr`, `game_logo`, all WebP, each
> 52–80 KB), one background (`bg.webp`, 720 KB), seven SFX (~200 KB total),
> three BGM tracks (`start-bgm`, `game-bgm`, `pwr-up`, 1.5 MB combined).
> Pipes, sparkles, dust, and the rush vignette are drawn at boot — zero
> bytes downloaded for any of them.

---

## 06b — Visual composition

**Draw more than you ship.** A typical JDP game frame stacks 6–8 visible
layers, but only 2–4 of them are loaded from disk. Everything else —
chrome, particles, gradients, overlays — is drawn from code in `BootScene`
or each scene's `create()`.

### Generic frame composition (layered back-to-front)

1. **Background** — single image, optionally mirrored at runtime for a
   seamless loop.
2. **Dim overlay** — translucent navy rectangle. Pure code, makes the
   playfield pop without darker art.
3. **Playfield art** — generated canvas textures (obstacles, lanes, walls)
   scaled to gameplay positions.
4. **Mascot / player** — single sprite; rotate / squash / tint in response
   to input.
5. **Currency & power-ups** — single sprite per type, spawned in singles or
   formations.
6. **HUD strip** — translucent bar, brand colors, the one HUD number on one
   side, the timer on the other. No chrome.
7. **Effects layer** — sparkles, "+1" floats, auras, vignettes. All
   generated at runtime.
8. **Modal / overlay** — Continue prompt, mute button, NEW BEST! pop.

> **Observation.** Of the eight layers above, typically only the
> background, mascot, and currency sprite are loaded from disk. The rest is
> constructed in code. **This is what keeps the bundle under 3 MB and the
> first frame fast.**

> **Reference: Flying Ruby.** Visible cast on disk: `pbot` (mascot, 432×578,
> 80 KB), `ruby` (currency, 512×512, 68 KB), `bg` (720 KB). Pipes, dim
> overlay, HUD strip, floor band, sparkles, "+1" floats, magnet rings, rush
> vignette — all drawn from code.

---

## 07 — Game feel

**The polish budget.** Almost every interaction should have a small visual
response. None of it is expensive, but the cumulative effect is the
difference between a prototype and a shippable game.

Mandatory polish for any JDP game:

- **Tactile input response.** Squash on tap (80 ms scale yoyo, 1.08× /
  0.92×), button press scale-down, etc. Free, but makes the input feel
  alive.
- **Pickup feedback.** Sparkle pop + floating "+1" (or equivalent) on every
  collect. Reinforces the scoring loop visually.
- **Multi-phase death.** At least three phases — e.g. flash → object
  shatter → screen effect → fade. Earn 1–2 seconds of drama.
- **Power-up activation effects.** A ring, a label, and an aura on every
  power-up. The aura is your status indicator — it frees HUD real estate.
- **Urgent HUD.** Turn red / pulse in the final 10 seconds of the round.
- **"NEW BEST!" celebration** when the round beats `localStorage` best.
- **Generous hit pads.** ~40 px of invisible padding on every tappable
  button so edge taps register on mobile.

Optional but high-leverage:

- **Tilt-to-velocity.** Rotate the player sprite toward its movement vector
  each frame, clamped to a sensible range. Sells the arc of a jump or dash.
- **Mirrored background loop.** Bake a horizontal mirror so any background
  image loops seamlessly — no artist needs to author a tileable version.
- **Frenzy visuals.** Vignette + speed lines + mascot afterimages + the
  background racing at a higher scroll speed. Sells the mode change.

> **Reference: Flying Ruby.** Tilt clamped −25° to +70°, 80 ms squash on
> flap, sparkle + "+1" on every ruby, 1.9s multi-phase crash (flash →
> pillar white-out → cracks → shatter → mascot flies into camera → glass
> screen-crack → fade), magnet aura (pulsing concentric rings), rush
> visuals (red vignette + speed lines + 10× scroll). All built from tweens
> and runtime-generated textures.

---

## 08 — Replication patterns

Ten patterns to copy into every JDP game. Each is a self-contained design
or engineering choice that should transplant cleanly to any short-session
arcade game.

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
Build a handful of formation shapes (line, wave, circle, arc) that share
one velocity. Rotate which one spawns. You get visual variety from a single
sprite.
**Why:** ten formations × one sprite = ten distinct "moments" with no
extra art.

### 7. Two power-ups, two purposes
One *aid* power-up (makes the existing loop easier) and one *frenzy*
power-up (changes the loop briefly). Don't ship four.
**Why:** two power-ups can be balanced and explained on a title screen.
Four becomes a tutorial problem.

### 8. Placeholder textures with final keys
Generate stand-in textures in `BootScene` using the exact texture keys the
final art will use. Swapping later is a single `this.load.image()` line.
**Why:** gameplay can ship and be playtested before final art arrives. Art
and code parallelise.

### 9. Polish budget on every interaction
Every input gets a tactile response (squash, flash, sparkle, "+1" float).
Death sequences earn 1–2 seconds of drama. Aid and frenzy each get a
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
- [ ] Stand up `config.js` with palette, physics, round duration, and
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
- [ ] Reserve a polish budget per interaction: input response, pickup
      feedback, death sequence, power-up activation.
- [ ] Add a `?scene=` dev jump in BootScene from day one.
- [ ] Persist best score and mute preference in `localStorage`; guard with
      try/catch for sandboxed webviews.

---

## 10 — TL;DR

If you remember four things:

1. **Start in one HTML file with vanilla JS + Canvas 2D.** No framework,
   no bundler, no WebGL shaders. Reach for Phaser only when your polish
   budget genuinely demands its tween / particle / scene machinery.
2. **Time-box, don't stage.** Short-session arcade games belong in one
   endless round with a smooth difficulty ramp. Stages are friction.
3. **One currency, one HUD number.** Make variety come from *how* rewards
   appear (formations, power-ups), not from competing score systems.
4. **Cap economies by thinning supply.** Never freeze a visible counter.
   Taper spawn probabilities as the player nears the cap — the world simply
   "calms down".

> **Closing thought.** A JDP game should be small on purpose. A handful of
> scenes, one config file, two power-ups, one currency. The discipline of
> *not adding more* is what lets the polish budget land — and it's what
> makes the game feel finished in a way most prototypes never do. Flying
> Ruby is the proof that the recipe works end-to-end in under 3 MB.
