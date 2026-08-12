"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface SSBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Ten stepped rows per "S" (a pixel-font glyph with graduated steps rather
// than blunt half-bars), repeated for the second glyph. Each row is a tuple
// of [x, y, width, height]; row height is a constant 12.
const GLYPH_ROWS: Array<[number, number, number, number]> = [
  [18, 0, 72, 12],
  [6, 12, 96, 12],
  [6, 24, 24, 12],
  [6, 36, 36, 12],
  [18, 48, 72, 12],
  [30, 60, 72, 12],
  [78, 72, 24, 12],
  [66, 84, 36, 12],
  [6, 96, 96, 12],
  [18, 108, 72, 12],
];

const GLYPH_OFFSET_X = 113;

function buildGlyph(prefix: string, offsetX: number): SSBlock[] {
  return GLYPH_ROWS.map(([x, y, width, height], index) => ({
    id: `${prefix}-r${index}`,
    x: offsetX + x,
    y,
    width,
    height,
  }));
}

export const SS_BLOCKS: SSBlock[] = [
  ...buildGlyph("s1", 0),
  ...buildGlyph("s2", GLYPH_OFFSET_X),
];

export const SS_VIEWBOX = "0 0 221 120";

const blockVariants: Variants = {
  hidden: (index: number) => ({
    opacity: 0,
    scale: 0.4,
    x: index % 2 === 0 ? -6 : 6,
  }),
  show: (index: number) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { delay: index * 0.02, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
  pulse: (index: number) => ({
    scale: [1, 0.82, 1],
    transition: { delay: index * 0.014, duration: 0.3, ease: "easeInOut" },
  }),
};

interface SSLogoProps {
  className?: string;
  title?: string;
  /** Entrance + hover microinteraction. Disable when a parent already owns hover/entrance motion. */
  animated?: boolean;
  /** Set when an ancestor (a labelled link/button) already provides the accessible name. */
  decorative?: boolean;
}

export function SSLogo({
  className,
  title = "Shantanu Soam",
  animated = true,
  decorative = false,
}: SSLogoProps) {
  const reduceMotion = useReducedMotion();
  const active = animated && !reduceMotion;
  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": title };

  if (!active) {
    return (
      <svg viewBox={SS_VIEWBOX} className={className} fill="none" {...a11yProps}>
        {decorative ? null : <title>{title}</title>}
        {SS_BLOCKS.map((block) => (
          <rect
            key={block.id}
            x={block.x}
            y={block.y}
            width={block.width}
            height={block.height}
            fill="currentColor"
          />
        ))}
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox={SS_VIEWBOX}
      className={className}
      fill="none"
      {...a11yProps}
      initial="hidden"
      animate="show"
      whileHover="pulse"
    >
      {decorative ? null : <title>{title}</title>}
      {SS_BLOCKS.map((block, index) => (
        <motion.rect
          key={block.id}
          custom={index}
          variants={blockVariants}
          x={block.x}
          y={block.y}
          width={block.width}
          height={block.height}
          fill="currentColor"
          style={{
            transformOrigin: `${block.x + block.width / 2}px ${block.y + block.height / 2}px`,
          }}
        />
      ))}
    </motion.svg>
  );
}
