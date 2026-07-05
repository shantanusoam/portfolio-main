"use client";

import { useEffect, useState } from "react";
import { MotionValue, motion, useScroll, useTransform } from "framer-motion";
import { useSectionBreakpoints } from "@/hooks/useSectionBreakpoints";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";

// Matches the real DOM order of sections in app/page.tsx.
const SECTION_IDS = [
  "hero",
  "trail-map",
  "mission-select",
  "pattern-library",
  "combo-meter",
  "maker-lab",
  "field-notes",
  "contact",
];

// One accent per section, and a matching stroke "texture" that steps through
// the brush-stroke -> trail -> yarn -> circuit -> code motif requested for
// the signature scroll interaction, without ever copying any game's assets.
const SECTION_STYLE: Record<string, { color: string; dasharray: string }> = {
  hero: { color: "#ff4d1c", dasharray: "1 0" }, // brush stroke
  "trail-map": { color: "#4caf6d", dasharray: "10 6" }, // trail dashes
  "mission-select": { color: "#e63946", dasharray: "6 3" }, // code-like dash
  "pattern-library": { color: "#e0a458", dasharray: "2 2" }, // yarn, tight
  "combo-meter": { color: "#3fa7ff", dasharray: "8 2 2 2" }, // circuit dash-dot
  "maker-lab": { color: "#35d9c6", dasharray: "8 2 2 2" }, // circuit dash-dot
  "field-notes": { color: "#d98e4a", dasharray: "2 2" }, // yarn, tight
  contact: { color: "#f5f1e8", dasharray: "6 3" },
};

const VIEW_WIDTH = 100;

// Checkpoint ping: a brief scale/brightness pulse right as scroll crosses a
// section's breakpoint — a small "confirmed" beat, like a combo counter tick,
// rather than a static dot the whole scroll.
function Waypoint({
  scrollYProgress,
  breakpoint,
  x,
  y,
  color,
}: {
  scrollYProgress: MotionValue<number>;
  breakpoint: number;
  x: number;
  y: number;
  color: string;
}) {
  const pulse = 0.015;
  const r = useTransform(
    scrollYProgress,
    [breakpoint - pulse, breakpoint, breakpoint + pulse],
    [0.8, 2.2, 0.8]
  );
  const opacity = useTransform(
    scrollYProgress,
    [breakpoint - pulse, breakpoint, breakpoint + pulse],
    [0.7, 1, 0.7]
  );
  return <motion.circle cx={x} cy={y} r={r} fill={color} style={{ opacity }} />;
}

function buildPath(pointsY: number[]): { d: string; points: { x: number; y: number }[] } {
  if (pointsY.length === 0) return { d: "", points: [] };
  const points = pointsY.map((y, i) => ({
    // Hero (i === 0) gets a marginal anchor instead of the usual 25/75
    // alternation — its centered headline sits roughly between those two
    // x positions, so the regular anchor drew the line straight through it.
    x: i === 0 ? VIEW_WIDTH * 0.08 : i % 2 === 0 ? VIEW_WIDTH * 0.25 : VIEW_WIDTH * 0.75,
    y,
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }
  return { d, points };
}

export default function ComboTrail() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const mounted = useMounted();
  const breakpoints = useSectionBreakpoints(SECTION_IDS);
  const { scrollYProgress } = useScroll();

  const [docHeight, setDocHeight] = useState(0);
  useEffect(() => {
    setDocHeight(document.documentElement.scrollHeight);
    const onResize = () => setDocHeight(document.documentElement.scrollHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoints]);

  // Canvas is a fixed-height coordinate space (independent of docHeight);
  // the <svg> below stretches it to the real page height via preserveAspectRatio.
  const canvasHeight = 1000;
  const { d: pathD, points } = buildPath(breakpoints.map((f) => f * canvasHeight));

  const sectionColors = SECTION_IDS.map((id) => SECTION_STYLE[id].color);
  const strokeColor = useTransform(scrollYProgress, breakpoints, sectionColors);

  const [dasharray, setDasharray] = useState(SECTION_STYLE[SECTION_IDS[0]].dasharray);
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      let currentIndex = 0;
      for (let i = 0; i < breakpoints.length; i++) {
        if (latest >= breakpoints[i]) currentIndex = i;
      }
      setDasharray(SECTION_STYLE[SECTION_IDS[currentIndex]].dasharray);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoints.join(",")]);

  if (points.length === 0) return null;

  return (
    <svg
      className="pointer-events-none fixed left-0 top-0 z-0 h-full w-full opacity-40 mix-blend-screen"
      viewBox={`0 0 ${VIEW_WIDTH} ${canvasHeight}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", height: docHeight || "100%" }}
    >
      {/* Always fully drawn — no Framer `pathLength` here, since its
          built-in path-draw animation manages stroke-dasharray internally
          and fights with the per-section dasharray texture below (they'd
          disagree between server and client, failing hydration for the
          whole page). Scroll progress is instead communicated by the
          waypoint pulses and the color shift, both of which are compatible. */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={0.4}
        strokeLinecap="round"
        strokeDasharray={dasharray}
      />
      {(!mounted || !prefersReducedMotion) &&
        points.map((point, i) => (
          <Waypoint
            key={SECTION_IDS[i]}
            scrollYProgress={scrollYProgress}
            breakpoint={breakpoints[i] ?? 0}
            x={point.x}
            y={point.y}
            color={SECTION_STYLE[SECTION_IDS[i]].color}
          />
        ))}
    </svg>
  );
}
