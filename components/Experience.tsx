"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import Heading from "./ui/Heading";
import { ExperienceType } from "@/@types/experience.type";
import { experiences } from "@/constants/experiences";
import LogoCarousel from "./ui/LogoCarousel";
import ScrollingText from "./ScrollingText";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import { MapPin } from "lucide-react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";

interface ExperienceItemProps {
  experience: ExperienceType;
  checkpoint: number;
}

function ExperienceItem({ experience, checkpoint }: ExperienceItemProps) {
  const animCount = useRef<number>(1);
  const prefersReducedMotion = usePrefersReducedMotion();
  // See EntranceWipe.tsx for why: usePrefersReducedMotion's SSR default
  // (true) differs from what it resolves to on the client's first render,
  // so a structural mount/unmount decision needs this extra gate or it
  // fails hydration for the whole page.
  const mounted = useMounted();
  const pTagVariants = {
    hidden: {
      opacity: 0,
      y: "1rem",
    },
    show: (i: number) => ({
      opacity: 1,
      y: "0rem",
      transition: {
        duration: 0.4,
        delay: 0.4 * i,
      },
    }),
  };

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
        },
        show: {
          opacity: 1,
          transition: {
            duration: 0.4,
          },
        },
      }}
      initial={"hidden"}
      whileInView={"show"}
      viewport={{ once: true, amount: 0.8 }}
      className="  relative flex min-h-[180px] w-full flex-col items-center justify-between  gap-10 py-12 sm:min-h-[250px] sm:flex-row"
    >
      <motion.div
        variants={{
          collapse: {
            width: "0%",
          },
          expand: {
            width: "100%",
            transition: {
              duration: 0.6,
              delay: 0.4,
            },
          },
        }}
        initial={"collapse"}
        whileInView={"expand"}
        viewport={{ once: true, amount: 0.8, margin: "0px 0px -150px 0px" }}
        className="linegradient absolute left-0 top-0 h-[1px]"
      ></motion.div>
      {(!mounted || !prefersReducedMotion) && (
        // Traveling spark: a bright bead runs along the divider once as it
        // draws in, like a spark down a wire — turns a static reveal into
        // a small event, echoing the trail/circuit color language elsewhere.
        <motion.div
          initial={{ left: "0%", opacity: 0 }}
          whileInView={{ left: "100%", opacity: [0, 1, 1, 0] }}
          viewport={{ once: true, amount: 0.8, margin: "0px 0px -150px 0px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeInOut" }}
          className="pointer-events-none absolute top-0 z-10 h-[3px] w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(255,77,28,0.8)]"
        />
      )}

      <div className="flex flex-col gap-2">
        <motion.p
          custom={0}
          variants={pTagVariants}
          className="flex flex-row items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary"
        >
          <MapPin className="w-3.5" />
          Checkpoint {String(checkpoint).padStart(2, "0")}
        </motion.p>
        <motion.h2
          custom={1}
          variants={pTagVariants}
          className="font-display flex flex-row text-lg tracking-wider text-white md:text-2xl"
        >
          {experience.company}
        </motion.h2>
      </div>
      <div className="relative text-center sm:text-right ">
        <div className="flex flex-col gap-6">
          {experience.roles.map((role, index) => {
            return (
              <div
                key={index}
                className=" flex flex-col gap-0.5 text-graytransparent"
              >
                <motion.p custom={animCount.current++} variants={pTagVariants}>
                  {role.role}
                </motion.p>
                {role.from?.month && (
                  <motion.p
                    custom={animCount.current++}
                    variants={pTagVariants}
                    className="text-xs font-light"
                  >
                    {`${role.from?.month} ${role.from?.year} - ${role.to
                      ?.month} ${role.to?.year ? role.to.year : ""}`}
                  </motion.p>
                )}
                <motion.p
                  custom={animCount.current++}
                  variants={pTagVariants}
                  className="text-xs font-light"
                >
                  {role.type}
                </motion.p>
              </div>
            );
          })}
        </div>

        {/* <div className=" absolute hidden h-[400px] w-[400px] rounded-full bg-red-500  group-hover:block">
          <ScrollingText>
            {experience.summary.map((summary, index) => {
              return (
                <p key={index} className="text-sm text-white">
                  {summary}
                </p>
              );
            })}
          </ScrollingText>
        </div> */}
      </div>
    </motion.div>
  );
}

export default function Experience() {
  const sectionRef = useRef(null);
  const sectionOpacity = useSectionExitFade(sectionRef);

  return (
    <motion.section
      style={{ opacity: sectionOpacity }}
      ref={sectionRef}
      id="trail-map"
      className="my-[3rem] select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading className="mx-[10%] sm:mx-[0%]">TRAIL MAP</Heading>
      <div className="mt-24 flex flex-col items-start justify-center">
        <motion.div
          variants={{
            collapse: {
              width: "0%",
            },
            expand: {
              width: "100%",
              transition: {
                duration: 0.6,
                delay: 0.4,
              },
            },
          }}
          initial={"collapse"}
          whileInView={"expand"}
          viewport={{ once: true, amount: 0.8, margin: "0px 0px -10% 0px" }}
          className="linegradient h-[1px]"
        ></motion.div>
        <LogoCarousel />
        {experiences.map((experience, i) => (
          <ExperienceItem key={i} experience={experience} checkpoint={i + 1} />
        ))}
        <motion.div
          variants={{
            collapse: {
              width: "0%",
            },
            expand: {
              width: "100%",
              transition: {
                duration: 0.6,
                delay: 0.4,
              },
            },
          }}
          initial={"collapse"}
          whileInView={"expand"}
          viewport={{ once: true, amount: 0.8, margin: "0px 0px -10% 0px" }}
          className="linegradient h-[1px]"
        ></motion.div>
      </div>
    </motion.section>
  );
}
