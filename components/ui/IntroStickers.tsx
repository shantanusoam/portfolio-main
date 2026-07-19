"use client";

import { useState } from "react";
import { MotionValue, motion, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

/**
 * Scrapbook sticker layer for About — larger pieces nested into the dead
 * space around the manifesto, not tiny corner crumbs.
 *
 * Performance: transform + opacity only via useTransform; no filters/blends;
 * fixed pixel sizes; pointer-events-none.
 */

type StickerDef = {
  src: string;
  label: string;
  size: number;
  className: string;
  tilt: number;
  appearAt: number;
  drift: number;
  desktopOnly?: boolean;
};

const STICKERS: StickerDef[] = [
  {
    src: "/stickers/aboutus/flower.png",
    label: "flower",
    size: 128,
    className: "-left-2 -top-6 sm:-left-16 sm:-top-4 lg:-left-20",
    tilt: -14,
    appearAt: 0.12,
    drift: 18,
  },
  {
    src: "/stickers/aboutus/paintbrush.png",
    label: "paintbrush",
    size: 148,
    className: "-right-4 top-10 sm:-right-16 sm:top-6 lg:-right-24",
    tilt: 22,
    appearAt: 0.16,
    drift: 28,
  },
  {
    src: "/stickers/aboutus/paint-splat.png",
    label: "paint splat",
    size: 110,
    className: "-left-10 top-[42%] sm:-left-20 lg:-left-28",
    tilt: 10,
    appearAt: 0.22,
    drift: 36,
    desktopOnly: true,
  },
  {
    src: "/stickers/aboutus/pixel-heart.png",
    label: "pixel heart",
    size: 72,
    className: "right-0 top-[48%] sm:-right-10 lg:-right-14",
    tilt: -10,
    appearAt: 0.28,
    drift: 22,
  },
  {
    src: "/stickers/aboutus/terminal-flower.png",
    label: "terminal flower",
    size: 120,
    className: "-bottom-2 -left-4 sm:-left-14 lg:-left-18",
    tilt: 8,
    appearAt: 0.34,
    drift: 14,
    desktopOnly: true,
  },
  {
    src: "/stickers/aboutus/handmade-badge.png",
    label: "handmade badge",
    size: 132,
    className: "-bottom-6 -right-2 sm:-right-12 sm:-bottom-4 lg:-right-20",
    tilt: -16,
    appearAt: 0.4,
    drift: 12,
    desktopOnly: true,
  },
];

function Sticker({
  def,
  scrollYProgress,
  staticMode,
}: {
  def: StickerDef;
  scrollYProgress: MotionValue<number>;
  staticMode: boolean;
}) {
  const [missing, setMissing] = useState(false);

  const from = def.appearAt;
  const opacity = useTransform(scrollYProgress, [from, from + 0.05], [0, 1]);
  const scale = useTransform(scrollYProgress, [from, from + 0.08], [0.55, 1]);
  const rotate = useTransform(
    scrollYProgress,
    [from, from + 0.05, from + 0.09],
    [def.tilt + 18, def.tilt - 3, def.tilt]
  );
  const y = useTransform(scrollYProgress, [0, 1], [def.drift, -def.drift]);

  if (missing && process.env.NODE_ENV !== "development") return null;

  return (
    <motion.div
      style={
        staticMode
          ? { rotate: def.tilt }
          : { opacity, scale, rotate, y, willChange: "transform" }
      }
      className={cn(
        "absolute select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]",
        def.className,
        def.desktopOnly && "hidden md:block"
      )}
    >
      {missing ? (
        <div
          style={{ width: def.size, height: def.size }}
          className="flex items-center justify-center rounded-md border border-dashed border-primary/40 p-1 text-center font-mono text-[9px] uppercase tracking-wider text-primary/60"
        >
          {def.label}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={def.src}
          alt=""
          width={def.size}
          height={def.size}
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setMissing(true)}
          className="h-auto w-full max-w-none"
          style={{ width: def.size, height: "auto" }}
        />
      )}
    </motion.div>
  );
}

export default function IntroStickers({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
      {STICKERS.map((def) => (
        <Sticker
          key={def.src}
          def={def}
          scrollYProgress={scrollYProgress}
          staticMode={prefersReducedMotion}
        />
      ))}
    </div>
  );
}
