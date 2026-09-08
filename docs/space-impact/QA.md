# Lost Signal — verification record

Date: 2026-09-08. Node 24, npm, Next.js 15.5.21. This record distinguishes automated checks from physical-device release gates.

## Automated results

| Check | Result |
| --- | --- |
| Lost Signal gameplay suite | 26 passing tests |
| Existing Cluckstorm and 404-breaker suites | 26 passing tests (18 + 8) |
| TypeScript, entire project | Pass, separate from the build |
| ESLint, changed game and integration paths | Pass |
| Production build | Pass; static game route generated in the isolated checkout described below |
| Initial desktop browser smoke check | Receiver/title and live opening combat displayed; inspected before browser access was blocked |

Coverage includes render-schedule equivalence at 30/60/120 Hz, swept collisions, Pulse-before-damage ordering, graze idempotency, recovery windows, pointer ownership, relative steering, pause/catch-up, encounter order, corridor width, boss phases, checkpoint reconstruction, corrupted saves, secret rewards, the late-feather portal case, probe protection, all weapon upgrades, both endings, and a ten-minute bounded headless simulation.

An input-only pilot clears each of the five bosses using the normal hitbox, standard three-hull ship, and level-one weapon. It uses ordinary movement, firing and Pulse; it does not grant health or remove hazards. This establishes a reachable response for those recorded runs, not human difficulty, reaction time, or universal safety from every possible position.

The ten-minute test checks collection limits in the simulation. Its execution time in Node is not a browser frame-rate measurement. Battery saver changes draw frequency and decoration while preserving simulation timing.

## Build context

An unrelated working-copy modification to `public/Fluency Zoom Logo.png` was truncated (564,736 bytes) and caused Sharp to fail during the initial build. The tracked baseline image decodes correctly (8,229,286 bytes; 3000 × 3000). That local modification was preserved and excluded from the game change.

Production verification uses an isolated checkout of the same base plus exactly the game/integration changes, retaining the repository's valid tracked logo. No unrelated source fix or binary revert is included in this change.

The game page's initial production chunk was approximately 25 KiB compressed and the essential backdrop approximately 128 KiB. These are file measurements, not a total cold-cache transfer or time-to-interactive claim. Shared framework, layout, and vendor files also contribute to a first visit.

## Browser and physical-device gates

Automatic browser approval review rejected further access to the local preview because its URL was blocked by the Cloud browser URL policy. No alternate browser or indirect access was attempted. The preview was stopped after the rejection. Later UI changes have code/build validation only.

All checks below remain **pending** before a public release:

| Device or scenario | Acceptance check |
| --- | --- |
| Samsung S25, Chrome | Complete campaign, both endings, all secrets; portrait/landscape, two-finger Pulse while steering |
| Midrange Android | 10–15 minutes of real play; stable frame delivery, thermal behavior, battery saver readability |
| iPhone, Safari | User-gesture audio, interruption/resume, safe areas, optional fullscreen fallback, native sharing and PNG download |
| 360 CSS px portrait and short landscape | No clipped required controls; 48 px action targets; readable hostile bullets and HUD |
| Keyboard / focus | Menu tab order, native-dialog focus return, input fields and portfolio command palette isolation |
| Lifecycle | Repeated enter/play/exit; no accumulating animation frames, listeners or audio nodes |
| Interrupted flight | Rotate, cancel a touch, lose pointer capture, switch tabs, lock/unlock; ship pauses and held input clears |
| Save recovery | Reload at checkpoint, denied local storage, damaged save, completed campaign, return from Cluckstorm |
| Asset/network failure | Block decorative WebP; verify playable fallback and Retry; cold cache at about 10 Mbps / 100 ms |
| Timing budget | Record p95 update-plus-draw CPU under 12 ms and actual frame pacing near 16.7 ms on reference devices |
| New player feedback | Steering understood by 15 seconds; meaningful improvement within three attempts; understandable hits |

Do not mark these complete from source inspection, synthetic timing, or the input-only boss test. Accounts, online rankings, replay sharing, PWA/native packaging and gamepad refinements remain intentionally deferred as specified in the plan.
