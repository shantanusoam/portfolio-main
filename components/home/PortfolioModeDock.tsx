"use client";

import type { PortfolioViewMode } from "@/lib/portfolio/viewMode";
import styles from "./PortfolioModeDock.module.css";

type PortfolioModeDockProps = {
  mode: PortfolioViewMode;
  onChange: (mode: PortfolioViewMode) => void;
};

const MODES: Array<{
  id: PortfolioViewMode;
  label: string;
  detail: string;
}> = [
  {
    id: "explore",
    label: "Explore",
    detail: "Living art, creature and discovery layers are available.",
  },
  {
    id: "focus",
    label: "Focus",
    detail: "A calmer review path with nonessential effects paused.",
  },
];

export default function PortfolioModeDock({
  mode,
  onChange,
}: PortfolioModeDockProps) {
  const active = MODES.find((item) => item.id === mode) ?? MODES[0];

  return (
    <aside
      className={styles.dock}
      aria-label="Portfolio experience mode"
      data-mascot-obstacle="hard"
    >
      <div className={styles.header}>
        <span className={styles.signal} data-active={mode === "explore"} />
        <span>View mode</span>
      </div>
      <div
        className={styles.switcher}
        role="group"
        aria-label="Choose view mode"
      >
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={mode === item.id}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className={styles.detail} aria-live="polite">
        {active.detail}
      </p>
    </aside>
  );
}
