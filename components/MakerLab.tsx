"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Heading from "./ui/Heading";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import { useRandomInterval } from "@/hooks/useRandomInterval";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { sensorChannels, experiments } from "@/constants/makerLab";
import { SensorChannel } from "@/@types/lab.type";

// Purely ambient — reads as "real lab equipment humming" behind the
// telemetry grid, no new numbers, no clutter. The path repeats exactly
// every 40 units and translates by a multiple of that (200), so the loop
// is seamless with no visible jump at the reset point.
function OscilloscopeTrace() {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-8 h-16 w-full opacity-[0.08]"
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0 30 Q10 10 20 30 T40 30 T60 30 T80 30 T100 30 T120 30 T140 30 T160 30 T180 30 T200 30 T220 30 T240 30 T260 30 T280 30 T300 30 T320 30 T340 30 T360 30 T380 30 T400 30"
        fill="none"
        stroke="#35d9c6"
        strokeWidth={1}
        animate={prefersReducedMotion ? {} : { x: [0, -200] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

function randomInRange(min: number, max: number, decimals: number) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomReadings() {
  return Object.fromEntries(
    sensorChannels.map((channel) => [
      channel.id,
      randomInRange(channel.min, channel.max, channel.decimals),
    ])
  );
}

// Math.random() run as a useState initializer executes once during SSR and
// once again, independently, on the client's first render — two different
// random numbers, guaranteed, which always fails hydration. The midpoint is
// a deterministic placeholder identical on both; the real (client-only)
// random reading kicks in a moment later via the effect below.
function midpointReadings() {
  return Object.fromEntries(
    sensorChannels.map((channel) => [
      channel.id,
      Number((((channel.min + channel.max) / 2)).toFixed(channel.decimals)),
    ])
  );
}

// Clicking a sensor forces an immediate re-read + a one-frame scanline
// flicker — a "live" readout that never responds to a poke doesn't feel
// live; one tap that visibly does something turns decoration into a toy.
function SensorCard({
  channel,
  value,
  onPing,
}: {
  channel: SensorChannel;
  value: number;
  onPing: () => void;
}) {
  const [pinged, setPinged] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        onPing();
        setPinged(true);
        setTimeout(() => setPinged(false), 220);
      }}
      className="gradientborder relative overflow-hidden border bg-black p-6 text-left active:scale-95 transition-transform duration-150"
      aria-label={`Ping ${channel.label} sensor`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-darkgray">
        {channel.label}
      </p>
      <p className="font-data mt-2 text-2xl text-primary">
        {channel.id === "motion"
          ? value > 0.5
            ? "Detected"
            : "None"
          : `${value}${channel.unit}`}
      </p>
      {pinged && (
        <motion.div
          initial={{ opacity: 0.5, y: "-100%" }}
          animate={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
        />
      )}
    </button>
  );
}

function Telemetry() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [readings, setReadings] = useState<Record<string, number>>(midpointReadings);

  // Client-only: the first real (random) reading, right after mount.
  useEffect(() => {
    setReadings(randomReadings());
  }, []);

  useRandomInterval(
    () => setReadings(randomReadings()),
    prefersReducedMotion ? null : 900,
    prefersReducedMotion ? null : 2400
  );

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {sensorChannels.map((channel) => (
        <SensorCard
          key={channel.id}
          channel={channel}
          value={readings[channel.id]}
          onPing={() =>
            setReadings((prev) => ({
              ...prev,
              [channel.id]: randomInRange(channel.min, channel.max, channel.decimals),
            }))
          }
        />
      ))}
    </div>
  );
}

export default function MakerLab() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionOpacity = useSectionExitFade(sectionRef);

  return (
    <motion.section
      style={{ opacity: sectionOpacity }}
      id="maker-lab"
      ref={sectionRef}
      className="relative mx-[10%] my-[3rem] select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading>MAKER LAB</Heading>
      <p className="mt-4 text-center text-xs text-graytransparent sm:text-left sm:text-sm">
        Sensor telemetry, edge AI, robotics, and motion experiments. The
        readout below is a simulated feed, not a live device — yet.
      </p>

      <div className="relative mt-16">
        <OscilloscopeTrace />
        <Telemetry />
      </div>

      <div className="mt-16 flex flex-col gap-6">
        {experiments.map((experiment) => (
          <div
            key={experiment.id}
            className="gradientborder flex flex-col gap-2 border bg-black p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display tracking-wide text-white">
                {experiment.title}
              </p>
              {experiment.isPlaceholder && (
                <span className="rounded-sm border border-primary px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                  Coming soon
                </span>
              )}
            </div>
            <p className="text-sm text-graytransparent">
              {experiment.description}
            </p>
            <div className="flex flex-wrap gap-2 font-mono text-xs uppercase text-darkgray">
              {experiment.tech.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
            {experiment.link && !experiment.isPlaceholder && (
              <Link
                href={experiment.link}
                target={experiment.link.startsWith("/") ? undefined : "_blank"}
                className="mt-2 text-xs uppercase tracking-widest text-primary hover:underline"
              >
                {experiment.link.startsWith("/") ? "Read the full write-up" : "View scene"} ↗
              </Link>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
