"use client";

import type { AscentGameState } from "@/lib/mascot/game/GameTypes";
import type { StrumriseSnapshot } from "@/lib/mascot/game/StrumriseRuntime";
import styles from "./Strumrise.module.css";

export interface StrumriseMenuProps {
  state: AscentGameState;
  snapshot: StrumriseSnapshot | null;
  onStart: () => void;
  onResume: () => void;
  onRetry: () => void;
  onExit: () => void;
}

/** Ready/paused/gameOver/sectorComplete/victory menu screens — spec's "GAME OVER AND RETURN": no long restart delay, always an obvious exit. */
export default function StrumriseMenu({
  state,
  snapshot,
  onStart,
  onResume,
  onRetry,
  onExit,
}: StrumriseMenuProps) {
  if (
    state === "playing" ||
    state === "transitioningIn" ||
    state === "fallingOut"
  ) {
    return null;
  }

  const score = snapshot?.score ?? 0;
  const bestScore = snapshot?.bestScore ?? 0;

  let title = "Strumrise";
  let subtitle = "Bounce up the strings. Land notes. Keep the combo alive.";
  let primaryLabel = "Start";
  let primaryAction = onStart;

  if (state === "paused") {
    title = "Paused";
    subtitle = `Score ${score}`;
    primaryLabel = "Resume";
    primaryAction = onResume;
  } else if (state === "gameOver") {
    title = "Missed the beat";
    subtitle = `Score ${score} · Best ${bestScore}`;
    primaryLabel = "Retry";
    primaryAction = onRetry;
  } else if (state === "sectorComplete" || state === "victory") {
    title = "Sector complete!";
    subtitle = `Score ${score} · Best ${bestScore}`;
    primaryLabel = "Play again";
    primaryAction = onRetry;
  }

  return (
    <div className={styles.menuLayer}>
      <div className={styles.menuCard}>
        <div className={styles.menuTitle}>{title}</div>
        <div className={styles.menuSubtitle}>{subtitle}</div>
        <div className={styles.menuButtons}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={primaryAction}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className={`${styles.menuButton} ${styles.menuButtonSecondary}`}
            onClick={onExit}
          >
            Exit to portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
