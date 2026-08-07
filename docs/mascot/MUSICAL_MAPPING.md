# Musical Mapping

## String notes (homepage)

The homepage guitar strings are a real, pre-existing six-string instrument
(`components/IntrectiveComponents/StringInstrument.tsx` +
`stringSynth.ts`), not a placeholder — see `docs/mascot/UPGRADE_STATUS.md`
for the full baseline finding. **Guitar mode is the default and only mode
wired up this pass**: `lib/mascot/music/HarmonyMap.ts`'s
`resolveGuitarModeNote(chordIndex, stringIndex)` reads directly from
`stringSynth.ts`'s exported `CHORDS` table (4 chords: C major, A minor, F
major, G major; 6 notes each), so a mascot-triggered pluck is always in
tune with whatever chord the visitor is currently playing by hand. No
separate mascot tuning system exists for the homepage strings.

## Contact mapping

`lib/mascot/music/StringContactDetector.ts` produces a `StringPluckEvent`
(`lib/mascot/types.ts`) per swept crossing:

- **core** (`MascotRuntime.pose.getRoot()`) — the primary contact type.
- **tail** (last spine joint) — a softer, trailing articulation.
- **fin** (antennae tips, `antennaeLeft`/`antennaeRight`) — a lighter,
  higher-frequency articulation, closer to the spec's "harmonic ping."

`contactPosition` (0..1 along the string) and `velocity` (a perceptually
curved 0..1 intensity, `Math.pow(clamp(speed / reference, 0, 1), 0.6)` —
never raw px/s) are computed per contact. A per-(contact-point, string)
cooldown (`MASCOT_CONFIG.strings.cooldownSeconds`, 0.18s) prevents a
resting overlap from retriggering every frame; `minContactSpeed` (220px/s)
filters out slow drags so only a genuine crossing counts.

**How the contact actually becomes sound**: `MascotRuntime` calls
`StringRegistry.triggerContact(stringIndex, intensity, normalizedX,
direction)`, which dispatches a `mascot:string-contact` `CustomEvent`
directly on the real `<path>` DOM element for that string.
`StringInstrument.tsx` listens for this event on each of its own paths and
calls its existing, already-working `strumString()` — the exact same
function a real pointer-driven strum uses. This means a mascot contact
gets real visual bend _and_ real Karplus-Strong audio with **zero
duplication** of the existing instrument's synthesis, and _without_
needing the separate `lib/mascot/music/AudioDirector`-based pluck voice at
all for this specific integration path. That system exists as a
forward-looking building block (see `docs/mascot/AUDIO_ARCHITECTURE.md`)
for contexts with no literal DOM string to delegate to — chiefly
Strumrise's platforms.

## Strum recognition

`lib/mascot/music/MusicalDirector.ts` groups pluck events into a strum:
3+ **distinct** strings crossed within a 0.5s window
(`strumWindowSeconds`), all with the same `direction`. A recognized strum
consumes its events (doesn't double-count into the next one) and the
director tracks a decaying combo count (resets after 2s of silence,
`comboResetSeconds`). This is intentionally DSP-free — it's a pure
event-grouping layer that a visual (glow/expression) or scoring consumer
can read from `MascotRuntime.lastStrum` / `.musicalCombo` each frame.

## Chord completion

Not implemented this pass — `MascotRuntime.stringPluckEvents` +
`lastStrum` are the building blocks; detecting "all N strings of the
currently-selected chord were touched" is a small addition on top once
there's a consumer (expression reaction, combo visual) to wire it to.
Documented as deferred rather than built without a visible effect.

## Portfolio harmony mode (game-only)

`HarmonyMap.ts` also exports `PENTATONIC_DEGREES` (minor pentatonic:
0,3,5,7,10 semitones), `midiToFrequency`, and `resolvePortfolioModeNote` —
for Strumrise, where platforms are generated game entities with no literal
guitar string to delegate to. `NoteQuantizer.ts`'s `quantizeToScale` snaps
an arbitrary requested note to the nearest scale degree, octave-preserving,
so a player skipping notes never produces an off-key result. Neither is
wired into gameplay yet — see the Strumrise workstream's own status.

## Section harmony

Not implemented this pass (explicitly optional per the spec). Each
section owning a harmonic colour would layer on top of guitar mode via
`setChordFromX`-style zone mapping already present in
`StringInstrument.tsx`; not touched, since that component is intentionally
left unmodified beyond the additive contact-listener change.

## Game sectors / combo layers / accessibility

Deferred to the Strumrise design doc (`docs/mascot/STRUMRISE_DESIGN.md`)
— this document covers the homepage musical mapping only, which is fully
functional independent of game status.
