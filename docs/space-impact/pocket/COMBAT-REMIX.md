# Pocket combat remix

The previous opening hid the weapon system, delivered upgrades too late, and
sent mostly loose waves at the player. This update makes collecting, switching,
and upgrading weapons part of the first minute, with coordinated formations,
readable attack warnings, and an original eight-bar chiptune score.

## Controls and rewards

Move with WASD, arrows, or drag. Fire is automatic. Q or SWAP cycles unlocked
guns without resetting the fire cooldown. Space or NOVA spends a full charge.
HOLD · TALK silences guns for the existing secret interactions.

| Pod       | Effect                                              |
| --------- | --------------------------------------------------- |
| P         | Pulse cannon: rapid straight shots                  |
| S         | Split shot: a spreading fan                         |
| R         | Rail: powerful piercing shots                       |
| M         | Seeker: homing missiles with a bounded turning rate |
| A         | Shield: absorbs one hit; expires after 15 seconds   |
| O         | Overdrive: faster, stronger shots for 8 seconds     |
| D         | Wing drones: paired supporting guns for 12 seconds  |
| +         | Hull repair                                         |
| Lightning | 30 Nova charge                                      |

Each gun retains its own level, up to three. Duplicate pods upgrade that gun;
a max-level duplicate awards score and charge. The first split pod arrives two
seconds into the opening and moves into reach within five seconds. Powers,
weapon levels, combo time, and Nova charge are shown during play. Pause freezes
all simulation timers.

## Formations and challenge

Chevron fleets keep their wing geometry; weave fleets oscillate with staggered
phases; pincers converge from opposite edges; walls leave a traversable lane.
Enemy classes use aimed shots, three-shot bursts, spread fans, or crossing
volleys. A 0.75-second warning locks the aim before the shot. Enemy fire is
suppressed outside the viewport and within 100 units ahead of the ship. Player
shots and Nova cannot destroy enemies before they enter the visible playfield.

Clearing every member of a formation grants 400 points, 15 charge, and a power
pod. A member escaping denies that reward. The combo window lasts 4.5 seconds,
with a capped score multiplier and charge awards every five kills. Later sectors
increase formation size and firing pressure; assist reduces pressure.

Campaign saves use the actual checkpoint snapshot, including unlocked guns.
Old saves migrate without losing the equipped weapon. Boss Lab starts with all
four guns unlocked. The three-minute Score Attack has its own best score, timed
ending, and correct retry behavior. Existing secret rooms and cease-fire clues
remain available.

## Music and pixel presentation

The score combines bass, lead, arpeggio, kick, snare, and hats over eight bars.
Sector music runs at 112–120 BPM; bosses use 132 BPM. Combos and overdrive add
musical activity, while secret rooms use sparse accompaniment. A single audio
graph caps voices at 24; music leaves six slots for effects. Decisive sounds such
as Nova and damage take priority when many events arrive together. Gesture
activation, mute, test sound, and interruption cleanup remain in place.

New lettered power capsules and distinct enemy sprites use the existing pixel
atlas. Shields, wing drones, missile trails, exhaust, and dotted attack warnings
render as gameplay cues. The merged CRT work supplies green phosphor bloom and
scanlines; clean and pocket LCD presets remain selectable. No additional game
runtime dependency was introduced.

## Review and verification

The critic's first combat review scored 7.7/10. Ranked issues were invisible
offscreen kills, Score Attack retry/ending behavior, and unexplained power-pod
letters. The second review scored **8.4/10**, reaching the requested threshold
within two rounds. Final corrections included Nova's viewport guard, countdown
interruptions, effect priority, and the mode-specific BEST readout.

Final checks passed: all 63 Space Impact tests, the production build (61 routes),
explicit TypeScript checking, targeted ESLint, and whitespace checks. The added 15 combat
tests cover first-upgrade timing, all four guns, cooldown retention, input edges,
powers and pause, formation geometry, attack timing, visible hits, rewards, save
migration, deterministic three-minute simulation with entity limits, music, and
Nova sound priority. Together with the existing 48 tests, the suite has 63 tests.

The following images come from the actual Canvas renderer. These are synthetic
fixtures with invincibility and power grants, not playthrough screenshots.

| Fixture                       | Renderer output                                        |
| ----------------------------- | ------------------------------------------------------ |
| Armored chevron / split / CRT | [Image](evidence/combat-remix/chevron-split-crt.png)   |
| Prism weave / seeker / CRT    | [Image](evidence/combat-remix/weave-seeker-crt.png)    |
| Sentry wall / rail / CRT      | [Image](evidence/combat-remix/wall-rail-crt.png)       |
| Choir pincer / pulse / LCD    | [Image](evidence/combat-remix/pincer-pulse-pocket.png) |

Reproduce with `node --import tsx scripts/space-impact/render-combat-evidence.cjs`.
The optional QA-only `@napi-rs/canvas` package must be available to Node; it is not
required by the shipped game. `fixtures.json` records the simulation state.

Browser access was unavailable for the earlier review. The critic score covers
source, simulation, and offline Canvas output. Full DOM layout, real touch
controls, speaker playback, audio latency, and phone frame rates still need a
device preview check; these have not been claimed as verified.
