import Link from "next/link";
import Image from "next/image";
import resumeLink from "@/constants/resume";
import courtyardMaster from "@/public/workshop/courtyard-master.png";
import { currentPosition, experienceEvidence } from "@/lib/portfolio/evidence";
import Reveal from "./Reveal";
import { SceneHeader } from "./Scene";
import shared from "./WorkshopShared.module.css";
import styles from "./AboutSection.module.css";

/**
 * Scene 4 — About. Approach in plain language on the left, the employment
 * record as a quiet index on the right. No synthetic portrait: the brief
 * is explicit that a real field photograph would carry more autobiography
 * than an invented one, so until one is supplied, type and structure carry
 * the identity.
 */
export default function AboutSection() {
  return (
    <section className={styles.section} id="about">
      <div className={shared.container}>
        <Reveal>
          <SceneHeader
            index="04"
            label="About"
            tone="ink"
            shift={2}
            title={
              <>
                Kept running, <em>on purpose.</em>
              </>
            }
          />
        </Reveal>

        <div className={styles.grid}>
          <Reveal className={styles.approach} delay={80}>
            <p className={styles.approachLead}>
              I like software the way I like trails: well-maintained, legible,
              and worth the walk.
            </p>
            <p>
              The professional work is business systems — multi-tenant
              platforms, permissions, performance — kept dependable for the
              people who rely on them every day. The lab work is curiosity
              with tools: procedural characters, playable instruments, small
              machines that make invisible rules tangible.
            </p>
            <p>
              Between the two: hiking, field notes, and a habit of taking
              objects apart to learn how they are made — then putting them
              back together with one fewer mystery inside.
            </p>
            <figure className={styles.still}>
              <div className={styles.stillFrame}>
                <Image
                  src={courtyardMaster}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 900px) 100vw, 40vw"
                  style={{ objectFit: "cover", objectPosition: "70% 70%" }}
                />
              </div>
              <figcaption className={styles.stillCaption}>
                Detail of the courtyard illustration — the worktable
              </figcaption>
            </figure>
            <div className={shared.actions}>
              <a
                href={resumeLink}
                target="_blank"
                rel="noreferrer"
                className={shared.btnGhost}
              >
                Read the CV{" "}
                <span aria-hidden="true" className={shared.btnArrow}>
                  ↗
                </span>
              </a>
              <Link href="#contact" className={shared.quietLink}>
                Skip to contact
              </Link>
            </div>
            <p className={styles.availability}>{currentPosition.support}</p>
          </Reveal>

          <Reveal as="div" className={styles.record} delay={160}>
            <p className={shared.monoMeta}>The record, so far</p>
            <ul className={styles.jobs}>
              {experienceEvidence.map((job) => (
                <li key={`${job.company}-${job.period}`}>
                  <Link
                    href={job.href}
                    className={styles.job}
                  >
                    <span className={styles.jobPeriod}>{job.period}</span>
                    <span className={styles.jobMain}>
                      <strong>{job.company}</strong>
                      <em>{job.role}</em>
                      <span className={styles.jobProof}>{job.proof}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className={styles.recordNote}>
              Headings and dates match the CV; project outcomes carry their
              evidence status on each case page.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
