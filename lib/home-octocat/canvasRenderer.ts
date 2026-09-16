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
  ellipse(-10, -1 - pose.feet[0], 8, 4.2, "#eee3ce");
  ellipse(10, -1 - pose.feet[1], 8, 4.2, "#eee3ce");
  ellipse(0, -22, 21, 22, fur);
  ellipse(-17, -13, 4.5, 7, fur);
  ellipse(17, -13, 4.5, 7, fur);
  const gaze = pose.look;
  ctx.save();
  ctx.translate(0, pose.lookY);
  for (const side of [-1, 1]) {
    ellipse(side * 12 + gaze * 0.5, -18.5, 3.7, 2.2, "#eabbaa");
    ellipse(side * 6.6 + gaze, -23, 2.2, 3 * pose.blink, "#343d3c");
    if (pose.blink > 0.4)
      ellipse(side * 6.6 + gaze - 0.5, -24, 0.65, 0.75, "#fffef4");
  }
  ellipse(gaze, -17, 1.3, 0.95, "#b58479");
  ctx.strokeStyle = "#66554e";
  ctx.lineWidth = 0.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(gaze - 2.5, -14.8);
  ctx.quadraticCurveTo(gaze, -12.3, gaze + 2.5, -14.8);
  ctx.stroke();
  ctx.restore();
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
