# Canvas batching

- Use CSS-pixel simulation coordinates; the DPR scale lives only in
  `CanvasMascotRenderer.resize()`'s `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
- Reset transform after resize with `setTransform`, never `ctx.scale()` —
  repeated `scale()` calls compound across resizes.
- Cap DPR per quality tier (`RenderQuality.QUALITY_PRESETS[quality].dprCap`).
- Call `beginPath` once per visual layer (`CanvasDotRenderer.flushGroup`
  does exactly this — see its unit tests in
  `tests/mascot/CanvasDotRenderer.test.ts` for the "exactly one
  beginPath/fill regardless of dot count" assertion).
- Append all circles via `moveTo`+`arc`, then call `fill` once per group.
- Avoid per-dot gradients, shadows, `save`, `restore`, and random
  generation — `DotSkin.resolveSkinPointPosition` uses `Math.sin` on a
  precomputed `noiseSeed`, not a fresh random call, for exactly this reason.
- Pool particles (`ParticlePool`, fixed capacity, ring-buffer recycling of
  the oldest slot once full — never grows).
- Measure render time before and after every visual feature (wrap the
  change in a quick `performance.now()` diff during development, then
  record the delta in `docs/mascot/PERFORMANCE.md`).
- Keep the group count small (3 dot layers + up to 7 particle categories)
  — grouping by opacity/color only pays off while the group count stays
  low; more groups than that starts costing more in `beginPath`/`fill`
  overhead than it saves.
- Avoid rebuilding immutable sample data every frame — `skinPoints` is
  generated once per quality tier, not per frame.
