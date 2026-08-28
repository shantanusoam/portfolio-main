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
import {
  PORTFOLIO_EVENTS,
  trackPortfolioEvent,
} from "@/lib/analytics/portfolioAnalytics";
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
  const readerRef = useRef<HTMLElement>(null);
  const timeRemainingRef = useRef<HTMLElement>(null);
  const completedRef = useRef(false);
  const workbench = articleWorkbenches[article.slug];
  const firstSectionId = workbench
    ? "workbench"
    : (article.sections[0]?.id ?? "");
  const activeSectionRef = useRef(firstSectionId);
  const [activeSectionId, setActiveSectionId] = useState(firstSectionId);
  const [readingMode, setReadingMode] = useState<"comfort" | "compact">(
    "comfort",
  );

  useEffect(() => {
    const savedMode = window.localStorage.getItem(
      "signal-archive:reading-mode",
    );
    if (savedMode === "comfort" || savedMode === "compact") {
      setReadingMode(savedMode);
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    completedRef.current = false;
    const startedAt = performance.now();
    const sectionNodes = Array.from(
      readerRef.current?.querySelectorAll<HTMLElement>(
        "#workbench, [data-reader-section]",
      ) ?? [],
    );
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const distance = root.scrollHeight - window.innerHeight;
      const progress =
        distance > 0 ? Math.min(1, window.scrollY / distance) : 0;
      readerRef.current?.style.setProperty("--reading-progress", `${progress}`);

      if (timeRemainingRef.current) {
        const remaining = Math.max(
          1,
          Math.ceil(article.readingMinutes * (1 - progress)),
        );
        timeRemainingRef.current.textContent =
          progress >= 0.97 ? "Read complete" : `${remaining} min left`;
      }

      const readingLine = Math.min(window.innerHeight * 0.3, 240);
      let nextSection = sectionNodes[0]?.id ?? "";
      for (const section of sectionNodes) {
        if (section.getBoundingClientRect().top <= readingLine) {
          nextSection = section.id;
        } else {
          break;
        }
      }
      if (nextSection && nextSection !== activeSectionRef.current) {
        activeSectionRef.current = nextSection;
        setActiveSectionId(nextSection);
      }

      if (
        !completedRef.current &&
        progress >= 0.9 &&
        performance.now() - startedAt >= 10_000
      ) {
        completedRef.current = true;
        trackPortfolioEvent(PORTFOLIO_EVENTS.articleCompleted, {
          slug: article.slug,
          readingMinutes: article.readingMinutes,
        });
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    const eligibilityTimer = window.setTimeout(update, 10_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(eligibilityTimer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [article.readingMinutes, article.slug]);

  const selectReadingMode = (mode: "comfort" | "compact") => {
    setReadingMode(mode);
    window.localStorage.setItem("signal-archive:reading-mode", mode);
    trackPortfolioEvent(PORTFOLIO_EVENTS.readingModeChanged, {
      mode,
    });
  };

  return (
    <main className={styles.page} ref={readerRef}>
      <div className={styles.readingProgress} aria-hidden="true" />
      <header className={styles.readerHero}>
        <div className={styles.readerHeroCopy}>
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
        </div>

        <figure className={styles.readerCover}>
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
        </figure>
      </header>

      <div className={styles.readerLayout}>
        <aside className={styles.articleAside} aria-label="Article contents">
          <div className={styles.readerStatus}>
            <span>Reading progress</span>
            <strong ref={timeRemainingRef}>
              {article.readingMinutes} min left
            </strong>
            <span className={styles.readerMeter} aria-hidden="true">
              <span />
            </span>
          </div>
          <span>On this page</span>
          <nav className={styles.toc}>
            {workbench ? (
              <a
                aria-current={
                  activeSectionId === "workbench" ? "location" : undefined
                }
                href="#workbench"
              >
                Interactive build sequence
              </a>
            ) : null}
            {article.sections.map((section) => (
              <a
                aria-current={
                  activeSectionId === section.id ? "location" : undefined
                }
                href={`#${section.id}`}
                key={section.id}
              >
                {section.heading}
              </a>
            ))}
          </nav>
          <div className={styles.readingModeControl}>
            <span>Text density</span>
            <div>
              {(["comfort", "compact"] as const).map((mode) => (
                <button
                  aria-pressed={readingMode === mode}
                  className={`${styles.modeButton} ${styles.readingModeButton}`}
                  key={mode}
                  onClick={() => selectReadingMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <article
          className={`${styles.articleBody} ${
            readingMode === "comfort" ? styles.articleBodyQuiet : ""
          }`}
        >
          {workbench ? <ArticleWorkbench workbench={workbench} /> : null}
          {article.sections.map((section) => (
            <section
              className={styles.articleSection}
              data-reader-section
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
