import Link from "next/link";
import { experienceEvidence } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

export default function EvidenceExperience() {
  return (
    <section className={styles.section} id="trail-map">
      <header className={styles.sectionHeading}>
        <p className={styles.eyebrow}>03 / Experience</p>
        <div>
          <h2>Every role links to evidence.</h2>
          <p>A compact career trail for a 60-second scan, with the systems and outcomes attached instead of a disconnected technology cloud.</p>
        </div>
      </header>
      <div className={styles.experienceList}>
        {experienceEvidence.map((item) => (
          <div className={styles.experienceRow} key={`${item.company}-${item.period}`}>
            <div><h3>{item.company}</h3><span className={styles.experiencePeriod}>{item.period}</span></div>
            <p className={styles.experienceRole}>{item.role}</p>
            <p className={styles.experienceProof}>{item.proof}</p>
            <Link className={styles.textLink} href={item.href}>Evidence ↗</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
