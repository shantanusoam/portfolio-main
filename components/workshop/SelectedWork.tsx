import Link from "next/link";
import type { JSX } from "react";
import { flagshipCaseStudies } from "@/lib/portfolio/evidence";
import Reveal from "./Reveal";
import { SceneHeader } from "./Scene";
import shared from "./WorkshopShared.module.css";
import styles from "./SelectedWork.module.css";
import { KnowbuildDiagram, NivaDiagram, TreeDiagram } from "./work-diagrams";

/**
 * Scene 1 — Selected work. Three generous editorial rows, not a card wall:
 * each row is the case-study contract from the brief (problem, role+dates,
 * why-I-chose-this, what-changed, evidence status) beside an *authored*
 * diagram — nothing here pretends to be a product capture.
 */

type WorkshopMeta = {
  role: string;
  dates: string;
  evidence: string;
  diagram: () => JSX.Element;
};

const META: Record<string, WorkshopMeta> = {
  knowbuild: {
    role: "Staff Engineer",
    dates: "2025 — now",
    evidence:
      "Validated against representative 10k-row operational tables and build-level call counts; client schema and data withheld.",
    diagram: KnowbuildDiagram,
  },
  "niva-bupa": {
    role: "Senior Software Engineer",
    dates: "2025",
    evidence:
      "Measured across representative policy-lookup traffic before and after index changes; operational data withheld under healthcare-client confidentiality.",
    diagram: NivaDiagram,
  },
  "dnd-dynamic-tree": {
    role: "Author & maintainer",
    dates: "Open source",
    evidence:
      "The evidence is installable: the published npm package and its documented move contract are public.",
    diagram: TreeDiagram,
  },
};

export default function SelectedWork() {
  return (
    <section className={styles.section} id="work">
      <div className={shared.container}>
        <Reveal>
          <SceneHeader
            index="01"
            label="Selected work"
            title={
              <>
                What I built — <em>and what changed.</em>
              </>
            }
          />
        </Reveal>

        <div className={styles.stack}>
          {flagshipCaseStudies.map((study, index) => {
            const meta = META[study.id];
            if (!meta) return null;
            const Diagram = meta.diagram;
            const reversed = index % 2 === 1;
            return (
              <Reveal
                as="article"
                className={`${styles.row} ${reversed ? styles.rowReversed : ""}`}
                key={study.id}
              >
                <div className={styles.visual}>
                  <div className={styles.diagramFrame}>
                    <Diagram />
                  </div>
                </div>

                <div className={styles.copy}>
                  <p className={shared.monoMeta}>
                    {String(index + 1).padStart(2, "0")} · {study.name} ·{" "}
                    {meta.role} · {meta.dates}
                  </p>
                  <h3 className={styles.title}>{study.summary}</h3>
                  <p className={styles.summary}>{study.problem}</p>

                  <dl className={styles.facts}>
                    <div className={styles.fact}>
                      <dt>Why I chose this</dt>
                      <dd>
                        <ul>
                          {study.decisions.slice(0, 2).map((decision) => (
                            <li key={decision}>{decision}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt>What changed</dt>
                      <dd>
                        <ul>
                          {study.results.map((result) => (
                            <li key={result}>{result}</li>
                          ))}
                        </ul>
                        <p className={styles.evidence}>
                          Evidence — {meta.evidence}
                        </p>
                      </dd>
                    </div>
                  </dl>

                  <Link className={styles.caseLink} href={study.href}>
                    Read the full debrief{" "}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
