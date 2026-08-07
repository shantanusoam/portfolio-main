import { CHORDS } from "@/components/IntrectiveComponents/stringSynth";
import { clamp } from "../core/NumericGuards";
import type { MusicalEvent, StringPluckEvent } from "../types";
import { clampPan, perceptualIntensity } from "./MascotPluckVoice";

/**
 * Minimal, deliberately dumb default mapping from a physical
 * `StringPluckEvent` to a playable `MusicalEvent` — used only until the
 * harmony/quantization layer (`HarmonyMap`, `NoteQuantizer`,
 * `MusicalDirector`) lands. It does none of that layer's job: no scale
 * quantization, no repetition control, no strum recognition, no awareness
 * of whatever chord the visitor is currently playing by hand. It only reads
 * the shared `CHORDS` frequency table (read-only import — never modify
 * components/IntrectiveComponents/stringSynth.ts) so an out-of-the-box
 * mascot pluck is at least in tune with *a* real chord rather than an
 * arbitrary made-up frequency, and always resolves against `CHORDS[0]`
 * (C major) since nothing yet tracks the hand-played instrument's live
 * chord index.
 *
 * Replace this file's logic, not its signature, once `MusicalDirector`
 * exists — `MascotEngine.triggerStringPluck` only depends on
 * `resolveDefaultMusicalEvent`'s shape.
 */
export function resolveDefaultMusicalEvent(
  event: StringPluckEvent,
): MusicalEvent {
  const chord = CHORDS[0];
  const stringIndex = clamp(
    Math.round(event.stringIndex),
    0,
    chord.strings.length - 1,
  );
  const [, frequency] = chord.strings[stringIndex];

  const contactPosition = clamp(event.contactPosition, 0, 1);
  const pan = clampPan(contactPosition * 2 - 1);
  const brightness = clamp(0.3 + contactPosition * 0.7, 0, 1);
  const velocity = perceptualIntensity(event.velocity);
  const reverbSend = clamp(event.combo / 8, 0, 0.6);

  const articulation = mapArticulation(event.contactType);
  const damping = articulation === "muted" ? 0.75 : 0.45;

  return {
    midiNote: frequencyToMidi(frequency),
    frequency,
    velocity,
    brightness,
    damping,
    pan,
    reverbSend,
    articulation,
    scheduledTime: 0,
  };
}

function mapArticulation(
  contactType: StringPluckEvent["contactType"],
): MusicalEvent["articulation"] {
  switch (contactType) {
    case "tail":
    case "drag":
      return "muted";
    case "fin":
      return "harmonic";
    case "landing":
      return "bass";
    case "core":
    default:
      return "pluck";
  }
}

function frequencyToMidi(frequency: number): number {
  if (!Number.isFinite(frequency) || frequency <= 0) return 0;
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}
