import type { Metadata } from "next";
import Link from "next/link";
import ProceduralCharacter from "@/components/procedural-character/ProceduralCharacter";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Soft Procedural Octopus Lab",
  description:
    "A fluid octopus driven by planted feet, FABRIK reach constraints and Verlet spring tentacles.",
};

interface OctopodLabPageProps {
  searchParams?: { debug?: string };
}

export default function OctopodLabPage({ searchParams }: OctopodLabPageProps) {
  const debug = searchParams?.debug === "1";

  return (
    <main className={styles.page}>
      <div
        className={styles.floatingPlatform}
        data-character-platform
        aria-hidden="true"
      />
      <ProceduralCharacter spec={octopodPreset} debug={debug} />

      <header className={styles.titlebar}>
        <p className={styles.eyebrow}>Page-surface procedural locomotion</p>
        <h1>Spring octopus</h1>
        <p>Move above it to jump. Move sideways to make it scuttle.</p>
      </header>

      <section className={styles.deck} data-character-platform>
        <p>Point anywhere on the page…</p>
        <div className={styles.deckControls}>
          <span>8 world-locked feet</span>
          <span>FABRIK + lifted steps</span>
          <Link
            className={styles.debugLink}
            href={debug ? "/octopod-lab" : "/octopod-lab?debug=1"}
          >
            {debug ? "Hide rig" : "Show rig"}
          </Link>
        </div>
      </section>

      <p className={styles.hint}>walk · hop · land · turn</p>
    </main>
  );
}
