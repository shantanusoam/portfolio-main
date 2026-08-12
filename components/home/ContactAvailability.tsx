import Image from "next/image";
import Link from "next/link";
import resumeLink from "@/constants/resume";
import styles from "./ProofFirstHome.module.css";

export default function ContactAvailability() {
  return (
    <section className={styles.contactSection} id="availability">
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
            href="mailto:contact.shantanu.soam@gmail.com"
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
            href="https://www.linkedin.com/in/shantanusoam/"
            target="_blank"
          >
            LinkedIn
          </Link>
          <Link
            className={styles.contactLink}
            href="https://github.com/shantanusoam"
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
