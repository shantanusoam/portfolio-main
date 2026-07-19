"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Heading from "./ui/Heading";
import { SlidingText } from "./ui/SlidingText";
import { combos } from "@/constants/combos";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import { cn } from "@/lib/utils";
import { ComboSkill } from "@/@types/combo.type";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

interface ComboSkillChipProps {
  skill: ComboSkill;
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
}

// Ports the exact hover-reveal row mechanic from the retired Skills.tsx
// (radial circle reveal, gradient sweep bar, top/bottom linegradient
// dividers, SlidingText label) — same interaction, new per-skill content.
// Unlit skills get a small "not proven yet" wobble+tooltip on hover instead
// of doing nothing — an honest answer to "why is this one dim?" beats silence.
function ComboSkillChip({ skill, stickyElement }: ComboSkillChipProps) {
  const isLit = skill.proofProjectIds.length > 0;
  const proofId = skill.proofProjectIds[0];
  const prefersReducedMotion = usePrefersReducedMotion();

  const chip = (
    <motion.div
      whileHover={isLit ? undefined : { rotate: [0, -3, 3, -2, 0] }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group/chip relative flex flex-col gap-1 overflow-hidden px-1 py-0.5 active:scale-95 transition-transform duration-150",
        isLit ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div className="relative h-[1.1rem] overflow-hidden">
        {/* The bottom-half copy stays in normal flow — it is the only element
            that gives the chip its width, because every previous copy was
            absolutely positioned and the chip collapsed to ~0px, clipping all
            skill names behind overflow-hidden. Mirrors MakeAndBreak.tsx. */}
        <p
          className={cn(
            "pr-1 text-sm font-medium transition duration-300 ease-in-out",
            isLit
              ? // Reason: the row-level `group` hover paints the orange sweep
                // behind these chips, so lit orange text flips to white there
                // to stay legible (orange-on-orange otherwise).
                "brokenclip2 text-combo-lit group-hover:text-white group-hover/chip:translate-y-[0.75rem]"
              : "text-combo-unlit"
          )}
        >
          {skill.name}
        </p>
        {isLit && (
          <p className="brokenclip1 absolute left-0 top-0 pr-1 text-sm font-medium text-combo-lit transition duration-300 ease-in-out group-hover:text-white group-hover/chip:translate-y-[-0.75rem]">
            {skill.name}
          </p>
        )}
        {isLit && (
          <p className="absolute left-0 top-0 -z-[1] pr-1 text-sm font-medium text-white opacity-0 transition duration-300 ease-in-out group-hover/chip:opacity-100">
            proven ↗
          </p>
        )}
      </div>
      <div className="h-[2px] w-full bg-combo-unlit">
        <motion.div
          initial={{ width: prefersReducedMotion ? `${skill.proficiency}%` : "0%" }}
          whileInView={{ width: `${skill.proficiency}%` }}
          viewport={{ once: true }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 10, mass: 0.5 }
          }
          className={cn(
            "h-full transition-colors duration-300",
            isLit ? "bg-combo-lit group-hover:bg-white" : "bg-combo-unlit"
          )}
        />
      </div>
      {!isLit && (
        <p className="pointer-events-none absolute -top-6 left-1/2 w-max -translate-x-1/2 rounded-sm border border-darkgray bg-black px-2 py-1 text-[10px] uppercase tracking-widest text-graytransparent opacity-0 transition-opacity duration-200 group-hover/chip:opacity-100">
          no shipped project yet
        </p>
      )}
      {isLit && stickyElement && (
        // Geometry reference only (pointer-events-none) for StickyCursor's
        // hit-testing — it just needs an accurate bounding rect, not its own
        // interactivity, so this skips the Magnetic-scoped `.bounds` CSS.
        <div
          ref={(el) => stickyElement.current.push(el)}
          className="pointer-events-none absolute inset-0"
        ></div>
      )}
    </motion.div>
  );

  if (!isLit) return chip;

  return (
    <Link href={`/projects/${proofId}`} aria-label={`${skill.name} — proven by ${proofId}`}>
      {chip}
    </Link>
  );
}

interface ComboMeterProps {
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
}

export default function ComboMeter({ stickyElement }: ComboMeterProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionOpacity = useSectionExitFade(sectionRef, [0.6, 1]);

  return (
    <motion.section
      style={{ opacity: sectionOpacity }}
      id="combo-meter"
      ref={sectionRef}
      className="relative my-[3rem] min-h-max select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading className="mx-[10%] sm:mx-[0%]">COMBO METER</Heading>
      <p className="mx-[10%] mt-4 text-center text-xs text-graytransparent sm:mx-0 sm:text-left sm:text-sm">
        Lit skills are proven by a real shipped project — hover one to jump to it.
      </p>
      <div className="mt-24 flex flex-col items-center justify-center">
        {combos.map((group, i) => (
          <motion.div
            whileHover="show"
            className="group relative flex w-full min-h-[180px] flex-col items-center justify-between gap-10 overflow-hidden px-12 py-12 text-graytransparent transition-all duration-500 ease-in-out hover:text-white sm:flex-row"
            key={group.id}
          >
            <motion.div
              initial={{ width: 0, height: 0 }}
              variants={{
                show: {
                  width: ["0%", "100%", "100%"],
                  height: ["0.5%", "0.5%", "100%"],
                  transition: {
                    duration: 0.4,
                    ease: "easeInOut",
                    times: [0, 0.4, 0.9],
                  },
                },
              }}
              className="pointer-events-none absolute left-1/2 top-0 z-0 origin-center translate-x-[-50%] bg-gradient-to-r from-primary-light to-primary sm:top-auto"
            />
            <div className="pointer-events-none absolute z-0 flex w-full translate-x-[-4%] items-center justify-center">
              {[...Array(3)].map((_num, j: number) => {
                const dist = 300 * (j + 1);
                return (
                  <motion.div
                    key={j}
                    initial={{ width: "0px", height: "0px" }}
                    variants={{
                      show: {
                        width: dist + "px",
                        height: dist + "px",
                        transition: {
                          type: "spring",
                          bounce: 0.3,
                          repeat: 0,
                          delay: 0.4,
                        },
                      },
                    }}
                    className="absolute rounded-full bg-[#0000000a]"
                  />
                );
              })}
            </div>
            <motion.div
              variants={{
                collapse: { width: "0%" },
                expand: { width: "100%", transition: { duration: 0.6 } },
              }}
              initial={"collapse"}
              whileInView={"expand"}
              viewport={{ once: true }}
              className="linegradient absolute left-0 top-0 h-[1px]"
            ></motion.div>
            <SlidingText
              className="font-display text-[1rem] uppercase gap-[0.1rem] tracking-wide text-white"
              doNotRepeat={true}
              margin={"0px"}
              amount={"all"}
            >
              {group.label}
            </SlidingText>
            <motion.div
              variants={{
                hide: { opacity: "0%" },
                show: { opacity: "100%", transition: { duration: 0.6 } },
              }}
              initial={"hide"}
              whileInView={"show"}
              viewport={{ once: true }}
              className="z-[1] flex w-full flex-row flex-wrap justify-center gap-x-5 gap-y-3 text-center sm:w-1/2 sm:justify-start sm:text-left"
            >
              {group.skills.map((skill) => (
                <ComboSkillChip key={skill.name} skill={skill} stickyElement={stickyElement} />
              ))}
            </motion.div>
            {combos.length == i + 1 && (
              <motion.div
                variants={{
                  collapse: { width: "0%" },
                  expand: { width: "100%", transition: { duration: 0.6 } },
                }}
                initial={"collapse"}
                whileInView={"expand"}
                viewport={{ once: true }}
                className="linegradient absolute bottom-0 left-0 h-[1px]"
              ></motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
