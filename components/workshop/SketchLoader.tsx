"use client";

import { useState, type ComponentType } from "react";
import styles from "./Workshop.module.css";

export default function SketchLoader() {
  const [Sketch, setSketch] = useState<ComponentType | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  async function start() {
    setStatus("loading");
    try {
      const module = await import("./WorkingSketch");
      setSketch(() => module.default);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }
  if (Sketch) return <Sketch />;
  return (
    <div className={styles.sketchPreview}>
      <div className={styles.previewTree} aria-hidden="true">
        <span>Workshop</span>
        <div>
          <span>Prototype</span>
          <span>Share the work</span>
        </div>
        <i>Build enclosure · Wire sensor · Documentation</i>
      </div>
      <p>
        Move “Wire sensor” out of “Prototype”. Its parent becomes “Workshop”;
        Undo brings it back. The task list and relationship view stay in
        agreement.
      </p>
      <button
        className={styles.lightButton}
        type="button"
        onClick={start}
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Opening the sketch…"
          : status === "error"
            ? "Try loading again ↗"
            : "Try the working sketch ↗"}
      </button>
      <p className={styles.micro} role="status">
        {status === "error"
          ? "The sketch could not load. The explanation above remains available."
          : "Keyboard & touch friendly · No sound"}
      </p>
    </div>
  );
}
