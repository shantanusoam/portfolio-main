import Image from "next/image";
import Reveal from "./Reveal";
import { SceneHeader } from "./Scene";
import courtyardMaster from "@/public/workshop/courtyard-master.png";
import shared from "./WorkshopShared.module.css";
import styles from "./WorkshopContact.module.css";

/**
 * Scene 5 — Contact. The closing statement, oversized; one obvious route to
 * a conversation; plain links; an honest footer that says what the imagery
 * is. The finale stays quiet — a workshop signs off by turning off the
 * machines, not with fireworks.
 */

const SOCIAL_LINKS = [
  { href: "https://github.com/shantanusoam", label: "GitHub" },
  { href: "https://www.linkedin.com/in/shantanu007/", label: "LinkedIn" },
  { href: "https://twitter.com/Shanntanusoam", label: "Twitter" },
];

export default function WorkshopContact() {
  return (
    <section className={styles.section} id="contact">
      <div className={shared.container}>
        <Reveal>
          <SceneHeader
            index="05"
            label="Contact"
            title={
              <>
                The bench is <em>free.</em>
              </>
            }
          />
        </Reveal>

        <p className={styles.marginNote} aria-hidden="true">
          REPLIES FROM THE BENCH · 27.02°N
        </p>

        <Reveal delay={60}>
          <figure className={styles.jaaliBand}>
            <div className={styles.jaaliBandFrame}>
              <Image
                src={courtyardMaster}
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "8% 82%" }}
              />
            </div>
            <figcaption className={styles.jaaliBandCaption}>
              Detail of the courtyard illustration — jaali shadow on the
              morning floor
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={100}>
          <p className={styles.statement}>
            Bring a problem you care about —{" "}
            <em>a system to rescue, a tool to build, an interface worth
            enjoying.</em>{" "}
            The useful version starts with a conversation.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <a href="mailto:shantanu.singh.soam@gmail.com" className={styles.email}>
            shantanu.singh.soam@gmail.com
            <span className={styles.emailArrow} aria-hidden="true">
              →
            </span>
          </a>
        </Reveal>

        <Reveal delay={240}>
          <div className={styles.footerRow}>
            <div className={styles.socials}>
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className={shared.quietLink}
                >
                  {social.label} ↗
                </a>
              ))}
            </div>
            <p className={styles.availability}>
              Based in India · Open to senior product-engineering,
              frontend-systems and selected design-engineering collaborations
            </p>
          </div>
        </Reveal>
      </div>

      <footer className={styles.footer}>
        <div className={shared.container}>
          <p className={styles.footerMeta}>
            <span>© 2026 Shantanu Soam</span>
            <span aria-hidden="true">·</span>
            <span>Tomorrow&apos;s Workshop</span>
            <span aria-hidden="true">·</span>
            <span>Set in Newsreader &amp; Inter</span>
            <span aria-hidden="true">·</span>
            <span>The courtyard is an illustration of an imagined place</span>
          </p>
        </div>
      </footer>
    </section>
  );
}
