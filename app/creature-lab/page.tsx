import type { Metadata } from "next";
import CreatureLabClient from "./CreatureLabClient";

export const metadata: Metadata = {
  title: "Procedural Creature Lab",
  description:
    "Explore six live procedural creatures, their soft bodies, constraints, personalities and motion controls.",
};

interface CreatureLabPageProps {
  searchParams?: Promise<{ creature?: string; debug?: string }>;
}

export default async function CreatureLabPage({ searchParams }: CreatureLabPageProps) {
  const query = await searchParams;
  return (
    <CreatureLabClient
      selectedId={query?.creature ?? "manta"}
      initialDebug={query?.debug === "1"}
    />
  );
}
