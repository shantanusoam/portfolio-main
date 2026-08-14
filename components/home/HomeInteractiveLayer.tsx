"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  applyPortfolioViewMode,
  readPortfolioViewMode,
  type PortfolioViewMode,
} from "@/lib/portfolio/viewMode";
import PortfolioModeDock from "./PortfolioModeDock";

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

export default function HomeInteractiveLayer() {
  const [mode, setMode] = useState<PortfolioViewMode | null>(null);

  useEffect(() => {
    const storedMode = readPortfolioViewMode();
    setMode(storedMode);
    applyPortfolioViewMode(storedMode);

    return () => {
      delete document.documentElement.dataset.portfolioMode;
    };
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
          <ComboTrail />
          <StickyCursor />
          <SecretArcade />
        </>
      ) : null}
      <PortfolioModeDock mode={mode} onChange={changeMode} />
    </>
  );
}
