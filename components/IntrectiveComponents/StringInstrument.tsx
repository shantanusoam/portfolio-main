"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./stringInstrument.module.css";

const STRINGS = [
  { note: "C3", frequency: 130.81, gauge: 2.4 },
  { note: "G3", frequency: 196, gauge: 2.1 },
  { note: "C4", frequency: 261.63, gauge: 1.8 },
  { note: "E4", frequency: 329.63, gauge: 1.5 },
  { note: "G4", frequency: 392, gauge: 1.2 },
  { note: "C5", frequency: 523.25, gauge: 0.9 },
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
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const motions = useRef<StringMotion[]>(createMotion());
  const pointers = useRef(new Map<number, PointerSession>());
  const frameRef = useRef<number>();
  const previousFrame = useRef<number>();
  const audioContext = useRef<AudioContext>();
  const [lastNote, setLastNote] = useState<string>();

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
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      audioContext.current?.close().catch(() => undefined);
    };
  }, [drawString]);

  const playNote = useCallback((index: number, intensity = 0.55) => {
    const Context = window.AudioContext;
    const context = audioContext.current ?? new Context();
    audioContext.current = context;
    if (context.state === "suspended") {
      context.resume().catch(() => undefined);
    }

    const now = context.currentTime;
    const level = Math.min(Math.max(intensity, 0.12), 1);
    const output = context.createGain();
    const filter = context.createBiquadFilter();
    const fundamental = context.createOscillator();
    const harmonic = context.createOscillator();
    const harmonicGain = context.createGain();
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();

    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.16 * level, now + 0.008);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 1.2);
    filter.Q.value = 1.2;

    fundamental.type = "triangle";
    fundamental.frequency.value = STRINGS[index].frequency;
    harmonic.type = "sine";
    harmonic.frequency.value = STRINGS[index].frequency * 2.01;
    harmonic.detune.value = -4;
    harmonicGain.gain.value = 0.24;

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.025, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let sample = 0; sample < samples.length; sample += 1) {
      samples[sample] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = STRINGS[index].frequency * 2.5;
    noiseFilter.Q.value = 0.8;

    fundamental.connect(filter);
    harmonic.connect(harmonicGain).connect(filter);
    noise.connect(noiseFilter).connect(filter);
    filter.connect(output).connect(context.destination);

    fundamental.start(now);
    harmonic.start(now);
    noise.start(now);
    fundamental.stop(now + 1.5);
    harmonic.stop(now + 1.5);
    noise.stop(now + 0.03);
    setLastNote(STRINGS[index].note);
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

  function releaseString(index: number, force = 0.5) {
    const string = motions.current[index];
    string.held = false;
    string.velocity += Math.sign(string.bend || 1) * Math.min(8 + force * 10, 18);
    playNote(index, force);
    startAnimation();
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const point = getPoint(event);
    const index = nearestString(point.y);
    const stringY = FIRST_STRING_Y + index * STRING_GAP;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { stringIndex: index, previousY: point.y });
    exciteString(index, point.y - stringY || 7, point.x);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const session = pointers.current.get(event.pointerId);
    if (!session) return;

    const point = getPoint(event);
    const nextIndex = nearestString(point.y);
    if (nextIndex !== session.stringIndex) {
      const travel = Math.abs(point.y - session.previousY) / STRING_GAP;
      releaseString(session.stringIndex, Math.min(0.45 + travel * 0.25, 1));
      session.stringIndex = nextIndex;
    }

    const stringY = FIRST_STRING_Y + session.stringIndex * STRING_GAP;
    exciteString(session.stringIndex, point.y - stringY, point.x);
    session.previousY = point.y;
  }

  function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const session = pointers.current.get(event.pointerId);
    if (!session) return;
    const force = Math.min(
      0.35 + Math.abs(motions.current[session.stringIndex].bend) / MAX_BEND,
      1
    );
    releaseString(session.stringIndex, force);
    pointers.current.delete(event.pointerId);
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
    playNote(index, 0.65);
    startAnimation();
  }

  return (
    <div
      className={styles.instrument}
      role="group"
      aria-label="Playable six-string instrument. Drag across the strings, or press keys 1 through 6."
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.legend} aria-hidden="true">
        <span>drag to strum</span>
        <span className={styles.note}>{lastNote ?? "open C"}</span>
        <span>keys 1—6</span>
      </div>
      <svg
        ref={svgRef}
        className={styles.strings}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
        aria-hidden="true"
      >
        {STRINGS.map((string, index) => (
          <path
            key={string.note}
            ref={(element) => {
              pathRefs.current[index] = element;
            }}
            className={styles.string}
            style={{ strokeWidth: string.gauge }}
            d=""
          />
        ))}
      </svg>
      <span className={styles.srStatus} aria-live="polite">
        {lastNote ? `Played ${lastNote}` : ""}
      </span>
    </div>
  );
}
