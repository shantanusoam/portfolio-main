"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import resumeLink from "@/constants/resume";
import styles from "./ProofFirstHome.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function ContactAvailability() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    const context = gsap.context(() => {
      const image = sectionRef.current?.querySelector(
        `.${styles.contactVisual} img`,
      );
      if (image) {
        gsap.fromTo(
          image,
          { yPercent: -4, scale: 1.06 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });
      timeline
        .from(
          `.${styles.contactCopy} > :not(.${styles.contactLinks}):not(.${styles.contactMeta})`,
          {
            opacity: 0,
            y: 16,
            stagger: 0.08,
            duration: 0.56,
            ease: "power3.out",
          },
        )
        .from(
          `.${styles.contactLink}`,
          {
            opacity: 0,
            y: 10,
            stagger: 0.055,
            duration: 0.42,
            ease: "power2.out",
          },
          "-=0.3",
        )
        .from(
          `.${styles.contactMeta} span`,
          { opacity: 0, stagger: 0.04, duration: 0.3, ease: "none" },
          "-=0.18",
        );
    }, sectionRef);
    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={styles.contactSection}
      id="availability"
    >
      <div className={styles.contactVisual}>
        <Image
          alt="Vermilion maker field kit representing collaboration"
          height={900}
          width={900}
          src="/proof-assets/evidence/contact-kit.webp"
        />
      </div>
      <div className={styles.contactCopy}>
        <span className={styles.eyebrow}>
          Open a line / Available for the right system
        </span>
        <h2>Let&apos;s make something hard feel obvious.</h2>
        <p>
          Product engineering, creative tooling, frontend systems, agent
          interfaces, or the strange prototype nobody else quite knows how to
          begin.
        </p>
        <div className={styles.contactLinks}>
          <a
            className={styles.contactLink}
            href="mailto:shantanu.singh.soam@gmail.com"
          >
            Discuss a system
          </a>
          <a
            className={styles.contactLink}
            href={resumeLink}
            rel="noreferrer"
            target="_blank"
          >
            View résumé
          </a>
          <a className={styles.contactLink} href="/shantanu-soam.vcf" download>
            Save contact
          </a>
          <Link
            className={styles.contactLink}
            href="https://www.linkedin.com/in/shantanu007/"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </Link>
          <Link
            className={styles.contactLink}
            href="https://github.com/shantanusoam"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </Link>
        </div>
        <div className={styles.contactMeta}>
          <span>IST / remote overlap</span>
          <span>India-based</span>
          <span>Sound off by default</span>
          <span>Keyboard friendly</span>
        </div>
      </div>
    </section>
  );
}
