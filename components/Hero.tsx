"use client";

import { AnimatePresence, motion } from "framer-motion";
import TextCarousel from "./ui/TextCarousel";
import { useEffect, useRef, useState } from "react";
import String from "./IntrectiveComponents/String";
import Link from "next/link";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import Magnetic from "@/components/ui/magnetic/Magnetic";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";
import { cn } from "@/lib/utils";

interface HeroProps {
  masked: boolean;
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
}

// Inert until the section they point at exists: #trail-map lands in Phase 3
// (Experience.tsx gets renamed/re-id'd there), #maker-lab in Phase 4.
const START_MENU = [
  { label: "Start Journey", href: "#trail-map" },
  { label: "View Case Studies", href: "#mission-select" },
  { label: "Enter Lab", href: "#maker-lab" },
];

const ROLE_LINES = [
  "Creative Systems Engineer",
  "Trail Hiker",
  "Maker",
  "Frontend Wizard",
];

// TextCarousel's crossfade deliberately overlaps two items briefly — fine
// for a single big rotating word, but with a short role line in a small box
// it read as two words ghosting on top of each other. AnimatePresence's
// `mode="wait"` guarantees only one is ever mounted at a time.
function RoleTicker({ lines, className }: { lines: string[]; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % lines.length),
      2600
    );
    return () => clearInterval(interval);
  }, [lines.length, prefersReducedMotion]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={lines[index]}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className={className}
      >
        {lines[index]}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Hero({ masked, stickyElement }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  // Reason: a [0, 0.4] range started fading on the very first scrolled pixel,
  // so the hero sat at half-opacity while still filling most of the viewport.
  const opacity = useSectionExitFade(sectionRef, [0.2, 0.7]);
  const prefersReducedMotion = usePrefersReducedMotion();
  // See EntranceWipe.tsx for why the mounted-gate matters below.
  const mounted = useMounted();

  // Cinematic cursor-glow, scoped to the hero only. Mutates CSS custom
  // properties directly via a ref instead of React state, so it costs zero
  // re-renders per mousemove. Static/centered under reduced motion.
  function handleHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    resetIdleTimer();
    if (prefersReducedMotion || !glowRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    glowRef.current.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    glowRef.current.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }

  // After ~4s of no input, the name breathes very slowly — the page seems
  // to be waiting for you rather than sitting dead. Stops the instant you
  // move again.
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  function resetIdleTimer() {
    if (prefersReducedMotion) return;
    setIsIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), 4000);
  }

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  const stagger = prefersReducedMotion ? 0 : 0.15;
  const contentVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" },
    },
  };

  return (
    <div>
      <motion.section
        id="hero"
        style={{ opacity }}
        ref={sectionRef}
        onMouseMove={handleHeroMouseMove}
        className="relative mx-[10%] flex h-[100vh] max-h-[1080px] flex-col items-center justify-center gap-6 overflow-hidden sm:mx-[15%]"
      >
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[995]"
          style={{
            background:
              "radial-gradient(400px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255,77,28,0.08), transparent 70%)",
          }}
        />
        {/* Film light-leak: one soft drift, not generic particles — a nod to
            the photography hobby, barely conscious at ~28s per loop. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-1/4 z-[994] rounded-full opacity-[0.06] blur-3xl",
            mounted && !prefersReducedMotion && "animate-light-leak"
          )}
          style={{
            background: "radial-gradient(circle, #ff7a47, transparent 60%)",
          }}
        />
        {/* Interactive "string" toy, pinned to the dead space below the
            content stack — when it sat at the section's vertical center the
            three lines sliced straight through the name and tagline. */}
        <div className="absolute inset-x-0 bottom-[8%] z-[993] hidden flex-col items-center justify-center md:flex">
          <div className="my-3 w-[60vw]">
            <String volume={0.1} playbackRate={2} />
          </div>
          <div className="my-3 w-[71vw]">
            <String volume={0.1} playbackRate={1} />
          </div>
          <div className="my-3 w-[60vw]">
            <String volume={0.1} playbackRate={2} />
          </div>
        </div>

        <motion.div
          variants={{ show: { transition: { staggerChildren: stagger } } }}
          initial="hidden"
          animate="show"
          className="z-[996] flex flex-col items-center justify-center gap-4 text-center"
        >
          <motion.div
            variants={contentVariants}
            className="relative flex h-24 w-full items-center justify-center overflow-hidden md:h-32"
          >
            <TextCarousel
              greetings={["Hello", "नमस्ते", "你好", "Hola", "Bonjour", "こんにちは"]}
            />
          </motion.div>

          <motion.h1
            variants={contentVariants}
            className={cn(
              "font-display text-4xl uppercase tracking-wide text-white sm:text-6xl md:text-7xl",
              isIdle && "animate-breathe"
            )}
          >
            Shantanu Soam
          </motion.h1>

          <motion.div
            variants={contentVariants}
            className="relative flex h-8 w-full items-center justify-center overflow-hidden md:h-10"
          >
            <RoleTicker
              lines={ROLE_LINES}
              className="text-sm font-normal normal-case tracking-[0.3em] text-primary sm:text-base md:text-xl"
            />
          </motion.div>

          <motion.p
            variants={contentVariants}
            className="max-w-xl text-sm text-graytransparent sm:text-base"
          >
            Building fast systems with a maker&apos;s curiosity and a game
            designer&apos;s eye.
          </motion.p>

          <motion.nav
            variants={contentVariants}
            className="mt-4 flex flex-col items-center gap-3 font-mono text-xs uppercase tracking-widest sm:flex-row sm:gap-8 sm:text-sm"
          >
            {START_MENU.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-graytransparent transition-colors duration-300 hover:text-primary"
              >
                <Magnetic>
                  <span className="relative">
                    [ {item.label} ]
                    {stickyElement && (
                      <div
                        ref={(el) => stickyElement.current.push(el)}
                        className="bounds"
                      ></div>
                    )}
                  </span>
                </Magnetic>
              </Link>
            ))}
          </motion.nav>
        </motion.div>
      </motion.section>
    </div>
  );
}
