import { currentPosition } from "@/lib/portfolio/evidence";
import styles from "./ProofFirstHome.module.css";

export default function CurrentPosition() {
  return (
    <section className={styles.currentBand} aria-label="Current focus">
      <p className={styles.eyebrow}>00.5 / Currently</p>
      <div>
        <p className={styles.currentBody}>{currentPosition.body}</p>
        <p className={styles.currentSupport}>{currentPosition.support}</p>
      </div>
    </section>
  );
}
