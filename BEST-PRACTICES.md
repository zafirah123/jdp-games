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
// Engine-agnostic — works in vanilla. Phaser games can substitute
// Phaser.Math.Clamp / Phaser.Math.Linear if preferred.
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const lerp  = (a, b, t)   => a + (b - a) * t;

function rampProgress(elapsedMs) {
  const rampMs = GAME.roundDurationMs * DIFFICULTY.rampCompleteAt;
  return clamp(elapsedMs / rampMs, 0, 1);
}

function ramp(range, elapsedMs) {
  return lerp(range.start, range.end, rampProgress(elapsedMs));
}
```

Any value declared as `{ start, end }` in your config can be ramped through
`ramp(range, elapsedMs)` each frame. New tuning ≈ one new field plus one
call site. The "value" doesn't have to be a physics constant — it can be a
flash duration, a beat gap, a sequence length, anything that scales with
time.

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
| **Currency** | +N on the success event (collect, complete-round, hit-beat, clear-board) | Single, legible goal | `GAME.<currency>Value` |
| **Reward variety** | Multiple variants of the same reward element — singles, formations, dense bursts, longer sequences, denser boards — appearing in changing patterns. Most rolls empty so rare ones feel special. | Visual rhythm and risk-vs-reward without inventing new scores | Variant probability table |
| **Aid power-up** | Brief effect that *makes the existing loop easier* — magnet pull, shield, slow-mo, peek-the-next-card | Turns near-misses into hits; reduces frustration | One config block |
| **Frenzy power-up** | Brief mode change that flips the loop's pace or rules — obstacles thin and currency rains, sequences shorten, multipliers spike, board fills with bonuses | Big payout window, momentum reset | One config block |
| **Best score** | `localStorage['<game-name>:best']` | Meta-progression hook between sessions | Storage key |
| **Continue** | Resume after failure with leftover time | Reduces frustration, encourages full round use | Time-budget logic |

### Variants turn one element into many moments

A handful of variants — line / wave / circle / arc for a scrolling game;
alternating board layouts for a puzzle; different sequence patterns or
grid-cell rhythms for a memory game; beat-pattern variations for a
rhythm game — built on a single underlying element is much cheaper than
authoring bespoke content for each. The player reads each variant as a
distinct choreographed moment, even though the underlying sprite, board
cell, or grid tile is the same.

```js
// Scrolling-game example: lane spawn odds.
// Most lanes empty so the rare formations feel special.
const roll = Math.random();
if (roll < 0.73) return;                // 73% empty (breather)
if (roll < 0.85) spawnSingle();         // 12% single pickup
else if (roll < 0.91) spawnFormation('line5');
else if (roll < 0.96) spawnFormation('wave');
else                  spawnFormation('circle');
```

```js
// Round-based example (memory / puzzle / rhythm): variant table
// rolled once at round start instead of per-frame.
const variant = pickWeighted([
  { name: 'random',     weight: 60 },   // baseline pattern
  { name: 'edges',      weight: 20 },   // visual identity moment
  { name: 'diagonals',  weight: 12 },
  { name: 'spiral',     weight:  6 },   // rare, feels earned
  { name: 'mirrored',   weight:  2 },   // showcase
]);
```

**Most rolls should be empty (or baseline).** Empty space — or the plain
variant — is what makes the rare variants feel special. If every round
ships a flourish, no round does.

> **Reference: Flying Ruby.** Currency = rubies (+1 each). Aid = Magnet
> (5s pull). Frenzy = Power Rush (7s, world ×1.6, sine line of 50 rubies).
> Formations are `line5`, `wave`, `circle` — three shapes, one sprite, a
> dozen distinct beats per round.

---

## 05 — Economy control

**Target a 500-score ceiling per 3-minute round.** Every JDP game should
land within this envelope — it keeps leaderboards comparable across the
catalogue and gives the player one clear brag-number scale (a 500 run is
*the* perfect run). There are two legitimate ways to enforce it; pick one
based on whether your game has a supply lever to thin:

1. **Cap supply invisibly** — taper the spawn / payout lever as the player
   approaches 500. Recommended when the game has a natural supply lever
   (scrolling, spawning, dropping). See "The soft-taper pattern" below.
2. **Make 500 unrealistic** — escalate difficulty so hard near the cap
   that reaching it demands near-perfect play, while leaving the counter
   technically uncapped. Recommended when the game has no supply lever —
   rhythm beats, memory sequences, fixed-pace puzzles. See "The
   difficulty-escalation pattern" below.

Pick one path. Don't combine them, or the game both punishes *and*
under-pays the player at the same time.

**Caps the player must not see.** Whichever path you pick, do **not**
clamp the counter, end the round early, or stop spawning entirely. Each
of those reads as a bug.

### Why a visible clamp fails

- **Stuck counter** — Score stops moving while success feedback ("+1" pops,
  sparkles, chimes) keeps playing. Players notice instantly and feel cheated.
- **Empty world** — Killing all content above the threshold (spawns in a
  scroller, rounds in a memory game, beats in a rhythm game, boards in a
  puzzle) leaves the player with nothing happening for the final stretch.
  Reads as a glitch regardless of genre.
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
| Stop all content past threshold | Spawns / new rounds / new beats return empty after cap | Obvious |
| **Soft taper (recommended when supply exists)** | Multiply the reward-flow lever by `1 − smoothstep(taperStart, taperEnd, score)`. Suppress new high-payout power-ups within ~10% of cap. The lever is *spawn probability* for scrolling games, *per-round payout* for round-based games, *multiplier ceiling* for combo games. | Invisible |
| **Difficulty escalation (recommended when supply doesn't fit)** | Compound the §03 ramp so end values get harsher once score crosses ~80% of the cap — faster scroll, tighter timing windows, shorter recall pauses. Counter stays technically uncapped; in practice, hitting 500 demands near-perfect play. | Invisible |
| Pre-rolled per-round budget | Pick a target near cap at round start; spread reward events via inverse-CDF across the timeline | Invisible but rigid |

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

**Pick the lever that fits your game:**

| Genre | Spawn rolls? | Lever to multiply by `_supplyMultiplier()` |
|---|---|---|
| Scrolling shooter / runner | Yes | Per-spawn probability — exactly as above |
| Memory / Simon-style | No (rounds, not spawns) | Per-round point payout — round still happens, payout taper to zero |
| Puzzle / match | No | Per-clear point payout, or combo multiplier ceiling |
| Rhythm | No | Per-beat point payout, or speed-bonus weight |

> **Why this works.** The world simply "calms down" near the end — which
> already happens with the difficulty ramp. The visible event keeps
> firing (lane spawns, rounds completing, beats hitting); only the
> payout shrinks. The HUD keeps counting up; feedback keeps popping;
> the game keeps its promise.

> **Reference: Flying Ruby.** Today, score is unbounded. If a 500-ruby cap
> is added, the values above (taperStart 420, taperEnd 520, Power Rush
> blocked at 430) are the recommended starting tuning.

### The difficulty-escalation pattern

For games whose payout is structurally fixed — one beat hit = one point,
one round cleared = one point, one tile matched = one point — there is no
"supply" to multiply by zero. Tapering per-event payout in those genres
reads as the game cheating ("I hit the beat, why no point?"). The
alternative: leave the payout honest and make 500 *technically possible
but practically out of reach* by stacking a score-driven difficulty ramp
on top of the §03 time-driven one.

```js
// Add to config.js
export const ECONOMY = {
  softCap:     500,
  hardenStart: 400,   // begin compounding difficulty at this score
  hardenEnd:   500,   // peak score-driven difficulty here
};

// A second ramp, driven by score instead of elapsed time
function scoreHardness(score) {
  const { hardenStart, hardenEnd } = ECONOMY;
  return clamp((score - hardenStart) / (hardenEnd - hardenStart), 0, 1);
}

// Apply alongside the §03 time-based ramp — whichever is harder wins.
// Example: scroll speed climbs another ~50% past its time-based peak.
const t = rampProgress(elapsedMs);
const s = scoreHardness(score);
const speed = lerp(DIFFICULTY.scrollSpeed.start,
                   DIFFICULTY.scrollSpeed.end * 1.5,
                   Math.max(t, s));
```

**Levers that read as escalation, not punishment:**

- **Pace** — scroll / spawn / beat rate climbs another 30–60% past the
  §03 peak.
- **Timing windows** — perfect/good windows tighten on the same curve.
- **Hit pads** — collision / tap margins shrink toward (but never below)
  the §07 mobile-tap floor of ~40 px padding.
- **Distraction** — for memory/sequence games: faster reveal, shorter
  recall pause, an extra decoy flash.

> **Why this works.** The player still sees the world reacting to *them*
> — the game just gets genuinely hard. A 500 run reads as earned. A 487
> run reads as "I almost cracked it," not "the game ran out of points."

> **Don't combine patterns.** Pick supply-taper *or* escalation. Doing
> both means the player has to fight a harder game for a worse payout —
> the felt experience is "this stopped being fun" rather than "this got
> hard / this calmed down."

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

### Assets live inside the game's own folder

**Every sprite, background, SFX, and BGM file a game loads at runtime
must live inside that game's folder.** No cross-folder references, no
hotlinks to the open internet, no repo-wide shared asset libraries. Each
game is a self-contained, deployable unit.

| | Path | Verdict |
|---|---|---|
| ❌ Cross-folder | `<img src="../flying-ruby/assets/sprites/pbot.webp">` | Couples two games that shouldn't know about each other. Renaming, moving, or deleting either game silently breaks the other. |
| ❌ Internet hotlink | `this.load.image('pbot', 'https://example.com/pbot.webp')` | Breaks the moment the host changes a URL. Adds a DNS / TLS hop to the first paint. Risks loading content you haven't reviewed for §0.3 safety. |
| ❌ Repo-wide shared folder | `<img src="/shared/pbot.webp">` | Same coupling problem as cross-folder, scaled up — a shared-asset rename breaks every consumer. |
| ✅ In-folder relative | `<img src="./assets/sprites/pbot.webp">` | Self-contained, portable, deletable. What every JDP game already does. |

**To reuse art from another game, copy the file in.** The ~80 KB on disk
is cheaper than the coupling. Each game stays portable on its own and
can be moved, renamed, or removed without breaking siblings.

**The narrow exception: third-party libraries and web fonts.** Phaser
from a CDN, Tailwind from a CDN, Google Fonts from a CDN — those are
runtime dependencies of the engine / UI layer, not game content, and
CLAUDE.md §0.1 already permits them. Sprites, backgrounds, SFX, and BGM
are *not* in that category and must ship from inside the game folder.

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
3. **Playfield art** — generated canvas textures (obstacles, lanes, walls,
   grid cells, beat tracks, board tiles) scaled to gameplay positions.
4. **Mascot / player** — single sprite; rotate / squash / tint in response
   to input. *(Omit for non-character games — a memory grid or rhythm track
   has no on-screen player.)*
5. **Currency & power-ups** — single sprite per type, presented in singles
   or formations / variants.
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

Optional but high-leverage — applicability depends on your genre:

- **Tilt-to-velocity** *(character-with-physics games)*. Rotate the player
  sprite toward its movement vector each frame, clamped to a sensible
  range. Sells the arc of a jump or dash.
- **Mirrored background loop** *(scrolling games)*. Bake a horizontal
  mirror so any background image loops seamlessly — no artist needs to
  author a tileable version.
- **Frenzy visuals** *(when you ship a frenzy power-up)*. Vignette + speed
  lines + afterimages + the background racing at a higher scroll speed.
  Sells the mode change.
- **Round-end celebration** *(round-based games: memory, puzzle, rhythm)*.
  A short grid pulse, color sweep, or chime escalation when a round
  completes. Cheap; turns a discrete success into a felt moment, and
  keeps consecutive rounds from blurring together.
- **Sequence/board reveal animation** *(memory and puzzle games)*. A
  brief stagger as the next pattern lights up, instead of an instant
  swap. Gives the player a beat to orient.

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

### 6. Variants as cheap content
Build a handful of variants — formation shapes (line, wave, circle, arc)
for scrolling games, board layouts for puzzles, sequence patterns for
memory games, beat patterns for rhythm games — that share one underlying
element. Rotate which one appears. You get visual variety and pacing
rhythm from a single asset.
**Why:** ten variants × one element = ten distinct "moments" with no
extra art. The principle is genre-agnostic: vary the *arrangement* of one
thing instead of authoring many things.

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
- [ ] Target a 500-score ceiling for the 3-minute round. Pick **one**
      enforcement path: soft-taper supply (if a spawn/payout lever exists)
      *or* compound difficulty near the cap so 500 demands near-perfect
      play. Never implement as a counter clamp.
- [ ] Identify which textures are art (mascot, currency, power-ups,
      background) and which are generated (obstacles, particles, glows).
- [ ] Confirm every shipped asset (sprites, backgrounds, SFX, BGM) lives
      inside this game's own folder. No cross-folder references, no
      hotlinks. Copy assets in when reusing from another game.
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
4. **Cap the brag-number at 500 per 3-minute round.** If the game has a
   spawn/payout lever, taper it so the world "calms down" near the cap.
   If it doesn't, compound difficulty near 500 so reaching it demands
   near-perfect play. Pick one — never both. And never freeze a visible
   counter.

> **Closing thought.** A JDP game should be small on purpose. A handful of
> scenes, one config file, two power-ups, one currency. The discipline of
> *not adding more* is what lets the polish budget land — and it's what
> makes the game feel finished in a way most prototypes never do. Flying
> Ruby is the proof that the recipe works end-to-end in under 3 MB.
