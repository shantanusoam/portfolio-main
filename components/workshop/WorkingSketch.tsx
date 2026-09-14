"use client";

import { useState } from "react";
import {
  flatten,
  initialNodes,
  moveNode,
  type Move,
  type WorkshopNode,
} from "./tree";
import styles from "./Workshop.module.css";

export default function WorkingSketch() {
  const [history, setHistory] = useState<WorkshopNode[][]>([initialNodes]);
  const [selected, setSelected] = useState("sensor");
  const [announcement, setAnnouncement] = useState(
    "Wire sensor selected. Try moving it out of Prototype.",
  );
  const nodes = history[history.length - 1];
  const flat = flatten(nodes);
  function move(command: Move) {
    const next = moveNode(nodes, selected, command);
    if (next === nodes) return;
    setHistory((h) => [...h.slice(-49), next]);
    const node = next.find((n) => n.id === selected)!;
    const parent = next.find((n) => n.id === node.parentId);
    setAnnouncement(
      `${node.label} moved ${
        command === "in"
          ? "into a group"
          : command === "out"
            ? "out of its group"
            : command
      }. Parent: ${parent?.label ?? "Workshop"}.`,
    );
  }
  return (
    <div className={styles.sketch}>
      <div className={styles.sketchTools} aria-label="Move selected task">
        {(
          [
            ["up", "↑ Up"],
            ["down", "↓ Down"],
            ["in", "↳ Nest"],
            ["out", "↰ Out"],
          ] as const
        ).map(([command, label]) => (
          <button
            type="button"
            key={command}
            disabled={moveNode(nodes, selected, command) === nodes}
            onClick={() => move(command)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={history.length < 2}
          onClick={() => {
            setHistory((h) => h.slice(0, -1));
            setAnnouncement("Last move undone. Both views restored.");
          }}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            setHistory([initialNodes]);
            setSelected("sensor");
            setAnnouncement("Workshop reset. Wire sensor selected.");
          }}
        >
          Reset
        </button>
      </div>
      <div className={styles.sketchViews}>
        <div>
          <p className={styles.micro}>01 / Select a task</p>
          <div className={styles.nodeList}>
            {flat.map((node) => (
              <button
                type="button"
                key={node.id}
                aria-pressed={selected === node.id}
                onClick={() => {
                  setSelected(node.id);
                  setAnnouncement(`${node.label} selected.`);
                }}
                style={{ paddingLeft: 14 + node.depth * 16 }}
              >
                <span>
                  {node.depth ? "└ " : ""}
                  {node.label}
                </span>
                <span aria-hidden="true">
                  {selected === node.id ? "●" : "○"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.structure}>
          <p className={styles.micro}>02 / The same state, another view</p>
          <ul aria-label="Current parent relationships">
            {flat.map((node) => (
              <li key={node.id}>
                <span>{node.label}</span>
                <small>
                  ↳{" "}
                  {nodes.find((n) => n.id === node.parentId)?.label ??
                    "Workshop"}
                </small>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p role="status" className={styles.sketchStatus}>
        {announcement}
      </p>
      <p className={styles.sketchExplanation}>
        One state drives both views. Nesting only targets a preceding sibling,
        so a task can never become its own ancestor. Sample data; no changes are
        saved.
      </p>
    </div>
  );
}
