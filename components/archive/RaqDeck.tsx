"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Shuffle } from "lucide-react";
import { raqEntries } from "@/lib/archive/data";
import type { RaqTopic } from "@/lib/archive/types";
import styles from "./archive.module.css";

const topics: Array<"All" | RaqTopic> = [
  "All",
  "Work",
  "Taste",
  "Failure",
  "Tools",
  "Life",
  "Internet",
];

export default function RaqDeck() {
  const [topic, setTopic] = useState<(typeof topics)[number]>("All");
  const [answerMode, setAnswerMode] = useState<"short" | "long">("short");
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && raqEntries.some((entry) => entry.id === hash)) {
      setRevealed(new Set([hash]));
    }
  }, []);

  const visible = useMemo(
    () =>
      raqEntries.filter((entry) => topic === "All" || entry.topic === topic),
    [topic],
  );

  const toggleAnswer = (id: string) => {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const randomQuestion = () => {
    if (visible.length === 0) return;
    const entry = visible[Math.floor(Math.random() * visible.length)];
    setRevealed((current) => new Set(current).add(entry.id));
    window.setTimeout(
      () =>
        document
          .getElementById(entry.id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      20,
    );
  };

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, "", `#${id}`);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <>
      <section className={styles.section} aria-labelledby="rare-questions">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>01 / Intercepted deck</p>
          <div>
            <h2 className={styles.sectionTitle} id="rare-questions">
              Questions worth keeping
            </h2>
            <p className={styles.sectionIntro}>
              The question stays visible. The answer begins redacted. Reveal it
              when you actually want the response—not because an accordion
              opened itself.
            </p>
          </div>
        </div>

        <div className={styles.raqToolbar}>
          <div>
            <p className={styles.raqIntroNote}>
              Choose a topic, switch between the first honest answer and the
              longer version, or let the archive pick something unexpected.
              <span className={styles.inlineCount}>
                {visible.length} questions in view.
              </span>
            </p>
            <div className={styles.filterRow} aria-label="Question topics">
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
          </div>
          <div className={styles.toolbarActions}>
            <button
              className={`${styles.modeButton} ${
                answerMode === "short" ? styles.chipActive : ""
              }`}
              onClick={() => setAnswerMode("short")}
              type="button"
              aria-pressed={answerMode === "short"}
            >
              Short answer
            </button>
            <button
              className={`${styles.modeButton} ${
                answerMode === "long" ? styles.chipActive : ""
              }`}
              onClick={() => setAnswerMode("long")}
              type="button"
              aria-pressed={answerMode === "long"}
            >
              Long answer
            </button>
            <button
              className={styles.actionButton}
              onClick={randomQuestion}
              type="button"
            >
              <Shuffle size={11} aria-hidden="true" /> Random question
            </button>
          </div>
        </div>

        <div className={styles.questionGrid}>
          {visible.map((entry, index) => {
            const isRevealed = revealed.has(entry.id);
            const paragraphs =
              answerMode === "short" ? [entry.shortAnswer] : entry.longAnswer;
            return (
              <article
                className={styles.questionCard}
                id={entry.id}
                key={entry.id}
              >
                <div className={styles.questionMeta}>
                  <span>
                    RAQ {String(index + 1).padStart(2, "0")} / {entry.topic}
                  </span>
                  <span>{entry.askedAt}</span>
                </div>
                <h3 className={styles.questionTitle}>{entry.question}</h3>
                <div className={styles.answerWrap}>
                  <div className={styles.answerText} aria-hidden={!isRevealed}>
                    {paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div
                    className={`${styles.redactions} ${
                      isRevealed ? styles.redactionsHidden : ""
                    }`}
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className={styles.questionFooter}>
                  <button
                    className={styles.revealButton}
                    onClick={() => toggleAnswer(entry.id)}
                    type="button"
                    aria-expanded={isRevealed}
                  >
                    {isRevealed ? "Redact answer" : "Reveal answer"}
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => copyLink(entry.id)}
                    type="button"
                    aria-label={`Copy link to ${entry.question}`}
                  >
                    <Copy size={12} aria-hidden="true" />{" "}
                    {copiedId === entry.id ? "Copied" : "Link"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`${styles.section} ${styles.askPanel}`}>
        <div>
          <p className={styles.sectionKicker}>Incoming channel</p>
          <h2>Ask me something rare</h2>
          <p>
            Skip the résumé question. Send the one you would still want answered
            if the answer could not be optimized for a job interview.
          </p>
        </div>
        <Link className={styles.revealButton} href="/#contact">
          Open a line ↗
        </Link>
      </section>
    </>
  );
}
