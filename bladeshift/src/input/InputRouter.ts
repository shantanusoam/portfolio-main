import type { BladeFrame, BladePointer, InputAdapter, InputAdapterStatus, InputSource } from './InputAdapter';
import { InputRecorder, type Recording } from './ReplayAdapter';

const STALE_GAP_MS = 200;

/** Per-source smoothing factor: 1 = no smoothing (instant), lower = more lag/stability. */
const SMOOTHING: Record<InputSource, number> = {
  pointer: 1,
  touch: 1,
  gamepad: 0.55,
  replay: 1
};

interface TrackedPointer {
  smoothedX: number;
  smoothedY: number;
  lastTimestamp: number;
  source: InputSource;
}

/**
 * Sits between InputAdapters and gameplay systems. Every adapter -- pointer,
 * gamepad, replay, and future webcam/phone adapters -- is normalized here into
 * one BladeFrame stream so SliceSystem never has to know where a point came from.
 */
export class InputRouter {
  private adapters = new Map<InputSource, InputAdapter>();
  private tracked = new Map<string, TrackedPointer>();
  private recorder = new InputRecorder();

  register(adapter: InputAdapter): void {
    this.adapters.set(adapter.source, adapter);
  }

  start(source: InputSource): void {
    this.adapters.get(source)?.start();
  }

  stop(source: InputSource): void {
    this.adapters.get(source)?.stop();
    for (const [id, t] of this.tracked) {
      if (t.source === source) this.tracked.delete(id);
    }
  }

  stopAll(): void {
    for (const source of this.adapters.keys()) this.stop(source);
  }

  startRecording(seed: number): void {
    this.recorder.start(seed);
  }

  stopRecording(): Recording | null {
    return this.recorder.stop();
  }

  isRecording(): boolean {
    return this.recorder.isRecording();
  }

  /** Poll every active adapter and return one merged, smoothed, stale-protected frame. */
  update(timestamp: number): BladeFrame {
    const merged: BladePointer[] = [];

    for (const adapter of this.adapters.values()) {
      const frame = adapter.read(timestamp);
      for (const raw of frame.pointers) {
        merged.push(this.process(raw, timestamp));
      }
    }

    this.recorder.record(timestamp, merged);
    return { timestamp, pointers: merged };
  }

  getStatuses(): Partial<Record<InputSource, InputAdapterStatus>> {
    const out: Partial<Record<InputSource, InputAdapterStatus>> = {};
    for (const [source, adapter] of this.adapters) {
      out[source] = adapter.getStatus();
    }
    return out;
  }

  private process(raw: BladePointer, timestamp: number): BladePointer {
    const key = `${raw.source}:${raw.id}`;
    const alpha = SMOOTHING[raw.source] ?? 1;
    let tracked = this.tracked.get(key);

    const gap = tracked ? timestamp - tracked.lastTimestamp : Infinity;
    const isStale = gap > STALE_GAP_MS;
    let phase = raw.phase;

    if (raw.phase === 'end' || raw.phase === 'cancel') {
      this.tracked.delete(key);
      return raw;
    }

    if (!tracked || isStale) {
      // Fresh stroke: don't smooth into a stale point, and don't let the
      // SliceSystem connect this to wherever the pointer was 300ms ago.
      tracked = { smoothedX: raw.x, smoothedY: raw.y, lastTimestamp: timestamp, source: raw.source };
      this.tracked.set(key, tracked);
      phase = 'start';
      return { ...raw, x: tracked.smoothedX, y: tracked.smoothedY, phase };
    }

    tracked.smoothedX += (raw.x - tracked.smoothedX) * alpha;
    tracked.smoothedY += (raw.y - tracked.smoothedY) * alpha;
    tracked.lastTimestamp = timestamp;

    return { ...raw, x: tracked.smoothedX, y: tracked.smoothedY, phase };
  }
}
