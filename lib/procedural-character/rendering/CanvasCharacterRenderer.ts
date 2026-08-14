import { clamp, normalize, vec2 } from "../math/Vec2";
import type { AppendageRuntime } from "../physics/Appendage";
import type {
  CharacterRenderState,
  CharacterRenderer,
} from "./CharacterRenderer";
import { DebugRenderer } from "./DebugRenderer";

export interface CanvasCharacterRendererOptions {
  canvas: HTMLCanvasElement;
}

const MAX_RIBBON_POINTS = 64;

export class CanvasCharacterRenderer implements CharacterRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly debugRenderer = new DebugRenderer();
  private readonly gazeDirection = vec2(1, 0);
  private readonly leftX = new Float32Array(MAX_RIBBON_POINTS);
  private readonly leftY = new Float32Array(MAX_RIBBON_POINTS);
  private readonly rightX = new Float32Array(MAX_RIBBON_POINTS);
  private readonly rightY = new Float32Array(MAX_RIBBON_POINTS);
  private width = 1;
  private height = 1;
  private dpr = 1;

  constructor(options: CanvasCharacterRendererOptions) {
    const context = options.canvas.getContext("2d");
    if (!context) throw new Error("Procedural character requires Canvas 2D");
    this.canvas = options.canvas;
    this.context = context;
  }

  resize(width: number, height: number, devicePixelRatio: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.max(1, devicePixelRatio);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  render(state: CharacterRenderState): void {
    const context = this.context;
    context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    context.clearRect(0, 0, this.width, this.height);

    this.drawInkBurst(context, state);
    this.drawGlow(context, state);
    this.drawAppendages(context, state);
    this.drawBody(context, state);
    this.drawMarkings(context, state);
    this.drawEyes(context, state);
    this.drawFace(context, state);

    if (state.debug) this.debugRenderer.draw(context, state);
  }

  destroy(): void {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawInkBurst(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const strength = state.action.inkPulse;
    if (strength <= 0) return;
    const progress = 1 - strength;
    const radius = state.spec.body.radius * state.spec.scale;
    context.save();
    context.fillStyle = "#17122b";
    for (let index = 0; index < 14; index += 1) {
      const angle = index * 2.399963 + progress * 0.8;
      const distance = radius * (0.55 + progress * (1.25 + (index % 4) * 0.16));
      const dot = radius * (0.13 + (index % 3) * 0.045) * strength;
      context.globalAlpha = strength * (0.34 + (index % 5) * 0.08);
      context.beginPath();
      context.arc(
        state.body.position.x + Math.cos(angle) * distance,
        state.body.position.y + Math.sin(angle) * distance,
        Math.max(0.8, dot),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();
  }

  private drawGlow(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    if (state.spec.rendering.glow <= 0) return;
    const radius = state.spec.body.radius * state.spec.scale;
    context.save();
    context.globalAlpha = 0.18 * state.spec.rendering.glow;
    context.shadowColor = state.spec.rendering.glowColor;
    context.shadowBlur = 26 * state.spec.rendering.glow;
    context.fillStyle = state.spec.rendering.glowColor;
    context.beginPath();
    context.ellipse(
      state.body.position.x,
      state.body.position.y,
      radius * 0.72,
      radius * 0.92,
      state.pose.rotation,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }

  private drawAppendages(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { appendages, spec } = state;
    context.save();
    context.lineJoin = "round";
    context.shadowColor = "rgba(3, 12, 24, 0.24)";
    context.shadowBlur = 7 + state.action.grab * 7;
    context.shadowOffsetY = 4;

    for (let index = 0; index < appendages.length; index += 1) {
      const appendage = appendages[index];
      const paletteColor =
        spec.rendering.debugPalette[
          Math.abs(appendage.spec.gaitGroup) %
            spec.rendering.debugPalette.length
        ];
      context.fillStyle = state.debug
        ? `${paletteColor}b8`
        : spec.rendering.appendageColor;
      context.strokeStyle = state.debug
        ? `${paletteColor}e6`
        : spec.rendering.outlineColor;
      context.lineWidth = Math.max(0.65, spec.rendering.outlineWidth * 0.65);
      this.drawTaperedTentacle(context, appendage, spec.scale);
    }

    context.restore();
  }

  private drawTaperedTentacle(
    context: CanvasRenderingContext2D,
    appendage: AppendageRuntime,
    scale: number,
  ): void {
    const points = appendage.softPoints;
    const last = Math.min(points.length - 1, MAX_RIBBON_POINTS - 1);
    if (last < 1) return;
    const baseHalfWidth = appendage.spec.thickness * scale * 0.5;

    for (let index = 0; index <= last; index += 1) {
      const before = points[Math.max(0, index - 1)];
      const after = points[Math.min(last, index + 1)];
      const tangentX = after.x - before.x;
      const tangentY = after.y - before.y;
      const tangentLength = Math.max(0.0001, Math.hypot(tangentX, tangentY));
      const normalX = -tangentY / tangentLength;
      const normalY = tangentX / tangentLength;
      const t = index / last;
      const taper = Math.pow(1 - t, 0.72);
      const muscle = 1 + Math.sin(t * Math.PI) * 0.16;
      const halfWidth = Math.max(1.15 * scale, baseHalfWidth * taper * muscle);

      this.leftX[index] = points[index].x + normalX * halfWidth;
      this.leftY[index] = points[index].y + normalY * halfWidth;
      this.rightX[index] = points[index].x - normalX * halfWidth;
      this.rightY[index] = points[index].y - normalY * halfWidth;
    }

    context.beginPath();
    context.moveTo(this.leftX[0], this.leftY[0]);
    for (let index = 1; index < last; index += 1) {
      context.quadraticCurveTo(
        this.leftX[index],
        this.leftY[index],
        (this.leftX[index] + this.leftX[index + 1]) * 0.5,
        (this.leftY[index] + this.leftY[index + 1]) * 0.5,
      );
    }
    context.lineTo(this.leftX[last], this.leftY[last]);
    context.lineTo(this.rightX[last], this.rightY[last]);
    for (let index = last - 1; index > 0; index -= 1) {
      context.quadraticCurveTo(
        this.rightX[index],
        this.rightY[index],
        (this.rightX[index] + this.rightX[index - 1]) * 0.5,
        (this.rightY[index] + this.rightY[index - 1]) * 0.5,
      );
    }
    context.lineTo(this.rightX[0], this.rightY[0]);
    context.closePath();
    context.fill();
    context.stroke();
  }

  private drawBody(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    if (state.softBody) {
      this.drawSoftPolygonBody(context, state);
      return;
    }
    const { body, pose, spec } = state;
    const radius = spec.body.radius * spec.scale;

    context.save();
    context.translate(body.position.x, body.position.y);
    context.rotate(pose.rotation + pose.wobble);
    context.scale(
      pose.scaleX * (1 + state.action.crouch * 0.16),
      pose.scaleY * (1 - state.action.crouch * 0.22),
    );
    context.shadowColor = spec.rendering.bodyShadowColor;
    context.shadowBlur = 9;
    context.shadowOffsetY = 5;
    context.fillStyle = spec.rendering.bodyColor;
    context.strokeStyle = spec.rendering.outlineColor;
    context.lineWidth = spec.rendering.outlineWidth;

    context.beginPath();
    context.moveTo(0, -radius * 1.16);
    context.bezierCurveTo(
      radius * 0.55,
      -radius * 1.15,
      radius * 0.88,
      -radius * 0.72,
      radius * 0.86,
      -radius * 0.16,
    );
    context.bezierCurveTo(
      radius * 1.01,
      radius * 0.22,
      radius * 0.76,
      radius * 0.82,
      radius * 0.3,
      radius * 0.94,
    );
    context.bezierCurveTo(
      radius * 0.12,
      radius * 1.01,
      -radius * 0.12,
      radius * 1.01,
      -radius * 0.3,
      radius * 0.94,
    );
    context.bezierCurveTo(
      -radius * 0.76,
      radius * 0.82,
      -radius * 1.01,
      radius * 0.22,
      -radius * 0.86,
      -radius * 0.16,
    );
    context.bezierCurveTo(
      -radius * 0.88,
      -radius * 0.72,
      -radius * 0.55,
      -radius * 1.15,
      0,
      -radius * 1.16,
    );
    context.closePath();
    context.fill();
    context.stroke();

    context.shadowColor = "transparent";
    context.globalAlpha = 0.18;
    context.fillStyle = spec.rendering.bodyHighlightColor;
    context.beginPath();
    context.ellipse(
      -radius * 0.24,
      -radius * 0.54,
      radius * 0.2,
      radius * 0.36,
      -0.35,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }

  private drawSoftPolygonBody(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const softBody = state.softBody;
    if (!softBody || softBody.points.length < 3) return;
    const { body, spec } = state;

    context.save();
    context.shadowColor = spec.rendering.bodyShadowColor;
    context.shadowBlur = 12;
    context.shadowOffsetY = 6;
    context.fillStyle = spec.rendering.bodyColor;
    context.strokeStyle = spec.rendering.outlineColor;
    context.lineWidth = spec.rendering.outlineWidth;
    this.traceSmoothClosedPolygon(context, softBody.points);
    context.fill();
    context.stroke();

    context.shadowColor = "transparent";
    this.traceSmoothClosedPolygon(context, softBody.points);
    context.clip();
    const radius = spec.body.radius * spec.scale;
    const highlight = context.createRadialGradient(
      body.position.x - radius * 0.24,
      body.position.y - radius * 0.28,
      radius * 0.08,
      body.position.x,
      body.position.y,
      radius * 1.1,
    );
    highlight.addColorStop(0, spec.rendering.bodyHighlightColor);
    highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = highlight;
    context.fillRect(
      body.position.x - radius * 1.5,
      body.position.y - radius * 1.5,
      radius * 3,
      radius * 3,
    );
    context.restore();
  }

  private traceSmoothClosedPolygon(
    context: CanvasRenderingContext2D,
    points: readonly { x: number; y: number }[],
  ): void {
    const last = points.length - 1;
    context.beginPath();
    context.moveTo(
      (points[last].x + points[0].x) * 0.5,
      (points[last].y + points[0].y) * 0.5,
    );
    for (let index = 0; index < points.length; index += 1) {
      const next = (index + 1) % points.length;
      context.quadraticCurveTo(
        points[index].x,
        points[index].y,
        (points[index].x + points[next].x) * 0.5,
        (points[index].y + points[next].y) * 0.5,
      );
    }
    context.closePath();
  }

  private drawMarkings(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { softBody, spec, body } = state;
    const style = spec.rendering.markingStyle;
    if (!softBody || style === "none" || softBody.points.length < 3) return;

    const radius = spec.body.radius * spec.scale;
    context.save();
    this.traceSmoothClosedPolygon(context, softBody.points);
    context.clip();
    context.translate(body.position.x, body.position.y);
    context.rotate(body.facingAngle);
    context.fillStyle = spec.rendering.markingColor;
    context.globalAlpha = 0.72;

    if (style === "koi") {
      const patches = [
        { x: 0.34, y: -0.22, rx: 0.31, ry: 0.19, r: -0.35 },
        { x: -0.08, y: 0.28, rx: 0.25, ry: 0.17, r: 0.42 },
        { x: -0.42, y: -0.08, rx: 0.17, ry: 0.13, r: -0.18 },
      ];
      for (const patch of patches) {
        context.beginPath();
        context.ellipse(
          patch.x * radius,
          patch.y * radius,
          patch.rx * radius,
          patch.ry * radius,
          patch.r,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    } else if (style === "bands") {
      for (const position of [-0.48, -0.14, 0.2]) {
        context.save();
        context.translate(position * radius, 0);
        context.rotate(-0.16);
        context.fillRect(-radius * 0.075, -radius, radius * 0.15, radius * 2);
        context.restore();
      }
    } else {
      const spots = [
        [-0.42, -0.3, 0.1],
        [-0.18, 0.26, 0.08],
        [0.08, -0.2, 0.12],
        [0.34, 0.24, 0.07],
        [0.46, -0.08, 0.055],
      ] as const;
      for (const [x, y, size] of spots) {
        context.beginPath();
        context.arc(x * radius, y * radius, size * radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  private drawEyes(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { body, pose, spec, target } = state;
    const eyes = spec.eyes;
    if (eyes.count <= 0) return;
    const rotation = state.softBody
      ? body.facingAngle
      : pose.rotation + pose.wobble;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);

    this.gazeDirection.x =
      target.x - body.position.x + body.velocity.x * eyes.velocityAnticipation;
    this.gazeDirection.y =
      target.y - body.position.y + body.velocity.y * eyes.velocityAnticipation;
    normalize(this.gazeDirection, this.gazeDirection, 1, 0);

    const spacing = eyes.spacing * spec.scale;
    const eyeRadius = eyes.size * spec.scale;
    const pupilRadius = eyes.pupilSize * spec.scale;
    const pupilTravel =
      Math.max(0, eyeRadius - pupilRadius - 1) * eyes.pupilTrackingStrength;
    const centerIndex = (eyes.count - 1) * 0.5;
    const spacingAxisX = Math.cos(eyes.spacingAngle);
    const spacingAxisY = Math.sin(eyes.spacingAngle);
    const baseX = eyes.offsetX * spec.scale;
    const baseY = eyes.offsetY * spec.scale;

    for (let index = 0; index < eyes.count; index += 1) {
      const offset = (index - centerIndex) * spacing;
      const localX = baseX + spacingAxisX * offset;
      const localY = baseY + spacingAxisY * offset;
      const eyeX = body.position.x + localX * cosine - localY * sine;
      const eyeY = body.position.y + localX * sine + localY * cosine;

      context.save();
      context.translate(eyeX, eyeY);
      context.rotate(rotation);
      context.scale(1, pose.eyeOpen);
      context.fillStyle = spec.rendering.eyeColor;
      context.strokeStyle = "rgba(15, 35, 48, 0.2)";
      context.lineWidth = 0.8;
      context.beginPath();
      context.ellipse(0, 0, eyeRadius * 0.82, eyeRadius, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();

      context.fillStyle = spec.rendering.pupilColor;
      context.beginPath();
      context.arc(
        eyeX + this.gazeDirection.x * pupilTravel,
        eyeY + this.gazeDirection.y * pupilTravel * pose.eyeOpen,
        pupilRadius * Math.max(0.45, pose.eyeOpen),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  private drawFace(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { body, pose, spec } = state;
    if (spec.eyes.count <= 0) return;
    const radius = spec.body.radius * spec.scale;
    const rotation = state.softBody
      ? body.facingAngle
      : pose.rotation + pose.wobble;
    const mouthOpen = clamp(
      pose.impact * 0.7 + Math.max(0, -body.velocity.y) / 1500,
      0,
      0.72,
    );
    const localX = spec.eyes.mouthOffsetX * spec.scale;
    const localY = spec.eyes.mouthOffsetY * spec.scale;
    const mouthX =
      body.position.x +
      Math.cos(rotation) * localX -
      Math.sin(rotation) * localY;
    const mouthY =
      body.position.y +
      Math.sin(rotation) * localX +
      Math.cos(rotation) * localY;

    context.save();
    context.translate(mouthX, mouthY);
    context.rotate(rotation);
    context.strokeStyle = spec.rendering.pupilColor;
    context.fillStyle = spec.rendering.pupilColor;
    context.lineWidth = 1.4;
    context.lineCap = "round";
    if (mouthOpen > 0.12) {
      context.beginPath();
      context.ellipse(
        0,
        0,
        radius * 0.075,
        radius * 0.12 * mouthOpen,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else {
      context.beginPath();
      context.arc(0, -radius * 0.02, radius * 0.08, 0.2, Math.PI - 0.2);
      context.stroke();
    }
    context.restore();
  }
}
