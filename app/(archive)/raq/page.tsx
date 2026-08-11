import type { Metadata } from "next";
import ArchiveHero from "@/components/archive/ArchiveHero";
import RaqDeck from "@/components/archive/RaqDeck";
import styles from "@/components/archive/archive.module.css";

export const metadata: Metadata = {
  title: "RAQ — Shantanu Soam",
  description:
    "Rarely asked questions that were interesting enough to keep answering.",
};

export default function RaqPage() {
  return (
    <main className={styles.page}>
      <ArchiveHero
        index="04"
        eyebrow="RAQ / Rarely Asked Questions"
        title="Questions that made me stop"
        description="Asked only once or twice, but interesting enough to answer before I could make the response sound impressive."
        status="10 answers under redaction"
      />
      <RaqDeck />
    </main>
  );
}
