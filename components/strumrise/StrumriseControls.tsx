"use client";

import styles from "./Strumrise.module.css";

export interface StrumriseControlsProps {
  onInputChange: (x: -1 | 0 | 1) => void;
}

/** Large left/right touch zones — spec's touch input: "left/right screen zones", "no accidental browser gestures in game area." */
export default function StrumriseControls({
  onInputChange,
}: StrumriseControlsProps) {
  return (
    <div className={styles.controls}>
      <div
        className={styles.controlZone}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          onInputChange(-1);
        }}
        onPointerUp={() => onInputChange(0)}
        onPointerCancel={() => onInputChange(0)}
        onPointerLeave={() => onInputChange(0)}
      />
      <div
        className={styles.controlZone}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          onInputChange(1);
        }}
        onPointerUp={() => onInputChange(0)}
        onPointerCancel={() => onInputChange(0)}
        onPointerLeave={() => onInputChange(0)}
      />
      <div className={styles.controlHint} aria-hidden="true">
        <span>◂ hold to steer ▸</span>
      </div>
    </div>
  );
}
