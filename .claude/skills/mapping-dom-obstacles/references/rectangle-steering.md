# Rectangle steering

For an external point (`lib/mascot/interaction/RectangleSteering.ts`):

- clamp the point to the rectangle to find the closest point
  (`closestPointOnRectangle`)
- subtract the closest point from the point, normalize with `EPSILON`
  (`isInsideRectangle` gates this branch)
- use squared falloff inside the influence radius:
  `strength = (1 - normalizedDistance) ** 2`
- outside the influence radius, return zero steering immediately (don't let
  every obstacle contribute a near-zero force to every frame's sum — see
  the early return in `computeRectangleSteering`)

For an internal point:

- `outwardNormalForInsidePoint` computes distance to each of the four
  expanded sides and returns the axis-aligned normal of the nearest one
- `strength` is 1 (full force) for inside points — there is no falloff
  once you're already inside a hard/soft rectangle

For gliding:

- derive two tangents from the normal (`{-normal.y, normal.x}` and
  `{normal.y, -normal.x}`)
- select the tangent whose dot product with the current (normalized)
  velocity is larger
- blend normal force and tangent force via `tangentWeight` (0..1)
- cap the final steering vector's magnitude at `maxForce`
- `MascotConfig.ts`'s `steering.tangentWeight` (0.45 for general obstacles,
  0.15 for the `avoid` behavior's more urgent escape) is where the
  normal/tangent balance is tuned — don't hardcode a new weight elsewhere

Test sides, corners, internal points, zero distance, and combined
obstacles — see `tests/mascot/RectangleSteering.test.ts` for the existing
coverage before adding a new geometric case.
