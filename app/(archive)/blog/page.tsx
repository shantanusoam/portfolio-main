import type { Metadata } from "next";
import ArchiveHero from "@/components/archive/ArchiveHero";
import ArchiveDirectory from "@/components/archive/ArchiveDirectory";
import BlogExplorer from "@/components/archive/BlogExplorer";
import { archiveArticles } from "@/lib/archive/data";
import styles from "@/components/archive/archive.module.css";

export const metadata: Metadata = {
  title: "Dispatches — Shantanu Soam",
  description:
    "Notes on systems, interfaces, agents, experiments and the mistakes between them.",
};

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <ArchiveHero
        index="01"
        eyebrow="Blog / Dispatches"
        title="Notes from the workshop"
        description="Systems, interfaces, agents, experiments—and the mistakes between them. The useful parts get revised instead of buried."
        status={`${archiveArticles.length} transmissions online`}
      />
      <ArchiveDirectory />
      <BlogExplorer />
    </main>
  );
}
