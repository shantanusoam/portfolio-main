"use client";
import { useEffect, useRef } from "react";
import { subscribe, wake } from "./motion";
import styles from "./Cinema.module.css";
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pointer = matchMedia("(pointer:fine)");
    const reduced = matchMedia("(prefers-reduced-motion:reduce)");
    let x = 0,
      y = 0,
      tx = 0,
      ty = 0,
      vx = 0,
      vy = 0,
      visible = false;
    let target: HTMLElement | null = null;
    const reset = () => {
      visible = false;
      el.style.opacity = "0";
      target?.style.removeProperty("translate");
      target = null;
    };
    const move = (event: PointerEvent) => {
      if (
        !pointer.matches ||
        reduced.matches ||
        document
          .querySelector(".workshop-home")
          ?.getAttribute("data-motion") === "quiet"
      ) {
        reset();
        return;
      }
      tx = event.clientX;
      ty = event.clientY;
      if (!visible) {
        x = tx;
        y = ty;
        visible = true;
        el.style.opacity = "1";
      }
      const next = (event.target as Element).closest<HTMLElement>(
        "a,button,summary,canvas",
      );
      if (next !== target) {
        target?.style.removeProperty("translate");
        target = next;
        el.textContent =
          next?.tagName === "CANVAS"
            ? "PLAY"
            : next?.closest("[data-project]")
              ? "VIEW"
              : next
                ? "OPEN"
                : "";
      }
      // Attraction belongs only to the hero action; text links stay steady to read.
      if (target?.hasAttribute("data-magnetic")) {
        const r = target.getBoundingClientRect();
        target.style.translate = `${(tx - r.left - r.width / 2) * 0.08}px ${
          (ty - r.top - r.height / 2) * 0.08
        }px`;
      }
      wake(650);
    };
    const off = subscribe((f) => {
      if (!f.enabled) {
        reset();
        return;
      }
      if (!visible) return;
      vx = (vx + (tx - x) * 0.16) * 0.7;
      vy = (vy + (ty - y) * 0.16) * 0.7;
      x += vx;
      y += vy;
      el.style.transform = `translate3d(${x + 13}px,${y + 13}px,0)`;
    });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    return () => {
      off();
      reset();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);
  return <div ref={ref} className={styles.cursor} aria-hidden="true" />;
}
