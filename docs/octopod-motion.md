# Spring Octopus motion study

## Reference read

The two supplied recordings use a small, pale character whose appeal comes
from physical continuity rather than a looped clip:

- the root compresses briefly before launch and stretches along velocity;
- appendages inherit motion late, keep curved silhouettes, and settle after
  the body;
- one appendage can acquire the pointer, lengthen dramatically, and become a
  load-bearing tether;
- the tether redirects the root into a pendulum arc, then preserves tangential
  momentum on release;
- landing contacts are readable against thin UI ledges without adding visual
  noise.

The implementation keeps an original octopus silhouette and reproduces those
motion relationships instead of tracing the reference character.

## Executed architecture

| Layer                          | Responsibility                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `PlatformLocomotionController` | Gravity, cached ledge contacts, jumps, and letting a taut tether peel the body from support. |
| `ProceduralCharacterEngine`    | 85 ms jump preload; grapple acquisition; spring pull; radial damping; release momentum.      |
| `AppendageRuntime`             | One shared elastic chain length for FABRIK reach and Verlet rendering.                       |
| `SoftChain`                    | Delayed follow-through and curl, progressively straightened by tether tension.               |
| `CanvasCharacterRenderer`      | Tapered elastic arm, contact pulse, body deformation along the pull direction.               |
| `OctopodArena`                 | Keyboard/touch controls and lightweight Framer Motion entrance choreography.                 |

No per-frame values enter React state. The creature remains inside the shared
120 Hz fixed-step engine, while Framer Motion is limited to interface
choreography.

## Controls

- Move the pointer to a point within reach.
- Hold `E` to attach the closest tentacle and pull or swing.
- Move the pointer while holding `E` to reshape the arc.
- Release `E` near the edge of the arc to carry momentum into the jump.
- `W`, `ArrowUp`, or `Space` performs a preloaded jump.
- Touch users can use the `Reach` hold control after indicating a target in
  the playfield.

## Verification

- The grapple may not acquire a point outside its configured range.
- The selected endpoint remains within its current elastic FABRIK reach.
- Release retains momentum and the tentacle retracts to its base length.
- A grounded jump keeps zero vertical velocity during its visible windup.
- Reduced motion continues to suppress most secondary curl.

Focused coverage lives in `tests/procedural-character/Grapple.test.ts`.
