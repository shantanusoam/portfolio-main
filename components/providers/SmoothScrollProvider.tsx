"use client";

import Lenis from "@studio-freight/lenis";
import { useEffect } from "react";

/**
 * Single, properly-torn-down Lenis instance for the whole app. Previously
 * both app/page.tsx and app/projects/[project_name]/page.tsx independently
 * instantiated their own Lenis + requestAnimationFrame loop with no cleanup,
 * so navigating between routes stacked two competing smooth-scroll engines
 * and neither loop was ever cancelled. Mounted once in app/layout.tsx.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    // Reason: kill any residual CSS smooth-scroll before Lenis takes over
    // (html.lenis styles only apply after Lenis mutates the classList).
    document.documentElement.style.scrollBehavior = "auto";

    // Reason: slightly snappier lerp; syncTouch off so mobile keeps native
    // scroll (smoother + less JS work on touch devices).
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      // Wheel multiplier closer to native feels less "floaty" / dual-smoothed.
      wheelMultiplier: 0.9,
    });
    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return <>{children}</>;
}
