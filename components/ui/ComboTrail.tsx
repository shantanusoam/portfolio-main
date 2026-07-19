"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useScroll, useVelocity } from "framer-motion";
import { useSectionBreakpoints } from "@/hooks/useSectionBreakpoints";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { useDebounce } from "@/hooks/debounce";

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

// Sweeps nearly edge-to-edge where there is vertical room to do it
// gracefully. EDGE_FRACTION is how far in from the sides the line turns
// around.
const EDGE_FRACTION = 0.06;

// The line's horizontal travel between two anchors is capped at
// span * MAX_AVG_SLOPE (span = vertical distance between them). Section
// heights on the real page vary ~6x, so an unconditional edge-to-edge
// sweep gave a 2:1 average slope through short sections — and the old
// "hold, then snap across in the last 14%" control points compressed that
// crossing into a near-horizontal slash that read as a right angle. With
// the cap, a short section produces a partial drift instead, and the line
// finishes the journey to the far edge over the following sections; the
// slope (and therefore the curve character) stays uniform top to bottom
// at any viewport width. 0.85 average keeps the steepest instantaneous
// slope of the symmetric cubic (~1.5x the average, at its midpoint)
// around 52 degrees from vertical — flowing, never flat.
const MAX_AVG_SLOPE = 0.85;

// Symmetric control-point offset: both handles sit at 45% of the span,
// vertically in line with their endpoints. Every anchor therefore has a
// vertical tangent on both sides — mathematically continuous joins, one
// even S-curve per transition, identical character everywhere (the old
// asymmetric hold/snap handles are what made the top of the page look
// organic and the bottom geometric).
const CONTROL_FRACTION = 0.45;

// Anchors closer together than this (or out of order, e.g. a renamed
// section id resolving to offsetTop 0) are dropped from the trail: a
// near-zero span can only ever render as a horizontal cut, and a
// backwards one breaks the monotonic-y assumption the reveal depends on.
const MIN_SPAN = 100;

// How far (in scroll progress) around a checkpoint the sonar ping animates.
const PULSE_WINDOW = 0.02;

// Enough samples per bezier for a visually exact tip position; the lookup is
// pure math against these arrays, so the scroll handler never calls
// getPointAtLength (a DOM API) on any frame.
const SAMPLES_PER_SEGMENT = 16;

type Point = { x: number; y: number };
type TrailNode = {
  id: string;
  breakpoint: number;
  x: number;
  y: number;
};
type Segment = {
  d: string;
  dasharray: string;
  gradientId: string;
  from: string;
  to: string;
  y1: number;
  y2: number;
};
type Geometry = {
  previewD: string;
  nodes: TrailNode[];
  segments: Segment[];
  xs: Float32Array;
  ys: Float32Array;
};

function cubicAt(a: number, c1: number, c2: number, b: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * b;
}

// Builds the path in real pixel coordinates (matching the SVG's rendered size
// 1:1, no preserveAspectRatio stretching) so stroke width and dash patterns
// render at a consistent thickness at any aspect ratio. The trail is split
// into one <path> per section so each section's texture AND color live in
// static attributes (a fixed dasharray plus a pre-baked gradient into the
// next section's color) — nothing about the strokes themselves ever needs
// touching while scrolling, unlike the old per-frame color interpolation
// and dasharray state swaps.
//
// Anchor x-positions come from a "pen walk" rather than strict left/right
// alternation: the pen heads for one edge, moves at most span * MAX_AVG_SLOPE
// per anchor, and only turns around once it has actually reached that edge.
// Where sections are tall the result is the same full edge-to-edge sweep as
// before; where they are short the pen drifts partway and completes the
// crossing over the next sections, so no transition is ever steeper than the
// cap no matter how the page's section heights or the viewport width change.
function buildGeometry(
  pointsFrac: number[],
  width: number,
  height: number
): Geometry | null {
  if (pointsFrac.length < 2 || width === 0 || height === 0) return null;
  const edgeL = width * EDGE_FRACTION;
  const edgeR = width - edgeL;

  const nodes: TrailNode[] = [];
  for (let i = 0; i < pointsFrac.length; i++) {
    const y = pointsFrac[i] * height;
    if (nodes.length > 0 && y < nodes[nodes.length - 1].y + MIN_SPAN) continue;
    nodes.push({ id: SECTION_IDS[i], breakpoint: pointsFrac[i], x: 0, y });
  }
  if (nodes.length < 2) return null;

  nodes[0].x = edgeL;
  const reachTolerance = width * 0.02;
  let direction = 1;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const span = nodes[i].y - prev.y;
    const target = direction > 0 ? edgeR : edgeL;
    const maxDx = span * MAX_AVG_SLOPE;
    const dx = Math.max(-maxDx, Math.min(maxDx, target - prev.x));
    nodes[i].x = prev.x + dx;
    if (Math.abs(target - nodes[i].x) <= reachTolerance) direction = -direction;
  }

  const segments: Segment[] = [];
  let previewD = `M ${nodes[0].x} ${nodes[0].y}`;
  const total = (nodes.length - 1) * SAMPLES_PER_SEGMENT + 1;
  const xs = new Float32Array(total);
  const ys = new Float32Array(total);
  xs[0] = nodes[0].x;
  ys[0] = nodes[0].y;
  let k = 1;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const span = curr.y - prev.y;
    const c1y = prev.y + span * CONTROL_FRACTION;
    const c2y = curr.y - span * CONTROL_FRACTION;
    const curve = ` C ${prev.x} ${c1y}, ${curr.x} ${c2y}, ${curr.x} ${curr.y}`;
    previewD += curve;
    segments.push({
      d: `M ${prev.x} ${prev.y}${curve}`,
      dasharray: SECTION_STYLE[prev.id].dasharray,
      gradientId: `combo-seg-${i - 1}`,
      from: SECTION_STYLE[prev.id].color,
      to: SECTION_STYLE[curr.id].color,
      y1: prev.y,
      y2: curr.y,
    });
    for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT;
      xs[k] = cubicAt(prev.x, prev.x, curr.x, curr.x, t);
      ys[k] = cubicAt(prev.y, c1y, c2y, curr.y, t);
      k++;
    }
  }
  return { previewD, nodes, segments, xs, ys };
}

// The path only ever descends, so the pen tip for a given reveal depth is a
// binary search over the pre-sampled points — microseconds, no DOM reads.
function tipAt(geo: Geometry, y: number): Point {
  const { xs, ys } = geo;
  const n = ys.length;
  if (y <= ys[0]) return { x: xs[0], y: ys[0] };
  if (y >= ys[n - 1]) return { x: xs[n - 1], y: ys[n - 1] };
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ys[mid] <= y) lo = mid;
    else hi = mid;
  }
  const t = (y - ys[lo]) / (ys[hi] - ys[lo] || 1);
  return { x: xs[lo] + (xs[hi] - xs[lo]) * t, y };
}

/**
 * The signature scroll interaction, rebuilt for low-end machines. The old
 * version re-rendered an animated stroke-shaped <mask> across a document-tall
 * SVG on every scroll frame — masks force a full offscreen re-composite, so a
 * long page melted weak GPUs. Now the work is split by how often it changes:
 *
 * 1. STATIC LAYER — absolute, part of the page: the faint dotted "planned
 *    route" ahead of you plus a base dot at each checkpoint. Painted once,
 *    then scrolls on the compositor like any other page content. Zero
 *    per-frame cost.
 *
 * 2. LIVE LAYER — position:fixed and only ever viewport-sized, so its raster
 *    (and worst-case repaint) is one screen no matter how long the page gets.
 *    Inside it, a group counter-translated by -scrollY holds the colored
 *    trail, revealed by a plain clip rectangle that grows with scroll — a
 *    rect clip is dramatically cheaper than a stroke-shaped mask, and it
 *    works because the path only ever moves downward. A comet head rides the
 *    clip edge (stretching slightly with scroll velocity) and a sonar ring
 *    pings each checkpoint as you cross it.
 *
 * Every per-frame update is a direct attribute write from one MotionValue
 * subscription — no React state, no re-renders, no mask, no blend mode on
 * the scroll path. Framer's useScroll stays the single source of truth so
 * the trail tracks Lenis' smoothed scroll 1:1 (an earlier spring-smoothed
 * version noticeably lagged behind fast scrolling, which read as the line
 * "falling behind" instead of a journey that moves with you).
 */
export default function ComboTrail() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const breakpoints = useSectionBreakpoints(SECTION_IDS);
  const { scrollY, scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollYProgress);

  const [page, setPage] = useState({ width: 0, height: 0, vh: 0 });
  const measure = () =>
    setPage((prev) => {
      const width = window.innerWidth;
      const height = document.documentElement.scrollHeight;
      const vh = window.innerHeight;
      return prev.width === width && prev.height === height && prev.vh === vh
        ? prev
        : { width, height, vh };
    });
  const debouncedMeasure = useDebounce(measure, 150);
  useEffect(() => {
    measure();
    window.addEventListener("resize", debouncedMeasure);
    // Late-loading images/embeds change scrollHeight after first paint.
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(debouncedMeasure)
        : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener("resize", debouncedMeasure);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoints]);

  const geometry = useMemo(
    () => buildGeometry(breakpoints, page.width, page.height),
    [breakpoints, page]
  );
  // A little over 0.1% of viewport width reads as a consistent, thin line at
  // any screen size instead of a fixed unit that only looked right at one
  // specific width.
  const strokeWidth = Math.max(1, page.width * 0.0012);

  const worldRef = useRef<SVGGElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const haloRef = useRef<SVGGElement>(null);
  const pulseRef = useRef<SVGCircleElement>(null);
  const liveState = useRef({ sectionIdx: -1, pulseOn: false });

  useEffect(() => {
    const world = worldRef.current;
    const clip = clipRef.current;
    const head = headRef.current;
    const halo = haloRef.current;
    const pulse = pulseRef.current;
    if (!geometry || prefersReducedMotion) return;
    if (!world || !clip || !head || !halo || !pulse) return;

    const update = () => {
      const sy = scrollY.get();
      const p = Math.min(1, Math.max(0, scrollYProgress.get()));
      world.setAttribute("transform", `translate(0 ${-sy})`);

      const revealY = p * geometry.ys[geometry.ys.length - 1];
      clip.setAttribute("height", `${Math.max(0, revealY)}`);

      // Comet head rides the clip edge; a fast flick stretches it a touch so
      // speed is legible, settling back once Lenis' velocity decays to zero.
      const tip = tipAt(geometry, revealY);
      const v = Math.min(Math.abs(scrollVelocity.get()) * 1.5, 1);
      head.setAttribute("cx", `${tip.x}`);
      head.setAttribute("cy", `${tip.y}`);
      head.setAttribute("r", `${strokeWidth * (2.2 + v * 2.5)}`);
      halo.setAttribute("transform", `translate(${tip.x} ${tip.y})`);

      const nodes = geometry.nodes;
      let idx = 0;
      for (let i = 0; i < nodes.length; i++) {
        if (p >= nodes[i].breakpoint) idx = i;
      }
      if (idx !== liveState.current.sectionIdx) {
        liveState.current.sectionIdx = idx;
        head.setAttribute("fill", SECTION_STYLE[nodes[idx].id].color);
      }

      // Sonar ping: an expanding, fading ring exactly as scroll crosses a
      // checkpoint — a "confirmed" beat, like a combo counter tick. One
      // shared ring element is enough: checkpoints sit far apart, so at most
      // one is ever inside the pulse window.
      let active = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (Math.abs(p - nodes[i].breakpoint) < PULSE_WINDOW) {
          active = i;
          break;
        }
      }
      if (active >= 0) {
        const at = nodes[active];
        const beat = 1 - Math.abs(p - at.breakpoint) / PULSE_WINDOW;
        pulse.setAttribute("cx", `${at.x}`);
        pulse.setAttribute("cy", `${at.y}`);
        pulse.setAttribute("r", `${strokeWidth * (2 + beat * 7)}`);
        pulse.setAttribute("stroke", SECTION_STYLE[at.id].color);
        pulse.setAttribute("opacity", `${0.9 * beat}`);
        liveState.current.pulseOn = true;
      } else if (liveState.current.pulseOn) {
        pulse.setAttribute("opacity", "0");
        liveState.current.pulseOn = false;
      }
    };

    update();
    // Velocity emits one final event as it decays to 0 after scrolling stops,
    // which is what relaxes the comet head back to its resting size.
    const unsubScroll = scrollY.on("change", update);
    const unsubVelocity = scrollVelocity.on("change", update);
    return () => {
      unsubScroll();
      unsubVelocity();
    };
  }, [
    geometry,
    prefersReducedMotion,
    strokeWidth,
    scrollY,
    scrollYProgress,
    scrollVelocity,
  ]);

  // Nothing renders on the server or before measurement, so hydration never
  // sees a client/server mismatch (the exact bug class that previously took
  // down the whole page).
  if (!geometry || !breakpoints.some((b) => b > 0)) return null;

  const gradientDefs = geometry.segments.map((seg) => (
    <linearGradient
      key={seg.gradientId}
      id={seg.gradientId}
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1={seg.y1}
      x2="0"
      y2={seg.y2}
    >
      <stop offset="0" stopColor={seg.from} />
      <stop offset="1" stopColor={seg.to} />
    </linearGradient>
  ));

  const trailPaths = geometry.segments.map((seg) => (
    <path
      key={seg.gradientId}
      d={seg.d}
      fill="none"
      stroke={`url(#${seg.gradientId})`}
      strokeWidth={strokeWidth}
      strokeDasharray={seg.dasharray}
      strokeLinecap="round"
    />
  ));

  return (
    <>
      {/* Static layer: painted once, scrolls with the page for free. */}
      <svg
        className="pointer-events-none absolute left-0 top-0 z-0"
        width={page.width}
        height={page.height}
        viewBox={`0 0 ${page.width} ${page.height}`}
        aria-hidden="true"
      >
        {prefersReducedMotion ? (
          // Reduced motion: the full journey, already drawn, holding still.
          <g opacity={0.45}>
            <defs>{gradientDefs}</defs>
            {trailPaths}
          </g>
        ) : (
          // The route ahead — a faint dotted plan the ink draws over.
          <path
            d={geometry.previewD}
            fill="none"
            stroke="#f5f1e8"
            strokeOpacity={0.09}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeWidth} ${strokeWidth * 5}`}
            strokeLinecap="round"
          />
        )}
        {geometry.nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={strokeWidth * 2}
            fill={SECTION_STYLE[node.id].color}
            opacity={0.35}
          />
        ))}
      </svg>

      {/* Live layer: fixed and viewport-sized, so per-frame repaints can
          never exceed one screen regardless of page length. */}
      {!prefersReducedMotion && (
        <svg
          className="pointer-events-none fixed left-0 top-0 z-0"
          width={page.width}
          height={page.vh}
          viewBox={`0 0 ${page.width} ${page.vh}`}
          aria-hidden="true"
        >
          <defs>
            {gradientDefs}
            <radialGradient id="combo-trail-halo">
              <stop offset="0" stopColor="#f5f1e8" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#f5f1e8" stopOpacity="0.14" />
              <stop offset="1" stopColor="#f5f1e8" stopOpacity="0" />
            </radialGradient>
            <clipPath id="combo-trail-clip" clipPathUnits="userSpaceOnUse">
              <rect ref={clipRef} x="0" y="0" width={page.width} height="0" />
            </clipPath>
          </defs>
          {/* Counter-translated by -scrollY so page-space geometry lands in
              the right viewport position; the clip rect shares that space
              and simply grows taller as the journey progresses. */}
          <g ref={worldRef}>
            <g clipPath="url(#combo-trail-clip)" opacity={0.55}>
              {trailPaths}
            </g>
            <circle
              ref={pulseRef}
              r="0"
              fill="none"
              strokeWidth={strokeWidth}
              opacity="0"
            />
            {/* Soft glow is a pre-baked radial gradient, not an SVG filter —
                filters would re-run per frame; a gradient circle is one cheap
                textured fill. */}
            <g ref={haloRef}>
              <circle r={strokeWidth * 9} fill="url(#combo-trail-halo)" />
            </g>
            <circle
              ref={headRef}
              r={strokeWidth * 2.2}
              fill={SECTION_STYLE.hero.color}
            />
          </g>
        </svg>
      )}
    </>
  );
}
