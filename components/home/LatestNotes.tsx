import Image from "next/image";
import Link from "next/link";
import { archiveArticles } from "@/lib/archive/data";
import { articleWorkbenches } from "@/lib/archive/workbenches";
import { noteCoverBySlug } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

export default function LatestNotes() {
  return (
    <section className={styles.section} id="latest-notes">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>04 / Latest field notes</p>
        <div>
          <h2>Ideas with their rough edges intact.</h2>
          <p>
            The newest build guides include interactive, step-by-step
            workbenches. The full archive stays searchable through Ctrl/⌘ K and
            the Blog room.
          </p>
          <Link className={styles.textLink} href="/blog">
            Read every dispatch ↗
          </Link>
        </div>
      </header>
      <div className={styles.notesGrid}>
        {archiveArticles.slice(0, 3).map((article) => (
          <Link
            className={styles.noteCard}
            href={`/blog/${article.slug}`}
            key={article.slug}
          >
            <div className={styles.noteVisual}>
              <Image
                alt={`${article.title} editorial artifact`}
                height={620}
                width={900}
                src={
                  noteCoverBySlug[article.slug] ??
                  "/proof-assets/notes/portfolio-product.webp"
                }
              />
            </div>
            <div className={styles.noteCopy}>
              <span className={styles.eyebrow}>
                {articleWorkbenches[article.slug]
                  ? "Interactive guide"
                  : article.format}{" "}
                / {article.readingMinutes} min
              </span>
              <h3>{article.title}</h3>
              <p>{article.dek}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
