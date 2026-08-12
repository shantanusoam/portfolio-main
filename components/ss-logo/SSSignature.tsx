"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SS_BLOCKS, SS_VIEWBOX } from "./SSLogo";

type SSSignatureProps = ComponentProps<typeof motion.svg> & {
  title?: string;
};

/**
 * Lightweight small-format signature: twenty static SVG rows and one animated
 * parent transform. This keeps hover motion crisp without running per-pixel
 * animation work in navigation bars, cards, or footers.
 */
export function SSSignature({
  title = "Shantanu Soam SS signature",
  ...props
}: SSSignatureProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.svg
      viewBox={SS_VIEWBOX}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
      initial={false}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              x: [0, -2, 1, 0],
              y: [0, -1.5, 0.5, 0],
              scale: [1, 1.055, 0.985, 1],
              transition: { duration: 0.38, ease: "easeOut" },
            }
      }
      {...props}
    >
      <title>{title}</title>
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
    </motion.svg>
  );
}
