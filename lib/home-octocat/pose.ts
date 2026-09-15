import { clamp, type HomeOctocatMotion } from "./motion";

/** Both renderers use the same proportions and pose, including the fixed sole. */
export function mochiPose(m: HomeOctocatMotion) {
  const phase = m.time % 4.8;
  const blink =
    !m.reducedMotion && phase > 4.6
      ? Math.max(0.08, Math.abs(phase - 4.7) / 0.1)
      : 1;
  const sy = 1 - m.squash;
  const moving = m.grounded && Math.abs(m.vx) > 5;
  return {
    sx: 1 / Math.sqrt(sy),
    sy,
    tilt: m.tilt,
    bob: m.reducedMotion
      ? 0
      : moving
        ? Math.abs(Math.sin(m.gait)) * 1.4
        : Math.sin(m.time * 2) * 0.35,
    ears: [m.ears[0] - 0.17, m.ears[1] + 0.22],
    feet: moving
      ? [Math.max(0, Math.sin(m.gait)) * 3, Math.max(0, -Math.sin(m.gait)) * 3]
      : [0, 0],
    look: m.playing
      ? clamp(m.vx / 140, -2, 2)
      : clamp((m.lookX - m.screenX) / 160, -2.5, 2.5),
    blink,
    happy: m.grounded && m.phase === "ready",
  };
}
export type MochiPose = ReturnType<typeof mochiPose>;
export const CHARACTER_SIZE = 160;
export const CHARACTER_ORIGIN_X = 80;
export const CHARACTER_ORIGIN_Y = 112;
