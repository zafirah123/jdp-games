# AGENTS.md — JDP Games

Guidance for AI coding agents (Cursor, Continue, Aider, Copilot Workspace,
Claude Code, etc.) working in this repo. Follows the [AGENTS.md](https://agents.md)
convention.

> If you are running **Claude Code**, also read [CLAUDE.md](CLAUDE.md) — it
> contains the same guidance plus a few Claude-Code-specific tips.
>
> Before building or reviewing a game, read [BEST-PRACTICES.md](BEST-PRACTICES.md)
> — the Flying Ruby case study in Markdown form. It covers the ten
> replication patterns (§08), the soft-taper economy pattern (§05), the
> asset-management deep-dive (§06), and a pre-implementation checklist
> (§09). It is the canonical reference for *how* to build a JDP game; this
> file is the canonical reference for *what house rules to follow* while
> doing so.
>
> For any UI work — colors, typography, buttons, HUD chips, progress bars,
> tier badges — read [DESIGN.md](DESIGN.md) **before** writing code. It is
> the source of truth for visual language across all JDP games.

---

## Project at a glance

**Juara Digital Pandai (JDP)** is Pandai's 2026 digital learning programme.
This repo holds the collection of small, static **HTML5 browser games**
shipped as previews through GitHub Pages.

- Pure static site. No server, no database, no build at the root.
- Each game is a self-contained folder at the repo root.
- Landing page ([index.html](index.html)) reads [games.js](games.js) and
  renders an Approved / Pending list.

## Baseline requirements (apply to every game)

Non-negotiable for every game in this repo — new builds and legacy
single-file games alike.

1. **Static HTML only — no backend.** HTML + CSS + JS, deployable to any
   static host (today: GitHub Pages). No server, no database, no
   game-controlled API. Library CDNs (Phaser, Tailwind) are fine; private
   backends are not. The local `python3 -m http.server` is a dev-time
   workaround for ES-module `file://` restrictions, not a runtime
   dependency.
2. **Desktop, mobile, and tablet.** Every game must play on:
   - Desktop (keyboard / mouse, viewport ≥1024 px)
   - Mobile phones (portrait, touch, viewports as narrow as 360 px)
   - Tablets (both orientations, touch)
   Use dynamic viewport-responsive sizing (canvas and non-canvas UIs),
   tap targets ≥44×44 px, and include
   `<meta name="viewport" content="width=device-width, initial-scale=1">`.
   Avoid fixed-size game surfaces that do not react to resize or orientation
   changes.
   No keyboard-only controls — every input must have a touch path.
3. **Child-safe content (audience: under 18).** No violence, blood, gore,
   weapons, or "kill" framing — use crash/miss/out/cartoon-failure framing
   instead. No nudity, sexual or suggestive imagery, gambling mechanics, or
   discriminatory language. No ads, no third-party analytics that profile
   children. When in doubt, ship the safer version and ask first.
4. **Suitable audio.** At minimum: SFX for the primary action, the pickup /
   score event, and the lose / round-end moment. Tone is bright and
   arcade-friendly — nothing scary. Mute toggle required in every scene,
   mute state persisted in `localStorage` and applied **before** any audio
   plays. Don't autoplay BGM until the player has interacted. Format:
   `.m4a` (AAC) for new builds.
5. **Standardized UI copy with `?lang=ms` switching.** Five key strings
   must match across every JDP game:
   - `START GAME` — round-start CTA
   - `TIME'S UP!` — round timer hit zero
   - `GAME OVER` — run ended for any other reason (crash, no Continue)
   - `AUDIO ON` — audio currently playing (tap to mute)
   - `AUDIO OFF` — audio currently muted (tap to enable)

   Default language is English. `?lang=ms` on the URL (e.g.
   `…/flying-ruby/?lang=ms`) switches the game's copy to Bahasa Melayu:
   `MULA MAIN`, `MASA TAMAT!`, `PERMAINAN TAMAT`, `AUDIO ON`, `AUDIO OFF`.
   Unrecognized `lang` values fall back to English. Don't persist the
   choice — the URL is the source of truth. See
   [CLAUDE.md §6.4](CLAUDE.md) for the full string set and reference
   implementation.
6. **End-of-game CTA policy (CLAIM SCORE with zero-score retry exception).** The final
   end-of-game modal (after `TIME'S UP!` or `GAME OVER`) must have
   **exactly one** CTA with score-dependent behavior:

   - Score `> 0`: `CLAIM SCORE` (en) / `TUNTUT SKOR` (ms). Tapping it
     attempts callback submission.
   - Score `= 0`: `RETRY`. Restart locally and **do not** submit a callback.

   - Read `callback_url` from URL query params when present.
   - If `callback_url` is missing/invalid, use the platform callback
     fallback configured by product. Do not hardcode a public callback URL
     in game code.
   - Callback preparation must fail closed. Validate callback URLs and only
     allow valid `https` targets. If callback preparation cannot be completed,
     helper functions should return `null` / unavailable instead of throwing
     where possible.
   - Guard the submit handler when building the callback URL. On tap, disable
     the claim CTA immediately and keep it disabled while preparation /
     submission is in progress. If redirect succeeds, the page navigates away.
   - If claim URL generation depends on async work (for example WebCrypto
     encryption), resolve it before the final tap when practical and keep the
     tap handler to a synchronous `window.location.assign(...)` / `location.href`
     commit. This avoids gesture-loss issues in Safari / WKWebView.
   - If iOS Safari / WKWebView drops script-driven redirects, prefer a real
     anchor CTA with a pre-resolved `href`, disable it on first tap to prevent
     duplicate claims, and only re-enable after a short timeout if the page
     clearly did not navigate away.
   - If claim preparation fails because callback context is missing, expired,
     malformed, or invalid, leave the CTA disabled and show an explicit
     unavailable/error state instead of making it clickable again. Standard
     copy: `CALLBACK UNAVAILABLE` (en) / `PANGGIL BALIK TIADA` (ms).
   - Every game must allow the player to end early and trigger the same
     callback flow (with current score), not only at the final timeout.
   - Optional: run a game-local suspicious-score check before callback.
     The check must not call a backend and should add a flag/reason in the
     callback payload when triggered.
   - Optional: include per-run `log` data (lightweight diagnostics only)
     in the callback payload.

   No `Play Again` / `Try Again` / `Restart` / `Main Semula` button on
   the end-of-game modal for score `> 0` — players replay by relaunching
   the game from the Pandai app. The only exception is score `= 0`,
   where `RETRY` is allowed. The mid-run `CONTINUE` prompt (when the player
   crashes with time remaining) continues to work as before; CLAIM
   SCORE only appears on the *final* modal. See
   [CLAUDE.md §6.5](CLAUDE.md) for the callback contract and reference
   implementation.

## Setup

There is nothing to install at the root. To run locally:

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```

`file://` does **not** work for games that use ES modules or `fetch` — use
the HTTP server.

## Games

| Folder | Entry | Tech |
|--------|-------|------|
| `bubble-shooter/` | `index.html` | Vanilla JS + Tailwind CDN, canvas |
| `flying-ruby/` | `index.html` | Phaser 3 (CDN), ES modules in `src/` — no build |
| `liquid-sort/` | `liquid-sort.html` | Vanilla JS + Tailwind CDN, canvas |
| `puzzle/` | `puzzle.html` | Vanilla JS + Tailwind CDN, canvas |
| `ruby-breaker-v2/` | `index.html` | Phaser 3 + Vite (bundled — source outside repo) |
| `ruby-rhythm/` | `index.html` | Vanilla JS + Tailwind CDN, canvas |
| `tetra-blocks/` | `tetra-blocks.html` | Vanilla JS + Tailwind CDN, canvas |
| `tic-tac-toe/` | `tic-tack-toe.html` | Vanilla JS, plain CSS, canvas (5×5 vs AI) |
| `Wordscapes/` | `wordscapes.html` | Vanilla JS + Tailwind CDN, canvas |

Most games are **single-file**: HTML + inline `<style>` + inline `<script>`.
Two exceptions:

- **Flying Ruby** — modular Phaser 3 (ES modules, no bundler). See
  [flying-ruby/README.md](flying-ruby/README.md).
- **Ruby Breaker v2** — the folder is a **deployed Vite bundle**. Source
  lives outside this repo; see
  [ruby-breaker-v2/CLAUDE.md](ruby-breaker-v2/CLAUDE.md) before editing.

## House rules for agents

1. **Stay in-folder.** A change to one game must not touch another game's
   files. If a refactor seems to require touching multiple games, raise it
   first — don't unify on your own initiative.
2. **Keep single-file games single-file.** Don't split inline styles or
   scripts into separate files. The deployment model is one HTML file per
   game.
3. **Never hand-edit `ruby-breaker-v2/assets/index-*.js`.** It is a minified
   Vite bundle. Edit the upstream source and copy the rebuilt bundle in.
4. **No new build tooling, no package manager at the root, no test
   runner.** Verify changes by playing the game in a browser.
5. **Tailwind via CDN is the norm for single-file games.** Don't introduce
   a PostCSS or Tailwind CLI build.
6. **Comments stay minimal.** Code is small enough to read; don't add
   narration.
7. **Don't fabricate features.** Implement what was asked; flag scope
   creep instead of expanding silently.
8. **Bump versioned asset/script URLs when shipped files change.** If a game
   references local JS/CSS or static art directly from `index.html`
   (for example `claim-callback.js?v=...` or `assets/start/*.webp?v=...`),
   update the version token when those shipped files change so cached
   WebViews pick up the new code and visuals.

## Adding a game

Before writing code, walk the pre-implementation checklist in
[BEST-PRACTICES.md §09](BEST-PRACTICES.md#09--build-checklist). Then:

1. Create `your-game/` at the repo root (kebab-case).
2. Put the entry HTML inside. Prefer `index.html`.
3. Append an entry to [games.js](games.js):
   ```js
   { name: 'Your Game', path: './your-game/', status: 'pending', author: 'your-github-username' },
   ```
   `author` is **required** — it's the GitHub username of the original
   developer and is rendered under the game name on the landing page so
   contributors are credited. Don't omit it.
4. Test at `http://localhost:8080/your-game/`.
5. Promote to `status: 'approved-dev'` or `'approved-design'` when shipping
   (see [CLAUDE.md §7](CLAUDE.md) for the move flow).

Keep entries alphabetical by `name`.

## Design system

**Start here:** [DESIGN.md](DESIGN.md) is the in-repo source of truth — it
mirrors the JDP 2026 components frame with resolved color tokens,
typography, spacing, radii, button/pill/progress-bar anatomy, and motion
guidance. Read it before pulling anything from Figma; only reach for the
Figma MCP when DESIGN.md is silent on what you need.

UI follows **Pandai Design System 1.5**:
[Figma — Design System 1.5](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161)

JDP 2026 component frame:
[Figma — Juara Digital Pandai 2026](https://www.figma.com/design/vddfhrSU5UbbLmEJZMMlXd/Juara-Digital-Pandai-2026?node-id=326-302&m=dev)

### Pulling designs into code

Recommended workflow (works for any agent with MCP support):

1. **Figma MCP / Dev Mode plugin** — install the official Figma MCP server
   for your agent. For Claude Code:
   `claude plugin install figma@claude-plugins-official`. Requires Figma
   **Dev Mode** access on the JDP file.
2. **Paste the Figma node URL** into the agent's chat. The MCP exposes
   tools to fetch frame structure, typography, colors, components, and to
   export PNG/SVG assets.
3. **Translate to Tailwind / vanilla CSS by hand.** Do not paste
   auto-generated React or HTML into a single-file game. Output must stay
   readable and self-contained.
4. **Save exported assets** under the game's folder (`<game>/assets/`).
   Prefer WebP for images, m4a/mp3 for audio.

If Figma Dev Mode isn't available, fall back to designer-provided specs +
exports, or use the *Tokens Studio for Figma* plugin to export design
tokens as JSON and reference them in a per-game config.

### Canonical palette (Flying Ruby `src/config.js`)

| Token       | Hex       | Used for                       |
|-------------|-----------|--------------------------------|
| navy        | `#020d26` | sky background, deep shadow    |
| royalBlue   | `#1535a8` | mid sky, obstacles             |
| darkRed     | `#a21520` | shadows, danger accents        |
| ruby        | `#b81c26` | mascot, ruby pickups           |
| yellow      | `#fdd83d` | highlights, buttons, score     |
| orange      | `#ffb800` | glow, sun, accent              |

These are the legacy Flying Ruby tokens. For new UI prefer the JDP 2026
values in [DESIGN.md §1](DESIGN.md) (Brick Red `#9E131F`, Blue `#133B9F`,
Light Yellow `#FFD633`, etc.) — DESIGN.md includes a reconciliation table
mapping legacy names to the Figma styles.

## Conventions

- **Folders:** kebab-case. **Entry file:** `index.html` where possible.
- **Game length:** most JDP games target a fixed-length round (~3 min).
- **Persistence:** `localStorage`, namespaced per game
  (e.g. `flying-ruby:best`).
- **Audio:** `.m4a` or `.mp3`; provide a mute toggle.
- **Mascot:** "pbot" — reuse existing sprites from `flying-ruby/assets/sprites/`
  or `ruby-breaker-v2/pbot.png` rather than redrawing.

## Verification checklist before declaring "done"

Cross-check against [BEST-PRACTICES.md §09](BEST-PRACTICES.md#09--build-checklist)
for the design-side checklist; the items below cover the harness/repo side.

- [ ] Game loads at `http://localhost:8080/<folder>/` with no console
      errors — and would load identically from any static host (no backend
      calls).
- [ ] Plays through the golden path (start → win/lose → restart) on
      **desktop, mobile (portrait, ≥360 px), and tablet**. Touch input
      verified, not just mouse.
- [ ] Game surface and UI are dynamically sized for viewport changes
      (including orientation changes). No fixed-size-only layout.
- [ ] SFX play for primary action, pickup/score, and lose/round-end.
      Mute toggle is honoured and applied before any audio plays.
- [ ] Content reviewed for child-safety: no violence, nudity, gambling,
      ads, or third-party tracking.
- [ ] Standardized end-of-game / audio strings used (§5 baseline);
      `?lang=ms` switches the game's copy to Bahasa Melayu.
- [ ] End-of-game modal uses a single CTA: `CLAIM SCORE` / `TUNTUT SKOR`
      when score `> 0`, or `RETRY` when score is exactly `0`; callback
      flow per §6 baseline is used for all score `> 0` endings
      (`callback_url` support + product fallback).
- [ ] Claim-submit path is guarded when callback resolution fails: no
      `location.href = null` / dead-click state, and the player gets an
      explicit disabled/error outcome instead.
- [ ] Claim CTA disables on first tap, stays disabled during preparation /
      redirect, and remains disabled with `CALLBACK UNAVAILABLE` /
      `PANGGIL BALIK TIADA` if callback context is missing, expired,
      malformed, or invalid.
- [ ] Game supports early-end callback (player can finish early and submit
      score through the same callback contract).
- [ ] If a suspicious-score check is implemented, it runs locally before
      callback and annotates payload/log safely.
- [ ] Optional callback `log` payload (if implemented) contains lightweight
      diagnostics only (no PII, no tracking).
- [ ] Layout looks correct at the canvas's intended aspect ratio.
- [ ] UI matches [DESIGN.md](DESIGN.md) — palette, typography, button
      states, pill/progress-bar anatomy.
- [ ] No other game folder was modified.
- [ ] [games.js](games.js) updated if a new game was added or status
      changed — new entries include an `author` (GitHub username).
- [ ] Landing page ([index.html](index.html)) still renders the game list.

## Deployment

GitHub Pages, no CI. Pushing to the deploy branch is the deploy.
`.nojekyll` is present so folders publish as-is. After pushing, verify the
landing page renders and the changed game loads at the deployed URL.

## When unsure

Ask the user before introducing dependencies, refactoring across games, or
changing the deploy model. The repo is intentionally small and low-magic;
keep it that way.
