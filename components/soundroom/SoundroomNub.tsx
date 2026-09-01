"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  SOUNDROOM_OPEN_EVENT,
  isTextEntryTarget,
  type SoundroomOpenDetail,
  type SoundroomOpenView,
} from "@/lib/audio/discovery";
import {
  hasDiscoveredSoundroom,
  rememberSoundroomDiscovery,
} from "@/lib/audio/persistence";
import {
  PORTFOLIO_MODE_EVENT,
  readPortfolioViewMode,
  type PortfolioModeEventDetail,
  type PortfolioViewMode,
} from "@/lib/portfolio/viewMode";
import styles from "./Soundroom.module.css";

const SoundroomExperience = dynamic(() => import("./SoundroomExperience"), {
  ssr: false,
  loading: () => null,
});

export default function SoundroomNub() {
  const [discovered, setDiscovered] = useState(false);
  const [justDiscovered, setJustDiscovered] = useState(false);
  const [requestedView, setRequestedView] = useState<SoundroomOpenView>("mini");
  const [portfolioMode, setPortfolioMode] =
    useState<PortfolioViewMode>("explore");

  const discover = (view: SoundroomOpenView) => {
    const firstDiscovery = !hasDiscoveredSoundroom();
    rememberSoundroomDiscovery();
    setRequestedView(view);
    setJustDiscovered(firstDiscovery);
    setDiscovered(true);
  };

  useEffect(() => {
    setDiscovered(hasDiscoveredSoundroom());
    setPortfolioMode(readPortfolioViewMode());
  }, []);

  useEffect(() => {
    const handleMode = (event: Event) => {
      const detail = (event as CustomEvent<PortfolioModeEventDetail>).detail;
      setPortfolioMode(detail?.mode ?? readPortfolioViewMode());
    };
    window.addEventListener(PORTFOLIO_MODE_EVENT, handleMode);
    return () => window.removeEventListener(PORTFOLIO_MODE_EVENT, handleMode);
  }, []);

  useEffect(() => {
    let typed = "";
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTextEntryTarget(event.target)
      ) {
        return;
      }
      if (!discovered && event.key.toLowerCase() === "m") {
        discover("mini");
        return;
      }
      if (event.key.length !== 1) return;
      typed = `${typed}${event.key.toLowerCase()}`.slice(-18);
      if (typed.endsWith("/music") || typed.endsWith("play")) {
        discover("room");
        typed = "";
      }
    };
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<SoundroomOpenDetail>).detail;
      discover(detail?.view ?? "room");
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener(SOUNDROOM_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener(SOUNDROOM_OPEN_EVENT, handleOpen);
    };
  }, [discovered]);

  if (discovered) {
    return (
      <SoundroomExperience
        initialView={requestedView}
        justDiscovered={justDiscovered}
      />
    );
  }

  if (portfolioMode === "focus") return null;

  return (
    <button
      type="button"
      className={styles.listeningStone}
      onClick={() => discover("mini")}
      onDoubleClick={() => discover("room")}
      aria-label="Open the hidden Soundroom"
      title="A quiet signal"
      data-mascot-obstacle="hard"
    >
      <span className={styles.stoneGroove} />
      <span className={styles.stonePin} />
    </button>
  );
}
