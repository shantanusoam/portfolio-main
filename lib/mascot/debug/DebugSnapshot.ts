import type { MascotDebugSnapshot } from "../types";

/** Formats a debug snapshot as a compact one-line string for the motion-lab overlay/console. */
export function formatDebugSnapshot(snapshot: MascotDebugSnapshot): string {
  const perf = snapshot.performance;
  return (
    `${snapshot.behavior} | ${snapshot.quality} | ` +
    `avg ${perf.averageFrameMs.toFixed(1)}ms p95 ${perf.p95FrameMs.toFixed(
      1,
    )}ms worst ${perf.worstFrameMs.toFixed(1)}ms | ` +
    `dropped ${
      perf.droppedSimulationTime
    } | root (${snapshot.rootPosition.x.toFixed(
      0,
    )}, ${snapshot.rootPosition.y.toFixed(0)})`
  );
}
