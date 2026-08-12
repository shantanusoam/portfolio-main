"use client";

import Link from "next/link";
import { useState } from "react";
import type { SystemRegistryEntry } from "@/lib/portfolio/evidence";
import styles from "@/components/home/ProofFirstHome.module.css";

const tabs = ["preview", "how", "accessibility", "performance", "install"] as const;
type Tab = (typeof tabs)[number];

export default function RegistryTabs({ entry }: { entry: SystemRegistryEntry }) {
  const [active, setActive] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(entry.usage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label={`${entry.name} documentation`}>
        {tabs.map((tab) => (
          <button className={styles.tabButton} aria-selected={active === tab} key={tab} onClick={() => setActive(tab)} role="tab" type="button">{tab === "how" ? "How it works" : tab}</button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        {active === "preview" ? <><h2>Live preview</h2><p>This record keeps documentation lightweight; the real system stays on its original route.</p><Link className={styles.registryLink} href={entry.previewHref}>Open the live system ↗</Link></> : null}
        {active === "how" ? <><h2>How it works</h2><ul className={styles.registryDetailList}>{entry.how.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        {active === "accessibility" ? <><h2>Accessibility</h2><ul className={styles.registryDetailList}>{entry.accessibility.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        {active === "performance" ? <><h2>Performance</h2><ul className={styles.registryDetailList}>{entry.performance.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        {active === "install" ? <><h2>Copy / install</h2><div className={styles.installCommand}><code>{entry.usage}</code><button onClick={copy} type="button">{copied ? "Copied" : "Copy"}</button></div>{entry.sourceHref ? <Link className={styles.registryLink} href={entry.sourceHref} target="_blank">Inspect source ↗</Link> : null}</> : null}
      </div>
    </>
  );
}
