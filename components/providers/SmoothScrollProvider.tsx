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
    const lenis = new Lenis();
    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
