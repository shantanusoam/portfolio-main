"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function BuildInfoFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!footerRef.current || prefersReducedMotion) return;
    const context = gsap.context(() => {
      gsap.from(`.${styles.footerMeta} span`, {
        opacity: 0,
        stagger: 0.04,
        duration: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 92%",
          once: true,
        },
      });
    }, footerRef);
    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <footer ref={footerRef} className={styles.buildFooter}>
      <div className={styles.footerMeta}>
        <span>Living build / shipped continuously</span>
        <span>Next.js / TypeScript / Canvas</span>
        <span>Explore + Focus modes</span>
        <span>Source-linked evidence</span>
      </div>
      <Link
        className={styles.textLink}
        href="https://github.com/shantanusoam/portfolio-main"
        rel="noreferrer"
        target="_blank"
      >
        View source ↗
      </Link>
    </footer>
  );
}
