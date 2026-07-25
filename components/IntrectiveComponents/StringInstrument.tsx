"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./stringInstrument.module.css";
import {
  CHORDS,
  type PluckBufferCache,
  playPhysicalString,
} from "./stringSynth";

const STRINGS = [
  { gauge: 2.4 },
  { gauge: 2.1 },
  { gauge: 1.8 },
  { gauge: 1.5 },
  { gauge: 1.2 },
  { gauge: 0.9 },
] as const;

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 240;
const STRING_GAP = 34;
const FIRST_STRING_Y = 35;
const MAX_BEND = 26;

type StringMotion = {
  bend: number;
  velocity: number;
  anchorX: number;
  held: boolean;
};

type PointerSession = {
  stringIndex: number;
  previousY: number;
  previousTime: number;
  startY: number;
  mode: "pull" | "strum";
};

function createMotion(): StringMotion[] {
  return STRINGS.map(() => ({
    bend: 0,
    velocity: 0,
    anchorX: 0.5,
    held: false,
  }));
}

export default function StringInstrument() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const pickRef = useRef<HTMLDivElement>(null);
  const motions = useRef<StringMotion[]>(createMotion());
  const pointers = useRef(new Map<number, PointerSession>());
  const frameRef = useRef<number>();
  const previousFrame = useRef<number>();
  const audioContext = useRef<AudioContext>();
  const audioBuffers = useRef<PluckBufferCache>(new Map());
  const chordIndexRef = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();
  const [lastNote, setLastNote] = useState<string>();
  const [currentChord, setCurrentChord] = useState(0);
  const [activeString, setActiveString] = useState<number>();
  const [hoveredString, setHoveredString] = useState<number>();
  const [status, setStatus] = useState<"ready" | "holding" | "strumming">(
    "ready"
  );
  const [showHint, setShowHint] = useState(true);

  const drawString = useCallback((index: number) => {
    const path = pathRefs.current[index];
    if (!path) return;

    const string = motions.current[index];
    const y = FIRST_STRING_Y + index * STRING_GAP;
    const controlX = string.anchorX * VIEWBOX_WIDTH;
    path.setAttribute(
      "d",
      `M 0 ${y} Q ${controlX} ${y + string.bend} ${VIEWBOX_WIDTH} ${y}`
    );
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      const elapsed = Math.min((timestamp - (previousFrame.current ?? timestamp)) / 16.67, 2);
      previousFrame.current = timestamp;
      let moving = false;

      motions.current.forEach((string, index) => {
        if (!string.held && !prefersReducedMotion) {
          // Reason: a damped spring produces a physical decay without a costly
          // React render on every frame.
          const acceleration = -0.14 * string.bend - 0.075 * string.velocity;
          string.velocity += acceleration * elapsed;
          string.bend += string.velocity * elapsed;
        } else if (prefersReducedMotion) {
          string.bend = 0;
          string.velocity = 0;
        }

        if (Math.abs(string.bend) > 0.05 || Math.abs(string.velocity) > 0.05) {
          moving = true;
        } else if (!string.held) {
          string.bend = 0;
          string.velocity = 0;
        }
        drawString(index);
      });

      if (moving || pointers.current.size > 0) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = undefined;
        previousFrame.current = undefined;
      }
    },
    [drawString, prefersReducedMotion]
  );

  const startAnimation = useCallback(() => {
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  useEffect(() => {
    STRINGS.forEach((_, index) => drawString(index));
    try {
      if (window.sessionStorage.getItem("hero-string-hint-seen")) {
        setShowHint(false);
      } else {
        hintTimer.current = setTimeout(() => {
          setShowHint(false);
          window.sessionStorage.setItem("hero-string-hint-seen", "true");
        }, 6000);
      }
    } catch {
      hintTimer.current = setTimeout(() => setShowHint(false), 6000);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      audioContext.current?.close().catch(() => undefined);
    };
  }, [drawString]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    try {
      window.sessionStorage.setItem("hero-string-hint-seen", "true");
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
  }, []);

  const setChordFromX = useCallback((x: number) => {
    const index = Math.min(
      CHORDS.length - 1,
      Math.max(0, Math.floor((x / VIEWBOX_WIDTH) * CHORDS.length))
    );
    if (index !== chordIndexRef.current) {
      chordIndexRef.current = index;
      setCurrentChord(index);
    }
    return index;
  }, []);

  const playNote = useCallback((index: number, intensity = 0.55, x = 500) => {
    const Context = window.AudioContext;
    const context = audioContext.current ?? new Context();
    audioContext.current = context;

    const chord = CHORDS[chordIndexRef.current];
    const [note, frequency] = chord.strings[index];
    const startPlayback = () => {
      playPhysicalString({
        context,
        cache: audioBuffers.current,
        frequency,
        intensity,
        pan: (x / VIEWBOX_WIDTH) * 2 - 1,
      });
    };

    if (context.state === "suspended") {
      context.resume().then(startPlayback).catch(() => undefined);
    } else {
      startPlayback();
    }
    setLastNote(note);
  }, []);

  function getPoint(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEWBOX_WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEWBOX_HEIGHT,
    };
  }

  function nearestString(y: number) {
    return Math.max(
      0,
      Math.min(STRINGS.length - 1, Math.round((y - FIRST_STRING_Y) / STRING_GAP))
    );
  }

  function exciteString(index: number, bend: number, x: number) {
    const string = motions.current[index];
    string.held = true;
    string.anchorX = Math.min(Math.max(x / VIEWBOX_WIDTH, 0.08), 0.92);
    string.bend = Math.min(Math.max(bend, -MAX_BEND), MAX_BEND);
    string.velocity = 0;
    drawString(index);
    startAnimation();
  }

  function releaseString(
    index: number,
    force = 0.5,
    x = VIEWBOX_WIDTH / 2,
    withSound = true
  ) {
    const string = motions.current[index];
    string.held = false;
    string.velocity += Math.sign(string.bend || 1) * Math.min(8 + force * 10, 18);
    if (withSound) playNote(index, force, x);
    startAnimation();
  }

  function strumString(index: number, direction: number, force: number, x: number) {
    const string = motions.current[index];
    string.held = false;
    string.anchorX = Math.min(Math.max(x / VIEWBOX_WIDTH, 0.08), 0.92);
    string.bend = direction * Math.min(9 + force * 8, 18);
    string.velocity = direction * Math.min(8 + force * 9, 17);
    playNote(index, force, x);
    startAnimation();
  }

  function positionPick(event: React.PointerEvent<SVGSVGElement>) {
    if (!pickRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pickRef.current.style.setProperty(
      "--pick-x",
      `${event.clientX - bounds.left}px`
    );
    pickRef.current.style.setProperty(
      "--pick-y",
      `${event.clientY - bounds.top + 16}px`
    );
    pickRef.current.dataset.visible = "true";
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const point = getPoint(event);
    const index = nearestString(point.y);
    const stringY = FIRST_STRING_Y + index * STRING_GAP;
    dismissHint();
    setChordFromX(point.x);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      stringIndex: index,
      previousY: point.y,
      previousTime: event.timeStamp,
      startY: point.y,
      mode: "pull",
    });
    setActiveString(index);
    setStatus("holding");
    exciteString(index, point.y - stringY || 5, point.x);
    playNote(index, 0.2, point.x);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    positionPick(event);
    const point = getPoint(event);
    const session = pointers.current.get(event.pointerId);
    if (!session) {
      setChordFromX(point.x);
      const nearest = nearestString(point.y);
      if (nearest !== hoveredString) setHoveredString(nearest);
      return;
    }

    setChordFromX(point.x);
    const elapsed = Math.max(event.timeStamp - session.previousTime, 1);
    const stepY = point.y - session.previousY;
    const speed = Math.abs(stepY) / elapsed;
    const totalTravel = Math.abs(point.y - session.startY);

    // A slow pull remains locked to its starting string. A decisive vertical
    // sweep becomes a strum only after the user has had room for a full bend.
    if (
      session.mode === "pull" &&
      totalTravel > STRING_GAP * 0.82 &&
      speed > 0.38
    ) {
      releaseString(session.stringIndex, 0.35, point.x, false);
      session.mode = "strum";
      setStatus("strumming");
    }

    if (session.mode === "pull") {
      const stringY = FIRST_STRING_Y + session.stringIndex * STRING_GAP;
      exciteString(session.stringIndex, point.y - stringY, point.x);
    } else {
      const nextIndex = nearestString(point.y);
      if (nextIndex !== session.stringIndex) {
        const direction = nextIndex > session.stringIndex ? 1 : -1;
        const force = Math.min(0.42 + speed * 0.55, 1);

        // Fast pointer events can jump several rows. Trigger every crossed
        // string so a quick desktop sweep still produces a complete chord.
        for (
          let index = session.stringIndex + direction;
          direction > 0 ? index <= nextIndex : index >= nextIndex;
          index += direction
        ) {
          strumString(index, direction, force, point.x);
        }
        session.stringIndex = nextIndex;
        setActiveString(nextIndex);
      }
    }

    session.previousY = point.y;
    session.previousTime = event.timeStamp;
  }

  function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const session = pointers.current.get(event.pointerId);
    if (!session) return;
    if (session.mode === "pull") {
      const bend = Math.abs(motions.current[session.stringIndex].bend);
      const force = Math.min(0.35 + bend / MAX_BEND, 1);
      releaseString(session.stringIndex, force, getPoint(event).x, bend > 6);
    }
    pointers.current.delete(event.pointerId);
    setActiveString(undefined);
    setStatus("ready");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = Number(event.key) - 1;
    if (index < 0 || index >= STRINGS.length || event.repeat) return;
    event.preventDefault();
    const string = motions.current[index];
    string.bend = 14;
    string.velocity = 10;
    playNote(index, 0.65, VIEWBOX_WIDTH / 2);
    setActiveString(index);
    setTimeout(() => setActiveString(undefined), 180);
    startAnimation();
  }

  return (
    <div
      className={styles.instrument}
      role="group"
      aria-label="Playable six-string instrument. Pull a string slowly, sweep vertically to strum, or press keys 1 through 6."
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-status={status}
    >
      <div className={styles.legend} aria-hidden="true">
        <span>
          {status === "ready"
            ? "hold + pull · sweep to strum"
            : status === "holding"
            ? "release to pluck"
            : "keep sweeping"}
        </span>
        <span className={styles.note}>
          {lastNote ? `${lastNote} · ` : ""}
          {CHORDS[currentChord].name}
        </span>
        <span className={styles.keyboardHint}>keys 1—6</span>
      </div>
      <div className={styles.chordRail} aria-hidden="true">
        {CHORDS.map((chord, index) => (
          <span
            key={chord.shortName}
            className={index === currentChord ? styles.activeChord : undefined}
          >
            {chord.shortName}
          </span>
        ))}
      </div>
      {showHint && !prefersReducedMotion && (
        <div className={styles.demoPick} aria-hidden="true" />
      )}
      <div ref={pickRef} className={styles.pick} aria-hidden="true" />
      <svg
        className={styles.strings}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        onPointerEnter={positionPick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (pointers.current.size === 0 && pickRef.current) {
            pickRef.current.dataset.visible = "false";
            setHoveredString(undefined);
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
        aria-hidden="true"
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="transparent" />
        {STRINGS.map((string, index) => (
          <path
            key={index}
            ref={(element) => {
              pathRefs.current[index] = element;
            }}
            className={[
              styles.string,
              index === hoveredString ? styles.hoveredString : "",
              index === activeString ? styles.activeString : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ strokeWidth: string.gauge }}
            d=""
          />
        ))}
      </svg>
      <span className={styles.srStatus} aria-live="polite">
        {lastNote
          ? `Played ${lastNote} in ${CHORDS[currentChord].name}`
          : ""}
      </span>
    </div>
  );
}
