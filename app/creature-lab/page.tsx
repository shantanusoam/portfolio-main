import type { Metadata } from "next";
import CreatureLabClient from "./CreatureLabClient";

export const metadata: Metadata = {
  title: "Procedural Creature Lab",
  description:
    "Explore six live procedural creatures, their soft bodies, constraints, personalities and motion controls.",
};

interface CreatureLabPageProps {
  searchParams?: { creature?: string; debug?: string };
}

export default function CreatureLabPage({ searchParams }: CreatureLabPageProps) {
  return (
    <CreatureLabClient
      selectedId={searchParams?.creature ?? "manta"}
      initialDebug={searchParams?.debug === "1"}
    />
  );
}
