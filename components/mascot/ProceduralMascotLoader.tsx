"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MascotBehavior,
  MascotEcosystemStatus,
  MascotEngine,
  MascotQuality,
} from "@/lib/mascot/types";
import { MAX_ACTIVE_FRY } from "@/lib/mascot/ecosystem/PopulationModel";
import {
  PORTFOLIO_EVENTS,
  trackPortfolioEvent,
} from "@/lib/analytics/portfolioAnalytics";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
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
const LivingSignalField = dynamic(
  () => import("@/components/living-canvas/LivingSignalField"),
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
 * Homepage-only production shell. Explore mode composes the low-power signal
 * habitat and its creature across the full viewport. Touch-first/mobile
 * visitors skip both, and desktop visitors retain explicit control over the
 * fish and pointer-following behavior.
 */
export default function ProceduralMascotLoader({
  quality = "medium",
}: ProceduralMascotLoaderProps) {
  const pathname = usePathname();
  const onHomepage = pathname === "/";
  const prefersReducedMotion = usePrefersReducedMotion();
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [desktopEligible, setDesktopEligible] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [following, setFollowing] = useState(false);
  const [engine, setEngine] = useState<MascotEngine | null>(null);
  const [behavior, setBehavior] = useState<MascotBehavior>("dormant");
  const [ecosystemStatus, setEcosystemStatus] =
    useState<MascotEcosystemStatus | null>(null);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>("explore");
  const [controlsOpen, setControlsOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement | null>(null);

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
    if (!controlsOpen) return undefined;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!controlsRef.current?.contains(event.target as Node)) {
        setControlsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setControlsOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [controlsOpen]);

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
    if (!onHomepage || !desktopEligible || viewMode === "focus") {
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
  }, [desktopEligible, onHomepage, viewMode]);

  const handleEngineReady = useCallback((next: MascotEngine | null) => {
    setEngine(next);
    setEcosystemStatus(next?.getEcosystemStatus() ?? null);
    if (!next) {
      setFollowing(false);
      setBehavior("dormant");
    }
  }, []);

  const handleCanvasFollowChange = useCallback((next: boolean) => {
    setFollowing(next);
    trackPortfolioEvent(PORTFOLIO_EVENTS.fishFollowChanged, {
      enabled: next,
      source: "fish-or-keyboard",
    });
  }, []);

  const toggleFeature = () => {
    const nextDisabled = !disabled;
    if (nextDisabled) engine?.setFollowEnabled(false);
    setDisabled(nextDisabled);
    storeDisabled(nextDisabled);
    setFollowing(false);
    trackPortfolioEvent(PORTFOLIO_EVENTS.fishVisibilityChanged, {
      enabled: !nextDisabled,
    });
  };

  const toggleFollowing = () => {
    if (!engine) return;
    const next = !following;
    engine.setFollowEnabled(next);
    setFollowing(next);
    trackPortfolioEvent(PORTFOLIO_EVENTS.fishFollowChanged, {
      enabled: next,
      source: "dock",
    });
  };

  const releasePrey = () => {
    if (!engine || !ecosystemStatus?.canReleaseFry) return;
    trackPortfolioEvent(PORTFOLIO_EVENTS.preySchoolReleased, {
      adults: ecosystemStatus.population,
      preyBeforeRelease: ecosystemStatus.activeFryCount,
    });
    engine.trigger({ type: "releaseFry" });
  };

  const mood = following
    ? "curious"
    : behavior === "sprint"
      ? "playful"
      : behavior === "inspect" || behavior === "orbit"
        ? "nosy"
        : behavior === "rest"
          ? "drifting"
          : "exploring";
  const population = ecosystemStatus?.population ?? 1;
  const activeFryCount = ecosystemStatus?.activeFryCount ?? 0;

  if (
    !onHomepage ||
    !preferencesReady ||
    !desktopEligible ||
    viewMode === "focus"
  )
    return null;

  return (
    <>
      {canvasReady ? (
        <LivingSignalField
          engine={disabled ? null : engine}
          reducedMotion={prefersReducedMotion}
        />
      ) : null}

      {canvasReady ? (
        <ProceduralMascotCanvas
          quality={quality}
          reducedMotion={prefersReducedMotion}
          enabled={!disabled}
          autoEcology
          requireFishActivation
          onEngineReady={handleEngineReady}
          onFollowChange={handleCanvasFollowChange}
          onStatus={(status) => setBehavior(status.behavior)}
          onEcosystemStatus={setEcosystemStatus}
        />
      ) : null}

      <div
        ref={controlsRef}
        className={styles.mascotDock}
        data-open={controlsOpen}
        data-canvas-pulse="cool"
        data-canvas-pulse-source="control"
      >
        <button
          type="button"
          className={styles.mascotDockTrigger}
          aria-label={`${controlsOpen ? "Close" : "Open"} fish controls. Fish is ${
            disabled ? "off" : mood
          }.`}
          aria-expanded={controlsOpen}
          aria-controls="fish-controls-panel"
          onClick={() => setControlsOpen((open) => !open)}
          title="Fish controls"
        >
          <svg
            className={styles.mascotTriggerIcon}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              className={styles.mascotTriggerTail}
              d="M5.8 12 2.6 8.8v6.4L5.8 12Z"
            />
            <path d="M5.2 12c2.2-3.4 5.2-5 8.5-4.7 3 .3 5.4 2.1 7 4.7-1.6 2.6-4 4.4-7 4.7-3.3.3-6.3-1.3-8.5-4.7Z" />
            <circle cx="16.1" cy="10.8" r=".8" />
          </svg>
          <span
            className={styles.mascotStatusDot}
            data-active={!disabled}
            aria-hidden="true"
          />
          {activeFryCount > 0 ? (
            <span className={styles.mascotPreyBadge} aria-hidden="true">
              {activeFryCount}
            </span>
          ) : null}
        </button>

        <aside
          id="fish-controls-panel"
          className={styles.mascotDockPanel}
          aria-label="Interactive fish controls"
          aria-hidden={!controlsOpen}
        >
          <div className={styles.mascotDockHeader}>
            <span
              className={styles.mascotStatusDot}
              data-active={!disabled}
              aria-hidden="true"
            />
            <span>Signal habitat</span>
            <span className={styles.mascotMood}>
              {disabled ? "quiet" : mood}
            </span>
          </div>
          <div className={styles.mascotDockActions}>
            <button
              type="button"
              className={styles.mascotModeToggle}
              role="switch"
              aria-checked={!disabled}
              data-active={!disabled}
              onClick={toggleFeature}
              tabIndex={controlsOpen ? 0 : -1}
              data-canvas-pulse="cool"
              data-canvas-pulse-source="creature"
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
                tabIndex={controlsOpen ? 0 : -1}
                data-canvas-pulse="cool"
                data-canvas-pulse-source="creature"
              >
                {following ? "Following" : "Wandering"}
              </button>
            ) : null}
            {!disabled ? (
              <button
                type="button"
                className={styles.mascotModeToggle}
                onClick={releasePrey}
                disabled={!engine || !ecosystemStatus?.canReleaseFry}
                tabIndex={controlsOpen ? 0 : -1}
                title="Release a small prey school into the signal habitat"
                data-canvas-pulse="cool"
                data-canvas-pulse-source="creature"
              >
                Prey {activeFryCount}/{MAX_ACTIVE_FRY}
              </button>
            ) : null}
            {!disabled ? (
              <MascotSoundControl
                engine={engine}
                showHint={false}
                tabIndex={controlsOpen ? 0 : -1}
              />
            ) : null}
          </div>
          <p className={styles.mascotDockHint} aria-live="polite">
            {disabled
              ? "Hidden for this device. Your choice is saved."
              : following
                ? "Pointer follow is active. Select the fish or press Esc to release it."
                : `${population} adult${population === 1 ? "" : "s"} · ${activeFryCount} prey · click the fish to follow`}
          </p>
        </aside>
      </div>
    </>
  );
}
