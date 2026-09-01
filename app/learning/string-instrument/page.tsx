import type { Metadata } from "next";
import StringInstrumentCourse from "./StringInstrumentCourse";

export const metadata: Metadata = {
  title: "Browser Guitar & Web Audio Effects — Noob to Pro",
  description:
    "A hands-on Canvas and Web Audio course with 33 code steps, playable strings, Karplus–Strong synthesis, chords, drive, delay, reverb, presets, accessibility, and production-safe cleanup.",
};

export default function StringInstrumentCoursePage() {
  return <StringInstrumentCourse />;
}
