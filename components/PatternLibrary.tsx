"use client";

import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Heading from "./ui/Heading";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import {
  patternLibraryQuote,
  stitchGridStages,
  stitchStages,
} from "@/constants/patternLibrary";
import { cn } from "@/lib/utils";

function StitchCell({
  scrollYProgress,
  stage,
}: {
  scrollYProgress: MotionValue<number>;
  stage: number;
}) {
  const activateAt = (stage - 1) / stitchStages.length;
  const opacity = useTransform(
    scrollYProgress,
    [activateAt, activateAt + 0.15],
    [0.08, 1]
  );
  return (
    <motion.div
      style={{ opacity }}
      whileHover={{ scale: 1.2, filter: "brightness(1.7)" }}
      transition={{ duration: 0.15 }}
      className="aspect-square rounded-[2px] bg-primary"
    />
  );
}

function StageLabel({
  scrollYProgress,
  index,
  label,
}: {
  scrollYProgress: MotionValue<number>;
  index: number;
  label: string;
}) {
  const activateAt = index / stitchStages.length;
  const opacity = useTransform(
    scrollYProgress,
    [activateAt - 0.05, activateAt],
    [0.3, 1]
  );
  return (
    <motion.p
      style={{ opacity }}
      className="font-display text-sm uppercase tracking-widest text-white sm:text-base"
    >
      {label}
    </motion.p>
  );
}

export default function PatternLibrary() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionOpacity = useSectionExitFade(sectionRef);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  } as any);

  // A single "snap" the first time the grid reaches the final stage — the
  // build-up (stitch...component...pattern...) creates a small tension that
  // wants a definite close, not just another fade.
  const [justCompleted, setJustCompleted] = useState(false);
  const hasFired = useRef(false);
  const finalStageAt = (stitchStages.length - 1) / stitchStages.length;
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (!hasFired.current && latest >= finalStageAt) {
        hasFired.current = true;
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 500);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.section
      style={{ opacity: sectionOpacity }}
      id="pattern-library"
      ref={sectionRef}
      className="relative mx-[10%] my-[3rem] select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading>PATTERN LIBRARY</Heading>
      <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-graytransparent sm:text-sm">
        Components are stitches. Patterns become systems. Systems become
        products.
      </p>

      <div className="mt-16 flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-between">
        <motion.div
          animate={justCompleted ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="relative grid w-[240px] grid-cols-6 gap-1.5 sm:w-[320px]"
        >
          {stitchGridStages.map((stage, i) => (
            <StitchCell key={i} scrollYProgress={scrollYProgress} stage={stage} />
          ))}
          {justCompleted && (
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-0 bg-primary/40"
            />
          )}
        </motion.div>

        <div className="flex flex-col gap-6">
          <div className={cn("flex flex-col gap-3")}>
            {stitchStages.map((label, i) => (
              <StageLabel
                key={label}
                index={i}
                label={label}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
          <p className="max-w-md text-sm text-graytransparent">
            {patternLibraryQuote}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
