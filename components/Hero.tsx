"use client";

import { AnimatePresence, motion } from "framer-motion";
import TextCarousel from "./ui/TextCarousel";
import {
  type MouseEvent,
  type MutableRefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import StringInstrument from "./IntrectiveComponents/StringInstrument";
import Link from "next/link";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import Magnetic from "@/components/ui/magnetic/Magnetic";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";
import { cn } from "@/lib/utils";

interface HeroProps {
  masked: boolean;
  stickyElement?: MutableRefObject<(HTMLElement | null)[]>;
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
  function handleHeroMouseMove(e: MouseEvent<HTMLElement>) {
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
        className="relative isolate flex max-h-[1080px] min-h-[100svh] w-full overflow-hidden px-[clamp(1.25rem,6vw,6rem)] pb-[clamp(1.5rem,5vh,4rem)] pt-[clamp(4.5rem,9vh,7rem)]"
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
        <div className="relative z-[996] mx-auto grid w-full max-w-[1200px] flex-1 grid-rows-[minmax(0,1fr)_auto] items-center">
          <motion.div
            variants={{ show: { transition: { staggerChildren: stagger } } }}
            initial="hidden"
            animate="show"
            className="flex w-full translate-y-[clamp(-1rem,-1.5vh,0rem)] flex-col items-center justify-center gap-[clamp(0.55rem,1.8vh,1rem)] self-end text-center"
          >
            <motion.div
              variants={contentVariants}
              className="relative flex h-[clamp(4.5rem,14vh,8rem)] w-full items-center justify-center overflow-hidden"
            >
              <TextCarousel
                greetings={[
                  "Hello",
                  "नमस्ते",
                  "你好",
                  "Hola",
                  "Bonjour",
                  "こんにちは",
                ]}
              />
            </motion.div>

            <motion.h1
              variants={contentVariants}
              className={cn(
                "font-display text-[clamp(2.5rem,6.2vw,5.5rem)] uppercase leading-[0.92] tracking-wide text-white",
                isIdle && "animate-breathe"
              )}
            >
              Shantanu Soam
            </motion.h1>

            <motion.div
              variants={contentVariants}
              className="relative flex h-[clamp(1.5rem,4vh,2.5rem)] w-full items-center justify-center overflow-hidden"
            >
              <RoleTicker
                lines={ROLE_LINES}
                className="text-[clamp(0.7rem,1.4vw,1.15rem)] font-normal normal-case tracking-[0.28em] text-primary"
              />
            </motion.div>

            <motion.p
              variants={contentVariants}
              className="max-w-2xl text-[clamp(0.75rem,1.2vw,0.95rem)] leading-relaxed text-graytransparent"
            >
              Building fast systems with a maker&apos;s curiosity and a game
              designer&apos;s eye.
            </motion.p>

            <motion.nav
              variants={contentVariants}
              className="mt-[clamp(0.25rem,1vh,0.75rem)] flex flex-wrap items-center justify-center gap-x-[clamp(1rem,4vw,3rem)] gap-y-2 font-mono text-[clamp(0.62rem,1vw,0.8rem)] uppercase tracking-widest"
            >
              {START_MENU.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="whitespace-nowrap text-graytransparent transition-colors duration-300 hover:text-primary"
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

          {/* The instrument is part of the composition instead of being
              absolutely pinned, so short screens cannot crop or detach it. */}
          <div className="mx-auto mt-[clamp(1rem,3vh,2.5rem)] w-full max-w-[1100px]">
            <StringInstrument />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
