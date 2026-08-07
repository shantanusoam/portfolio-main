"use client";

import type { StrumriseSnapshot } from "@/lib/mascot/game/StrumriseRuntime";
import { STRUMRISE_CONFIG } from "@/lib/mascot/game/StrumriseConfig";
import styles from "./Strumrise.module.css";

export interface StrumriseHudProps {
  snapshot: StrumriseSnapshot;
  muted: boolean;
  onMuteToggle: () => void;
  onPause: () => void;
}

/** Compact top bar — spec's "GAME HUD": score, height/sector progress, combo, lives, mute, pause. Never covers platforms. */
export default function StrumriseHud({
  snapshot,
  muted,
  onMuteToggle,
  onPause,
}: StrumriseHudProps) {
  const progress = Math.min(
    100,
    Math.round(
      (snapshot.heightClimbed / STRUMRISE_CONFIG.sector.heightTarget) * 100,
    ),
  );

  return (
    <div className={styles.hud}>
      <div className={styles.hudGroup}>
        <div className={styles.hudStat}>
          <span className={styles.hudStatLabel}>Score</span>
          <span>{snapshot.score}</span>
        </div>
        <div className={styles.hudStat}>
          <span className={styles.hudStatLabel}>Combo</span>
          <span>x{snapshot.combo}</span>
        </div>
        <div className={styles.hudStat}>
          <span className={styles.hudStatLabel}>Height</span>
          <span>{progress}%</span>
        </div>
        <div
          className={styles.livesRow}
          aria-label={`${snapshot.lives} lives remaining`}
        >
          {Array.from({ length: STRUMRISE_CONFIG.lives.starting }).map(
            (_, i) => (
              <span
                key={i}
                className={styles.lifeDot}
                data-spent={i >= snapshot.lives}
              />
            ),
          )}
        </div>
      </div>
      <div className={styles.hudGroup}>
        <button
          type="button"
          className={styles.hudButton}
          onClick={onMuteToggle}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <button type="button" className={styles.hudButton} onClick={onPause}>
          Pause
        </button>
      </div>
    </div>
  );
}
