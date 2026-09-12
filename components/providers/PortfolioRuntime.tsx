"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";
import PageAtmosphere from "@/components/ui/PageAtmosphere";
import PageScrollProgress from "@/components/ui/PageScrollProgress";
import ProceduralMascotLoader from "@/components/mascot/ProceduralMascotLoader";
import SoundroomNub from "@/components/soundroom/SoundroomNub";
import SmoothScrollProvider from "./SmoothScrollProvider";
import type { CommandEntry } from "@/lib/archive/command-index";

/** Full-screen games own input and audio. Unmount ambient engines, not just their visible layers. */
export default function PortfolioRuntime({
  children,
  entries,
}: {
  children: ReactNode;
  entries: CommandEntry[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/arcade/")) return <>{children}</>;

  // Tomorrow's Workshop homepage runs its own quiet visual system: native
  // scrolling (no Lenis), no ambient canvas, no mascot, no cursor takeover —
  // per the redesign brief §7/§13. Everything remains on other routes.
  const isWorkshopHome = pathname === "/";
  return (
    <CommandPaletteProvider entries={entries}>
      {isWorkshopHome ? null : <PageAtmosphere />}
      {isWorkshopHome ? null : <PageScrollProgress />}
      {isWorkshopHome ? null : <ProceduralMascotLoader />}
      {isWorkshopHome ? null : <SoundroomNub />}
      {isWorkshopHome ? (
        children
      ) : (
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      )}
    </CommandPaletteProvider>
  );
}
