import type { Metadata } from "next";
import Link from "next/link";
import SignalMicroscope from "./SignalMicroscope";
import styles from "./microscope.module.css";

export const metadata: Metadata = {
  title: "GPU Anatomy — Shantanu Soam",
  description:
    "Look inside the current, pressure, wake and light passes that power the portfolio's Living Signal Ocean.",
  alternates: { canonical: "/gpu" },
};

export default function GpuAnatomyPage() {
  return (
    <main className={styles.page}>
      <Link href="/#maker-lab" className={styles.back}>
        ← Back to Maker Lab
      </Link>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Maker Lab / 06 · GPU Anatomy</p>
        <h1>The surface remembers.</h1>
        <p>
          A small instrument for looking beneath the portfolio. Push a current,
          send a pluck through a boundary, or follow a wake after its source has
          gone. These are the same GPU passes that paint the homepage—not an
          illustration of them.
        </p>
      </header>
      <SignalMicroscope />
      <section className={styles.notes} aria-label="How the simulation works">
        <article>
          <span>01 / Carry</span>
          <h2>Advection</h2>
          <p>
            Each cell looks backwards along its velocity to find the signal
            arriving now. Two buffers exchange read/write roles so a pass never
            overwrites its own input.
          </p>
        </article>
        <article>
          <span>02 / Balance</span>
          <h2>Pressure</h2>
          <p>
            Finite differences measure rotation and divergence. A short Jacobi
            solve estimates pressure; subtracting its gradient reduces
            compression. This is a restrained approximation, not a
            high-resolution water solver.
          </p>
        </article>
        <article>
          <span>03 / Remember</span>
          <h2>Wake & light</h2>
          <p>
            Transported wake has a longer lifetime than signal. String light is
            a separate, short-lived contribution with a few semantic rectangle
            occluders—no document-wide lighting or text rasterization.
          </p>
        </article>
      </section>
      <footer className={styles.footer}>
        DOM for meaning. GPU for atmosphere.{" "}
        <a href="https://github.com/shantanusoam/portfolio-main/tree/main/lib/living-canvas/gpu">
          Read the WGSL source ↗
        </a>
      </footer>
    </main>
  );
}
