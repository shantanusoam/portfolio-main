"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared bridge choreography for the proof journey. Individual sections own
 * their distinctive content motion; this layer gives headings one consistent
 * handoff motif so the middle of the homepage reads as a designed sequence.
 */
export default function ProofJourneyMotion() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const root = document.querySelector("main");
    if (!root) return;

    const context = gsap.context(() => {
      const headings = gsap.utils.toArray<HTMLElement>(
        `.${styles.sectionHeading}`,
      );

      headings.forEach((heading) => {
        const eyebrow = heading.querySelector(`.${styles.eyebrow}`);
        const title = heading.querySelector("h2");
        const supporting = heading.querySelectorAll("div > p, div > a");
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: heading,
            start: "top 86%",
            once: true,
          },
        });

        timeline
          .fromTo(
            heading,
            { "--heading-signal-scale": 0 },
            {
              "--heading-signal-scale": 1,
              duration: 0.72,
              ease: "power3.inOut",
            },
          )
          .from(
            eyebrow,
            { opacity: 0, x: -16, duration: 0.48, ease: "power3.out" },
            0.08,
          )
          .from(
            title,
            {
              clipPath: "inset(0 0 100% 0)",
              y: 28,
              duration: 0.86,
              ease: "power4.out",
            },
            0.05,
          )
          .from(
            supporting,
            {
              opacity: 0,
              y: 12,
              stagger: 0.08,
              duration: 0.5,
              ease: "power2.out",
            },
            "-=0.42",
          );
      });
    }, root);

    return () => context.revert();
  }, [prefersReducedMotion]);

  return null;
}
