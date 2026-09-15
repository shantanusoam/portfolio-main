import type { HomeOctocatMotion, Limb } from "./motion";

/** The same rig remains playable when a device cannot create a WebGL 2 context. */
export class CanvasOctocatRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No supported character renderer");
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = canvas.height = Math.round(220 * this.dpr);
  }

  private limb(limb: Limb, m: HomeOctocatMotion) {
    const ctx = this.ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < limb.points.length - 1; i++) {
      const a = limb.points[i];
      const b = limb.points[i + 1];
      const next = limb.points[Math.min(i + 2, limb.points.length - 1)];
      const t = i / (limb.points.length - 1);
      ctx.strokeStyle =
        limb.index === 0 || limb.index === 2 || limb.index === 6
          ? "#8da4b9"
          : "#bdcddc";
      ctx.lineWidth = (limb.index < 4 ? 8.6 : 7.2) * Math.pow(1 - t, 0.56);
      ctx.beginPath();
      ctx.moveTo(110 + a.x - m.x, 150 + a.y - m.y);
      ctx.quadraticCurveTo(
        110 + b.x - m.x,
        150 + b.y - m.y,
        110 + (b.x + next.x) / 2 - m.x,
        150 + (b.y + next.y) / 2 - m.y,
      );
      ctx.stroke();
    }
  }

  render(m: HomeOctocatMotion, alpha = 1) {
    const x = m.previousX + (m.x - m.previousX) * alpha;
    const y = m.previousY + (m.y - m.previousY) * alpha;
    this.canvas.style.transform = `translate3d(${x - 110}px,${y - 150}px,0)`;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, 220, 220);
    if (m.grounded) {
      ctx.fillStyle = "#93aabd33";
      ctx.beginPath();
      ctx.ellipse(110, 151, 27, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const i of [6, 0, 2, 1, 3, 4, 5]) this.limb(m.limbs[i], m);
    const body = ctx.createLinearGradient(101, 120, 120, 135);
    body.addColorStop(0, "#cfdae3");
    body.addColorStop(1, "#8da4b9");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(
      110 - m.vx * 0.012,
      121 + m.squash * 14,
      9.5 * (1 + m.squash),
      15 * (1 - m.squash),
      m.vx * 0.0003,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.save();
    ctx.translate(110 + m.head.x - m.x, 150 + m.head.y - m.y);
    ctx.rotate(m.vx * 0.00055);
    ctx.scale(
      (1 + m.squash * 0.35) * (1 - Math.abs(m.turn) * 0.08),
      1 - m.squash * 0.4,
    );
    const head = ctx.createRadialGradient(-9, -15, 3, 0, 0, 34);
    head.addColorStop(0, "#e7edf2");
    head.addColorStop(0.5, "#bdccd9");
    head.addColorStop(1, "#8199af");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.moveTo(-20, 5);
    ctx.quadraticCurveTo(-27, -6, -19, -15);
    ctx.lineTo(-19, -29);
    ctx.quadraticCurveTo(-19, -34, -7, -20);
    ctx.quadraticCurveTo(0, -24, 8, -20);
    ctx.lineTo(21, -31);
    ctx.quadraticCurveTo(25, -34, 22, -12);
    ctx.quadraticCurveTo(28, 4, 20, 13);
    ctx.quadraticCurveTo(1, 27, -18, 12);
    ctx.closePath();
    ctx.fill();
    const look = Math.sin(m.turn) * 6;
    ctx.fillStyle = "#e8edf0";
    ctx.beginPath();
    ctx.ellipse(look, 4, 17, 12.5, 0, 0, Math.PI * 2);
    ctx.fill();
    const phase = m.time % 4.7;
    const blink =
      !m.reducedMotion && phase > 4.52
        ? Math.max(0.08, Math.abs(phase - 4.61) / 0.09)
        : 1;
    for (const side of [-1, 1]) {
      ctx.fillStyle = "#1d2c3f";
      ctx.beginPath();
      ctx.ellipse(look + side * 7.3, 1.5, 2.8, 4.3 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(look + side * 7.3 - 0.7, 0.3, 0.8, blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#253748";
    ctx.beginPath();
    ctx.ellipse(look, 8, 1.6, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5e7180";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(look - 3, 11);
    ctx.quadraticCurveTo(look, 13, look + 3, 11);
    ctx.stroke();
    ctx.restore();
    return { x, y };
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
