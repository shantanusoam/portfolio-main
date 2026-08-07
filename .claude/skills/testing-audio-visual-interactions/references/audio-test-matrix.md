# Audio test matrix

- initial silent state
- explicit activation
- mute and unmute
- one pluck
- repeated overlap (must not retrigger every frame)
- fast crossing (must not miss a swept contact)
- multi-string strum
- chord event
- voice cap (steal oldest/quietest, never exceed the hard cap)
- hidden tab (suspends)
- worklet load failure (only relevant if a worklet is ever added)
- fallback voice
- production path (`npm run build` + serve, not just `next dev`)
- mobile speaker (manual, when a device/emulator is available)
