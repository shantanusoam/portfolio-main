"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  applyPortfolioViewMode,
  readPortfolioViewMode,
  type PortfolioViewMode,
} from "@/lib/portfolio/viewMode";
import PortfolioModeDock from "./PortfolioModeDock";
import { HOME_OCTOCAT_EVENT } from "@/lib/home-octocat/events";

const EntranceWipe = dynamic(() => import("@/components/ui/EntranceWipe"), {
  ssr: false,
});
const ComboTrail = dynamic(() => import("@/components/ui/ComboTrail"), {
  ssr: false,
});
const StickyCursor = dynamic(
  () => import("@/components/ui/stickyCursor/StickyCursor"),
  { ssr: false },
);
const SecretArcade = dynamic(
  () => import("@/components/easter-egg/SecretArcade"),
  { ssr: false },
);
const HomeOctocat = dynamic(
  () => import("@/components/home-octocat/HomeOctocat"),
  { ssr: false },
);

export default function HomeInteractiveLayer() {
  const [mode, setMode] = useState<PortfolioViewMode | null>(null);
  const [octocatActive, setOctocatActive] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const storedMode =
      query.get("arcade") === "cluck" || query.get("octocat") === "play"
        ? "explore"
        : readPortfolioViewMode();
    setMode(storedMode);
    applyPortfolioViewMode(storedMode);

    return () => {
      delete document.documentElement.dataset.portfolioMode;
    };
  }, []);

  useEffect(() => {
    const onOctocat = (event: Event) =>
      setOctocatActive(
        Boolean((event as CustomEvent<{ active: boolean }>).detail?.active),
      );
    window.addEventListener(HOME_OCTOCAT_EVENT, onOctocat);
    return () => window.removeEventListener(HOME_OCTOCAT_EVENT, onOctocat);
  }, []);

  const changeMode = (nextMode: PortfolioViewMode) => {
    setMode(nextMode);
    applyPortfolioViewMode(nextMode);
  };

  if (!mode) return null;

  return (
    <>
      <EntranceWipe />
      {mode === "explore" ? (
        <>
          {!octocatActive && (
            <>
              <ComboTrail />
              <StickyCursor />
              <SecretArcade />
            </>
          )}
          <HomeOctocat />
        </>
      ) : null}
      <PortfolioModeDock mode={mode} onChange={changeMode} />
    </>
  );
}
