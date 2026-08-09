/**
 * Fixed-capacity voice pool: tracks which slot a playing sound occupies
 * without knowing anything about `AudioContext`, buffers, or nodes. Modeled
 * on `lib/mascot/rendering/ParticlePool.ts`'s pool/recycling style — slots
 * are preallocated once and reused, never grown.
 *
 * A slot's `handle` is caller-supplied (e.g. `{ stop(): void }` wrapping a
 * live `AudioBufferSourceNode`), so this class stays pure and unit-testable
 * without a real Web Audio API. See tests/mascot/music/VoicePool.test.ts.
 *
 * Voice-stealing order (spec: "VOICE POOL AND POLYPHONY"):
 *   1. a quiet released voice
 *   2. the oldest quiet voice (if several)
 *   3. the oldest voice of any kind
 *   4. never exceed the fixed capacity
 */

export interface VoiceSlot<V> {
  readonly id: number;
  active: boolean;
  /** True once the voice is a low-priority steal candidate (past its attack transient, or explicitly released). */
  quiet: boolean;
  /** Monotonic acquisition counter, not wall-clock time — keeps ordering deterministic and testable. */
  startedAt: number;
  handle: V | null;
}

export interface VoicePoolOptions<V> {
  capacity: number;
  /** Called when an active handle must be forcibly stopped, either by stealing its slot or by `clear()`. */
  stop: (handle: V) => void;
}

export interface VoiceReservation {
  id: number;
  /** True if this reservation force-stopped another voice to make room. */
  stole: boolean;
}

export class VoicePool<V> {
  private readonly slots: VoiceSlot<V>[];
  private readonly stopHandle: (handle: V) => void;
  private clock = 0;

  constructor(options: VoicePoolOptions<V>) {
    const capacity = Math.max(0, Math.floor(options.capacity));
    this.stopHandle = options.stop;
    this.slots = Array.from({ length: capacity }, (_, id) => ({
      id,
      active: false,
      quiet: true,
      startedAt: 0,
      handle: null,
    }));
  }

  getCapacity(): number {
    return this.slots.length;
  }

  getActiveCount(): number {
    let count = 0;
    for (const slot of this.slots) if (slot.active) count += 1;
    return count;
  }

  getQuietActiveCount(): number {
    let count = 0;
    for (const slot of this.slots) if (slot.active && slot.quiet) count += 1;
    return count;
  }

  /**
   * Reserves a slot for a new voice about to start playing. Prefers a free
   * slot; otherwise steals per the documented order, stopping the previous
   * occupant's handle first. Returns null only at zero capacity — callers
   * must treat that as "do not play" rather than throwing.
   */
  acquire(): VoiceReservation | null {
    if (this.slots.length === 0) return null;

    const free = this.slots.find((slot) => !slot.active);
    const target = free ?? this.pickStealTarget();
    const stole = target.active;

    if (stole && target.handle) {
      this.stopHandle(target.handle);
    }

    target.active = true;
    target.quiet = false;
    target.startedAt = this.clock;
    target.handle = null;
    this.clock += 1;

    return { id: target.id, stole };
  }

  /** Attaches the live handle for a slot returned by `acquire()`. */
  assign(id: number, handle: V): void {
    const slot = this.slots[id];
    if (!slot) return;
    slot.handle = handle;
  }

  /**
   * Marks a slot's voice as a low-priority steal candidate (its attack
   * transient has passed) without deactivating it. Safe to call on an
   * already-quiet or already-inactive slot.
   */
  release(id: number): void {
    const slot = this.slots[id];
    if (!slot) return;
    slot.quiet = true;
  }

  /** Frees a slot entirely once playback has fully ended (e.g. the `ended` event). Does not call `stop` — the caller already knows playback ended. */
  free(id: number): void {
    const slot = this.slots[id];
    if (!slot) return;
    slot.active = false;
    slot.quiet = true;
    slot.handle = null;
  }

  /** Force-stops every active voice and frees all slots. */
  clear(): void {
    for (const slot of this.slots) {
      if (slot.active && slot.handle) this.stopHandle(slot.handle);
      slot.active = false;
      slot.quiet = true;
      slot.handle = null;
    }
  }

  private pickStealTarget(): VoiceSlot<V> {
    let pool: VoiceSlot<V>[] = [];
    for (const slot of this.slots) {
      if (slot.active && slot.quiet) pool.push(slot);
    }
    if (pool.length === 0) pool = this.slots;

    let oldest = pool[0];
    for (let i = 1; i < pool.length; i += 1) {
      if (pool[i].startedAt < oldest.startedAt) oldest = pool[i];
    }
    return oldest;
  }
}
