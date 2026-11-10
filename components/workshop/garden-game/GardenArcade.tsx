"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import styles from "./GardenArcade.module.css";
const Canopy = dynamic(() => import("./Canopy"), {
  ssr: false,
  loading: () => (
    <p className={styles.loading} role="status">
      Opening the garden…
    </p>
  ),
});
export default function GardenArcade() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <article
      id="canopy"
      className={styles.arcade}
      aria-labelledby="canopy-title"
    >
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>A small discovery</p>
          <h3 id="canopy-title">Turn a new leaf.</h3>
          <p>
            There’s a little garden tucked in here. Help a seedling find the
            light, one soft landing at a time.
          </p>
        </div>
        <button
          ref={trigger}
          data-canopy-launch
          type="button"
          className={styles.leafButton}
          aria-expanded={open}
          aria-controls="canopy-garden"
          aria-label={
            open ? "Close Canopy garden game" : "Open Canopy garden game"
          }
          onClick={() => (open ? close() : setOpen(true))}
        >
          <svg viewBox="0 0 90 90" fill="none" aria-hidden="true">
            <path
              d="M22 65C14 38 33 19 69 18c4 30-9 54-37 52"
              fill="currentColor"
              opacity=".9"
            />
            <path
              d="M20 77 61 29M37 59l-2-18M47 48l17-1"
              stroke="var(--paper, #102219)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>{open ? "Close garden" : "Find the garden"} →</span>
        </button>
      </div>
      <div id="canopy-garden">{open && <Canopy onClose={close} />}</div>
    </article>
  );
}
