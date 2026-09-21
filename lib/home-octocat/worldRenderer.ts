import { clamp, type HomeOctocatMotion, type Platform } from "./motion";

/** The world moves; the page never scrolls during a run. One bounded canvas. */
export class WorldRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.ctx = ctx;
  }

  resize(width: number, height: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
  }

  private star(x: number, y: number, radius: number, rotation = 0) {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rotation - Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? radius * 0.48 : radius;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (!i) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  render(m: HomeOctocatMotion, alpha: number) {
    const ctx = this.ctx;
    const { width, height } = m;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!m.playing) return;
    const camera = m.previousCamera + (m.camera - m.previousCamera) * alpha;
    // Start over the portfolio, then let it recede into a quiet night sky.
    const cover = clamp(camera / 280, 0, 1);
    ctx.fillStyle = `rgba(13,23,26,${0.72 + cover * 0.25})`;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      width / 2,
      height * 0.65,
      0,
      width / 2,
      height * 0.65,
      height * 0.8,
    );
    glow.addColorStop(0, "#28413a55");
    glow.addColorStop(1, "#18262900");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 48; i++) {
      const x = (i * 173.17 + 37) % width;
      const y = (i * 97.71 + camera * 0.16) % height;
      ctx.fillStyle = i % 5 ? "#cbdaca22" : "#d5dfce44";
      ctx.beginPath();
      ctx.arc(x, y, i % 5 ? 0.7 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(m.fieldLeft, camera);
    // Quiet altitude ticks make progress visible without a busy HUD.
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    const topAltitude = Math.ceil((m.launchY + camera) / 250) * 250;
    for (let h = 250; h <= topAltitude; h += 250) {
      const y = m.launchY - h;
      if (y + camera < 90 || y + camera > height - 40) continue;
      ctx.fillStyle = "#b5cbb233";
      ctx.fillText(`${h / 10} m`, m.fieldWidth + 12, y + 3);
      ctx.strokeStyle = "#b5cbb211";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(m.fieldWidth, y);
      ctx.stroke();
    }
    for (const p of m.platforms) {
      if (
        p.y + camera < -50 ||
        p.y + camera > height + 20 ||
        (p.broken && p.hit <= 0)
      )
        continue;
      this.platform(p, m);
      if (p.puff) this.puff(p, m);
      if (p.star) {
        const bob = m.reducedMotion ? 0 : Math.sin(m.time * 2.6 + p.id) * 3;
        const x = p.x + p.width / 2;
        const y = p.y - 31 + bob;
        ctx.fillStyle = "#efcf8355";
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4d58c";
        this.star(
          x,
          y,
          7.5,
          m.reducedMotion ? 0 : Math.sin(m.time + p.id) * 0.1,
        );
      }
    }
    for (const p of m.particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.gold ? "#f7d38b" : "#b8d7c2";
      if (p.gold) this.star(p.x, p.y, 2.5);
      else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (!m.grounded && m.phase === "climbing") {
      const support = m.platforms
        .filter(
          (p) =>
            !p.broken &&
            p.y >= m.y &&
            m.x >= p.x - 8 &&
            m.x <= p.x + p.width + 8,
        )
        .sort((a, b) => a.y - b.y)[0];
      if (support) {
        const strength = clamp(1 - (support.y - m.y) / 160, 0, 1);
        ctx.fillStyle = `rgba(4,15,12,${strength * 0.32})`;
        ctx.beginPath();
        ctx.ellipse(
          m.x,
          support.y + 3,
          15 * strength + 3,
          2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (m.extraHop) {
        ctx.fillStyle = "#cee4bd88";
        ctx.beginPath();
        ctx.arc(m.x, m.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    const vignette = ctx.createLinearGradient(0, height - 150, 0, height);
    vignette.addColorStop(0, "#0c171900");
    vignette.addColorStop(1, "#0c1719dd");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, height - 150, width, 150);
  }

  private platform(p: Platform, m: HomeOctocatMotion) {
    const ctx = this.ctx;
    const squash = Math.sin((1 - p.hit) * Math.PI) * p.hit * 4;
    const y = p.y; // The sole stays on the collision surface during compression.
    const color =
      p.kind === "spring"
        ? "#bddbb4"
        : p.kind === "checkpoint"
          ? "#e6ce97"
          : p.kind === "crumble"
            ? "#cba992"
            : "#96ada1";
    ctx.save();
    if (p.broken) {
      ctx.globalAlpha = p.hit;
      ctx.translate(0, (1 - p.hit) * 18);
    }
    ctx.fillStyle = "#050e1144";
    ctx.beginPath();
    ctx.roundRect(p.x + 2, y + 4, p.width - 4, 9, 5);
    ctx.fill();
    ctx.fillStyle = p.kind === "spring" ? "#60795e" : "#344c44";
    ctx.beginPath();
    ctx.roundRect(p.x, y, p.width, 9 - squash * 0.4, 5);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.globalAlpha *= 0.8;
    ctx.beginPath();
    ctx.roundRect(p.x + 1, y, p.width - 2, 3, 2);
    ctx.fill();
    ctx.globalAlpha = p.broken ? p.hit : 1;
    if (p.kind === "spring") {
      ctx.strokeStyle = "#cee8b7";
      ctx.lineWidth = 1.4;
      for (const dx of [-4, 4]) {
        const x = p.x + p.width / 2 + dx;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, y + 5);
        ctx.lineTo(x, y + 2.5);
        ctx.lineTo(x + 2.5, y + 5);
        ctx.stroke();
      }
      if (m.phase === "ready") {
        ctx.fillStyle = "#a7bd9e";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("spring", p.x + p.width / 2, y + 24);
      }
    } else if (p.kind === "checkpoint") {
      const x = p.x + 18;
      const active = p.id <= m.checkpointId;
      ctx.strokeStyle = active ? "#adcda3" : "#829c85";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 3, y - 12, x, y - 22);
      ctx.stroke();
      ctx.fillStyle = active ? "#edd496" : "#8d9e85";
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(a) * 4,
          y - 24 + Math.sin(a) * 4,
          3.5,
          3.5,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = "#f5efd5";
      ctx.beginPath();
      ctx.arc(x, y - 24, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#b9c9ac";
      ctx.fillText(
        active ? "a safe little spot" : "checkpoint + ♥",
        p.x + p.width / 2,
        y + 25,
      );
    } else if (p.kind === "crumble") {
      ctx.strokeStyle = p.crumble !== undefined ? "#edc69d" : "#967b6b";
      if (p.crumble !== undefined && !p.broken) {
        ctx.fillStyle = "#e1b38a";
        ctx.fillRect(
          p.x + 2,
          y + 6,
          (p.width - 4) * Math.max(0, p.crumble / 0.95),
          2,
        );
      }
      ctx.beginPath();
      ctx.moveTo(p.x + p.width * 0.45, y);
      ctx.lineTo(p.x + p.width * 0.49, y + 5);
      ctx.lineTo(p.x + p.width * 0.46, y + 9);
      ctx.stroke();
    } else if (p.kind === "moving") {
      ctx.fillStyle = "#d3ddd4";
      ctx.fillRect(p.x + p.width / 2 - 6, y + 4, 12, 1);
    }
    ctx.restore();
  }

  private puff(p: Platform, m: HomeOctocatMotion) {
    const puff = p.puff!;
    if (puff.defeated && puff.squash <= 0) return;
    const ctx = this.ctx;
    const alert = Math.abs(m.x - puff.x) < 65 && Math.abs(m.y - p.y) < 65;
    const breathing = m.reducedMotion ? 0 : Math.sin(m.time * 3 + p.id) * 0.7;
    ctx.save();
    ctx.translate(puff.x, p.y);
    ctx.fillStyle = "#060f1844";
    ctx.beginPath();
    ctx.ellipse(0, 1, 14, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (puff.defeated) {
      ctx.globalAlpha = puff.squash;
      ctx.scale(1.3, 0.2 + puff.squash * 0.2);
    }
    ctx.fillStyle = alert ? "#c4a9bf" : "#a796b3";
    ctx.beginPath();
    ctx.ellipse(0, -11, 12, 11 + breathing, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 7, -20, 4, 5, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ddd0de";
      ctx.beginPath();
      ctx.ellipse(side * 8, -2, 4, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a796b3";
    }
    const look = clamp((m.x - puff.x) / 40, -1.5, 1.5);
    ctx.fillStyle = "#3e3846";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        side * 4 + look,
        -12,
        1.1,
        alert ? 2.3 : 1.4,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.strokeStyle = "#534558";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.quadraticCurveTo(0, -4.5, 2, -6);
    ctx.stroke();
    if (alert && !puff.defeated) {
      ctx.fillStyle = "#e6c39c";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("!", 0, -31);
    }
    ctx.restore();
    if (p.id === 4 && !puff.defeated) {
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#b5a3b8";
      ctx.fillText("hop over · or land on top", p.x + p.width / 2, p.y - 48);
    }
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
