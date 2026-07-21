"use client";

import StringInstrument from "./StringInstrument";

type LegacyStringProps = {
  volume?: number;
  playbackRate?: number;
};

// Compatibility entry point for the old testing page. The former sampled
// rubber-band component has been replaced by the responsive synthesized
// instrument, so these historical sound props no longer alter playback.
export default function String(_props: LegacyStringProps) {
  return <StringInstrument />;
}
