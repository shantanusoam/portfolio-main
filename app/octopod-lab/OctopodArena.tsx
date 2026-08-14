"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import ProceduralCharacter from "@/components/procedural-character/ProceduralCharacter";
import type { ProceduralCharacterEngine } from "@/lib/procedural-character/ProceduralCharacterEngine";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import styles from "./page.module.css";

type ControlKey = "left" | "right" | "crouch" | "grab";

const PEARLS = [
  { x: 0.72, y: 0.34 },
  { x: 0.27, y: 0.53 },
  { x: 0.54, y: 0.23 },
  { x: 0.82, y: 0.59 },
  { x: 0.17, y: 0.39 },
  { x: 0.48, y: 0.56 },
] as const;

const relevantKey = (key: string): boolean =>
  [
    "a",
    "d",
    "w",
    "s",
    "e",
    "q",
    "r",
    " ",
    "arrowleft",
    "arrowright",
    "arrowup",
    "arrowdown",
  ].includes(key.toLowerCase());

export interface OctopodArenaProps {
  initialDebug: boolean;
}

export default function OctopodArena({ initialDebug }: OctopodArenaProps) {
  const pageRef = useRef<HTMLElement | null>(null);
  const pressed = useRef(new Set<ControlKey>());
  const [engine, setEngine] = useState<ProceduralCharacterEngine | null>(null);
  const [debug, setDebug] = useState(initialDebug);
  const [score, setScore] = useState(0);
  const [pearlIndex, setPearlIndex] = useState(0);
  const [lastAction, setLastAction] = useState("Ready");
  const pearl = PEARLS[pearlIndex % PEARLS.length];

  const syncMovement = useCallback(() => {
    if (!engine) return;
    const horizontal =
      (pressed.current.has("right") ? 1 : 0) -
      (pressed.current.has("left") ? 1 : 0);
    engine.setManualControl(horizontal, {
      crouch: pressed.current.has("crouch"),
      grab: pressed.current.has("grab"),
      enabled: true,
    });
  }, [engine]);

  const setControl = useCallback(
    (control: ControlKey, active: boolean) => {
      if (active) pressed.current.add(control);
      else pressed.current.delete(control);
      syncMovement();
      if (active) setLastAction(control === "grab" ? "Tentacles anchored" : control);
    },
    [syncMovement],
  );

  const jump = useCallback(() => {
    engine?.requestJump();
    setLastAction("Jump");
  }, [engine]);

  const ink = useCallback(() => {
    engine?.triggerInkBurst();
    setLastAction("Ink burst");
  }, [engine]);

  const reset = useCallback(() => {
    pressed.current.clear();
    engine?.reset();
    engine?.setManualControl(0, { enabled: true });
    setScore(0);
    setPearlIndex(0);
    setLastAction("Run reset");
  }, [engine]);

  useEffect(() => {
    if (!engine) return undefined;
    engine.setManualControl(0, { enabled: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!relevantKey(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      event.preventDefault();
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") setControl("left", true);
      else if (key === "d" || key === "arrowright") setControl("right", true);
      else if (key === "s" || key === "arrowdown") setControl("crouch", true);
      else if (key === "e") setControl("grab", true);
      else if ((key === "w" || key === "arrowup" || key === " ") && !event.repeat) jump();
      else if (key === "q" && !event.repeat) ink();
      else if (key === "r" && !event.repeat) reset();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") setControl("left", false);
      else if (key === "d" || key === "arrowright") setControl("right", false);
      else if (key === "s" || key === "arrowdown") setControl("crouch", false);
      else if (key === "e") setControl("grab", false);
    };
    const releaseAll = () => {
      pressed.current.clear();
      syncMovement();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAll);
    };
  }, [engine, ink, jump, reset, setControl, syncMovement]);

  useEffect(() => {
    if (!engine) return undefined;
    let frame = 0;
    let collected = false;
    const checkPearl = () => {
      // Read the live root directly instead of allocating the full rig/debug
      // snapshot every frame. This keeps collection checks invisible to the
      // animation budget even on lower-powered devices.
      const position = engine.body.position;
      const targetX = pearl.x * window.innerWidth;
      const targetY = pearl.y * window.innerHeight;
      if (
        !collected &&
        Math.hypot(position.x - targetX, position.y - targetY) < 52
      ) {
        collected = true;
        setScore((value) => value + 1);
        setPearlIndex((value) => value + 1);
        setLastAction("Signal pearl collected");
        return;
      }
      frame = window.requestAnimationFrame(checkPearl);
    };
    frame = window.requestAnimationFrame(checkPearl);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, pearl.x, pearl.y]);

  const bindHold = (control: ControlKey) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      setControl(control, true);
    },
    onPointerUp: () => setControl(control, false),
    onPointerCancel: () => setControl(control, false),
    onPointerLeave: () => setControl(control, false),
  });

  return (
    <main ref={pageRef} className={styles.page} tabIndex={-1}>
      <div className={styles.floatingPlatform} data-character-platform aria-hidden="true" />
      <div className={styles.leftPlatform} data-character-platform aria-hidden="true" />
      <div className={styles.rightPlatform} data-character-platform aria-hidden="true" />

      <ProceduralCharacter
        spec={octopodPreset}
        debug={debug}
        onEngineReady={setEngine}
        onLand={() => setLastAction("Soft landing")}
      />

      <div
        className={styles.pearl}
        style={{ left: `${pearl.x * 100}%`, top: `${pearl.y * 100}%` }}
        aria-label="Collectible signal pearl"
      >
        <span />
      </div>

      <header className={styles.titlebar}>
        <p className={styles.eyebrow}>Procedural platform playground</p>
        <h1>Spring Octopus Arena</h1>
        <p>Eight planted feet. No keyframes. Every landing is solved live.</p>
        <div className={styles.headerLinks}>
          <Link href="/creature-lab?creature=octopus">Creature Lab</Link>
          <button type="button" aria-pressed={debug} onClick={() => setDebug((value) => !value)}>
            {debug ? "Hide rig" : "Show rig"}
          </button>
        </div>
      </header>

      <aside className={styles.scoreCard} aria-live="polite">
        <span>Signal pearls</span>
        <strong>{score.toString().padStart(2, "0")}</strong>
        <small>{lastAction}</small>
      </aside>

      <section className={styles.keymap} aria-label="Keyboard controls">
        <div><kbd>A</kbd><kbd>D</kbd><span>move</span></div>
        <div><kbd>W</kbd><kbd>Space</kbd><span>jump</span></div>
        <div><kbd>S</kbd><span>crouch</span></div>
        <div><kbd>E</kbd><span>anchor</span></div>
        <div><kbd>Q</kbd><span>ink</span></div>
        <div><kbd>R</kbd><span>reset</span></div>
      </section>

      <section className={styles.deck} data-character-platform>
        <div>
          <p>Collect the drifting signal pearl</p>
          <span>Use momentum, short hops and tentacle anchoring.</span>
        </div>
        <div className={styles.touchControls} aria-label="Touch controls">
          <button type="button" aria-label="Move left" {...bindHold("left")}>←</button>
          <button type="button" aria-label="Move right" {...bindHold("right")}>→</button>
          <button type="button" onClick={jump}>Jump</button>
          <button type="button" {...bindHold("grab")}>Anchor</button>
          <button type="button" onClick={ink}>Ink</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
      </section>
    </main>
  );
}
