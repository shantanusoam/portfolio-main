"use client";

import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import Heading from "./ui/Heading";
import GradientBlocker from "./ui/GradientBlocker";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { Github } from "lucide-react";
import AlternateSlidingTexts from "./ui/AlternateSlidingTexts";
import { projects } from "@/constants/projects";
import { Button } from "./ui/Buttons";
import MissionCard from "./MissionCard";

const textsData = [
  ["MORE", "MORE", "MORE", "MORE", "MORE", "MORE", "MORE"],
  [
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
  ],
  ["MORE", "MORE", "MORE", "MORE", "MORE", "MORE", "MORE"],
  [
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
    "PROJECTS",
  ],
  ["MORE", "MORE", "MORE", "MORE", "MORE", "MORE"],
];

const introVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1], delay: 0.15 * i },
  }),
};

type ProjectsProps = {
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
};

export default function Projects({ stickyElement }: ProjectsProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end end"],
  } as any);
  const sectionRef = useRef(null);
  const sectionOpacity = useSectionExitFade(sectionRef);
  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity: sectionOpacity }}
      id="mission-select"
      className="relative mx-[10%] my-[3rem] select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading>Mission Select</Heading>
      {/* Section title block: every other major section leads with a real
          display headline — this one previously jumped from the tiny
          checkpoint label straight to a lone centered paragraph. */}
      <div className="mt-10 text-center">
        <motion.h3
          custom={0}
          variants={introVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl md:text-6xl"
        >
          Choose your <span className="text-primary">mission</span>
        </motion.h3>
        <motion.p
          custom={1}
          variants={introVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-graytransparent sm:text-base sm:leading-7"
        >
          Real shipped work, fighter-profile style — pick a card to open the
          full debrief.
        </motion.p>
      </div>
      <div
        ref={targetRef}
        className="mt-14 flex flex-row flex-wrap items-stretch justify-center gap-x-6 gap-y-8"
      >
        {projects.map((project, i) => (
          <MissionCard
            mission={project}
            index={i}
            stickyElement={stickyElement}
            key={project.id}
          />
        ))}
        {/* "More on GitHub" card — same frame + dimensions as MissionCard so
            the grid stays perfectly uniform */}
        <div className="overflow-hidden pb-[9px] pl-2">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            className={cn(
              "relative flex h-[330px] w-[260px] flex-col md:h-[356px] md:w-[288px]"
            )}
          >
            <div className="gradientborder relative z-20 h-full w-full border bg-black">
              <div className="absolute inset-0 flex flex-col justify-center opacity-50">
                <AlternateSlidingTexts
                  scrollYProgress={scrollYProgress}
                  textsData={textsData}
                  className="text-3xl"
                />
                <GradientBlocker />
              </div>
              <div className="relative flex h-full w-full items-center justify-center">
                <Link href={"https://github.com/shantanusoam"} target="_blank">
                  <Button
                    type="white"
                    className="relative bg-black p-2 text-sm"
                  >
                    <p className="flex flex-row items-center justify-center gap-2">
                      <Github className="w-4" /> Github
                    </p>
                  </Button>
                </Link>
              </div>
            </div>
            <div className="gradientborder absolute left-[-2%] top-[3%] z-10 h-full w-full border bg-black"></div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
