"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "./debounce";

/**
 * Given ordered section ids, returns each section's vertical position as a
 * fraction of total page scroll height (0-1). Recomputed on debounced resize
 * and once fonts finish loading, since a new display font can reflow section
 * heights after first paint.
 */
export function useSectionBreakpoints(sectionIds: string[]): number[] {
  const [breakpoints, setBreakpoints] = useState<number[]>(() =>
    sectionIds.map(() => 0)
  );

  function compute() {
    if (typeof document === "undefined") return;
    const scrollHeight = document.documentElement.scrollHeight || 1;
    setBreakpoints(
      sectionIds.map((id) => {
        const el = document.getElementById(id);
        return el ? el.offsetTop / scrollHeight : 0;
      })
    );
  }

  const debouncedCompute = useDebounce(compute, 200);

  useEffect(() => {
    compute();
    window.addEventListener("resize", debouncedCompute);
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => compute());
    }
    return () => window.removeEventListener("resize", debouncedCompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return breakpoints;
}

export default useSectionBreakpoints;
