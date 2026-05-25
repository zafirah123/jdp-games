# JDP Games — Development Guidelines

**Read this before starting any new game in this repo.**

Every JDP game ships from this repository to the public landing page at
`https://zafirah123.github.io/jdp-games/`. This document is the binding
contract for how new games should be designed, built, and shipped. It is
derived from the Flying Ruby case study, which is the canonical reference.

## Source of truth

The full reasoning, patterns, code samples, and asset-management deep-dive
live in the case study:

- **Live**: https://zafirah123.github.io/jdp-games/flying-ruby-case-study.html
- **Local**: [`flying-ruby-case-study.html`](./flying-ruby-case-study.html)
- **Reference implementation**: [`flying-ruby/`](./flying-ruby/) — read its
  [`src/config.js`](./flying-ruby/src/config.js) and
  [`src/scenes/GameScene.js`](./flying-ruby/src/scenes/GameScene.js) before
  designing your own.

When this document and the case study disagree, the case study wins — open a
PR to update this file.

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

See case study §05 for the soft-taper code pattern.

### 1.5 Two power-ups maximum
One **aid** power-up (makes the existing loop easier — e.g. magnet) and one
**frenzy** power-up (briefly changes the loop — e.g. Power Rush). Each gets
a distinct visual language. Three or more becomes a tutorial problem.

---

## 2. The ten replication patterns

Each pattern below is mandatory unless you have a specific reason to deviate.
Full rationale in case study §08.

| # | Pattern | One-line rule |
|---|---|---|
| 1 | One config file, named ranges | All tuning in `src/config.js`. Use `{ start, end }` for any ramping value. |
| 2 | Endless within a fixed timer | One continuous round, smooth difficulty arc peaking at ~85%. |
| 3 | Time as shared budget | Crash + time remaining = Continue. Only the clock ends the run. |
| 4 | One currency, one HUD number | Resist multiple scores or multipliers. |
| 5 | Cap by tapering supply | Never clamp the visible counter. |
| 6 | Formations as cheap content | Single sprite + multiple shapes (line, wave, circle) = visual variety for free. |
| 7 | Two power-ups, two purposes | One aid, one frenzy. Stop. |
| 8 | Placeholder textures with final keys | Generate stand-ins in BootScene using the texture keys real art will use. |
| 9 | Polish budget on every interaction | Tactile response on every input (squash, sparkle, +1, flash). |
| 10 | Dev shortcuts in BootScene | `?scene=` query jump + persisted user prefs (mute) before any audio plays. |

---

## 3. Build checklist — walk this before writing code

- [ ] Decided session length. <5 min → endless-with-timer (no stages).
- [ ] Stood up `src/config.js` with palette, gravity, round duration, and `{ start, end }` ramps before writing any scene.
- [ ] Picked one currency. Named it. That's the only number on the HUD.
- [ ] Defined two exit conditions: soft (crash with time remaining → continue) and hard (time up → final).
- [ ] Specified the difficulty arc — which values ramp, peak at what %.
- [ ] Listed power-ups. Capped at two: one aid, one frenzy, distinct visuals.
- [ ] Wrote drop odds as a probability table. **Most rolls should be empty** so the rare drops feel special.
- [ ] Specified any economy caps. Implemented as a spawn-probability taper, not a counter clamp.
- [ ] Identified which textures are real art (mascot, currency, power-ups, background) vs generated (obstacles, particles, glows).
- [ ] Reserved polish budget per interaction: flap response, pickup feedback, death sequence, power-up activation.
- [ ] Added `?scene=` dev jump in BootScene from day one.
- [ ] Persisted best score and mute preference in `localStorage` with try/catch for sandboxed webviews.

---

## 4. Tech stack defaults

- **Engine**: Phaser 3, loaded from a CDN. No bundler unless you have a
  specific reason (e.g. Ruby Breaker uses Vite for code-splitting).
- **Modules**: ES modules (`<script type="module">`). Static site, served
  over `http://` for local dev (the harness can't open `file://` modules).
- **No frameworks**: no React, Vue, etc. for game code itself.
- **No build step preferred** — if you can ship the source directly, do.
  Reduces dependency churn and PR review surface.

Local dev server pattern:
```bash
# from the game folder
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## 5. Asset management

### 5.1 Folder structure (mandatory)

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

1. **WebP for everything visual.** Lossless for sprites, lossy for backgrounds.
2. **Generate before download.** Pillars, sparkles, dust, vignettes — draw them in BootScene.
3. **Mirror to tile.** Ship one background; mirror it horizontally in canvas for a seamless loop. No tileable artwork needed.
4. **Sources stay oversized.** Author at 1024×1024 if you want, render with `setDisplaySize()`. One asset, every device.
5. **AAC over WAV** for all audio.
6. **No bundler, no framework** unless required. Zero bytes shipped for build tooling.
7. **Shared keys for placeholder & final art.** Placeholders in BootScene use the same key the real file will use — swapping is one line.

---

## 6. Brand & polish requirements

### 6.1 Palette
Use the Pandai Design System 1.5 palette unless the game explicitly needs
its own. Defined in `src/config.js`:

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

### 6.3 Mute & persistence
- Mute toggle in every scene, top-right corner of HUD area
- Mute preference saved to `localStorage`, applied before any audio plays
- Best score saved to `localStorage` under `<game-name>:best`
- All `localStorage` calls wrapped in try/catch for sandboxed webviews

---

## 7. Publishing a new game

The landing page has three lists, each backed by a `status` value in
[`games.js`](./games.js):

| `status` value | Section on landing page | When to use |
|---|---|---|
| `pending` | **Pending** | Default. Game is still in active build / not ready for either review. |
| `approved-dev` | **Approved — For Development** | Game has progressed far enough that the development team should review or pick it up. |
| `approved-design` | **Approved — For Design** | Game has progressed far enough that the design team should review or pick it up. |

### 7.1 Initial publishing flow

1. Build the game in its own top-level folder: `/<game-name>/`.
2. Verify it serves correctly via `python3 -m http.server` from the game folder.
3. Add an entry to [`games.js`](./games.js) with `status: 'pending'`.
4. Open a PR. Reviewers will check this CLAUDE.md and the case study against your work.

### 7.2 Moving a game between lists — reminder steps

When your game is ready to be picked up by the development or design team,
**you** (the developer) request the move. Do **not** ask a reviewer to flip
the status for you.

**Before requesting a move, confirm:**

- [ ] The game runs cleanly on the latest `main` (pull, then test).
- [ ] All §8 "Definition of done" boxes are ticked.
- [ ] The game's own `CLAUDE.md` (if any) is up to date.
- [ ] The case study and these guidelines are not contradicted by your build.

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

- A game lives in **exactly one list** at a time. To move it again later,
  open another PR flipping the status.
- Don't add new status values without updating both [`index.html`](./index.html)
  (the `bucketFor()` function) and this document. Unknown / typo'd status
  values fall back to **Pending** so a bad value never drops a game off the
  landing page — but that fallback is a safety net, not a substitute for
  using the documented values.
- A move is reversible: you can flip `approved-dev` → `pending` if the game
  regresses. Be honest about it.

---

## 8. Definition of done

A game is shippable when it satisfies **all** of:

- [ ] Single endless round with a fixed timer (or stages with a documented reason)
- [ ] One currency, one HUD number
- [ ] Two power-ups max
- [ ] Difficulty ramp tuned in `config.js`, peaks at ≤85% of round
- [ ] Economy cap (if any) implemented as a spawn taper, never as a counter clamp
- [ ] Total payload ≤3 MB (target) / ≤5 MB (hard cap)
- [ ] All images are WebP, all audio is AAC
- [ ] Folder layout matches §5.1
- [ ] Polish checklist (§6.2) complete
- [ ] Mute toggle + best score persistence working
- [ ] `?scene=` dev jump wired in BootScene
- [ ] Listed in `games.js`
- [ ] Plays cleanly on mobile (mobile viewport, touch input, canvas-fit)

---

## Per-game overrides

If a game has specific dev notes (build pipeline, source location, etc.),
place a `CLAUDE.md` inside that game's folder. See
[`ruby-breaker-v2/CLAUDE.md`](./ruby-breaker-v2/CLAUDE.md) for an example.
Per-game CLAUDE.md files override this root document **for that game only**.

---

## Appendix A: Repo overview

Not every game in this repo is a new Phaser build that follows §1–8. The
repo also hosts older single-file canvas games. This appendix documents the
existing inventory and the conventions for editing them.

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
| `tetra-blocks/` | `tetra-blocks.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `tic-tac-toe/` | `tic-tack-toe.html` | Vanilla JS, plain CSS, canvas | 5×5 vs AI, single file |
| `Wordscapes/` | `wordscapes.html` | Vanilla JS + Tailwind CDN, canvas | Single file |

### A.3 Editing existing games

These rules apply when modifying any game already in the inventory. They do
**not** override §1–8 for new builds.

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
