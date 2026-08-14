"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import {
  archiveArticles,
  externalArticleLabel,
  formatArchiveDate,
} from "@/lib/archive/data";
import { articleWorkbenches } from "@/lib/archive/workbenches";
import type { ArchiveArticle, ArticleCategory } from "@/lib/archive/types";
import styles from "./archive.module.css";

const categories: Array<"All" | ArticleCategory> = [
  "All",
  "Engineering",
  "AI Agents",
  "Interfaces",
  "Experiments",
  "Lessons",
];

interface BlogExplorerProps {
  articles?: ArchiveArticle[];
}

export default function BlogExplorer({
  articles = archiveArticles,
}: BlogExplorerProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (!isTyping && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory =
        category === "All" || article.category === category;
      const matchesQuery =
        normalized.length === 0 ||
        `${article.title} ${article.dek} ${article.category} ${article.format}`
          .toLowerCase()
          .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [articles, category, query]);

  const featured = filtered.filter((article) => article.featured).slice(0, 3);
  const featuredSlugs = new Set(featured.map((article) => article.slug));
  const archive = filtered.filter((article) => !featuredSlugs.has(article.slug));

  return (
    <>
      <section className={styles.section} aria-labelledby="dispatch-controls">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>01 / Tune the feed</p>
          <div>
            <h2 className={styles.sectionTitle} id="dispatch-controls">
              Find the useful thread
            </h2>
            <p className={styles.sectionIntro}>
              Essays, build logs, tutorials and field notes. Search the full
              archive or narrow it to the problem currently occupying your head.
            </p>
          </div>
        </div>

        <div className={styles.controlDeck}>
          <label className={styles.searchWrap}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <span className="sr-only">Search articles</span>
            <input
              ref={searchRef}
              className={styles.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ideas, systems, mistakes…"
              type="search"
              aria-keyshortcuts="/"
            />
            <span className={styles.shortcut}>/</span>
          </label>

          <div className={styles.filterWrap} aria-label="Article categories">
            {categories.map((item) => (
              <button
                className={`${styles.chip} ${
                  category === item ? styles.chipActive : ""
                }`}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section
          className={styles.section}
          aria-labelledby="current-transmissions"
        >
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>02 / Selected</p>
            <div>
              <h2 className={styles.sectionTitle} id="current-transmissions">
                Current transmissions
              </h2>
            </div>
          </div>

          <div className={styles.featureGrid}>
            {featured.map((article, index) => {
              const cardClassName = `${styles.featureCard} ${
                index === 0 ? styles.featureCardPrimary : ""
              }`;
              const body = (
                <>
                  <div>
                    <div className={styles.cardMeta}>
                      <span>{article.format}</span>
                      <span>{article.category}</span>
                      <span>{article.readingMinutes} min</span>
                      {articleWorkbenches[article.slug] && (
                        <span>Interactive</span>
                      )}
                      {article.externalUrl && (
                        <span>
                          ↗ {externalArticleLabel(article.externalUrl)}
                        </span>
                      )}
                    </div>
                    <h3 className={styles.featureTitle}>{article.title}</h3>
                    <p className={styles.featureDek}>{article.dek}</p>
                  </div>
                  <div className={styles.cardFoot}>
                    <span className={styles.date}>
                      {formatArchiveDate(article.publishedAt)} ·{" "}
                      {article.accent}
                    </span>
                    <span className={styles.signalArrow} aria-hidden="true">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                </>
              );

              return article.externalUrl ? (
                <a
                  className={cardClassName}
                  href={article.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={article.slug}
                >
                  {body}
                </a>
              ) : (
                <Link
                  className={cardClassName}
                  href={`/blog/${article.slug}`}
                  key={article.slug}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="full-archive">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>03 / Chronological</p>
          <div>
            <h2 className={styles.sectionTitle} id="full-archive">
              The full archive
            </h2>
            <p className={styles.sectionIntro} aria-live="polite">
              {archive.length} {archive.length === 1 ? "additional piece" : "additional pieces"}
              {featured.length > 0 ? " below the selected guides" : " in this signal"}.
            </p>
          </div>
        </div>

        {archive.length > 0 ? (
          <div className={styles.articleGrid}>
            {archive.map((article) => {
              const body = (
                <>
                  <div>
                    <div className={styles.cardMeta}>
                      <span>{article.format}</span>
                      <span>{article.readingMinutes} min</span>
                      {articleWorkbenches[article.slug] && (
                        <span>Interactive</span>
                      )}
                      {article.externalUrl && (
                        <span>
                          ↗ {externalArticleLabel(article.externalUrl)}
                        </span>
                      )}
                    </div>
                    <h3 className={styles.articleTitle}>{article.title}</h3>
                    <p className={styles.articleDek}>{article.dek}</p>
                  </div>
                  <div className={styles.cardFoot}>
                    <span className={styles.date}>
                      {formatArchiveDate(article.publishedAt)}
                    </span>
                    <span className={styles.signalArrow} aria-hidden="true">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                </>
              );

              return (
                <article className={styles.articleCard} key={article.slug}>
                  {article.externalUrl ? (
                    <a
                      className={styles.articleLink}
                      href={article.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {body}
                    </a>
                  ) : (
                    <Link
                      className={styles.articleLink}
                      href={`/blog/${article.slug}`}
                    >
                      {body}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        ) : featured.length === 0 ? (
          <div className={styles.emptyState}>
            No transmission matches that search. Try a broader signal.
          </div>
        ) : null}
      </section>
    </>
  );
}
