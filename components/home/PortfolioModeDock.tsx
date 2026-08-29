"use client";

import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const chooseMode = (next: PortfolioViewMode) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div
      ref={dockRef}
      className={styles.dock}
      data-open={open}
      data-mascot-obstacle="hard"
    >
      <button
        type="button"
        className={styles.trigger}
        aria-label={`${open ? "Close" : "Open"} view mode controls. ${active.label} mode is active.`}
        aria-expanded={open}
        aria-controls="portfolio-view-mode-panel"
        onClick={() => setOpen((current) => !current)}
        title={`View mode: ${active.label}`}
      >
        <span className={styles.modeGlyph} data-mode={mode} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className={styles.signal} data-active={mode === "explore"} />
      </button>

      <aside
        id="portfolio-view-mode-panel"
        className={styles.panel}
        aria-label="Portfolio experience mode"
        aria-hidden={!open}
      >
        <div className={styles.header}>
          <span className={styles.signal} data-active={mode === "explore"} />
          <span>View mode</span>
          <span className={styles.activeLabel}>{active.label}</span>
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
              onClick={() => chooseMode(item.id)}
              tabIndex={open ? 0 : -1}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className={styles.detail} aria-live="polite">
          {active.detail}
        </p>
      </aside>
    </div>
  );
}
