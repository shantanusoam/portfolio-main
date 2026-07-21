"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Heading from "./ui/Heading";
import { combos } from "@/constants/combos";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import { cn } from "@/lib/utils";
import { ComboSkill } from "@/@types/combo.type";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

interface ComboSkillChipProps {
  skill: ComboSkill;
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
}

// Compact skill chip — same lit/unlit + proven-link mechanic as before,
// tightened for density (smaller type, thinner meter, snappier hover).
function ComboSkillChip({ skill, stickyElement }: ComboSkillChipProps) {
  const isLit = skill.proofProjectIds.length > 0;
  const proofId = skill.proofProjectIds[0];
  const prefersReducedMotion = usePrefersReducedMotion();

  const chip = (
    <motion.div
      whileHover={
        isLit || prefersReducedMotion
          ? undefined
          : { rotate: [0, -2, 2, 0] }
      }
      transition={{ duration: 0.28 }}
      className={cn(
        "group/chip relative flex flex-col gap-0.5 overflow-hidden px-0.5 py-0.5 transition-transform duration-150 active:scale-[0.97]",
        isLit ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div className="relative h-[0.95rem] overflow-hidden">
        {/* In-flow copy sizes the chip; overlays stay absolute. */}
        <p
          className={cn(
            "pr-0.5 text-[11px] font-medium leading-none tracking-wide transition duration-200 ease-out sm:text-xs",
            isLit
              ? // Row hover paints orange behind chips — flip to white for contrast.
                "brokenclip2 text-combo-lit group-hover:text-white group-hover/chip:translate-y-[0.65rem]"
              : "text-combo-unlit"
          )}
        >
          {skill.name}
        </p>
        {isLit && (
          <p className="brokenclip1 absolute left-0 top-0 pr-0.5 text-[11px] font-medium leading-none tracking-wide text-combo-lit transition duration-200 ease-out group-hover:text-white group-hover/chip:translate-y-[-0.65rem] sm:text-xs">
            {skill.name}
          </p>
        )}
        {isLit && (
          <p className="absolute left-0 top-0 -z-[1] pr-0.5 text-[11px] font-medium leading-none tracking-wide text-white opacity-0 transition duration-200 ease-out group-hover/chip:opacity-100 sm:text-xs">
            proven ↗
          </p>
        )}
      </div>
      <div className="h-px w-full bg-combo-unlit">
        <motion.div
          initial={{
            width: prefersReducedMotion ? `${skill.proficiency}%` : "0%",
          }}
          whileInView={{ width: `${skill.proficiency}%` }}
          viewport={{ once: true }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", duration: 0.45, bounce: 0.12 }
          }
          className={cn(
            "h-full transition-colors duration-200",
            isLit ? "bg-combo-lit group-hover:bg-white" : "bg-combo-unlit"
          )}
        />
      </div>
      {!isLit && (
        <p className="pointer-events-none absolute -top-5 left-1/2 w-max -translate-x-1/2 rounded-sm border border-darkgray bg-black px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-graytransparent opacity-0 transition-opacity duration-150 group-hover/chip:opacity-100">
          no shipped project yet
        </p>
      )}
      {isLit && stickyElement && (
        <div
          ref={(el) => stickyElement.current.push(el)}
          className="pointer-events-none absolute inset-0"
        ></div>
      )}
    </motion.div>
  );

  if (!isLit) return chip;

  return (
    <Link
      href={`/projects/${proofId}`}
      aria-label={`${skill.name} — proven by ${proofId}`}
    >
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
      className="relative my-[1.5rem] min-h-max select-none py-[3rem] sm:mx-[15%] sm:py-[3.5rem]"
    >
      <Heading className="mx-[10%] sm:mx-[0%]">COMBO METER</Heading>
      <p className="mx-[10%] mt-2 max-w-md text-center text-[11px] leading-snug text-graytransparent sm:mx-0 sm:text-left sm:text-xs">
        Lit skills are proven by a real shipped project — hover one to jump to
        it.
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center">
        {combos.map((group, i) => (
          <motion.div
            whileHover="show"
            className="group relative flex w-full flex-col items-start justify-between gap-3 overflow-hidden px-5 py-3.5 text-graytransparent transition-colors duration-200 ease-out hover:text-white sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-4"
            key={group.id}
          >
            <motion.div
              initial={{ width: 0, height: 0 }}
              variants={{
                show: {
                  width: ["0%", "100%", "100%"],
                  height: ["0.5%", "0.5%", "100%"],
                  transition: {
                    duration: 0.32,
                    ease: "easeInOut",
                    times: [0, 0.4, 0.9],
                  },
                },
              }}
              className="pointer-events-none absolute left-1/2 top-0 z-0 origin-center translate-x-[-50%] bg-gradient-to-r from-primary-light to-primary sm:top-auto"
            />
            <div className="pointer-events-none absolute z-0 flex w-full translate-x-[-4%] items-center justify-center">
              {[...Array(3)].map((_num, j: number) => {
                const dist = 220 * (j + 1);
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
                          bounce: 0.2,
                          repeat: 0,
                          delay: 0.28,
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
                expand: { width: "100%", transition: { duration: 0.45 } },
              }}
              initial={"collapse"}
              whileInView={"expand"}
              viewport={{ once: true }}
              className="linegradient absolute left-0 top-0 h-px"
            ></motion.div>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="relative z-[1] shrink-0 font-display text-[0.7rem] uppercase tracking-[0.14em] text-white sm:w-[9.25rem] sm:text-[0.75rem]"
            >
              {group.label}
            </motion.p>
            <motion.div
              variants={{
                hide: { opacity: "0%" },
                show: { opacity: "100%", transition: { duration: 0.3 } },
              }}
              initial={"hide"}
              whileInView={"show"}
              viewport={{ once: true }}
              className="z-[1] flex w-full flex-row flex-wrap justify-start gap-x-2.5 gap-y-1.5 text-left sm:flex-1"
            >
              {group.skills.map((skill) => (
                <ComboSkillChip
                  key={skill.name}
                  skill={skill}
                  stickyElement={stickyElement}
                />
              ))}
            </motion.div>
            {combos.length == i + 1 && (
              <motion.div
                variants={{
                  collapse: { width: "0%" },
                  expand: { width: "100%", transition: { duration: 0.45 } },
                }}
                initial={"collapse"}
                whileInView={"expand"}
                viewport={{ once: true }}
                className="linegradient absolute bottom-0 left-0 h-px"
              ></motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
