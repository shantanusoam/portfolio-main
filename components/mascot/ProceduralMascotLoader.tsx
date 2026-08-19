"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
  const prefersReducedMotion = usePrefersReducedMotion();
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [desktopEligible, setDesktopEligible] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [following, setFollowing] = useState(false);
  const [engine, setEngine] = useState<MascotEngine | null>(null);
  const [behavior, setBehavior] = useState<MascotBehavior>("dormant");
  const [ecosystemStatus, setEcosystemStatus] =
    useState<MascotEcosystemStatus | null>(null);
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
    const hero = document.querySelector<HTMLElement>("#hero");
    if (!hero || typeof IntersectionObserver === "undefined") {
      setHeroVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting && entry.intersectionRatio > 0.02);
      },
      { threshold: [0, 0.02, 0.12] },
    );
    observer.observe(hero);
    return () => observer.disconnect();
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
          enabled={heroVisible}
          reducedMotion={prefersReducedMotion}
          arenaSelector="#hero"
          requireFishActivation
          onEngineReady={handleEngineReady}
          onFollowChange={handleCanvasFollowChange}
          onStatus={(status) => setBehavior(status.behavior)}
          onEcosystemStatus={setEcosystemStatus}
        />
      ) : null}

      <aside
        className={styles.mascotDock}
        aria-label="Interactive fish controls"
      >
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
              {following ? "Following" : "Exploring"}
            </button>
          ) : null}
          {!disabled ? (
            <button
              type="button"
              className={styles.mascotModeToggle}
              onClick={releasePrey}
              disabled={!engine || !ecosystemStatus?.canReleaseFry}
              title="Release a small prey school into the hero"
            >
              Add prey {ecosystemStatus?.activeFryCount ?? 0}/{MAX_ACTIVE_FRY}
            </button>
          ) : null}
          {!disabled ? (
            <MascotSoundControl engine={engine} showHint={false} />
          ) : null}
        </div>
        <p className={styles.mascotDockHint} aria-live="polite">
          {disabled
            ? "The fish is hidden. Your choice is saved."
            : !heroVisible
              ? "The shoal pauses outside the hero and returns when you do."
              : following
                ? "Following your pointer · click the fish or press Esc to rest"
                : `${mood} · ${ecosystemStatus?.population ?? 1} adult${
                    ecosystemStatus?.population === 1 ? "" : "s"
                  } · click the fish to follow`}
        </p>
      </aside>
    </>
  );
}
