import type { Metadata } from "next";
import Link from "next/link";
import ProceduralCharacter from "@/components/procedural-character/ProceduralCharacter";
import { jellyPreset } from "@/lib/procedural-character/presets/jelly";
import { mantaPreset } from "@/lib/procedural-character/presets/manta";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import type { CharacterSpec } from "@/lib/procedural-character/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Procedural Creature Lab",
  description:
    "Compare planted IK limbs, area-preserving soft bodies, and trailing Verlet chains.",
};

const CREATURES: Record<string, CharacterSpec> = {
  manta: mantaPreset,
  jelly: jellyPreset,
  octopus: octopodPreset,
};

interface CreatureLabPageProps {
  searchParams?: { creature?: string; debug?: string };
}

export default function CreatureLabPage({
  searchParams,
}: CreatureLabPageProps) {
  const creatureId = searchParams?.creature ?? "manta";
  const selectedId = CREATURES[creatureId] ? creatureId : "manta";
  const spec = CREATURES[selectedId];
  const debug = searchParams?.debug === "1";
  const debugQuery = debug ? "&debug=1" : "";

  return (
    <main className={styles.page} data-creature={selectedId}>
      <div className={styles.ambient} aria-hidden="true" />
      {selectedId === "octopus" ? (
        <>
          <div
            className={styles.octopusPerch}
            data-character-platform
            aria-hidden="true"
          />
          <div
            className={styles.octopusDeck}
            data-character-platform
            aria-hidden="true"
          />
        </>
      ) : null}
      <ProceduralCharacter spec={spec} debug={debug} />

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Procedural creature engine</p>
          <h1>{spec.name}</h1>
        </div>
        <nav className={styles.switcher} aria-label="Choose a creature">
          {Object.entries(CREATURES).map(([id, creature]) => (
            <Link
              key={id}
              href={`/creature-lab?creature=${id}${debugQuery}`}
              aria-current={selectedId === id ? "page" : undefined}
            >
              {creature.name}
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.info}>
        <p>
          {selectedId === "manta"
            ? "Area-preserved wing membrane · inverse trailing tails · velocity steering"
            : selectedId === "jelly"
              ? "Pressure-preserved bell · procedural pulse · six passive tentacles"
              : "World-locked feet · lifted wave gait · page-surface platform physics"}
        </p>
        <Link
          href={`/creature-lab?creature=${selectedId}${
            debug ? "" : "&debug=1"
          }`}
        >
          {debug ? "Hide constraints" : "Inspect constraints"}
        </Link>
      </section>

      <p className={styles.hint}>
        {selectedId === "octopus"
          ? "walk · hop · land · turn"
          : "move · stop · reverse · orbit"}
      </p>
    </main>
  );
}
