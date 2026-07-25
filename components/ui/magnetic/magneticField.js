/**
 * Shared magnetism model for the custom cursor and Magnetic elements.
 *
 * Capture is event-driven (pointer hits the host). Release uses hysteresis
 * padding past the host edge so the field feels trapped, not hair-trigger.
 * Falloff uses a quintic smootherstep so pull/lean have continuous first and
 * second derivatives at both ends — no visible kink on enter or exit.
 */

/** Elements carrying this attribute are cursor targets. */
export const MAGNETIC_ATTRIBUTE = "data-cursor-magnetic";
export const MAGNETIC_SELECTOR = `[${MAGNETIC_ATTRIBUTE}]`;

/**
 * Distance past a target's edge that the cursor stays captured.
 * Pure hysteresis: capture starts on a real hit; this gap is what makes a
 * target feel like it traps the pointer rather than dropping it on a graze.
 */
export const RELEASE_PADDING = 36;

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/**
 * Quintic smoothstep. Zero first *and* second derivative at both ends —
 * cubic smoothstep still leaves a detectable change in acceleration.
 */
export function smootherstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Damping that makes a unit-mass spring critically damped (ζ = 1). */
export function criticalDamping(stiffness) {
  return 2 * Math.sqrt(stiffness);
}

/**
 * Soft radial potential in [0, 1]: 1 at centre, 0 at the release boundary.
 * Uses a cosine lobe (C¹) rather than a hard linear ramp so the pull force
 * never jumps when the pointer crosses the geometric edge.
 */
export function softPotential(inner, escape) {
  if (escape > 0) {
    // Outside the box but still inside the hysteresis ring.
    return 0.5 * (1 + Math.cos(Math.PI * clamp(escape, 0, 1)));
  }
  // Inside the box: full strength at centre, easing toward the edge.
  return 0.5 + 0.5 * smootherstep(inner);
}

/** Longest integration substep; larger gaps are split for stability. */
const MAX_SUBSTEP = 1 / 240;
/** Frame gaps beyond this (tab switch, long task) collapse to one hitch. */
const MAX_FRAME = 1 / 20;

/**
 * Advances a damped spring with semi-implicit (symplectic) Euler, substepping
 * so the result depends on elapsed time rather than frame rate.
 *
 * Reason: velocity is updated *before* position. Explicit Euler (position
 * first) injects energy at stiff settings and is what makes hand-rolled
 * cursor springs buzz on 60Hz while looking fine on 120Hz.
 */
export function integrateSpring(
  state,
  targetX,
  targetY,
  stiffness,
  damping,
  dt
) {
  let remaining = clamp(dt, 0, MAX_FRAME);

  while (remaining > 0) {
    const step = remaining > MAX_SUBSTEP ? MAX_SUBSTEP : remaining;
    remaining -= step;

    state.vx += (-stiffness * (state.x - targetX) - damping * state.vx) * step;
    state.vy += (-stiffness * (state.y - targetY) - damping * state.vy) * step;
    state.x += state.vx * step;
    state.y += state.vy * step;
  }
}

/**
 * Reads a target's resting geometry. Callers must only pass elements that
 * never transform themselves, otherwise the measurement chases the animation
 * it is supposed to be driving.
 */
export function measureField(element) {
  const { left, top, width, height } = element.getBoundingClientRect();
  return {
    cx: left + width / 2,
    cy: top + height / 2,
    halfWidth: Math.max(width / 2, 1),
    halfHeight: Math.max(height / 2, 1),
    width,
    height,
  };
}

/**
 * Locates a point relative to a field.
 *
 * `inner`  — 1 at centre → 0 at the box edge
 * `escape` — 0 at edge → 1 at the release boundary
 * Both use the padded rectangle (Chebyshev inside, Euclidean outside) so wide
 * links and small icons release at the same physical distance.
 */
export function probeField(field, x, y) {
  const dx = x - field.cx;
  const dy = y - field.cy;
  const outside = Math.hypot(
    Math.max(Math.abs(dx) - field.halfWidth, 0),
    Math.max(Math.abs(dy) - field.halfHeight, 0)
  );
  const spread = Math.max(
    Math.abs(dx) / field.halfWidth,
    Math.abs(dy) / field.halfHeight
  );

  return {
    dx,
    dy,
    inner: 1 - clamp(spread, 0, 1),
    escape: clamp(outside / RELEASE_PADDING, 0, 1),
    escaped: outside > RELEASE_PADDING,
    potential: softPotential(
      1 - clamp(spread, 0, 1),
      clamp(outside / RELEASE_PADDING, 0, 1)
    ),
  };
}
