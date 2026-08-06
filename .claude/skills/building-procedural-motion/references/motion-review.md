# Motion review

Review in this order:

1. Silhouette clarity
2. Anticipation
3. Root responsiveness
4. Torso follow-through
5. Tail settling
6. Turn readability
7. State transition continuity
8. Small-size readability
9. Repetition
10. Frame stability

Change recipe parameters (`lib/mascot/motion/MotionRecipes.ts`,
`MASCOT_CONFIG` in `lib/mascot/MascotConfig.ts`) before rewriting a correct
solver. The solvers (`SpineSolver`, `VerletChain`, `SecondOrderDynamics`)
are generic and unit-tested for correctness; almost every "personality"
problem is a tuning problem, not a math problem.

Use the `/motion-lab` deterministic scenarios
(`lib/mascot/debug/DeterministicScenarios.ts`) when comparing before/after —
don't eyeball freehand pointer movement, it isn't repeatable.
