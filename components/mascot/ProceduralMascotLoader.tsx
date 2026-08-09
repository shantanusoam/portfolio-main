"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type {
  MascotEcosystemStatus,
  MascotEngine,
  MascotQuality,
} from "@/lib/mascot/types";
import {
  MASCOT_ECOSYSTEM_COMMAND_EVENT,
  MASCOT_ECOSYSTEM_STATUS_EVENT,
  type EcosystemCommandDetail,
  type EcosystemStatusEventDetail,
} from "@/lib/mascot/ecosystem/events";
import MascotSoundControl from "./MascotSoundControl";
// StrumriseGate kept on disk for reference; V2 primary entry is Enter Resonance.
import EnterResonanceControl from "@/components/resonance-weaver/EnterResonanceControl";
import styles from "./Mascot.module.css";

const ProceduralMascotCanvas = dynamic(
  () => import("./ProceduralMascotCanvas"),
  {
    ssr: false,
    loading: () => null,
  },
);

const DISABLE_STORAGE_KEY = "mascot:disabled";

function readStoredDisabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISABLE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export interface ProceduralMascotLoaderProps {
  quality?: MascotQuality;
}

/**
 * Production entry point. Delays mounting the mascot engine until browser
 * idle time so it never competes with initial hydration/paint, and honors
 * a simple opt-out (see docs/mascot/FINAL_REPORT.md, "How to disable the
 * mascot"). The `dynamic(..., { ssr: false })` import is declared inside
 * this Client Component per spec.
 */
export default function ProceduralMascotLoader({
  quality = "medium",
}: ProceduralMascotLoaderProps) {
  const [ready, setReady] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [engine, setEngine] = useState<MascotEngine | null>(null);

  const broadcastEcosystemStatus = useCallback(
    (status: MascotEcosystemStatus | null) => {
      const detail: EcosystemStatusEventDetail = status
        ? { ...status, ready: true }
        : {
            ready: false,
            population: 1,
            activeFry: false,
            growthStage: 0,
            mealsToNextFission: 3,
            fissionPhase: null,
            capped: false,
            canReleaseFry: false,
          };
      window.dispatchEvent(
        new CustomEvent(MASCOT_ECOSYSTEM_STATUS_EVENT, { detail }),
      );
    },
    [],
  );

  useEffect(() => {
    setDisabled(readStoredDisabled());

    const win = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(() => setReady(true));
    } else {
      timeoutHandle = setTimeout(() => setReady(true), 400);
    }

    return () => {
      if (idleHandle !== undefined) win.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, []);

  useEffect(() => {
    if (!engine) {
      broadcastEcosystemStatus(null);
      return undefined;
    }

    const handleCommand = (event: Event) => {
      const detail = (event as CustomEvent<EcosystemCommandDetail>).detail;
      if (!detail) return;
      if (detail.intent === "call") {
        engine.trigger({ type: "callFish" });
      } else {
        engine.trigger({ type: "releaseFry", x: detail.x, y: detail.y });
      }
    };
    window.addEventListener(MASCOT_ECOSYSTEM_COMMAND_EVENT, handleCommand);
    broadcastEcosystemStatus(engine.getEcosystemStatus());
    return () => {
      window.removeEventListener(MASCOT_ECOSYSTEM_COMMAND_EVENT, handleCommand);
    };
  }, [broadcastEcosystemStatus, engine]);

  if (!ready || disabled) return null;

  return (
    <>
      <ProceduralMascotCanvas
        quality={quality}
        onEngineReady={setEngine}
        onEcosystemStatus={broadcastEcosystemStatus}
      />
      <div className={styles.soundControlFixed}>
        <MascotSoundControl engine={engine} />
      </div>
      <EnterResonanceControl engine={engine} quality={quality} />
    </>
  );
}
