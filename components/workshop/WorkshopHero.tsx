"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { WS_MOTION_BUSY } from "./WorkingSketch";
import resumeLink from "@/constants/resume";
import shared from "./WorkshopShared.module.css";
import styles from "./WorkshopHero.module.css";

import courtyardMaster from "@/public/workshop/courtyard-master.png";

/**
 * The one ambient loop (brief §11 V1): leaves in a gentle breeze on the
 * approved master, camera locked, seamless. The still master is the poster
 * and the fallback — if the loop is absent the page shows the still and the
 * pause control disappears (nothing is moving; a pause button would lie).
 *
 * Null for V1: the provider lost the submitted job (status endpoint 404) and
 * the brief's asset budget allows exactly one loop attempt — "a weak loop is
 * replaced by the approved still" (brief §12). Flip this back when a loop
 * that survives the three-view seam check exists.
 */
const AMBIENT_LOOP: string | null = null;

/**
 * Scene 0 — Introduction. A magazine-cover opening, not a product hero:
 * the statement speaks in Newsreader, the courtyard illustration holds the
 * world, and mono field labels carry the metadata. Copy per the brief:
 * stable headline, two primary actions, one quiet utility link.
 */
export default function WorkshopHero() {
  // The ambient loop is the page's only constant motion, so the pause
  // control rides with its caption (brief §7: visible pause control).
  // The Lab's working sketch asks the breeze to hold while it is active.
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const loopRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onBusy = (event: Event) =>
      setBusy(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(WS_MOTION_BUSY, onBusy);
    return () => window.removeEventListener(WS_MOTION_BUSY, onBusy);
  }, []);

  // The still master carries the world; the loop only haunts the leaves.
  const loopShouldPlay = AMBIENT_LOOP !== null && !paused && !busy;
  useEffect(() => {
    const video = loopRef.current;
    if (!video) return;
    if (loopShouldPlay) {
      video.play().catch(() => undefined); // autoplay policies: stay silent
    } else {
      video.pause();
    }
  }, [loopShouldPlay]);

  return (
    <section className={styles.hero} id="top">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <Reveal immediate>
            <p className={styles.eyebrow}>
              Shantanu Soam <span aria-hidden="true">·</span> Full-stack
              engineer <span aria-hidden="true">·</span> Creative technologist
            </p>
          </Reveal>

          <Reveal delay={90} immediate>
            <h1 className={styles.headline}>
              Useful software.{" "}
              <em className={styles.hope}>A&nbsp;future worth building.</em>
            </h1>
          </Reveal>

          <Reveal delay={180} immediate>
            <p className={styles.lede}>
              I build business software, interactive tools and playful
              experiments — and I keep them running. This page is a workshop:
              look around, touch the machines, take what&apos;s useful.
            </p>
          </Reveal>

          <Reveal delay={260} immediate>
            <div className={shared.actions}>
              <a href="#work" className={shared.btn}>
                View my work
                <span className={shared.btnArrow} aria-hidden="true">
                  →
                </span>
              </a>
              <a href="#contact" className={shared.btnGhost}>
                Get in touch
              </a>
              <a
                href={resumeLink}
                target="_blank"
                rel="noreferrer"
                className={shared.quietLink}
              >
                CV
              </a>
            </div>
          </Reveal>

          <Reveal delay={340} immediate>
            <p className={styles.status}>
              Currently — Staff Engineer, Knowbuild · Based in India · Open to
              selected collaborations
            </p>
          </Reveal>
        </div>

        <Reveal as="figure" delay={160} immediate className={styles.art}>
          <div className={styles.artFrame}>
            {AMBIENT_LOOP ? (
              <video
                ref={loopRef}
                className={styles.loop}
                poster={courtyardMaster.src}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src={AMBIENT_LOOP} type="video/mp4" />
              </video>
            ) : (
              <Image
                src={courtyardMaster}
                alt="Illustrated courtyard workshop — a shaded worktable with a repairable electronic enclosure under a solar canopy, jaali lattice shadows across the stone floor, morning light from the upper left"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 42vw"
                style={{ objectFit: "cover", objectPosition: "58% 50%" }}
              />
            )}
            <span className={styles.cropTL} aria-hidden="true" />
            <span className={styles.cropBR} aria-hidden="true" />
          </div>
          <figcaption className={styles.caption}>
            <span>
              Tomorrow&apos;s Workshop <em>— an imagined courtyard · illustration</em>
            </span>
            {AMBIENT_LOOP ? (
              <button
                type="button"
                className={styles.pause}
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
              >
                <span className={styles.pauseDot} aria-hidden="true" />
                {paused ? "Resume motion" : "Pause motion"}
              </button>
            ) : null}
          </figcaption>
        </Reveal>
      </div>

      <p className={styles.vertNote} aria-hidden="true">
        27.02°N — morning light, upper left
      </p>
    </section>
  );
}
