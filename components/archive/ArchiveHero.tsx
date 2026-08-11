import styles from "./archive.module.css";

interface ArchiveHeroProps {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  updated?: string;
}

export default function ArchiveHero({
  index,
  eyebrow,
  title,
  description,
  status,
  updated,
}: ArchiveHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroMeta} aria-hidden="true">
        <span className={styles.serial}>Room / {index}</span>
        <span className={styles.heroIndex}>{index}</span>
      </div>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroDescription}>{description}</p>
        <div className={styles.heroFooter}>
          <span className={styles.pulse}>{status}</span>
          {updated ? (
            <span>Last updated {updated}</span>
          ) : (
            <span>Read slowly · return often</span>
          )}
        </div>
      </div>
    </section>
  );
}
