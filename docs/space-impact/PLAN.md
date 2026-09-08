# Space Impact: Lost Signal

A mobile browser game for Shantanu Soam’s portfolio — design and implementation plan.

Prepared 8 September 2026. Repository inspected: [shantanusoam/portfolio-main](https://github.com/shantanusoam/portfolio-main), `main` snapshot `5798910845af25f0e3a18d5174c9a6492e241e81`.

This is a source-informed plan, not a playtest report or an implemented change. Performance numbers and durations below are proposed targets to validate. “Space Impact” is interpreted as the classic phone-style, horizontally scrolling shooter. The proposed game uses original characters, artwork, levels, and music.

## 1. The game we should make

**A tiny ship follows a mysterious signal across the ruins of a spacefaring civilization. Every stage reveals something stranger. Skill keeps you alive; curiosity reveals what happened.**

Working title: **Space Impact: Lost Signal**. The public title can become simply **Lost Signal**, with “a pocket space shooter by Shantanu” as its description.

The ambition is a memorable, replayable game someone discovers inside your portfolio, finishes on their phone, and sends to a friend with “you have to find the secret.”

Five design priorities, in order:

1. Moving and dodging feel immediate and predictable on a phone.
2. The first 90 seconds contain a complete miniature adventure.
3. Every region introduces one recognizable hazard and one spectacular encounter.
4. Secrets change what the player sees or plays, with clues they can understand afterward.
5. The game loads only when wanted and has a clear route back to the portfolio.

Target experiences:

- **First session:** enjoy a 2–3 minute first sector, including its boss.
- **Full campaign:** approximately 12–18 minutes for a practiced player, excluding retries and optional routes.
- **Return visit:** replay a sector, hunt a secret, or attempt a three-minute challenge.
- **Shareable moment:** a giant wreck wakes up; a “dead” console answers; the ending changes because of earlier discoveries.

## 2. What already exists in the repo

The existing game is **Cluckstorm**, a vertical formation shooter. It is a useful foundation, but its movement bounds, projectile directions, formations, and boss positioning assume a different kind of game.

| Existing implementation | Evidence | Plan |
| --- | --- | --- |
| Next.js 15.5.21, React 18, TypeScript; npm is authoritative | `package.json`, `CLAUDE.md` | Stay in the existing application and use npm. |
| Explore mode dynamically mounts `SecretArcade` | `components/home/HomeInteractiveLayer.tsx` | Keep an unobtrusive arcade entry and add a dedicated game route. |
| Canvas 2D with separate model, update, render, enemy, weapon, and boss modules | `components/easter-egg/game/` | Reuse proven patterns and selected small utilities. Give the side scroller its own model and content. |
| Five sectors, six weapon families, three main boss archetypes, two miniboss archetypes | `game/config.ts`, `game/types.ts` | The new game needs authored side-scrolling encounters; more weapon count is not the initial priority. |
| Graze scoring, a charged super, component damage, attack telegraphs, hit stop, particles | `game/update.ts`, `game/bosses.ts` | Adapt the useful combat ideas into one coherent new system. |
| Pointer capture, touch-action handling, hidden-tab pause, DPR capped at 2 | `SecretArcade.tsx`, its CSS | Preserve these strengths and complete the mobile lifecycle handling. |
| Best-score, mute, control-mode and highest-sector storage helpers | `game/storage.ts` | Introduce a separate, versioned save for Lost Signal. Existing helper presence does not establish a full resume flow. |
| Focused Node tests via `npm run test:game` | `game/logic.test.ts`, `package.json` | Preserve the legacy suite and add focused tests for the new simulation. |

Specific code risks to resolve before adapting the foundation:

- The current loop clamps each frame delta to `0.033`. Frames slower than that lose simulation time. Use a fixed simulation step with a bounded accumulator for the new game.
- Canvas resize changes the model dimensions and only clamps the player in that handler. Replace this coupling with a stable logical playfield and a viewport transform.
- The pointer state has no controlling pointer ID. Define ownership so another finger or a cancelled gesture cannot hijack steering.
- Gameplay debug shortcuts currently spawn pickups and skip waves/bosses without a development-only condition. Keep such commands outside normal score-bearing play.
- Storage keys are Cluckstorm-specific. Never reinterpret its high score as a Lost Signal score.
- `next.config.js` ignores type and lint errors during build. A successful build must be accompanied by separate checks and comparison with the pre-existing baseline.
- Root layout mounts ambient UI, the mascot, soundroom controls, and smooth scrolling. A dedicated route still needs deliberate coordination with these global layers.

Repository convention says not to commit or push unless asked. This planning task requires neither.

## 3. The first 90 seconds

| Time target | What happens | What the player learns or feels |
| --- | --- | --- |
| 0–5 sec | A broken transmission, ship engine flicker, one Start button | Mystery and immediate agency; text can be skipped. |
| 5–15 sec | “Drag to move. Weapons fire automatically.” Three harmless drones enter. | Steering without a tutorial wall. |
| 15–30 sec | A drone fires a slow, clearly visible pattern. Salvage sits just outside its path. | Dodge, then take a small risk for a reward. |
| 30–45 sec | A weapon capsule changes the firing pattern and sound immediately. | Upgrades have a perceptible effect. |
| 45–60 sec | An enormous dormant ship passes behind the action. One window blinks differently. | Scale, intrigue, and the first optional clue. |
| 60–75 sec | A simple wreck corridor combines the two learned actions. | A short test, with ample escape room. |
| 75–90 sec | Background motion slows; a targeting line appears; the wreck’s eye opens. | The boss is part of the environment. |

The first boss continues beyond this sequence. If a new player cannot steer comfortably by 15 seconds, stop adding content and fix the input and onboarding.

## 4. Controls and combat

### Mobile controls

- Primary movement uses **relative drag**. Touching down establishes an anchor; it never teleports the ship to the finger.
- Auto-fire is on by default. The main interaction is navigating danger.
- One large **Pulse** button spends the special meter. A second finger can press it without disturbing steering.
- Offer a virtual stick in settings after the default drag controls are tuned. Remember the preference and support either hand.
- Give actionable buttons a target of at least 48 CSS pixels. Keep pause, exit, and sound controls outside the combat field.
- Handle `pointercancel`, lost capture, blur, hidden tabs, and orientation changes by clearing held input. Resume explicitly with a short countdown.
- Landscape uses the broad playfield well. Portrait keeps the same horizontal battlefield above a separate thumb-control area. Keep the same simulation coordinates and encounter visibility in both layouts; do not stretch the world or silently change combat direction.
- Validate small enemy bullets and ship silhouettes at 360 CSS pixels wide. If the portrait board is hard to read, revise the global art and attack scale before shipping.
- Fullscreen is optional. The game remains playable without fullscreen, orientation lock, haptics, or a particular refresh rate.

Desktop: arrow keys/WASD to move, Space for Pulse, P to pause. The game must not consume commands while a text field or the command palette has focus. Gamepad support is a later enhancement.

### The signature move: Phase Pulse

Near misses and kills charge a meter. At full charge, Phase Pulse clears nearby enemy bullets, damages nearby enemies, and gives a short visual and musical release. Make its range and effect predictable.

Start with tuning values around a 0.6-second presentation and 60–80 milliseconds of impact freeze; these are playtest variables. Combat freezes consistently, while the pulse’s own presentation timer can advance.

Each hostile projectile can award graze once. Invulnerability must not become an unlimited graze generator. A consumed projectile cannot damage the player later in the same tick. Strong play earns faster access to Pulse; ordinary players still charge it through kills.

### Weapons and survival

Ship three weapon families first:

| Weapon | Role | Trade-off |
| --- | --- | --- |
| Pulse cannon | Reliable forward fire | Strong consistency, limited coverage. |
| Split shot | Controls groups and wide formations | Lower concentrated damage against a core. |
| Rail lance | Pierces aligned targets and armor | Narrow aim and slower cadence. |

Each has three meaningful levels. A pickup preview makes the change understandable. Repeated pickups upgrade the equipped family; a different family switches weapons at a clearly defined level. Avoid random upgrades that leave the player unsure what changed.

Use three hull segments for a readable initial design. A hit gives brief recovery protection and clear feedback; it does not erase all weapon progress. Normal campaign mode has checkpoints at sector boundaries and a boss-practice option after reaching a boss. Arcade runs begin fresh and track scores separately. Assistance choices are visible in the result, not mixed into competitive comparisons.

## 5. Campaign and boss design

Five regions form the eventual campaign. The first public release can contain the first three if they are finished to a higher standard.

| Region | New mechanic | Main encounter | Memorable moment |
| --- | --- | --- | --- |
| 1. Silent Orbit | Debris lanes and slow aimed shots | **The Watcher**, a defense satellite embedded in a wreck | The background wreck becomes the boss. |
| 2. Glass Caverns | Narrow passages and reflected beams | **Prism Eel**, a segmented machine moving through tunnels | Its tail crosses a tunnel before its head appears. |
| 3. Rust Cathedral | Moving gates and independently destructible turrets | **The Foundry**, a walking assembly engine | Destroying a gun visibly removes that attack. |
| 4. The Pale Ocean | Current zones that gently bend trajectories | **Choir Leviathan**, a vast bioluminescent creature | Enemy pulses form a musical call-and-response. |
| 5. The Last Relay | Combinations of previously taught hazards | **The Archivist**, guardian of the transmission | Earlier choices alter the final exchange and ending. |

Every stage uses a deliberate rhythm: introduce → practice → combine → brief quiet → boss → reward. Use authored encounter timing, then controlled variation. Avoid endless random enemies as a substitute for pacing.

Every boss needs:

- A readable silhouette and arrival tied to its surroundings.
- Two or three phases defined by new decisions, not only faster bullets.
- Telegraphs that remain visible and legible with effects reduced and audio muted.
- At least one reachable safe response from a valid player position. Validate safe spaces when patterns overlap with terrain.
- Recovery windows and a clear damage opportunity.
- A death sequence that resolves existing threats before celebrating.

For The Watcher: first teach a sweeping beam, then expose two destructible side cannons, then alternate a vulnerable central eye with short debris bursts. The player can choose which cannon to eliminate first. Aim for a 45–70 second first clear once tuned, with a quicker practiced clear.

## 6. Easter eggs that are worth finding

All triggers below are proposed design. They are not claimed to exist in the repo. Put exact conditions in data and support every required input on touch.

| Secret | Clue and trigger | Reward | Priority |
| --- | --- | --- | --- |
| **3310 Transmission** | A recovered log repeats “33 / 10”; enter `3310` on the title screen’s small touch keypad | Unlock the green LCD presentation, original chiptune variant, and a pixel ship | Three-sector release |
| **The Window That Blinked** | The wreck has one blinking window; revisit and fire at it during its visible blink | Open a short salvage alcove containing a transmission fragment | First playable release |
| **404: Sector Not Found** | Find a broken navigation beacon and enter `404` in its console | A 30-second glitched corridor with falling error fragments and a `RECOVERED` badge | Three-sector release |
| **Cluckstorm Breach** | Collect three visibly marked feather-shaped relics during one sector route | An optional portal into a short original cameo encounter; add a Cluckstorm cartridge to the collection screen | Three-sector release |
| **The Patient Pilot** | A neutral probe signals “hold fire”; use the local cease-fire prompt and stay nearby for five seconds | A companion appears in safe interludes and adds a line to the ending | Full campaign |
| **Pale Blue Dot** | A faint blue speck is named in a recovered log; inspect it from a safe observation area | A quiet panorama and an original short reflection about home | Full campaign |
| **Ghost of Your Last Run** | Return to a reached sector after a failed run and inspect a flickering afterimage | See a brief replay of your own previous attempt and receive a useful hint | Later; depends on replay recording |
| **The Real Signal** | Recover the three core transmission fragments, then respond to the final relay’s visual sequence | Alternate final phase, true ending, and a cosmetic ship | Full campaign |

Cluckstorm’s existing Konami trigger remains an entry route into the arcade. Give mobile players an equivalent keypad or visible control sequence; no secret depends exclusively on physical keyboard input.

Secret-design rules:

- Introduce clues before a secret becomes solvable. Use visual patterns and readable text, with audio as an additional clue.
- Award persistent discoveries immediately and safely. Prevent duplicate rewards when revisiting or reloading.
- Show “unknown signal” silhouettes and progressively clearer hints in a collection log. Offer an explicit reveal-hint action after repeated misses.
- Do not require a particular date, device time, source-code inspection, real-world personal information, or dozens of hours of repetition.
- Portfolio-related discoveries can supply flavor, but every ending remains obtainable inside the game.
- A secret route is optional. Never lock basic navigation, your resume, or contact information behind gameplay.
- Cosmetic rewards are safest for score comparability. If a secret grants combat power, define a separate challenge category or exclude the bonus from that mode.

## 7. Art, sound, and presentation

**Core look:** dark space, compact expressive pixel silhouettes, hand-composed wrecks, and one distinct accent palette per region. Background scenery carries the story; the combat layer stays easy to read.

Two visual presentations share the same gameplay:

- **Remastered:** restrained color, several parallax depths, luminous engines, crisp silhouettes, and subtle atmospheric movement.
- **LCD:** a green monochrome palette, dithering, pixel-aligned sprites, and a mild optional ghosting treatment. This is a presentation choice, not a second simulation or a claim of hardware emulation.

Use silhouette, motion, and contrast to distinguish enemy bullets from pickups and scenery. Avoid relying on hue alone. Keep HUD text in readable DOM UI; pixel lettering can be reserved for titles and large labels.

Asset order: ship and core bullets → first enemy family → first boss parts → first sector environment → pickup icons → explosions → later regions. Build coherent original sprite sheets with consistent scale, facing direction, pivot points, and collision metadata. Existing top-down poultry sprites are useful for the cameo, but do not establish the new game’s side-view art direction.

Music begins after the player’s start interaction. Use a compact original theme with exploration, pressure, and boss layers. Phase changes can add a layer; dangerous attacks still have visual warnings. Provide separate music and effect volume, a remembered mute setting, and no delayed pile of sounds after resume.

Presentation settings: reduced shake, low flashes, reduced motion, high-contrast projectiles, and a lower-effects performance option. These alter presentation only; they must not change the simulation or make an attack invisible.

## 8. Implementation structure

Keep the existing Cluckstorm playable. Add Lost Signal as a separate arcade game because its terrain, camera, collision shapes, and side-facing attacks need a different model. Extract shared code only when a concrete second use justifies it.

| Proposed path | Responsibility |
| --- | --- |
| `app/arcade/space-impact/page.tsx` | Shareable route, title, metadata, and client game entry. |
| `components/space-impact/SpaceImpact.tsx` | React shell: start, pause, settings, results, accessibility, loading states. |
| `components/space-impact/MobileControls.tsx` | Touch deck, pointer ownership, handedness, normalized input. |
| `components/space-impact/SpaceImpact.module.css` | Portrait/landscape layout, safe areas, scalable controls. |
| `lib/space-impact/runtime.ts` | Fixed-step loop, lifecycle, start/stop/reset/dispose. |
| `lib/space-impact/model.ts`, `types.ts`, `config.ts` | Runtime state and explicit tuning. |
| `lib/space-impact/input.ts`, `viewport.ts` | Input commands and screen-to-world transform. |
| `lib/space-impact/update.ts`, `collision.ts` | Movement, terrain, swept projectile collisions, damage order. |
| `lib/space-impact/director.ts` | Authored encounters, transitions, and checkpoints. |
| `lib/space-impact/content/sectors.ts`, `bosses.ts`, `secrets.ts` | Data-driven campaign, attacks, conditions, rewards. |
| `lib/space-impact/render.ts`, `audio.ts` | Presentation adapters and bounded audio scheduling. |
| `lib/space-impact/storage.ts`, `random.ts` | Validated versioned saves and seeded gameplay randomness. |
| `public/space-impact/` | Optimized original sprites, music, and manifest. |
| `tests/space-impact/*.test.ts` | Deterministic simulation and boundary-case tests. |

Integration changes:

- Add a direct “Play Lost Signal” link to the arcade’s ready/menu screen and an entry in `lib/archive/command-index.ts`.
- Retain the home’s Explore-mode discovery behavior; direct game links should work regardless of that preference.
- Coordinate game-route behavior with `app/layout.tsx` and `SmoothScrollProvider.tsx`: prevent global overlays, ambient animation, competing input, and sound from interfering. Inspect subsystem guidance before touching mascot internals; prefer route-level mounting boundaries.
- Make exit return to the expected portfolio location. Restore focus when returning from a modal entry and support normal browser Back navigation.

### Runtime decisions

Use Canvas 2D and TypeScript initially. The repo already demonstrates this structure; this scale does not require a new engine or renderer before profiling shows a concrete problem.

- Simulate at a fixed 60 Hz. Bound catch-up work, render independently, and clear accumulated elapsed time after pause/backgrounding. Detect sustained overload and reduce visual work instead of silently letting the game slow down indefinitely.
- Use a fixed logical 16:9 world viewport; letterbox into available space and transform input into world coordinates. A tentative base is 480×270 logical units, subject to small-phone readability checks.
- Keep gameplay objects outside React state. Send HUD snapshots around 10–15 times per second, with immediate updates for pause, damage, and other important state transitions.
- Use swept collisions for fast projectiles and explicit terrain shapes. Define the order for damage, invulnerability, Pulse clearing, deaths, drops, and checkpoint transitions.
- Give gameplay RNG its own seed and keep cosmetic randomness separate. Record simulation version as well as seed for reproducible challenges; a seed alone is insufficient after balance updates.
- Start with bounded entity collections. Add object pools or a spatial grid only if profiling identifies allocation or collision cost. Never drop active hazards to meet a particle budget.
- Cap and prioritize audio events, dropping stale repetitive events while preserving damage and boss warnings. Expose teardown for audio, listeners, timers, and animation frames.
- Development shortcuts and test harnesses do not produce normal score submissions.

### Save and replay

Use a new key such as `portfolio-space-impact:v1`. Validate all loaded values; fall back safely if storage is missing, malformed, unavailable, or from an unsupported version.

Save settings, unlocked regions, discovered secret IDs, cosmetics, and per-mode best scores. Add a resume checkpoint that reconstructs the start of a region; do not initially serialize an entire in-flight physics scene. Write on meaningful events rather than every frame.

Start with local scores and explicit “on this device” wording. A public leaderboard is a separate later feature requiring server-side validation and abuse handling. A local score or a signed client payload alone is not reliable proof of a legitimate run.

## 9. Milestones and acceptance gates

Estimates assume one experienced developer working focused days, with time for art, sound, and real-device iteration. They are planning ranges, not delivery promises. AI assistance can accelerate scaffolding; control feel and balancing still need playtesting.

| Phase | Effort estimate | Deliverable | Gate before expanding |
| --- | --- | --- | --- |
| 0. Baseline and foundation | 1–2 days | Record existing checks, mobile behavior, route boundaries, and asset budgets | Existing arcade still opens; new route runs without global-layer interference. |
| 1. First playable sector | 4–5 days | Relative drag, auto-fire, Phase Pulse, one weapon, terrain, three enemy patterns, Watcher boss, first secret | A new player can complete or meaningfully improve after three attempts. |
| 2. Combat and content | 5–7 days | Three weapons, three finished sectors, checkpoints, distinct bosses, four secrets, LCD skin | All three regions are clearable on a small phone; hits have understandable causes. |
| 3. Full campaign and mystery | 5–7 days | Remaining regions, true-ending chain, collection log, complete audio | Every ending and secret is reachable; no mandatory obscure input or missing clue. |
| 4. Polish and release | 4–6 days | Device fixes, performance tuning, share cards, settings, regression verification | Stable extended session, reliable resume/exit, and no new type/lint failures. |

Total: roughly **19–27 focused working days**, about **4–6 full-time weeks**. For evenings and weekends, plan for a materially longer calendar schedule. The first meaningful review is after the initial 5–7 focused days, not after every feature is built.

Use separate reviewable changes for the shell, simulation, first sector, campaign, secrets, and polish. Capture a short mobile playthrough and measured findings at the end of each playable milestone.

Defer until the main game works: multiplayer, accounts, public rankings, procedural infinite campaigns, replay sharing, gamepad refinements, PWA/offline caching, native packaging, and elaborate shader effects.

## 10. Definition of done

These are proposed release gates, not measurements from the inspected repository.

### Play and mobile behavior

- First player input visibly affects movement on the next simulation update; tune perceived touch latency toward under 50 ms on the target phone.
- Landscape and portrait are both playable at 360 CSS pixels wide and up. Controls remain usable around safe areas and browser chrome.
- Rotation, a notification interruption, a second finger, and a cancelled gesture cannot cause teleportation or stuck motion.
- Pausing/backgrounding suspends gameplay; resume clears held input and provides a countdown.
- Restart is available immediately after a short death presentation. A sector reload does not replay a long unskippable intro.
- Every boss phase has a visible cue, viable response, and damage window. Quiet visual settings retain all gameplay information.
- Test on your Samsung S25, a less powerful Android phone, and iPhone Safari, plus desktop keyboard play. Record browser/device versions at test time.

### Performance and lifecycle

- Target smooth 60 FPS on the S25 and a selected midrange Android. Measure frame pacing through a 10–15 minute run, not only an empty opening scene.
- Proposed budget: p95 game update plus draw CPU time under 12 ms on the reference device, with observed frame delivery near 16.7 ms. Measure both; CPU work alone does not prove smooth rendering.
- On slower devices, reduce decoration or render at 30 FPS while keeping the simulation’s timing consistent. No missing hazards or altered scoring from graphics settings.
- Tentative first-sector game-code budget: under 150 KB compressed incremental JS. Tentative first-play transfer: under 3 MB for game code and essential assets; later regions load on demand.
- Start from a cold cache on an approximately 10 Mbps, 100 ms latency connection in under four seconds after requesting play, or present a clear loading/retry state. Revise asset scope if measurements miss this target.
- A repeated open → play → exit cycle leaves no growing timer, listener, audio-node, or animation-loop count. The homepage does not fetch the full campaign merely because its arcade trigger appears.

### Meaningful verification

- Run existing `npm run test:game` plus a new focused `test:space-impact` script using the repository’s Node/tsx approach.
- Test simulation equivalence for the same seed and tick-stamped input under different render schedules.
- Test fast-projectile collision, one-time graze rewards, damage/Pulse ordering, boss phase transitions, checkpoint reconstruction, save migration, and secret reward idempotency.
- Verify terrain and combined attack patterns have reachable safe paths with the actual hitbox and maximum movement speed.
- Test pause/resume without a large elapsed-time jump, rotation/input mapping, multi-touch ownership, and missing or failed asset loads.
- Run separate type and lint checks and the production build; record pre-existing failures separately. Follow the repo’s existing test setup rather than adding a new test framework by default.
- Make a short manual real-device playtest report. Source inspection and unit tests alone cannot establish game feel or mobile visual quality.

## 11. What to build first

The initial implementation brief is deliberately small:

> Add a dedicated Lost Signal route to the portfolio arcade. Build one side-scrolling sector with stable logical coordinates, relative thumb movement, auto-fire, three readable enemy patterns, one two-phase boss, a safe checkpoint, and the blinking-window secret. Use original placeholder art that already has the correct silhouettes. Include pause/resume, sound controls, small-phone layout, deterministic simulation tests, and real-device timing measurements. Tune this slice until the player wants another attempt. Expand art and campaign content only after that gate.

The game earns its scale through the quality of this slice. The full campaign and mystery should amplify a foundation that is already fun.

## Source references

All repository observations refer to the inspected commit. These are source reads; the game was not run during this planning task.

- [Application dependencies and scripts](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/package.json)
- [Repository workflow guidance](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/CLAUDE.md)
- [Existing arcade UI, input, loop, and debug commands](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/easter-egg/SecretArcade.tsx)
- [Weapons, sectors, and boss configuration](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/easter-egg/game/config.ts)
- [Combat, graze, damage, and super logic](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/easter-egg/game/update.ts)
- [Boss implementation](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/easter-egg/game/bosses.ts)
- [Persistence helpers](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/easter-egg/game/storage.ts)
- [Current gameplay tests](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/easter-egg/game/logic.test.ts)
- [Explore-mode integration](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/components/home/HomeInteractiveLayer.tsx)
- [Global layout integrations](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/app/layout.tsx)
- [Build configuration](https://github.com/shantanusoam/portfolio-main/blob/5798910845af25f0e3a18d5174c9a6492e241e81/next.config.js)
