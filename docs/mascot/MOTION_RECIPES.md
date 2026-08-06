# Motion Recipes

Source of truth: `lib/mascot/motion/MotionRecipes.ts` (per-behavior second-order
dynamics) and `lib/mascot/MascotConfig.ts` (`MASCOT_CONFIG`, everything
else). These are starting values tuned by engineering judgment and the
motion-review rubric in
`.claude/skills/directing-character-motion/references/review-rubric.md`,
not measured against real user sessions — treat them as a documented
starting point for `/motion-lab` iteration, not final art direction.

## Second-order dynamics per behavior

| Behavior | frequency | damping | response | Visual intention |
|---|---|---|---|---|
| `dormant` | 0.35 | 1.0 | 0 | Barely drifts; the character is "asleep," critically damped so it settles without overshoot before the user has interacted at all. |
| `wake` | 1.1 | 0.9 | 0.12 | A brief, slightly anticipatory perk-up — small positive response gives a hint of overshoot, like startling awake. |
| `follow` | 1.7 | 0.72 | 0.08 | Responsive to the pointer without feeling twitchy; damping under 1 allows a small, controlled overshoot so the chase reads as alive rather than robotically locked-on. |
| `wander` | 1.05 | 0.62 | -0.12 | Slower and looser than follow; negative response makes the root anticipate *before* moving in the target's direction — a lazy, thoughtful quality suited to autonomous roaming. |
| `inspect` | 1.3 | 0.86 | 0 | Higher damping than wander — settles cleanly when approaching a project card, no overshoot to disturb the "looking at something" pose. |
| `orbit` | 1.2 | 0.75 | 0.05 | Close to inspect but slightly livelier, since orbit is actively circling rather than holding still. |
| `avoid` | 2.6 | 0.78 | 0.15 | Fast and urgent — this is the escape response when a hard obstacle's steering force crosses `MASCOT_CONFIG.steering.avoidTriggerForce` (90). |
| `sprint` | 2.4 | 0.52 | 0.3 | The fastest, loosest recipe — low damping and high positive response give a stretch-and-launch quality; only entered from a `"diagonal-sprint"` wander segment. |
| `rest` | 0.5 | 1.15 | 0 | Slow and overdamped; paired with `stateStretch < 1` in `DotSkin` deformation for a slight compression, plus reduced solver work. |
| `scatter` | 3.2 | 0.4 | 0.4 | Deliberately the least stable-looking recipe — this is the one state where visual "noise" is the point. |
| `reform` | 1.4 | 0.9 | 0 | Controlled, clean settle back to a normal pose after scatter. |
| `reducedMotion` | 0.25 | 1.2 | 0 | Slower than dormant, maximally damped — the reduced-motion state must read as nearly static. |

## Heading (orientation) filter

`PoseController` drives a second, independent second-order filter for the
root's facing angle (`setHeadingRecipe`, called every `MascotRuntime.update()`
with `frequency: recipe.frequency * 0.8, damping: recipe.damping`) — the
head turns slightly slower than the root translates, so direction changes
read as a deliberate turn rather than an instant snap. The target angle is
only updated once translational speed exceeds `HEADING_ACTIVATION_SPEED`
(1 px/s) to avoid the heading jittering while nearly stationary.

## Spine

- 24 joints, 12px segment length (`DEFAULT_CREATURE_RECIPE.spine`).
- Head angle limit: 10°. Tail angle limit: 32°, interpolated across joints
  via a smoothstep (`AngleConstraint.angleLimitForRegion`) — stiffer near
  the head, softer toward the tail, per spec.
- Solver iterations by quality: reduced 1, low 2, medium 3, high 4
  (`CreatureRecipe.getSpineIterationsForQuality`).

## Body profile

`bodyWidth()` (`lib/mascot/character/BodyProfile.ts`): `headScale: 1.9`,
`shoulderPosition: 0.3`, `tailExponent: 1.35`, `bellyBias: 0.08`,
`maxWidth: 26`px. Front-weighted — mass concentrated near the head/shoulder
region (t≈0.05–0.55, verified by `BodyProfile.test.ts`'s peak-location
assertion), tapering to near-zero at the tail tip.

## Secondary motion (Verlet)

- Two antennae, 4 segments each, 6px segment length, drag 0.94, 3 solver
  iterations, root pinned near joint[1] offset perpendicular to heading.
- One tail whisker, 4 segments, 5px segment length, drag 0.9, 3 iterations,
  root pinned to the last spine joint.
- A constant downward "gravity" (60 px/s² for antennae, 30 px/s² for the
  whisker) gives both a resting droop instead of floating perfectly rigid.

## Behavior durations

| Behavior | minimumDuration | maximumDuration | Why |
|---|---|---|---|
| `dormant` | 0.5s | — | Exits on first pointer activity, or automatically after 3s so the character isn't inert forever on a page nobody touches. |
| `wake` | 0.4s | 1.2s | Brief transitional beat before follow/wander. |
| `follow` | 0.4s | — | Exits once `pointerIdleSeconds > 2.5` (`MASCOT_CONFIG.pointerIdleThresholdSeconds`). |
| `wander` | 0.5s | 40s | The long ceiling is a safety valve, not a target — normal exits happen via wander-segment hints (`rest-curl` → rest, `card-orbit`/`curiosity-circle` → inspect) or pointer activity. |
| `sprint` | 0.5s | 3s | Short burst per spec ("Autonomous sprints must be brief"). |
| `rest` | 2s | 12s | Long enough to read as genuine resting, not a glitch. |
| `inspect` | 1.2s | 3s | "Inspection must end automatically" — capped well under user patience. |
| `orbit` | 0.8s | 1.8s | A brief circling flourish after inspect settles, then back to wander. |
| `avoid` | 0.3s | 2s | Fast entry (urgency), bounded exit once clear of the obstacle. |
| `scatter` | 0.5s | 0.6s | Matches `scatterProgress`'s 0.5s ramp-up in `MascotRuntime`. |
| `reform` | 0.7s | 1.2s | Matches `scatterProgress`'s 0.9s ramp-down. |
| `reducedMotion` | 0s | — | No minimum — must be able to exit the instant the preference changes. |

## Glow intensity per behavior

`behaviorGlow()` in `lib/mascot/MascotRuntime.ts`: dormant 0.08,
reducedMotion 0.1, rest 0.15, wander 0.35, wake 0.4, follow 0.55, avoid 0.6,
inspect/orbit 0.7, reform 0.75, sprint 0.85, scatter 0.9 — roughly tracks
"how much is happening," so the core's glow is a secondary, ambient
readout of behavior state without adding a second explicit UI.

## Steering

`MASCOT_CONFIG.steering`: hard-obstacle influence radius 90px, soft 50px,
max force 140px, tangent weight 0.45 (0.15 for the `avoid` behavior's more
urgent, less-tangential escape). `avoidTriggerForce`: 90 — the `avoid`
state activates once the combined hard-obstacle steering force from
`MascotRuntime.getHardObstacleForce()` crosses this threshold, and
de-activates once it drops below half that.
