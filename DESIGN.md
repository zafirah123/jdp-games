# DESIGN.md — JDP Games

Design reference extracted from the **Juara Digital Pandai 2026** Figma file
(section `Components`, node `326:302`). This document is the source of truth
for visual language across all JDP games. Re-run the prompt
**"Populate DESIGN.md from the selected Figma frame"** against the same node
to refresh after Figma changes.

## Sources

| Item | Link |
|------|------|
| JDP 2026 Components section | [Figma — node 326:302](https://www.figma.com/design/vddfhrSU5UbbLmEJZMMlXd/Juara-Digital-Pandai-2026?node-id=326-302&m=dev) |
| Pandai Design System 1.5 | [Figma — Pandai DS 1.5](https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161) |
| File key | `vddfhrSU5UbbLmEJZMMlXd` |
| Target node | `326:302` (section `Components`, 6119×4611 canvas) |
| Overview render | [`design/exports/jdp26-overview.png`](design/exports/jdp26-overview.png) |

---

## 1. Color tokens

Resolved from Figma styles on node `326:302`. **Brick Red** + **Light Yellow**
+ **Blue** form the dominant brand triad for HUD chrome; the **Light/Dark
Yellow** pair drives the primary CTA gradient.

| Figma style | Hex | Role |
|-------------|-----|------|
| Black | `#031034` | Base text, deep navy backgrounds |
| Blue | `#133B9F` | Score number pill, accent backgrounds |
| Brick Red | `#9E131F` | Primary surface for HUD pills, progress bar fill (start) |
| Light Red | `#AF1726` | Ruby count text on white chips |
| Dark Yellow | `#FFB603` | Primary CTA border, glow accent |
| Light Yellow | `#FFD633` | CTA gradient highlight, button text on red surfaces |
| White | `#FFFFFF` | Neutral surface, button borders on hover/pressed |
| Neutral / Background / White | `#FFFFFF` | Card / pill background |
| Neutral / Text / White | `#FFFFFF` | Text on dark surfaces |
| Neutral / Text / Light | `#82868B` | Muted body / secondary text |

### Reconciling with existing game palettes

The legacy `flying-ruby/src/config.js` palette ships these tokens. Map them
to JDP 2026 styles below; reconcile per-game over time.

| Code token (Flying Ruby) | Hex | Closest JDP 2026 style | Notes |
|--------------------------|-----|------------------------|-------|
| `navy` | `#020d26` | Black `#031034` | Within ~1 step; treat as same |
| `royalBlue` | `#1535a8` | Blue `#133B9F` | Slight hue shift; prefer Figma value |
| `darkRed` | `#a21520` | Light Red `#AF1726` | Shadow / danger accent |
| `ruby` | `#b81c26` | Brick Red `#9E131F` (cooler) | JDP 2026 ruby is darker; pick per use |
| `yellow` | `#fdd83d` | Light Yellow `#FFD633` | Effectively same |
| `orange` | `#ffb800` | Dark Yellow `#FFB603` | Effectively same |

### Derived gradient stops (from button + progress-bar components)

| Use | Stops |
|-----|-------|
| Primary CTA (enabled) | `#FFE258` → `#FFBA0A` |
| Primary CTA shadow track | `#DE9D00` |
| Hover / pressed CTA surface | `#CF1B27` → `#821322` |
| Hover / pressed CTA shadow | `#640A19` |
| Disabled CTA surface | `#A1934D` → `#A1812B` (border `#A18D3C`) |
| Disabled CTA shadow | `#917122` |
| CTA icon badge (default) | `#FE0601` → `#00193B` (border `#FFD633`) |
| CTA icon badge (pressed) | `#7A1120` → `#6D0E1D` (border `#530209`) |
| Progress bar fill | `#9E131F` → `#38070B` (border 2px `#FFD633`) |
| Ruby count chip text | `#AF1726` on white |

## 2. Typography

Pulled from Figma text variables. **Poppins** is the working font family
across the Vuexy variants; **Manrope** appears for `kit-subtitle` (legacy
Figma kit) and is not used in the game UI today.

| Style | Family | Weight | Size | Line height | Letter spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| Display / CTA Large | Poppins | 700 (Bold) | 28 | normal | 0.4 | Primary button label, hero CTAs |
| Subtitle (kit) | Manrope | 700 (Bold) | 16 | 24 | 2 | Legacy kit only — avoid in JDP screens |
| CTA Small / Pill | Poppins | 700 (Bold) | 16–18 | normal | 0.4 | Small button label, score pill number |
| Body Para sm Semi Bold | Poppins | 600 (SemiBold) | 12 | 18 | 0 | Compact body, hints |
| Button Medium (Vuexy) | Poppins | 500 (Medium) | 14 | 100 | 0.4 | Default Vuexy button |
| Button Small (Vuexy) | Poppins | 500 (Medium) | 11 | 100 | 0.367 | Compact Vuexy button |
| Pill label | Poppins | 500 (Medium) | 16 | 16 | 0.4 | "Remaining Today" / "Pandai Score" |
| Sub-label | Poppins | 500 (Medium) | 10 | 16 | 0.4 | "Juara Digital Pandai" tagline under pill |
| Ruby count | Poppins | 700 (Bold) | 16 | normal | 0 | Floating chip above progress bar |

Load Poppins via Google Fonts (`Poppins:wght@500;600;700`) — no Tailwind
plugin needed.

## 3. Spacing & radii

Derived from button/pill/progress-bar metrics. JDP follows a loose 4 / 8 px
rhythm; radii are large and pill-shaped.

| Token | Value | Used by |
|-------|-------|---------|
| space-2 | 4 px | Small button drop shadow, vertical chip padding |
| space-4 | 8 px | Inner button padding, gap between icon and label |
| space-5 | 10 px | Inline pill ruby gap |
| space-8 | 16 px | Small button horizontal padding |
| space-10 | 20 px | Pill horizontal padding, large button left padding |

| Radius | Value | Used for |
|--------|-------|----------|
| `radius-button-small` | 17.857 px | Small icon badge inside CTA |
| `radius-button-icon` | 28.571 px | Large icon badge inside CTA |
| `radius-pill-30` | 30 px | Score pill outer container |
| `radius-button-outer` | 38 px | CTA outer shadow track |
| `radius-button-inner` | 50 px | CTA inner surface |
| `radius-chip` | 26 px | Ruby count chip above progress bar |
| `radius-progress` | 20 px | Progress bar rail |
| `radius-card` | 16 px | "Ruby count" backdrop tab, leaderboard rows |

## 4. Effects

The CTA uses a **stacked drop** (outer dark shadow plate visible below the
gradient surface; press state inverts the offset). Borders are crisp at
0.625–2 px; the design avoids soft blurred shadows.

| Effect | Spec | Used for |
|--------|------|----------|
| CTA drop plate | `8px` bottom (large) / `4px` (small) of dark hex behind rounded-50 surface | Primary, Secondary, Icon button rests |
| CTA pressed plate | Same plate, shifted to **top** padding instead of bottom | Pressed state |
| CTA border | 1 px solid (`#FFD633` enabled, white hover/pressed, `#A18D3C` disabled) | All CTA variants |
| Progress border | 2 px solid `#FFD633` | Progress bar rail |
| Pill border | 2 px solid `#FFB603` | Score / remaining pill |
| Ruby chip | flat `#FFFFFF` over `#691518` backdrop with rounded-26 | Floating ruby count |

## 5. Components

The `Components` section (node `326:302`) is grouped roughly into four
horizontal bands:

1. **Buttons** — Start / Secondary / Navbar / How to play / Icon button
2. **HUD elements** — Avatar, Score pills, Progress bar, Leaderboard buttons
3. **Tier system** — Tier band rows, Tier badges (1–7), GF Point badges
4. **Special events** — Eskayvie, Merdeka, MPOC 1, UASA, UPSA

Each variant has `Enabled / Hovered / Pressed / Disabled` and (where
relevant) `Large / Small` size axes.

### 5.1 Buttons

Anatomy: `outer-shadow-plate` → `gradient-surface` (icon · label · icon-badge).

| Variant | Node | Size axis | Default text | Notes |
|---------|------|-----------|--------------|-------|
| Primary "Start Game" | `291:5008` | Large 284×66, Small 186×44 | "Start Game" | Yellow gradient, red label |
| Secondary "Leaderboard" | `291:5261` | Large 305×66, Small 198×48 | "Leaderboard" | Cooler palette, same shadow plate |
| Navbar | `291:5471` | Large 295×54, Small 224×37 | nav label | Flatter; thinner inner radius |
| How to play | `382:2966` | Large/Small both 252×35 | "How to play" | Compact pill, full-width inside its tile |
| Icon Button | `442:2088` | Large 75×75, Small 30×30 | — | Square button with central icon |

Primary button color logic (large variant):

| State | Outer plate | Surface gradient | Border | Label color |
|-------|-------------|------------------|--------|-------------|
| Enabled | `#DE9D00` | `#FFE258 → #FFBA0A` | `#FFD633` | `#DE0909` |
| Hovered | `#640A19` | `#CF1B27 → #821322` | `#FFFFFF` | `#FFD633` |
| Pressed | `#640A19` (offset to top) | `#CF1B27 → #821322` | `#FFFFFF` | `#530209` |
| Disabled | `#917122` | `#A1934D → #A1812B` | `#A18D3C` | `#7C2830` |

### 5.2 Score / HUD chips

**Pill_Pandai Score** (`864:9230`) — two-tone pill, white outer with 2 px
`#FFB603` border, rounded 30.

- Left half: `#9E131F` background, yellow `#FFD633` label.
  - `Pill_Remaining Score`: single label "Remaining Today".
  - `Pill_Pandai Score`: stacked "Pandai Score" + tagline "Juara Digital Pandai" (10 px).
- Right half: `#133B9F` background, white 18 px Poppins Bold number,
  trailing 24 px coin/ruby icon.

### 5.3 Progress Bar (`696:9206`)

Three states × two sizes:

| State | Caption strip | Ruby count chip |
|-------|---------------|-----------------|
| `Start` | "No Progress Yet" at left | floating count chip pinned to start |
| `Progress` | "Need N more" mid-bar | chip floats above current fill |
| `Reached` | "Level Reached" at right | chip at the end of bar |

Rail: rounded-20 (large) / rounded ~19 (small), 2 px `#FFD633` border, fill
gradient `#9E131F → #38070B`. End caps are tier badges (`Tier=N`).
Sizes: large 671×45, small 330×~20.

### 5.4 Avatar (`696:9357`)

| Variant | Size |
|---------|------|
| Large | 425×100 |
| Small | 330×~52 |

Used for the player identity strip on the landing / leaderboard screens.

### 5.5 Tier system

- **Tier badges** (`1355:4785`) — Tier 1 through Tier 7, each
  241×200 px. Tier 7 is the "Max" badge.
- **Tier Band rows** (`807:2914`) — `Band0` through `Band4`, each 962×155,
  stacked vertically. Used for leaderboard / progress views grouped by tier.
- **GF Point Badges** (`506:4067`) — `Top 20 / 21+ / 41+ / 61+ / 81+ / 101+`,
  each with `Active / Disabled` status, 100×20.

### 5.6 Special Event (`1542:5333`)

Per-event icons 100×100 with `Enable / Disable` state for: **Eskayvie**,
**Merdeka**, **MPOC 1**, **UASA**, **UPSA**.

### 5.7 Game Randomizer (`737:1953`)

Frame 2243×987 with `Game Randomizer=Small` symbol at 764×346. Drives the
"pick a game" tile on the landing page.

### 5.8 Tier Status card (`744:3981`)

300×200 cards in three states: `In Progress`, `Not Started`, `Completed`.

### 5.9 Language pill (`696:13379`)

Four variants: `Text Rounded`, `Variant4`, `Text Rect`, `Text Only`.
Used for the language toggle in the navbar.

### 5.10 Leaderboard family

- `Leaderboard Button` (`657:1656`) — 57×41 large / 39×23 small, all 4 states.
- `Full leaderboard` (`671:1649`) — 130×17 text-button row, all 4 states.

### 5.11 Audio toggle button

Not a Figma component — codified by the in-repo reference implementation
[`tap-tap-match/index.html`](tap-tap-match/index.html). Every JDP game ships
this control in every scene that can make sound (CLAUDE.md §6.3, §0.4).
It is a DOM `<button>` overlaid on the canvas, not drawn into the canvas,
so it stays clickable across resizes and survives full-screen flips.

**Anatomy**: fixed-position circular icon button, top-right of the viewport.

| Token | Value |
|-------|-------|
| Footprint | 44×44 px (meets the §0.2 ≥44 px touch-target rule) |
| Shape | circle — `border-radius: 22px` (= 50 %) |
| Background | Brick Red `#9E131F` |
| Border | 2 px solid Dark Yellow `#FFB603` |
| Icon color | Light Yellow `#FFD633` (`fill: currentColor`) |
| Icon footprint | 22×22 px inside a `0 0 24 24` viewBox |
| Position | `position: fixed; top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right));` |
| Press feedback | `transform: scale(0.92)` on `:active`, `transition: transform 80ms ease` |
| Stacking | `z-index: 10` (above canvas, below modal overlays) |
| Padding | `0` (icon is centered via flex) |

**States** — the visible icon and label reflect the *current* audio state;
the toggle action is implied by the icon, not spelled out (CLAUDE.md §6.4).

| State | Icon glyph | `aria-pressed` | `aria-label` / `title` (EN = BM) |
|-------|------------|----------------|----------------------------------|
| Audio playing | speaker + sound waves | `false` | `AUDIO ON` |
| Muted | speaker + ✕ | `true` | `AUDIO OFF` |

**Canonical icon paths** (`fill="currentColor"`, viewBox `0 0 24 24`):

```
ICON_ON:
M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z
m-2.5-9v2.1a7 7 0 0 1 0 13.8V21a9 9 0 0 0 0-18z

ICON_OFF:
M3 9v6h4l5 4V5L7 9H3zm16.6 3 2.5-2.5-1.4-1.4L18.2 10.6 15.7 8.1l-1.4 1.4
L16.8 12l-2.5 2.5 1.4 1.4 2.5-2.5 2.5 2.5 1.4-1.4z
```

**Behavior**:

- Persist to `localStorage` under `<game-name>:mute` (`'0'` / `'1'`), wrapped
  in try/catch for sandboxed webviews.
- Read the persisted value **before** the first `playTone` / `play()` call so a
  returning muted player never hears a sound.
- Tap toggles state → write to storage → swap the icon path → update
  `aria-pressed`, `aria-label`, and `title` → if unmuting, resume the
  `AudioContext` and play one short feedback tone so the player confirms
  audio works.
- Do not autoplay BGM until after the first user gesture (browsers block it
  anyway).

**Reference CSS** (copy verbatim into new games):

```css
.mute {
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  width: 44px; height: 44px;
  border-radius: 22px;
  border: 2px solid #FFB603;
  background: #9E131F;
  color: #FFD633;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  cursor: pointer;
  z-index: 10;
  transition: transform 80ms ease;
}
.mute:active { transform: scale(0.92); }
.mute svg { width: 22px; height: 22px; fill: currentColor; }
```

**Reference markup**:

```html
<button id="muteBtn" class="mute" aria-label="AUDIO ON" aria-pressed="false">
  <svg viewBox="0 0 24 24"><!-- ICON_ON path injected at boot --></svg>
</button>
```

Phaser games render the same 44×44 circle as a `Container` of `Graphics` +
icon `Image` pinned to the top-right of the camera, with the same palette
and press-scale tween — but the DOM-button shape above is preferred where
possible because it stays accessible to screen readers.

> **Note on pill variants.** A few games (e.g. `2048/`) ship a wider
> pill-shaped mute control that prints the `AUDIO ON` / `AUDIO OFF`
> label inline. That variant is permitted for games whose HUD has the
> horizontal real estate, but the **circular icon** above is the
> default — choose the pill only when the canonical 44×44 icon would
> visually clash with an already-crowded HUD.

### 5.12 Top HUD bar (Score · Time · Audio)

The canonical in-game HUD is a single horizontal row at the top of the
viewport that combines exactly three elements, in this order:

1. **Score pill** — §5.2 two-tone pill, `Score` label, numeric value.
2. **Time pill** — same chrome as the Score pill, `Time` label, `mm:ss`
   countdown.
3. **Audio toggle** — §5.11 circular 44×44 icon button.

Reference implementation:
[`bubble-shooter/index.html`](bubble-shooter/index.html) — the markup
between the `Top HUD Bar` and `Main Game Container` sections is the
canonical shape. Copy it into new games.

**Container anatomy**:

| Token | Value |
|-------|-------|
| Width | viewport-wide, clamped to `max-width: 28rem` (Tailwind `max-w-md`) |
| Outer padding | matches the game's page padding (8 px mobile, 16 px desktop) |
| Layout | `display: flex; justify-content: space-between; align-items: center; gap: 8px` |
| Stack order | `z-index: 10` (above canvas, below modal overlays) |
| Top offset | use `padding-top: max(8px, env(safe-area-inset-top))` so the row clears notched devices |
| Shrink | `flex-shrink: 0` on the container so it never compresses when canvas grows |

**Element sizing**:

| Element | Width rule | Why |
|---------|------------|-----|
| Score pill | `flex: 1` | Shares remaining width equally with the Time pill |
| Time pill | `flex: 1` | Same as Score — keeps the two pills visually balanced |
| Audio toggle | fixed 44×44, `flex-shrink: 0` | Touch target stays at the §5.11 spec regardless of viewport |

On a 360 px portrait phone this resolves to ≈140 px per pill — enough for
`Score: 9999` and `Time: 03:00` without truncating.

**Score pill internals**:

| Field | Value |
|-------|-------|
| Label (left half) | `Score` — Brick Red `#9E131F` background, Light Yellow `#FFD633` text, 10 px Poppins Bold uppercase, `letter-spacing: 0.04em` |
| Value (right half) | zero-padded number — Blue `#133B9F` background, white 18 px Poppins Black (`font-weight: 800–900`) |
| Outer border | 2 px solid Dark Yellow `#FFB603`, `border-radius: 30px` |
| Inner clip | `overflow: hidden` on the outer pill so the two halves meet cleanly at the rounded edge |

**Time pill internals** — same chrome as the Score pill, with two
adjustments:

| Field | Value |
|-------|-------|
| Label | `Time` |
| Value font | monospaced (`font-mono` / `font-family: 'Roboto Mono', monospace`) so the digits do not shift width as seconds tick |
| Format | `mm:ss`, zero-padded both sides |

**Urgency state** — when the round timer enters the final stretch
(`≤10 s` is the CLAUDE.md §6.2 default; some games extend to `≤30 s`
for a longer "panic" tail), pulse the **value element** of the Time pill
only, not the entire pill:

```css
@keyframes pulse-urgent {
  0%, 100% { transform: scale(1);    color: #FFFFFF; }
  50%      { transform: scale(1.15); color: #FFD633; }
}
.pulse-urgent { animation: pulse-urgent 0.8s infinite; }
```

```js
// when entering the urgency window
document.getElementById('timer').classList.add('pulse-urgent');
```

Pulsing the value (not the chrome) keeps the pill's outline calm while
the number breathes — the urgency reads as "the number is alarmed,"
not "the layout is shaking."

**Reference markup** (Tailwind + the `.jdp-pill` / `.mute` rules above):

```html
<div class="w-full max-w-md flex justify-between items-center gap-2 z-10 shrink-0">
  <div class="jdp-pill flex-1">
    <span class="pill-label">Score</span>
    <span id="score" class="pill-value">0000</span>
  </div>
  <div class="jdp-pill flex-1">
    <span class="pill-label">Time</span>
    <span id="timer" class="pill-value font-mono">03:00</span>
  </div>
  <button id="muteBtn" class="mute" aria-label="AUDIO ON" aria-pressed="false">
    <svg viewBox="0 0 24 24"><!-- §5.11 ICON_ON path --></svg>
  </button>
</div>
```

**Why three elements, in this order?** The HUD owes the player exactly
three ambient pieces of information: how they're doing (Score), how
long they have left (Time), and whether sound is on (Audio). One row
makes the layout self-contained at the top of the viewport, leaves the
entire remaining canvas free for gameplay, and reads identically on
phone, tablet, and desktop. Score-first (left) is the §1.3 "brag
number" — eyes land there first. Time-center keeps the countdown in
peripheral vision while the player focuses on the playfield. Audio-right
keeps the mute control at the §5.11 thumb-zone position.

**Anti-patterns**:

| Don't | Why |
|---|---|
| Stack Score and Time on two rows | Wastes vertical space on phones and reads as a chrome bar, not a HUD |
| Add a fourth element (`Best`, `Combo`, `Level`, lives) | Breaks the §1.3 "one number on the HUD" rule — surface secondary state inside the canvas with floating "+1" pops, aura tints, or screen-edge effects |
| Drop the Audio toggle into a hamburger / settings menu | Mute is non-negotiable per CLAUDE.md §0.4 — must be one tap from anywhere |
| Show `0046 / 0500` in the Score pill | The visible denominator defeats the brag-number — see BEST-PRACTICES.md §05 |
| Translucent / blurred HUD bar wrapping all three elements | Adds chrome the JDP pill already provides; doubles the visual weight |
| Pulse the entire Time pill (chrome included) in the urgency state | Reads as "the layout broke," not "the number is urgent" — pulse the value element only |

> **Reference: Bubble Shooter.** [`bubble-shooter/index.html`](bubble-shooter/index.html)
> ships this pattern verbatim. The container is `flex justify-between
> items-center gap-2 z-10 shrink-0`, both pills carry `flex-1`, the
> mute button is 44×44 with `flex-shrink: 0`. Urgency triggers at
> `timer <= 30`. Susun (`susun/index.html`) is a legacy single-tone
> variant that predates this guidance — it still works, but new games
> should use the two-tone shape above.

## 6. Mascot & illustrations

The **pbot** mascot is used across most JDP games. Existing sprite assets
in this repo:

- `flying-ruby/assets/sprites/pbot.webp`
- `ruby-breaker-v2/pbot.png`
- `ruby-breaker-v2/pbot-shield.png`

The current Figma frame `326:302` does **not** ship pbot variants directly
— mascot illustrations live elsewhere in the file (`Game Randomizer/Large`
symbol `737:1951` references them at 5674×540). Pull from the existing
sprite files until a dedicated mascot frame is added.

| Asset | Source | Used by |
|-------|--------|---------|
| pbot — neutral | `flying-ruby/assets/sprites/pbot.webp` | All games |
| pbot — flying | `flying-ruby/assets/sprites/pbot-flying.webp` (if present) | Flying Ruby |
| pbot — shield | `ruby-breaker-v2/pbot-shield.png` | Ruby Breaker v2 |

## 7. Layouts / screens

The selected Figma node is a **component library**, not full-screen mocks.
Canonical screens (title / HUD / game-over) should be assembled from these
components. When a designer ships a screen frame, add it here.

| Screen | Components used | Reference games |
|--------|-----------------|-----------------|
| Title / start | Primary button, Avatar (Large), Pandai Score pill | All |
| In-game HUD | Score pill, Progress bar, Icon button (mute/pause) | All |
| Leaderboard | Tier Band rows, Leaderboard Button, Avatar (Small) | All |
| Tier overview | Tier 1–7 badges, Progress bar | All |
| Game over | Pressed CTA, Tier Status (Completed) | All |

## 8. Motion & feedback

The Figma frame does not declare motion tokens explicitly. **Visual cues**
imply:

- CTA press → outer shadow plate flips from `padding-bottom: 8` to
  `padding-top: 8` (effectively 8 px translateY). Use ~80 ms ease-out.
- Progress bar fill grow → linear, ~400 ms per 10 % change.
- Ruby chip pop → scale 0.9 → 1.0 with bounce; ~250 ms (game-specific).

Until designers ship motion tokens, keep transitions short (≤300 ms) and
non-distracting.

## 9. Exports

Rasterized component exports are stored in [`design/exports/`](design/exports/).
Filename convention: `kebab-case` matching the component name. Use SVG for
vector UI, WebP for raster art, PNG when transparency + broad-tool
compatibility matters.

```
design/
└── exports/
    └── jdp26-overview.png    # overview render of node 326:302
```

To add a component export, call the Figma MCP `get_screenshot` tool with
the component's node id (e.g. `291:5008` for Button/Start) and save the
PNG into this folder.

## 10. Open questions for the design team

- [ ] Are the Flying Ruby palette tokens the canonical JDP palette, or
      should they be replaced by the Figma styles (Brick Red `#9E131F`
      vs ruby `#b81c26`, etc.)?
- [ ] Is there a single "Game shell" component (back button + title +
      score + mute) shared across all games, or should each game compose
      its own from the building blocks listed in §5?
- [ ] Is **Poppins** locked as the brand face? (Today's vanilla games use
      system stacks. Adopting Poppins means a Google Fonts dependency in
      every game's `<head>`.)
- [ ] Where do the pbot variants live in Figma? `326:302` doesn't ship
      them as standalone components.
- [ ] What's the canonical motion language (easings, durations) — none
      are defined in the current frame.
