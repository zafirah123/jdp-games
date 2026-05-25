# AGENTS.md — JDP Games

Guidance for AI coding agents (Cursor, Continue, Aider, Copilot Workspace,
Claude Code, etc.) working in this repo. Follows the [AGENTS.md](https://agents.md)
convention.

> If you are running **Claude Code**, also read [CLAUDE.md](CLAUDE.md) — it
> contains the same guidance plus a few Claude-Code-specific tips.

---

## Project at a glance

**Juara Digital Pandai (JDP)** is Pandai's 2026 digital learning programme.
This repo holds the collection of small, static **HTML5 browser games**
shipped as previews through GitHub Pages.

- Pure static site. No server, no database, no build at the root.
- Each game is a self-contained folder at the repo root.
- Landing page ([index.html](index.html)) reads [games.js](games.js) and
  renders an Approved / Pending list.

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

## Adding a game

1. Create `your-game/` at the repo root (kebab-case).
2. Put the entry HTML inside. Prefer `index.html`.
3. Append an entry to [games.js](games.js):
   ```js
   { name: 'Your Game', path: './your-game/', status: 'pending' },
   ```
4. Test at `http://localhost:8080/your-game/`.
5. Promote to `status: 'approved'` when shipping.

Keep entries alphabetical by `name`.

## Design system

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

## Conventions

- **Folders:** kebab-case. **Entry file:** `index.html` where possible.
- **Game length:** most JDP games target a fixed-length round (~3 min).
- **Persistence:** `localStorage`, namespaced per game
  (e.g. `flying-ruby:best`).
- **Audio:** `.m4a` or `.mp3`; provide a mute toggle.
- **Mascot:** "pbot" — reuse existing sprites from `flying-ruby/assets/sprites/`
  or `ruby-breaker-v2/pbot.png` rather than redrawing.

## Verification checklist before declaring "done"

- [ ] Game loads at `http://localhost:8080/<folder>/` with no console
      errors.
- [ ] Plays through the golden path (start → win/lose → restart).
- [ ] Sound works and the mute toggle is honoured.
- [ ] Layout looks correct at the canvas's intended aspect ratio.
- [ ] No other game folder was modified.
- [ ] [games.js](games.js) updated if a new game was added or status
      changed.
- [ ] Landing page ([index.html](index.html)) still renders the game list.

## Deployment

GitHub Pages, no CI. Pushing to the deploy branch is the deploy.
`.nojekyll` is present so folders publish as-is. After pushing, verify the
landing page renders and the changed game loads at the deployed URL.

## When unsure

Ask the user before introducing dependencies, refactoring across games, or
changing the deploy model. The repo is intentionally small and low-magic;
keep it that way.
