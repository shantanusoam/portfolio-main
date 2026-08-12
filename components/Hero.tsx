"use client";

import { AnimatePresence, motion } from "framer-motion";
import TextCarousel from "./ui/TextCarousel";
import { useEffect, useRef, useState } from "react";
import { MAGNETIC_ATTRIBUTE } from "./ui/magnetic/magneticField";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { cn } from "@/lib/utils";
import SignalRoeButton from "./mascot/SignalRoeButton";

const StringInstrument = dynamic(
  () => import("./IntrectiveComponents/StringInstrument"),
  { ssr: false },
);

interface HeroProps {
  masked: boolean;
}

// Inert until the section they point at exists: #trail-map lands in Phase 3
// (Experience.tsx gets renamed/re-id'd there), #maker-lab in Phase 4.
const START_MENU = [
  { label: "See the proof", href: "#proof" },
  { label: "View case studies", href: "#case-studies" },
  { label: "Read field notes", href: "#latest-notes" },
  { label: "Enter Systems Lab", href: "/systems" },
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
function RoleTicker({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % lines.length),
      2600,
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

export default function Hero({ masked }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  // Reason: a [0, 0.4] range started fading on the very first scrolled pixel,
  // so the hero sat at half-opacity while still filling most of the viewport.
  const opacity = useSectionExitFade(sectionRef, [0.2, 0.7]);
  const prefersReducedMotion = usePrefersReducedMotion();

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
        onMouseMove={resetIdleTimer}
        className="relative isolate flex min-h-[78svh] w-full items-center overflow-hidden px-[clamp(1.1rem,6vw,6rem)] pb-[clamp(2rem,5vh,4rem)] pt-[clamp(7rem,14vh,8.25rem)] md:min-h-[88svh] md:py-[clamp(5.5rem,9vh,7rem)]"
      >
        {/* Same ChatGPT linen tile as the page body — even weave, so repeat
            (not cover) keeps the thread scale honest. Soft bottom fade keeps
            the exit into the rest of the page seamless. */}
        {/* <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[length:320px_320px] bg-repeat"
          style={{ backgroundImage: "url('/textures/black-linen.webp')" }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />
          <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-[var(--black)] to-transparent" />
        </div> */}

        {/* Reason: one centered column keeps name + CTAs + instrument as a
            single composition — avoids the old 1fr/self-end stack that left
            a large empty band above the copy. */}
        <div className="relative z-[996] mx-auto flex w-full max-w-[1120px] flex-col items-center justify-center gap-[clamp(0.85rem,2.5vh,2rem)]">
          {/* Decorative perch rails — pointer-events none so they never steal
              CTA clicks; mascot lands on top edges via data-mascot-perch. */}
          <div
            aria-hidden="true"
            className="via-white/20 pointer-events-none absolute inset-x-[8%] top-[18%] h-px bg-gradient-to-r from-transparent to-transparent"
            data-mascot-perch="rail"
          />
          <div
            aria-hidden="true"
            className="via-primary/25 pointer-events-none absolute inset-x-[18%] top-[42%] h-px bg-gradient-to-r from-transparent to-transparent"
            data-mascot-perch="rail"
          />
          <div
            aria-hidden="true"
            className="via-white/10 pointer-events-none absolute inset-x-[12%] bottom-[22%] h-px bg-gradient-to-r from-transparent to-transparent"
            data-mascot-perch="rail"
          />

          <SignalRoeButton />

          <motion.div
            variants={{ show: { transition: { staggerChildren: stagger } } }}
            initial="hidden"
            animate="show"
            className="flex w-full flex-col items-center justify-center gap-[clamp(0.35rem,1vh,0.75rem)] text-center"
          >
            <motion.div
              variants={contentVariants}
              className="relative flex h-[clamp(3rem,7.5vh,5rem)] w-full items-center justify-center overflow-hidden"
              data-mascot-interest="hero"
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
                "font-display text-[clamp(2.15rem,6vw,5.25rem)] uppercase leading-[0.92] tracking-wide text-white",
                isIdle && "animate-breathe",
              )}
              data-mascot-interest="hero"
            >
              Shantanu Soam
            </motion.h1>

            <motion.div
              variants={contentVariants}
              className="relative flex h-[clamp(1.35rem,3.2vh,2rem)] w-full items-center justify-center overflow-hidden"
              data-mascot-interest="hero"
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
              className="mt-[clamp(0.1rem,0.5vh,0.4rem)] grid grid-cols-2 items-center justify-center gap-x-4 gap-y-2 font-mono text-[clamp(0.58rem,1vw,0.78rem)] uppercase tracking-widest sm:flex sm:flex-wrap sm:gap-x-[clamp(1rem,4vw,3rem)]"
            >
              {START_MENU.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  // The cursor wraps whatever carries this attribute, so the
                  // link itself is the target — no overlay element to size.
                  {...{ [MAGNETIC_ATTRIBUTE]: "" }}
                  data-mascot-obstacle="hard"
                  className="whitespace-nowrap text-graytransparent transition-colors duration-300 hover:text-primary"
                >
                  [ {item.label} ]
                </Link>
              ))}
            </motion.nav>
          </motion.div>

          {/* The instrument is part of the composition instead of being
              absolutely pinned, so short screens cannot crop or detach it. */}
          <div className="mx-auto w-full max-w-[1020px]">
            <StringInstrument />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
