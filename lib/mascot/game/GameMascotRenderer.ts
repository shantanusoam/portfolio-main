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
  const rx = Math.max(2, radius * deformation.lateralScale);
  const ry = Math.max(2, radius * deformation.longitudinalScale);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(deformation.tumbleRotation);

  if (deformation.impactWave > 0.02) {
    ctx.globalAlpha = deformation.impactWave * 0.35;
    ctx.fillStyle = palette.highlight;
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.2, rx * 1.6, ry * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = palette.base;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.highlight;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(-rx * 0.25, -ry * 0.35, rx * 0.4, ry * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const eyeOffsetX = rx * 0.32;
  const eyeOffsetY = -ry * 0.15;
  const falling = input.velocityY < -60;
  const eyeOpen = falling
    ? 1
    : Math.max(0.25, 1 - deformation.impactWave * 0.6);
  const eyeRadius = rx * 0.14;

  ctx.fillStyle = palette.face;
  for (const side of [-1, 1] as const) {
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
  }

  ctx.fillStyle = palette.shadow;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc(side * eyeOffsetX, eyeOffsetY, eyeRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  if (deformation.tailStretch > 0.05 && !input.reducedMotion) {
    ctx.strokeStyle = palette.rim;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = Math.max(1, radius * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, ry * 0.7);
    ctx.quadraticCurveTo(
      0,
      ry * (0.7 + deformation.tailStretch),
      0,
      ry * (1.1 + deformation.tailStretch),
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
