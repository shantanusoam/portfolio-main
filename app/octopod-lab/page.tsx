import type { Metadata } from "next";
import OctopodArena from "./OctopodArena";

export const metadata: Metadata = {
  title: "Octopod Keyboard Arena",
  description:
    "Play a procedural octopus with keyboard or touch controls, FABRIK feet, spring tentacles and page-surface physics.",
};

interface OctopodLabPageProps {
  searchParams?: Promise<{ debug?: string }>;
}

export default async function OctopodLabPage({ searchParams }: OctopodLabPageProps) {
  const query = await searchParams;
  return <OctopodArena initialDebug={query?.debug === "1"} />;
}
