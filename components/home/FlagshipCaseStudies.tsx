"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { flagshipCaseStudies } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function FlagshipCaseStudies() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [views, setViews] = useState<Record<string, "product" | "system">>({});

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.caseCard}`);
      cards.forEach((card) => {
        const traceSteps = card.querySelectorAll(`.${styles.traceStep}`);
        const tracePath = card.querySelector(`.${styles.tracePath}`);
        const images = card.querySelectorAll(`.${styles.caseVisual} img`);
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 78%",
            once: true,
          },
        });
        timeline
          .from(card, {
            opacity: 0,
            y: 36,
            duration: 0.82,
            ease: "power3.out",
            onComplete: () => gsap.set(card, { clearProps: "transform" }),
          })
          .from(
            traceSteps,
            {
              opacity: 0,
              y: 14,
              stagger: 0.055,
              duration: 0.44,
              ease: "power2.out",
            },
            "-=0.34",
          );
        if (tracePath) {
          timeline.fromTo(
            tracePath,
            { strokeDashoffset: 1040 },
            {
              strokeDashoffset: 0,
              duration: 1.35,
              ease: "power2.inOut",
            },
            "-=0.58",
          );
        }
        if (images.length) {
          gsap.fromTo(
            images,
            { yPercent: -3, scale: 1.06 },
            {
              yPercent: 3,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            },
          );
        }
      });
    }, sectionRef);
    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} className={styles.section} id="case-studies">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>01 / Flagship systems</p>
        <div>
          <h2>Three projects. Decisions included.</h2>
          <p>
            The finished surface is only half the story. Switch on System X-Ray
            to see the boundaries behind each result, then follow the build
            trace.
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
                    className={`${styles.caseImage} ${
                      view === "product" ? styles.caseImageActive : ""
                    }`}
                    alt={
                      view === "product" ? `${study.name} product artifact` : ""
                    }
                    aria-hidden={view !== "product"}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 980px) 100vw, 45vw"
                    src={study.image}
                  />
                  <Image
                    className={`${styles.caseImage} ${
                      view === "system" ? styles.caseImageActive : ""
                    }`}
                    alt={
                      view === "system" ? `${study.name} system artifact` : ""
                    }
                    aria-hidden={view !== "system"}
                    fill
                    sizes="(max-width: 980px) 100vw, 45vw"
                    src={study.systemImage}
                  />
                  <div
                    className={styles.viewControls}
                    aria-label={`${study.name} view`}
                  >
                    <button
                      aria-pressed={view === "product"}
                      onClick={() =>
                        setViews((current) => ({
                          ...current,
                          [study.id]: "product",
                        }))
                      }
                      type="button"
                    >
                      Product evidence
                    </button>
                    <button
                      aria-pressed={view === "system"}
                      onClick={() =>
                        setViews((current) => ({
                          ...current,
                          [study.id]: "system",
                        }))
                      }
                      type="button"
                    >
                      System X-Ray
                    </button>
                  </div>
                </div>

                <div className={styles.caseCopy}>
                  <p className={styles.caseCategory}>
                    {String(index + 1).padStart(2, "0")} / {study.category}
                  </p>
                  <h3>{study.name}</h3>
                  <p className={styles.caseSummary}>{study.summary}</p>
                  <p className={styles.caseProblem}>
                    <strong>Problem:</strong> {study.problem}
                  </p>
                  <div className={styles.caseLists}>
                    <div>
                      <strong>Constraints</strong>
                      <ul>
                        {study.constraints.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Decisions</strong>
                      <ul>
                        {study.decisions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>
                        {view === "system"
                          ? "System layers"
                          : "Shipped results"}
                      </strong>
                      <ul>
                        {(view === "system"
                          ? study.systemLayers
                          : study.results
                        ).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Link className={styles.caseLink} href={study.href}>
                    Read the full debrief ↗
                  </Link>
                </div>
              </div>

              <div className={styles.trace}>
                <div className={styles.traceHeader}>
                  <h4>Build Trace</h4>
                  <span>Problem → shipped result → lesson</span>
                </div>
                <svg
                  className={styles.traceSignal}
                  viewBox="0 0 1000 28"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className={styles.tracePath}
                    d="M4 18 C130 4 214 25 342 13 S576 4 696 17 S872 24 996 8"
                    pathLength="1040"
                  />
                </svg>
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
