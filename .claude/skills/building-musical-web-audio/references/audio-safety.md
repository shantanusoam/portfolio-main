# Audio safety

- audio is opt-in
- mute remains visible
- volume defaults conservatively
- cap simultaneous voices
- use a master gain
- use conservative compression
- avoid extreme stereo panning
- suspend or silence inactive contexts (hidden tab)
- test headphones and mobile speakers when a real browser session is
  available; when it isn't, say so rather than claiming it was tested
- never treat raw velocity as raw gain — use a perceptual curve
  (`Math.pow(clamp(speed / reference, 0, 1), 0.6)` or similar)
