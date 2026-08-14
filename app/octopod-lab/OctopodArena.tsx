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
import type { EnvironmentSurface } from "@/lib/procedural-character/types";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import styles from "./page.module.css";

type ControlKey = "left" | "right" | "crouch" | "grab";

interface AscentPlatform {
  id: string;
  index: number;
  x: number;
  y: number;
  width: number;
  drift: number;
  phase: number;
}

const PLATFORM_COUNT = 72;
const BODY_GROUND_OFFSET = 52;
const BEST_STORAGE_KEY = "octopod-ascent:best";

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

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

function seededSequence(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createAscentPlatforms(
  viewportWidth: number,
  viewportHeight: number,
): AscentPlatform[] {
  const random = seededSequence(0x0c70cafe);
  const sideMargin = clamp(viewportWidth * 0.09, 34, 92);
  const platforms: AscentPlatform[] = [];
  let x = viewportWidth * 0.5;
  let y = viewportHeight * 0.74;

  for (let index = 0; index < PLATFORM_COUNT; index += 1) {
    const width =
      index === 0
        ? clamp(viewportWidth * 0.3, 142, 260)
        : clamp(100 + random() * 76, 92, viewportWidth * 0.4);

    if (index > 0) {
      y -= 82 + random() * 30;
      const direction = index % 2 === 0 ? -1 : 1;
      const shift = 54 + random() * Math.min(118, viewportWidth * 0.22);
      x = clamp(
        x + direction * shift + (random() - 0.5) * 42,
        sideMargin + width * 0.5,
        viewportWidth - sideMargin - width * 0.5,
      );
    }

    platforms.push({
      id: `octopod-platform-${index}`,
      index,
      x,
      y,
      width,
      drift: index > 2 && index % 6 === 0 ? 18 + random() * 16 : 0,
      phase: random() * Math.PI * 2,
    });
  }
  return platforms;
}

export interface OctopodArenaProps {
  initialDebug: boolean;
}

export default function OctopodArena({ initialDebug }: OctopodArenaProps) {
  const pageRef = useRef<HTMLElement | null>(null);
  const platformNodes = useRef(new Map<string, HTMLDivElement>());
  const platformsRef = useRef<AscentPlatform[]>([]);
  const pressed = useRef(new Set<ControlKey>());
  const cameraY = useRef(0);
  const lastGrounded = useRef(false);
  const bounceAt = useRef(0);
  const checkpointIndex = useRef(0);
  const highestIndex = useRef(0);
  const recoveringRef = useRef(false);
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [engine, setEngine] = useState<ProceduralCharacterEngine | null>(null);
  const [platforms, setPlatforms] = useState<AscentPlatform[]>([]);
  const [debug, setDebug] = useState(initialDebug);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [lastAction, setLastAction] = useState("Finding a foothold");

  const platformX = useCallback(
    (platform: AscentPlatform, timeMs: number): number =>
      platform.x +
      Math.sin(timeMs * 0.00072 + platform.phase) * platform.drift,
    [],
  );

  const layoutWorld = useCallback(
    (timeMs: number): EnvironmentSurface[] => {
      const surfaces: EnvironmentSurface[] = [];
      const viewportHeight = window.innerHeight;
      for (const platform of platformsRef.current) {
        const x = platformX(platform, timeMs);
        const screenY = platform.y - cameraY.current;
        const left = x - platform.width * 0.5;
        const node = platformNodes.current.get(platform.id);
        if (node) {
          node.style.width = `${platform.width}px`;
          node.style.transform = `translate3d(${left}px, ${screenY}px, 0)`;
          node.dataset.visible = String(
            screenY > -54 && screenY < viewportHeight + 70,
          );
        }
        if (screenY < -50 || screenY > viewportHeight + 64) continue;
        surfaces.push({
          id: platform.id,
          left,
          top: screenY,
          right: left + platform.width,
          bottom: screenY + 10,
        });
      }
      return surfaces;
    },
    [platformX],
  );

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

  const placeAtPlatform = useCallback(
    (index: number, preserveRun = true) => {
      if (!engine || platformsRef.current.length === 0) return;
      const safeIndex = clamp(
        index,
        0,
        platformsRef.current.length - 1,
      );
      const platform = platformsRef.current[safeIndex];
      const screenY = safeIndex === 0 ? window.innerHeight * 0.74 : window.innerHeight * 0.68;
      cameraY.current = platform.y - screenY;
      const nowMs = performance.now();
      engine.setEnvironmentSurfaces(layoutWorld(nowMs));
      engine.reset(
        platformX(platform, nowMs),
        screenY - BODY_GROUND_OFFSET,
      );
      syncMovement();
      lastGrounded.current = false;
      bounceAt.current = nowMs + 220;
      recoveringRef.current = false;
      setRecovering(false);
      setLastAction(
        preserveRun && safeIndex > 0
          ? `Recovered at platform ${safeIndex}`
          : "Auto-bounce armed",
      );
    },
    [engine, layoutWorld, platformX, syncMovement],
  );

  const reset = useCallback(() => {
    if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    recoveryTimer.current = null;
    pressed.current.clear();
    checkpointIndex.current = 0;
    highestIndex.current = 0;
    setScore(0);
    placeAtPlatform(0, false);
  }, [placeAtPlatform]);

  const recoverFromFall = useCallback(() => {
    if (!engine || recoveringRef.current) return;
    recoveringRef.current = true;
    setRecovering(true);
    bounceAt.current = 0;
    engine.triggerInkBurst();
    setLastAction("Missed — rewinding to the last foothold");
    recoveryTimer.current = setTimeout(() => {
      recoveryTimer.current = null;
      placeAtPlatform(checkpointIndex.current, true);
    }, 780);
  }, [engine, placeAtPlatform]);

  const setControl = useCallback(
    (control: ControlKey, active: boolean) => {
      if (active) pressed.current.add(control);
      else pressed.current.delete(control);
      syncMovement();
      if (active) {
        setLastAction(
          control === "grab"
            ? "Tentacles braced"
            : control === "crouch"
              ? "Landing softened"
              : `Steering ${control}`,
        );
      }
    },
    [syncMovement],
  );

  const jump = useCallback(() => {
    if (!engine || recoveringRef.current) return;
    engine.requestJump();
    setLastAction("Bounce pulsed");
  }, [engine]);

  const ink = useCallback(() => {
    engine?.triggerInkBurst();
    setLastAction("Ink burst");
  }, [engine]);

  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem(BEST_STORAGE_KEY)) || 0);
    } catch {
      setBest(0);
    }

    const rebuild = () => {
      const next = createAscentPlatforms(window.innerWidth, window.innerHeight);
      platformsRef.current = next;
      setPlatforms(next);
    };
    rebuild();
    window.addEventListener("resize", rebuild, { passive: true });
    return () => window.removeEventListener("resize", rebuild);
  }, []);

  useEffect(() => {
    if (!engine || platforms.length === 0) return undefined;
    const frame = window.requestAnimationFrame(reset);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, platforms.length, reset]);

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
      else if (key === "d" || key === "arrowright")
        setControl("right", true);
      else if (key === "s" || key === "arrowdown")
        setControl("crouch", true);
      else if (key === "e") setControl("grab", true);
      else if (
        (key === "w" || key === "arrowup" || key === " ") &&
        !event.repeat
      )
        jump();
      else if (key === "q" && !event.repeat) ink();
      else if (key === "r" && !event.repeat) reset();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") setControl("left", false);
      else if (key === "d" || key === "arrowright")
        setControl("right", false);
      else if (key === "s" || key === "arrowdown")
        setControl("crouch", false);
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
    if (!engine || platforms.length === 0) return undefined;
    let frame = 0;

    const updateGame = (timeMs: number) => {
      if (!recoveringRef.current) {
        const followLine = Math.max(210, window.innerHeight * 0.42);
        if (engine.body.position.y < followLine && engine.body.velocity.y < 0) {
          const shift = followLine - engine.body.position.y;
          cameraY.current -= shift;
          engine.translate(0, shift);
        }
      }

      engine.setEnvironmentSurfaces(layoutWorld(timeMs));
      const locomotion = engine.getLocomotionState();
      const grounded = locomotion.grounded;

      if (grounded && !lastGrounded.current && !recoveringRef.current) {
        const surfaceId = locomotion.surfaceId;
        if (surfaceId === "viewport-floor") {
          recoverFromFall();
        } else if (surfaceId?.startsWith("octopod-platform-")) {
          const landedIndex = Number(surfaceId.slice("octopod-platform-".length));
          if (Number.isFinite(landedIndex)) {
            checkpointIndex.current = Math.max(
              checkpointIndex.current,
              landedIndex,
            );
            if (landedIndex > highestIndex.current) {
              highestIndex.current = landedIndex;
              setScore(landedIndex);
              setLastAction(`Platform ${landedIndex} held`);
              setBest((currentBest) => {
                const nextBest = Math.max(currentBest, landedIndex);
                if (nextBest !== currentBest) {
                  try {
                    window.localStorage.setItem(
                      BEST_STORAGE_KEY,
                      String(nextBest),
                    );
                  } catch {
                    // A blocked storage preference does not block the run.
                  }
                }
                return nextBest;
              });
            } else {
              setLastAction("Soft landing — bounce queued");
            }
            if (landedIndex > 0 && landedIndex % 8 === 0) {
              engine.triggerInkBurst();
            }
          }
          bounceAt.current = timeMs + 72;
        }
      }

      if (
        grounded &&
        bounceAt.current > 0 &&
        timeMs >= bounceAt.current &&
        !recoveringRef.current
      ) {
        bounceAt.current = 0;
        engine.requestJump();
      }

      lastGrounded.current = grounded;
      if (
        !recoveringRef.current &&
        engine.body.position.y > window.innerHeight + 76
      ) {
        recoverFromFall();
      }
      frame = window.requestAnimationFrame(updateGame);
    };

    frame = window.requestAnimationFrame(updateGame);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, layoutWorld, platforms.length, recoverFromFall]);

  useEffect(
    () => () => {
      if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    },
    [],
  );

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
      <div className={styles.depthField} aria-hidden="true" />
      <div className={styles.world} aria-hidden="true">
        {platforms.map((platform) => (
          <div
            className={styles.ascentPlatform}
            data-milestone={platform.index > 0 && platform.index % 8 === 0}
            data-visible="true"
            key={platform.id}
            ref={(node) => {
              if (node) platformNodes.current.set(platform.id, node);
              else platformNodes.current.delete(platform.id);
            }}
          >
            {platform.index > 0 && platform.index % 8 === 0 ? (
              <span>{platform.index * 12}m</span>
            ) : null}
          </div>
        ))}
      </div>

      <ProceduralCharacter
        spec={octopodPreset}
        debug={debug}
        sampleEnvironment={false}
        onEngineReady={setEngine}
      />

      <header className={styles.titlebar}>
        <p className={styles.eyebrow}>Procedural ascent / endless study</p>
        <h1>Spring Octopus</h1>
        <p>It bounces on its own. You steer the landing; the camera reveals the next decision.</p>
        <div className={styles.headerLinks}>
          <Link href="/creature-lab?creature=octopus">Open the rig lab</Link>
          <button
            type="button"
            aria-pressed={debug}
            onClick={() => setDebug((value) => !value)}
          >
            {debug ? "Hide anatomy" : "Show anatomy"}
          </button>
        </div>
      </header>

      <aside className={styles.scoreCard} aria-live="polite">
        <span>Altitude</span>
        <strong>{(score * 12).toString().padStart(3, "0")}m</strong>
        <small>
          best {(best * 12).toString().padStart(3, "0")}m · {lastAction}
        </small>
      </aside>

      <section className={styles.keymap} aria-label="Keyboard controls">
        <div><kbd>A</kbd><kbd>D</kbd><span>steer in the air</span></div>
        <div><kbd>W</kbd><kbd>Space</kbd><span>pulse a landing</span></div>
        <div><kbd>S</kbd><span>soften / brake</span></div>
        <div><kbd>E</kbd><span>brace tentacles</span></div>
        <div><kbd>Q</kbd><span>ink signal</span></div>
        <div><kbd>R</kbd><span>new run</span></div>
      </section>

      <section className={styles.deck}>
        <div>
          <p>Land, compress, rebound.</p>
          <span>Horizontal intent changes momentum; eight spring feet solve every contact live.</span>
        </div>
        <div className={styles.touchControls} aria-label="Touch controls">
          <button type="button" aria-label="Move left" {...bindHold("left")}>←</button>
          <button type="button" aria-label="Move right" {...bindHold("right")}>→</button>
          <button type="button" onClick={jump}>Pulse</button>
          <button type="button" {...bindHold("crouch")}>Soften</button>
          <button type="button" onClick={ink}>Ink</button>
          <button type="button" onClick={reset}>Restart</button>
        </div>
      </section>

      <div className={styles.recoveryVeil} data-active={recovering} aria-hidden="true">
        <span>rewinding the current</span>
      </div>
    </main>
  );
}
