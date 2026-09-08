import { SECTORS } from "./content/sectors";
import type { Game } from "./types";

/** Render a self-contained, local flight card only after a player requests it. */
export async function createFlightCard(game: Game): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Flight cards are unavailable in this browser.");
  ctx.fillStyle = "#091218";
  ctx.fillRect(0, 0, 1200, 720);
  ctx.fillStyle = "#49685f";
  for (let i = 0; i < 100; i++) {
    ctx.fillRect((i * 137 + 19) % 1200, (i * 79 + 31) % 720, 2, 2);
  }
  ctx.strokeStyle = "#52786b";
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 1136, 656);
  ctx.fillStyle = "#abe4cc";
  ctx.font = "20px monospace";
  ctx.fillText("SPACE IMPACT / FLIGHT RECORD", 76, 95);
  ctx.font = "bold 90px sans-serif";
  ctx.fillText("LOST SIGNAL", 70, 212);
  ctx.fillStyle = "#e5eee4";
  ctx.font = "72px monospace";
  ctx.fillText(String(game.score).padStart(6, "0"), 74, 334);
  ctx.fillStyle = "#a1b8b0";
  ctx.font = "20px monospace";
  ctx.fillText("POINTS · SAVED ON THIS DEVICE", 76, 374);
  ctx.fillText(SECTORS[game.sector].name.toUpperCase(), 76, 456);
  ctx.fillText(
    game.secrets.length + "/8 SIGNALS · " + game.grazes + " NEAR MISSES",
    76,
    493,
  );
  ctx.fillText(
    (game.assist ? "ASSISTED" : "STANDARD") + " / " + game.mode.toUpperCase(),
    76,
    530,
  );
  ctx.fillStyle = "#abe4cc";
  ctx.font = "24px monospace";
  const line =
    game.ending === "signal"
      ? "You were never alone."
      : "Follow the transmission.";
  ctx.fillText(line, 76, 626);
  ctx.strokeStyle = "#abe4cc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(954, 331);
  ctx.lineTo(1074, 370);
  ctx.lineTo(954, 409);
  ctx.lineTo(978, 370);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#e1ae78";
  ctx.fillRect(915, 365, 42, 10);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Flight card could not be created."));
    }, "image/png"),
  );
}
