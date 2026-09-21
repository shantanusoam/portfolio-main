import type { HomeOctocatMotion } from "./motion";
import {
  CHARACTER_SIZE,
  CHARACTER_ORIGIN_X as OX,
  CHARACTER_ORIGIN_Y as OY,
  mochiPose,
  type MochiPose,
} from "./pose";

/** Also exported for deterministic, offline visual review of the actual drawing code. */
export function drawMochi(ctx: CanvasRenderingContext2D, pose: MochiPose) {
  const ellipse = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    fill: string | CanvasGradient,
  ) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.save();
  ctx.globalAlpha = pose.opacity;
  for (let i = 0; i < 2; i++) {
    const { hip, knee } = pose.legs[i];
    const foot = pose.feet[i];
    ctx.strokeStyle = "#e4d7c1";
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(knee.x, knee.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.stroke();
    ctx.save();
    ctx.translate(foot.x, foot.y);
    ctx.rotate(foot.angle);
    ellipse(0, 0, 7.5, 4, "#eee3ce");
    ellipse(1, 0.8, 4, 1.5, "#d8c8b1");
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, -2 - pose.bob);
  ctx.rotate(pose.tilt);
  ctx.scale(pose.sx, pose.sy);
  const fur = ctx.createRadialGradient(-8, -35, 2, 3, -18, 35);
  fur.addColorStop(0, "#fffef3");
  fur.addColorStop(0.55, "#f5ebd7");
  fur.addColorStop(1, "#c5bbab");
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    ctx.save();
    ctx.translate(side * 10, -35);
    ctx.rotate(pose.ears[i]);
    ellipse(0, -10, 6.5, i ? 17 : 15, fur);
    ellipse(0.7, -12, 2.7, i ? 10.5 : 9, "#e9bdab");
    ctx.restore();
  }
  ellipse(0, -22, 21, 22, fur);
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.translate(i ? 17 : -17, -18);
    ctx.rotate(-pose.arms[i]);
    ellipse(0, 5, 4.5, 7, fur);
    ctx.restore();
  }
  const gaze = pose.look;
  ctx.save();
  ctx.translate(0, pose.lookY);
  for (const side of [-1, 1]) {
    const eye = pose.eyes[side === -1 ? 0 : 1];
    ellipse(side * 12 + gaze * 0.5, -18.5, 3.7 * pose.cheek, 2.2, "#eabbaa");
    if (pose.dizzy > 0.3) {
      ctx.strokeStyle = "#343d3c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let n = 0; n < 30; n++) {
        const a = n / 3;
        const r = n / 13;
        const ex = side * 6.6 + gaze + Math.cos(a) * r;
        const ey = -23 + Math.sin(a) * r;
        if (!n) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      }
      ctx.stroke();
    } else ellipse(side * 6.6 + gaze, -23, 2.2, 3 * eye, "#343d3c");
    if (eye > 0.4 && pose.dizzy < 0.3)
      ellipse(side * 6.6 + gaze - 0.5, -24, 0.65, 0.75, "#fffef4");
  }
  ellipse(gaze, -17, 1.3, 0.95, "#b58479");
  ctx.strokeStyle = "#66554e";
  ctx.lineWidth = 0.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(gaze - 2.5 - pose.happy, -14.8);
  ctx.quadraticCurveTo(
    gaze,
    -12.3 + pose.happy,
    gaze + 2.5 + pose.happy,
    -14.8,
  );
  if (pose.mouthOpen <= 0.1) ctx.stroke();
  if (pose.mouthOpen > 0.1)
    ellipse(gaze, -14.1, 1.5, 2.2 * pose.mouthOpen, "#66554e");
  ctx.restore();
  ctx.restore();
  if (pose.heart > 0) {
    ctx.save();
    ctx.globalAlpha *= pose.heart;
    ctx.translate(22, -68 - pose.heartRise);
    ctx.fillStyle = "#e6aaae";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-10, -2, -5, -10, 0, -4);
    ctx.bezierCurveTo(5, -10, 10, -2, 0, 4);
    ctx.fill();
    ctx.restore();
  }
  if (pose.dizzy > 0.1) {
    ctx.fillStyle = "#efce85";
    ellipse(-23, -61, 2 * pose.dizzy, 2 * pose.dizzy, "#efce85");
    ellipse(25, -65, 2 * pose.dizzy, 2 * pose.dizzy, "#efce85");
  }
  ctx.restore();
}

/** Low-power / WebGL-unavailable devices keep the same character and physics. */
export class CanvasOctocatRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;
  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No supported character renderer");
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = CHARACTER_SIZE * this.dpr;
  }

  render(m: HomeOctocatMotion, alpha = 1) {
    const x =
      m.previousX + (m.x - m.previousX) * alpha + (m.playing ? m.fieldLeft : 0);
    const y =
      m.previousY +
      (m.y - m.previousY) * alpha +
      m.previousCamera +
      (m.camera - m.previousCamera) * alpha;
    this.canvas.style.transform = `translate3d(${x - OX}px,${y - OY}px,0)`;
    this.canvas.style.opacity = m.phase === "over" ? "0" : "1";
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, CHARACTER_SIZE, CHARACTER_SIZE);
    if (m.grounded) {
      ctx.fillStyle = "#07171630";
      ctx.beginPath();
      ctx.ellipse(OX, OY + 1, 21, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(OX, OY);
    drawMochi(ctx, mochiPose(m));
    ctx.restore();
    return { x, y };
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
