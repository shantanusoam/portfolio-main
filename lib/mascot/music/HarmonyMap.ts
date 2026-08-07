import { CHORDS } from "@/components/IntrectiveComponents/stringSynth";

/**
 * Two harmony modes, per the upgrade spec:
 *
 * "Guitar mode" is the default for the homepage — the hero strings are
 * already a real six-string instrument (`stringSynth.ts`'s `CHORDS`), so
 * this mode is a thin, read-only lookup into that existing table rather
 * than a parallel tuning system. Reusing it guarantees the mascot's
 * contact-triggered notes are always in tune with whatever chord the
 * visitor is currently playing by hand.
 *
 * "Portfolio harmony mode" is for contexts with no literal string mapping
 * (Strumrise platforms) — a robust pentatonic scale so skipped notes never
 * sound wrong (spec: "Use a pentatonic or similarly robust scale for the
 * first prototype").
 */

export interface NoteIdentity {
  name: string;
  frequency: number;
}

export type HarmonyMode = "guitar" | "portfolio";

export function resolveGuitarModeNote(
  chordIndex: number,
  stringIndex: number,
): NoteIdentity | null {
  const chord = CHORDS[chordIndex];
  if (!chord) return null;
  const entry = chord.strings[stringIndex];
  if (!entry) return null;
  const [name, frequency] = entry;
  return { name, frequency };
}

export function guitarModeStringCount(chordIndex: number): number {
  return CHORDS[chordIndex]?.strings.length ?? 0;
}

/** Semitone offsets from the root — a minor pentatonic, robust under skipped notes. */
export const PENTATONIC_DEGREES = [0, 3, 5, 7, 10] as const;

export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function resolvePortfolioModeNote(
  rootMidi: number,
  degreeIndex: number,
  octaveOffset = 0,
): NoteIdentity {
  const length = PENTATONIC_DEGREES.length;
  const wrapped = ((degreeIndex % length) + length) % length;
  const degree = PENTATONIC_DEGREES[wrapped];
  const midi = rootMidi + degree + octaveOffset * 12;
  return { name: `midi-${midi}`, frequency: midiToFrequency(midi) };
}
