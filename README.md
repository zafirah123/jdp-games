# Juara Digital Pandai — Games

A collection of small, static browser games built for **Juara Digital Pandai
(JDP)** — Pandai's 2026 digital learning programme. The games are published as
previews through GitHub Pages.

**Live site**: https://zafirah123.github.io/jdp-games/

## Available games

The landing page ([index.html](index.html)) lists every game and separates
them into three buckets:

- **Approved — For Development** — promoted for the dev team to review or pick up (`status: 'approved-dev'`).
- **Approved — For Design** — promoted for the design team to review or pick up (`status: 'approved-design'`).
- **Pending** — default; still in active build or not yet ready for review (`status: 'pending'`).

Game metadata lives in [games.js](games.js). See [CLAUDE.md §7](CLAUDE.md)
for the publishing flow and how to request a move between lists.

| Game | Folder | Entry | Tech | Status |
|------|--------|-------|------|--------|
| 2048 | [2048/](2048/) | `index.html` | Vanilla JS, plain CSS, canvas | Approved — For Development |
| Bubble Shooter | [bubble-shooter/](bubble-shooter/) | `index.html` | Vanilla JS + Tailwind (CDN), canvas | Pending |
| Flying Ruby | [flying-ruby/](flying-ruby/) | `index.html` | Phaser 3 (CDN), ES modules — no build step | Approved — For Development |
| Kataku | [kataku/](kataku/) | `index.html` | Vanilla JS, plain CSS, DOM/SVG | Pending |
| Liquid Sort | [liquid-sort/](liquid-sort/) | `liquid-sort.html` | Vanilla JS + Tailwind (CDN), canvas | Pending |
| Number Snap | [number-snap/](number-snap/) | `index.html` | Vanilla JS, plain CSS, canvas | Approved — For Development |
| Puzzle | [puzzle/](puzzle/) | `puzzle.html` | Vanilla JS + Tailwind (CDN), canvas | Pending |
| Ruby Breaker | [ruby-breaker-v2/](ruby-breaker-v2/) | `index.html` | Phaser 3 + Vite (bundled — see folder CLAUDE.md) | Pending |
| Ruby Rhythm | [ruby-rhythm/](ruby-rhythm/) | `index.html` | Vanilla JS + Tailwind (CDN), canvas | Pending |
| Susun | [susun/](susun/) | `index.html` | Vanilla JS, plain CSS, Canvas 2D, Web Audio (canonical single-file reference) | Approved — For Development |
| Tap Tap Match | [tap-tap-match/](tap-tap-match/) | `index.html` | Vanilla JS, plain CSS, canvas | Approved — For Development |
| Tetra Blocks | [tetra-blocks/](tetra-blocks/) | `tetra-blocks.html` | Vanilla JS + Tailwind (CDN), canvas | Pending |
| Tic Tac Toe | [tic-tac-toe/](tic-tac-toe/) | `tic-tack-toe.html` | Vanilla JS, plain CSS, canvas (5×5 vs AI) | Pending |
| Wordscapes | [Wordscapes/](Wordscapes/) | `wordscapes.html` | Vanilla JS + Tailwind (CDN), canvas | Pending |

Most games are **single-file**: HTML + inline `<style>` + inline `<script>`,
pulling Tailwind from a CDN. The two exceptions are:

- **Flying Ruby** — modular Phaser 3 project. Source lives under
  [flying-ruby/src/](flying-ruby/src/) and loads as ES modules. No bundler.
- **Ruby Breaker v2** — Phaser 3 + Vite project. The folder in this repo is
  the **deployed bundle**; see [ruby-breaker-v2/CLAUDE.md](ruby-breaker-v2/CLAUDE.md)
  for where the source lives and how to rebuild.

## Run locally

The site is fully static. Most games use ES modules or `fetch`, so they need
a real HTTP server — opening `index.html` over `file://` will not work.

```bash
# from the repo root
python3 -m http.server 8080
# then open http://localhost:8080/
```

You can deep-link to a single game during development, e.g.
`http://localhost:8080/flying-ruby/`.

## Adding a new game

1. Create a folder at the repo root (kebab-case): `my-new-game/`.
2. Put the entry file inside. If it's named `index.html`, the game is
   reachable at the folder URL (`./my-new-game/`); otherwise link directly to
   the named file (e.g. `./my-new-game/my-new-game.html`).
3. Add an entry to [games.js](games.js):
   ```js
   { name: 'My New Game', path: './my-new-game/', status: 'pending' },
   ```
4. Test locally with `python3 -m http.server`, then commit and push.

Keep each game self-contained — no cross-game imports or shared bundles.
This makes it easy to retire or rewrite any single game without touching the
others.

## Design system

UI for JDP follows the **Pandai Design System 1.5**:
[Figma — Pandai Design System 1.5 (WIP/Backup)](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161).

The current JDP 2026 component frame is here:
[Figma — Juara Digital Pandai 2026](https://www.figma.com/design/vddfhrSU5UbbLmEJZMMlXd/Juara-Digital-Pandai-2026?node-id=326-302&m=dev).

See [CLAUDE.md](CLAUDE.md) for how to pull tokens/components from Figma into
this project (Figma MCP server, dev-mode handoff, etc.).

For convenience, the canonical palette tokens used by Flying Ruby:

| Token       | Hex       | Used for                       |
|-------------|-----------|--------------------------------|
| navy        | `#020d26` | sky background, deep shadow    |
| royalBlue   | `#1535a8` | mid sky, obstacles             |
| darkRed     | `#a21520` | shadows, danger accents        |
| ruby        | `#b81c26` | mascot, ruby pickups           |
| yellow      | `#fdd83d` | highlights, buttons, score     |
| orange      | `#ffb800` | glow, sun, accent              |

## GitHub Pages

The repo publishes as a plain static site — a [.nojekyll](.nojekyll) file
disables Jekyll processing so all folders and files publish as-is. In
repository **Settings → Pages**, set the publishing source to the branch you
deploy from (typically `main`).

There is no `.github/workflows/` deploy action in the repo. If you later
switch to **GitHub Actions** as the Pages source, add the workflow file and
update this section.

## Repo layout

```
pandaijdpgames/
├── index.html            # landing page (lists Approved / Pending games)
├── games.js              # window.GAMES — single source of truth for the landing page
├── .nojekyll             # tells GitHub Pages to skip Jekyll
├── CLAUDE.md             # AI-agent guide for Claude Code
├── AGENTS.md             # AI-agent guide (tool-agnostic; mirrors CLAUDE.md)
├── README.md             # you are here
└── <game-folder>/        # one folder per game (see table above)
```

## Working with AI agents

This repo includes two top-level guides for AI coding agents:

- [CLAUDE.md](CLAUDE.md) — Claude Code conventions, run/deploy steps, and
  game-by-game notes. Read first when working in Claude Code.
- [AGENTS.md](AGENTS.md) — the same guidance in the tool-agnostic
  [AGENTS.md](https://agents.md) format for Cursor, Continue, Aider,
  Copilot, etc.

Individual games can also carry their own `CLAUDE.md` for game-specific
notes — see [ruby-breaker-v2/CLAUDE.md](ruby-breaker-v2/CLAUDE.md) for an
example.
