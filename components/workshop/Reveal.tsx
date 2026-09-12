"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * The workshop's one reveal grammar (ART_DIRECTION.md §7): an element
 * settles once — rise 18px, fade — when it enters the viewport, then stays.
 * Primary content may lead; pass a small `delay` (0–200ms) so microcopy
 * settles after the element it belongs to. Reduced motion shows everything
 * immediately via the `.ws-reveal` media query in globals.css.
 */
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  immediate = false,
  className,
  style,
  children,
}: {
  as?: ElementType;
  delay?: number;
  /** Above-fold content ships visible in the prerendered HTML — the LCP
   * element must never wait for hydration to paint (brief §12). */
  immediate?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.visible = "true";
      return;
    }
    const reveal = () => {
      el.dataset.visible = "true";
      observer?.disconnect();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    // Safety net: an element that is already on screen must never stay
    // hidden waiting for the observer to deliver (bfcache restores, slow
    // hydration, print/headless environments). One measurement at mount —
    // not a per-frame read.
    const fallback = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) reveal();
    }, 400);
    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
    // `immediate` is a static prop (a compile-time decision about whether
    // this content ships visible); re-listing it keeps the hook honest
    // without ever re-running in practice.
  }, [immediate]);

  return (
    <Tag
      ref={ref}
      className={cn("ws-reveal", className)}
      data-visible={immediate ? "true" : undefined}
      style={{ ...style, "--ws-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
