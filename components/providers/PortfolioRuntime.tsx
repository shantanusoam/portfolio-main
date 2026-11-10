"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";
import PageAtmosphere from "@/components/ui/PageAtmosphere";
import SoundroomNub from "@/components/soundroom/SoundroomNub";
import type { CommandEntry } from "@/lib/archive/command-index";

/** Interactive routes own their input, clock and audio; reading uses native scroll. */
export default function PortfolioRuntime({
  children,
  entries,
}: {
  children: ReactNode;
  entries: CommandEntry[];
}) {
  const pathname = usePathname();
  const ownsInput =
    pathname === "/" ||
    /^\/(arcade|creature-lab|octopod-lab|motion-lab|ss-lab|gpu|gpu-smoke|testing|admin|oauth)(\/|$)/.test(
      pathname,
    ) ||
    pathname === "/learning/string-instrument" ||
    pathname === "/learning/procedural-animation";

  if (ownsInput) return <>{children}</>;

  return (
    <CommandPaletteProvider entries={entries}>
      <PageAtmosphere />
      {children}
      <SoundroomNub />
    </CommandPaletteProvider>
  );
}
