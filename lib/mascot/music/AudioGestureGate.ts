/**
 * Thin wrapper around `AudioDirector.activate()` that (a) only ever calls it
 * when explicitly requested — never speculatively, never on mount/effect —
 * and (b) coalesces concurrent requests into one in-flight activation, so a
 * rapid double-click/tap can't spin up two `AudioContext`s.
 *
 * This class cannot *prove* it was called from inside a real event handler
 * (that's a caller contract, documented on `requestActivation`), but it is
 * the single, deliberate choke point every activation path must go through.
 * See components/mascot/MascotSoundControl.tsx for the only intended caller.
 */
export class AudioGestureGate {
  private readonly activateFn: () => Promise<void>;
  private pending: Promise<void> | null = null;
  private engaged = false;

  constructor(activate: () => Promise<void>) {
    this.activateFn = activate;
  }

  /**
   * Call ONLY from inside a real click/tap/keydown handler — never from a
   * mount effect, timer, or speculatively on pointer move/scroll. Resolves
   * once activation has settled; never rejects (activation failures are
   * absorbed by `AudioDirector`, which falls back to a silent, unsupported
   * state rather than throwing).
   */
  requestActivation(): Promise<void> {
    this.engaged = true;
    if (this.pending) return this.pending;
    this.pending = this.activateFn().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  /** True once at least one activation has been requested (for UI, e.g. hiding a "tap to hear strings" hint immediately on click). */
  hasEngaged(): boolean {
    return this.engaged;
  }
}
