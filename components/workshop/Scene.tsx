import type { ReactNode } from "react";
import shared from "./WorkshopShared.module.css";

/**
 * The recurring scene opening: sun-notch + mono index + serif title.
 * Every scene on the page starts with the same grammar — the repetition is
 * the identity (ART_DIRECTION.md §3) — with two deliberate, documented
 * variations: `tone` lets the hopeful clause speak in ink instead of clay
 * (scenes 03 and 04 break the italic-clay formula so it stays an emphasis),
 * and `shift` starts the header one or two grid columns deeper into the
 * page, so no two consecutive scenes open at the identical x-position.
 */
export function SceneHeader({
  index,
  label,
  title,
  id,
  tone = "clay",
  shift = 0,
}: {
  index: string;
  label: string;
  title: ReactNode;
  id?: string;
  tone?: "clay" | "ink";
  shift?: 0 | 1 | 2;
}) {
  return (
    <header
      className={`${shared.sceneHeader} ${shift ? shared[`sceneShift${shift}`] : ""}`}
      id={id}
    >
      <p className={shared.sceneIndex}>
        <span className={shared.notch} aria-hidden="true" />
        <span>{index}</span>
        <span>{label}</span>
      </p>
      <h2
        className={`${shared.sceneTitle} ${
          tone === "ink" ? shared.sceneTitleInk : ""
        }`}
      >
        {title}
      </h2>
    </header>
  );
}
