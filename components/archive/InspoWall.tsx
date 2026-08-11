"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { inspirationEntries } from "@/lib/archive/data";
import type { InspirationEntry, InspirationKind } from "@/lib/archive/types";
import styles from "./archive.module.css";

const kinds: Array<"All" | InspirationKind> = [
  "All",
  "Web",
  "Mobile",
  "Hardware",
  "Motion",
];

const motifClasses: Record<InspirationEntry["motif"], string> = {
  rails: styles.motifRails,
  orbital: styles.motifOrbital,
  console: styles.motifConsole,
  editorial: styles.motifEditorial,
  stack: styles.motifStack,
  signal: styles.motifSignal,
};

function seededShuffle<T>(input: T[], seed: number): T[] {
  const result = [...input];
  let value = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const target = value % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export default function InspoWall() {
  const [kind, setKind] = useState<(typeof kinds)[number]>("All");
  const [showArchive, setShowArchive] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seed, setSeed] = useState(1);

  useEffect(() => {
    setSeed(Math.floor(Date.now() / (4 * 60 * 60 * 1000)) || 1);
  }, []);

  const visible = useMemo(() => {
    const filtered = inspirationEntries.filter(
      (entry) => kind === "All" || entry.kind === kind,
    );
    if (showArchive) return filtered;
    const pinned = filtered.filter((entry) => entry.pinned);
    const rotating = seededShuffle(
      filtered.filter((entry) => !entry.pinned),
      seed,
    ).slice(0, 9);
    return [...pinned, ...rotating];
  }, [kind, seed, showArchive]);

  return (
    <section className={styles.section} aria-labelledby="reference-wall">
      <div className={styles.sectionHeader}>
        <p className={styles.sectionKicker}>01 / Evidence board</p>
        <div>
          <h2 className={styles.sectionTitle} id="reference-wall">
            The current rotation
          </h2>
          <p className={styles.sectionIntro}>
            Hover or focus a tile to inspect the exact detail worth keeping.
            Pinned references stay; the remaining wall reshuffles into a stable
            four-hour edition.
          </p>
        </div>
      </div>

      <div className={styles.wallToolbar}>
        <div className={styles.filterRow} aria-label="Reference type">
          {kinds.map((item) => (
            <button
              className={`${styles.chip} ${
                kind === item ? styles.chipActive : ""
              }`}
              key={item}
              onClick={() => setKind(item)}
              type="button"
              aria-pressed={kind === item}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={styles.toolbarActions}>
          <span className={styles.wallStatus}>Edition locked for 4 hours</span>
          <button
            className={styles.actionButton}
            onClick={() => setSeed(Date.now())}
            type="button"
          >
            <RefreshCw size={11} aria-hidden="true" /> Shuffle wall
          </button>
          <button
            className={`${styles.actionButton} ${
              showArchive ? styles.chipActive : ""
            }`}
            onClick={() => setShowArchive((value) => !value)}
            type="button"
            aria-pressed={showArchive}
          >
            {showArchive ? "Current edition" : "Full archive"}
          </button>
        </div>
      </div>

      <div className={styles.inspoWall}>
        {visible.map((entry) => {
          const active = activeId === entry.id;
          const dimmed = activeId !== null && !active;
          const previewStyle = {
            "--preview-a": entry.palette[0],
            "--preview-b": entry.palette[1],
            "--preview-c": entry.palette[2],
          } as CSSProperties;

          return (
            <article
              className={`${styles.inspoCard} ${
                active ? styles.inspoCardActive : ""
              } ${dimmed ? styles.inspoCardDimmed : ""}`}
              key={entry.id}
              onMouseEnter={() => setActiveId(entry.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(entry.id)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setActiveId(null);
              }}
            >
              {entry.pinned ? <span className={styles.pin}>Pinned</span> : null}
              <div
                className={`${styles.preview} ${motifClasses[entry.motif]}`}
                style={previewStyle}
              />
              <button
                className={styles.inspectButton}
                onClick={() => setActiveId(active ? null : entry.id)}
                type="button"
                aria-label={`Inspect ${entry.name}`}
                aria-expanded={active}
              />
              <div className={styles.inspoInfo}>
                <div className={styles.cardMeta}>
                  <span>{entry.kind}</span>
                  <span>
                    {String(visible.indexOf(entry) + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className={styles.inspoName}>{entry.name}</h3>
                <div className={styles.tags}>
                  {entry.tags.map((tag) => (
                    <span className={styles.tag} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {active ? (
                <div className={styles.annotation}>
                  <div>
                    <p className={styles.microLabel}>
                      Inspection note / {entry.kind}
                    </p>
                    <p>{entry.note}</p>
                  </div>
                  <div className={styles.annotationFooter}>
                    <div className={styles.tags}>
                      {entry.tags.map((tag) => (
                        <span className={styles.tag} key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={styles.toolbarActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => setActiveId(null)}
                        type="button"
                      >
                        Close
                      </button>
                      <a
                        className={styles.sourceLink}
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit source{" "}
                        <ExternalLink size={11} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
