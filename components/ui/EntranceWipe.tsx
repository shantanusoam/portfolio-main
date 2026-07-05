"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";

/**
 * The site's first frame is a gesture, not a flash of content: a single
 * brush-stroke wipe clears off-screen (echoing the -rotate-6 slanting_lines
 * motif already used elsewhere) instead of the page just appearing.
 *
 * `show` always starts `true` on both server and client so the very first
 * client paint matches the server-rendered HTML exactly — the reduced-motion
 * check only runs after mount (inside an effect), which is a normal
 * post-hydration state update rather than a structural mismatch. Skipping
 * this and gating the initial render on usePrefersReducedMotion directly
 * (its SSR default is `true`, but it resolves synchronously to the real
 * preference on the client) causes React to see a different DOM on the
 * client's first paint than what the server sent, fail hydration, and
 * discard the whole root to re-render client-side from scratch.
 */
export default function EntranceWipe() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const mounted = useMounted();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!mounted) return;
    if (prefersReducedMotion) {
      setShow(false);
      return;
    }
    const timeout = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(timeout);
  }, [mounted, prefersReducedMotion]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ y: "0%" }}
      animate={{ y: "-120%" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
      className="fixed inset-0 z-[9998] origin-top-left -rotate-2 scale-110 bg-black pointer-events-none"
    >
      <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-primary/60 to-transparent" />
    </motion.div>
  );
}
