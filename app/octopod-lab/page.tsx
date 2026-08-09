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
      <div className={styles.ambient} aria-hidden="true" />
      <ProceduralCharacter spec={octopodPreset} debug={debug} />

      <section className={styles.instructions}>
        <div>
          <p className={styles.eyebrow}>Soft-body motion study</p>
          <h1>Spring octopus</h1>
        </div>
        <p>
          Sweep the pointer, reverse suddenly, then draw tight loops. The feet
          stay planted while each visible arm trails its IK guide like an
          elastic ribbon.
        </p>
        <Link
          className={styles.debugLink}
          href={debug ? "/octopod-lab" : "/octopod-lab?debug=1"}
        >
          {debug ? "Hide physics rig" : "Show physics rig"}
        </Link>
      </section>

      <p className={styles.hint}>move anywhere · stop sharply · reverse</p>
    </main>
  );
}
