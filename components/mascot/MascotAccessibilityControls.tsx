"use client";

import type { ChangeEvent } from "react";
import type { MascotQuality } from "@/lib/mascot/types";
import styles from "./Mascot.module.css";

export interface MascotAccessibilityControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  reducedMotion: boolean;
  onReducedMotionChange: (reduced: boolean) => void;
  quality: MascotQuality;
  onQualityChange: (quality: MascotQuality) => void;
}

const QUALITY_OPTIONS: MascotQuality[] = ["reduced", "low", "medium", "high"];

export default function MascotAccessibilityControls({
  enabled,
  onEnabledChange,
  reducedMotion,
  onReducedMotionChange,
  quality,
  onQualityChange,
}: MascotAccessibilityControlsProps) {
  return (
    <div
      className={styles.accessibilityControls}
      role="group"
      aria-label="Mascot accessibility controls"
    >
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onEnabledChange(event.target.checked)
          }
        />
        Mascot enabled
      </label>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onReducedMotionChange(event.target.checked)
          }
        />
        Reduced motion override
      </label>
      <label className={styles.toggle}>
        Quality
        <select
          className={styles.debugSelect}
          value={quality}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onQualityChange(event.target.value as MascotQuality)
          }
        >
          {QUALITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
