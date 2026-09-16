# Mochi — a little higher

The home-page companion is now **Mochi**, an original round bunny. This replaces the previous Octocat approximation and its three-ledge checklist with a continuous climbing game.

- Home: `/` in Explore mode. Click the bunny on the guitar strings.
- Direct entry: `/?mochi=play`.
- The previous `/?octocat=play` link still opens the new game.
- `/octopod-lab` remains an independent experiment.

## Reference analysis

Reviewed both September attachments, including the current implementation recording (`screenrecording-2026-09-15_17-01-01.mp4`) and the reference (`screenrecording-2026-08-07_10-39-34(7).mp4`).

| Observation                                                      | Previous implementation                                                                                                                                                       | Revision                                                                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Compact silhouette in the reference                              | A large cat head, narrow torso and seven independently trailing tubes spread into a spider-like shape. This is especially visible around 12 seconds in the current recording. | One connected plush body, two short paws, small feet and two attached ear pivots.                                                 |
| Movement has a leading action and delayed follow-through         | Head and limb springs could pull the anatomy apart.                                                                                                                           | The body retains its volume during squash/stretch. Ear rotation and body tilt respond with damped springs; no free-floating head. |
| The reference becomes a vertical platform game around 18 seconds | Three fixed navigation links were the entire objective.                                                                                                                       | An endless, reachable course with stars, springs, moving ledges, crumbling ledges, height and a saved personal best.              |
| The game grows out of the app                                    | The home screen stayed static behind a large bottom HUD.                                                                                                                      | Mochi starts over the guitar; the hero recedes upward as the camera climbs. A compact top HUD leaves the playfield clear.         |
| Movement is easy to keep going                                   | Repeated manual jumps and awkwardly spaced DOM ledges.                                                                                                                        | Automatic bounces, responsive steering, and one optional mid-air recovery hop per landing.                                        |

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

## Controls and loop

Click **Let's hop** or press **Space** to start. Landings bounce automatically after a brief compression. Move the mouse, use Left/Right or A/D, or drag horizontally on a touchscreen to steer. **Space**, Up or W supplies one extra hop in the air; it refills on landing. Touch devices also have direction buttons and an Extra hop button.

Gold stars are collectible. Green spring ledges launch higher. Moving ledges enter after the opening section; cracked peach ledges break after landing. Every consecutive ledge remains reachable with a normal bounce. Difficulty gradually narrows ledges while preserving jump reach.

P pauses, R restarts, and Escape returns to the portfolio. Falling ends the run and shows the result with an immediate retry. Best height is stored locally when storage is available. Sound is off initially and can be enabled with the speaker button; notes are synthesized locally.

Outside the game, Mochi makes small idle steps on the strings, looks toward the pointer, and can be picked up and gently tossed.

## Implementation

The existing `home-octocat` paths and event name are retained for compatibility.

- `motion.ts`: fixed-step simulation, spring pose, input, swept contacts and collectible pickup, procedural course, camera and bounded particle pool. Physics is independent of the browser and React.
- `pose.ts`: shared proportions and pose for both renderers. Squash uses reciprocal cross-axis scaling to retain body volume.
- `renderer.ts`: Three.js scene with an orthographic camera, soft lighting and attached ear pivots. `MochiRig` is independent of WebGL so its actual geometry can also be inspected offline.
- `canvasRenderer.ts`: shaded Canvas fallback using the same pose and proportions.
- `worldRenderer.ts`: full-screen world canvas for ledges, stars, landing particles, depth markers and backdrop. Device pixel ratio is capped.
- `runtime.ts`: one 120 Hz fixed-step loop with render interpolation, cached DOM measurements, lifecycle cleanup, visibility handling and the hero's temporary visual translation.
- `audio.ts`: optional, gesture-activated synthesized feedback.
- `HomeOctocat.tsx`: Framer Motion transitions, accessible buttons, touch input, focus containment, score and pause/result UI. React does not own per-frame positions.

The game pauses on blur or tab hiding. Reduced-motion mode removes ambient wandering, gaze animation, blinking, squash/stretch, bobbing, tilt, ear follow-through and particles; the essential playable trajectory remains. Exiting restores the hero, scrolling, focus and the normal portfolio effects. The older ambient mascot, page atmosphere and soundroom controls unmount while the game owns the screen.

## Verification

`npm run test:home-octocat` covers start anticipation, auto-bounce, extra-hop refill, one-way swept contacts, spring and crumble behavior, swept star pickup, 1,000 generated rows at three widths, a 90-second steering run at both phone and desktop widths, bounded arrays, end/retry, resize/scroll behavior, reduced-motion idle and volume retention.

Run `npx tsc --noEmit` and scoped ESLint separately from `npm run build`; this repo's build skips those gates. Do not run TypeScript concurrently with the Next build, which rewrites `.next/types`.

Offline visual review uses the actual Canvas drawing code for six motion poses and a simulated climbing frame. The actual Three.js geometry was additionally rendered through Three's SVG renderer to inspect silhouette and attachment in rest, crouch and launch poses. That verifies geometry, not WebGL lighting or GPU performance. Cloud-browser interaction checks use the Canvas fallback because its WebGL context is disabled; final WebGL appearance remains a device-specific verification limit.

## Final mascot audit

The `mascot/mascot-contract.yaml` records the current identity, controls and performance limits. The alive pass added damped two-axis gaze with a 16px dead zone, smooth recentering on pointer exit, irregular blinks and occasional double blinks. These are independent of game state and do not restart on each hop.

The cute pass reviewed the actual 44px-wide silhouette, not just enlarged poses. The engineering pass caught a page font-variable inheritance issue that enlarged the footer; the game now reads the loaded font variable directly with a fallback. Reduced-motion checks explicitly assert a neutral pose during a real jump, while preserving essential gameplay.

Live checks on the deployed home page confirmed the entry card, automatic bouncing, mouse steering, star collection, altitude/camera progression, pause/resume, mid-air recovery, game over, retry with a retained best score, sound toggling, and Escape restoring the portfolio URL and keyboard focus. Browser rendering used the Canvas fallback; the Three.js rig was reviewed separately using its actual geometry. The browser surface does not expose mobile viewport emulation, so phone-width reachability is tested in the model and touch input/layout are inspected in code rather than claimed as device testing.
