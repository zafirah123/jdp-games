# Dadu Didik — Development Spec

> **Build-ready spec for a JDP arcade game.** Reconciles the *Merge Dice*
> mechanics brief against the binding repo rules in
> [CLAUDE.md](../CLAUDE.md), [BEST-PRACTICES.md](../BEST-PRACTICES.md), and
> [DESIGN.md](../DESIGN.md). Where the Merge Dice brief and a JDP rule
> disagreed, **the JDP rule wins** and the change is logged in §0.
>
> **Dadu Didik** = "educational dice" (BM). A drag-and-place merge puzzle:
> three same-numbered dice that touch merge into the next number up; chains
> cascade; the gold **Ruby** tier bursts to free space. Beat one number
> before the 3-minute clock runs out.

---

## 0. Decisions & deviations from the Merge Dice brief

These were settled before build. They are binding for this game.

| # | Topic | Merge Dice brief | **Dadu Didik (this build)** | Why |
|---|---|---|---|---|
| D1 | Stack | DOM/CSS-grid *or* canvas | **Vanilla JS + Canvas 2D, single `index.html`** | BEST-PRACTICES §01b default. Board drawn on canvas; HUD/modals/mute are DOM overlays (bubble-shooter pattern). |
| D2 | Round length | 5 min default | **3 minutes** | CLAUDE.md §1.1 standard short session; keeps leaderboards comparable. |
| D3 | Power-ups | none explicit (bomb is intrinsic) | **None separate — Ruby Burst tier is the only "special"** | Chosen "minimal" scope. §1.5 caps at two; zero is allowed. Variety comes from spawn variants/formations instead (§4). |
| D4 | Tier-7 "bomb" that "detonates" | bomb / detonate | **"Ruby Burst" — a Pandai ruby gem that bursts (sparkle) to clear the cross** | CLAUDE.md §0.3 bans violence/weapon/"detonate" framing for the under-18 audience. |
| D5 | Score scale | base `value*10`, chains to ×5, bomb 500 | **Rescaled small; strong 3-min run ≈ 500 (tunable)** | BEST-PRACTICES §05: target a 500 ceiling per 3-min round. |
| D6 | Cap enforcement | none | **Difficulty-escalation path (§05)** — spawn weights harden near 500; counter never clamped | A merge game has no spawn-supply you can taper to zero without starving the player; tapering per-merge payout reads as cheating. Escalation is the honest lever. |
| D7 | Hard-lock loss | ends the run | **Continue (mercy 3×3 clear) with leftover clock; declining → GAME OVER** | CLAUDE.md §1.2 "time is a shared budget"; the brief's optional mercy becomes the Continue. |
| D8 | Felt colour | dark green felt | **Deep navy-teal felt on navy** (per-game palette override, reconciled to DESIGN.md §1) | Pure tabletop green is off-brand; navy-teal keeps the felt read while honouring the JDP triad. |
| D9 | Best score / mute | in-memory (artifact) | **`localStorage` (`dadu-didik:best`, `dadu-didik:mute`)** | Standalone web build; CLAUDE.md §6.3. |
| D10 | High score timing | update at game over | **unchanged** — best updates only at game over, never mid-run | Brief §16; CLAUDE.md §6.2. |
| D11 | Tray piece shape | single *or* pair | **Always a pair** (two dice, rotatable before placing) — never a single | Requested. Simpler, consistent mental model; every piece is rotatable; pairs fill faster and create more combo potential. |
| D12 | Audio | SFX + optional BGM | **SFX-only, no BGM** | Requested. Still satisfies CLAUDE.md §0.4 (SFX + mute). |
| D13 | Mascot | — | **pbot on the title screen only** | Requested. |

---

## 1. The pitch (one screen)

- **Goal:** one number — your **Score**. Drag dice onto a 5×5 grid; line up
  three or more of the same number so they touch; they merge into the next
  number up. Chains cascade and score big. Keep the board breathing until
  the clock runs out.
- **Skill:** spatial planning — the grid is small and fills fast; leave room
  for future merges and set up chain reactions.
- **Session:** one continuous 3-minute round. No stages, no levels.
- **Brag number:** target ceiling 500 for a near-perfect run.

---

## 2. Tech & file layout

Vanilla, single file, no build step (CLAUDE.md §4, BEST-PRACTICES §01b).

```
dadu-didik/
├── index.html      # everything: HTML, CSS, JS, CONFIG inline
└── SPEC.md         # this file
```

- **Rendering:** HTML5 Canvas 2D for the board, dice, and effects. DOM
  overlay (Tailwind CDN, matching the other single-file JDP games) for the
  top HUD bar, mute button, and modals — kept clickable/accessible across
  resizes per DESIGN.md §5.11–§5.12.
- **No framework, no bundler, no TypeScript.** One `requestAnimationFrame`
  loop and one `STATE` object.
- **Audio:** Web Audio API synthesis only — no audio files (place, merge,
  rising-pitch chain step, ruby burst, game over). Optional synth BGM loop.
- **Assets:** dice faces, pips, felt, sparkles, "+N" floats — **all
  generated at runtime** (BEST-PRACTICES §06, pattern #8). The only optional
  on-disk asset is the **pbot** mascot on the title screen
  (`./assets/pbot.webp`, copied from [`design/assets/pbot.webp`](../design/assets/pbot.webp)).
  Total payload well under 200 KB.
- **Script sections** (comment-delimited, Susun shape): `CONFIG` · `STATE` ·
  `INPUT` · `RULES` (pure fns) · `UPDATE` · `DRAW` · `AUDIO` · `LIFECYCLE`.

### Local dev

```bash
cd dadu-didik && python3 -m http.server 8080   # open http://localhost:8080
```

---

## 3. CONFIG block (single source of tuning)

All tuning lives here, top of the `<script>` (replication pattern #1). Values
marked **TUNE** are settled by playtest in build step 9 (§13).

```js
const CONFIG = {
  gameName: 'dadu-didik',

  // ---- Board ----
  cols: 5, rows: 5,

  // ---- Round ----
  roundMs: 3 * 60 * 1000,
  rampCompleteAt: 0.85,            // difficulty peaks at 85% of the round
  urgentAtMs: 10_000,             // HUD time-value pulses in the final 10s

  // ---- Palette (reconciled to DESIGN.md §1; D8 felt is a per-game override) ----
  palette: {
    navy:     '#031034',          // background, deep shadow
    feltA:    '#0b2a30',          // board felt gradient (deep navy-teal)
    feltB:    '#0f3a3a',
    gridLine: 'rgba(255,255,255,0.08)',
    blue:     '#133B9F',          // score value half
    brick:    '#9E131F',          // HUD label half, ruby tier body
    lightRed: '#AF1726',
    dkYellow: '#FFB603',          // pill border, ruby hex glow
    ltYellow: '#FFD633',          // highlights, score label text
    white:    '#FFFFFF',
  },

  // ---- Dice tiers: value -> face colour (1..6 reconciled to the gem rainbow) ----
  diceColors: {
    1: '#FFFFFF',  // white face, red pips
    2: '#133B9F',  // blue
    3: '#E84393',  // pink
    4: '#2E9E4F',  // green
    5: '#7A3FB8',  // purple
    6: '#FFB603',  // orange / dark-yellow
    7: 'RUBY',     // special: gold die marked with a ruby hexagon (Ruby Burst)
  },

  // ---- Spawn weighting (ramps from start->end across the round) ----
  // Every tray piece is ALWAYS a pair (two dice) — never a single (D11).
  // Each die's number is rolled independently from these weights, so a pair
  // may be same-same or different. Pairs always spawn horizontal; the player
  // rotates freely before placing.
  spawn: {
    weightsStart: { 1: 40, 2: 30, 3: 18, 4: 8, 5: 3, 6: 1 },   // easy: low numbers
    weightsEnd:   { 1: 26, 2: 28, 3: 22, 4: 14, 5: 7, 6: 3 },   // hard: more highs
    startRotation: 0,               // new pairs spawn at 0°; tap cycles 0→90→180→270
    biasToBoard: 0.25,            // P(nudge a rolled value toward one already on board)
  },

  // ---- Merge ----
  minGroup: 3,                    // 3+ same-number orthogonally-connected = merge
  maxTier: 6,                     // 6+6+6 -> Ruby (tier 7), not a "7" number

  // ---- Ruby Burst (reskinned bomb) ----
  burst: { pattern: 'cross',      // 'cross' = anchor + 4 orthogonal (5 cells) | 'block' = 3x3 (9)
           score: 40, perCleared: 6 },

  // ---- Scoring (LOCKED — Monte-Carlo tuned, see §5) ----
  score: {
    base: 1.6,                    // merge points = resultValue * base
    groupBonus: 1,                // each die beyond the 3rd: extraDie * resultValue * groupBonus
    chainMult: [1, 1.6, 2.4, 3.2, 4], // chain step 1..5+, capped at the last entry
  },

  // ---- Economy cap (difficulty-escalation path, BEST-PRACTICES §05) ----
  economy: { softCap: 500, hardenStart: 400, hardenEnd: 500 },

  // ---- Continue (mercy clear; time is a shared budget) ----
  continue: { clearPattern: '3x3' },   // unlimited continues while clock > 0

  // ---- Animation timings (ms) ----
  anim: { place: 180, slide: 140, pop: 180, chainStagger: 160, burstFlash: 220 },
  //       ^ place = tray->grid travel tween on a valid drop (D11 request)
};
```

> **Difficulty ramp** (BEST-PRACTICES §03): each frame, `t =
> clamp(elapsed / (roundMs * rampCompleteAt), 0, 1)`. Spawn weights and
> `pairChance` lerp `start → end` by `t`. Near the cap, a **second** ramp
> `s = clamp((score - hardenStart)/(hardenEnd - hardenStart), 0, 1)` hardens
> the weights further; the effective hardness is `max(t, s)` (§05 escalation —
> whichever is harder wins). The counter is **never** clamped.

---

## 4. Mechanics (the rules layer)

Implement these as **pure, testable functions** (brief §13): `spawnPiece()`,
`canPlace(board, piece, target)`, `findCluster(board, cell)`,
`resolveMerges(board, placedCells)`.

### 4.1 Board model

`board[row][col]` → `null` or `{ id, value }`. 25 cells.

### 4.2 Dice & tiers

Identity is the **number**. Two dice merge only if their numbers are equal.
Faces render as real dice pip layouts (1–6); tier 7 is the gold **Ruby** die
(ruby hexagon icon, no pips). Colours per `CONFIG.diceColors`.

### 4.3 The tray & spawning

- The tray **always** holds a **pair** (two joined dice, domino shape) — never
  a single (D11). New pairs spawn **horizontal**; the player rotates freely
  before placing (§4.4).
- The two dice of a pair are rolled **independently**, so a pair can be
  same-same or different.
- On place, a new pair spawns.
- **Weighting:** each die's number is rolled from the time/score-ramped
  weights (§3). Optional `biasToBoard` nudge keeps merges reachable
  (difficulty lever).
- **Spawn variants = cheap content** (BEST-PRACTICES §04/§06 pattern #6):
  pair-same vs pair-diff × horizontal vs vertical (via rotation). One die
  element, several "shapes" — the variety lever in place of extra power-ups.

### 4.4 Placement

- Drag the pair from the tray onto the grid.
- A pair needs **two adjacent empty cells** matching its current orientation
  (horizontal or vertical). **No partial overlap** — both cells valid & empty,
  or it snaps back to the tray.
- While dragging, show a **snap preview** for both cells: valid highlighted
  green, invalid red.
- On a valid drop, the two dice **travel from the tray to their landing
  cells** with a short tween (`anim.place`) before they settle — not an
  instant snap (D11 / §8).
- Dice **cannot be moved** once placed.
- **Rotation:** tap/click the **pair in the tray** rotates it 90° per tap
  through **all four orientations** — `0° → 90° → 180° → 270° → 0°`. 0°/180°
  are horizontal, 90°/270° vertical; 180° and 270° **swap which die occupies
  which cell**, so all four turns are visually distinct and the player can
  place either die first. Rotation works **only** in the tray — never while
  dragging, never after placement.

### 4.5 Merging (the heart)

- **Adjacency:** orthogonal only (up/down/left/right). Diagonals never count.
- **Group:** a connected cluster of equal-numbered dice (flood fill,
  orthogonal, equal value). Any shape — line, L, T, square, blob.
- **Trigger:** a placement that makes **3+** same-numbered dice connected.
  Only the cluster(s) the **newly placed** die belongs to are checked.
- **Anchor (where the result lands):** the **last die placed** that completed
  the group. The player aims the result — core to setting up chains. All other
  dice in the cluster are removed; one die of `value+1` sits at the anchor.
- **Group > 3:** still one result die, plus a group-size bonus. Never multiple
  results.
- **Chains:** after a merge, re-check the new die's cluster; if it now makes a
  3+ group, merge again. Repeat up the tiers until stable. Animate one step at
  a time (`chainStagger`).
- **Tier 6 → Ruby:** merging three 6s produces **one gold Ruby die** (tier 7),
  not a number 7. Rubies do **not** merge into a higher number.
- **Ruby Burst:** three connected Rubies merge → **burst** at the anchor:
  clear the **cross** of 5 cells (anchor + 4 orthogonal; clamp at edges/
  corners, no wrap). No result die. Cleared cells become empty. This is the
  pressure valve that keeps a congested board alive. `pattern` tunable to
  `'block'` (3×3 / 9 cells).

### 4.6 Merge resolver (brief §15, adapted)

```
resolveMerges(board, anchorCells):
  chainStep = 0
  queue = anchorCells
  loop:
    merged = false
    for cell in queue:
      if board[cell] empty: continue
      cluster = floodFill(board, cell, sameValueOnly, orthogonalOnly)
      if size(cluster) >= CONFIG.minGroup:
        v = value at cell
        clear all cells in cluster
        if v == 6:        place Ruby (tier 7) at cell
        else if v == 7:   rubyBurst(cell)        // clear cross; no result die
        else:             place die (v+1) at cell
        chainStep += 1
        score += computeScore(v, size(cluster), chainStep)
        playChainTone(chainStep)                 // rising pitch per step
        queue = [cell]; merged = true; break
    if not merged: break
```

### 4.7 Edge cases (brief §16 — all must be handled)

- Pair whose two dice land in **different** clusters → resolve both in
  placement order; anchor rule applies per cluster.
- A die that **bridges** two same-number groups into one → treat as a single
  cluster.
- A chain that walks 1 → … → Ruby → Burst in one move → resolver keeps going,
  scores every step.
- Ruby Burst at an edge/corner → clear only existing cells, no wrap.
- Best score updates **only** at game over.

---

## 5. Scoring (§D5, §D6)

```
computeScore(value, groupSize, chainStep):
  resultValue = (value == 6) ? 7 : value + 1        // Ruby counts as 7
  base   = resultValue * CONFIG.score.base
  bonus  = max(0, groupSize - 3) * resultValue * CONFIG.score.groupBonus
  mult   = CONFIG.score.chainMult[min(chainStep, len-1)]
  return round((base + bonus) * mult)

rubyBurstScore(clearedCount):
  return CONFIG.burst.score + clearedCount * CONFIG.burst.perCleared
```

- **One currency, one HUD number** (CLAUDE.md §1.3): the running **Score**.
  No multipliers shown as a second number; the chain `×` shows transiently as
  a **combo popup**, not a HUD field.
- **Floating "+N"** at the merge anchor; **combo counter** popup when a chain
  is longer than one step (BEST-PRACTICES §07 polish).
- **Cap (never visible):** score is **not** clamped and **not** shown as
  `/500`. As score crosses `hardenStart`, the spawn weights harden (§3) so
  setups get genuinely harder — a 500 run reads as *earned*, a 487 as "almost
  cracked it." If the player hits 500, a one-time `500 — MAX` badge is allowed
  (§05), but it is not ambient HUD chrome.

### Tuned constants (locked)

The scoring constants were fixed by a **Monte-Carlo simulation** (a headless
autoplay using the game's real resolver + difficulty ramp, with heuristic
players across skill tiers, ~50k games). Final values:

```
base 1.6 · groupBonus 1 · chainMult [1, 1.6, 2.4, 3.2, 4] · burst 40 + 6/cleared
```

Per-merge "+N" the player sees (chain 1, group 3): make-2 **+3**, make-3 **+5**,
make-4 **+6**, make-5 **+8**, make-6 **+10**, ruby **+11**. Group of 4/5 adds a
bonus; chains escalate (making a 3 at chain 1/2/3/4 = +5/+8/+12/+15); a Ruby
Burst clearing 4 neighbours = **+64**.

Resulting score distribution (per 3-min round) — **500 is the aspirational
ceiling, never clamped**:

| Player tier (sim) | median | reaches 400 | reaches 450 | **reaches 500** |
|---|---|---|---|---|
| casual  | ~218 | 0% | 0% | 0% |
| average | ~324 | 1.7% | 0.1% | 0% |
| strong  | ~423 | 73% | 23% | **1.4%** |
| near-perfect (superhuman) | ~467 | 96% | 67% | **19%** |

Casual sits in the §1.4 150–300 band; a great human run lands 400–450; 500
demands near-perfect play (§05 escalation), and the counter stays uncapped
(observed max ~606). Re-run the sim if `weightsEnd`, the round length, or the
difficulty ramp change.

---

## 6. Round, exits & state machine

### 6.1 States (CLAUDE.md §10)

`MENU` → `PLAYING` → `GAME_OVER`. Title (Play, mute, pbot) · main loop ·
final card.

### 6.2 Main loop (per turn)

1. A piece sits in the tray.
2. Player rotates (optional) and drags it to the grid.
3. Valid drop → write dice to the board.
4. Run the resolver (§4.6), animating each step and chain.
5. Update score (floating +N, combo popup).
6. Check end conditions.
7. Spawn the next piece. Repeat.

The countdown runs independently the whole time `PLAYING`.

### 6.3 Two exit conditions (CLAUDE.md §1.2, §6.4)

- **Soft — hard lock with time remaining:** the tray pair fits **nowhere** —
  i.e. there is no pair of adjacent empty cells in **either** orientation
  (horizontal or vertical) — **and** no merge is possible. Offer **CONTINUE**
  → clear a 3×3 area (mercy), keep the **same score and the leftover clock**,
  resume. Unlimited continues while the clock runs. (Rare in practice — the
  Ruby Burst and merges usually prevent lock.)
- **Hard — timer hits zero:** end the run. Modal headline **`TIME'S UP!`**.
- **Declined continue** (player dismisses the lock prompt with time left, or
  locks with no time left): headline **`GAME OVER`**.

`TIME'S UP!` and `GAME OVER` are different states — use the right one per
CLAUDE.md §6.4.

### 6.4 Early end (required, §6.5)

A visible **End** control (small button near the HUD) lets the player end the
run early and submit the current score through the same callback contract.

---

## 7. HUD, screens & visual composition

### 7.1 Top HUD bar (DESIGN.md §5.12, BEST-PRACTICES §06b)

One DOM row, `max-w-md`, `flex justify-between items-center gap-2 z-10
shrink-0`, overlaid above the canvas:

1. **Score pill** — `flex-1`. Two-tone JDP pill: `Score` label (Brick Red
   `#9E131F` bg / Light Yellow `#FFD633` text) · value (Blue `#133B9F` bg /
   white Poppins 800). **No `/500` denominator.**
2. **Time pill** — `flex-1`. Same chrome, `Time` label, `mm:ss` monospaced
   countdown.
3. **Audio toggle** — fixed 44×44 circular button (DESIGN.md §5.11), copy the
   reference CSS verbatim.

**Urgency:** in the final `urgentAtMs` (10 s), add `pulse-urgent` to the Time
**value element only** (scale 1→1.15, white→light-yellow, 0.8 s loop) — not
the chrome.

Below the HUD: the canvas hosts the **board** (top) and the **tray** (bottom
strip) so both scale together to the viewport.

### 7.2 Screen composition (back-to-front)

1. Navy background (`palette.navy`).
2. Felt board — rounded rect, `feltA → feltB` gradient, subtle grid lines
   (`gridLine`). Generated at boot.
3. Dice — generated canvas textures keyed by value (`die_1`…`die_6`, `die_ruby`)
   using the §6 placeholder-key pattern; pips drawn in code.
4. Tray strip — the current piece, with a rotate affordance on pairs.
5. Effects — sparkle pops, "+N" floats, combo popup, Ruby-burst flash, snap
   preview tint. All runtime-generated.
6. DOM HUD (above) and DOM modals (Continue / Game Over).

### 7.3 Title (MENU)

pbot idle, game title **Dadu Didik**, **`START GAME`** primary CTA (DESIGN.md
§5.1 yellow-gradient button), mute toggle, best score line.

### 7.4 Game Over card

Headline `TIME'S UP!` or `GAME OVER` · final **Score** (alone, no `/500`) ·
**Best** · **NEW BEST!** celebration when beaten · single CTA per §9.

---

## 8. Polish budget (CLAUDE.md §6.2, BEST-PRACTICES §07)

- **Tactile input:** piece lifts & scales 1.06× on grab; snap-preview tint
  follows the drag; pair rotate has an 80 ms spin.
- **Placement travel (D11):** on a valid drop, the pair's two dice tween from
  the tray to their landing cells (`anim.place`, short ease-out arc/slide),
  then a soft "set" squash on each landed cell — never an instant snap.
- **Merge:** losing dice **slide** into the anchor (`anim.slide`), then the
  result die **pops** in (`anim.pop`) with a sparkle ring + floating "+N".
- **Chain:** each step staggered by `chainStagger`; **rising pitch** per step;
  combo popup escalates ("COMBO ×3!").
- **Ruby Burst:** ≥3-phase moment — gold flash → ruby sparkle scatter → cells
  clear with a light shock ring (no smoke/explosion imagery; cheerful, §0.3).
- **Urgent HUD:** Time value pulses in the final 10 s.
- **NEW BEST!** celebration on the game-over card.
- **Generous hit pads:** ~40 px invisible padding on tray/buttons for mobile.
- **Board reveal:** brief stagger of grid cells lighting up at round start.

---

## 9. End-of-game flow, copy & i18n

### 9.1 Standardized copy (CLAUDE.md §6.4) — uppercase

| Moment | English | BM (`?lang=ms`) |
|---|---|---|
| Title CTA | `START GAME` | `MULA MAIN` |
| Timer hit zero | `TIME'S UP!` | `MASA TAMAT!` |
| Run ended otherwise | `GAME OVER` | `PERMAINAN TAMAT` |
| Audio playing | `AUDIO ON` | `AUDIO ON` |
| Audio muted | `AUDIO OFF` | `AUDIO OFF` |
| End CTA, score > 0 | `CLAIM SCORE` | `TUNTUT SKOR` |
| End CTA, score = 0 | `RETRY` | `RETRY` |

`?lang=ms` switches **all** copy (subtitles, combo text, hints) to BM;
unknown values fall back to English; the choice is **not** persisted (URL is
the source of truth). Game-specific strings to translate: subtitle, "Drag a
die to the board", "Merge three to grow!", "COMBO ×N!", "RUBY BURST!",
"NEW BEST!", "CONTINUE", "End", lock message.

### 9.2 CLAIM SCORE / RETRY (CLAUDE.md §6.5)

- **Final modal, one CTA.** Score `> 0` → **`CLAIM SCORE`** submits to the
  callback. Score `= 0` → **`RETRY`** restarts locally, no submit.
- **Callback resolution:** `callback_url` query param (must be `https:`) →
  else platform fallback `window.__JDP_CALLBACK_URL__` → else null. Never
  hardcode a public callback URL.
- **Payload (min):** `{ game: 'dadu-didik', score: int, token: uuid }`.
  Optional: `suspicious`, `suspicious_reason`, `log` (compact, no PII) — e.g.
  `{ duration_ms, placements, max_chain, merges, rubies, bursts }`.
- **Early-end** (§6.4) submits through the **same** contract.
- **Continue ≠ Claim:** the Continue prompt is unchanged; CLAIM SCORE appears
  only on the **final** modal.
- If integrating under the **Genet launcher**, switch to the §6.6 encrypted
  `token`/`dd`/`dv` contract with a duplicate-submit guard and never submit
  score 0.

---

## 10. Audio (CLAUDE.md §0.4, §6.3)

Web Audio synthesis, bright/friendly/arcade. Mute applied **before** any tone.

| Event | Sound |
|---|---|
| Place | soft wooden "tok" |
| Merge | round "bloop", pitch by result tier |
| Chain step | **rising** pitch per step (sells the cascade) |
| Ruby Burst | bright shimmer arpeggio (celebratory, not explosive) |
| Game over | gentle descending three-note |

**No BGM — SFX-only (D12).** This still satisfies CLAUDE.md §0.4 (SFX for the
primary action, pickup/merge, and round end, plus a working mute).

Mute toggle in every scene; state in `localStorage['dadu-didik:mute']`
(try/catch); icon/`aria` reflect current state per DESIGN.md §5.11.

---

## 11. Controls (CLAUDE.md §0.2, §11)

- **Desktop:** click a tray pair to rotate; click-drag a piece to the grid.
- **Touch:** tap a pair to rotate; touch-drag to place. Targets ≥44×44.
- **Responsive:** resize canvas on `window.resize`, apply `devicePixelRatio`;
  board + tray scale to fit 360 px portrait → desktop. `<meta viewport>`
  present. Test in dev-tools emulation **and** one real device.

---

## 12. Dev shortcuts & persistence (pattern #10)

- `?scene=menu|play|over` jumps straight to a state (mocked score for `over`).
- `?lang=ms` BM copy. `?burst=block` swaps the burst pattern for testing.
- `localStorage`: `dadu-didik:best`, `dadu-didik:mute` — both try/catch for
  sandboxed webviews; mute read before first tone.

---

## 13. Build order (brief §17 — ship the core loop first)

Get **1–4 playable before anything else.** That core loop is the whole game.

1. Static 5×5 felt board + empty tray on a resizing canvas.
2. Spawn a die in the tray; drag & drop onto an empty cell. *(Dev bootstrap:
   a single die is fine here to stand up the drag mechanic — the shipped tray
   is always a pair, added in step 5.)*
3. Orthogonal cluster detection + 3+ merge into the next number, anchored at
   the placed cell.
4. Chain resolution + basic scoring (floating +N).
5. **Always-pair spawning** (D11) + tray rotation + the tray→grid travel
   tween (`anim.place`). Every piece is now a rotatable pair.
6. Ruby tier (6→Ruby) + Ruby Burst (cross clear).
7. 3-minute timer + `TIME'S UP!` / `GAME OVER` cards + Continue (mercy 3×3).
8. Spawn weighting + ramps, merge/burst animations, Web Audio SFX (no BGM),
   mute toggle, HUD pills, pbot on the title.
9. CLAIM SCORE/RETRY + callback + early-end; `?lang=ms`; **tune** weights,
   scoring, and cap escalation until a strong run ≈ 500 and it *feels* right.

---

## 14. Definition of done (CLAUDE.md §8 — must all hold)

- [ ] Loads from a static host, no backend.
- [ ] Plays on desktop + mobile (portrait ≥360 px) + tablet; touch & mouse.
- [ ] §0.3 content review — no violence (Ruby Burst is cheerful), no ads/
      tracking; only `localStorage` for best/mute.
- [ ] SFX for place / merge / chain / burst / game-over; mute before audio.
- [ ] Vanilla single-file Canvas 2D (stack justified, §D1).
- [ ] One endless 3-min round; one currency, one HUD number.
- [ ] Zero separate power-ups (Ruby Burst intrinsic) — within the §1.5 cap.
- [ ] Difficulty ramps peak at ≤85%; cap enforced by escalation, never a
      counter clamp; no `/500` denominator anywhere.
- [ ] Payload ≤3 MB (will be < 200 KB); any shipped art WebP, audio is synth.
- [ ] Folder layout per §5.1 (single file).
- [ ] Polish checklist (§8) complete; visuals reconciled to DESIGN.md.
- [ ] Mute + best-score persistence (try/catch).
- [ ] §6.4 copy + `?lang=ms`; §6.5 CLAIM SCORE/RETRY + `callback_url` +
      fallback; early-end submits same payload.
- [ ] `?scene=` dev jump from day one.
- [ ] Listed in [`games.js`](../games.js): `{ name: 'Dadu Didik', path:
      './dadu-didik/', status: 'pending', author: 'akmalakhpah' }`.

---

## 15. Resolved settings

1. **Author:** `akmalakhpah` (used in the `games.js` entry).
2. **Scoring:** LOCKED via Monte-Carlo simulation (§5) — `base 1.6`,
   `groupBonus 1`, `chainMult [1, 1.6, 2.4, 3.2, 4]`, `burst 40 + 6/cleared`.
3. **Audio:** SFX-only, no BGM (D12).
4. **Mascot:** pbot on the title screen only (D13).
5. **Tray:** every piece is always a pair with 4-way rotation
   (0/90/180/270, D11), with a tray→grid travel tween on placement.
```
