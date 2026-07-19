"use client";

import { motion, useScroll } from "framer-motion";
import { useRef } from "react";
import Heading from "./ui/Heading";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import IntroStickers from "./ui/IntroStickers";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

// Scrapbook manifesto — short lines so stickers can nest into the composition
// without fighting a long essay. Revealed line-by-line (not mid-word masks).
const LINES = [
  "Paintbrushes taught me taste.",
  "Computers taught me systems.",
  "I build interfaces where",
  "both hands agree.",
];

const lineVariants = {
  hide: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: 0.08 * i,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  } as any);

  const sectionOpacity = useSectionExitFade(sectionRef);

  return (
    <motion.section
      style={{ opacity: sectionOpacity }}
      id="about"
      ref={sectionRef}
      className="relative mx-[6%] my-[1rem] flex min-h-[70vh] select-none flex-col justify-center py-[3rem] sm:mx-[10%] sm:min-h-[60vh] sm:py-[4rem] lg:mx-[12%]"
    >
      <IntroStickers scrollYProgress={scrollYProgress} />

      {/* Text sits above stickers for reading; stickers peek around / through gutters */}
      <div className="relative z-[1] max-w-3xl">
        <Heading>ABOUT ME</Heading>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mt-3 max-w-md font-mono text-[10px] uppercase tracking-[0.25em] text-primary sm:text-xs"
        >
          Art studio ↔ terminal — same hands
        </motion.p>

        <ul className="mt-10 flex flex-col gap-3 sm:mt-12 sm:gap-4">
          {LINES.map((line, i) => (
            <motion.li
              key={line}
              custom={prefersReducedMotion ? 0 : i}
              variants={lineVariants}
              initial="hide"
              whileInView="show"
              viewport={{ once: true, amount: 0.8 }}
              className="font-semibold leading-[1.15] text-white"
              style={{
                fontSize: "clamp(1.35rem, 3.4vw, 3.25rem)",
              }}
            >
              {/* Accent the opening beat of each line — scrapbook underline feel */}
              <span className="relative">
                {line}
                {i === LINES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-[3px] w-[42%] origin-left bg-primary/80"
                    style={{ transform: "rotate(-1.5deg)" }}
                  />
                )}
              </span>
            </motion.li>
          ))}
        </ul>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-10 max-w-md text-sm leading-relaxed text-graytransparent sm:mt-12 sm:text-base"
        >
          Pixel-perfect UIs by day. Paint-stained curiosity by night. Same
          hands — just different tools.
        </motion.p>
      </div>
    </motion.section>
  );
}
