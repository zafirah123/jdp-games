# Heads Up!: Game Mechanics

## The two layers

The screen runs two games at once, layered by depth in a single view (not split
into two boxes), and one set of controls drives both.

### Layer one, the road (background, left/right)

The upper part of the screen is a wide three-lane road, seen ahead of you and
receding gently to a hazy horizon, with grass on either side. Obstacles appear
at the far end of a lane and slide toward you, growing as they approach. There
are five: a **cone**, a **road barrier** (red/white stripes on legs), a **brick
pile**, a **crate**, and a **wet-floor sign**. **Left and right switch you
between the three lanes** — left, centre, right. Your current lane is shown by a
walking shadow (head and shoulders) and a highlighted lane, with no character
sprite. Let an obstacle reach you in the lane you're standing in and you trip.

The road stays empty for the first **~12 seconds** so you can learn the dino
jump before you also have to watch your feet.

### Layer two, the phone (foreground, jump)

Held in your hands across the bottom of the screen is your phone, running the
offline dino runner. A pixel dinosaur auto-runs while cacti scroll in toward it.
A single **jump** (up arrow, space, or a tap on the phone) hops the dino over
them — there is no duck, so the phone game needs exactly one button. The dino
has **three hearts** (shown top-left of the phone screen). A cactus hit costs
one heart, with a brief blink of grace afterward. Lose the last heart and the
run is over.

So you are not choosing between the two. You are responsible for both at once —
your feet on the road and your dino on the phone.

## Controls

Three controls drive the whole game, split across the two layers.

**Switch lane (left / right)** — arrow keys or A and D on desktop; on mobile,
tap the left or right side of the road (the upper area). Each press hops you one
lane toward that side.

**Jump** — up arrow, space, or W on desktop; on mobile, tap the phone (the lower
area). This hops the dino. Tapping again **while the dino is already in the air**
gives it one extra mid-air boost (a higher double-jump) — useful for a late save.

## The interplay — why both lanes matter

This is the heart of the game. Trip on the road and you **stumble**: for about
**1.5 seconds** you lose control — you can't switch lanes *or* jump — the screen
jolts, you stop walking (the road freezes), and the lane marker flashes red. You
can't trip again while stumbling.

But the **dino keeps running and cacti keep coming**, and you can't jump to save
it. So a trip on the road usually costs the dino **one or two hearts**. That's
the floor's real stake: neglect your feet and your dino pays for it. The two
streams of danger feed each other, which is the whole multitasking pressure.

## Power-ups

Three power-ups, each tied to the layer it's earned on (they don't cross over):

- **Shield (blue diamond)** — appears in a clear road lane. Bank it, and it
  blocks the next *floor* obstacle (no stumble). Floor-only.
- **Focus (yellow star)** — floats in the dino runner; jump to grab it for
  **5 seconds of 2× score** (no speed change). A pulsing `2×` badge and timer
  bar show while it's active. Dino-only.
- **Extra heart (red heart)** — a one-time rescue. It appears **once per game**,
  only when you're down to your **last heart**, at a random score between **100
  and 150**. Grab it in the runner for **+1 heart**.

## Failure conditions

There is only one way to end the run: the dino loses its **last heart** →
**GAME OVER**. There is no timer to run out and no Continue. (A floor trip never
ends the run by itself — it just exposes the dino, as above.) The player can
also end the run early with the **End Run** button.

## Difficulty curve

The run has a soft three-minute arc with no hard time-up. Both layers ramp
smoothly — the road crowds up (sparser early, denser later; two-lane waves grow
common only late) and the cacti come faster and closer. As you approach the
three-minute mark the cacti **hard-taper**: they get dense enough that surviving
becomes near-impossible, so a strong run naturally ends — by losing hearts —
right around there, instead of an abrupt clock cutoff. The thing that breaks
most players isn't reaction speed but sustained split attention.

## Scoring

Score is based on survival — it climbs at a steady rate the whole time you stay
alive (a clean full round lands around **500**). There is **no hard cap**:
grabbing Focus stars and surviving longer push you past it. One number on the
HUD; the timer is hidden. There is no win condition, only a personal best.

## Design intent

The whole game is built around divided attention. A normal dodger trains one
channel of focus. Heads Up! deliberately overloads you with two, and wires them
together so a mistake on one lane endangers the other. The comedy of walking
into a cone because you couldn't put your phone down is a small, friendly joke
about looking where you're going — which suits a school audience without ever
being preachy.
