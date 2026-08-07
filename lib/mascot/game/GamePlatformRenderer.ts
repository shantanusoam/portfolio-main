import type { AppearancePalette } from "../appearance/AppearancePresets";
import type { GeneratedPlatform } from "./GameTypes";

/** Draws one string platform as a taut horizontal line, coloured/weighted by kind. */
export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  platform: GeneratedPlatform,
  palette: AppearancePalette,
  cooling: boolean,
): void {
  const color =
    platform.kind === "bass"
      ? palette.printSecondary
      : platform.kind === "treble"
        ? palette.printPrimary
        : palette.highlight;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth =
    platform.kind === "bass" ? 5 : platform.kind === "treble" ? 2.5 : 3.5;
  ctx.globalAlpha = cooling ? 0.55 : 0.95;
  ctx.beginPath();
  ctx.moveTo(platform.x, platform.y);
  ctx.lineTo(platform.x + platform.width, platform.y);
  ctx.stroke();
  ctx.restore();
}
