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

export class CanvasCharacterRenderer implements CharacterRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly debugRenderer = new DebugRenderer();
  private readonly gazeDirection = vec2(1, 0);
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

    this.drawAppendages(context, state);
    this.drawBody(context, state);
    this.drawEyes(context, state);

    if (state.debug) this.debugRenderer.draw(context, state);
  }

  destroy(): void {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawAppendages(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { appendages, spec } = state;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let index = 0; index < appendages.length; index += 1) {
      const appendage = appendages[index];
      const paletteColor =
        spec.rendering.debugPalette[
          Math.abs(appendage.spec.gaitGroup) %
            spec.rendering.debugPalette.length
        ];
      context.strokeStyle = state.debug
        ? `${paletteColor}cc`
        : spec.rendering.appendageColor;
      context.lineWidth =
        (appendage.spec.thickness || spec.rendering.appendageThickness) *
        spec.scale;
      this.drawJointChain(context, appendage);

      if (state.debug) {
        context.fillStyle = paletteColor;
        for (let point = 1; point < appendage.points.length - 1; point += 1) {
          context.beginPath();
          context.arc(
            appendage.points[point].x,
            appendage.points[point].y,
            2.7,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }

      context.fillStyle = appendage.stepping ? "#f8fafc" : paletteColor;
      context.beginPath();
      context.arc(appendage.foot.x, appendage.foot.y, 4.5, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  private drawJointChain(
    context: CanvasRenderingContext2D,
    appendage: AppendageRuntime,
  ): void {
    const points = appendage.points;
    if (points.length < 2) return;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }
    context.stroke();
  }

  private drawBody(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { body, spec } = state;
    const radius = spec.body.radius * spec.scale;
    const direction = body.movementDirection;
    const braking = clamp(
      -(body.acceleration.x * direction.x + body.acceleration.y * direction.y) /
        Math.max(1, spec.dynamics.maxAcceleration),
      0,
      1,
    );
    const stretch =
      1 +
      body.normalizedSpeed * spec.body.squashAmount * 0.7 -
      braking * spec.body.squashAmount * 0.45;
    const squash = clamp(1 / Math.max(0.7, stretch), 0.78, 1.25);

    context.save();
    context.translate(body.position.x, body.position.y);
    context.rotate(body.facingAngle);
    context.scale(stretch, squash);
    context.fillStyle = spec.rendering.bodyColor;
    context.strokeStyle = spec.rendering.outlineColor;
    context.lineWidth = spec.rendering.outlineWidth;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  private drawEyes(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { body, spec, target } = state;
    const eyes = spec.eyes;
    if (eyes.count <= 0) return;

    const forwardX = Math.cos(body.facingAngle);
    const forwardY = Math.sin(body.facingAngle);
    const normalX = -forwardY;
    const normalY = forwardX;
    const eyeBaseX =
      body.position.x + forwardX * spec.body.radius * spec.scale * 0.2;
    const eyeBaseY =
      body.position.y + forwardY * spec.body.radius * spec.scale * 0.2;

    this.gazeDirection.x =
      target.x - body.position.x + body.velocity.x * eyes.velocityAnticipation;
    this.gazeDirection.y =
      target.y - body.position.y + body.velocity.y * eyes.velocityAnticipation;
    normalize(this.gazeDirection, this.gazeDirection, forwardX, forwardY);

    const spacing = eyes.spacing * spec.scale;
    const eyeRadius = eyes.size * spec.scale;
    const pupilRadius = eyes.pupilSize * spec.scale;
    const pupilTravel =
      Math.max(0, eyeRadius - pupilRadius - 1) * eyes.pupilTrackingStrength;
    const centerIndex = (eyes.count - 1) * 0.5;

    for (let index = 0; index < eyes.count; index += 1) {
      const offset = (index - centerIndex) * spacing;
      const eyeX = eyeBaseX + normalX * offset;
      const eyeY = eyeBaseY + normalY * offset;

      context.fillStyle = spec.rendering.eyeColor;
      context.beginPath();
      context.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = spec.rendering.pupilColor;
      context.beginPath();
      context.arc(
        eyeX + this.gazeDirection.x * pupilTravel,
        eyeY + this.gazeDirection.y * pupilTravel,
        pupilRadius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
}
