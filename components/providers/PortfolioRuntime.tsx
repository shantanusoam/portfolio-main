"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";
import PageAtmosphere from "@/components/ui/PageAtmosphere";
import PageScrollProgress from "@/components/ui/PageScrollProgress";
import ProceduralMascotLoader from "@/components/mascot/ProceduralMascotLoader";
import SoundroomNub from "@/components/soundroom/SoundroomNub";
import SmoothScrollProvider from "./SmoothScrollProvider";
import type { CommandEntry } from "@/lib/archive/command-index";
import { HOME_OCTOCAT_EVENT } from "@/lib/home-octocat/events";

/** Full-screen games own input and audio. Unmount ambient engines, not just their visible layers. */
export default function PortfolioRuntime({
  children,
  entries,
}: {
  children: ReactNode;
  entries: CommandEntry[];
}) {
  const pathname = usePathname();
  const [octocatActive, setOctocatActive] = useState(false);
  useEffect(() => {
    const onOctocat = (event: Event) =>
      setOctocatActive(
        Boolean((event as CustomEvent<{ active: boolean }>).detail?.active),
      );
    window.addEventListener(HOME_OCTOCAT_EVENT, onOctocat);
    return () => window.removeEventListener(HOME_OCTOCAT_EVENT, onOctocat);
  }, []);
  if (pathname.startsWith("/arcade/")) return <>{children}</>;
  return (
    <CommandPaletteProvider entries={entries}>
      {!octocatActive && <PageAtmosphere />}
      {!octocatActive && <PageScrollProgress />}
      {!(pathname === "/" && octocatActive) && <ProceduralMascotLoader />}
      {!octocatActive && <SoundroomNub />}
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </CommandPaletteProvider>
  );
}
