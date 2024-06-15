"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Heading from "./ui/Heading";
import { ExperienceType } from "@/@types/experience.type";
import { experiences } from "@/constants/experiences";
import LogoCarousel from "./ui/LogoCarousel";
import ScrollingText from "./ScrollingText";

interface ExperienceItemProps {
  experience: ExperienceType;
}

function ExperienceItem({ experience }: ExperienceItemProps) {
  const animCount = useRef<number>(1);
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

      <motion.h2
        custom={1}
        variants={pTagVariants}
        className=" flex flex-row text-lg font-medium leading-7 tracking-wider text-white md:text-xl"
      >
        {experience.company}
      </motion.h2>
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
  const { scrollYProgress: opacityScroller } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  } as any);
  const sectionOpacity = useTransform(opacityScroller, [0.4, 0.8], [1, 0]);

  return (
    <motion.section
      style={{ opacity: sectionOpacity }}
      ref={sectionRef}
      id="experience"
      className="my-[3rem] select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading className="mx-[10%] sm:mx-[0%]">EXPERIENCE</Heading>
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
          <ExperienceItem key={i} experience={experience} />
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
