# Heads Up!: Game Mechanics

## The two layers

The screen runs two games at once, layered by depth in a single view (not split
into two boxes), and one set of controls drives both.

### Layer one, the canteen floor (background, left/right)

The upper part of the screen is a wide three-lane canteen floor (think Subway
Surfers), seen ahead of you and receding gently to a horizon. Obstacles appear at
the far end of a lane and slide toward you, growing as they approach: dropped
backpacks, yellow wet-floor signs, puddles, bins, crates. **Left and right switch
you between the three lanes** — left, centre, right. Your current lane is shown by
a highlighted lane and a marker (no character sprite). Let an obstacle reach you
in the lane you're standing in and you trip — that ends the run.

### Layer two, the phone (foreground, jump)

Held in your hands across the bottom of the screen is your phone, running the
offline "no internet" dino runner. A pixel dinosaur auto-runs to the right while
cacti scroll in toward it. A single **jump** (up arrow, space, or a tap on the
phone) hops the dino over them. Every obstacle on the phone is clearable with a
well-timed jump — the phone game needs exactly one button. Crash the dino and
that ends the run too.

So you are not choosing between the two. You are responsible for both at once —
your feet on the floor and your dino on the phone.

## Controls

Three controls drive the whole game, split across the two layers, which is what
creates the multitasking pressure.

**Switch lane (left / right)** — arrow keys or A and D on desktop; on mobile, tap
the left or right side of the floor (the upper area). Each press hops you one lane
toward that side.

**Jump** — up arrow or space on desktop; on mobile, tap the phone (the lower
area). This makes the dino hop its obstacles.

Because two fingers are running two different games, a sidestep to dodge a bin
lands in the same breath as a jump you need to save your dino. Your attention is
the real resource being tested, not your reflexes alone.

## Failure conditions

You lose when either layer fails. There are two ways to drop the run.

One, an obstacle reaches you in your current lane on the floor and you trip.
Two, the dino on your phone hits a cactus or bird and crashes.

A single mistake in either place can end the whole run, so you cannot fully
ignore one layer to focus on the other.

Because time is a shared budget, a failure with time still left on the round
clock offers a **Continue** — you recover with the same score and the leftover
time, and the round only truly ends when the clock hits zero.

## Power-ups

Two power-ups, one per layer, capped per the JDP rules:

- **Shield (aid)** — appears on the floor; walk into it to bank a one-hit
  shield that absorbs the next mistake on *either* layer.
- **Focus (frenzy)** — a star in the dino runner; jump to grab it for a few
  seconds of slow-motion across both layers plus a score boost.

Heavy-payout Focus stars stop appearing once you are within reach of the score
cap, so the late game stays honest.

## Difficulty curve

The run is one continuous round of about three minutes. It starts gentle so you
can learn the rhythm of holding two streams of obstacles. As you survive longer,
both layers get busier and faster — the floor crowds up and the cacti come
quicker and closer. The ramp is smooth and peaks at roughly 85% of the round, so
the final stretch sits at maximum chaos. The point where most players break is
not reaction speed but sustained split attention.

## Scoring

Score is based on survival. The longer you keep both your feet and your dino
intact, the higher your score climbs. One number, one HUD, capped at 500 for a
perfect three-minute round — enforced by the difficulty ramp tightening near the
cap, never by freezing the counter. There is no win condition, only a personal
best to beat.

## Design intent

The whole game is built around divided attention. A normal dodger trains one
channel of focus. Heads Up! deliberately overloads you with two, using one
shared control set so the two channels interfere. The comedy of walking into a
bin because you couldn't put your phone down is a small, friendly joke about
paying attention to where you're going — which suits a school audience without
ever being preachy.
