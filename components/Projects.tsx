"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, easeIn } from "framer-motion";
import Heading from "./ui/Heading";
import GradientBlocker from "./ui/GradientBlocker";
import { cn } from "@/lib/utils";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Github, MoveRight } from "lucide-react";
import AlternateSlidingTexts from "./ui/AlternateSlidingTexts";
import { projects } from "@/constants/projects";
import { Button } from "./ui/Buttons";
import Magnetic from "@/components/ui/magnetic/Magnetic";
import StickyCursor from "./ui/stickyCursor/StickyCursor";
import Image from "next/image";
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
  const { scrollYProgress: opacityScroller } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  } as any);
  const sectionOpacity = useTransform(opacityScroller, [0.4, 0.8], [1, 0]);
  const parent = {
    variantA: { scale: 1 },
    variantB: { scale: 1.25 },
  };

  const child = {
    variantA: { bottom: 150, right: 0, rotate: 0 },
    variantB: { top: 120, left: -20, rotate: -2 },
  };
  const child2 = {
    variantA: { bottom: 0, right: 0, rotate: 0 },
    variantB: { top: 20, left: 20, rotate: 0 },
  };
  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity: sectionOpacity }}
      id="projects"
      className="relative mx-[10%] my-[3rem] select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading>Projects</Heading>
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
        Check out some of my <span className="text-primary">side projects</span>{" "}
        below.
      </motion.p>
      <motion.div className="mt-24 flex flex-row flex-wrap items-center justify-center gap-14">
        {projects.map((project, i) => (
          <div key={i} className="overflow-hidden pb-[9px] pl-2">
            <motion.div
              // variants={parent}
              // initial="variantA"
              whileHover="variantB"
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
              className={cn(
                "flex  flex-col relative w-[290px] md:w-[400px] h-[200px] md:h-[300px]"
              )}
            >
              <div className="gradientborder  group z-20 h-full w-full border bg-black p-7 text-graytransparent sm:p-8 md:p-20">
                <div className="flex h-full flex-col items-start justify-center font-medium leading-7 tracking-wider">
                  <motion.div
                    variants={child2}
                    className="absolute   flex flex-col gap-6"
                  >
                    <p className="text-lg text-white md:text-xl">
                      {project.title}
                    </p>
                    <p className=" w-4/5 text-sm font-light text-graytransparent transition-all group-hover:w-full">
                      {project.description}
                    </p>

                    <div className="flex flex-row gap-4 group-hover:hidden">
                      {project.metadata?.map((meta, i) => (
                        <p
                          key={i}
                          className="font-mono text-xs uppercase text-darkgray"
                        >
                          {meta}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div
                    style={{
                      width: "100%",
                      height: "50%",
                      borderRadius: "20px 20px 30px 20px",
                      backgroundColor: "#fff",
                      position: "absolute",
                      bottom: -165,
                      right: 0,
                    }}
                    variants={child}
                    transition={{
                      type: "spring",
                      damping: 10,
                      mass: 0.2,
                      stiffness: 150,
                      duration: 1.2,
                      easeIn,
                    }}
                  >
                    <Image
                      src={project.cover_image}
                      alt={`${project.description}`}
                      className="  rounded-lg object-cover "
                    />{" "}
                  </motion.div>
                  <div className=" absolute bottom-0 right-0 p-4">
                    <Link
                      href={project.url}
                      aria-label="Link to view the project"
                    >
                      <Magnetic>
                        <MoveRight className="w-5 text-gray transition-all duration-300 ease-in-out hover:text-primary" />
                        <div
                          ref={(el) => stickyElement.current.push(el)}
                          className="bounds"
                        ></div>
                      </Magnetic>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="gradientborder absolute left-[-2%] top-[3%] z-10 h-full w-full border bg-black"></div>
            </motion.div>
          </div>
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
          className={cn("flex flex-col relative w-[400px] h-[300px]")}
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
const BounceCard = ({ className, children }) => {
  return (
    <motion.div
      whileHover={{ scale: 0.95, rotate: "-1deg" }}
      className={`group relative min-h-[300px] cursor-pointer overflow-hidden rounded-2xl bg-slate-100 p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
};
const CardTitle = ({ children }) => {
  return (
    <h3 className="mx-auto text-center text-3xl font-semibold">{children}</h3>
  );
};
Projects.displayName = "Projects";
export default Projects;
