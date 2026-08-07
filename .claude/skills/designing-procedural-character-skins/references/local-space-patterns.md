# Local-space patterns

Every pattern mark stores:

- longitudinal `u` (head to tail, 0 to 1)
- lateral `v` (left to right, -1 to 1)
- stable seed
- colour role
- scale
- rotation
- layer

Resolve marks from the current spine and local normal each frame — same
technique as `lib/mascot/character/DotSkin.ts`'s `resolveSkinPointPosition`
(interpolate between two bone ribs by `weightB`, normalize the blended
normal, position by `lateral * width`). Do not duplicate that function;
extend it or add a sibling that shares the same bone-blending math.

Never use world-space noise as the primary skin pattern — that's exactly
what makes texture "swim" through the body during a turn, which is the
upgrade spec's Problem 2.

Regenerate the mark list only when the appearance recipe or quality tier
changes (mirrors `MascotRuntime.setQuality()`'s existing pattern for
`skinPoints`), never per frame.
