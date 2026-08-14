import type { Metadata } from "next";
import ArchiveHero from "@/components/archive/ArchiveHero";
import ArchiveDirectory from "@/components/archive/ArchiveDirectory";
import BlogExplorer from "@/components/archive/BlogExplorer";
import { listArchiveArticles } from "@/lib/archive/store";
import styles from "@/components/archive/archive.module.css";

export const metadata: Metadata = {
  title: "Dispatches — Shantanu Soam",
  description:
    "Notes on systems, interfaces, agents, experiments and the mistakes between them.",
};

export default async function BlogPage() {
  const articles = await listArchiveArticles();

  return (
    <main className={styles.page}>
      <ArchiveHero
        index="01"
        eyebrow="Blog / Dispatches"
        title="Notes from the workshop"
        description="Systems, interfaces, agents, experiments—and the mistakes between them. The useful parts get revised instead of buried."
        status={`${articles.length} transmissions online`}
        artwork={{
          src: "/signal-archive/dispatches-split-brain.webp",
          alt: "Two mechanical hemispheres connected by orange signal wires",
          label: "Artifact 01 / Intent ↔ execution",
        }}
      />
      <ArchiveDirectory blogCount={articles.length} />
      <BlogExplorer articles={articles} />
    </main>
  );
}
