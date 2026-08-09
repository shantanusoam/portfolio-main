import type { AppearancePalette } from "../appearance/AppearancePresets";
import type { BodyDeformation } from "../types";

/**
 * Draws the Strumrise mascot as a compact deformable ellipse body rather
 * than routing through `appearance/SilhouetteRenderer`'s multi-layer
 * silhouette/print/rim/face pipeline. That pipeline's ribs/contour/face
 * frame are all derived from the homepage `CreatureRig`/`PoseController`
 * spine, which the game's dedicated physics root deliberately does not
 * drive (spec: "This separation is mandatory") — see
 * docs/mascot/STRUMRISE_DESIGN.md "Scope reductions". This renderer still
 * reuses the same `AppearancePalette` values and the same `BodyDeformation`
 * shape/fields, so the game mascot stays visually consistent with the
 * homepage character's colours and squash/stretch/tumble language.
 */

export interface GameMascotVisualInput {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  deformation: BodyDeformation;
  palette: AppearancePalette;
  radius: number;
  reducedMotion: boolean;
}

export function drawGameMascot(
  ctx: CanvasRenderingContext2D,
  input: GameMascotVisualInput,
): void {
  const { x, y, deformation, palette, radius } = input;
  const rx = Math.max(2, radius * 1.12 * deformation.lateralScale);
  const ry = Math.max(2, radius * 0.94 * deformation.longitudinalScale);
  const speed = Math.hypot(input.velocityX, input.velocityY);
  const gazeX = Math.max(-1, Math.min(1, input.velocityX / 420));
  const gazeY = Math.max(-1, Math.min(1, input.velocityY / 520));
  const falling = input.velocityY > 150;
  const rising = input.velocityY < -160;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(
    deformation.tumbleRotation +
      Math.max(-0.18, Math.min(0.18, input.velocityX / 2400)),
  );

  // The same short signal-tail and soft side fins survive the handoff into
  // gameplay; the player never turns into a generic physics ball.
  if (!input.reducedMotion) {
    const trail = Math.min(1, speed / 700);
    ctx.strokeStyle = palette.rim;
    ctx.globalAlpha = 0.52;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.2, radius * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, ry * 0.72);
    ctx.quadraticCurveTo(
      -gazeX * radius * 0.6,
      ry * (1.08 + trail * 0.25),
      -gazeX * radius,
      ry * (1.3 + trail * 0.45),
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const side of [-1, 1] as const) {
    const sweep = Math.max(-0.28, Math.min(0.34, input.velocityY / 1200));
    ctx.fillStyle = palette.base;
    ctx.strokeStyle = palette.rim;
    ctx.globalAlpha = 0.92;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(side * rx * 0.68, -ry * 0.18);
    ctx.quadraticCurveTo(
      side * rx * (1.18 + Math.abs(gazeX) * 0.08),
      ry * (-0.08 + sweep),
      side * rx * 0.7,
      ry * 0.32,
    );
    ctx.quadraticCurveTo(
      side * rx * 0.62,
      ry * 0.05,
      side * rx * 0.68,
      -ry * 0.18,
    );
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (deformation.impactWave > 0.02) {
    ctx.globalAlpha = deformation.impactWave * 0.35;
    ctx.fillStyle = palette.highlight;
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.2, rx * 1.6, ry * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const bodyGradient = ctx.createLinearGradient(-rx, -ry, rx, ry);
  bodyGradient.addColorStop(0, palette.highlight);
  bodyGradient.addColorStop(0.42, palette.base);
  bodyGradient.addColorStop(1, palette.shadow);
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = palette.rim;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Quiet face panel + ember seam: same material hierarchy as the hero rig.
  ctx.fillStyle = palette.face;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.ellipse(0, -ry * 0.1, rx * 0.72, ry * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.46;
  ctx.strokeStyle = palette.printPrimary;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.ellipse(
    0,
    -ry * 0.1,
    rx * 0.63,
    ry * 0.49,
    0,
    Math.PI * 0.12,
    Math.PI * 0.88,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  const eyeOffsetX = rx * 0.29;
  const eyeOffsetY = -ry * 0.16;
  const eyeOpen = falling
    ? 1
    : rising
      ? 0.72
      : Math.max(0.28, 0.84 - deformation.impactWave * 0.6);
  const eyeRadius = rx * 0.17;

  for (const side of [-1, 1] as const) {
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.ellipse(
      side * eyeOffsetX,
      eyeOffsetY,
      eyeRadius * 1.12,
      eyeRadius * eyeOpen * 1.12,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = palette.face;
    ctx.beginPath();
    ctx.ellipse(
      side * eyeOffsetX,
      eyeOffsetY,
      eyeRadius,
      eyeRadius * eyeOpen,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const pupilX = side * eyeOffsetX + gazeX * eyeRadius * 0.35;
    const pupilY = eyeOffsetY + gazeY * eyeRadius * 0.28;
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, eyeRadius * 0.46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.face;
    ctx.beginPath();
    ctx.arc(
      pupilX - eyeRadius * 0.14,
      pupilY - eyeRadius * 0.13,
      Math.max(0.65, eyeRadius * 0.11),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.strokeStyle = palette.shadow;
  ctx.lineWidth = Math.max(1, radius * 0.055);
  ctx.lineCap = "round";
  ctx.beginPath();
  if (falling) {
    ctx.ellipse(0, ry * 0.26, rx * 0.09, ry * 0.09, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(-rx * 0.1, ry * 0.22);
    ctx.quadraticCurveTo(0, ry * (rising ? 0.2 : 0.31), rx * 0.1, ry * 0.22);
  }
  ctx.stroke();

  ctx.restore();
}
