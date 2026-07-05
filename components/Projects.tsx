"use client";

import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import Heading from "./ui/Heading";
import GradientBlocker from "./ui/GradientBlocker";
import { cn } from "@/lib/utils";
import { forwardRef, useRef } from "react";
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

const Projects = forwardRef(({ stickyElement }) => {
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
      <motion.p
        variants={{
          hidden: {
            opacity: 0,
          },
          show: {
            opacity: 1,
            transition: {
              duration: 0.4,
              delay: 0.4,
            },
          },
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mt-24 w-full text-center text-base font-medium leading-7 text-graytransparent sm:text-lg md:text-xl"
      >
        Choose a mission — real shipped work, fighter-profile style, below.
      </motion.p>
      <motion.div className="mt-24 flex flex-row flex-wrap items-center justify-center gap-6">
        {projects.map((project, i) => (
          <MissionCard mission={project} stickyElement={stickyElement} key={i} />
        ))}
        <motion.div
          variants={{
            hidden: {
              opacity: 0,
            },
            show: {
              opacity: 1,
              transition: {
                duration: 0.4,
                delay: 0.4,
              },
            },
          }}
          initial={"hidden"}
          whileInView={"show"}
          viewport={{ once: true }}
          className={cn("flex flex-col relative w-[240px] h-[170px] md:w-[268px] md:h-[200px]")}
        >
          <div className="gradientborder relative z-20 h-full w-full border bg-black">
            <div className="absolute w-full opacity-50">
              <AlternateSlidingTexts
                scrollYProgress={scrollYProgress}
                textsData={textsData}
              />
              <GradientBlocker />
            </div>
            <div className="flex h-full w-full items-center justify-center">
              <Link href={"https://github.com/shantanusoam"} target="_blank">
                <Button type="white" className="relative bg-black p-2 text-sm">
                  <p className="flex flex-row items-center justify-center gap-2">
                    <Github className="w-4" /> Github
                  </p>
                </Button>
              </Link>
            </div>
          </div>
          <div className="gradientborder absolute left-[-2%] top-[3%] z-10 h-full w-full border bg-black"></div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
});
Projects.displayName = "Projects";
export default Projects;
