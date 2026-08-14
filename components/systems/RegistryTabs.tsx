"use client";

import Link from "next/link";
import { useState } from "react";
import type { SystemRegistryEntry } from "@/lib/portfolio/evidence";
import styles from "@/components/home/ProofFirstHome.module.css";

const allTabs = [
  "preview",
  "model",
  "how",
  "accessibility",
  "performance",
  "reading",
  "install",
] as const;
type Tab = (typeof allTabs)[number];

export default function RegistryTabs({
  entry,
}: {
  entry: SystemRegistryEntry;
}) {
  const [active, setActive] = useState<Tab>("preview");
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const selectedStep = entry.diagram?.[activeStep] ?? entry.diagram?.[0];
  const tabs: Tab[] = entry.relatedReading?.length
    ? [...allTabs]
    : allTabs.filter((tab) => tab !== "reading");

  const copy = async () => {
    await navigator.clipboard.writeText(entry.usage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label={`${entry.name} documentation`}
      >
        {tabs.map((tab) => (
          <button
            className={styles.tabButton}
            aria-selected={active === tab}
            key={tab}
            onClick={() => setActive(tab)}
            role="tab"
            type="button"
          >
            {tab === "how"
              ? "How it works"
              : tab === "model"
                ? "Build map"
                : tab === "reading"
                  ? "Deep dives"
                  : tab}
          </button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        {active === "preview" ? (
          <>
            <h2>Why this exists</h2>
            <div className={styles.registryAnswerGrid}>
              <div>
                <span>Why</span>
                <p>{entry.why}</p>
              </div>
              <div>
                <span>Difficult</span>
                <p>{entry.difficult}</p>
              </div>
              <div>
                <span>Learned</span>
                <p>{entry.learned}</p>
              </div>
            </div>
            <Link className={styles.registryLink} href={entry.previewHref}>
              Open the live system ↗
            </Link>
          </>
        ) : null}
        {active === "model" ? (
          <>
            <h2>Build map</h2>
            {entry.diagram ? (
              <div className={styles.modelDiagram}>
                <div className={styles.modelSteps}>
                  {entry.diagram.map((step, index) => (
                    <button
                      aria-pressed={index === activeStep}
                      key={`${step.label}-${step.title}`}
                      onClick={() => setActiveStep(index)}
                      type="button"
                    >
                      <span>{step.label}</span>
                      <strong>{step.title}</strong>
                    </button>
                  ))}
                </div>
                {selectedStep ? (
                  <div className={styles.modelDetail}>
                    <span>{selectedStep.label}</span>
                    <h3>{selectedStep.title}</h3>
                    <p>{selectedStep.detail}</p>
                    {selectedStep.build ? (
                      <div className={styles.modelBuild}>
                        <strong>Build this layer</strong>
                        <ol>
                          {selectedStep.build.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    {selectedStep.checkpoint ? (
                      <div className={styles.modelCheckpoint}>
                        <strong>Proof checkpoint</strong>
                        <p>{selectedStep.checkpoint}</p>
                      </div>
                    ) : null}
                    {selectedStep.files ? (
                      <div className={styles.modelFiles}>
                        <strong>Files</strong>
                        <div>
                          {selectedStep.files.map((file) => (
                            <code key={file}>{file}</code>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <p>
                This system uses the standard registry model: preview,
                implementation notes, access behavior, performance notes, and
                source when available.
              </p>
            )}
          </>
        ) : null}
        {active === "how" ? (
          <>
            <h2>How it works</h2>
            <ul className={styles.registryDetailList}>
              {entry.how.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {active === "accessibility" ? (
          <>
            <h2>Accessibility</h2>
            <ul className={styles.registryDetailList}>
              {entry.accessibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {active === "performance" ? (
          <>
            <h2>Performance</h2>
            <ul className={styles.registryDetailList}>
              {entry.performance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {entry.measurements ? (
              <div className={styles.measurementGrid}>
                {entry.measurements.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <p>{item.note}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {entry.debugRecording ? (
              <p className={styles.debugRecording}>{entry.debugRecording}</p>
            ) : null}
          </>
        ) : null}
        {active === "reading" ? (
          <>
            <h2>Deep dives</h2>
            <div className={styles.relatedReading}>
              {entry.relatedReading?.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span>Build guide</span>
                  <strong>{item.title}</strong>
                  <p>{item.note}</p>
                </Link>
              ))}
            </div>
          </>
        ) : null}
        {active === "install" ? (
          <>
            <h2>Copy / install</h2>
            <div className={styles.installCommand}>
              <code>{entry.usage}</code>
              <button onClick={copy} type="button">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {entry.sourceHref ? (
              <Link
                className={styles.registryLink}
                href={entry.sourceHref}
                target="_blank"
              >
                Inspect source ↗
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
