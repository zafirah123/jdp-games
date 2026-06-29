# Juara Digital Pandai - Games

A collection of small, static browser games built for **Juara Digital Pandai
(JDP)**, Pandai's 2026 digital learning programme. The games are published as
previews through GitHub Pages.

**Live site**: https://zafirah123.github.io/jdp-games/

## Available games

The landing page ([index.html](index.html)) lists every game and separates
them into three buckets:

- **Approved - For Development** - promoted for the dev team to review or pick up (`status: 'approved-dev'`).
- **Approved - For Design** - promoted for the design team to review or pick up (`status: 'approved-design'`).
- **Pending** - default; still in active build or not yet ready for review (`status: 'pending'`).

Game metadata lives in [games.js](games.js). See [CLAUDE.md §7](CLAUDE.md)
for the publishing flow and how to request a move between lists.

| Game | Folder | Entry | Tech | Status |
|------|--------|-------|------|--------|
| 2048 | [2048/](2048/) | `index.html` | Vanilla JS, plain CSS, canvas | Approved - For Development |
| Bubble Shooter | [bubble-shooter/](bubble-shooter/) | `index.html` | Vanilla JS + local Tailwind CSS, canvas | Pending |
| Flying Ruby | [flying-ruby/](flying-ruby/) | `index.html` | Phaser 3 (local vendor), ES modules - no build step | Approved - For Development |
| Kataku | [kataku/](kataku/) | `index.html` | Vanilla JS, plain CSS, DOM/SVG | Pending |
| Liquid Sort | [liquid-sort/](liquid-sort/) | `index.html` | Vanilla JS + local Tailwind CSS, canvas | Pending |
| Number Snap | [number-snap/](number-snap/) | `index.html` | Vanilla JS, plain CSS, canvas | Approved - For Development |
| Puzzle | [puzzle/](puzzle/) | `index.html` | Vanilla JS + local Tailwind CSS, canvas | Pending |
| Ruby Breaker | [ruby-breaker-v2/](ruby-breaker-v2/) | `index.html` | Phaser 3 + Vite (bundled - see folder CLAUDE.md) | Pending |
| Ruby Rhythm | [ruby-rhythm/](ruby-rhythm/) | `index.html` | Vanilla JS + local Tailwind CSS, canvas | Pending |
| Susun | [susun/](susun/) | `index.html` | Vanilla JS, plain CSS, Canvas 2D, Web Audio | Approved - For Development |
| Tap Tap Match | [tap-tap-match/](tap-tap-match/) | `index.html` | Vanilla JS, plain CSS, canvas | Approved - For Development |
| Tetra Blocks | [tetra-blocks/](tetra-blocks/) | `index.html` | Vanilla JS + local Tailwind CSS, canvas | Pending |
| Tic Tac Toe | [tic-tac-toe/](tic-tac-toe/) | `index.html` | Vanilla JS, plain CSS, canvas (5x5 vs AI) | Pending |
| Wordscapes | [wordscapes/](wordscapes/) | `index.html` | Vanilla JS + local Tailwind CSS, canvas | Pending |

Most games are compact single-page builds. Some now ship with small local
vendor assets such as generated Tailwind CSS. The two structural exceptions
are:

- **Flying Ruby** - modular Phaser 3 project. Source lives under
  [flying-ruby/src/](flying-ruby/src/) and loads as ES modules. No bundler.
- **Ruby Breaker v2** - Phaser 3 + Vite project. The folder in this repo is
  the deployed bundle; see [ruby-breaker-v2/CLAUDE.md](ruby-breaker-v2/CLAUDE.md)
  for where the source lives and how to rebuild.

## Run locally

The site is fully static. Most games use ES modules or `fetch`, so they need
a real HTTP server - opening `index.html` over `file://` will not work.

```bash
# from the repo root
python3 -m http.server 8080
# then open http://localhost:8080/
```

You can deep-link to a single game during development, e.g.
`http://localhost:8080/flying-ruby/`.

## Adding a new game

1. Create a folder at the repo root (kebab-case): `my-new-game/`.
2. Put the entry file inside as `index.html` so the game is reachable at the
   folder URL (`./my-new-game/`).
3. Add an entry to [games.js](games.js):
   ```js
   { name: 'My New Game', path: './my-new-game/', status: 'pending' },
   ```
4. Test locally with `python3 -m http.server`, then commit and push.

Keep each game self-contained - no cross-game imports or shared bundles. This
makes it easy to retire or rewrite any single game without touching the others.

## Design system

UI for JDP follows the **Pandai Design System 1.5**:
[Figma - Pandai Design System 1.5 (WIP/Backup)](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161).
