"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { MascotEngine, MascotQuality } from "@/lib/mascot/types";
import {
  PORTFOLIO_MODE_EVENT,
  readPortfolioViewMode,
  type PortfolioModeEventDetail,
  type PortfolioViewMode,
} from "@/lib/portfolio/viewMode";
import MascotSoundControl from "./MascotSoundControl";
import styles from "./Mascot.module.css";

const ProceduralMascotCanvas = dynamic(
  () => import("./ProceduralMascotCanvas"),
  { ssr: false, loading: () => null },
);

const DISABLE_STORAGE_KEY = "mascot:disabled";

function readStoredDisabled(): boolean {
  try {
    return window.localStorage.getItem(DISABLE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function storeDisabled(disabled: boolean): void {
  try {
    window.localStorage.setItem(DISABLE_STORAGE_KEY, String(disabled));
  } catch {
    // Privacy-restricted storage should not block this reversible control.
  }
}

export interface ProceduralMascotLoaderProps {
  quality?: MascotQuality;
}

/**
 * Homepage-only production shell. The creature is not mounted for
 * touch-first/mobile viewports, and desktop visitors retain explicit control
 * over both the feature and pointer-following behavior.
 */
export default function ProceduralMascotLoader({
  quality = "medium",
}: ProceduralMascotLoaderProps) {
  const pathname = usePathname();
  const onHomepage = pathname === "/";
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [desktopEligible, setDesktopEligible] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [following, setFollowing] = useState(false);
  const [engine, setEngine] = useState<MascotEngine | null>(null);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>("explore");

  useEffect(() => {
    if (!onHomepage) return undefined;
    setDisabled(readStoredDisabled());
    setPreferencesReady(true);

    const narrow = window.matchMedia("(max-width: 767px)");
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)");
    const syncEligibility = () => {
      setDesktopEligible(!narrow.matches && !coarse.matches);
    };
    syncEligibility();
    narrow.addEventListener("change", syncEligibility);
    coarse.addEventListener("change", syncEligibility);

    return () => {
      narrow.removeEventListener("change", syncEligibility);
      coarse.removeEventListener("change", syncEligibility);
    };
  }, [onHomepage]);

  useEffect(() => {
    if (!onHomepage) return undefined;
    setViewMode(readPortfolioViewMode());

    const handleModeChange = (event: Event) => {
      const detail = (event as CustomEvent<PortfolioModeEventDetail>).detail;
      if (detail?.mode) setViewMode(detail.mode);
    };

    window.addEventListener(PORTFOLIO_MODE_EVENT, handleModeChange);
    return () =>
      window.removeEventListener(PORTFOLIO_MODE_EVENT, handleModeChange);
  }, [onHomepage]);

  useEffect(() => {
    if (!onHomepage || !desktopEligible || disabled || viewMode === "focus") {
      setCanvasReady(false);
      return undefined;
    }

    const win = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(() => setCanvasReady(true));
    } else {
      timeoutHandle = setTimeout(() => setCanvasReady(true), 300);
    }
    return () => {
      if (idleHandle !== undefined) win.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, [desktopEligible, disabled, onHomepage, viewMode]);

  const handleEngineReady = useCallback((next: MascotEngine | null) => {
    setEngine(next);
    if (!next) setFollowing(false);
  }, []);

  const toggleFeature = () => {
    const nextDisabled = !disabled;
    setDisabled(nextDisabled);
    storeDisabled(nextDisabled);
    setFollowing(false);
  };

  const toggleFollowing = () => {
    if (!engine) return;
    const next = !following;
    engine.setFollowEnabled(next);
    setFollowing(next);
  };

  if (
    !onHomepage ||
    !preferencesReady ||
    !desktopEligible ||
    viewMode === "focus"
  )
    return null;

  return (
    <>
      {canvasReady && !disabled ? (
        <ProceduralMascotCanvas
          quality={quality}
          requireFishActivation
          onEngineReady={handleEngineReady}
          onFollowChange={setFollowing}
        />
      ) : null}

      <aside className={styles.mascotDock} aria-label="Interactive fish controls">
        <div className={styles.mascotDockHeader}>
          <span
            className={styles.mascotStatusDot}
            data-active={!disabled}
            aria-hidden="true"
          />
          <span>Interactive fish</span>
        </div>
        <div className={styles.mascotDockActions}>
          <button
            type="button"
            className={styles.mascotModeToggle}
            role="switch"
            aria-checked={!disabled}
            data-active={!disabled}
            onClick={toggleFeature}
          >
            Fish {disabled ? "Off" : "On"}
          </button>
          {!disabled ? (
            <button
              type="button"
              className={styles.mascotModeToggle}
              aria-pressed={following}
              data-active={following}
              onClick={toggleFollowing}
              disabled={!engine}
            >
              {following ? "Following" : "Resting"}
            </button>
          ) : null}
          {!disabled ? (
            <MascotSoundControl engine={engine} showHint={false} />
          ) : null}
        </div>
        <p className={styles.mascotDockHint} aria-live="polite">
          {disabled
            ? "The fish is hidden. Your choice is saved."
            : following
              ? "Following your pointer · click the fish or press Esc to rest"
              : "Click the fish to make it follow"}
        </p>
      </aside>
    </>
  );
}
