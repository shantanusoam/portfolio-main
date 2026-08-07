/**
 * Snaps an arbitrary requested MIDI note to the nearest note in `scale`
 * (semitone offsets from `root`, e.g. `PENTATONIC_DEGREES`), preserving
 * octave. Used for "portfolio harmony mode" contexts where the physical
 * position isn't already a real guitar note.
 */
export function quantizeToScale(
  requestedMidi: number,
  scale: readonly number[],
  root: number,
): number {
  if (scale.length === 0 || !Number.isFinite(requestedMidi))
    return requestedMidi;

  const relative = requestedMidi - root;
  const octave = Math.floor(relative / 12);
  const withinOctave = relative - octave * 12;

  let closestDegree = scale[0];
  let closestDistance = Math.abs(withinOctave - scale[0]);
  for (const degree of scale) {
    const distance = Math.abs(withinOctave - degree);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestDegree = degree;
    }
  }

  return root + octave * 12 + closestDegree;
}
