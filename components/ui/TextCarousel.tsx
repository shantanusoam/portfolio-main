"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

interface TextCarouselProps {
  greetings: string[];
  className?: string;
  /**
   * How long each greeting stays on screen, in ms. Deliberately off-beat
   * from RoleTicker's 2600ms so the two lines never swap in the same frame.
   */
  interval?: number;
}

// One element mounted at a time via AnimatePresence `mode="wait"` — the old
// version stacked six infinitely-looping headlines whose stagger (1.8s) was
// shorter than each word's visible window (~2.4s) and whose loop period
// (11.2s) never matched the total stagger (10.8s), so words ghosted on top
// of each other and drifted further out of sync the longer the page sat.
export default function TextCarousel({
  greetings,
  className,
  interval = 3400,
}: TextCarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % greetings.length),
      interval
    );
    return () => clearInterval(id);
  }, [greetings.length, interval, prefersReducedMotion]);

  // Same DOM shape whether motion is reduced or not (see EntranceWipe.tsx for
  // why structural branches on this preference break hydration) — reduced
  // motion just zeroes the movement and durations.
  const y = prefersReducedMotion ? 0 : 28;
  const scale = prefersReducedMotion ? 1 : 0.96;

  return (
    <AnimatePresence mode="wait">
      {/* Decorative — the page's real h1 is the name right below this. */}
      <motion.span
        key={greetings[index]}
        aria-hidden="true"
        initial={{ opacity: 0, y, scale }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: prefersReducedMotion ? 0 : 0.5,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        exit={{
          opacity: 0,
          y: -y,
          scale,
          // Reason: exits read best slightly faster than entrances (~75%).
          transition: {
            duration: prefersReducedMotion ? 0 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        className={cn(
          "absolute select-none whitespace-nowrap text-center text-[4.5rem] font-black tracking-tight md:text-[6.5rem]",
          className
        )}
      >
        {greetings[index]}
      </motion.span>
    </AnimatePresence>
  );
}
