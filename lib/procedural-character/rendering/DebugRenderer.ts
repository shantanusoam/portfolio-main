import type { CharacterRenderState } from "./CharacterRenderer";

function drawCross(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x - radius, y);
  context.lineTo(x + radius, y);
  context.moveTo(x, y - radius);
  context.lineTo(x, y + radius);
  context.stroke();
}

export class DebugRenderer {
  draw(context: CanvasRenderingContext2D, state: CharacterRenderState): void {
    const { appendages, body, spec, target } = state;
    const palette = spec.rendering.debugPalette;

    context.save();
    context.lineWidth = 1;

    // Target and body kinematics.
    context.strokeStyle = "rgba(248, 250, 252, 0.76)";
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(body.position.x, body.position.y);
    context.lineTo(target.x, target.y);
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = "#f8fafc";
    drawCross(context, target.x, target.y, 9);

    context.strokeStyle = "#fb7185";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(body.position.x, body.position.y);
    context.lineTo(
      body.position.x + body.velocity.x * 0.12,
      body.position.y + body.velocity.y * 0.12,
    );
    context.stroke();

    for (let index = 0; index < appendages.length; index += 1) {
      const appendage = appendages[index];
      const groupColor =
        palette[Math.abs(appendage.spec.gaitGroup) % palette.length];

      // Trigger threshold: a step becomes eligible when the ideal cross exits
      // this world-space circle around the locked foot.
      context.strokeStyle = `${groupColor}66`;
      context.lineWidth = 1;
      context.setLineDash([3, 4]);
      context.beginPath();
      context.arc(
        appendage.lockedFootPosition.x,
        appendage.lockedFootPosition.y,
        appendage.triggerThreshold,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.moveTo(
        appendage.lockedFootPosition.x,
        appendage.lockedFootPosition.y,
      );
      context.lineTo(appendage.idealFootTarget.x, appendage.idealFootTarget.y);
      context.stroke();
      context.setLineDash([]);

      context.strokeStyle = groupColor;
      drawCross(
        context,
        appendage.idealFootTarget.x,
        appendage.idealFootTarget.y,
        4,
      );

      if (appendage.stepping) {
        context.fillStyle = groupColor;
        context.beginPath();
        context.arc(
          appendage.stepDestination.x,
          appendage.stepDestination.y,
          3.5,
          0,
          Math.PI * 2,
        );
        context.fill();
      }

      context.fillStyle = "#f8fafc";
      context.fillRect(appendage.anchor.x - 2, appendage.anchor.y - 2, 4, 4);
    }

    this.drawReadout(context, state);
    context.restore();
  }

  private drawReadout(
    context: CanvasRenderingContext2D,
    state: CharacterRenderState,
  ): void {
    const { appendages, performance } = state;
    const compact = context.canvas.clientWidth < 720;
    const width = compact ? 190 : 314;
    const lineHeight = compact ? 14 : 16;
    const visibleLegs = compact
      ? Math.min(4, appendages.length)
      : appendages.length;
    const height = 44 + visibleLegs * lineHeight;
    const x = context.canvas.clientWidth - width - 16;
    const y = 16;

    context.fillStyle = "rgba(2, 6, 23, 0.76)";
    context.fillRect(x, y, width, height);
    context.strokeStyle = "rgba(148, 163, 184, 0.35)";
    context.strokeRect(x, y, width, height);
    context.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillStyle = "#e2e8f0";
    context.fillText(
      `${performance.fps.toFixed(0)} fps  ${performance.solverTimeMs.toFixed(
        2,
      )} ms  ${performance.activeSteps} stepping`,
      x + 10,
      y + 17,
    );
    context.fillStyle = "#94a3b8";
    context.fillText(
      `gait phase ${performance.gaitPhase.toFixed(2)}`,
      x + 10,
      y + 33,
    );

    for (let index = 0; index < visibleLegs; index += 1) {
      const appendage = appendages[index];
      const demand = appendage.stepDemand.toFixed(2);
      const reason = compact
        ? appendage.triggerReason.slice(0, 15)
        : appendage.triggerReason;
      context.fillStyle = appendage.stepping ? "#f8fafc" : "#cbd5e1";
      context.fillText(
        `L${index + 1} g${appendage.spec.gaitGroup} ${demand}x ${reason}`,
        x + 10,
        y + 34 + (index + 1) * lineHeight,
      );
    }
  }
}
