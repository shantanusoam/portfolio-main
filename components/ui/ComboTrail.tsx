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

// Sweeps nearly edge-to-edge, alternating sides at each checkpoint — the
// full "one end to the other" motion. The earlier margin-only version
// avoided this by staying inside the safe 10% content border the whole
// time, but that read as too subtle. The crossing itself is handled by
// buildPath's "quick snap" easing below: instead of a slow 50/50 drift
// spread across an entire section's height, each transition is bunched
// into a short stretch right at the section boundary, so the sweep still
// reaches from edge to edge, it just does it quickly at the seam between
// sections rather than lingering across a section's own content.
const EDGE_FRACTION = 0.06;

// Checkpoint ping: a brief scale/brightness pulse right as scroll crosses a
// section's breakpoint — a small "confirmed" beat, like a combo counter tick,
// rather than a static dot the whole scroll.
function Waypoint({
  scrollYProgress,
  breakpoint,
  x,
  y,
  color,
  strokeWidth,
}: {
  scrollYProgress: MotionValue<number>;
  breakpoint: number;
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
}) {
  const pulse = 0.015;
  const r = useTransform(
    scrollYProgress,
    [breakpoint - pulse, breakpoint, breakpoint + pulse],
    [strokeWidth * 2, strokeWidth * 5.5, strokeWidth * 2]
  );
  const opacity = useTransform(
    scrollYProgress,
    [breakpoint - pulse, breakpoint, breakpoint + pulse],
    [0.7, 1, 0.7]
  );
  return <motion.circle cx={x} cy={y} r={r} fill={color} style={{ opacity }} />;
}

// Builds the path in real pixel coordinates (matching the SVG's actual
// rendered size 1:1, no preserveAspectRatio stretching) so stroke width and
// dash patterns render at a single, predictable, consistent thickness
// regardless of the page's aspect ratio — previously the path lived in an
// abstract 100x1000 space non-uniformly stretched to fit the real page,
// which distorted the stroke differently depending on viewport width.
//
// Each checkpoint alternates edges (one end to the other), but the bezier
// control points are deliberately unbalanced instead of a symmetric 50/50
// S-curve: the line holds its current side for most of a section's height,
// then snaps across in a short burst confined to the last ~14% of the
// distance, right at the seam going into the next section. That keeps the
// dramatic full-width sweep, while the actual crossing — the only part
// that risks passing over a heading — happens quickly at a section
// boundary instead of drifting through the middle of one section's content.
const SNAP_FRACTION = 0.14;

function buildPath(
  pointsFrac: number[],
  width: number,
  height: number
): { d: string; points: { x: number; y: number }[] } {
  if (pointsFrac.length === 0 || width === 0) return { d: "", points: [] };
  const edge = width * EDGE_FRACTION;
  const points = pointsFrac.map((frac, i) => ({
    x: i % 2 === 0 ? edge : width - edge,
    y: frac * height,
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const span = curr.y - prev.y;
    const holdY = prev.y + span * (1 - SNAP_FRACTION);
    const arriveY = curr.y - span * SNAP_FRACTION * 0.35;
    d += ` C ${prev.x} ${holdY}, ${curr.x} ${arriveY}, ${curr.x} ${curr.y}`;
  }
  return { d, points };
}

const MASK_ID = "combo-trail-reveal";

export default function ComboTrail() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const mounted = useMounted();
  const breakpoints = useSectionBreakpoints(SECTION_IDS);
  const { scrollYProgress } = useScroll();
  // Tracks scroll 1:1 — an earlier spring-smoothed version noticeably lagged
  // behind fast scrolling, which read as the line "falling behind" instead
  // of a journey that moves with you.
  const drawProgress = scrollYProgress;

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const measure = () =>
      setViewport({
        width: window.innerWidth,
        height: document.documentElement.scrollHeight,
      });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [breakpoints]);

  const { d: pathD, points } = buildPath(breakpoints, viewport.width, viewport.height);
  // A little over 0.1% of viewport width reads as a consistent, thin line at
  // any screen size instead of a fixed unit that only looked right at one
  // specific width.
  const strokeWidth = Math.max(1, viewport.width * 0.0012);

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
      className="pointer-events-none fixed left-0 top-0 z-0 opacity-40 mix-blend-screen"
      width={viewport.width}
      height={viewport.height}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      style={{ position: "absolute" }}
    >
      <defs>
        {/* The reveal lives on its own path with no manual stroke-dasharray,
            so Framer's `pathLength` (which manages dasharray internally to
            animate the draw) never fights with the visible path's per-section
            texture below — that exact conflict previously made the server
            and client disagree on the same attribute and failed hydration
            for the whole page. Masking is what lets both effects coexist:
            the reveal path grows a white stroke as you scroll, and the
            textured path is only visible wherever that white stroke reaches. */}
        <mask id={MASK_ID} maskUnits="userSpaceOnUse">
          <motion.path
            d={pathD}
            stroke="#fff"
            strokeWidth={strokeWidth * 3}
            strokeLinecap="round"
            fill="none"
            style={{ pathLength: prefersReducedMotion ? 1 : drawProgress }}
          />
        </mask>
      </defs>
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dasharray}
        mask={`url(#${MASK_ID})`}
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
            strokeWidth={strokeWidth}
          />
        ))}
    </svg>
  );
}
