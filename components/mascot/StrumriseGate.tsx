"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type {
  MascotEngine as MascotEngineContract,
  MascotQuality,
} from "@/lib/mascot/types";
import styles from "./StrumriseGate.module.css";

const StrumriseOverlay = dynamic(
  () => import("@/components/strumrise/StrumriseOverlay"),
  {
    ssr: false,
    loading: () => null,
  },
);

export interface StrumriseGateProps {
  engine: MascotEngineContract | null;
  quality: MascotQuality;
}

function readReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Deliberate, accessible drop-to-game transition — spec Phase 8, "small
 * explicit version" per this upgrade's documented smaller-MVP scope (see
 * docs/mascot/STRUMRISE_DESIGN.md): a short tumble/fade on the launch
 * button itself rather than a fully simulated fall-through-the-strings
 * cascade. Pauses the homepage mascot engine and locks the launch click as
 * the one real user gesture that activates Strumrise's own gesture-gated
 * audio (see StrumriseOverlay's `setSoundEnabled` call).
 */
export default function StrumriseGate({ engine, quality }: StrumriseGateProps) {
  const [active, setActive] = useState(false);
  const [entering, setEntering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(readReducedMotion());
  }, []);

  const launch = () => {
    if (active || entering) return;
    engine?.pause("strumrise");

    if (reducedMotion) {
      setActive(true);
      return;
    }

    setEntering(true);
    window.setTimeout(() => {
      setEntering(false);
      setActive(true);
    }, 650);
  };

  const handleExit = () => {
    setActive(false);
    engine?.resume();
  };

  return (
    <>
      <button
        type="button"
        className={styles.launchButton}
        data-entering={entering}
        onClick={launch}
        disabled={!engine || active || entering}
        aria-label="Play Strumrise, a musical ascent game"
      >
        Play Strumrise
      </button>
      {active && (
        <StrumriseOverlay
          engine={engine}
          quality={quality}
          reducedMotion={reducedMotion}
          onExit={handleExit}
        />
      )}
    </>
  );
}
