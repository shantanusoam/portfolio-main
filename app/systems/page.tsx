import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { systemsRegistry } from "@/lib/portfolio/evidence";
import styles from "@/components/home/ProofFirstHome.module.css";

export const metadata: Metadata = {
  title: "Systems Lab — Shantanu Soam",
  description: "A playable registry of interface systems, physics experiments, navigation tools, and interaction infrastructure.",
  alternates: { canonical: "/systems" },
};

export default function SystemsPage() {
  return (
    <main className={styles.registryPage}>
      <Navbar />
      <header className={styles.registryHero}>
        <span className={styles.eyebrow}>Systems Lab / Registry index</span>
        <h1>Interfaces with the casing removed.</h1>
        <p>Preview the behavior, inspect how it works, and read the accessibility and performance decisions beside the artifact.</p>
      </header>
      <section className={styles.section} aria-label="System registry">
        <div className={styles.registryGrid}>
          {systemsRegistry.map((entry) => (
            <Link className={styles.registryCard} href={`/systems/${entry.slug}`} key={entry.slug}>
              <div className={styles.registryCardImage}><Image alt={`${entry.name} system artifact`} fill sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw" src={entry.image} /><span className={styles.registryStatus}>{entry.status}</span></div>
              <h3>{entry.name}</h3><p>{entry.description}</p><div className={styles.tags}>{entry.tech.map((item) => <span className={styles.tag} key={item}>{item}</span>)}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
