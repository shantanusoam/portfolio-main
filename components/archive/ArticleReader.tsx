"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import type { ArchiveArticle } from "@/lib/archive/types";
import { formatArchiveDate } from "@/lib/archive/data";
import { articleWorkbenches } from "@/lib/archive/workbenches";
import { noteCoverBySlug } from "@/lib/portfolio/evidence";
import Image from "next/image";
import ArticleWorkbench from "./ArticleWorkbench";
import styles from "./archive.module.css";

function CodeBlock({
  label,
  language,
  value,
}: {
  label: string;
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span>
          {label} · {language}
        </span>
        <button className={styles.copyButton} onClick={copy} type="button">
          <Copy size={11} aria-hidden="true" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function ArticleReader({
  article,
  previous,
  next,
}: {
  article: ArchiveArticle;
  previous?: ArchiveArticle;
  next?: ArchiveArticle;
}) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [comfortableReading, setComfortableReading] = useState(true);
  const workbench = articleWorkbenches[article.slug];

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const distance = root.scrollHeight - window.innerHeight;
      const progress =
        distance > 0 ? Math.min(1, window.scrollY / distance) : 0;
      progressRef.current?.style.setProperty(
        "--reading-progress",
        `${progress}`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className={styles.page}>
      <div
        className={styles.readingProgress}
        ref={progressRef}
        aria-hidden="true"
      />
      <header className={styles.readerHero}>
        <Link className={styles.backLink} href="/blog">
          <ArrowLeft size={14} /> Back to dispatches
        </Link>
        <p className={styles.eyebrow}>
          {article.format} / {article.category}
        </p>
        <h1 className={styles.readerTitle}>{article.title}</h1>
        <p className={styles.readerDek}>{article.dek}</p>
        <div className={styles.readerMeta}>
          <span>{article.readingMinutes} minute read</span>
          <span>Published {formatArchiveDate(article.publishedAt)}</span>
          <span>Updated {formatArchiveDate(article.updatedAt)}</span>
        </div>
        <div className={styles.readerCover}>
          <Image
            alt={`Editorial system artifact for ${article.title}`}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 980px"
            src={
              noteCoverBySlug[article.slug] ??
              "/proof-assets/notes/portfolio-product.webp"
            }
          />
          <span>Original editorial artifact / conceptual</span>
        </div>
      </header>

      <div className={styles.readerLayout}>
        <aside className={styles.articleAside} aria-label="Article contents">
          <span>On this page</span>
          <nav className={styles.toc}>
            {workbench ? (
              <a href="#workbench">Interactive build sequence</a>
            ) : null}
            {article.sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.heading}
              </a>
            ))}
          </nav>
          <button
            className={`${styles.modeButton} ${styles.readingModeButton}`}
            onClick={() => setComfortableReading((value) => !value)}
            type="button"
            aria-pressed={comfortableReading}
          >
            {comfortableReading ? "Use compact type" : "Use comfort reading"}
          </button>
        </aside>

        <article
          className={`${styles.articleBody} ${
            comfortableReading ? styles.articleBodyQuiet : ""
          }`}
        >
          {workbench ? <ArticleWorkbench workbench={workbench} /> : null}
          {article.sections.map((section) => (
            <section
              className={styles.articleSection}
              id={section.id}
              key={section.id}
            >
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.quote ? (
                <blockquote className={styles.pullQuote}>
                  {section.quote}
                </blockquote>
              ) : null}
              {section.list ? (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.code ? <CodeBlock {...section.code} /> : null}
            </section>
          ))}

          <details className={styles.revisionDisclosure}>
            <summary>Revision history · {article.revisions.length}</summary>
            <ol className={styles.revisionList}>
              {article.revisions.map((revision) => (
                <li key={`${revision.date}-${revision.note}`}>
                  <time dateTime={revision.date}>
                    {formatArchiveDate(revision.date)}
                  </time>
                  <p>{revision.note}</p>
                </li>
              ))}
            </ol>
          </details>

          <nav className={styles.nextReads} aria-label="More articles">
            {previous ? (
              <Link className={styles.nextRead} href={`/blog/${previous.slug}`}>
                <span>Previous signal</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className={styles.nextRead} href={`/blog/${next.slug}`}>
                <span>Next signal</span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>

      </div>
    </main>
  );
}
