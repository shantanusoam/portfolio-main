"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import {
  COURSE_REPOSITORY_URL,
  COURSE_SETUP,
  type CourseSource,
  type DebugHint,
  type TutorialStep,
} from "./courseTutorials";
import styles from "./page.module.css";

export interface CourseTutorialContent {
  outcome: string;
  steps: readonly TutorialStep[];
  verify: readonly string[];
  debug: readonly DebugHint[];
  sources: readonly CourseSource[];
}

export interface CourseTutorialKit {
  setup: {
    title: string;
    description: string;
    commands: string;
    files: readonly string[];
  };
  starterHref: string;
  starterLabel: string;
  completeHref: string;
  completeLabel: string;
  repositoryUrl: string;
  repositoryPath: string;
  repositoryNote: string;
  sourceHeading: string;
  sourceDescription: string;
}

const DEFAULT_KIT: CourseTutorialKit = {
  setup: COURSE_SETUP,
  starterHref: "/course-files/procedural-fish-starter.html",
  starterLabel: "Download zero-setup starter",
  completeHref: "/course-files/procedural-fish-complete.html",
  completeLabel: "Open finished demo",
  repositoryUrl: COURSE_REPOSITORY_URL,
  repositoryPath: "public/course-files",
  repositoryNote: "Runnable starter, complete demo and build-order reference.",
  sourceHeading: "Compare your version with production boundaries.",
  sourceDescription:
    "These are the real portfolio files and engineering notes that this lesson was distilled from—not a separate toy architecture.",
};

function CopyButton({
  value,
  copyKey,
  copiedKey,
  onCopy,
}: {
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => Promise<void>;
}) {
  const copied = copiedKey === copyKey;

  return (
    <button
      className={styles.copyCodeButton}
      type="button"
      onClick={() => onCopy(value, copyKey)}
    >
      {copied ? (
        <Check size={13} aria-hidden="true" />
      ) : (
        <Copy size={13} aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}

export default function CourseTutorial({
  lessonId,
  tutorial,
  showSetup,
  completedStepKeys,
  onToggleStep,
  kit = DEFAULT_KIT,
}: {
  lessonId: string;
  tutorial: CourseTutorialContent;
  showSetup: boolean;
  completedStepKeys: readonly string[];
  onToggleStep: (stepKey: string) => void;
  kit?: CourseTutorialKit;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1600);
    } catch {
      setCopiedKey(null);
    }
  };

  return (
    <section className={styles.tutorial} aria-labelledby={`${lessonId}-build`}>
      <div className={styles.tutorialHeader}>
        <div>
          <span className={styles.sectionLabel}>Hands-on build</span>
          <h3 id={`${lessonId}-build`}>Build this module for real.</h3>
        </div>
        <p>{tutorial.outcome}</p>
      </div>

      {showSetup ? (
        <details className={styles.setupPanel} open>
          <summary>
            <span>One-time setup</span>
            <strong>{kit.setup.title}</strong>
          </summary>
          <div className={styles.setupBody}>
            <p>{kit.setup.description}</p>
            <div className={styles.setupGrid}>
              <div className={styles.tutorialCode}>
                <div>
                  <span>Terminal</span>
                  <CopyButton
                    value={kit.setup.commands}
                    copyKey="course-setup"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                </div>
                <pre>
                  <code>{kit.setup.commands}</code>
                </pre>
              </div>
              <div className={styles.fileMap}>
                <span>Files you will own</span>
                <ul>
                  {kit.setup.files.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
                <div className={styles.courseKitLinks}>
                  <a href={kit.starterHref} download>
                    {kit.starterLabel}
                  </a>
                  <a href={kit.completeHref} target="_blank" rel="noreferrer">
                    {kit.completeLabel}{" "}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </details>
      ) : null}

      <ol className={styles.stepList}>
        {tutorial.steps.map((step, index) => {
          const stepKey = `${lessonId}:${index}`;
          const isComplete = completedStepKeys.includes(stepKey);

          return (
            <li
              className={styles.tutorialStep}
              data-complete={isComplete}
              key={`${step.file}-${step.title}`}
            >
              <div className={styles.stepNumber} aria-hidden="true">
                {isComplete ? "✓" : String(index + 1).padStart(2, "0")}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeading}>
                  <div>
                    <span>{step.file}</span>
                    <h4>{step.title}</h4>
                  </div>
                </div>
                <p>{step.action}</p>
                <div className={styles.tutorialCode}>
                  <div>
                    <span>{step.file} · working code</span>
                    <CopyButton
                      value={step.code}
                      copyKey={`${lessonId}-${index}`}
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  </div>
                  <pre>
                    <code>{step.code}</code>
                  </pre>
                </div>
                <div className={styles.expectedResult}>
                  <span>Expected result</span>
                  <p>{step.expected}</p>
                  <button
                    className={styles.stepCompleteButton}
                    type="button"
                    aria-pressed={isComplete}
                    onClick={() => onToggleStep(stepKey)}
                  >
                    {isComplete ? "✓ Step complete" : "Mark step complete"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className={styles.validationGrid}>
        <section className={styles.verifyPanel}>
          <span className={styles.sectionLabel}>Verify before moving on</span>
          <ul>
            {tutorial.verify.map((item) => (
              <li key={item}>
                <Check size={13} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.debugPanel}>
          <span className={styles.sectionLabel}>If it does not work</span>
          <dl>
            {tutorial.debug.map((hint) => (
              <div key={hint.symptom}>
                <dt>{hint.symptom}</dt>
                <dd>{hint.fix}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className={styles.productionSources}>
        <div>
          <span className={styles.sectionLabel}>From the shipped system</span>
          <h4>{kit.sourceHeading}</h4>
          <p>{kit.sourceDescription}</p>
        </div>
        <div>
          {tutorial.sources.map((source) => (
            <a
              href={`https://github.com/shantanusoam/portfolio-main/blob/main/${source.path}`}
              key={source.path}
              target="_blank"
              rel="noreferrer"
            >
              <span>{source.label}</span>
              <code>{source.path}</code>
              <p>{source.note}</p>
            </a>
          ))}
          <a
            className={styles.allCourseSource}
            href={kit.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span>Complete course kit</span>
            <code>{kit.repositoryPath}</code>
            <p>{kit.repositoryNote}</p>
          </a>
        </div>
      </section>

      <span className={styles.copyStatus} aria-live="polite">
        {copiedKey ? "Code copied to clipboard." : ""}
      </span>
    </section>
  );
}
