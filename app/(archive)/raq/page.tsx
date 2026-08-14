import type { Metadata } from "next";
import ArchiveHero from "@/components/archive/ArchiveHero";
import RaqDeck from "@/components/archive/RaqDeck";
import { raqEntries } from "@/lib/archive/data";
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
        status={`${raqEntries.length} answers under redaction`}
        updated="14.08.2026"
        artwork={{
          src: "/signal-archive/raq-redaction-stack.webp",
          alt: "A stack of translucent archive cards held beneath black redaction bars",
          label: "Artifact 04 / Selective disclosure",
        }}
      />
      <RaqDeck />
    </main>
  );
}
