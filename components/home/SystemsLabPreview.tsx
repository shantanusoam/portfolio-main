"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { systemsRegistry } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function SystemsLabPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.registryCard}`);
      gsap.from(cards, {
        opacity: 0,
        y: 26,
        stagger: { each: 0.06, grid: "auto", from: "start" },
        duration: 0.7,
        ease: "power3.out",
        onComplete: () => gsap.set(cards, { clearProps: "transform" }),
        scrollTrigger: {
          trigger: `.${styles.registryGrid}`,
          start: "top 84%",
          once: true,
        },
      });
    }, sectionRef);
    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} className={styles.section} id="systems-lab">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>02 / Systems Lab</p>
        <div>
          <h2>A playable registry, not a trophy shelf.</h2>
          <p>
            Each experiment exposes how it works, accessibility decisions,
            performance notes, a live preview, and source when public.
          </p>
          <Link className={styles.textLink} href="/systems">
            Open all registry records ↗
          </Link>
        </div>
      </header>
      <div className={styles.registryGrid}>
        {systemsRegistry.slice(0, 8).map((entry) => (
          <Link
            className={styles.registryCard}
            href={`/systems/${entry.slug}`}
            key={entry.slug}
          >
            <div className={styles.registryCardImage}>
              <Image
                alt={`${entry.name} conceptual system artifact`}
                fill
                sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw"
                src={entry.image}
              />
              <span
                className={`${styles.registryStatus} ${
                  entry.status === "live" ? styles.registryStatusLive : ""
                }`}
              >
                {entry.status}
              </span>
            </div>
            <h3>{entry.name}</h3>
            <p>{entry.description}</p>
            <div className={styles.tags}>
              {entry.tech.map((item) => (
                <span className={styles.tag} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
