# Mochi — a little higher

The home-page companion is now **Mochi**, an original round bunny. This replaces the previous Octocat approximation and its three-ledge checklist with a continuous climbing game.

- Home: `/` in Explore mode. Pet the bunny on the guitar strings; use the separate **Play** pill to enter.
- Direct entry: `/?mochi=play`.
- The previous `/?octocat=play` link still opens the new game.
- `/octopod-lab` remains an independent experiment.

## Reference analysis

Reviewed both September attachments, including the current implementation recording (`screenrecording-2026-09-15_17-01-01.mp4`) and the reference (`screenrecording-2026-08-07_10-39-34(7).mp4`).

| Observation                                                      | Previous implementation                                                                                                                                                       | Revision                                                                                                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compact silhouette in the reference                              | A large cat head, narrow torso and seven independently trailing tubes spread into a spider-like shape. This is especially visible around 12 seconds in the current recording. | One connected plush body, two short paws, small feet and two attached ear pivots.                                                                                     |
| Movement has a leading action and delayed follow-through         | Head and limb springs could pull the anatomy apart.                                                                                                                           | The body retains its volume during squash/stretch. Ear rotation and body tilt respond with damped springs; no free-floating head.                                     |
| The reference becomes a vertical platform game around 18 seconds | Three fixed navigation links were the entire objective.                                                                                                                       | An endless, reachable course with stars, springs, moving ledges, crumbling ledges, height and a saved personal best.                                                  |
| The game grows out of the app                                    | The home screen stayed static behind a large bottom HUD.                                                                                                                      | Mochi starts over the guitar; the hero recedes upward as the camera climbs. A compact top HUD leaves the playfield clear.                                             |
| Movement belongs to the player                                   | Repeated manual jumps and awkwardly spaced DOM ledges.                                                                                                                        | Manual, variable-height jumps, buffered input, coyote time, and one deliberate double jump. Normal platforms stay manual; marked amber boosters launch automatically. |

### What Cameron actually described

Read the linked June 2, 2026 thread through X's public HTML and official syndication/embed responses. The main post is [here](https://x.com/CameronFoxly/status/2061921964302967073). His follow-ups describe:

- [Blender modeling and rigging, orthographic framing, GLB export, and Three.js runtime animation](https://x.com/CameronFoxly/status/2061921966203060404).
- [A state machine for entrance, following, dragging, walking, jumping and the game](https://x.com/CameronFoxly/status/2061921967893254240).
- [Tuning head bob from a sine wave scaled by horizontal speed](https://x.com/CameronFoxly/status/2061921969474572636).
- [Bezier paths for changes in the look-at target](https://x.com/CameronFoxly/status/2061921971139662111).
- [Verlet physics on the rig's bones for dragging and throwing](https://x.com/CameronFoxly/status/2061921972918083781).
- [Mouse forces and predictive IK foot placement for procedural walking](https://x.com/CameronFoxly/status/2061921975040442807).
- [Pushing the actual app UI out of the way while climbing](https://x.com/CameronFoxly/status/2061921976659365962), and [using UI theme variables](https://x.com/CameronFoxly/status/2061921978345472367).

Mochi is an original implementation inspired by the interaction and timing. Its geometry is authored in code; it does not use Cameron's Blender model, GLB, IK rig or unpublished source. A smaller articulated character is a deliberate design choice, permitted by the user, rather than another approximation of Octocat's complex anatomy.

## September 21 revision: agency, feet, and reactions

The auto-bounce version left the feet grounded for only a fraction of a second. Its feet only moved vertically, so they could not communicate walking or weight. This revision removes auto-bounce and separates the feet from body deformation.

[Nintendo's Super Mario Bros. Wonder developer interview](https://www.nintendo.com/my/interview/aqmx/02.html) describes using animation to communicate character state, keeping expressions readable while showing direction, and matching sound to actions. These principles informed Mochi's skid, jump tuck, open-mouth surprise, directional lean and quiet landing sound. The jump buffering, checkpoint rules and original bunny/puff art here are our own implementation, not Nintendo code or assets.

## Controls and loop

- **Let's explore** or the first **Space** opens the course. Mochi stays on the starting foothold.
- Move with the mouse, **Left/Right**, **A/D**, touch drag, or the direction buttons.
- **Space / Up / W / Jump** launches from normal platforms only on a new press. Amber boost pads launch automatically on landing. Hold to go higher; release for a shorter hop. The opening ledges are reachable with a short hop.
- Press again in flight for one double jump. It refills on landing. A press within 140ms of landing is buffered for the next ground jump; a 100ms grace window also permits jumping just after leaving an edge.
- **P** pauses, **R** restarts, **Escape** exits. Blur and tab hiding pause the run.

The Jump button supports pointer capture, press/release, keyboard activation and assistive clicks. Pausing, restarting or exiting clears held input. A held key never auto-repeats a jump after a normal landing. Automatic amber boosts are independent of held input.

### Course rules

| Element                 | Behavior and player choice                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gold star               | Collect once per run, including after checkpoint recovery.                                                                                                              |
| Amber boost pad         | Automatically launches upward and toward the next ledge on landing. Arrows show direction. Air steering and the double jump remain available.                           |
| Green spring            | Stand safely, then press Jump for a stronger launch. Never launches automatically.                                                                                      |
| Moving foothold         | Carries Mochi and planted feet together.                                                                                                                                |
| Cracked peach foothold  | Shows a shrinking warning bar for 950ms before breaking. Jump before it collapses.                                                                                      |
| Purple puff             | Patrols its ledge and looks toward Mochi. Avoid its sides or land on its head for two stars. Stomping squashes it; it does not auto-launch Mochi.                       |
| Flower foothold         | Saves a checkpoint and restores one heart, up to three. Introduced every eight rows.                                                                                    |
| Tumble / side collision | Costs one heart and returns to the most recent safe spot after a brief hurt reaction. Recovery includes 1.4 seconds of protection from puffs. Zero hearts ends the run. |

The first three ledges introduce movement safely. The first patrol has an inline hint. Gap, horizontal distance and ledge width are bounded; there is room to avoid each patrol. Camera progress is monotonic during normal climbing, with an intentional reset when returning to a checkpoint. Score and claimed rewards survive recovery; retry creates a clean run. The manual game has its own local best-score key because its rules differ from the former auto-bounce version.

## Behavior map

| Trigger                             | Visible response                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Nearby pointer on the home page     | Smooth two-axis gaze, ear attention, little steps toward the pointer, comfortable stopping distance.                               |
| Hover or keyboard focus             | A short wave with a three-second cooldown.                                                                                         |
| Pet / tap                           | Closed happy eyes, blush, lower-body squash and a floating heart.                                                                  |
| Three quick pets                    | Brief dizzy expression, followed by the current gaze target.                                                                       |
| Pick up and toss                    | Spring-following body, surprised mouth, dangling feet and delayed ears.                                                            |
| Sixteen seconds without interaction | Heavy eyelids and softer ears; pointer movement wakes Mochi.                                                                       |
| Walk / run                          | World-space stance, predictive alternating swing targets, visible soles and short two-bone legs. Running can overlap swing phases. |
| Brake / reverse                     | Body weight shifts before the ears settle; a small dust puff marks braking.                                                        |
| Near a ledge edge                   | A restrained balancing lean and paw response.                                                                                      |
| Jump / land                         | Short anticipation, tucked feet, velocity-driven stretch, impact-dependent compression, ear follow-through.                        |
| Star / checkpoint / stomp           | Happy eyes and raised paws, bounded particles and distinct optional sounds.                                                        |

Gaze and reactions are separate channels. Hurt has priority over affection, then contextual reactions, then idle details. Returning from a reaction resumes the live gaze instead of snapping to a stale neutral pose. Irregular blinks and occasional double blinks continue independently.

## Implementation

The existing `home-octocat` paths and event name remain compatible.

- `motion.ts`: 120Hz browser-independent simulation, grounded support tracking, buffered manual input, variable jump height, swept contacts, planted foot targets, reaction state, course, hazards, rewards and checkpoints.
- `pose.ts`: shared Canvas/Three pose, two-bone leg solution, facial expressions, paw gestures and volume-preserving body deformation. Stance feet do not inherit body squash or tilt.
- `renderer.ts`: existing Three.js orthographic rig; independent feet/legs, articulated paws and ears, happy/surprised/dizzy expressions and pet heart.
- `canvasRenderer.ts`: equivalent shaded Canvas fallback. Both routes retain the compact bunny identity.
- `worldRenderer.ts`: bounded Canvas world, patrols, flowers, crumble countdowns, stars, particles and altitude markers.
- `runtime.ts`: fixed-step loop with interpolated root position, cached DOM geometry, world/character lifecycle, visibility pause and restoration of the hero after play.
- `audio.ts`: opt-in synthesized cues for hops, landings, pets, stars, stomps, damage and checkpoints.
- `HomeOctocat.tsx`: existing Framer Motion UI, separate Pet/Play interactions, hearts, accessible controls, touch capture and focus containment. React does not update per frame.

No dependency was added. DPR remains capped at 2 for the character and 1.5 for the world, with at most 80 particles and six catch-up steps. Offscreen/hidden activity pauses. Reduced motion removes wandering, gaze animation, blinking, body/ear/foot secondary motion and particles, while retaining essential game trajectories and static pet expressions. Exiting restores page scrolling, focus, hero placement and the other portfolio effects.

## Verification

`npm run test:home-octocat` covers 19 behavioral cases: no auto-hop, tap/hold height, coyote time, landing input buffering, double-jump refill, planted feet in both directions, moving-platform carry, one-way contacts, manual springs, delayed crumble, stomp versus side contact, hearts/checkpoint recovery, collectible idempotence, 1,000 generated rows at three widths, reactions/gaze/sleep, reduced motion, resize/scroll and bounded springs.

A simulated manual controller also crosses the introductory obstacles and flower checkpoints for 35 seconds at both 390px and 1200px viewport widths, exceeding 350m without damage and keeping the platform/particle pools bounded. A longer exploratory run reached 1,030m on desktop; the simple phone controller eventually failed at 512m. That is not a claim of automated mastery or actual touch-device testing.

Run TypeScript and scoped ESLint separately from the production build; this repository's build skips those checks. Never run TypeScript concurrently with the Next build, which regenerates `.next/types`.

The alive pass checks smooth gaze reversals and reaction return. The cute pass reviews the actual Canvas draw code at normal size and enlarged walking, turning, jumping, pet, wave, dizzy, sleepy and pickup poses. The engineering pass found and fixed turn-time foot overextension, tested real rendered stance positions and added moving-surface carry coverage. Three.js geometry is separately inspected through its SVG renderer; this does not verify final GPU lighting.

### Live browser check — September 21, 2026

The deployed home page at `https://shantanusoam.vercel.app/?mochi=play` was checked at 1363 × 936 using real pointer and keyboard input:

- Starting the course stayed grounded through an extended wait. Steering produced walking without changing the standing height.
- The Jump button launched on press. Space climbed the opening ledges, and a second airborne press spent the double jump; landing restored it. Standing on a ledge did not relaunch Mochi.
- The run reached 35m, collected a star and encountered the first puff. A collision changed three hearts to two and returned Mochi to the starting safe spot, with the course and controls still usable.
- Pause/resume and the opt-in sound control responded. Escape removed the play query, restored the hero and returned focus to the pet button.
- Petting produced the happy reaction; three quick native clicks produced the dizzy reaction. The separate Play button remained available on the home page.

All 19 simulation tests, TypeScript, scoped ESLint and a clean production build passed. The cloud browser used the Canvas fallback, so final WebGL lighting, physical touch-device input and device frame rate still need a hardware check.

## September 22: linked movement and sky lanterns

- Amber boosters appear every eight rows starting at row six, with directional arrows and an introductory label. They apply a 720px/s upward impulse and up to 430px/s horizontal impulse. Momentum eases into guidance toward the next ledge; fresh pointer or keyboard input can steer away. Releasing a jump key cannot shorten the automatic boost. A deliberate air hop preserves horizontal velocity.
- Landing on a new higher ledge within 3.2 seconds links the movement. Stars and stomps refresh the window. Every third link awards one bonus star and a sound cue. Revisiting a support breaks the chain, and previously reached supports cannot farm link rewards after checkpoint recovery. Missing the window costs no heart. Damage and restarting clear active chains.
- A bounded, short speed trail follows boosts and longer chains. Body lean, paw lift and ear follow-through respond to the actual impulse. Pausing freezes the simulation and timing windows together.
- The rising camera moves the platforms down the screen. Each platform, star and patrol fades together across the bottom 190px, then is removed offscreen. Moving-platform carry and collision geometry stay unchanged during the fade.
- Every 100m lights a visible sky lantern and triggers a brief celebration; the next target and progress are shown below the HUD. The run summary records lanterns and the best chain.
- Mochi is 20% larger during play, anchored at the soles in both renderers. Foot positions compensate for display scaling to preserve planted world-space stance. The backdrop becomes quieter sooner, improving character and platform contrast.
- Reduced motion keeps automatic boosts and essential trajectories, while removing speed trails, pad pulses and secondary character movement. Sound remains opt-in.

The 24 behavioral tests include booster impulses, key-release independence, double-jump momentum, automatic arrival at higher ledges at 320/390/1200px widths, chain bonuses/expiry/repeat protection, fading, one-time lantern milestones and reduced motion. The original manual course controller and actual rendered foot-plant checks still pass. The Canvas world and booster poses were inspected at desktop and phone widths. Physical touch-device performance and final WebGL lighting remain hardware checks.

TypeScript, scoped ESLint and the production build passed for this revision.

Live Canvas QA on September 22 verified three consecutive keyboard landings and the bonus star, then the manual spring → automatic directional booster → safe landing sequence without another launch press. The run retained all three hearts, saved the flower checkpoint and lit the first 100m lantern with the celebration and next-goal update. The final visual pass adds quiet backgrounds behind the HUD and goal readout so passing platforms do not obscure their text.
