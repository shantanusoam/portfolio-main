"use client";

import Link from "next/link";
import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Reveal from "./Reveal";
import { SceneHeader } from "./Scene";
import shared from "./WorkshopShared.module.css";
import styles from "./WorkingSketch.module.css";
import {
  describeMove,
  flattenSketch,
  INITIAL_SKETCH,
  isDescendant,
  moveWithinSiblings,
  type SemanticMove,
  type SketchNode,
} from "./sketch-model";

/** Custom event: the sketch asks the hero's leaves to hold still while it
 * is active (brief §7 — a user-started sketch pauses ambient playback). */
export const WS_MOTION_BUSY = "ws-motion-busy";

const INITIAL_MOVE: SemanticMove = {
  nodeId: "wire-sensor",
  parentId: "enclosure-body",
  position: "after",
  siblingId: null,
};

/**
 * Scene 2 — Lab. The brief's one memorable interaction: move a sample task
 * through a real tree-state model (adapted from the dnd-dynamic-tree work),
 * watch the labelled ancestry diagram update from the *same* state, and
 * meet the invariant that guards every nesting move. Interactive code
 * mounts only after the visitor asks for it.
 */
export default function WorkingSketch() {
  const [started, setStarted] = useState(false);
  const [nodes, setNodes] = useState<SketchNode[]>(INITIAL_SKETCH);
  const [selectedId, setSelectedId] = useState("wire-sensor");
  // Snapshots carry the full labeled state, so undo can restore the ledger's
  // "last committed move" truthfully instead of asserting an undone move.
  const [history, setHistory] = useState<
    Array<{ nodes: SketchNode[]; move: SemanticMove; movedId: string | null }>
  >([]);
  const [lastMove, setLastMove] = useState<SemanticMove>(INITIAL_MOVE);
  const [lastMovedId, setLastMovedId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const flat = useMemo(() => flattenSketch(nodes), [nodes]);
  const selected = flat.find((node) => node.id === selectedId) ?? flat[0];
  const selectedFlatIndex = flat.findIndex((node) => node.id === selected?.id);

  const commit = useCallback(
    (nextNodes: SketchNode[], move: SemanticMove, note: string) => {
      // The snapshot stores the labeled state being LEFT BEHIND — the bench
      // plus the move that produced it — so undo restores a ledger that
      // tells the truth about the state it shows.
      setHistory((past) => [
        ...past.slice(-24),
        { nodes, move: lastMove, movedId: lastMovedId },
      ]);
      setNodes(nextNodes);
      setLastMove(move);
      setLastMovedId(move.nodeId);
      setBlocked(null);
      setAnnouncement(note);
    },
    [nodes, lastMove, lastMovedId],
  );

  const moveUp = () => {
    const node = nodes.find((item) => item.id === selectedId);
    if (!node) return;
    const siblings = nodes.filter((item) => item.parentId === node.parentId);
    const first = siblings[0];
    if (first.id === selectedId) {
      setBlocked("Already first among its siblings.");
      return;
    }
    commit(moveWithinSiblings(nodes, selectedId, -1), {
      nodeId: selectedId,
      parentId: node.parentId,
      position: "before",
      siblingId: siblings[siblings.findIndex((s) => s.id === selectedId) - 1]?.id ?? null,
    }, `${node.label} moved up.`);
  };

  const moveDown = () => {
    const node = nodes.find((item) => item.id === selectedId);
    if (!node) return;
    const siblings = nodes.filter((item) => item.parentId === node.parentId);
    const last = siblings[siblings.length - 1];
    if (last.id === selectedId) {
      setBlocked("Already last among its siblings.");
      return;
    }
    commit(moveWithinSiblings(nodes, selectedId, 1), {
      nodeId: selectedId,
      parentId: node.parentId,
      position: "after",
      siblingId: siblings[siblings.findIndex((s) => s.id === selectedId) + 1]?.id ?? null,
    }, `${node.label} moved down.`);
  };

  const nest = () => {
    const previous = flat[selectedFlatIndex - 1];
    const node = nodes.find((item) => item.id === selectedId);
    if (!previous || !node || previous.id === selectedId) {
      setBlocked("This task has nothing above it to nest into.");
      setAnnouncement("Move blocked: nothing to nest into.");
      return;
    }
    // A first child's flat predecessor is its own parent — "put inside" from
    // there can only mean inside the task's own subtree, so route the attempt
    // at the task's first child and let the ancestor guard answer it. The
    // invariant stays falsifiable: press → past maximum depth and the model,
    // not silence, refuses.
    const target =
      previous.id === node.parentId
        ? nodes.find((item) => item.parentId === node.id)
        : previous;
    if (!target) {
      setBlocked(`"${node.label}" is already nested as deep as it goes.`);
      setAnnouncement("Move blocked: already at maximum depth.");
      return;
    }
    if (isDescendant(nodes, target.id, selectedId)) {
      // The invariant, made visible: this is the guard the real package
      // applies before every commit.
      setBlocked(
        `"${node.label}" can't go inside "${target.label}" — a task can't become its own ancestor.`,
      );
      setAnnouncement("Move blocked: a node can't become its own ancestor.");
      return;
    }
    commit(
      nodes.map((item) =>
        item.id === selectedId ? { ...item, parentId: target.id } : item,
      ),
      {
        nodeId: selectedId,
        parentId: target.id,
        position: "inside",
        siblingId: null,
      },
      `${node.label} moved inside ${target.label}.`,
    );
  };

  const outdent = () => {
    const node = nodes.find((item) => item.id === selectedId);
    const parent = nodes.find((item) => item.id === node?.parentId);
    if (!node || !parent) {
      setBlocked("Already at the top level.");
      return;
    }
    commit(
      nodes.map((item) =>
        item.id === selectedId ? { ...item, parentId: parent.parentId } : item,
      ),
      {
        nodeId: selectedId,
        parentId: parent.parentId,
        position: "after",
        siblingId: parent.id,
      },
      `${node.label} lifted out of ${parent.label}.`,
    );
  };

  const undo = () => {
    setHistory((past) => {
      if (!past.length) return past;
      const top = past[past.length - 1];
      setNodes(top.nodes);
      // Restore the ledger's labeled state too — an undone move must not
      // keep asserting itself in "last committed move".
      setLastMove(top.move);
      setLastMovedId(top.movedId);
      setBlocked(null);
      setAnnouncement("Undid the last move.");
      return past.slice(0, -1);
    });
  };

  const reset = () => {
    setHistory((past) => [
      ...past.slice(-24),
      { nodes, move: lastMove, movedId: lastMovedId },
    ]);
    setNodes(INITIAL_SKETCH);
    setSelectedId("wire-sensor");
    setLastMove(INITIAL_MOVE);
    setLastMovedId(null);
    setBlocked(null);
    setAnnouncement("Sketch reset to the morning's starting bench.");
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveUp();
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveDown();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nest();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      outdent();
    }
    if (event.key === "z" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      undo();
    }
  };

  // The labelled diagram is derived from the same state as the tree — one
  // source of truth, two honest views (brief §6).
  const ancestry = useMemo(() => {
    const chain: SketchNode[] = [];
    let current = nodes.find((node) => node.id === selected?.id);
    while (current) {
      chain.push(current);
      current = nodes.find((node) => node.id === current?.parentId);
    }
    return chain;
  }, [nodes, selected?.id]);

  return (
    <section className={styles.section} id="lab">
      <div className={shared.container}>
        <Reveal>
          <SceneHeader
            index="02"
            label="Lab — the working sketch"
            shift={1}
            title={
              <>
                Move a task. <em>Understand the system.</em>
              </>
            }
          />
        </Reveal>

        <p className={styles.marginNote} aria-hidden="true">
          BENCH 02 · SIX TASKS · ONE GUARD
        </p>

        <Reveal delay={120}>
          <p className={styles.intro}>
            Nested drag-and-drop looks like a pointer problem. It is really a
            state-modelling problem: preserving identity, ancestry and intent
            through change. This bench runs the same semantic-move model as my
            open-source tree library, on six sample workshop tasks.
          </p>
        </Reveal>

        {!started ? (
          <Reveal delay={200}>
            <div className={`${styles.resting} ${shared.panelJaali}`}>
              <div className={styles.restingStory}>
                <p className={shared.monoMeta}>Static explanation</p>
                <p className={styles.restingCopy}>
                  Below, <strong>Wire the sensor</strong> sits under{" "}
                  <strong>Build the enclosure body</strong>. Move it into the{" "}
                  <strong>Documentation</strong> group and its ancestry — its
                  whole meaning in the tree — changes with one semantic move.
                </p>
                <button
                  type="button"
                  className={shared.btn}
                  onClick={() => {
                    setStarted(true);
                    window.dispatchEvent(
                      new CustomEvent(WS_MOTION_BUSY, { detail: true }),
                    );
                  }}
                >
                  Try the working sketch
                  <span className={shared.btnArrow} aria-hidden="true">
                    ↓
                  </span>
                </button>
              </div>
              <div className={styles.restingDiagram} aria-hidden="true">
                <div className={styles.beforeAfter}>
                  <div>
                    <p className={shared.monoMeta}>Before</p>
                    <p className={styles.chain}>
                      Documentation
                      <br />
                      └ Write assembly notes
                    </p>
                  </div>
                  <span className={styles.baArrow} aria-hidden="true">
                    →
                  </span>
                  <div>
                    <p className={shared.monoMeta}>After one move</p>
                    <p className={styles.chain}>
                      <em className={styles.moved}>Wire the sensor</em>
                      <br />
                      └ moved into Documentation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <div className={styles.bench}>
            <div
              className={`${styles.treePanel} ${shared.panelJaali}`}
              tabIndex={0}
              role="group"
              aria-label="Workshop task tree — arrow keys move the selected task"
              onKeyDown={onKeyDown}
            >
              <div className={styles.panelHead}>
                <p className={shared.monoMeta}>The bench — six sample tasks</p>
                <p className={styles.keyHint}>↑ ↓ move · → put inside · ← lift out</p>
              </div>

              <ul className={styles.tree} role="list">
                {flat.map((node) => (
                  <li key={node.id} style={{ paddingLeft: node.depth * 26 }}>
                    <button
                      type="button"
                      className={`${styles.task} ${
                        node.id === selectedId ? styles.taskSelected : ""
                      } ${node.id === lastMovedId ? styles.taskMoved : ""} ${
                        node.depth === 0 ? styles.taskGroup : ""
                      }`}
                      aria-pressed={node.id === selectedId}
                      onClick={() => setSelectedId(node.id)}
                    >
                      <span className={styles.taskLabel}>{node.label}</span>
                      <span className={styles.taskParent}>
                        {node.parentId
                          ? nodes.find((n) => n.id === node.parentId)?.label
                          : "top level"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className={styles.controls}>
                <button type="button" onClick={moveUp} aria-label="Move task up">
                  ↑<span>Up</span>
                </button>
                <button type="button" onClick={moveDown} aria-label="Move task down">
                  ↓<span>Down</span>
                </button>
                <button type="button" onClick={nest} aria-label="Put task inside previous sibling">
                  →<span>Inside</span>
                </button>
                <button type="button" onClick={outdent} aria-label="Lift task out of its group">
                  ←<span>Out</span>
                </button>
                <span className={styles.controlGap} aria-hidden="true" />
                <button
                  type="button"
                  onClick={undo}
                  disabled={!history.length}
                  aria-label="Undo last move"
                >
                  ⟲<span>Undo</span>
                </button>
                <button type="button" onClick={reset} aria-label="Reset the sketch">
                  ⟳<span>Reset</span>
                </button>
              </div>

              <p className={styles.blocked} role="status" aria-live="polite">
                {blocked ?? ""}
              </p>
              {/* Screen-reader confirmation of successful moves — the visual
                 settle animation is not announcement enough on its own. */}
              <p className={styles.liveRegion} role="status" aria-live="polite">
                {announcement}
              </p>
            </div>

            <div className={`${styles.ledger} ${shared.panelJaali}`}>
              <p className={`${shared.monoMeta} ${styles.ledgerMeta}`}>
                The ledger — ancestry of “{selected?.label}”
              </p>
              <div className={styles.chainDiagram} aria-hidden="true">
                {ancestry.map((node, index) => (
                  <div key={node.id} className={styles.chainNodeWrap}>
                    {index > 0 && (
                      <span className={styles.chainLink} aria-hidden="true">
                        ↑
                      </span>
                    )}
                    <span
                      className={`${styles.chainNode} ${
                        index === 0 ? styles.chainNodeSelected : ""
                      }`}
                    >
                      {node.label}
                      <em>
                        {index === 0
                          ? "selected"
                          : index === ancestry.length - 1
                            ? "root"
                            : "parent"}
                      </em>
                    </span>
                  </div>
                ))}
              </div>

              <p className={`${shared.monoMeta} ${styles.ledgerMeta}`}>
                Last committed move
              </p>
              <pre className={styles.moveJson}>{describeMove(lastMove)}</pre>

              <p className={styles.invariant}>
                The guard — every nesting move is checked against ancestry
                before commit: <strong>a task can never become its own
                ancestor.</strong> Try putting a group inside itself.
              </p>

              <button
                type="button"
                className={shared.quietLink}
                onClick={() => {
                  setStarted(false);
                  window.dispatchEvent(
                    new CustomEvent(WS_MOTION_BUSY, { detail: false }),
                  );
                }}
              >
                Put the sketch down
              </button>
            </div>
          </div>
        )}

        <Reveal delay={80}>
          <div className={styles.otherRooms}>
            <p className={shared.monoMeta}>Other benches in the workshop</p>
            <div className={styles.roomLinks}>
              <Link href="/systems" className={shared.uLink}>
                Systems lab — every engine, documented
              </Link>
              <Link href="/learning" className={shared.uLink}>
                Learning tracks — how I teach these ideas
              </Link>
              <span className={styles.serial} title="A quiet older machine">
                <svg
                  className={styles.serialGlyph}
                  width="17"
                  height="13"
                  viewBox="0 0 17 13"
                  aria-hidden="true"
                >
                  <rect
                    x="1"
                    y="1"
                    width="15"
                    height="11"
                    rx="1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                  <circle cx="4" cy="9.4" r="1.1" fill="var(--ws-leaf, #587457)" />
                  <line
                    x1="7"
                    y1="9.4"
                    x2="13"
                    y2="9.4"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                  <line
                    x1="3.5"
                    y1="4"
                    x2="13.5"
                    y2="4"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                  <line
                    x1="3.5"
                    y1="6.7"
                    x2="13.5"
                    y2="6.7"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                </svg>
                Serial no. 3310 ·{" "}
                <Link href="/arcade/space-impact" className={shared.uLink}>
                  an older machine is plugged in
                </Link>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
