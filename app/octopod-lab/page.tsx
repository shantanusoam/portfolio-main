import type { Metadata } from "next";
import ProceduralCharacter from "@/components/procedural-character/ProceduralCharacter";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Procedural Octopod Gait Lab",
  description: "Debug view of planted procedural feet and FABRIK legs.",
};

export default function OctopodLabPage() {
  return (
    <main className={styles.page}>
      <ProceduralCharacter spec={octopodPreset} debug />

      <section className={styles.instructions}>
        <p className={styles.eyebrow}>First physics deliverable</p>
        <h1>Procedural octopod gait lab</h1>
        <p>
          Move the pointer sharply, reverse direction, and draw tight circles.
          Feet stay locked until their colored ideal target crosses the dashed
          threshold.
        </p>
        <dl className={styles.legend}>
          <div>
            <dt>Cross</dt>
            <dd>ideal foot target</dd>
          </div>
          <div>
            <dt>Dashed ring</dt>
            <dd>step threshold</dd>
          </div>
          <div>
            <dt>White foot</dt>
            <dd>currently stepping</dd>
          </div>
          <div>
            <dt>Red vector</dt>
            <dd>body velocity</dd>
          </div>
        </dl>
      </section>

      <div className={styles.axisLabelX}>world x</div>
      <div className={styles.axisLabelY}>world y</div>
    </main>
  );
}
