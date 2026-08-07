# Mascot Audio Architecture

Covers `lib/mascot/music/` and `components/mascot/MascotSoundControl.tsx` —
the mascot's own opt-in string-contact audio system. This is the upgrade
spec's Phase 5 ("audio prototype"), built at "Prototype 2: pre-rendered
procedural pluck buffers" on the AUDIO PROTOTYPE LADDER — built-in Web Audio
nodes and pre-rendered `AudioBuffer`s, explicitly **not** `AudioWorklet`.

This system is completely separate from the existing, tuned, hand-played
guitar-string instrument in the Hero section
(`components/IntrectiveComponents/StringInstrument.tsx` +
`stringSynth.ts`). Neither file was modified. The mascot system owns its
own `AudioContext`, its own graph, and its own voice pool; the only thing it
reads from the hero instrument is `CHORDS` (the note-frequency table), so an
out-of-the-box mascot pluck is at least in tune with a real chord.

## Activation flow

Web Audio requires a real user gesture to create/resume an `AudioContext`.
The chain that enforces this:

```text
MascotSoundControl (onClick)
  -> engine.setSoundEnabled(true)      [MascotEngine.ts]
    -> audioDirector.setMuted(false)
    -> audioGestureGate.requestActivation()
      -> audioDirector.activate()      [only call site]
        -> new AudioContext() (first time) or context.resume()
```

Rules encoded in the code, not just documentation:

- `AudioDirector`'s `AudioContext` is created lazily inside `activate()` —
  never at module load, component mount, or in a `useEffect`.
- `AudioGestureGate` is the single choke point for `activate()` calls. It
  coalesces concurrent requests (a rapid double click shares one in-flight
  activation instead of spinning up two contexts) and exposes
  `hasEngaged()` so UI can react immediately, before the promise settles.
- `MascotSoundControl.tsx` is the only intended caller of
  `setSoundEnabled(true)`, and only from its `onClick` handler. Turning
  sound **off** (`setSoundEnabled(false)`) is safe to call from anywhere —
  it only sets a mute flag, never touches the `AudioContext`.
- `MascotEngine.triggerStringPluck()` / `MascotPluckVoicePool.play()` both
  check `audioDirector.isActive()` and silently no-op before activation —
  no audio can play before the first click, regardless of what calls them.
- Only the mute _preference_ is persisted, in `localStorage`
  (`mascot-sound-enabled`). The `AudioContext` itself is never persisted or
  restored — every page load starts silent and suspended, even for a
  visitor who previously turned sound on. The stored preference only
  pre-sets the button's initial label; the first click each session is
  still what performs the real activation.

## Audio graph

```text
MascotPluckVoicePool.play()
  creates a fresh, per-pluck node chain (never reused across plucks):

    AudioBufferSourceNode (cached Karplus-Strong buffer)
      -> BiquadFilterNode (lowpass, frequency envelope)
        -> GainNode (exponential attack/decay envelope)
          -> StereoPannerNode
            -> AudioDirector's dry bus  ──┐
                                          v
                              GainNode "dryBus" (unity gain,
                              just a named summing point)
                                          |
                              DynamicsCompressorNode
                                          ^
                    EffectsBus wet output ┘  (optional, medium/high quality)
                                          |
                              GainNode "masterGain" (mute / master volume)
                                          |
                              context.destination
```

Both the dry signal and the optional wet (delay-network) send converge into
the compressor **before** `masterGain`. That ordering is deliberate output
safety: muting or turning down `masterGain` always silences 100% of the
signal, regardless of which path a voice took. `AudioDirector.getMasterDestination()`
returns the dry bus (not literally `context.destination`) — that's the node
every voice connects to.

`EffectsBus` (`lib/mascot/music/EffectsBus.ts`) is a lightweight feedback
delay network (`DelayNode` + feedback `GainNode`, no `ConvolverNode` — the
spec explicitly forbids requiring convolution at low quality). It's gated
off entirely below "medium" quality (`shouldEnableEffects()`, a pure,
unit-tested function). It is built and wired into the graph but **not**
currently consumed by `MascotPluckVoicePool` — see "Deferred / integration
points" below.

## Scheduler design

`AudioScheduler` (`lib/mascot/music/AudioScheduler.ts`) has two paths, both
scheduling against `audioContext.currentTime` — never a visual timestamp:

- **Direct contacts** — `scheduleNow(play, safetyOffsetSeconds)`: plays at
  `currentTime + safetyOffsetSeconds` (default 6ms,
  `MASCOT_CONFIG.audio.gestureSafetyOffsetSeconds`) so a note is never
  scheduled in the past. `MascotPluckVoicePool.play()` uses this pattern
  directly against the real `AudioContext`.
- **Sequences (strums/phrases)** — `enqueue(note)` / the internal
  look-ahead timer: a bounded queue (`maxQueueLength: 32`) drained every
  `lookaheadIntervalMs` (25ms) for notes whose time falls within
  `scheduleAheadSeconds` (100ms) of "now." Nothing calls `enqueue()` yet
  this pass — it exists so a later strum-recognition workstream has
  somewhere to schedule multi-note phrases into.

The queue math (`drainDue(currentTime)`) is a pure method that removes and
returns due notes without playing them — the `setInterval`-driven `tick()`
is a thin wrapper around it. This is what makes
`tests/mascot/music/AudioScheduler.test.ts` possible without a real
`AudioContext` or fake timers: tests inject `getCurrentTime` and call
`drainDue`/`enqueue` directly.

## Voice pool design and measured stealing behavior

`VoicePool<V>` (`lib/mascot/music/VoicePool.ts`) is a pure, generic,
fixed-capacity data structure — modeled on
`lib/mascot/rendering/ParticlePool.ts`'s preallocate-and-recycle style. It
knows nothing about `AudioContext`; a slot's `handle` is caller-supplied
(`{ stop(): void }`), which is what makes it directly unit-testable
(`tests/mascot/music/VoicePool.test.ts`, 10 tests).

Capacity by quality tier (`MASCOT_CONFIG.audio.voicePoolCapacity`), per the
spec's "homepage low/medium/high: 4/8/12 voices":

| Quality   | Voices |
| --------- | ------ |
| `reduced` | 4      |
| `low`     | 4      |
| `medium`  | 8      |
| `high`    | 12     |

`reduced` floors at the same cap as `low` rather than 0 — it reflects a
_rendering_ constraint, not the visitor's sound preference, so audio isn't
silently disabled by it.

Stealing order, verified by the test suite (not just claimed):

1. **A free slot**, if one exists — no stealing at all
   (`fills free slots before stealing anything`).
2. **The oldest quiet voice**, if any slot is quiet (past its attack
   transient / explicitly released) — verified by both
   `steals a quiet released voice before any loud (unreleased) voice` and
   `among several quiet voices, steals the oldest one`.
3. **The oldest voice overall**, if nothing is quiet —
   `steals the oldest voice overall when nothing is quiet`.
4. **Never exceeds capacity** — `acquiring never exceeds the configured
capacity` acquires 10 times against a capacity-3 pool and asserts
   `getActiveCount() === 3` throughout.

"Quiet" is driven by `MascotPluckVoicePool`: after `assign()`ing a slot's
live handle, it schedules `pool.release(id)` via `setTimeout` at roughly
`attackSeconds + gestureSafetyOffsetSeconds` (~10ms) later — modeling "past
the attack transient, now just decaying" for a percussive pluck that has no
sustain phase. `pool.free(id)` (fully vacating the slot) happens on the
`AudioBufferSourceNode`'s `ended` event, which also disconnects every node
in that pluck's chain.

`MascotPluckVoicePool.setQuality()` rebuilds the pool at the new capacity,
calling `stop()` on every currently-active voice via `pool.clear()` first —
quality downgrades never leave orphaned nodes playing past the new cap.

## Karplus-Strong buffer voice

`MascotPluckVoice.ts` reimplements the same technique as
`stringSynth.ts`'s `createKarplusStrongBuffer` (seeded noise burst for one
period, then `sample[i] = damping * 0.5 * (sample[i-period] + sample[i-period+1])`)
independently, as its own function (`renderKarplusStrongSamples`), producing
its own buffers, on its own `AudioContext`. The only thing shared is the
algorithm shape and `CHORDS` (frequencies) — no nodes, buffers, or context
are shared with the hero instrument.

Per-pass repo rule: `lib/mascot` never calls `Math.random()`. Noise
excitation uses `SeededRandom` (mulberry32) with a fixed seed (1337),
verified deterministic by
`renderKarplusStrongSamples is deterministic for a given seed`. A fixed
seed means the timbre doesn't vary pluck-to-pluck the way true randomness
would — acceptable here since per-note textural variety isn't a design
goal for a short decaying pluck, and buffer caching means most plucks reuse
an already-rendered buffer anyway.

Buffers are cached by rounded frequency (`Math.round(frequency * 100)`,
matching `stringSynth.ts`'s key scheme) in a `Map` bounded by
`bufferCacheMaxSize: 24` via `evictOldestIfAtCapacity()` (FIFO eviction,
pure and unit-tested independent of real `AudioBuffer`s). `CHORDS` has 17
distinct frequencies across its four chords (24 entries, 7 duplicated notes
shared between chords), so the cache never
actually needs to evict in the current default-mapping usage — the cap
exists as a hard ceiling in case a future harmony layer introduces more
pitches (spec: "do not render hundreds of buffers").

All inputs are clamped before use: `clampFrequency` (40-2000 Hz),
`clampPan` (±0.75, matching `stringSynth.ts`'s hard-panning limit), and
`perceptualIntensity` — a concave `Math.pow(clamp(x, 0, 1), 0.6)` curve
floored at `minAudibleIntensity` (0.12), per the spec's explicit "do not
map speed linearly to raw gain."

## Default note mapping (placeholder, not the harmony layer)

`DefaultNoteMapping.ts`'s `resolveDefaultMusicalEvent()` is what
`MascotEngine.triggerStringPluck()` calls today. It is deliberately dumb:
it reads `CHORDS[0]` (C major) read-only, clamps `stringIndex` into range,
and maps `contactPosition` to pan/brightness and `contactType` to a
plausible `articulation`. It does **not** do scale quantization,
repetition control, strum recognition, or track whichever chord the
visitor is actually playing by hand — that is explicitly `HarmonyMap` /
`NoteQuantizer` / `MusicalDirector`'s job, none of which exist yet.
`MascotEngine.triggerStringPluck()`'s signature is the stable integration
point; replacing this file's logic once those land should not require
touching `MascotEngine.ts`.

## Fallback when Web Audio is unavailable

`AudioDirector.isSupported()` checks for `window.AudioContext` /
`window.webkitAudioContext`; `activate()` never throws. If no constructor
exists (or `new AudioContext()` itself throws), `AudioDirector` marks
itself `unsupported` and every subsequent `activate()` resolves immediately
as a no-op, leaving `isActive()` false forever. `MascotPluckVoicePool.play()`
checks `getContext()`/`isActive()` and no-ops silently. Nothing downstream
throws, retries, or logs to the console repeatedly — the mascot's visuals,
`StringInstrument.tsx`'s own instrument, and Strumrise (once built) all
stay fully functional, just silent. Verified by
`tests/mascot/music/AudioDirector.test.ts`, which runs under plain Node —
an environment with no `window`/`AudioContext` at all — as a genuine
exercise of this fallback path, not a mock.

## Output protection and mute

- One `DynamicsCompressorNode` per `AudioContext`, conservative settings
  (`MASCOT_CONFIG.audio.compressor`: threshold -20dB, knee 24, ratio 4,
  5ms attack, 250ms release) — evens out simultaneous voices rather than
  letting them sum and clip.
- One `masterGain` after the compressor, defaulting to 0.5
  (`masterVolumeDefault`), settable via `MascotEngine.setMasterVolume()`
  (clamped to [0, 1]).
- Mute (`setMuted`) and volume changes ramp via `setTargetAtTime` over
  `masterVolumeSmoothingSeconds` (20ms) instead of snapping the gain value
  directly, to avoid audible clicks.
- Panning is clamped to ±0.75, matching the hero instrument's own limit —
  never full hard-left/right.

## Lifecycle

- **Hidden tab**: `AudioDirector` reuses `MascotEngine`'s existing
  `VisibilityController` instance (constructor-injected) instead of
  registering a second `document.visibilitychange` listener. On hidden, if
  the context is `running` it calls `context.suspend()`; on visible again,
  if it was suspended _by this mechanism_ (`suspendedByVisibility`, not by
  the user never having activated it), it resumes. Verified by
  `reuses a caller-supplied VisibilityController instead of registering a
second listener, and does not detach it on destroy`.
- **`MascotEngine.setQuality()`**: propagates to both
  `audioDirector.setQuality()` (rebuilds `EffectsBus` enable state) and
  `pluckVoices.setQuality()` (rebuilds the voice pool at the new capacity,
  stopping anything beyond it).
- **`MascotEngine.destroy()`**: calls `pluckVoices.destroy()` (clears
  pending release timers, force-stops and frees every active voice, drops
  the buffer cache) then `audioDirector.destroy()` (unsubscribes its
  visibility listener, tears down `EffectsBus`, disconnects the graph, and
  `context.close()`s) before detaching the shared `VisibilityController`.
  `AudioDirector.destroy()` is idempotent and safe even if `activate()`
  was never called.

## AudioWorklet: deferred, gate not met

The spec's AUDIO PROTOTYPE LADDER gates "Prototype 3: AudioWorklet physical
model" on prototypes 1/2 first proving the interaction is fun through real
listening review. No browser listening session is available in this
environment (per the audio-dsp-engineer agent's own constraints), so that
gate cannot be evaluated this pass. Per the task's explicit scope: **no
`AudioWorklet` code, and no `public/audio-worklets/karplus-strong-processor.js`,
were written.** This pass stops at Prototype 2 (pre-rendered procedural
pluck buffers), which is what `MascotPluckVoicePool` implements. Building
the worklet path remains upgrade-spec Phase 7, blocked on a real listening
approval this environment cannot provide.

## Deferred / integration points for the not-yet-built string-contact layer

This pass does not build `StringRegistry`, `StringContactDetector`,
`HarmonyMap`, `NoteQuantizer`, or `MusicalDirector`. What's ready for that
workstream to call:

- `MascotEngine.triggerStringPluck(event: StringPluckEvent): void` — feed a
  physical contact event in; it's mapped (today, via the placeholder
  `resolveDefaultMusicalEvent`) and played.
- `MascotPluckVoicePool.play({ frequency, intensity, pan }): void` — the
  lower-level entry point, for a future `MusicalDirector` that wants to
  supply its own fully-resolved note instead of going through the
  placeholder mapping.
- `AudioScheduler.enqueue(note)` — ready for strum/phrase sequencing; no
  caller uses it yet.
- `AudioDirector.getEffectsSend()` — a wet-effects send input, built and
  wired into the graph but not yet consumed by any voice; intentionally
  left for a future multi-note ambience/reverb use case rather than guessed
  at now.
- `lib/mascot/types.ts`'s `StringPluckEvent` / `MusicalEvent` interfaces —
  the shared shapes both sides of that future boundary should use.

## Test coverage

`tests/mascot/music/` (53 tests, all passing alongside the 131 pre-existing
mascot tests — 184 total): `VoicePool.test.ts` (10), `AudioScheduler.test.ts`
(7), `MascotPluckVoice.test.ts` (14 — pure math: clamps, perceptual curve,
buffer rendering determinism/finiteness/decay, cache eviction),
`AudioGestureGate.test.ts` (5), `EffectsBus.test.ts` (2), `AudioDirector.test.ts`
(8 — the genuinely-unsupported-in-Node fallback path), `DefaultNoteMapping.test.ts`
(7). Per this repo's testing constraint, none of these construct a real
`AudioContext`; anything that needs one (the actual node graph inside
`MascotPluckVoicePool.play()`, `EffectsBus`'s node wiring) is exercised only
through its extracted pure helpers and left for manual/browser verification
later.

Run with `npm run test:mascot` (now globs both `tests/mascot/*.test.ts` and
`tests/mascot/music/*.test.ts`) or directly:

```bash
npx tsc --noEmit -p tsconfig.json
npx tsx --test tests/mascot/*.test.ts tests/mascot/music/*.test.ts
npx prettier --check lib/mascot/music components/mascot/MascotSoundControl.tsx
```
