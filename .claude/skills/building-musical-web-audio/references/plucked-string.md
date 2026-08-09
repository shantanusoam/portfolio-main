# Plucked-string synthesis

Prototype order:

1. oscillator/noise envelope
2. procedural `AudioBuffer` fallback (this repo's existing
   `stringSynth.ts` is already at this stage for the hand-played strings —
   match its approach for the mascot's own voice rather than starting from
   oscillators)
3. `AudioWorklet` Karplus-Strong-style voice — only after 1/2 are approved
   by real listening review

Clamp: frequency, delay length, feedback, damping, gain, lifetime.

Stop silent voices. Avoid allocation and logging in the audio render
thread (only relevant once a worklet exists).
