---
name: building-musical-web-audio
description: Builds opt-in, precisely scheduled, performance-conscious Web Audio systems for interactive strings, procedural plucks, musical quantization, voice pooling, effects, and game music. Use when adding sound activation, AudioContext lifecycle, string notes, AudioWorklet synthesis, audio scheduling, musical harmony, mute controls, or audio performance tests.
---

# Workflow

1. Verify user-gesture activation — never create/resume an `AudioContext`
   outside a click/tap/key handler.
2. Separate physical contact events (`StringPluckEvent`) from musical
   events (`MusicalEvent`) and DSP — the contact detector must not know
   about oscillators, and the voice must not know about the mascot rig.
3. Prototype with built-in nodes before custom worklets.
4. Schedule against `audioContext.currentTime`, never
   `performance.now()`/`Date.now()`.
5. Use bounded look-ahead for sequences (strums, phrases).
6. Cap voices and recycle or disconnect completed nodes — steal quiet
   voices first, then oldest.
7. Protect output with conservative gain and compression (one master
   `DynamicsCompressorNode` + master `GainNode`, per this repo's existing
   `components/IntrectiveComponents/stringSynth.ts` which already does
   this well for the hand-played strings — match that level of care).
8. Provide mute and a graceful fallback if `AudioContext`/`AudioWorklet`
   is unsupported or fails.
9. Suspend hidden or inactive audio (tab visibility).
10. Test production worklet paths if a worklet is ever added.
11. Run muted and unsupported-audio scenarios.
12. Document the graph and measured voice counts in
    `docs/mascot/AUDIO_ARCHITECTURE.md`.

# This repo's existing string audio (read before writing anything new)

`components/IntrectiveComponents/stringSynth.ts` already implements a
working Karplus-Strong-style pre-rendered `AudioBuffer` pluck voice for the
hand-played hero strings (`createKarplusStrongBuffer` + exported
`playPhysicalString`), with its own lowpass envelope, gain envelope, and
stereo pan, cleaned up on the buffer source's `ended` event. **Do not
modify this file** — it is a tuned, already-shipped interaction. Read
`CHORDS`'s frequency table from it for note identity so mascot-triggered
notes stay in tune with the hand-played instrument, but give the mascot
its own independently-owned voice/graph connected to its own master bus.

# Invariants

- No audible autoplay.
- No visual-clock musical scheduling.
- No unbounded polyphony.
- No allocation inside worklet processing loops (if a worklet is ever
  added).
- No audio dependency for core gameplay — Strumrise must stay fully
  playable muted.
- No missing mute control.
- Worklet failure (if ever added) falls back safely.

Read `references/audio-graph.md`, `references/scheduling.md`,
`references/plucked-string.md`, and `references/audio-safety.md` before
building the graph.
