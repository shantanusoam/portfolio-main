"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import type {
  LearningTrackWithEntries,
  LogEntry,
} from "@/@types/learning.type";
import styles from "./Learning.module.css";

gsap.registerPlugin(ScrollTrigger);

function pad(n: number) {
  return String(n).padStart(3, "0");
}

function formatTs(ts: number | null) {
  if (!ts) return "from the lessons";
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CornerBrackets() {
  return (
    <>
      <span
        className={`${styles.cornerBracket} ${styles.cornerTL}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.cornerBracket} ${styles.cornerTR}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.cornerBracket} ${styles.cornerBR}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.cornerBracket} ${styles.cornerBL}`}
        aria-hidden="true"
      />
    </>
  );
}

const HARNESS_BREAKS: Array<{ break: string; fix: string }> = [
  {
    break: "Process crashes — state lost, tool calls get re-fired",
    fix: "→ durable execution",
  },
  {
    break: "A tool can do anything it wants — unsafe runtime",
    fix: "→ sandboxed tool calls",
  },
  {
    break: "Context grows forever — slow, expensive, worse answers",
    fix: "→ memory & context hydration",
  },
  {
    break: "One agent tries to do everything — no specialization",
    fix: "→ routing & handoffs",
  },
  {
    break: "Sub-agents fail or disagree — no recovery path",
    fix: "→ supervision",
  },
  {
    break: "Waiting on approval blocks the whole server",
    fix: "→ human-in-the-loop",
  },
];

const GUIDE_PATHS = [
  {
    index: "01",
    meta: "Interactive course · 10 modules · 30 code steps",
    title: "Procedural animation, from noob to pro.",
    description:
      "Build steering, chains, constraints, soft bodies and behavior with copyable TypeScript, control experiments, expected results, debugging help and a runnable course kit.",
    href: "/learning/procedural-animation",
    action: "Start course",
    featured: true,
  },
  {
    index: "02",
    meta: "Interactive audio course · 11 modules · 33 code steps",
    title: "Build a browser guitar, from string to effects.",
    description:
      "Draw and pluck six strings, synthesize them with Web Audio, then add chords, drive, delay, reverb, presets, safe polyphony and production cleanup.",
    href: "/learning/string-instrument",
    action: "Start course",
    featured: true,
  },
  {
    index: "03",
    meta: "Agent systems · 13 min guide",
    title: "From one LLM loop to a reliable harness.",
    description:
      "Events, resumable checkpoints, idempotent tools, bounded context, execution policy, approvals, and failure recovery.",
    href: "/blog/reliable-agent-harness-from-one-loop",
    action: "Read guide",
    featured: false,
  },
  {
    index: "04",
    meta: "Interface craft · 11 min guide",
    title: "Motion that explains instead of decorating.",
    description:
      "Use hierarchy, continuity, scroll rhythm, interruption, reduced-motion fallbacks, and frame budgets with intent.",
    href: "/blog/motion-that-explains-the-interface",
    action: "Read guide",
    featured: false,
  },
] as const;

function HarnessPrimer() {
  return (
    <section className={styles.primer}>
      <h3 className={styles.primerHeading}>What a harness actually is</h3>
      <p className={styles.primerLede}>
        Strip everything away and an &quot;agent&quot; is just a{" "}
        <code>while</code> loop with an LLM in the middle — call the model, run
        whatever tool it asks for, push the result onto an array, repeat. That
        works in a demo and dies in production a dozen ways. A{" "}
        <strong>harness</strong> is the layer built around that loop to make it
        survive: an event log, checkpoints, a sandbox around every tool call, a
        way to hydrate context instead of just appending to it forever, routing
        to specialists, supervision, and a place for a human to say yes before
        anything irreversible happens. The agent stays a deliberately boring,
        domain-neutral task-runner — the harness is the actual engineering.
      </p>
      <p className={styles.primerMantra}>
        &quot;Agent systems are workflow systems. The LLM decides the next
        semantic step; the harness owns execution.&quot;
      </p>

      <span className={styles.primerLabel}>
        {"// Six ways a naive agent dies, and what the harness does about each"}
      </span>
      <div className={styles.primerGrid}>
        {HARNESS_BREAKS.map((item) => (
          <div className={styles.primerItem} key={item.break}>
            <span className={styles.primerBreak}>{item.break}</span>
            <span className={styles.primerFix}>{item.fix}</span>
          </div>
        ))}
      </div>

      <p className={styles.primerNote}>
        In production, this outer layer — loop, tools, message history, event
        stream — is what LangGraph, Mastra, and the agent SDKs hand you already
        built. Building it by hand once is what makes it obvious what those
        frameworks are actually doing underneath.
      </p>
    </section>
  );
}

function CurrentStatus({ tracks }: { tracks: LearningTrackWithEntries[] }) {
  const current = tracks.find((track) => track.status === "now");
  if (!current) return null;
  return (
    <div className={styles.statusLine}>
      <span className={styles.statusPrefix}>Right now —</span>
      <span className={styles.editable}>{current.summary}</span>
      <span className={styles.editHint}>
        synced from the learning control plane
      </span>
    </div>
  );
}

function TrackLogPanel({
  entries,
  logTags,
}: {
  entries: LogEntry[];
  logTags: Record<string, string>;
}) {
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    const filtered =
      filter === "all" ? entries : entries.filter((e) => e.tag === filter);
    return filtered.slice().sort((a, b) => b.id - a.id);
  }, [entries, filter]);

  return (
    <div>
      <span className={styles.panelLabel}>{"// Field notes"}</span>

      <div className={styles.filters}>
        <button
          type="button"
          className={styles.filterBtn}
          data-active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          all
        </button>
        {Object.entries(logTags).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={styles.filterBtn}
            data-active={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className={styles.logList}>
        {visible.length === 0 && (
          <li className={styles.emptyState}>
            Nothing checkpointed under this tag yet.
          </li>
        )}
        {visible.map((entry) => (
          <li className={styles.logEntry} key={entry.id}>
            <span className={styles.logId}>{`CKPT-${pad(entry.id)}`}</span>
            <div>
              <p className={styles.logText}>{entry.text}</p>
              <div className={styles.logMeta}>
                <span>{logTags[entry.tag] ?? entry.tag}</span>
                <time>{formatTs(entry.ts)}</time>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Learning() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [tracks, setTracks] = useState<LearningTrackWithEntries[]>([]);
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initializedOpenTrack = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLearning() {
      try {
        const response = await fetch("/api/learning", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok)
          throw new Error(`Learning API returned ${response.status}`);
        const data = (await response.json()) as {
          tracks?: LearningTrackWithEntries[];
        };
        const nextTracks = Array.isArray(data.tracks) ? data.tracks : [];
        setTracks(nextTracks);
        setLoadError(null);
        if (!initializedOpenTrack.current) {
          initializedOpenTrack.current = true;
          setOpenTrackId(
            nextTracks.find((track) => track.status === "now")?.id ?? null,
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load learning tracks", error);
        setLoadError(
          "The learning log is temporarily offline. Please check back shortly.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadLearning();
    return () => controller.abort();
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const context = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>(`.${styles.trackCard}`)
        .forEach((item) => {
          gsap.from(item, {
            opacity: 0,
            y: 28,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 84%", once: true },
          });
        });
    }, sectionRef);

    return () => context.revert();
  }, [prefersReducedMotion, tracks.length]);

  return (
    <section ref={sectionRef} id="learning" className={styles.section}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Terminal / Learning Log</span>
        <h2 className={styles.heading}>
          Field notes on the systems I&apos;m building.
        </h2>
        <p className={styles.lede}>
          Not a portfolio pitch — a running log of what I&apos;m actually
          learning, checkpointed as I go. Tracks and checkpoints are shared from
          the same durable learning system.
        </p>
      </header>

      <section
        className={styles.guideShelf}
        aria-labelledby="guided-learning-paths"
      >
        <div className={styles.guideShelfHeader}>
          <span className={styles.panelLabel}>{"// Guided paths"}</span>
          <div>
            <h3 id="guided-learning-paths">Choose one useful thread.</h3>
            <p>
              Each path starts with a mental model, proves it with a small
              example, and ends with one concrete action.
            </p>
          </div>
        </div>

        <div className={styles.guideGrid}>
          {GUIDE_PATHS.map((guide) => (
            <Link
              className={`${styles.guideCard} ${
                guide.featured ? styles.guideCardFeatured : ""
              }`}
              href={guide.href}
              key={guide.href}
            >
              <span className={styles.guideIndex}>{guide.index}</span>
              <div>
                <p>{guide.meta}</p>
                <h4>{guide.title}</h4>
                <span>{guide.description}</span>
              </div>
              <strong>{guide.action} →</strong>
            </Link>
          ))}
        </div>
      </section>

      <HarnessPrimer />

      <div className={styles.header}>
        <CurrentStatus tracks={tracks} />
      </div>

      <div className={styles.timeline} aria-live="polite">
        {loading && (
          <article className={styles.trackCard}>
            <span className={styles.panelLabel}>
              {"// Syncing field notes"}
            </span>
            <p className={styles.trackSummary}>
              Loading the latest learning checkpoints…
            </p>
          </article>
        )}
        {!loading && loadError && (
          <article className={styles.trackCard}>
            <span className={styles.panelLabel}>{"// Signal interrupted"}</span>
            <p className={styles.trackSummary}>{loadError}</p>
          </article>
        )}
        {!loading && !loadError && tracks.length === 0 && (
          <article className={styles.trackCard}>
            <p className={styles.trackSummary}>
              No learning tracks have been published yet.
            </p>
          </article>
        )}
        {tracks.map((track) => {
          const isOpen = openTrackId === track.id;
          return (
            <article className={styles.trackCard} key={track.id}>
              <div className={styles.trackHead}>
                <span className={styles.checkpoint}>
                  Checkpoint {track.checkpoint}
                </span>
                <span className={styles.statusChip} data-status={track.status}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {track.status}
                </span>
              </div>

              <h3 className={styles.trackTitle}>{track.title}</h3>
              <p className={styles.trackSummary}>{track.summary}</p>
              <p className={styles.trackDescription}>{track.description}</p>

              <div className={styles.tagRow}>
                {track.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              {track.links && track.links.length > 0 && (
                <div className={styles.linkRow}>
                  {track.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.toggleBtn}
                data-open={isOpen}
                onClick={() => setOpenTrackId(isOpen ? null : track.id)}
                aria-expanded={isOpen}
              >
                {isOpen ? "Hide field notes" : "View field notes"}
                <ChevronDown size={13} />
              </button>

              {isOpen && (
                <div className={styles.panel}>
                  <CornerBrackets />
                  <TrackLogPanel
                    entries={track.entries}
                    logTags={track.logTags}
                  />

                  {track.mapping && track.mapping.length > 0 && (
                    <div className={styles.mappingWrap}>
                      <table className={styles.mappingTable}>
                        <thead>
                          <tr>
                            <th>Harness module</th>
                            <th>Built here as</th>
                            <th>Production analog</th>
                          </tr>
                        </thead>
                        <tbody>
                          {track.mapping.map((row) => (
                            <tr key={row.module}>
                              <td>{row.module}</td>
                              <td>{row.builtAs}</td>
                              <td>{row.productionAnalog}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
