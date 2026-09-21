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

/** The homepage owns its motion and audio; full-screen games own their input. */
export default function PortfolioRuntime({
  children,
  entries,
}: {
  children: ReactNode;
  entries: CommandEntry[];
}) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/arcade/")) return <>{children}</>;
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

