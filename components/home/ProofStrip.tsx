"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { proofMetrics } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function ProofStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.proofCard}`);
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 84%",
          once: true,
        },
      });
      timeline
        .from(`.${styles.proofIntro} > *`, {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.58,
          ease: "power3.out",
        })
        .from(
          cards,
          {
            opacity: 0,
            y: 28,
            stagger: 0.075,
            duration: 0.72,
            ease: "power3.out",
            onComplete: () => gsap.set(cards, { clearProps: "transform" }),
          },
          "-=0.28",
        )
        .from(
          `.${styles.proofMeasure}`,
          {
            scaleX: 0,
            transformOrigin: "left center",
            stagger: 0.075,
            duration: 0.52,
            ease: "power2.inOut",
          },
          "-=0.48",
        );
    }, sectionRef);
    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} className={styles.proofSection} id="proof">
      <div className={styles.proofIntro}>
        <p className={styles.eyebrow}>00 / At a glance</p>
        <h2>Proof before promises.</h2>
      </div>
      <div className={styles.proofGrid}>
        {proofMetrics.map((metric) => (
          <Link
            className={styles.proofCard}
            href={metric.href}
            key={metric.label}
          >
            <span className={styles.proofValue}>{metric.value}</span>
            <span className={styles.proofMeasure} aria-hidden="true" />
            <span className={styles.proofLabel}>{metric.label}</span>
            <span className={styles.proofContext}>{metric.context} ↗</span>
            <span className={styles.evidenceNote}>
              <strong>Evidence note</strong>
              {metric.evidenceNote}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
