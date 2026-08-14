"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProceduralCharacter from "@/components/procedural-character/ProceduralCharacter";
import type { ProceduralCharacterEngine } from "@/lib/procedural-character/ProceduralCharacterEngine";
import { jellyPreset } from "@/lib/procedural-character/presets/jelly";
import { koiPreset } from "@/lib/procedural-character/presets/koi";
import { mantaPreset } from "@/lib/procedural-character/presets/manta";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import { pufferPreset } from "@/lib/procedural-character/presets/puffer";
import { ribbonEelPreset } from "@/lib/procedural-character/presets/ribbon-eel";
import type { CharacterSpec } from "@/lib/procedural-character/types";
import styles from "./page.module.css";

interface CreatureEntry {
  id: string;
  spec: CharacterSpec;
  family: string;
  summary: string;
  features: readonly string[];
}

const CREATURES: readonly CreatureEntry[] = [
  {
    id: "manta",
    spec: mantaPreset,
    family: "Membrane swimmer",
    summary: "An area-preserving wing body with three lagging ribbon tails.",
    features: ["soft polygon", "area constraint", "wing phase"],
  },
  {
    id: "koi",
    spec: koiPreset,
    family: "Soft-body fish",
    summary: "A calm koi with painted patches, pectoral fins and a caudal fan.",
    features: ["koi markings", "five fins", "critical damping"],
  },
  {
    id: "eel",
    spec: ribbonEelPreset,
    family: "Ribbon swimmer",
    summary: "A long, elastic fish with low-drag streamers that carry turns.",
    features: ["traveling wave", "trailing chains", "band pattern"],
  },
  {
    id: "puffer",
    spec: pufferPreset,
    family: "Buoyant fish",
    summary: "A breathing, spotted soft body with tiny corrective fins.",
    features: ["volume pulse", "spot mask", "slow steering"],
  },
  {
    id: "jelly",
    spec: jellyPreset,
    family: "Pulse swimmer",
    summary: "A pressure-preserved bell with six passive spring tentacles.",
    features: ["bell pulse", "six tentacles", "buoyant damping"],
  },
  {
    id: "octopus",
    spec: octopodPreset,
    family: "Platform walker",
    summary: "Eight world-locked feet coordinate wave gaits across real surfaces.",
    features: ["FABRIK feet", "wave gait", "platform physics"],
  },
] as const;

export interface CreatureLabClientProps {
  selectedId: string;
  initialDebug: boolean;
}

export default function CreatureLabClient({
  selectedId,
  initialDebug,
}: CreatureLabClientProps) {
  const selected =
    CREATURES.find((creature) => creature.id === selectedId) ?? CREATURES[0];
  const [engine, setEngine] = useState<ProceduralCharacterEngine | null>(null);
  const [playing, setPlaying] = useState(true);
  const [debug, setDebug] = useState(initialDebug);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [speed, setSpeed] = useState(1);
  const morphology = useMemo(
    () => [
      `${selected.spec.appendages.length} appendages`,
      `${selected.spec.body.softBody.boundary.length} body nodes`,
      `${selected.spec.performance.solverIterations} solver passes`,
    ],
    [selected],
  );

  // Query-string creature changes can preserve this control panel's React
  // state while replacing the simulation. Re-apply live controls to every
  // new engine so the visible pause/speed state never drifts from reality.
  useEffect(() => {
    if (!engine) return;
    engine.setTimeScale(speed);
    if (playing) engine.start();
    else engine.pause();
  }, [engine, playing, speed]);

  const togglePlayback = () => {
    if (!engine) return;
    if (playing) engine.pause();
    else engine.start();
    setPlaying(!playing);
  };

  const updateSpeed = (value: number) => {
    setSpeed(value);
    engine?.setTimeScale(value);
  };

  const surprise = () => {
    if (!engine) return;
    const margin = 130;
    engine.setTarget(
      margin + Math.random() * Math.max(1, window.innerWidth - margin * 2),
      margin + Math.random() * Math.max(1, window.innerHeight - margin * 2),
      true,
    );
    if (!playing) {
      engine.start();
      setPlaying(true);
    }
  };

  return (
    <main className={styles.page} data-creature={selected.id}>
      <div className={styles.ambient} aria-hidden="true" />
      {selected.id === "octopus" ? (
        <>
          <div className={styles.octopusPerch} data-character-platform aria-hidden="true" />
          <div className={styles.octopusDeck} data-character-platform aria-hidden="true" />
        </>
      ) : null}

      <ProceduralCharacter
        key={selected.id}
        spec={selected.spec}
        debug={debug}
        reducedMotion={reducedMotion}
        onEngineReady={setEngine}
      />

      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <p className={styles.eyebrow}>Live procedural creature engine</p>
          <h1>{selected.spec.name}</h1>
          <p className={styles.family}>{selected.family}</p>
        </div>
        <nav className={styles.switcher} aria-label="Choose a creature">
          {CREATURES.map((creature) => (
            <Link
              key={creature.id}
              href={`/creature-lab?creature=${creature.id}`}
              aria-current={selected.id === creature.id ? "page" : undefined}
            >
              <span>{creature.spec.name}</span>
              <small>{creature.family}</small>
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.controlPanel} aria-label="Simulation controls">
        <div className={styles.controlIntro}>
          <span className={styles.liveBadge} data-playing={playing}>
            {playing ? "Live" : "Paused"}
          </span>
          <p>{selected.summary}</p>
        </div>
        <div className={styles.controlButtons}>
          <button type="button" onClick={togglePlayback} disabled={!engine}>
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={() => engine?.reset()} disabled={!engine}>
            Reset
          </button>
          <button type="button" onClick={surprise} disabled={!engine}>
            Surprise me
          </button>
          <button
            type="button"
            data-active={debug}
            aria-pressed={debug}
            onClick={() => setDebug((value) => !value)}
          >
            Rig {debug ? "on" : "off"}
          </button>
          <button
            type="button"
            data-active={reducedMotion}
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion((value) => !value)}
          >
            Calm motion
          </button>
        </div>
        <label className={styles.speedControl}>
          <span>Simulation speed</span>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={speed}
            onChange={(event) => updateSpeed(Number(event.target.value))}
          />
          <output>{speed.toFixed(2)}×</output>
        </label>
      </section>

      <section className={styles.info}>
        <div className={styles.featureList}>
          {selected.features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
        <div className={styles.morphology}>
          {morphology.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {selected.id === "octopus" ? (
          <Link className={styles.arenaLink} href="/octopod-lab">
            Open keyboard arena →
          </Link>
        ) : (
          <span className={styles.hint}>Move, stop, reverse and orbit with your pointer</span>
        )}
      </section>
    </main>
  );
}
