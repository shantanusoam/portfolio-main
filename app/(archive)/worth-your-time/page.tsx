import type { Metadata } from "next";
import ArchiveHero from "@/components/archive/ArchiveHero";
import ScreeningRoom from "@/components/archive/ScreeningRoom";
import { talkEntries } from "@/lib/archive/data";
import styles from "@/components/archive/archive.module.css";

export const metadata: Metadata = {
  title: "Worth Your Time — Shantanu Soam",
  description:
    "Talks and clips from people explaining things they had to learn the hard way.",
};

export default function WorthYourTimePage() {
  return (
    <main className={styles.page}>
      <ArchiveHero
        index="03"
        eyebrow="Worth Your Time / Screening Room"
        title="No feed. No filler."
        description="People explaining things they had to learn the hard way. Choose the time you have; every recommendation explains what it will give back."
        status={`${talkEntries.length} screenings indexed`}
        updated="04.11.2024"
      />
      <ScreeningRoom />
    </main>
  );
}
