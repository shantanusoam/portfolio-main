"use client";

import { useEffect, useRef, useState } from "react";
import { formatDebugSnapshot } from "@/lib/mascot/debug/DebugSnapshot";
import {
  listScenarios,
  playScenario,
} from "@/lib/mascot/debug/DeterministicScenarios";
import type {
  MascotDebugSnapshot,
  MascotEngine as MascotEngineContract,
  ScenarioName,
} from "@/lib/mascot/types";
import styles from "./Mascot.module.css";

export interface MascotDebugPanelProps {
  engine: MascotEngineContract | null;
  debugOverlay: boolean;
  onDebugOverlayChange: (enabled: boolean) => void;
}

/**
 * Motion-lab-only control surface. Polls getDebugSnapshot() on a 500ms
 * interval (not per rAF frame) — the one place this subsystem is allowed to
 * drive React state, since it is explicitly low-frequency debug UI.
 */
export default function MascotDebugPanel({
  engine,
  debugOverlay,
  onDebugOverlayChange,
}: MascotDebugPanelProps) {
  const [snapshot, setSnapshot] = useState<MascotDebugSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [scenario, setScenario] = useState<ScenarioName>("follow-horizontal");
  const [scenarioPlaying, setScenarioPlaying] = useState(false);
  const scenarioStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!engine) return undefined;
    const interval = setInterval(
      () => setSnapshot(engine.getDebugSnapshot()),
      500,
    );
    return () => clearInterval(interval);
  }, [engine]);

  useEffect(() => {
    if (!scenarioPlaying || !engine) return undefined;
    scenarioStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - (scenarioStartRef.current ?? now)) / 1000;
      playScenario(
        scenario,
        engine,
        elapsed,
        window.innerWidth,
        window.innerHeight,
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [scenarioPlaying, scenario, engine]);

  if (!engine) return null;

  return (
    <div className={styles.debugPanel}>
      <div className={styles.debugRow}>
        <span className={styles.debugLabel}>status</span>
      </div>
      <div>{snapshot ? formatDebugSnapshot(snapshot) : "—"}</div>

      <div className={styles.debugButtons}>
        <button
          type="button"
          className={styles.debugButton}
          data-active={paused}
          onClick={() => {
            if (paused) engine.resume();
            else engine.pause("debug-panel");
            setPaused(!paused);
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          className={styles.debugButton}
          data-active={debugOverlay}
          onClick={() => onDebugOverlayChange(!debugOverlay)}
        >
          Debug overlay
        </button>
        <button
          type="button"
          className={styles.debugButton}
          onClick={() => engine.trigger({ type: "scatter" })}
        >
          Scatter
        </button>
        <button
          type="button"
          className={styles.debugButton}
          onClick={() => engine.trigger({ type: "reform" })}
        >
          Reform
        </button>
        <button
          type="button"
          className={styles.debugButton}
          onClick={() => engine.trigger({ type: "wake" })}
        >
          Wake
        </button>
        <button
          type="button"
          className={styles.debugButton}
          onClick={() => engine.trigger({ type: "rest" })}
        >
          Rest
        </button>
      </div>

      <div className={styles.debugRow}>
        <span className={styles.debugLabel}>slow motion</span>
        <input
          type="range"
          min={0.1}
          max={1.5}
          step={0.1}
          value={timeScale}
          onChange={(event) => {
            const value = Number(event.target.value);
            setTimeScale(value);
            engine.setTimeScale(value);
          }}
        />
        <span>{timeScale.toFixed(1)}x</span>
      </div>

      <div className={styles.debugRow}>
        <select
          className={styles.debugSelect}
          value={scenario}
          onChange={(event) => setScenario(event.target.value as ScenarioName)}
        >
          {listScenarios().map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.debugButton}
          data-active={scenarioPlaying}
          onClick={() => setScenarioPlaying((value) => !value)}
        >
          {scenarioPlaying ? "Stop scenario" : "Play scenario"}
        </button>
      </div>
    </div>
  );
}
