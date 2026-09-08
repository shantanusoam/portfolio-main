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
  return (
    <CommandPaletteProvider entries={entries}>
      <PageAtmosphere />
      <PageScrollProgress />
      <ProceduralMascotLoader />
      <SoundroomNub />
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </CommandPaletteProvider>
  );
}
