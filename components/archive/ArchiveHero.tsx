import Image from "next/image";
import styles from "./archive.module.css";

interface ArchiveHeroProps {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  updated?: string;
  artwork: {
    src: string;
    alt: string;
    label: string;
  };
}

export default function ArchiveHero({
  index,
  eyebrow,
  title,
  description,
  status,
  updated,
  artwork,
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
      <figure className={styles.heroArtwork}>
        <Image
          src={artwork.src}
          alt={artwork.alt}
          fill
          priority
          sizes="(max-width: 760px) 92vw, (max-width: 1200px) 38vw, 520px"
        />
        <figcaption>
          <span>{artwork.label}</span>
          <span aria-hidden="true">↘</span>
        </figcaption>
      </figure>
    </section>
  );
}
