# Numeric stability

- Clamp frame delta and use a fixed timestep (`FixedStepLoop`: `maxFrameDt`
  default 0.05s, `maxSteps` default 3).
- Guard vector lengths with `EPSILON` before normalization — use
  `normalize()`/`safeLength()` from `lib/mascot/core/NumericGuards.ts`,
  never a raw `Math.hypot()` division.
- Reject non-positive frequency and invalid configuration at construction
  time (`SecondOrderDynamics` throws on `frequency <= 0`, `damping < 0`,
  non-finite `response`) — fail loudly in development rather than
  silently producing NaN later.
- Reset previous positions after teleport, resize, or suspension
  (`PoseController.teleport()`, `VerletChain.resetVerletNodes()`,
  `FixedStepLoop.resetTiming()`).
- Cap acceleration, velocity, and correction distance
  (`VerletChain`'s `maxSpeed`, `RectangleSteering`'s `maxForce`).
- Prefer bounded repeated constraint passes over one extreme correction —
  `SpineSolver`/`VerletChain`/`FabrikSolver` all clamp `iterations` to a
  small max (8 for spine/verlet, 16 for FABRIK) internally so a bad config
  value can never cause an unbounded loop.
- Test coincident points (`SpineSolver.test.ts` "coincident joints
  recover"), zero velocity, large timing gaps
  (`SecondOrderDynamics.test.ts` "capped large delta"), and unreachable IK
  (`FabrikSolver.test.ts` "unreachable target").
- Keep deterministic random generation inside `SeededRandom` — never call
  `Math.random()` in `lib/mascot`, or replay/tests stop being deterministic.
- Avoid frame-rate-dependent damping constants — that's exactly what
  `SecondOrderDynamics`'s `k1`/`k2`/`k3` stability fix and the fixed
  timestep exist to prevent. Don't introduce a second, ad-hoc lerp with a
  raw `dt` multiplier for something that should go through the filter.
