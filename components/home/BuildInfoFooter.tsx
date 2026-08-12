import Link from "next/link";
import styles from "./ProofFirstHome.module.css";

export default function BuildInfoFooter() {
  return (
    <footer className={styles.buildFooter}>
      <div className={styles.footerMeta}>
        <span>Updated 12.08.2026</span><span>Next.js / TypeScript / Canvas</span><span>Reduced-motion aware</span><span>Performance audit: deploy pending</span>
      </div>
      <Link className={styles.textLink} href="https://github.com/shantanusoam/portfolio-main" target="_blank">View source ↗</Link>
    </footer>
  );
}
