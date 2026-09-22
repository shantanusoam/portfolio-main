import { clamp, type HomeOctocatMotion } from "./motion";

export const characterScale = (m: HomeOctocatMotion) => (m.playing ? 1.2 : 1);

/** The stance feet are outside body squash/tilt. Short two-bone legs bridge the pose. */
export function mochiPose(m: HomeOctocatMotion) {
  const still = m.reducedMotion;
  const scale = characterScale(m);
  const boost = still ? 0 : clamp(m.boostTime / 0.18, 0, 1);
  const weight = Math.max(0, m.reactionWeight);
  const happy = m.reaction === "boop" || m.reaction === "delight" ? weight : 0;
  const dizzy = m.reaction === "dizzy" ? weight : 0;
  const startled = m.reaction === "surprise" || m.reaction === "hurt";
  const wave = m.reaction === "wave" ? weight : 0;
  const moving = !still && m.grounded && Math.abs(m.vx) > 5;
  const sy = still ? 1 : 1 - m.squash;
  const sx = 1 / Math.sqrt(sy);
  const tilt = still
    ? 0
    : m.tilt + dizzy * Math.sin(m.reactionAge * 10) * 0.075;
  const bob = still
    ? 0
    : moving
      ? Math.min(
          1.6,
          m.feet.reduce((lift, f) => lift + Math.max(0, m.y - f.y), 0) * 0.13,
        )
      : Math.sin(m.time * 2) * 0.32;
  const feet = m.feet.map((foot, i) => ({
    x: still ? (i ? 9 : -9) : clamp(foot.x - m.x, -29, 29) / scale,
    y: -4 + (still ? 0 : (foot.y - m.y) / scale),
    angle: still
      ? 0
      : foot.moving
        ? Math.sin(foot.progress * Math.PI * 2) * 0.24
        : !m.grounded
          ? -m.vx * 0.0007
          : 0,
    planted: m.grounded && !foot.moving,
  }));
  const legs = feet.map((foot, i) => {
    const hx = (i ? 8 : -8) * sx;
    const hy = -11 * sy;
    const hip = {
      x: hx * Math.cos(tilt) - hy * Math.sin(tilt),
      y: hx * Math.sin(tilt) + hy * Math.cos(tilt) - bob - 2,
    };
    const dx = foot.x - hip.x;
    const dy = foot.y - hip.y;
    const d = clamp(Math.hypot(dx, dy), 0.1, 20.99);
    const a = Math.atan2(dy, dx);
    const bend = Math.acos(clamp((100 + d * d - 121) / (20 * d), -1, 1));
    const knee = {
      x: hip.x + Math.cos(a + (i ? -1 : 1) * bend) * 10,
      y: hip.y + Math.sin(a + (i ? -1 : 1) * bend) * 10,
    };
    return { hip, knee };
  });
  const eyeBase = still ? 1 : m.blink * (1 - m.sleepy * 0.62);
  return {
    sx,
    sy,
    tilt,
    bob,
    feet,
    legs,
    facing: still ? 0 : m.facing,
    ears: still
      ? [-0.17, 0.22]
      : [
          m.ears[0] - 0.17 + m.attention * 0.1 - happy * 0.16,
          m.ears[1] + 0.22 - m.attention * 0.1 + happy * 0.2,
        ],
    arms: still
      ? [0, 0]
      : [
          Math.sin(m.gait) * (moving ? 0.4 : 0) -
            happy * 0.65 -
            m.edge * 0.4 -
            boost * 0.65,
          -Math.sin(m.gait) * (moving ? 0.4 : 0) +
            happy * 0.65 +
            boost * 0.65 +
            wave * (2.55 + Math.sin(m.reactionAge * 19) * 0.3) -
            m.edge * 0.4,
        ],
    look: still ? 0 : m.gazeX + m.facing * 1.2,
    lookY: still ? 0 : m.gazeY + m.sleepy * 1.5,
    blink: eyeBase,
    eyes: [
      Math.max(0.12, eyeBase * (1 - happy * 0.8)),
      Math.max(0.12, eyeBase * (1 - happy * 0.8 - wave * 0.4)),
    ],
    happy,
    dizzy,
    wave,
    mouthOpen: startled ? weight : !m.grounded && m.vy > 550 ? 0.6 : 0,
    cheek: 1 + happy * 0.35,
    heart: m.reaction === "boop" ? weight : 0,
    heartRise: still ? 0 : m.reactionAge * 12,
    sleepy: still ? 0 : m.sleepy,
    opacity: m.recovering > 0 ? 0.65 : m.invulnerable > 0 ? 0.8 : 1,
  };
}
export type MochiPose = ReturnType<typeof mochiPose>;
export const CHARACTER_SIZE = 160;
export const CHARACTER_ORIGIN_X = 80;
export const CHARACTER_ORIGIN_Y = 112;
