import { type HomeOctocatMotion } from "./motion";

/** Both renderers use the same proportions and pose, including the fixed sole. */
export function mochiPose(m: HomeOctocatMotion) {
  const sy = m.reducedMotion ? 1 : 1 - m.squash;
  const moving = !m.reducedMotion && m.grounded && Math.abs(m.vx) > 5;
  return {
    sx: 1 / Math.sqrt(sy),
    sy,
    tilt: m.reducedMotion ? 0 : m.tilt,
    bob: m.reducedMotion
      ? 0
      : moving
        ? Math.abs(Math.sin(m.gait)) * 1.4
        : Math.sin(m.time * 2) * 0.35,
    ears: m.reducedMotion
      ? [-0.17, 0.22]
      : [m.ears[0] - 0.17, m.ears[1] + 0.22],
    feet: moving
      ? [Math.max(0, Math.sin(m.gait)) * 3, Math.max(0, -Math.sin(m.gait)) * 3]
      : [0, 0],
    look: m.reducedMotion ? 0 : m.gazeX,
    lookY: m.reducedMotion ? 0 : m.gazeY,
    blink: m.reducedMotion ? 1 : m.blink,
  };
}
export type MochiPose = ReturnType<typeof mochiPose>;
export const CHARACTER_SIZE = 160;
export const CHARACTER_ORIGIN_X = 80;
export const CHARACTER_ORIGIN_Y = 112;
