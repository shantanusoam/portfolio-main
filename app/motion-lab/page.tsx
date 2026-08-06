"use client";

import { useEffect, useState } from "react";
import ProceduralMascotCanvas from "@/components/mascot/ProceduralMascotCanvas";
import MascotAccessibilityControls from "@/components/mascot/MascotAccessibilityControls";
import MascotDebugPanel from "@/components/mascot/MascotDebugPanel";
import { playScenario } from "@/lib/mascot/debug/DeterministicScenarios";
import type {
  MascotEngine,
  MascotQuality,
  ScenarioName,
} from "@/lib/mascot/types";
import styles from "./page.module.css";

/**
 * Isolated motion lab: validates the mascot engine end to end (Canvas
 * lifecycle, pointer/DPR/resize, DOM obstacle steering, behavior states)
 * away from the production layout. Registers window.__MASCOT_DEBUG__ in
 * development only — never shipped to production, per spec.
 */
export default function MotionLabPage() {
  const [engine, setEngine] = useState<MascotEngine | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [quality, setQuality] = useState<MascotQuality>("medium");
  const [debugOverlay, setDebugOverlay] = useState(true);

  useEffect(() => {
    if (!engine || process.env.NODE_ENV === "production") return undefined;

    const win = window as Window & {
      __MASCOT_DEBUG__?: {
        playScenario: (name: ScenarioName) => void;
        pause: () => void;
        resume: () => void;
        snapshot: () => ReturnType<MascotEngine["getDebugSnapshot"]>;
        setQuality: (next: MascotQuality) => void;
        reset: () => void;
      };
    };

    win.__MASCOT_DEBUG__ = {
      playScenario: (name) =>
        playScenario(name, engine, 0, window.innerWidth, window.innerHeight),
      pause: () => engine.pause("window-debug"),
      resume: () => engine.resume(),
      snapshot: () => engine.getDebugSnapshot(),
      setQuality: (next) => engine.setQuality(next),
      reset: () => engine.trigger({ type: "reform" }),
    };

    return () => {
      delete win.__MASCOT_DEBUG__;
    };
  }, [engine]);

  return (
    <div className={styles.page}>
      <ProceduralMascotCanvas
        quality={quality}
        reducedMotion={reducedMotion}
        enabled={enabled}
        debug={debugOverlay}
        onEngineReady={setEngine}
      />

      <div className={styles.hud}>
        <div className={styles.title}>Mascot motion lab</div>
        <MascotAccessibilityControls
          enabled={enabled}
          onEnabledChange={setEnabled}
          reducedMotion={reducedMotion}
          onReducedMotionChange={setReducedMotion}
          quality={quality}
          onQualityChange={setQuality}
        />
      </div>

      <MascotDebugPanel
        engine={engine}
        debugOverlay={debugOverlay}
        onDebugOverlayChange={setDebugOverlay}
      />

      <nav className={styles.navMock} data-mascot-obstacle="hard">
        <button type="button" className={styles.navButton}>
          Nav item
        </button>
        <button type="button" className={styles.navButton}>
          Contact
        </button>
      </nav>

      <div className={styles.playfield}>
        <div className={styles.row}>
          <div
            className={`${styles.card} ${styles.hardBox}`}
            data-mascot-obstacle="hard"
          >
            hard obstacle
          </div>
          <div
            className={`${styles.card} ${styles.softBox}`}
            data-mascot-obstacle="soft"
          >
            soft obstacle
          </div>
          <div
            className={`${styles.card} ${styles.interestBox}`}
            data-mascot-interest="project"
          >
            interest target A
          </div>
        </div>
        <div className={styles.row}>
          <div
            className={`${styles.card} ${styles.interestBox}`}
            data-mascot-interest="project"
          >
            interest target B
          </div>
          <div
            className={`${styles.card} ${styles.hardBox}`}
            data-mascot-obstacle="hard"
          >
            hard obstacle (button-like)
          </div>
          <div
            className={`${styles.card} ${styles.softBox}`}
            data-mascot-obstacle="soft"
          >
            soft obstacle (decorative card)
          </div>
        </div>
        <div className={styles.row}>
          <div
            className={`${styles.card} ${styles.interestBox}`}
            data-mascot-interest="project"
          >
            interest target C
          </div>
          <div
            className={`${styles.card} ${styles.hardBox}`}
            data-mascot-obstacle="hard"
          >
            hard obstacle (corner test)
          </div>
        </div>
      </div>
    </div>
  );
}
