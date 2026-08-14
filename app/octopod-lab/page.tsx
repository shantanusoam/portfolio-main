import type { Metadata } from "next";
import OctopodArena from "./OctopodArena";

export const metadata: Metadata = {
  title: "Octopod Keyboard Arena",
  description:
    "Play a procedural octopus with keyboard or touch controls, FABRIK feet, spring tentacles and page-surface physics.",
};

interface OctopodLabPageProps {
  searchParams?: { debug?: string };
}

export default function OctopodLabPage({ searchParams }: OctopodLabPageProps) {
  return <OctopodArena initialDebug={searchParams?.debug === "1"} />;
}
