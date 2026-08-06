---
name: building-procedural-motion
description: Builds and reviews deterministic procedural character motion using fixed-step simulation, second-order dynamics, distance and angle constraints, Verlet chains, FABRIK, and pose state machines. Use when changing mascot motion math, rig behavior, joints, secondary motion, state transitions, or simulation stability.
---

# Procedural motion workflow

1. Inspect the affected runtime (`lib/mascot/motion`, `lib/mascot/behavior`,
   `lib/mascot/MascotRuntime.ts`) and its tests under `tests/mascot/`.
2. Reproduce the behavior through a deterministic motion-lab scenario
   (`lib/mascot/debug/DeterministicScenarios.ts`, run from `/motion-lab`)
   before changing code.
3. Change one motion system or recipe at a time — don't touch the spine
   solver and a behavior transition in the same pass.
4. Keep simulation independent from React and rendering. `lib/mascot/motion`
   and `lib/mascot/behavior` must not import from `components/` or
   `lib/mascot/rendering`.
5. Use fixed-step updates (`FixedStepLoop`, 1/60s) and bounded solver
   iterations (see `SpineSolver.ts`, `VerletChain.ts`, `FabrikSolver.ts` —
   all cap iterations at 8-16 internally regardless of what's requested).
6. Guard every normalization and division through
   `lib/mascot/core/NumericGuards.ts` (`normalize`, `safeLength`, `EPSILON`).
7. Avoid allocations inside hot loops — `PoseController.update()`,
   `MascotRuntime.update()`, and the render path all mutate persistent
   buffers rather than creating new objects per frame.
8. Add or update unit tests for numeric stability
   (`npm run test:mascot -- tests/mascot/<File>.test.ts` or just
   `npm run test:mascot` for the full suite).
9. Run the relevant deterministic scenario from `/motion-lab` and check the
   debug overlay (spine, normals, obstacles).
10. Update `docs/mascot/IMPLEMENTATION_STATUS.md`.

## Invariants

- All values remain finite (tests assert `Number.isFinite` after stress
  sequences — see `SecondOrderDynamics.test.ts`, `SpineSolver.test.ts`).
- Segment-length error stays within documented tolerance
  (`SpineSolver.test.ts`, `VerletChain.test.ts`, `FabrikSolver.test.ts`).
- Root pins remain exact (`joints[0]` / `nodes[0]` after solve).
- State transitions do not teleport targets — `TargetDirector` blends
  pointer/wander targets over `MASCOT_CONFIG.targetBlendDurationSeconds`.
- Solver loops are bounded regardless of the `iterations` config passed in.
- Equal seed and input produce equal output (`SeededRandom`,
  `WanderPlanner`, `FabrikSolver` are all deterministic — see their tests).
- Motion remains readable as a silhouette at every behavior state.

Read `references/numeric-stability.md` when changing equations.
Read `references/motion-review.md` when tuning personality.
