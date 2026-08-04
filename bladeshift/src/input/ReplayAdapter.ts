import type { BladeFrame, BladePointer, InputAdapter, InputAdapterStatus, InputSource } from './InputAdapter';

export interface RecordedFrame {
  /** ms elapsed since recording start. */
  elapsed: number;
  pointers: BladePointer[];
}

export interface Recording {
  seed: number;
  frames: RecordedFrame[];
}

/**
 * Replays a previously recorded frame stream through the same InputAdapter
 * contract every other controller uses -- so recorded runs are deterministic
 * regression tests and demo playback, not a special code path.
 */
export class ReplayAdapter implements InputAdapter {
  readonly source: InputSource = 'replay';

  private recording: Recording;
  private startTimestamp = 0;
  private cursor = 0;
  private started = false;
  private finished = false;

  constructor(recording: Recording) {
    this.recording = recording;
  }

  start(): void {
    this.started = true;
    this.finished = false;
    this.cursor = 0;
    this.startTimestamp = performance.now();
  }

  stop(): void {
    this.started = false;
  }

  read(timestamp: number): BladeFrame {
    if (!this.started) return { timestamp, pointers: [] };
    const elapsed = timestamp - this.startTimestamp;
    const pointers: BladePointer[] = [];
    while (this.cursor < this.recording.frames.length && this.recording.frames[this.cursor].elapsed <= elapsed) {
      pointers.push(...this.recording.frames[this.cursor].pointers);
      this.cursor++;
    }
    if (this.cursor >= this.recording.frames.length) this.finished = true;
    return { timestamp, pointers };
  }

  isFinished(): boolean {
    return this.finished;
  }

  getStatus(): InputAdapterStatus {
    return {
      connected: this.started,
      label: 'Replay',
      detail: `${this.cursor}/${this.recording.frames.length} frames${this.finished ? ' (done)' : ''}`
    };
  }
}

export class InputRecorder {
  private recording: Recording | null = null;
  private startTimestamp = 0;

  start(seed: number): void {
    this.recording = { seed, frames: [] };
    this.startTimestamp = performance.now();
  }

  record(timestamp: number, pointers: readonly BladePointer[]): void {
    if (!this.recording || pointers.length === 0) return;
    this.recording.frames.push({
      elapsed: timestamp - this.startTimestamp,
      pointers: pointers.map((p) => ({ ...p }))
    });
  }

  stop(): Recording | null {
    const result = this.recording;
    this.recording = null;
    return result;
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}
