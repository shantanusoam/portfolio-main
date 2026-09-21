"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Cinema.module.css";

/** Original generative score; scheduled on the audio clock, never autoplayed. */
function createGardenScore() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  const delay = context.createDelay(3);
  delay.delayTime.value = 0.72;
  const feedback = context.createGain();
  feedback.gain.value = 0.23;
  filter.connect(master);
  filter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
  master.connect(context.destination);
  const phrase = [
    48, 55, 60, 64, 67, 64, 60, 55, 45, 52, 57, 60, 64, 60, 57, 52,
  ];
  let index = 0,
    next = context.currentTime + 0.15,
    closed = false;
  const voices = new Set<OscillatorNode>();
  const schedule = () => {
    if (closed || context.state !== "running") return;
    while (next < context.currentTime + 3) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value =
        440 * Math.pow(2, (phrase[index++ % phrase.length] - 69) / 12);
      envelope.gain.setValueAtTime(0, next);
      envelope.gain.linearRampToValueAtTime(0.23, next + 1.6);
      envelope.gain.exponentialRampToValueAtTime(0.0001, next + 7);
      oscillator.connect(envelope);
      envelope.connect(filter);
      voices.add(oscillator);
      oscillator.onended = () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(next);
      oscillator.stop(next + 7.1);
      next += 2.4;
    }
  };
  const timer = setInterval(schedule, 1000);
  const start = async () => {
    await context.resume();
    if (!closed) {
      master.gain.setTargetAtTime(0.18, context.currentTime, 1.2);
      schedule();
    }
  };
  const visibility = () => {
    if (closed) return;
    if (document.hidden) void context.suspend();
    else void context.resume().then(schedule);
  };
  document.addEventListener("visibilitychange", visibility);
  return {
    start,
    volume: (value: number) => {
      if (!closed)
        master.gain.setTargetAtTime(value * 0.36, context.currentTime, 0.2);
    },
    stop: () => {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      master.gain.setTargetAtTime(0, context.currentTime, 0.06);
      // Close also releases all scheduled sources. A short release prevents clicks.
      setTimeout(() => {
        voices.forEach((v) => {
          try {
            v.stop();
          } catch {}
        });
        void context.close();
      }, 220);
    },
  };
}
export default function GardenSound() {
  const score = useRef<ReturnType<typeof createGardenScore> | null>(null);
  const [playing, setPlaying] = useState(false),
    [volume, setVolume] = useState(0.5),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      score.current?.stop();
      score.current = null;
    },
    [],
  );
  const toggle = async () => {
    if (score.current) {
      score.current.stop();
      score.current = null;
      setPlaying(false);
      return;
    }
    try {
      const next = createGardenScore();
      score.current = next;
      await next.start();
      if (score.current === next) {
        next.volume(volume);
        setPlaying(true);
        setError("");
      }
    } catch {
      score.current?.stop();
      score.current = null;
      setError("Sound unavailable");
    }
  };
  return (
    <div className={styles.sound}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pause garden music" : "Play garden music"}
      >
        {playing ? "♫ Sound on" : "♫ Add a little music"}
      </button>
      {playing && (
        <input
          aria-label="Music volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => {
            const value = Number(event.target.value);
            setVolume(value);
            score.current?.volume(value);
          }}
        />
      )}
      {error && <span role="status">{error}</span>}
    </div>
  );
}
