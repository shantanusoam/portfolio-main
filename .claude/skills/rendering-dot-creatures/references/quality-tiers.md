# Quality tiers

Defined in `lib/mascot/rendering/RenderQuality.ts`
(`QUALITY_PRESETS`) and spine-specific iteration counts in
`lib/mascot/character/CreatureRecipe.ts` (`getSpineIterationsForQuality`).

Reduced:
- 0 dots, 0 particles — static/near-static silhouette only
- 1 spine solver iteration
- `reducedMotion` behavior forces this tier's motion recipe regardless of
  measured performance (see `BehaviorMachine`'s `reducedMotion` state)

Low:
- ~700 dots, 120 particles
- DPR capped at 1.25, 2 spine solver iterations

Medium:
- Default production tier: 1800 dots, 300 particles, DPR capped at 1.5,
  3 spine solver iterations

High:
- Enabled only when `PerformanceGovernor` measures sustained good frame
  times and upgrades once per session (it never upgrades twice — see
  `PerformanceGovernor.test.ts` "upgrades at most once per session")
- 3800 dots, 650 particles, DPR capped at 2, 4 spine solver iterations

Downgrade policy (`PerformanceGovernor.evaluate`):
- Average frame time over ~20ms and past the downgrade cooldown (4s) drops
  one tier.
- Never changes quality while `blocked` is true (sprint/scatter/reform —
  see `MascotEngine.maybeAdjustQuality()`).
- Downgrades are unlimited; upgrades happen at most once per session and
  only after an 8s cooldown with a clearly good frame average (<10ms) and
  worst frame under 20ms.
- Do not hand-roll a second quality-adjustment path — route all of it
  through `PerformanceGovernor`.
