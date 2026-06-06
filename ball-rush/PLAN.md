# Ball Rush — Plan

A counting-pattern reskin of *Tunnel Rush*. The ball rushes down a rotating
tunnel; the player steers to **collect the next number in a procedurally
generated sequence** while **dodging lethal holes**. Teaches skip-counting and
times-tables through pattern inference under time pressure.

This document is the agreed build contract. It governs only the `ball-rush/`
folder and defers to the root [`CLAUDE.md`](../CLAUDE.md),
[`BEST-PRACTICES.md`](../BEST-PRACTICES.md), and [`DESIGN.md`](../DESIGN.md)
on anything not stated here.

---

## 1. Concept

> How high can you count? Steer your ball through a fast rotating tunnel,
> collect the numbers that continue the pattern, and dodge the holes. Each
> pattern you complete makes the tunnel change color and the next pattern
> harder.

- **Source game:** Tunnel Rush (continuous-rotation tunnel, dodge holes).
- **Educational twist:** scoring is gated on **completing number sequences**,
  not just survival. The player must *infer the rule* (e.g. +2, ×3, −10) from
  the numbers shown and pick the correct next value.

---

## 2. Locked design decisions

These were settled in discussion and are not open for re-litigation during
the build:

| # | Decision | Choice |
|---|---|---|
| D1 | Failure model | **Holes are lethal.** Crash → Continue if time remains (§1.2), else final modal. Wrong number is **not** lethal — it only breaks the combo. |
| D2 | Movement | **Continuous 360° rotation.** Hold left/right to rotate the ball around the ring. |
| D3 | Target hint | **Running-sequence-only.** No rule label. First 2 numbers are seeded; the player infers the step. |
| D4 | Pattern scope | **Skip-counting + multiples**, ascending and descending. |
| D5 | Gate layering | **Alternate stretches.** Hazard stretch (holes, no numbers) → number gate (numbers, no holes). Never both in the same instant. |
| D6 | Choices per gate | **3** numbered balls — one correct + two distractors. |
| D7 | Power-ups | **Slow-Mo** (aid) + **Double Score** (frenzy). |
| D8 | Numbers | **Procedurally generated at runtime.** New sequences every session; nothing hardcoded. |
| D9 | Continue behavior | On Continue after a crash, the **current sequence restarts fresh**; score is kept. |
| D10 | Color | Tunnel **color changes per sequence**, rotating a JDP-token-derived palette; the change signals a new pattern. |

---

## 3. Core loop

1. Ball rides the inner surface of a rotating tunnel rushing toward the camera.
2. Player **holds left/right** (screen halves on touch, arrow keys on desktop)
   to rotate the ball around the ring (~3 rad/s).
3. The tunnel alternates two stretch types:
   - **Hazard stretch** — segments of the ring are **holes**. Rotate to a solid
     segment; falling into a hole ends the run. No numbers here.
   - **Number gate** — a ring carrying **3 numbered balls** at different angles.
     Rotate to align with the **correct next number** and pass through it. No
     holes here.
4. Collecting the correct number banks points and advances the sequence.
   Completing the sequence triggers a combo, level-up, and color change.

---

## 4. Counting mechanic

### 4.1 Sequence shape
- Each sequence is **5 numbers**.
- The **first 2 are seeded** (shown pre-filled in the HUD strip: `2  4  _  _  _`)
  so the step is inferable — running-sequence-only (D3).
- The player **collects the remaining 3** through number gates.

### 4.2 Procedural generator — `genSequence(level)`
Generated fresh per sequence at runtime via `Math.random()`. Picks a type +
params within level-scaled bounds, emits 5 numbers.

**Types**
- `ascending` — `start + step·i`
- `descending` — `start − step·i`
- `multiples` — `n, 2n, 3n, 4n, 5n`

**Difficulty-scaled params**

| Tier | Level | Types | Step / table | Start range |
|---|---|---|---|---|
| T1 | 1–2 | ascending | `{2, 5, 10}` | 0–20 |
| T2 | 3–4 | ascending, descending, multiples | step `{3, 4, 25}`, table `×3, ×4` | 0–60 |
| T3 | 5+ | all | step `{6, 7, 8, 50}`, table `×6…×9` | 0–120 |

**Guards**
- Descending starts high enough to never go negative.
- Hard ceiling on any value ≈ **300**; regenerate if exceeded.
- Don't repeat the immediately previous `(type, step, start)` — every color
  change should feel like a genuinely new puzzle.

### 4.3 Distractors — per gate (2 wrong balls)
Generated relative to the correct target `T` and step `s`, drawn from
`{T±1, T−s, T+s}`, deduped, and `≠ T`. These model **off-by-one** and
**wrong-step** mistakes so wrong picks still teach.

### 4.4 Resolution
- **Correct pick** → bank points immediately, advance the strip.
- **All 3 collected** → combo bonus, **level +1**, **tunnel color change**,
  next sequence generated harder.
- **One wrong pick** → keep already-banked points, **forfeit the combo**,
  reset to a new sequence + new color (not lethal).

---

## 5. Scoring — one HUD number (§1.3)

`Score` is the only counter. Level is expressed through **color + difficulty +
a small `Lv n` tag**, never its own bar.

- `correct = 5 × level`
- `combo   = 25 × level` on completing a sequence
- **Cap = 500** (§1.4) via soft taper, never a clamp:
  - scale gains by `1 − smoothstep(420, 520, score)`
  - suppress Double-Score spawns within ~70 of the cap

*(Starting constants; live in the config block and are tunable.)*

---

## 6. Difficulty arc (two vectors)

- **Speed** ramps with **time**: `{ start, end }`, peaks at **~85%** of the
  180s round, then holds (§1.1).
- **Pattern complexity + hole density** ramp with **level** (§4.2).

---

## 7. Power-ups (D7) — rare drops, mostly-empty rolls

| Role | Name | Effect |
|---|---|---|
| Aid | **Slow-Mo** | Tunnel ×0.5 speed for ~4s. Gives time to compute/align. |
| Frenzy | **Double Score** | 2× points for ~6s. Suppressed within ~70 of the cap. |

Each power-up has a distinct visual language (ring + label + aura on activation).

---

## 8. Endings & callback flow (§6.4–§6.5)

- **Timer hits 0** → `TIME'S UP!` modal (the natural end).
- **Hole crash, Continue declined / no time** → `GAME OVER` modal.
- Both end on a single CTA:
  - `score > 0` → **`CLAIM SCORE`** → callback (`game: 'ball-rush'`, `score`,
    random `token`); `callback_url` query param, else platform fallback.
  - `score = 0` → **`RETRY`** (local restart, no callback).
- **Continue** (§1.2): hole crash with time left → CONTINUE prompt; resume same
  score + leftover clock, current sequence restarts fresh (D9).
- **Early-end**: player-accessible button during play that ends the run and
  submits through the same callback contract.

---

## 9. Polish (§6.2) & brand

- Squash on rotate; sparkle + floating `+n` on pickup.
- 3-phase crash: flash → ball shatter → screen shake (cartoonish failure, §0.3).
- Power-up activation: ring + label + aura.
- HUD turns red/urgent in the final 10s.
- `NEW BEST!` celebration.
- Per-sequence color rotates a **JDP-token-derived palette** (navy base, accent
  hue shifts each level) — reconcile against [`DESIGN.md`](../DESIGN.md) §1.
- Pseudo-3D tunnel rendered in **Canvas 2D** (concentric segments scaling toward
  a vanishing point) — no WebGL.

---

## 10. Standardized copy & i18n (§6.4)

`START GAME` · `TIME'S UP!` · `GAME OVER` · `AUDIO ON` / `AUDIO OFF` ·
`CLAIM SCORE` / `RETRY`. `?lang=ms` switches all copy to Bahasa Melayu.

---

## 11. Audio (§0.4)

Web Audio synthesized SFX (zero bytes shipped):
- correct pick (bright), wrong pick (soft buzz), combo (arpeggio),
  power-up, crash (cartoonish), final-seconds tick.
- Optional short synthesized BGM loop.
- Mute toggle top-right, persisted in `localStorage`, **applied before any
  audio plays**.

---

## 12. Tech & housekeeping

- **Stack:** vanilla JS + Canvas 2D, **single `ball-rush/index.html`** (§4
  default). No build step, no framework.
- `localStorage`: `ball-rush:best` and mute, wrapped in try/catch.
- **Dev jumps:** `?scene=`, `?level=`, `?lang=ms` from day one.
- `games.js` entry: `{ name: 'Ball Rush', path: './ball-rush/', status: 'pending', author: 'akmalakhpah' }`.
- Payload ≤3 MB target (trivially met — no asset files).

---

## 13. Build checklist (maps to root §8)

- [ ] Single-file `index.html`, Canvas 2D, vanilla.
- [ ] Config block at top: palette, round duration, speed `{start,end}` ramp,
      rotation speed, scoring constants, generator tiers, power-up timings.
- [ ] Pseudo-3D rotating tunnel renderer.
- [ ] Continuous rotation input — touch halves + arrow keys.
- [ ] Alternating hazard / number-gate stretch scheduler.
- [ ] `genSequence(level)` + distractor generator (§4).
- [ ] HUD: single Score, sequence strip, timer, `Lv n` tag, mute.
- [ ] Lethal holes + 3-phase crash + Continue flow (§8).
- [ ] Slow-Mo + Double Score power-ups with cap suppression.
- [ ] 500-cap soft taper (no clamp).
- [ ] Endings + CLAIM SCORE / RETRY callback + early-end button.
- [ ] Web Audio SFX + mute applied before audio + best score persistence.
- [ ] Standardized copy + `?lang=ms`; `?scene=`/`?level=` dev jumps.
- [ ] Per-sequence color rotation reconciled to DESIGN.md.
- [ ] Tested desktop + mobile (≥360px) + tablet.
- [ ] Listed in `games.js` with `author`.
