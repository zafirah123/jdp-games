# CLAUDE.md — JDP Games

Notes for Claude Code working in this repo. Keep edits **focused**, **local
to a single game**, and **runnable in any browser** without a build step
(except where noted).

## What this repo is

**Juara Digital Pandai (JDP)** is Pandai's 2026 digital learning programme.
This repo collects the small, static **HTML5 browser games** that ship as
previews through GitHub Pages. Each game lives in its own folder at the
repo root and is loaded by [index.html](index.html) via the metadata array
in [games.js](games.js).

There is **no monorepo build step, no test runner, and no shared bundler**
at the root. Games are independently runnable static sites.

## Run locally

```bash
# from the repo root
python3 -m http.server 8080
# then open http://localhost:8080/
```

Games that use ES modules or `fetch` (most of them) require an HTTP server —
`file://` will fail. When iterating on a single game, deep-link to it (e.g.
`http://localhost:8080/flying-ruby/`).

## Game inventory

| Folder | Entry | Tech | Notes |
|--------|-------|------|-------|
| `bubble-shooter/` | `index.html` | Vanilla JS + Tailwind CDN, canvas | Single file, all inline |
| `flying-ruby/` | `index.html` | Phaser 3 (CDN), ES modules in `src/` | No build; see folder [README](flying-ruby/README.md) |
| `liquid-sort/` | `liquid-sort.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `puzzle/` | `puzzle.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `ruby-breaker-v2/` | `index.html` | Phaser 3 + Vite (bundled) | **Deployed bundle.** Source lives outside this repo — see [folder CLAUDE.md](ruby-breaker-v2/CLAUDE.md) |
| `ruby-rhythm/` | `index.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `tetra-blocks/` | `tetra-blocks.html` | Vanilla JS + Tailwind CDN, canvas | Single file |
| `tic-tac-toe/` | `tic-tack-toe.html` | Vanilla JS, plain CSS, canvas | 5×5 vs AI, single file |
| `Wordscapes/` | `wordscapes.html` | Vanilla JS + Tailwind CDN, canvas | Single file |

## Editing rules

1. **Stay in-folder.** A change to Ruby Rhythm must not touch any other
   game's files. There are no shared modules to keep "in sync"; if you find
   yourself wanting one, raise it first.
2. **Single-file games:** keep them single-file. Don't split inline `<style>`
   or `<script>` into separate files just because they're long — the deploy
   model assumes one file per game.
3. **Don't hand-edit `ruby-breaker-v2/assets/index-*.js`.** That file is a
   minified Vite bundle. Read [ruby-breaker-v2/CLAUDE.md](ruby-breaker-v2/CLAUDE.md)
   before touching anything in that folder.
4. **No build/test commands to run.** There is no `npm test`, no linter, no
   type checker at the root. Verify changes by **playing the game in a
   browser** after `python3 -m http.server 8080`.
5. **Tailwind via CDN is the convention for single-file games.** Don't
   introduce a Tailwind build pipeline or PostCSS config.

## Adding a game

1. Create `your-game/` at the repo root (kebab-case).
2. Put the entry file inside. Prefer `index.html` so the URL is the folder.
3. Add an entry to [games.js](games.js) with `status: 'pending'`.
4. Test at `http://localhost:8080/your-game/`.
5. Promote to `status: 'approved'` once shipped.

## Landing page contract ([games.js](games.js) → [index.html](index.html))

```js
window.GAMES = [
  { name: 'Display Name', path: './folder/', status: 'pending' | 'approved' },
  // ...
];
```

[index.html](index.html) reads `window.GAMES` at load, filters by `status`,
and renders the two lists. Keep entries in **alphabetical order by name** to
match the current convention.

## Design system & Figma

UI follows the **Pandai Design System 1.5**:
[Figma — Pandai Design System 1.5](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161).

The current JDP 2026 components frame:
[Figma — Juara Digital Pandai 2026](https://www.figma.com/design/vddfhrSU5UbbLmEJZMMlXd/Juara-Digital-Pandai-2026?node-id=326-302&m=dev).

### Pulling design into code (recommended path)

For Claude Code, the cleanest workflow is the **Figma MCP server**:

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
   (`<game>/assets/`). Prefer WebP for images and m4a/mp3 for audio.

### Fallback paths if you don't have Figma Dev Mode

- **Manual handoff** — designer exports specs (colors, sizes, assets) into a
  shared doc or screenshots; Claude works from those.
- **Figma REST API** — possible with a personal access token, but more
  friction than the MCP server.
- **Design-tokens export** — use the *Tokens Studio for Figma* plugin to
  export JSON, then mirror the relevant tokens into a small shared CSS file
  if/when cross-game consistency becomes a need (don't do this prematurely).

### Palette (current canonical, from Flying Ruby `src/config.js`)

| Token       | Hex       | Used for                       |
|-------------|-----------|--------------------------------|
| navy        | `#020d26` | sky background, deep shadow    |
| royalBlue   | `#1535a8` | mid sky, obstacles             |
| darkRed     | `#a21520` | shadows, danger accents        |
| ruby        | `#b81c26` | mascot, ruby pickups           |
| yellow      | `#fdd83d` | highlights, buttons, score     |
| orange      | `#ffb800` | glow, sun, accent              |

If you introduce a new token, prefer adding it to a per-game config (like
`flying-ruby/src/config.js`) before generalizing it.

## Conventions cheat-sheet

- **File names:** kebab-case folders; entry file is `index.html` where
  possible.
- **Game length:** most JDP games target a fixed-length round (e.g.
  3 minutes) rather than infinite play. Match this unless told otherwise.
- **High scores:** persist with `localStorage`, scoped per game (e.g.
  `localStorage['flying-ruby:best']`).
- **Audio:** prefer `.m4a` or `.mp3`; expect Safari + Chrome. Provide a
  mute toggle.
- **Mascot:** "pbot" — the Pandai robot character. Reuse the existing
  sprite from `flying-ruby/assets/sprites/` or `ruby-breaker-v2/pbot.png`
  rather than redrawing.
- **Comments:** keep them minimal. The codebase is small enough to read.

## Deployment

GitHub Pages, served from the configured branch. `.nojekyll` is present so
all folders publish as-is. No CI workflows exist; pushing to the deploy
branch is the deploy. Verify the **landing page renders** and your game
loads at `https://<org>.github.io/pandaijdpgames/<your-game>/` after deploy.

## When in doubt

- Ask the user. The repo is small and tightly scoped — don't infer cross-
  cutting refactors from a one-game request.
- Don't introduce build tooling, package managers, or shared modules without
  explicit go-ahead.
- Read any per-folder `CLAUDE.md` or `README.md` before editing inside a
  game folder.
