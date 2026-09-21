"use client";
import { useState } from "react";
import styles from "./Cinema.module.css";
const tools = [
  [
    "React",
    "State → component → interface",
    "Composing useful interfaces from predictable, reusable pieces.",
  ],
  [
    "TypeScript",
    "Input → contract → confidence",
    "Making data boundaries and state transitions explicit.",
  ],
  [
    "GSAP",
    "Scroll → timeline → scene",
    "Connecting movement to the pace of the story.",
  ],
  [
    "WebGL",
    "Texture → light → a little wonder",
    "A small shader turns a still image into an interactive surface.",
  ],
];
export default function Toolkit() {
  const [active, setActive] = useState(0);
  return (
    <div className={styles.toolkit}>
      <p>A well-loved toolkit</p>
      <div className={styles.toolButtons}>
        {tools.map(([name], i) => (
          <button
            type="button"
            key={name}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {name}
            <span>↗</span>
          </button>
        ))}
      </div>
      <div className={styles.toolOutput} aria-live="polite">
        <strong>{tools[active][1]}</strong>
        <p>{tools[active][2]}</p>
        <div key={active} className={styles.flow} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
