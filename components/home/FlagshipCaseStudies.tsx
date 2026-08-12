"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { flagshipCaseStudies } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

export default function FlagshipCaseStudies() {
  const [views, setViews] = useState<Record<string, "product" | "system">>({});

  return (
    <section className={styles.section} id="case-studies">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>01 / Flagship systems</p>
        <div>
          <h2>Three projects. Decisions included.</h2>
          <p>
            The finished surface is only half the story. Switch on System X-Ray
            to see the boundaries behind each result, then follow the build trace.
          </p>
        </div>
      </header>

      <div className={styles.caseStack}>
        {flagshipCaseStudies.map((study, index) => {
          const view = views[study.id] ?? "product";
          return (
            <article className={styles.caseCard} key={study.id}>
              <div className={styles.caseMain}>
                <div className={styles.caseVisual}>
                  <Image
                    alt={`${study.name} ${view === "system" ? "system" : "product"} artifact`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 980px) 100vw, 45vw"
                    src={view === "system" ? study.systemImage : study.image}
                  />
                  <div className={styles.viewControls} aria-label={`${study.name} view`}>
                    <button
                      aria-pressed={view === "product"}
                      onClick={() => setViews((current) => ({ ...current, [study.id]: "product" }))}
                      type="button"
                    >
                      Product evidence
                    </button>
                    <button
                      aria-pressed={view === "system"}
                      onClick={() => setViews((current) => ({ ...current, [study.id]: "system" }))}
                      type="button"
                    >
                      System X-Ray
                    </button>
                  </div>
                </div>

                <div className={styles.caseCopy}>
                  <p className={styles.caseCategory}>{String(index + 1).padStart(2, "0")} / {study.category}</p>
                  <h3>{study.name}</h3>
                  <p className={styles.caseSummary}>{study.summary}</p>
                  <p className={styles.caseProblem}><strong>Problem:</strong> {study.problem}</p>
                  <div className={styles.caseLists}>
                    <div><strong>Constraints</strong><ul>{study.constraints.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div><strong>Decisions</strong><ul>{study.decisions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div><strong>{view === "system" ? "System layers" : "Shipped results"}</strong><ul>{(view === "system" ? study.systemLayers : study.results).map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </div>
                  <Link className={styles.caseLink} href={study.href}>Read the full debrief ↗</Link>
                </div>
              </div>

              <div className={styles.trace}>
                <div className={styles.traceHeader}>
                  <h4>Build Trace</h4>
                  <span>Problem → shipped result → lesson</span>
                </div>
                <div className={styles.traceGrid}>
                  {study.trace.map((step) => (
                    <div className={styles.traceStep} key={step.label}>
                      <span className={styles.traceLabel}>{step.label}</span>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
