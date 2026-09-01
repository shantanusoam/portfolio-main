"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import type { StringControlLesson, StringLabControl } from "./courseTutorials";
import styles from "./stringLab.module.css";

const CHORDS = [
  {
    name: "C major",
    short: "C",
    strings: [
      ["C3", 130.81],
      ["G3", 196],
      ["C4", 261.63],
      ["E4", 329.63],
      ["G4", 392],
      ["C5", 523.25],
    ],
  },
  {
    name: "A minor",
    short: "Am",
    strings: [
      ["A2", 110],
      ["E3", 164.81],
      ["A3", 220],
      ["C4", 261.63],
      ["E4", 329.63],
      ["A4", 440],
    ],
  },
  {
    name: "F major",
    short: "F",
    strings: [
      ["F2", 87.31],
      ["C3", 130.81],
      ["F3", 174.61],
      ["A3", 220],
      ["C4", 261.63],
      ["F4", 349.23],
    ],
  },
  {
    name: "G major",
    short: "G",
    strings: [
      ["G2", 98],
      ["D3", 146.83],
      ["G3", 196],
      ["B3", 246.94],
      ["D4", 293.66],
      ["G4", 392],
    ],
  },
] as const;

export type StringPresetName = "clean" | "dream" | "crunch" | "custom";

export interface StringLabPreset {
  tension: number;
  damping: number;
  tone: number;
  drive: number;
  delay: number;
  feedback: number;
  reverb: number;
  output: number;
  chord: number;
  preset: StringPresetName;
}

const EFFECT_PRESETS: Record<
  Exclude<StringPresetName, "custom">,
  Pick<
    StringLabPreset,
    "tone" | "drive" | "delay" | "feedback" | "reverb" | "output"
  >
> = {
  clean: {
    tone: 0.66,
    drive: 0.03,
    delay: 0.12,
    feedback: 0.12,
    reverb: 0.08,
    output: 0.54,
  },
  dream: {
    tone: 0.54,
    drive: 0.08,
    delay: 0.38,
    feedback: 0.52,
    reverb: 0.48,
    output: 0.47,
  },
  crunch: {
    tone: 0.76,
    drive: 0.72,
    delay: 0.16,
    feedback: 0.2,
    reverb: 0.16,
    output: 0.42,
  },
};

type StringMotion = {
  bend: number;
  velocity: number;
  anchorX: number;
  held: boolean;
  energy: number;
};

type PointerSession = {
  pointerId: number;
  stringIndex: number;
  lastY: number;
  lastTime: number;
  startY: number;
  mode: "pull" | "strum";
};

type AudioGraph = {
  context: AudioContext;
  input: GainNode;
  drive: WaveShaperNode;
  dry: GainNode;
  delay: DelayNode;
  feedback: GainNode;
  delayWet: GainNode;
  convolver: ConvolverNode;
  reverbWet: GainNode;
  compressor: DynamicsCompressorNode;
  master: GainNode;
};

function createStrings(): StringMotion[] {
  return Array.from({ length: 6 }, () => ({
    bend: 0,
    velocity: 0,
    anchorX: 0.5,
    held: false,
    energy: 0,
  }));
}

function distortionCurve(amount: number) {
  const curve = new Float32Array(2048);
  const k = Math.max(0, amount) * 45;
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index * 2) / (curve.length - 1) - 1;
    curve[index] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

function createImpulse(context: AudioContext) {
  const seconds = 1.8;
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 2.4);
    }
  }
  return buffer;
}

function renderPluck(
  context: AudioContext,
  frequency: number,
  damping: number,
) {
  const duration = 2.45;
  const frameCount = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(context.sampleRate / frequency));
  const feedbackDecay = 0.998 - damping * 0.0065;

  for (let frame = 0; frame < period; frame += 1) {
    samples[frame] = Math.random() * 2 - 1;
  }
  for (let frame = period; frame < frameCount; frame += 1) {
    const delayed = frame - period;
    samples[frame] =
      feedbackDecay * 0.5 * (samples[delayed] + samples[delayed + 1]);
  }
  return buffer;
}

function smooth(parameter: AudioParam, value: number, context: AudioContext) {
  parameter.cancelScheduledValues(context.currentTime);
  parameter.setTargetAtTime(value, context.currentTime, 0.02);
}

export default function StringLab({
  preset: incomingPreset,
  title,
  controlLessons,
}: {
  preset: StringLabPreset;
  title: string;
  controlLessons: readonly StringControlLesson[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stringsRef = useRef<StringMotion[]>(createStrings());
  const pointerRef = useRef<PointerSession | null>(null);
  const frameRef = useRef<number | null>(null);
  const previousFrameRef = useRef<number | null>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  const graphPromiseRef = useRef<Promise<AudioGraph | null> | null>(null);
  const bufferCacheRef = useRef(new Map<string, AudioBuffer>());
  const activeSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const destroyedRef = useRef(false);
  const mutedRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [settings, setSettings] = useState<StringLabPreset>(incomingPreset);
  const settingsRef = useRef(settings);
  const [audioState, setAudioState] = useState<
    "locked" | "running" | "muted" | "unsupported"
  >("locked");
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [status, setStatus] = useState<"ready" | "holding" | "strumming">(
    "ready",
  );

  const focusedControls = useMemo(
    () => new Set<StringLabControl>(controlLessons.map((item) => item.control)),
    [controlLessons],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const gap = Math.min(42, (height - 78) / 5);
    const firstY = (height - gap * 5) / 2;

    context.clearRect(0, 0, width, height);

    const wash = context.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, "rgba(255, 173, 92, 0.055)");
    wash.addColorStop(0.55, "rgba(255, 255, 255, 0.008)");
    wash.addColorStop(1, "rgba(109, 154, 180, 0.045)");
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);

    CHORDS.forEach((chord, index) => {
      const left = (index / CHORDS.length) * width;
      const zoneWidth = width / CHORDS.length;
      context.fillStyle =
        index === settingsRef.current.chord
          ? "rgba(255, 171, 91, 0.045)"
          : "transparent";
      context.fillRect(left, 0, zoneWidth, height);
      if (index > 0) {
        context.strokeStyle = "rgba(255, 224, 191, 0.06)";
        context.beginPath();
        context.moveTo(left, 18);
        context.lineTo(left, height - 18);
        context.stroke();
      }
      context.fillStyle =
        index === settingsRef.current.chord
          ? "rgba(255, 190, 126, 0.72)"
          : "rgba(226, 211, 194, 0.24)";
      context.font = "10px ui-monospace, monospace";
      context.textAlign = "center";
      context.fillText(chord.short, left + zoneWidth / 2, height - 13);
    });

    stringsRef.current.forEach((string, index) => {
      const y = firstY + index * gap;
      const controlX = string.anchorX * width;
      const glow = Math.min(1, string.energy);

      if (glow > 0.02) {
        const aura = context.createRadialGradient(
          controlX,
          y + string.bend,
          0,
          controlX,
          y + string.bend,
          34 + glow * 20,
        );
        aura.addColorStop(0, `rgba(255, 157, 76, ${0.18 * glow})`);
        aura.addColorStop(1, "rgba(255, 157, 76, 0)");
        context.fillStyle = aura;
        context.beginPath();
        context.arc(controlX, y + string.bend, 34 + glow * 20, 0, Math.PI * 2);
        context.fill();
      }

      context.lineWidth = 2.7 - index * 0.34;
      context.strokeStyle =
        string.held || glow > 0.25
          ? "rgba(255, 176, 104, 0.98)"
          : index < 2
            ? "rgba(230, 198, 155, 0.82)"
            : "rgba(247, 237, 221, 0.82)";
      context.shadowColor = `rgba(255, 145, 65, ${0.28 * glow})`;
      context.shadowBlur = 12 * glow;
      context.beginPath();
      context.moveTo(18, y);
      context.quadraticCurveTo(controlX, y + string.bend, width - 18, y);
      context.stroke();
      context.shadowBlur = 0;
    });
  }, []);

  const updateGraph = useCallback((next: StringLabPreset) => {
    const graph = graphRef.current;
    if (!graph) return;
    const { context } = graph;
    graph.drive.curve = distortionCurve(next.drive);
    smooth(graph.dry.gain, 0.94 - next.drive * 0.16, context);
    smooth(graph.delay.delayTime, Math.min(0.72, next.delay), context);
    smooth(graph.feedback.gain, Math.min(0.78, next.feedback), context);
    smooth(
      graph.delayWet.gain,
      next.delay > 0.03 ? 0.08 + next.feedback * 0.42 : 0,
      context,
    );
    smooth(graph.reverbWet.gain, next.reverb * 0.58, context);
    smooth(graph.master.gain, mutedRef.current ? 0 : next.output, context);
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    updateGraph(settings);
    draw();
  }, [draw, settings, updateGraph]);

  useEffect(() => {
    setSettings(incomingPreset);
    settingsRef.current = incomingPreset;
  }, [incomingPreset]);

  const ensureGraph = useCallback(async () => {
    if (destroyedRef.current) return null;
    if (graphRef.current) {
      if (graphRef.current.context.state === "suspended") {
        await graphRef.current.context.resume();
      }
      setAudioState("running");
      return graphRef.current;
    }
    if (graphPromiseRef.current) return graphPromiseRef.current;

    const activation = (async (): Promise<AudioGraph | null> => {
      const AudioCtor =
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioCtor) {
        setAudioState("unsupported");
        return null;
      }

      try {
        const context = new AudioCtor({ latencyHint: "interactive" });
        if (context.state === "suspended") await context.resume();
        if (destroyedRef.current) {
          await context.close();
          return null;
        }

        const input = context.createGain();
        const drive = context.createWaveShaper();
        const dry = context.createGain();
        const delay = context.createDelay(1);
        const feedback = context.createGain();
        const delayWet = context.createGain();
        const convolver = context.createConvolver();
        const reverbWet = context.createGain();
        const compressor = context.createDynamicsCompressor();
        const master = context.createGain();

        drive.oversample = "2x";
        convolver.buffer = createImpulse(context);
        compressor.threshold.value = -20;
        compressor.knee.value = 24;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.25;

        input.connect(drive);
        drive.connect(dry);
        dry.connect(compressor);
        drive.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayWet);
        delayWet.connect(compressor);
        drive.connect(convolver);
        convolver.connect(reverbWet);
        reverbWet.connect(compressor);
        compressor.connect(master);
        master.connect(context.destination);

        const graph = {
          context,
          input,
          drive,
          dry,
          delay,
          feedback,
          delayWet,
          convolver,
          reverbWet,
          compressor,
          master,
        };
        graphRef.current = graph;
        updateGraph(settingsRef.current);
        setAudioState("running");
        return graph;
      } catch {
        setAudioState("unsupported");
        return null;
      }
    })();

    graphPromiseRef.current = activation;
    const graph = await activation;
    if (graphPromiseRef.current === activation) graphPromiseRef.current = null;
    return graph;
  }, [updateGraph]);

  const animate = useCallback(
    (timestamp: number) => {
      const elapsed = Math.min(
        (timestamp - (previousFrameRef.current ?? timestamp)) / 16.67,
        2,
      );
      previousFrameRef.current = timestamp;
      const { tension, damping } = settingsRef.current;
      let moving = false;

      stringsRef.current.forEach((string) => {
        if (prefersReducedMotion) {
          if (!string.held) {
            string.bend = 0;
            string.velocity = 0;
          }
          string.energy = 0;
          return;
        }

        if (!string.held) {
          const stiffness = 0.055 + tension * 0.16;
          const drag = 0.035 + damping * 0.13;
          const acceleration =
            -stiffness * string.bend - drag * string.velocity;
          string.velocity += acceleration * elapsed;
          string.bend += string.velocity * elapsed;
        }
        string.energy *= Math.pow(0.9, elapsed);

        if (
          string.held ||
          Math.abs(string.bend) > 0.05 ||
          Math.abs(string.velocity) > 0.05 ||
          string.energy > 0.02
        ) {
          moving = true;
        } else {
          string.bend = 0;
          string.velocity = 0;
          string.energy = 0;
        }
      });

      draw();
      if (moving) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        previousFrameRef.current = null;
      }
    },
    [draw, prefersReducedMotion],
  );

  const requestFrame = useCallback(() => {
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const playString = useCallback(
    async (index: number, intensity = 0.62, x = 0.5, delaySeconds = 0) => {
      if (audioState === "muted" || audioState === "unsupported") return;
      const graph = await ensureGraph();
      if (!graph) return;
      const { context } = graph;
      const setting = settingsRef.current;
      const chord = CHORDS[Math.min(3, Math.max(0, setting.chord))];
      const [label, frequency] = chord.strings[index];
      const cacheKey = `${Math.round(frequency * 100)}:${setting.damping.toFixed(2)}`;
      let buffer = bufferCacheRef.current.get(cacheKey);
      if (!buffer) {
        buffer = renderPluck(context, frequency, setting.damping);
        if (bufferCacheRef.current.size >= 32) {
          const oldest = bufferCacheRef.current.keys().next().value;
          if (oldest !== undefined) bufferCacheRef.current.delete(oldest);
        }
        bufferCacheRef.current.set(cacheKey, buffer);
      }

      if (activeSourcesRef.current.size >= 12) {
        const oldest = activeSourcesRef.current.values().next().value;
        if (oldest) {
          try {
            oldest.stop();
          } catch {
            // It may already be ending; its ended handler will remove it.
          }
        }
      }

      const when = context.currentTime + Math.max(0.008, delaySeconds);
      const level = Math.min(1, Math.max(0.12, intensity));
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      const panner = context.createStereoPanner();

      source.buffer = buffer;
      source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.003;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(
        Math.min(
          900 + setting.tone * 5200 + level * 1500,
          context.sampleRate * 0.42,
        ),
        when,
      );
      filter.frequency.setTargetAtTime(
        760 + setting.tone * 980,
        when + 0.025,
        0.42,
      );
      filter.Q.value = 0.55;
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.exponentialRampToValueAtTime(0.22 * level, when + 0.004);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + 2.35);
      panner.pan.value = Math.min(0.75, Math.max(-0.75, x * 1.5 - 0.75));

      source
        .connect(filter)
        .connect(envelope)
        .connect(panner)
        .connect(graph.input);
      activeSourcesRef.current.add(source);
      source.start(when);
      source.stop(when + buffer.duration);
      source.addEventListener(
        "ended",
        () => {
          activeSourcesRef.current.delete(source);
          source.disconnect();
          filter.disconnect();
          envelope.disconnect();
          panner.disconnect();
        },
        { once: true },
      );
      setLastNote(`${label} · ${chord.short}`);
    },
    [audioState, ensureGraph],
  );

  const excite = useCallback(
    (index: number, bend: number, normalizedX: number) => {
      const string = stringsRef.current[index];
      string.held = true;
      string.anchorX = Math.min(0.92, Math.max(0.08, normalizedX));
      string.bend = Math.min(38, Math.max(-38, bend));
      string.velocity = 0;
      draw();
      requestFrame();
    },
    [draw, requestFrame],
  );

  const release = useCallback(
    (index: number, force: number, normalizedX: number, withSound = true) => {
      const string = stringsRef.current[index];
      string.held = false;
      string.energy = 1;
      if (prefersReducedMotion) {
        string.bend = 0;
        string.velocity = 0;
      } else {
        string.velocity +=
          Math.sign(string.bend || 1) * Math.min(9 + force * 12, 21);
      }
      if (withSound) {
        playString(index, force, normalizedX).catch(() => undefined);
      }
      requestFrame();
    },
    [playString, prefersReducedMotion, requestFrame],
  );

  const strumOne = useCallback(
    (index: number, direction: number, force: number, normalizedX: number) => {
      const string = stringsRef.current[index];
      string.held = false;
      string.anchorX = Math.min(0.92, Math.max(0.08, normalizedX));
      string.bend = prefersReducedMotion
        ? 0
        : direction * Math.min(11 + force * 10, 22);
      string.velocity = prefersReducedMotion
        ? 0
        : direction * Math.min(9 + force * 10, 19);
      string.energy = 1;
      playString(index, force, normalizedX).catch(() => undefined);
      requestFrame();
    },
    [playString, prefersReducedMotion, requestFrame],
  );

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const nearestString = (y: number, height: number) => {
    const gap = Math.min(42, (height - 78) / 5);
    const firstY = (height - gap * 5) / 2;
    return Math.max(0, Math.min(5, Math.round((y - firstY) / gap)));
  };

  const stringY = (index: number, height: number) => {
    const gap = Math.min(42, (height - 78) / 5);
    return (height - gap * 5) / 2 + index * gap;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    const index = nearestString(point.y, point.height);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = {
      pointerId: event.pointerId,
      stringIndex: index,
      lastY: point.y,
      lastTime: event.timeStamp,
      startY: point.y,
      mode: "pull",
    };
    setStatus("holding");
    setSettings((current) => ({
      ...current,
      chord: Math.max(
        0,
        Math.min(3, Math.floor((point.x / point.width) * CHORDS.length)),
      ),
    }));
    excite(
      index,
      point.y - stringY(index, point.height) || 5,
      point.x / point.width,
    );
    if (audioState === "locked") ensureGraph().catch(() => undefined);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = pointerRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const point = pointFromEvent(event);
    const elapsed = Math.max(event.timeStamp - session.lastTime, 1);
    const speed = Math.abs(point.y - session.lastY) / elapsed;
    const totalTravel = Math.abs(point.y - session.startY);
    const gap = Math.min(42, (point.height - 78) / 5);

    if (session.mode === "pull" && totalTravel > gap * 0.82 && speed > 0.38) {
      release(session.stringIndex, 0.35, point.x / point.width, false);
      session.mode = "strum";
      setStatus("strumming");
    }

    if (session.mode === "pull") {
      excite(
        session.stringIndex,
        point.y - stringY(session.stringIndex, point.height),
        point.x / point.width,
      );
    } else {
      const nextIndex = nearestString(point.y, point.height);
      if (nextIndex !== session.stringIndex) {
        const direction = nextIndex > session.stringIndex ? 1 : -1;
        const force = Math.min(1, 0.42 + speed * 0.55);
        for (
          let index = session.stringIndex + direction;
          direction > 0 ? index <= nextIndex : index >= nextIndex;
          index += direction
        ) {
          strumOne(index, direction, force, point.x / point.width);
        }
        session.stringIndex = nextIndex;
      }
    }

    session.lastY = point.y;
    session.lastTime = event.timeStamp;
  };

  const finishPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = pointerRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const point = pointFromEvent(event);
    if (session.mode === "pull") {
      const bend = Math.abs(stringsRef.current[session.stringIndex].bend);
      release(
        session.stringIndex,
        Math.min(1, 0.35 + bend / 38),
        point.x / point.width,
        bend > 3,
      );
    }
    pointerRef.current = null;
    setStatus("ready");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const strumChord = useCallback(() => {
    const order = [0, 1, 2, 3, 4, 5];
    order.forEach((index, orderIndex) => {
      const string = stringsRef.current[index];
      string.bend = prefersReducedMotion ? 0 : 15;
      string.velocity = prefersReducedMotion ? 0 : 11;
      string.energy = 1;
      playString(index, 0.68, 0.5, orderIndex * 0.026).catch(() => undefined);
    });
    requestFrame();
  }, [playString, prefersReducedMotion, requestFrame]);

  const stopAll = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    });
    activeSourcesRef.current.clear();
    stringsRef.current.forEach((string) => {
      string.bend = 0;
      string.velocity = 0;
      string.held = false;
      string.energy = 0;
    });
    pointerRef.current = null;
    setStatus("ready");
    draw();
  }, [draw]);

  const toggleAudio = async () => {
    if (audioState === "unsupported") return;
    if (audioState === "locked") {
      await ensureGraph();
      return;
    }
    const graph = graphRef.current;
    if (!graph) return;
    if (audioState === "muted") {
      mutedRef.current = false;
      smooth(graph.master.gain, settingsRef.current.output, graph.context);
      setAudioState("running");
    } else {
      mutedRef.current = true;
      smooth(graph.master.gain, 0, graph.context);
      setAudioState("muted");
    }
  };

  const applyPreset = (name: Exclude<StringPresetName, "custom">) => {
    setSettings((current) => ({
      ...current,
      ...EFFECT_PRESETS[name],
      preset: name,
    }));
  };

  const updateSetting = (
    key: Exclude<keyof StringLabPreset, "preset" | "chord">,
    value: number,
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
      preset:
        key === "tension" || key === "damping" ? current.preset : "custom",
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(
    () => () => {
      destroyedRef.current = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          // already stopped
        }
      });
      activeSourcesRef.current.clear();
      bufferCacheRef.current.clear();
      const graph = graphRef.current;
      graphRef.current = null;
      graphPromiseRef.current = null;
      if (graph) {
        graph.input.disconnect();
        graph.drive.disconnect();
        graph.dry.disconnect();
        graph.delay.disconnect();
        graph.feedback.disconnect();
        graph.delayWet.disconnect();
        graph.convolver.disconnect();
        graph.reverbWet.disconnect();
        graph.compressor.disconnect();
        graph.master.disconnect();
        graph.context.close().catch(() => undefined);
      }
    },
    [],
  );

  const audioLabel =
    audioState === "unsupported"
      ? "Audio unavailable"
      : audioState === "locked"
        ? "Enable sound"
        : audioState === "muted"
          ? "Sound off"
          : "Sound on";

  const sliders: Array<{
    key: Exclude<keyof StringLabPreset, "preset" | "chord">;
    control: StringLabControl;
    label: string;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
  }> = [
    {
      key: "tension",
      control: "tension",
      label: "Tension",
      min: 0,
      max: 1,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "damping",
      control: "damping",
      label: "Damping",
      min: 0,
      max: 1,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "tone",
      control: "tone",
      label: "Tone",
      min: 0,
      max: 1,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "drive",
      control: "drive",
      label: "Drive",
      min: 0,
      max: 1,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "delay",
      control: "delay",
      label: "Delay",
      min: 0.04,
      max: 0.72,
      step: 0.01,
      format: (value) => `${Math.round(value * 1000)}ms`,
    },
    {
      key: "feedback",
      control: "feedback",
      label: "Feedback",
      min: 0,
      max: 0.78,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "reverb",
      control: "reverb",
      label: "Reverb",
      min: 0,
      max: 0.72,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "output",
      control: "output",
      label: "Output",
      min: 0,
      max: 0.72,
      step: 0.01,
      format: (value) => `${Math.round(value * 100)}%`,
    },
  ];

  return (
    <section className={styles.workbench} aria-label={`${title} workbench`}>
      <div className={styles.workbenchHeader}>
        <div>
          <span>Live guitar workbench</span>
          <h3>{title}</h3>
        </div>
        <div className={styles.primaryActions}>
          <button
            type="button"
            data-focus={focusedControls.has("audio")}
            onClick={() => toggleAudio().catch(() => undefined)}
            disabled={audioState === "unsupported"}
          >
            <span className={styles.liveDot} data-state={audioState} />
            {audioLabel}
          </button>
          <button
            type="button"
            data-focus={focusedControls.has("strum")}
            onClick={strumChord}
          >
            Strum chord
          </button>
          <button
            type="button"
            data-focus={focusedControls.has("stop")}
            onClick={stopAll}
          >
            Stop voices
          </button>
        </div>
      </div>

      <div className={styles.canvasWrap} data-status={status}>
        <div className={styles.canvasLegend} aria-hidden="true">
          <span>
            {status === "holding"
              ? "release to pluck"
              : status === "strumming"
                ? "keep sweeping"
                : "pull one string · sweep to strum · keys 1—6"}
          </span>
          <strong>{lastNote ?? CHORDS[settings.chord].name}</strong>
        </div>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={0}
          aria-label="Six-string effects guitar. Pull a string, sweep vertically to strum, or press keys 1 through 6."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onKeyDown={(event) => {
            const index = Number(event.key) - 1;
            if (index < 0 || index > 5 || event.repeat) return;
            event.preventDefault();
            const string = stringsRef.current[index];
            string.bend = prefersReducedMotion ? 0 : 14;
            string.velocity = prefersReducedMotion ? 0 : 10;
            string.energy = 1;
            playString(index, 0.65, 0.5).catch(() => undefined);
            requestFrame();
          }}
          onContextMenu={(event) => event.preventDefault()}
        />
        <span className={styles.srStatus} aria-live="polite">
          {lastNote ? `Played ${lastNote}` : audioLabel}
        </span>
      </div>

      <div className={styles.chordAndPreset}>
        <fieldset data-focus={focusedControls.has("chord")}>
          <legend>Chord</legend>
          <div>
            {CHORDS.map((chord, index) => (
              <button
                type="button"
                key={chord.short}
                aria-pressed={settings.chord === index}
                onClick={() =>
                  setSettings((current) => ({ ...current, chord: index }))
                }
              >
                {chord.short}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset data-focus={focusedControls.has("preset")}>
          <legend>Effect preset</legend>
          <div>
            {(
              Object.keys(EFFECT_PRESETS) as Array<
                Exclude<StringPresetName, "custom">
              >
            ).map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={settings.preset === name}
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
            {settings.preset === "custom" ? (
              <span className={styles.customPreset}>custom</span>
            ) : null}
          </div>
        </fieldset>
      </div>

      <div className={styles.rack}>
        <div className={styles.controlGroup}>
          <span>String</span>
          {sliders.slice(0, 3).map((slider) => (
            <label
              key={slider.key}
              data-focus={focusedControls.has(slider.control)}
            >
              <span>{slider.label}</span>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={settings[slider.key]}
                aria-label={slider.label}
                onChange={(event) =>
                  updateSetting(slider.key, Number(event.currentTarget.value))
                }
              />
              <output>{slider.format(settings[slider.key])}</output>
            </label>
          ))}
        </div>
        <div className={styles.controlGroup}>
          <span>Effects</span>
          {sliders.slice(3).map((slider) => (
            <label
              key={slider.key}
              data-focus={focusedControls.has(slider.control)}
            >
              <span>{slider.label}</span>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={settings[slider.key]}
                aria-label={slider.label}
                onChange={(event) =>
                  updateSetting(slider.key, Number(event.currentTarget.value))
                }
              />
              <output>{slider.format(settings[slider.key])}</output>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.controlCoach}>
        <div>
          <span>Controls for this module</span>
          <p>Change one cause at a time, then replay the same gesture.</p>
        </div>
        <dl>
          {controlLessons.map((lesson) => (
            <div key={lesson.control}>
              <dt>{lesson.label}</dt>
              <dd>{lesson.effect}</dd>
              <dd className={styles.tryThis}>Try: {lesson.tryThis}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
