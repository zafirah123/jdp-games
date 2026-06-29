# Flying Ruby

A Flappy-Bird-style arcade game with a Pandai twist. The mascot **pbot** flies
through a procedurally generated course, dodging pillars and collecting rubies,
with a fixed **3-minute round** before the run ends.

Built with [Phaser 3](https://phaser.io/) (loaded from a CDN — no build step).
Part of the [JDP Games](../) collection — published via GitHub Pages.

## Run it locally

The game is a static site, so any local web server will work. For example:

```bash
# from inside the flying-ruby folder
python3 -m http.server 8080
# then open http://localhost:8080
```

You can't open `index.html` directly in a browser — the scenes are loaded as
ES modules, which browsers only allow over `http://` (not `file://`).

## Gameplay

- **Tap, click, or press Space/Up** to flap. The round starts on your first input.
- Fly through the gaps between pillars and grab rubies for points.
- A **difficulty ramp** runs across the round: pillars get faster, the gap
  narrows, and pairs spawn more often. The ramp finishes at 85% of the round so
  the final stretch plays at a steady maximum.
- A **magnet power-up** bubble drifts in now and then — collect it to pull every
  on-screen ruby toward pbot for ~5 seconds.
- The round ends two ways: **crash** into a pillar/floor (cue a multi-phase
  shatter + screen-crack animation) or **survive the full 3:00** ("Time's Up!").
- The game-over screen counts up your score and tracks a **best score** in
  `localStorage`.

### Dev shortcuts

`BootScene` reads a `?scene=` query param so you can jump straight to a scene:

- `http://localhost:8080/?scene=GameScene` — skip the title screen
- `http://localhost:8080/?scene=GameOverScene` — jump to results with mock data

## Project structure

```
flying-ruby/
├── index.html              # entry point — loads Phaser (CDN) + src/main.js
├── src/
│   ├── config.js           # palette, gameplay + difficulty/magnet tuning
│   ├── main.js             # Phaser game config and scene registration
│   ├── muteButton.js       # shared mute toggle + saved preference
│   └── scenes/
│       ├── BootScene.js    # asset preload + generated placeholder textures
│       ├── StartScene.js   # title screen: logo, mascot, Start Game button
│       ├── GameScene.js    # full gameplay loop, difficulty ramp, crash FX
│       └── GameOverScene.js  # results: score count-up, best score, buttons
├── assets/
│   ├── sprites/            # pbot, ruby, magnet, game logo (WebP)
│   ├── backgrounds/        # shared background art
│   ├── buttons/            # (empty — buttons are drawn in code)
│   └── ui/                 # (empty — reserved)
├── sfx/                    # short sound effects (.m4a)
└── bgm/                    # looping background music tracks (.m4a)
```

## Assets

Real art and audio are in place. Images are **WebP** (smaller than PNG, broadly
supported); audio is **AAC/m4a**. A few gameplay shapes are still generated at
runtime in `BootScene` rather than loaded from a file.

| Key       | Source                              | Status                         |
|-----------|-------------------------------------|--------------------------------|
| `pbot`    | `assets/sprites/pbot.webp`          | mascot — real art              |
| `ruby`    | `assets/sprites/ruby.webp`          | ruby pickup — real art         |
| `magnet`  | `assets/sprites/magnet.webp`        | magnet power-up — real art     |
| `logo`    | `assets/sprites/game_logo.webp`     | title screen — real art        |
| `bg`      | `assets/backgrounds/bg.webp`        | background — real art          |
| `pipe`    | generated in `BootScene`            | placeholder pillar texture     |
| `star`    | generated in `BootScene`            | particle dot                   |
| `sparkle` | generated in `BootScene`            | 4-point sparkle                |

Audio: `sfx/` holds `jump`, `collect`, `on-hit`, `on-hit-2`, `game-start`,
`game-over`; `bgm/` holds `start-bgm` and `game-bgm`. To swap a generated
placeholder for real art, drop a file in `assets/` and add one `this.load`
line in [BootScene.preload()](src/scenes/BootScene.js).

## Color palette

Sourced from the [Pandai Design System 1.5](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161):

| Token       | Hex       | Used for                       |
|-------------|-----------|--------------------------------|
| navy        | `#020d26` | sky background, deep shadow    |
| royalBlue   | `#1535a8` | mid sky, obstacles             |
| darkRed     | `#a21520` | shadows, danger accents        |
| ruby        | `#b81c26` | mascot, ruby pickups           |
| yellow      | `#fdd83d` | highlights, buttons, score     |
| orange      | `#ffb800` | glow, sun, accent              |

Constants and gameplay tuning (`GAME`, `DIFFICULTY`, `MAGNET`) live in
[src/config.js](src/config.js).
