"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { learningTracks, logSeed } from "@/constants/learning";
import type { LogEntry } from "@/@types/learning.type";
import styles from "./Learning.module.css";

gsap.registerPlugin(ScrollTrigger);

const STORE_KEY = "learning-log-entries-v1";
const COUNTER_KEY = "learning-log-next-id";
const STATUS_KEY = "learning-status-line";

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

function seedEntries(): LogEntry[] {
  let nextId = 1;
  return logSeed.map((s) => ({
    id: nextId++,
    trackId: s.trackId,
    tag: s.tag,
    text: s.text,
    seed: true,
    ts: null,
  }));
}

function CornerBrackets() {
  return (
    <>
      <span className={`${styles.cornerBracket} ${styles.cornerTL}`} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerTR}`} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerBR}`} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerBL}`} aria-hidden="true" />
    </>
  );
}

const HARNESS_BREAKS: Array<{ break: string; fix: string }> = [
  { break: "Process crashes — state lost, tool calls get re-fired", fix: "→ durable execution" },
  { break: "A tool can do anything it wants — unsafe runtime", fix: "→ sandboxed tool calls" },
  { break: "Context grows forever — slow, expensive, worse answers", fix: "→ memory & context hydration" },
  { break: "One agent tries to do everything — no specialization", fix: "→ routing & handoffs" },
  { break: "Sub-agents fail or disagree — no recovery path", fix: "→ supervision" },
  { break: "Waiting on approval blocks the whole server", fix: "→ human-in-the-loop" },
];

function HarnessPrimer() {
  return (
    <section className={styles.primer}>
      <h3 className={styles.primerHeading}>What a harness actually is</h3>
      <p className={styles.primerLede}>
        Strip everything away and an &quot;agent&quot; is just a <code>while</code> loop
        with an LLM in the middle — call the model, run whatever tool it asks for, push
        the result onto an array, repeat. That works in a demo and dies in production a
        dozen ways. A <strong>harness</strong> is the layer built around that loop to make
        it survive: an event log, checkpoints, a sandbox around every tool call, a way to
        hydrate context instead of just appending to it forever, routing to specialists,
        supervision, and a place for a human to say yes before anything irreversible
        happens. The agent stays a deliberately boring, domain-neutral task-runner — the
        harness is the actual engineering.
      </p>
      <p className={styles.primerMantra}>
        &quot;Agent systems are workflow systems. The LLM decides the next semantic step;
        the harness owns execution.&quot;
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
        In production, this outer layer — loop, tools, message history, event stream — is
        what LangGraph, Mastra, and the agent SDKs hand you already built. Building it by
        hand once is what makes it obvious what those frameworks are actually doing
        underneath.
      </p>
    </section>
  );
}

function EditableStatus() {
  const ref = useRef<HTMLSpanElement>(null);
  const [justSaved, setJustSaved] = useState(false);
  const defaultText =
    "circling durable execution and the sandbox boundary — the part of the harness that decides what survives a crash, and what the model never touches directly.";

  useEffect(() => {
    const saved = window.localStorage.getItem(STATUS_KEY);
    if (saved && ref.current) ref.current.textContent = saved;
  }, []);

  function handleBlur() {
    if (!ref.current) return;
    const value = ref.current.textContent?.trim() ?? "";
    window.localStorage.setItem(STATUS_KEY, value);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 900);
  }

  return (
    <div className={styles.statusLine}>
      <span className={styles.statusPrefix}>Right now —</span>
      <span
        ref={ref}
        className={`${styles.editable} ${justSaved ? styles.justSaved : ""}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLElement).blur();
          }
        }}
      >
        {defaultText}
      </span>
      <span className={styles.editHint}>click to edit — saves in this browser only</span>
    </div>
  );
}

function TrackLogPanel({ trackId, logTags }: { trackId: string; logTags: Record<string, string> }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [tag, setTag] = useState(Object.keys(logTags)[0] ?? "general");

  useEffect(() => {
    let all: LogEntry[];
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        all = JSON.parse(raw);
      } catch {
        all = seedEntries();
        window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
        window.localStorage.setItem(COUNTER_KEY, String(all.length + 1));
      }
    } else {
      all = seedEntries();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
      window.localStorage.setItem(COUNTER_KEY, String(all.length + 1));
    }
    setEntries(all);
  }, []);

  function persist(next: LogEntry[]) {
    setEntries(next);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  function addEntry() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const nextId = parseInt(window.localStorage.getItem(COUNTER_KEY) || "1", 10);
    window.localStorage.setItem(COUNTER_KEY, String(nextId + 1));
    const entry: LogEntry = { id: nextId, trackId, tag, text: trimmed, seed: false, ts: Date.now() };
    persist([...entries, entry]);
    setText("");
  }

  function deleteEntry(id: number) {
    persist(entries.filter((e) => e.id !== id));
  }

  const trackEntries = useMemo(
    () => entries.filter((e) => e.trackId === trackId),
    [entries, trackId],
  );

  const visible = useMemo(() => {
    const filtered = filter === "all" ? trackEntries : trackEntries.filter((e) => e.tag === filter);
    return filtered.slice().sort((a, b) => b.id - a.id);
  }, [trackEntries, filter]);

  return (
    <div>
      <span className={styles.panelLabel}>{"// Field notes"}</span>

      <div className={styles.composer}>
        <textarea
          placeholder="What did you just learn? (⌘/Ctrl + Enter to checkpoint)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              addEntry();
            }
          }}
        />
        <div className={styles.composerRow}>
          <select className={styles.tagSelect} value={tag} onChange={(e) => setTag(e.target.value)}>
            {Object.entries(logTags).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" className={styles.submitBtn} onClick={addEntry}>
            Checkpoint this →
          </button>
        </div>
      </div>

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
        {visible.length === 0 && <li className={styles.emptyState}>Nothing checkpointed under this tag yet.</li>}
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
            <button
              type="button"
              className={styles.deleteBtn}
              aria-label="Delete this entry"
              onClick={() => deleteEntry(entry.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Learning() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [openTrackId, setOpenTrackId] = useState<string | null>(
    learningTracks.find((t) => t.status === "now")?.id ?? null,
  );

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(`.${styles.trackCard}`).forEach((item) => {
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
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} id="learning" className={styles.section}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Terminal / Learning Log</span>
        <h2 className={styles.heading}>Field notes on the systems I&apos;m building.</h2>
        <p className={styles.lede}>
          Not a portfolio pitch — a running log of what I&apos;m actually learning, checkpointed
          as I go. One track so far; the shape is built to hold more.
        </p>
      </header>

      <HarnessPrimer />

      <div className={styles.header}>
        <EditableStatus />
      </div>

      <div className={styles.timeline}>
        {learningTracks.map((track) => {
          const isOpen = openTrackId === track.id;
          return (
            <article className={styles.trackCard} key={track.id}>
              <div className={styles.trackHead}>
                <span className={styles.checkpoint}>Checkpoint {track.checkpoint}</span>
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
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
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
                  <TrackLogPanel trackId={track.id} logTags={track.logTags} />

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
