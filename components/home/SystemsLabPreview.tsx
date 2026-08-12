import Image from "next/image";
import Link from "next/link";
import { systemsRegistry } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

export default function SystemsLabPreview() {
  return (
    <section className={styles.section} id="systems-lab">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>02 / Systems Lab</p>
        <div>
          <h2>A playable registry, not a trophy shelf.</h2>
          <p>Each experiment exposes how it works, accessibility decisions, performance notes, a live preview, and source when public.</p>
          <Link className={styles.textLink} href="/systems">Open all registry records ↗</Link>
        </div>
      </header>
      <div className={styles.registryGrid}>
        {systemsRegistry.slice(0, 8).map((entry) => (
          <Link className={styles.registryCard} href={`/systems/${entry.slug}`} key={entry.slug}>
            <div className={styles.registryCardImage}>
              <Image alt={`${entry.name} conceptual system artifact`} fill sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw" src={entry.image} />
              <span className={styles.registryStatus}>{entry.status}</span>
            </div>
            <h3>{entry.name}</h3>
            <p>{entry.description}</p>
            <div className={styles.tags}>{entry.tech.map((item) => <span className={styles.tag} key={item}>{item}</span>)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
