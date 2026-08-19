"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { currentPosition } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function CurrentPosition() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });
      timeline
        .from(`.${styles.currentBody}`, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.95,
          ease: "power3.inOut",
        })
        .from(
          `.${styles.currentSupport}`,
          { opacity: 0, y: 12, duration: 0.48, ease: "power2.out" },
          "-=0.3",
        );
    }, sectionRef);
    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={styles.currentBand}
      aria-label="Current focus"
    >
      <p className={`${styles.eyebrow} ${styles.currentEyebrow}`}>
        <span className={styles.statusBeacon} aria-hidden="true" />
        00.5 / Currently
      </p>
      <div>
        <p className={styles.currentBody}>{currentPosition.body}</p>
        <p className={styles.currentSupport}>{currentPosition.support}</p>
      </div>
    </section>
  );
}
