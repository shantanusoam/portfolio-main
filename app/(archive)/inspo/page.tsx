import type { Metadata } from "next";
import ArchiveHero from "@/components/archive/ArchiveHero";
import InspoWall from "@/components/archive/InspoWall";
import { inspirationEntries } from "@/lib/archive/data";
import styles from "@/components/archive/archive.module.css";

export const metadata: Metadata = {
  title: "Inspo — Shantanu Soam",
  description:
    "A rotating wall of interfaces, motion and objects worth returning to.",
};

export default function InspoPage() {
  return (
    <main className={styles.page}>
      <ArchiveHero
        index="02"
        eyebrow="Inspo / Reference Wall"
        title="Interfaces I return to"
        description="A living evidence board for the moments when my own taste gets noisy. Every save includes the detail that made it worth keeping."
        status={`${inspirationEntries.length} references in rotation`}
        updated="15.05.2026"
      />
      <InspoWall />
    </main>
  );
}
