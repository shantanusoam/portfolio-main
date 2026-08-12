import Link from "next/link";
import styles from "./ProofFirstHome.module.css";

export default function CredibilityPanel() {
  return (
    <section className={styles.section} aria-labelledby="credibility-title">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>05 / Credibility</p>
        <div>
          <h2 id="credibility-title">Signals that can be checked.</h2>
          <p>No invented testimonials, vanity counters, or borrowed logos. These links point to public work and named engagements.</p>
        </div>
      </header>
      <div className={styles.credibilityGrid}>
        <article className={styles.credibilityCard}>
          <span className={styles.eyebrow}>Public engineering</span>
          <h3>Code, package, and build history.</h3>
          <ul className={styles.credibilityList}>
            <li>dnd-dynamic-tree is publicly installable through npm.</li>
            <li>The portfolio and its interactive systems are visible on GitHub.</li>
            <li>Systems Lab records distinguish live, documented, and prototype work.</li>
          </ul>
          <Link className={styles.textLink} href="https://github.com/shantanusoam" target="_blank">Inspect GitHub ↗</Link>
        </article>
        <article className={styles.credibilityCard}>
          <span className={styles.eyebrow}>Named engagements</span>
          <h3>Employment evidence, not anonymous praise.</h3>
          <ul className={styles.credibilityList}>
            <li>Knowbuild — multi-tenant CRM/ERP modernization.</li>
            <li>Niva Bupa — performance, security, and release resilience.</li>
            <li>Mobikasa, The Tarzan Way, and KAL Group — shipped product systems.</li>
          </ul>
          <Link className={styles.textLink} href="/#trail-map">Follow the trail ↗</Link>
        </article>
      </div>
    </section>
  );
}
