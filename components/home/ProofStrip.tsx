import Link from "next/link";
import { proofMetrics } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

export default function ProofStrip() {
  return (
    <section className={styles.proofSection} id="proof">
      <div className={styles.proofIntro}>
        <p className={styles.eyebrow}>00 / At a glance</p>
        <h2>Proof before promises.</h2>
      </div>
      <div className={styles.proofGrid}>
        {proofMetrics.map((metric) => (
          <Link className={styles.proofCard} href={metric.href} key={metric.label}>
            <span className={styles.proofValue}>{metric.value}</span>
            <span className={styles.proofLabel}>{metric.label}</span>
            <span className={styles.proofContext}>{metric.context} ↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
