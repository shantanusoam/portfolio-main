"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import type { ArticleWorkbench as ArticleWorkbenchData } from "@/lib/archive/workbenches";
import styles from "./archive.module.css";

export default function ArticleWorkbench({
  workbench,
}: {
  workbench: ArticleWorkbenchData;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const step = workbench.steps[activeIndex];
  const progress = Math.round(
    (completed.size / Math.max(1, workbench.steps.length)) * 100,
  );
  const progressLabel = useMemo(
    () => `${completed.size} of ${workbench.steps.length} build steps reviewed`,
    [completed.size, workbench.steps.length],
  );

  const selectStep = (index: number) => {
    setActiveIndex(index);
  };

  const completeAndAdvance = () => {
    setCompleted((current) => {
      const next = new Set(current);
      next.add(step.id);
      return next;
    });
    if (activeIndex < workbench.steps.length - 1) {
      setActiveIndex((current) => current + 1);
    }
  };

  const reset = () => {
    setActiveIndex(0);
    setCompleted(new Set());
  };

  return (
    <section
      className={styles.workbench}
      id="workbench"
      aria-labelledby="workbench-title"
    >
      <header className={styles.workbenchHeader}>
        <div>
          <p className={styles.workbenchEyebrow}>{workbench.eyebrow}</p>
          <h2 id="workbench-title">{workbench.title}</h2>
        </div>
        <p>{workbench.intro}</p>
      </header>

      <div className={styles.workbenchProgress}>
        <div
          aria-hidden="true"
          className={styles.workbenchProgressTrack}
          style={{ "--workbench-progress": `${progress}%` } as CSSProperties}
        />
        <span aria-live="polite">{progressLabel}</span>
        {completed.size > 0 ? (
          <button onClick={reset} type="button">
            <RotateCcw size={11} aria-hidden="true" /> Reset
          </button>
        ) : null}
      </div>

      <div className={styles.workbenchLayout}>
        <div className={styles.workbenchRail} aria-label="Build steps">
          {workbench.steps.map((item, index) => {
            const isComplete = completed.has(item.id);
            const isActive = index === activeIndex;
            return (
              <button
                aria-current={isActive ? "step" : undefined}
                className={isActive ? styles.workbenchStepActive : undefined}
                key={item.id}
                onClick={() => selectStep(index)}
                type="button"
              >
                <span>
                  {isComplete ? <Check size={11} aria-hidden="true" /> : null}
                  {item.label}
                </span>
                <strong>{item.title}</strong>
              </button>
            );
          })}
        </div>

        <div className={styles.workbenchPanel} aria-live="polite">
          <p className={styles.workbenchStepLabel}>{step.label}</p>
          <h3>{step.title}</h3>
          <p className={styles.workbenchGoal}>{step.goal}</p>

          <div className={styles.workbenchDetails}>
            <div>
              <span>Build</span>
              <ol>
                {step.build.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
            <div>
              <span>Proof checkpoint</span>
              <p>{step.checkpoint}</p>
            </div>
            <div>
              <span>Files in this step</span>
              <ul className={styles.workbenchFiles}>
                {step.files.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.workbenchActions}>
            <button
              disabled={activeIndex === 0}
              onClick={() =>
                setActiveIndex((current) => Math.max(0, current - 1))
              }
              type="button"
            >
              <ArrowLeft size={13} aria-hidden="true" /> Previous
            </button>
            <button onClick={completeAndAdvance} type="button">
              {activeIndex === workbench.steps.length - 1
                ? completed.has(step.id)
                  ? "Reviewed"
                  : "Complete sequence"
                : "Mark reviewed + next"}
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <footer className={styles.workbenchLinks}>
        <Link href={workbench.liveHref}>{workbench.liveLabel} ↗</Link>
        <Link href={workbench.systemHref}>{workbench.systemLabel} ↗</Link>
      </footer>
    </section>
  );
}
