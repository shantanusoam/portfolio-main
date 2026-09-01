import type { CSSProperties } from "react";
import { deterministicCoverSeed } from "@/lib/audio/metadata";
import type { SoundroomTrack } from "@/lib/audio/types";
import styles from "./Soundroom.module.css";

export default function SoundroomArtwork({
  track,
  compact = false,
}: {
  track: SoundroomTrack | null;
  compact?: boolean;
}) {
  const seed = track ? deterministicCoverSeed(track) : 9173;
  const artworkStyle = {
    "--soundroom-accent": track?.accent ?? "#ff6946",
    "--cover-turn": `${(seed % 31) - 15}deg`,
    "--cover-shift": `${16 + (seed % 58)}%`,
  } as CSSProperties;

  return (
    <div
      className={`${styles.artwork} ${compact ? styles.artworkCompact : ""}`}
      style={artworkStyle}
      aria-hidden="true"
    >
      {track?.artworkUrl ? (
        // Local object URLs never leave the visitor's browser.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artworkUrl} alt="" />
      ) : (
        <>
          <span className={styles.coverOrbit} />
          <span className={styles.coverGroove} />
          <span className={styles.coverNeedle} />
        </>
      )}
    </div>
  );
}
