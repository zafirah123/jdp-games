# JDP Games — Development Guidelines

**Read this before starting any new game in this repo.**

Every JDP game ships from this repository to the public landing page at
`https://zafirah123.github.io/jdp-games/`. This document is the binding
contract for how new games should be designed, built, and shipped.

**Two reference implementations**, picked deliberately for different
ambition levels:

- [`susun/`](./susun/) — **vanilla JS + Canvas 2D, single `index.html`**.
  The default shape for a new JDP game per [BEST-PRACTICES.md §01b](./BEST-PRACTICES.md#01b--pick-the-simplest-stack).
  Start here.
- [`flying-ruby/`](./flying-ruby/) — **Phaser 3 from CDN**. The
  polish-heavy escape hatch: reach for it only if your design
  genuinely needs tween chains, scene management, or particle systems
  beyond what vanilla affords.

## Source of truth

The full reasoning, patterns, code samples, and asset-management deep-dive
live in the case study:

- **Best practices (canonical)**: [`BEST-PRACTICES.md`](./BEST-PRACTICES.md)
  — the in-repo, diff-able Markdown version of the Flying Ruby case study.
  **Read this before starting or reviewing any game.** §08 is the ten
  replication patterns, §09 is the pre-implementation checklist.
- **Slideable HTML**: [`flying-ruby-case-study.html`](./flying-ruby-case-study.html)
  (also live at https://zafirah123.github.io/jdp-games/flying-ruby-case-study.html)
  — the presentation-format version of the same material. If the two
  disagree, the Markdown wins.
- **Reference implementations**:
  - [`susun/index.html`](./susun/index.html) — **read this first.** Vanilla
    JS, Canvas 2D, single file, Web Audio synthesis. The default shape.
  - [`flying-ruby/`](./flying-ruby/) — Phaser-shaped polish-heavy
    reference. Read its
    [`src/config.js`](./flying-ruby/src/config.js) and
    [`src/scenes/GameScene.js`](./flying-ruby/src/scenes/GameScene.js)
    only if you're reaching for Phaser.

**Visual language**: [`DESIGN.md`](./DESIGN.md) is the source of truth for
colors, typography, spacing, radii, effects, and component anatomy. Read it
**before** writing any UI — HUD chips, buttons, progress bars, leaderboards,
tier badges, and mascot usage are all specified there. Per-game palette
overrides (in CSS variables or a `CONFIG`/`config.js` palette block) must
reconcile against the JDP 2026 tokens in DESIGN.md §1.

**Precedence when docs disagree**: BEST-PRACTICES.md wins over the HTML case
study; DESIGN.md wins on visuals; BEST-PRACTICES.md wins over this CLAUDE.md
on design patterns — open a PR to update this file when they drift.

---

## 0. Non-negotiables (every JDP game)

These four hold for **every** game in this repo — new builds and legacy
single-file games alike. If a change would break any of them, stop and
raise it before continuing.

### 0.1 Static HTML, no backend
The game ships as **static HTML + CSS + JS only**. No server, no database,
no API calls to a backend you control. The deployed game must load and play
end-to-end from GitHub Pages (or any plain static host) with nothing more
than a browser. Third-party CDNs for libraries (Phaser, Tailwind) are fine;
private backends are not.

> Local dev still uses `python3 -m http.server` because browsers block
> `file://` ES-module loads — that's a dev-time convenience, not a runtime
> dependency. The shipped artifact stays static.

### 0.2 Plays on desktop, mobile, and tablet
Every game must be usable on:

- **Desktop** — keyboard and/or mouse, any viewport ≥1024 px wide.
- **Mobile phones** — portrait, touch input, viewports as narrow as 360 px.
- **Tablets** — both orientations, touch input.

Practical implications:

- Resize the canvas to the viewport on `window.resize` (and apply
  `devicePixelRatio` for crispness) so the game scales without clipping
  or letterboxing badly. Phaser games can use `Scale.FIT`; vanilla games
  set `canvas.width / height` directly per the Susun pattern.
- Every input must have a touch path — no keyboard-only controls. Tap, drag,
  and swipe targets ≥44×44 px.
- Test in browser dev-tools mobile emulation **and** on at least one real
  device before declaring done.
- Include `<meta name="viewport" content="width=device-width, initial-scale=1">`
  in every `index.html`.

### 0.3 Child-safe content (under-18 audience)
JDP's audience is school-age children. Every asset, mechanic, and bit of
copy must be appropriate for that audience:

- **No violence.** No blood, gore, weapons, combat, or "kill" framing. Use
  "crash", "miss", "out", or game-specific verbs instead. Death sequences
  (§6.2) should read as cartoonish *failure*, not harm — flash + shatter,
  not blood or injury.
- **No nudity, sexual content, or suggestive imagery.** Characters fully
  clothed. No innuendo in copy.
- **No gambling mechanics.** No loot boxes, real-money purchases, or
  randomized-reward loops disguised as core gameplay. (Power-up drops with
  *visible* odds are fine; spin-the-wheel monetization is not.)
- **No discriminatory or hateful language** in any string, including
  placeholder text. Review every visible word before shipping.
- **No tracking, ads, or third-party analytics** that profile children.
  `localStorage` for best score and mute is fine; sending player data
  anywhere is not.

If a mechanic forces a borderline judgement call, write the safer version
and ask the user before shipping the edgier one.

### 0.4 Suitable audio
Every game ships with sound, and every game ships with a working mute:

- **At minimum**: SFX for the primary action (tap/flap/launch), the pickup
  / score event, and the lose / round-end moment. Most games also want a
  short BGM loop.
- **Tone**: bright, friendly, arcade — match the under-18 audience. No
  jarring impacts, distorted bass, or anything that reads as "scary".
- **Format**: `.m4a` (AAC) per §5.2. No WAV / MP3 in new builds.
- **Mute toggle**: required in every scene per §6.3. Mute state persists in
  `localStorage` and is applied **before** any audio plays so a returning
  muted player never hears a sound.
- **Autoplay**: don't autoplay BGM until the player has interacted (browsers
  block it anyway). First tap on the start screen is the right trigger.

---

## 1. Core design rules

### 1.1 Use endless-within-a-timer for short sessions
Default session length is **3 minutes** of one continuous round.

- **No stages, no levels, no loading screens** for <5-minute sessions.
- Difficulty is a smooth linear interpolation that peaks at **~85%** of the
  round, so the final stretch sits at maximum difficulty.
- Use stages only when sessions are >5 minutes or narrative beats are
  required.

### 1.2 Time is a shared budget, not a per-life cap
If the player can die mid-round, offer a **Continue** that resumes with the
same score and the leftover clock. The round only truly ends when the timer
hits zero. This makes the advertised round length a promise the game keeps.

### 1.3 One currency, one HUD number
Resist multipliers, tiers, secondary scores, XP bars. Variety belongs in
**how** the currency appears (formations, power-ups, drop patterns), not in
the scoring system. Players brag about one number.

### 1.4 Cap the economy by tapering supply — never by clamping the counter
If a score cap is required (currently default cap is **500 rubies / round**):

- **Do not** freeze the counter at the cap — players notice instantly.
- **Do not** end the round early.
- **Do not** stop spawning entirely past the threshold — empty world reads
  as a bug.
- **Do** taper spawn probabilities as the player approaches the cap (e.g.
  `1 − smoothstep(420, 520, score)`). The world simply "calms down" — feels
  like difficulty, not deprivation.
- **Do** suppress new heavy-payout power-ups (Power Rush, big drops) once
  within ~70 of the cap; let already-armed ones finish naturally.

See [BEST-PRACTICES.md §05](./BEST-PRACTICES.md#05--economy-control) for the soft-taper code pattern.

### 1.5 Two power-ups maximum
One **aid** power-up (makes the existing loop easier — e.g. magnet) and one
**frenzy** power-up (briefly changes the loop — e.g. Power Rush). Each gets
a distinct visual language. Three or more becomes a tutorial problem.

---

## 2. The ten replication patterns

Each pattern below is mandatory unless you have a specific reason to deviate.
Full rationale in [BEST-PRACTICES.md §08](./BEST-PRACTICES.md#08--replication-patterns).

| # | Pattern | One-line rule |
|---|---|---|
| 1 | One config block, named ranges | All tuning in one place — `const CONFIG = { ... }` at top of file (vanilla) or `src/config.js` (Phaser). Use `{ start, end }` for any ramping value. |
| 2 | Endless within a fixed timer | One continuous round, smooth difficulty arc peaking at ~85%. |
| 3 | Time as shared budget | Crash + time remaining = Continue. Only the clock ends the run. |
| 4 | One currency, one HUD number | Resist multiple scores or multipliers. |
| 5 | Cap by tapering supply | Never clamp the visible counter. |
| 6 | Variants as cheap content | One underlying element + multiple variants (formation shapes, board layouts, sequence patterns, beat patterns) = visual variety for free. |
| 7 | Two power-ups, two purposes | One aid, one frenzy. Stop. |
| 8 | Placeholder textures with final keys | Generate stand-ins at boot using the same keys real art will use — `ctx.createCanvas` calls (vanilla) or `BootScene` (Phaser). |
| 9 | Polish budget on every interaction | Tactile response on every input (squash, sparkle, +1, flash). |
| 10 | Dev shortcuts at boot | `?scene=` / `?phase=` query jump + persisted user prefs (mute) before any audio plays. |

---

## 3. Build checklist — walk this before writing code

See also the more detailed pre-implementation checklist in
[BEST-PRACTICES.md §09](./BEST-PRACTICES.md#09--build-checklist).


- [ ] **Picked the simplest stack that ships.** Default: vanilla JS + Canvas 2D, single `index.html`. Reach for Phaser only if the design genuinely needs tween chains, particles, or many managed scenes (see [BEST-PRACTICES.md §01b](./BEST-PRACTICES.md#01b--pick-the-simplest-stack)).
- [ ] Decided session length. <5 min → endless-with-timer (no stages).
- [ ] Stood up the config block (top-of-file `const CONFIG` for vanilla, `src/config.js` for Phaser) with palette, gravity, round duration, and `{ start, end }` ramps before writing the game loop.
- [ ] Picked one currency. Named it. That's the only number on the HUD.
- [ ] Defined two exit conditions: soft (crash with time remaining → continue) and hard (time up → final).
- [ ] Specified the difficulty arc — which values ramp, peak at what %.
- [ ] Listed power-ups. Capped at two: one aid, one frenzy, distinct visuals.
- [ ] Wrote drop odds as a probability table. **Most rolls should be empty** so the rare drops feel special.
- [ ] Specified any economy caps. Implemented as a spawn-probability taper, not a counter clamp.
- [ ] Identified which textures are real art (mascot, currency, power-ups, background) vs generated (obstacles, particles, glows).
- [ ] Reserved polish budget per interaction: input response, pickup feedback, death sequence, power-up activation.
- [ ] Added a `?scene=` / `?phase=` dev jump at boot from day one.
- [ ] Persisted best score and mute preference in `localStorage` with try/catch for sandboxed webviews.
- [ ] Used the standardized strings from §6.4 — `START GAME`, `TIME'S UP!`, `GAME OVER`, `AUDIO ON`, `AUDIO OFF` — and wired `?lang=ms` to switch the game's copy to Bahasa Melayu.
- [ ] End-of-game modal CTA follows §6.5: `CLAIM SCORE` for score `> 0`, `RETRY` for score `= 0`; zero-score endings never submit a callback.

---

## 4. Tech stack defaults

**Start vanilla, single file.** Full rationale in
[BEST-PRACTICES.md §01b](./BEST-PRACTICES.md#01b--pick-the-simplest-stack).
The summary:

- **Rendering**: HTML5 Canvas 2D. Avoid WebGL shaders / 3D libraries —
  Canvas 2D is fast enough for ~30 entities at 60fps and dramatically
  simpler to read and review. (WebGL via Phaser is *invisible* — that's
  fine; it's hand-rolled shader code that's overkill.)
- **JS framework**: **None.** No React, Vue, no scene-graph library. The
  game is a `requestAnimationFrame` loop and a `state` object.
- **File layout**: One `index.html` with `<style>` and `<script>`
  inline. Optionally one sibling `game.js` if the script crosses
  ~1500 lines. **Susun (`susun/index.html`) is the canonical shape.**
- **Audio**: Web Audio API for synthesized SFX (no asset files needed —
  see Susun's `playTone` helper). Only ship recorded `.m4a` clips when
  the game's identity actually depends on bespoke audio.
- **No build step**: ship the source directly. No bundler, no
  TypeScript, no PostCSS.
- **Modules**: optional. `<script type="module">` is fine if you split
  files; the more common pattern is one `<script>` block.

### When to reach past vanilla (rare)

Phaser 3 from a CDN is the right escape hatch when:

- Polish needs heavy particle bursts or choreographed multi-tween
  sequences (Flying Ruby's crash sequence is the canonical example).
- The game has 4+ distinct scenes each with their own preloads.
- You'd otherwise reimplement Phaser's tween manager poorly by hand.

If you reach for Phaser: load it from a CDN, use ES modules, no bundler
(Ruby Breaker's Vite setup is a legacy exception, not a pattern to
follow). Follow [BEST-PRACTICES.md §02](./BEST-PRACTICES.md#02--architecture)
for the scene split.

### What to never reach for

- React, Vue, Svelte, or any UI framework for game code.
- 3D engines (Three.js, Babylon) — JDP games are 2D.
- TypeScript build pipelines — not worth the dependency weight for a
  ~1000-line game.
- A bundler "just in case."

### Local dev server pattern

```bash
# from the game folder
python3 -m http.server 8080
# then open http://localhost:8080
```

Browsers block `file://` ES-module loads, so even vanilla games served
as `<script type="module">` need a local HTTP server. Single-file games
with a plain `<script>` block will work from `file://` too, but use the
server during dev for consistency.

---

## 5. Asset management

### 5.1 Folder structure

**Vanilla single-file (default).** Most JDP games need only:

```
<game-name>/
└── index.html                      # everything: HTML, CSS, JS, config
```

If the game ships bespoke art or recorded audio, add siblings as
needed:

```
<game-name>/
├── index.html
├── assets/                         # WebP sprites + backgrounds
├── sfx/                            # AAC one-shots
└── bgm/                            # AAC loops
```

**Phaser-shaped (only when §4 says to reach for Phaser).** The full
layout:

```
<game-name>/
├── index.html                      # entry — Phaser CDN + src/main.js
├── src/
│   ├── config.js                   # ALL tuning — designers read this
│   ├── main.js                     # Phaser config + scene registration
│   └── scenes/                     # one file per scene
│       ├── BootScene.js
│       ├── StartScene.js
│       ├── GameScene.js
│       └── GameOverScene.js
├── assets/
│   ├── sprites/                    # transparent character art
│   └── backgrounds/                # solid, no alpha
├── sfx/                            # one-shot audio
└── bgm/                            # looping audio
```

Folder name = file family + lifecycle. A new engineer should never have to
ask where a new file goes.

### 5.2 Formats (mandatory)

| Asset type | Format | Why |
|---|---|---|
| Sprites with transparency | **WebP (lossless, RGBA)** | ~30–50% smaller than PNG-24 at same quality |
| Backgrounds (no alpha) | **WebP (lossy, RGB)** | ~25–35% smaller than JPEG at same perceptual quality |
| SFX (short clips) | **AAC / .m4a** | ~10× smaller than WAV; plays everywhere |
| BGM (long loops) | **AAC / .m4a** | ~15% better quality-per-byte than MP3 |
| Pillars, particles, glows | **Generated in BootScene** | Free; a gradient is cheaper to draw than to download |

**No PNG. No JPEG. No WAV. No MP3.** If you have a strong reason to break
this, document it in the game's own CLAUDE.md.

### 5.3 File size targets (per asset)

| Asset | Target | Hard cap |
|---|---|---|
| Individual sprite | <100 KB | 200 KB |
| Background image | <800 KB | 1.5 MB |
| SFX clip | <50 KB | 100 KB |
| BGM track | <1.5 MB | 2 MB |
| **Total game payload** | **<3 MB** | **5 MB** |

Flying Ruby ships in 2.8 MB across 16 files. Stay within that envelope.

### 5.4 Optimization tactics

1. **WebP for everything visual.** Lossless for sprites, lossy for backgrounds. (Skip entirely if your game has no asset files — Susun does.)
2. **Generate before download.** Pillars, sparkles, dust, vignettes — draw them in code at boot.
3. **Mirror to tile.** Ship one background; mirror it horizontally in canvas for a seamless loop. No tileable artwork needed.
4. **Sources stay oversized.** Author at 1024×1024 if you want, render scaled. One asset, every device.
5. **AAC over WAV** for any recorded audio. Web Audio API synthesis ships zero bytes — prefer it when the SFX palette is simple (taps, beeps, ticks).
6. **No bundler, no framework** unless required. Zero bytes shipped for build tooling.
7. **Shared keys for placeholder & final art.** Placeholders at boot use the same key/name the real file will use — swapping is one line.

---

## 6. Brand & polish requirements

### 6.1 Palette
Use the Pandai Design System 1.5 palette unless the game explicitly needs
its own. The canonical tokens (with role mappings to legacy Flying Ruby
names) live in [`DESIGN.md`](./DESIGN.md) §1 — consult it before adding new
colors. Define them once at the top of the file (CSS variables or a
`CONFIG` palette block) and reference them everywhere:

| Token | Hex | Used for |
|---|---|---|
| navy | `#020d26` | Backgrounds, HUD strips, deep shadow |
| royalBlue | `#1535a8` | Mid sky, obstacles |
| ruby | `#b81c26` | Mascot, currency, danger |
| darkRed | `#a21520` | Shadows, danger accents |
| yellow | `#fdd83d` | Highlights, buttons, score |
| orange | `#ffb800` | Glow, sun, accent |

Figma source: [Pandai Design System 1.5](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161)

### 6.2 Mandatory polish
Every game must ship with:

- Tactile input response (squash on flap, button press scale-down, etc.)
- Pickup feedback (sparkle pop + floating "+1" or equivalent)
- Death sequence with at least 3 phases (e.g. flash → object shatter → screen effect)
- Power-up activation effects (ring + label + aura)
- HUD that turns red / urgent in the final 10 seconds
- "NEW BEST!" celebration when applicable

For button states, progress-bar anatomy, score-pill chrome, and motion
durations, follow [`DESIGN.md`](./DESIGN.md) §4–§8. Don't invent button
shadows, border widths, or easings — they're already specified.

### 6.3 Mute & persistence
- Mute toggle visible whenever the game can make sound — fixed top-right
  corner is the convention. (For Phaser games: in every scene. For
  vanilla single-screen games: one DOM button positioned over the canvas
  is enough.)
- Mute preference saved to `localStorage`, applied before any audio plays
- Best score saved to `localStorage` under `<game-name>:best`
- All `localStorage` calls wrapped in try/catch for sandboxed webviews

### 6.4 Standardized UI copy & language switching

Five key strings must read identically across every JDP game. Don't
invent variants ("Time's up!" vs "TIME'S UP!" vs "Times Up" — pick the
one). Casing is **uppercase** for all five.

| Moment | English (default) | Bahasa Melayu (`?lang=ms`) |
|---|---|---|
| Round-start CTA on the title screen | `START GAME` | `MULA MAIN` |
| Round timer hit zero | `TIME'S UP!` | `MASA TAMAT!` |
| Run ended for any reason other than the timer (crash with no Continue, board fail, etc.) | `GAME OVER` | `PERMAINAN TAMAT` |
| Audio is currently playing (tap to mute) | `AUDIO ON` | `AUDIO ON` |
| Audio is currently muted (tap to enable) | `AUDIO OFF` | `AUDIO OFF` |
| End-of-game CTA (see §6.5 score rule) | `CLAIM SCORE` / `RETRY` | `TUNTUT SKOR` / `RETRY` |
| Claim unavailable state | `CALLBACK UNAVAILABLE` | `PANGGIL BALIK TIADA` |

**`TIME'S UP!` and `GAME OVER` are different states.** Use `TIME'S UP!`
only when the round timer hits zero — the natural end-of-round. Use
`GAME OVER` when the run ends *for any other reason* (fatal crash with
no Continue, board fail, lives exhausted). Games that can only end via
the timer will only ever show `TIME'S UP!`.

**Audio labels show current state**, not the pending action — the icon
beside the label is what implies the toggle action.

The Bahasa Melayu strings above are the canonical defaults; if a
designer hands you better translations, update this table first so every
game converges.

**Language switching is URL-driven.** Default is English. `?lang=ms` on
the URL switches the entire game's copy (including subtitles, button
labels, encouragement text — not just the five canonical strings) to
Bahasa Melayu.

```
https://zafirah123.github.io/jdp-games/flying-ruby/          → English
https://zafirah123.github.io/jdp-games/flying-ruby/?lang=ms  → Bahasa Melayu
```

Minimum implementation (works for vanilla single-file games):

```js
const lang = new URLSearchParams(location.search).get('lang') === 'ms'
  ? 'ms' : 'en';
const COPY = {
  en: { start: 'START GAME', timeUp: "TIME'S UP!", gameOver: 'GAME OVER',
        audioOn: 'AUDIO ON', audioOff: 'AUDIO OFF',
        /* ...game-specific strings... */ },
  ms: { start: 'MULA MAIN',  timeUp: 'MASA TAMAT!', gameOver: 'PERMAINAN TAMAT',
        audioOn: 'AUDIO ON', audioOff: 'AUDIO OFF',
        /* ...game-specific strings... */ },
}[lang];
```

Any unrecognized `lang` value falls back to English. Don't persist the
language choice across visits — the URL is the source of truth so links
shared between players carry the intended language.

### 6.5 End-of-game flow: CLAIM SCORE (score > 0), RETRY (score = 0)

When a run truly ends — whether the modal headline is `TIME'S UP!` (timer
expired) or `GAME OVER` (run ended for any other reason) — the final
modal has **one CTA** on the end-of-game modal, with score-dependent behavior:

| Moment | English (default) | Bahasa Melayu (`?lang=ms`) |
|---|---|---|
| End-of-game CTA (`score > 0`) | `CLAIM SCORE` | `TUNTUT SKOR` |
| End-of-game CTA (`score = 0`) | `RETRY` | `RETRY` |

For score `> 0`, tapping the CTA attempts callback submission.
For score `= 0`, tapping `RETRY` restarts locally and does not submit callback.

Callback target resolution order:

1. Use `callback_url` from query params when provided.
2. If absent/invalid, use the platform callback fallback configured by
   product.
3. Do not hardcode a public callback URL into game code.
4. Validate callback URLs and only allow valid `https` callback targets.
5. Claim URL generation must fail closed. If callback preparation cannot be
   completed, return `null` / unavailable instead of throwing where possible.

Minimum payload fields:

| Field | Value | Notes |
|---|---|---|
| `game` | kebab-case folder name, matching `games.js` path (e.g. `flying-ruby`, `tap-tap-match`, `tic-tac-toe`) | URL-encode / serialize safely |
| `score` | integer final score (0–500 target per §1.4, unless game-specific override) | No commas/padding/formatting |
| `token` | random nonce generated client-side at submit time | UUID v4 or 16+ random hex chars |

Optional payload fields:

| Field | Purpose | Notes |
|---|---|---|
| `suspicious` | Local anti-abuse signal | Boolean set by an in-game heuristic check |
| `suspicious_reason` | Why flagged | Short string/code, no sensitive data |
| `log` | Lightweight run diagnostics | Keep small; no PII, no child profiling/tracking |

Minimum implementation (callback URL source + payload assembly):

```js
const GAME_NAME = 'flying-ruby';

function resolveCallbackUrl() {
  const qs = new URLSearchParams(location.search);
  const candidate = qs.get('callback_url');
  if (candidate) {
    try {
      const u = new URL(candidate);
      if (u.protocol === 'https:') return u.toString();
    } catch (_) {}
  }
  // Platform-managed fallback (product-owned). Keep game code decoupled
  // from hardcoded public callback paths.
  const fallback = (typeof window !== 'undefined' && window.__JDP_CALLBACK_URL__)
    ? window.__JDP_CALLBACK_URL__
    : null;
  if (!fallback) return null;
  try {
    const u = new URL(fallback);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch (_) {
    return null;
  }
}

function buildClaimPayload(finalScore, extra = {}) {
  const token = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return { game: GAME_NAME, score: Math.max(0, finalScore | 0), token, ...extra };
}
```

For the final handoff, prefer building a callback URL and redirecting with
`window.location.href` / `location.href`. In-app WebViews are less reliable
with `fetch`-first score submission, especially when the host app expects a
navigation-based callback.

Claim CTAs must be single-submit safe. Disable the CTA on the first tap
before resolving or navigating to the callback URL, keep it disabled while
the handoff is in progress, and only re-enable it on a recoverable local
failure. If callback preparation fails because launch/callback context is
missing, expired, malformed, or invalid, keep the CTA disabled and show the
standard unavailable copy instead of leaving the CTA apparently tappable:
`CALLBACK UNAVAILABLE` (en) / `PANGGIL BALIK TIADA` (ms).

If claim URL generation depends on async work, prefer a two-step handoff:
prepare the final URL as soon as the end-of-game state is shown, cache it,
and then perform a synchronous `window.location.assign(...)` /
`location.href = ...` inside the final tap handler. This is especially
important for Safari / WKWebView, where awaiting WebCrypto or other async
work inside the tap handler can cause the later navigation to be dropped as a
stale user gesture with no visible error.

Timeout handling follows the same rule: if a player times out and then taps
`CLAIM SCORE`, either the callback still resolves and the page redirects, or
the CTA transitions into the unavailable state above. It must never remain a
dead clickable button.

Recommended helper shape for copied claim code:

```js
function prepareClaim(finalScore, extra = {}) {
  const score = Math.max(0, finalScore | 0);
  if (score === 0) return { mode: 'retry' };
  const callbackBase = resolveCallbackUrl();
  if (!callbackBase) return null;
  try {
    const url = new URL(callbackBase);
    const payload = buildClaimPayload(score, extra);
    Object.entries(payload).forEach(([key, value]) => {
      if (value != null) url.searchParams.set(key, String(value));
    });
    return { mode: 'claim', url: url.toString() };
  } catch (_) {
    return null;
  }
}
```

When shipping claim-flow changes, bump the versioned script or module URL
used by the game (for example `claim-callback.js?v=...` or `main.js?v=...`,
plus any ES-module imports behind it). Likewise, if a single-file game's
start screen or HUD references shipped images directly (for example
`assets/start/bg.webp`, mascot art, gem art, or other static `<img src>` /
CSS `url(...)` assets), bump those asset URLs too. Some in-app WebViews cache
old JS and static assets aggressively, so a version bump is the safest way to
ensure the updated behavior and art are actually what runs.

**Early end is required.** In addition to the final end-of-game modal, every
game must provide a player-accessible way to end the run early and submit the
current score through the same callback contract.

**Suspicious-score checks are optional.** If implemented, run them locally
before callback submission and annotate payload with `suspicious` and
`suspicious_reason`. Do not block submission solely due to the local flag.

**Run logs are optional.** If implemented, include compact diagnostic fields
only (for example `duration_ms`, `actions`, `max_combo`, `avg_interval_ms`).
Never include personal data or third-party tracking identifiers.

**Continue ≠ CLAIM SCORE.** Games that offer a `CONTINUE` prompt when the
player crashes with time remaining still show that prompt as before
(§1.2 — time is a shared budget across continues). CLAIM SCORE only
appears on the **final** end-of-game modal — after `TIME'S UP!`, or
after the player declines `CONTINUE` on a crash with no time left.

**Restart exception for zero-score endings.** A local `RETRY` is allowed
only when final score is exactly `0`. For any score `> 0`, keep the
single-CTA claim flow and do not offer in-page restart.

**Implementation checklist for future game authors**

- Use `RETRY` only for final score `= 0`; never submit zero-score callbacks.
- Resolve callback targets in order: `?callback_url=` → product fallback, and
  accept only valid `https` URLs.
- Make claim-preparation helpers fail closed and return `null` / unavailable
  instead of throwing where possible.
- If claim URL generation is async, prepare it before the final tap and keep
  the tap handler to a synchronous navigation commit.
- Disable the CTA immediately on tap and keep it disabled during preparation
  and redirect.
- On missing, expired, malformed, or invalid callback context, keep the CTA
  disabled and show `CALLBACK UNAVAILABLE` / `PANGGIL BALIK TIADA`.
- Support the same claim contract for player-triggered early-end and final
  timeout / game-over endings.

### 6.6 Genet callback override (when integrating under `public/games/genet/`)

If a game is being integrated for the Genet launcher flow, use this
callback contract instead of the generic `game/score/token` payload in §6.5.

- Read launch params from URL:
  - `token` (required)
  - `page_title` (optional)
- Decode JWT payload from `token` and read:
  - `res` (16-char AES key)
  - `callback_url`
- For score submission (`score > 0` only), redirect with query params:
  - `token` (original launch token)
  - `dd` (base64 AES-CBC encrypted payload JSON)
  - `dv` (base64 IV)
- Minimum decrypted payload:

```json
{
  "score": 10,
  "is_suspicious": false
}
```

- Any game-specific stats must be nested under `data`.
- Never submit score `0`; final score `<= 0` uses local `RETRY`.
- If token decode, callback extraction, or encrypted callback preparation
  fails, fail closed: return unavailable instead of throwing where possible,
  keep the CTA disabled, and show `CALLBACK UNAVAILABLE` /
  `PANGGIL BALIK TIADA`.
- Add a duplicate-submit guard (lock/flag) so one run cannot submit twice.
- If `page_title` exists, apply it to `document.title` and visible heading
  where applicable.
- Version static JS/CSS includes in `index.html` and bump monotonically
  (`YYYYMMDD.N`) on edits.
- If `index.html` references shipped static art directly (for example
  `assets/start/*.webp` in `<img>` tags or CSS `url(...)` rules), version
  those URLs too and bump them in the same pass as the related visual change.

Example:

```html
<script src="./src/main.js?v=20260529.1"></script>
<script src="./claim-callback.js?v=20260529.1"></script>
```

- For Phaser implementations, preferred scene flow remains:
  `BootScene` → `StartScene` → `GameScene` → `GameOverScene`.

---

## 7. Publishing a new game

The landing page has four sections. Three are backed by a `status` value in
[`games.js`](./games.js); the fourth (**Released — In Production**) is driven
by the `production` flag and takes precedence over the status buckets:

| `status` value | Section on landing page | When to use |
|---|---|---|
| `pending` | **Pending** | Default. Game is still in active build / not ready for either review. |
| `approved-dev` | **Approved — For Development** | Game has progressed far enough that the development team should review or pick it up. |
| `approved-design` | **Approved — For Design** | Game has progressed far enough that the design team should review or pick it up. |

### 7.0 Environment flags (`staging` / `production`)

Games in `approved-dev` may carry two optional boolean flags in
[`games.js`](./games.js) that record where the game is actually deployed:

| Flag | Meaning | Landing-page effect |
|---|---|---|
| `staging: true` | Game is live in the staging environment (`dev.pandai.org`). | Renders a green **STAGING ON** chip (click-through to the staging URL). |
| `production: true` | Game is live in the production environment (`app.pandai.org`). | Renders a green **PRODUCTION ON** chip **and** moves the game into the **Released — In Production** section. |

Mark these flags to match reality:

- Set `staging: true` once the game is deployed to `dev.pandai.org`.
- Set `production: true` once the game is deployed to `app.pandai.org`. This
  is the flag that surfaces the game under **Released — In Production** — the
  game's `status` stays `approved-dev`, but the `production` flag overrides
  which section it renders in.
- Leave a flag off (or omit it) until the game is genuinely live there. Don't
  set `production: true` speculatively — the section is a record of what has
  actually shipped.

**Example `games.js` entry with flags:**

```js
{ name: 'Your Game', path: './your-game/', status: 'approved-dev', author: 'your-github-username', staging: true, production: true },
```

### 7.1 Initial publishing flow

1. Build the game in its own top-level folder: `/<game-name>/`.
2. Verify it serves correctly via `python3 -m http.server` from the game folder.
3. Add an entry to [`games.js`](./games.js) with `status: 'pending'` **and**
   `author: '<your-github-username>'` — the landing page renders this under
   the game name so contributors are credited. `author` is required for
   every new game; do not omit it.
4. Open a PR. Reviewers will check this CLAUDE.md and [BEST-PRACTICES.md](./BEST-PRACTICES.md) against your work.

**Example `games.js` entry:**

```js
{ name: 'Your Game', path: './your-game/', status: 'pending', author: 'your-github-username' },
```

### 7.2 Moving a game between lists — reminder steps

When your game is ready to be picked up by the development or design team,
**you** (the developer) request the move. Do **not** ask a reviewer to flip
the status for you.

**Before requesting a move, confirm:**

- [ ] The game runs cleanly on the latest `main` (pull, then test).
- [ ] All §8 "Definition of done" boxes are ticked.
- [ ] The game's own `CLAUDE.md` (if any) is up to date.
- [ ] [BEST-PRACTICES.md](./BEST-PRACTICES.md) and these guidelines are not contradicted by your build.

**Then:**

1. Pull `main` to make sure your edit applies cleanly.
2. Open a PR that changes **only** the `status` field of your game in
   [`games.js`](./games.js). Keep the diff to one line — no other edits.
3. Use a PR title in the form:
   `<Game name>: move to Approved — For <Development|Design>`
4. In the PR description, link to the most recent commit(s) that
   justified the move and tag the team that will pick it up.
5. Once merged, verify the game appears under the correct section on the
   live landing page.

**Reference diff:**

```diff
- { name: 'Flying Ruby', path: './flying-ruby/', status: 'pending' },
+ { name: 'Flying Ruby', path: './flying-ruby/', status: 'approved-dev' },
```

### 7.3 Rules

- A game lives in **exactly one section** at a time. To move it again later,
  open another PR flipping the status.
- A game with `production: true` always renders under **Released — In
  Production**, regardless of its `status` value — the `production` flag wins
  over the status bucket. Clear the flag (set it to `false` or omit it) to
  send the game back to its status-driven section.
- Don't add new status values without updating both [`index.html`](./index.html)
  (the `bucketFor()` function) and this document. Unknown / typo'd status
  values fall back to **Pending** so a bad value never drops a game off the
  landing page — but that fallback is a safety net, not a substitute for
  using the documented values.
- A move is reversible: you can flip `approved-dev` → `pending` if the game
  regresses, or clear `production` / `staging` if a deployment is rolled back.
  Be honest about it.

---

## 8. Definition of done

A game is shippable when it satisfies **all** of:

- [ ] Loads end-to-end from a static host with no backend (§0.1)
- [ ] Plays on desktop, mobile (portrait, ≥360 px), and tablet — touch + keyboard paths (§0.2)
- [ ] Content reviewed against §0.3 — no violence, nudity, gambling, ads, or tracking
- [ ] SFX for primary action, pickup, and round end; BGM if appropriate; mute applied before audio (§0.4)
- [ ] Stack picked deliberately per §4 — vanilla single-file by default, Phaser only with justification
- [ ] Single endless round with a fixed timer (or stages with a documented reason)
- [ ] One currency, one HUD number
- [ ] Two power-ups max
- [ ] Difficulty ramp tuned in the config block, peaks at ≤85% of round
- [ ] Economy cap (if any) implemented as a spawn taper, never as a counter clamp
- [ ] Total payload ≤3 MB (target) / ≤5 MB (hard cap)
- [ ] Any shipped images are WebP, any shipped recorded audio is AAC (or Web Audio synthesis for SFX)
- [ ] Folder layout matches §5.1 (single-file or Phaser variant, as appropriate)
- [ ] Polish checklist (§6.2) complete
- [ ] Visuals reconciled against [`DESIGN.md`](./DESIGN.md) (palette, typography, button/pill/progress-bar anatomy)
- [ ] Mute toggle + best score persistence working
- [ ] Standardized end-of-game / audio copy used (§6.4); `?lang=ms` switches the game to Bahasa Melayu
- [ ] End-of-game modal follows §6.5 — score `> 0` uses `CLAIM SCORE` callback CTA (payload includes `game`, `score`, random `token`); score `= 0` uses local `RETRY`
- [ ] Game supports `callback_url` query param and platform fallback callback target
- [ ] Game supports player-triggered early-end callback (same payload contract)
- [ ] Claim CTA disables on first tap, stays disabled during preparation/redirect, and remains disabled with `CALLBACK UNAVAILABLE` / `PANGGIL BALIK TIADA` when callback context is missing, expired, malformed, or invalid
- [ ] Claim-flow script/module URLs are version-bumped when shipping callback changes, especially for in-app WebView launches
- [ ] If using Genet launcher integration (§6.6), callback submit uses encrypted `token` + `dd` + `dv`, includes duplicate-submit guard, and never submits score `0`
- [ ] Optional suspicious-score check (if present) runs locally pre-submit and flags payload
- [ ] Optional `log` payload (if present) is lightweight and excludes PII/tracking
- [ ] Dev jump via `?scene=` / `?phase=` query param wired from day one
- [ ] Listed in `games.js` with `author: '<github-username>'` set

---

## Per-game overrides

If a game has specific dev notes (build pipeline, source location, etc.),
place a `CLAUDE.md` inside that game's folder. See
[`ruby-breaker-v2/CLAUDE.md`](./ruby-breaker-v2/CLAUDE.md) for an example.
Per-game CLAUDE.md files override this root document **for that game only**.

---

## Appendix A: Repo overview

The repo hosts a mix of vanilla single-file games (the §4 default shape)
and Phaser builds (the polish-heavy escape hatch). This appendix
documents the existing inventory and the conventions for editing them.

### A.1 Run locally (from repo root)

```bash
# from the repo root
python3 -m http.server 8080
# then open http://localhost:8080/
```

Games that use ES modules or `fetch` (most of them) require an HTTP server —
`file://` will fail. When iterating on a single game, deep-link to it (e.g.
`http://localhost:8080/flying-ruby/`).

### A.2 Game inventory

| Folder | Entry | Tech | Notes |
|--------|-------|------|-------|
| `bubble-shooter/` | `index.html` | Vanilla JS + Tailwind CDN, canvas | Single file, all inline |
| `flying-ruby/` | `index.html` | Phaser 3 (CDN), ES modules in `src/` | Reference implementation; see folder [README](flying-ruby/README.md) |
| `liquid-sort/` | `liquid-sort.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `puzzle/` | `puzzle.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `ruby-breaker-v2/` | `index.html` | Phaser 3 + Vite (bundled) | **Deployed bundle.** Source lives outside this repo — see [folder CLAUDE.md](ruby-breaker-v2/CLAUDE.md) |
| `ruby-rhythm/` | `index.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `susun/` | `index.html` | Vanilla JS, plain CSS, Canvas 2D, Web Audio | **Canonical vanilla single-file reference** — see [BEST-PRACTICES.md §01b](./BEST-PRACTICES.md#01b--pick-the-simplest-stack) |
| `tetra-blocks/` | `tetra-blocks.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `tic-tac-toe/` | `tic-tack-toe.html` | Vanilla JS, plain CSS, canvas | 5×5 vs AI, single file |
| `Wordscapes/` | `wordscapes.html` | Vanilla JS + Tailwind CDN, canvas | Single file |

### A.3 Editing existing games

These rules apply when modifying any game already in the inventory.
§1–8 still govern *new* builds; these rules just keep edits to existing
games disciplined.

1. **Stay in-folder.** A change to Ruby Rhythm must not touch any other
   game's files. There are no shared modules to keep "in sync"; if you find
   yourself wanting one, raise it first.
2. **Single-file games stay single-file.** Don't split inline `<style>` or
   `<script>` into separate files just because they're long — the deploy
   model assumes one file per game.
3. **Don't hand-edit `ruby-breaker-v2/assets/index-*.js`.** That file is a
   minified Vite bundle. Read [ruby-breaker-v2/CLAUDE.md](ruby-breaker-v2/CLAUDE.md)
   before touching anything in that folder.
4. **No build/test commands to run at the root.** No `npm test`, no linter,
   no type checker. Verify changes by **playing the game in a browser**
   after `python3 -m http.server 8080`.
5. **Tailwind via CDN is the convention for single-file games.** Don't
   introduce a Tailwind build pipeline or PostCSS config.

### A.4 Mascot & conventions

- **Mascot:** "pbot" — the Pandai robot character. Reuse the existing
  sprite from `flying-ruby/assets/sprites/` or `ruby-breaker-v2/pbot.png`
  rather than redrawing.
- **File names:** kebab-case folders; entry file is `index.html` where
  possible.
- **Comments:** keep them minimal. The codebase is small enough to read.

### A.5 Deployment

GitHub Pages, served from the configured branch. `.nojekyll` is present so
all folders publish as-is. No CI workflows exist; pushing to the deploy
branch is the deploy. Verify the **landing page renders** and your game
loads at `https://<org>.github.io/pandaijdpgames/<your-game>/` after deploy.

### A.6 When in doubt

- Ask the user. The repo is small and tightly scoped — don't infer
  cross-cutting refactors from a one-game request.
- Don't introduce build tooling, package managers, or shared modules without
  explicit go-ahead.
- Read any per-folder `CLAUDE.md` or `README.md` before editing inside a
  game folder.

---

## Appendix B: Pulling design from Figma

Before reaching for Figma, check whether [`DESIGN.md`](./DESIGN.md) already
covers what you need — it mirrors the JDP 2026 components frame and is the
fastest path for routine UI work. Use the Figma MCP only when DESIGN.md is
silent on the component you're building, or when a designer has shipped a
new frame that hasn't been mirrored into DESIGN.md yet (refresh it with the
prompt at the top of that file).

For Claude Code, the cleanest workflow for picking up design context is the
**Figma MCP server**:

1. **Install the Figma plugin / MCP server.** In the Claude Code CLI:
   ```
   claude plugin install figma@claude-plugins-official
   ```
   Then sign in with your Figma account (must have **Dev Mode** access on
   the JDP file — that's a paid Figma seat at time of writing).
2. **In a chat with Claude Code**, paste the Figma node URL (e.g.
   `https://www.figma.com/design/vddfhrSU5UbbLmEJZMMlXd/...?node-id=326-302`).
   Claude can then call MCP tools to fetch:
   - Frame structure (layout, auto-layout direction, padding, gaps)
   - Text content and typography tokens
   - Color/fill tokens and gradients
   - Component variants and props
   - Exported PNG/SVG assets
3. **Translate to Tailwind/CSS by hand.** The MCP gives Claude the
   primitives; Claude writes idiomatic Tailwind classes or canvas draw calls
   that match the design — don't dump generated React/HTML directly. These
   games are vanilla and the output must stay readable as a single file.
4. **Save exported assets** under the relevant game folder
   (`<game>/assets/`). Follow the §5.2 format rules (WebP / AAC).

Current JDP 2026 components frame:
[Figma — Juara Digital Pandai 2026](https://www.figma.com/design/vddfhrSU5UbbLmEJZMMlXd/Juara-Digital-Pandai-2026?node-id=326-302&m=dev).

### Fallback paths if you don't have Figma Dev Mode

- **Manual handoff** — designer exports specs (colors, sizes, assets) into a
  shared doc or screenshots; Claude works from those.
- **Figma REST API** — possible with a personal access token, but more
  friction than the MCP server.
- **Design-tokens export** — use the *Tokens Studio for Figma* plugin to
  export JSON, then mirror the relevant tokens into a small shared CSS file
  if/when cross-game consistency becomes a need (don't do this prematurely).
