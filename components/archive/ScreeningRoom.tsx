"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Play, Shuffle, X } from "lucide-react";
import { talkEntries } from "@/lib/archive/data";
import type { TalkEntry, TalkTopic } from "@/lib/archive/types";
import styles from "./archive.module.css";

type Budget = "all" | "quick" | "medium" | "deep";

const budgets: Array<{ id: Budget; label: string; hint: string }> = [
  { id: "all", label: "Any time", hint: "browse the whole shelf" },
  { id: "quick", label: "10 min", hint: "clips and sharp ideas" },
  { id: "medium", label: "30 min", hint: "one focused sitting" },
  { id: "deep", label: "60+ min", hint: "the full argument" },
];

const topics: Array<"All" | TalkTopic> = [
  "All",
  "Systems",
  "Design",
  "Business",
  "Craft",
  "Life",
];

function fitsBudget(talk: TalkEntry, budget: Budget) {
  if (budget === "all") return true;
  if (budget === "quick") return talk.durationMinutes <= 15;
  if (budget === "medium") return talk.durationMinutes <= 35;
  return talk.durationMinutes > 35;
}

export default function ScreeningRoom() {
  const [budget, setBudget] = useState<Budget>("all");
  const [topic, setTopic] = useState<(typeof topics)[number]>("All");
  const [active, setActive] = useState<TalkEntry | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const linkedTalk = talkEntries.find((talk) => talk.id === hash);
    if (!linkedTalk) return;
    if (linkedTalk.durationMinutes <= 15) setBudget("quick");
    else if (linkedTalk.durationMinutes <= 35) setBudget("medium");
    else setBudget("deep");
    setTopic("All");
    window.setTimeout(
      () =>
        document
          .getElementById(hash)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      30,
    );
  }, []);

  const visible = useMemo(
    () =>
      talkEntries.filter(
        (talk) =>
          fitsBudget(talk, budget) && (topic === "All" || talk.topic === topic),
      ),
    [budget, topic],
  );

  useEffect(() => {
    if (!active) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [active]);

  const surprise = () => {
    if (visible.length === 0) return;
    setActive(visible[Math.floor(Math.random() * visible.length)]);
  };

  const embedUrl = active
    ? `https://www.youtube-nocookie.com/embed/${
        active.youtubeId
      }?autoplay=1&rel=0&modestbranding=1${
        active.startAtSeconds ? `&start=${active.startAtSeconds}` : ""
      }${active.endAtSeconds ? `&end=${active.endAtSeconds}` : ""}`
    : "";

  return (
    <>
      <section className={styles.section} aria-labelledby="time-budget">
        <div className={styles.budgetPrompt}>
          <p className={styles.sectionKicker}>01 / Set the constraint</p>
          <h2 id="time-budget">How much time do you have?</h2>
          <div className={styles.budgetOptions}>
            {budgets.map((item) => (
              <button
                className={`${styles.budgetButton} ${
                  budget === item.id ? styles.budgetButtonActive : ""
                }`}
                key={item.id}
                onClick={() => setBudget(item.id)}
                type="button"
                aria-pressed={budget === item.id}
              >
                {item.label}
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="screening-list">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>02 / Screening queue</p>
          <div>
            <h2 className={styles.sectionTitle} id="screening-list">
              Only the useful parts
            </h2>
            <p className={styles.sectionIntro}>
              Every recommendation says why it earns the time. Videos load only
              after you choose one, keeping the room quiet and the page fast.
            </p>
          </div>
        </div>

        <div className={styles.screeningToolbar}>
          <div className={styles.filterRow} aria-label="Talk topics">
            {topics.map((item) => (
              <button
                className={`${styles.chip} ${
                  topic === item ? styles.chipActive : ""
                }`}
                key={item}
                onClick={() => setTopic(item)}
                type="button"
                aria-pressed={topic === item}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            className={styles.actionButton}
            onClick={surprise}
            type="button"
            disabled={visible.length === 0}
          >
            <Shuffle size={11} aria-hidden="true" /> Surprise me
          </button>
          <span className={styles.resultCount} aria-live="polite">
            {visible.length} fit this constraint
          </span>
        </div>

        {visible.length > 0 ? (
          <div className={styles.talkGrid}>
            {visible.map((talk, index) => (
              <article className={styles.talkCard} id={talk.id} key={talk.id}>
                <div className={styles.talkMeta}>
                  <span>
                    {String(index + 1).padStart(2, "0")} / {talk.kind}
                  </span>
                  <span>
                    {talk.displayDuration} · {talk.difficulty}
                  </span>
                </div>
                <h3 className={styles.talkTitle}>{talk.title}</h3>
                <p className={styles.talkSpeaker}>{talk.speaker}</p>
                <p className={styles.talkWhy}>{talk.why}</p>
                <div className={styles.talkOutcome}>
                  <span>You will leave understanding</span>
                  <p>{talk.leavesYouWith}</p>
                </div>
                <div className={styles.talkFooter}>
                  <p className={styles.takeaway}>“{talk.takeaway}”</p>
                  <button
                    className={styles.playButton}
                    onClick={() => setActive(talk)}
                    type="button"
                    aria-label={`Watch ${talk.title}`}
                  >
                    <Play size={18} fill="currentColor" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No item fits both constraints. Try “All” topics.
          </div>
        )}
      </section>

      {active ? (
        <div
          className={styles.screeningOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setActive(null);
          }}
        >
          <section
            className={styles.screeningDrawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="active-screening-title"
          >
            <header className={styles.screeningHeader}>
              <div>
                <p className={styles.sectionKicker}>
                  {active.kind} / {active.displayDuration} / {active.topic}
                </p>
                <h3 id="active-screening-title">{active.title}</h3>
                <p className={styles.talkSpeaker}>{active.speaker}</p>
              </div>
              <button
                className={styles.iconButton}
                onClick={() => setActive(null)}
                type="button"
                aria-label="Close video"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.videoFrame}>
              <iframe
                src={embedUrl}
                title={`${active.title} by ${active.speaker}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className={styles.screeningNotes}>
              <div>
                <p className={styles.microLabel}>
                  You will leave understanding
                </p>
                <p>{active.leavesYouWith}</p>
              </div>
              <div>
                <p className={styles.microLabel}>One-line takeaway</p>
                <p>{active.takeaway}</p>
                <a
                  className={styles.sourceLink}
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on YouTube <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
