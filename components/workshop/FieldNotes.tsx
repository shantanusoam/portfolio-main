import Link from "next/link";
import { archiveArticles } from "@/lib/archive/data";
import Reveal from "./Reveal";
import { SceneHeader } from "./Scene";
import shared from "./WorkshopShared.module.css";
import styles from "./FieldNotes.module.css";

/**
 * Scene 3 — Field notes. Three real articles from the archive, chosen for
 * the brief's spread (engineering, making, nature-adjacent), set as an
 * editorial index: hairlines, mono metadata, serif titles. Typography-led
 * on purpose — these covers are words, not thumbnails.
 */

const FEATURED_SLUGS = [
  "learn-hard-technical-systems-with-one-small-loop",
  "drag-drop-trees-and-state",
  "procedural-fish-from-seek-to-forage",
] as const;

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default function FieldNotes() {
  const notes = FEATURED_SLUGS.map((slug) =>
    archiveArticles.find((article) => article.slug === slug),
  ).filter((article): article is (typeof archiveArticles)[number] =>
    Boolean(article),
  );

  return (
    <section className={styles.section} id="notes">
      <div className={shared.container}>
        <Reveal>
          <SceneHeader
            index="03"
            label="Field notes"
            tone="ink"
            title={
              <>
                Notes from <em>the field.</em>
              </>
            }
          />
        </Reveal>

        <ul className={styles.list}>
          {notes.map((note, index) => (
            <Reveal as="li" key={note.slug} delay={index * 80}>
              <Link href={`/blog/${note.slug}`} className={styles.note}>
                <span className={`${shared.monoMeta} ${styles.noteMeta}`}>
                  {String(index + 1).padStart(2, "0")} · {note.category} ·{" "}
                  {note.readingMinutes} min · {formatDate(note.publishedAt)}
                </span>
                <span className={styles.noteTitle}>{note.title}</span>
                <span className={styles.noteDek}>{note.dek}</span>
                <span className={styles.noteCta}>
                  Read the note <span aria-hidden="true">→</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={100}>
          <p className={styles.more}>
            <Link href="/blog" className={shared.uLink}>
              The full archive — writing, references and rare questions
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
