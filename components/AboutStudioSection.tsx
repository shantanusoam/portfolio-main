"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./AboutStudioSection.module.css";

gsap.registerPlugin(ScrollTrigger);

const patches = [
  { src: "/stickers/aboutus/flower.png", className: styles.flower },
  { src: "/stickers/aboutus/paintbrush.png", className: styles.paintbrush },
  { src: "/yarn/stitched-star.webp", className: styles.burst },
  { src: "/stickers/aboutus/pixel-heart.png", className: styles.heart },
  { src: "/stickers/aboutus/terminal-flower.png", className: styles.terminal },
  { src: "/yarn/woven-badge.webp", className: styles.badge },
];

export default function AboutStudioSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isBroken, setIsBroken] = useState(false);

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const context = gsap.context(() => {
      gsap.from(`.${styles.acrylicPanel}`, {
        opacity: 0,
        y: 35,
        scaleX: 0.94,
        duration: 0.95,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
          once: true,
        },
      });

      gsap.from(`.${styles.headingLine}`, {
        opacity: 0,
        y: 28,
        stagger: 0.09,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.content}`,
          start: "top 72%",
          once: true,
        },
      });

      gsap.from(`.${styles.patch}`, {
        opacity: 0,
        scale: 0.78,
        stagger: 0.08,
        duration: 0.72,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.content}`,
          start: "top 76%",
          once: true,
        },
      });

      gsap.fromTo(
        `.${styles.threadPath}`,
        { strokeDashoffset: 1300 },
        {
          strokeDashoffset: 0,
          duration: 2.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: `.${styles.content}`,
            start: "top 76%",
            once: true,
          },
        },
      );
    }, sectionRef);

    return () => context.revert();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} id="about" className={styles.section}>
      {/* <span className={styles.topLabel}>Terminal / Studio</span>
      <span className={styles.sideNote}>
        Handmade
        <br />
        digital
      </span>
      <span className={styles.builtWith}>
        Built with
        <br />
        curiosity
      </span>
      <span className={styles.estb}>
        Estb
        <br />
        forever
      </span>
      <span
        className={`${styles.regMark} ${styles.regLeft}`}
        aria-hidden="true"
      >
        +
      </span>
      <span
        className={`${styles.regMark} ${styles.regRight}`}
        aria-hidden="true"
      >
        +
      </span> */}

      <div
        className={`${styles.acrylicPanel} ${
          isBroken ? styles.brokenPanel : ""
        }`}
      >
        {["tl", "tr", "bl", "br"].map((position) => (
          <span
            key={position}
            className={`${styles.screw} ${styles[position]}`}
            aria-hidden="true"
          />
        ))}
        <div className={styles.panelPhrase}>
          <span>I</span>
          <button
            type="button"
            className={styles.wordSwitch}
            aria-label="Toggle between make and break"
            aria-pressed={isBroken}
            onClick={() => setIsBroken((current) => !current)}
          >
            <span className={styles.wordMeasure}>make</span>
            <span className={styles.makeTop} aria-hidden="true">
              make
            </span>
            <span className={styles.makeBottom} aria-hidden="true">
              make
            </span>
            <span className={styles.breakWord} aria-hidden="true">
              break
            </span>
          </button>
          <span>stuff on the internet</span>
        </div>
        {/* <span className={styles.modeLabel}>
          {isBroken ? "Chaos mode / reversible" : "Hover make / stress test"}
        </span> */}
      </div>

      <svg
        className={styles.threadOverlay}
        viewBox="0 0 1600 940"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className={styles.threadPath}
          d="M225 300 C95 390 150 515 310 510 S510 605 390 710 S250 800 350 835"
        />
        <path
          className={styles.threadPath}
          d="M1360 315 C1490 390 1375 500 1250 520 S1170 660 1400 745"
        />
      </svg>

      {patches.map((patch, index) => (
        <div
          key={patch.src}
          className={`${styles.patch} ${patch.className}`}
          aria-hidden="true"
        >
          <Image
            src={patch.src}
            alt=""
            width={190}
            height={190}
            className={styles.patchImage}
            sizes="(max-width: 850px) 90px, 150px"
          />
          {/* <span className={styles.patchIndex}>
            {String(index + 1).padStart(2, "0")}
          </span> */}
        </div>
      ))}

      <div className={styles.needleAccent} aria-hidden="true">
        <Image
          src="/yarn/needle-thread.webp"
          alt=""
          width={160}
          height={160}
          className={styles.patchImage}
          sizes="120px"
        />
      </div>

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span>• About me</span>
          <strong>Art studio + terminal — same hands</strong>
        </div>

        <h2 className={styles.heading}>
          <span className={styles.headingLine}>
            Paintbrushes taught me taste.
          </span>
          <span className={styles.headingLine}>
            Computers taught me systems.
          </span>
          <span className={styles.headingLine}>I build interfaces where</span>
          <span className={styles.headingLine}>both hands agree.</span>
        </h2>

        <div className={styles.description}>
          <span className={styles.smallRule} />
          <p>
            Pixel-perfect UIs by day.
            <br />
            Paint-stained curiosity by night.
            <br />
            Same hands — just different tools.
          </p>
        </div>
      </div>
{/* 
      <span className={`${styles.figureLabel} ${styles.figureOne}`}>
        + FIG. 01
      </span>
      <span className={`${styles.figureLabel} ${styles.figureTwo}`}>
        + FIG. 02
      </span>
      <span className={styles.coordinate}>
        28.6139° N
        <br />
        77.2090° E
      </span> */}
      {/* <span className={styles.gridLabel}>Grid 24px</span> */}
      <span className={styles.footerTag}>
        <i aria-hidden="true" />
        Creative systems
      </span>
    </section>
  );
}
