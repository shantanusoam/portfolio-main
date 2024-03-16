"use client";

import { useRef } from "react";
import Heading from "./ui/Heading";
import { motion, useScroll, useTransform } from "framer-motion";
import { RevealingTextContainer, RevealingTextItem } from "./ui/RevealingText";
import Image from "next/image";
import { cn, useParallax } from "@/lib/utils";
import { hobbiesList, hobbiesListMobile } from "@/constants/hobbies";

export default function Hobbies() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scrollYProgressRevealingText } = useScroll({
    target: targetRef,
    offset: ["start end", "end center"],
  } as any);
  const sectionRef = useRef(null);
  const { scrollYProgress: opacityScroller } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  } as any);
  const sectionOpacity = useTransform(opacityScroller, [0.4, 0.8], [1, 0]);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRefMobile = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scrollYProgressImageContainer } = useScroll({
    target: imageContainerRef,
    offset: ["start end", "end start"],
  } as any);
  const { scrollYProgress: scrollYProgressImageContainerMobile } = useScroll({
    target: imageContainerRefMobile,
    offset: ["start end", "end start"],
  } as any);
  const yReverse = useParallax(scrollYProgressImageContainer, -150);
  const yForward = useParallax(scrollYProgressImageContainer, 300);
  const yReverseMobile = useParallax(scrollYProgressImageContainerMobile, -150);
  const yForwardMobile = useParallax(scrollYProgressImageContainerMobile, 300);

  const hideAndShowVariant = {
    hide: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
  };

  const hideAndShowAndScaleVariant = {
    hide: {
      opacity: 0,
      scale: 0.9,
    },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity: sectionOpacity }}
      id="hobbies"
      className="relative mx-[10%] my-[3rem] min-h-max select-none py-[6rem] sm:mx-[15%]"
    >
      <Heading>HOBBIES</Heading>
      <div className="mt-24 text-graytransparent">
        <motion.div
          variants={hideAndShowVariant}
          initial="hide"
          whileInView="show"
          className="m-auto flex w-max flex-col items-center justify-center text-center"
          ref={targetRef}
          viewport={{ once: true }}
        >
          <RevealingTextContainer
            scrollYProgress={scrollYProgressRevealingText}
          >
            {[
              `In the world of code, I'am the star,`,
              `Frontend wizard,taken it far.,`,
              `With lines so neat,`,
              "My websites are always a visual treat.",
            ].map((text, i) => (
              <RevealingTextItem index={i} key={i}>
                {text}
              </RevealingTextItem>
            ))}
          </RevealingTextContainer>
          <p className="mt-6 w-full text-center text-xs sm:text-sm">
            - Probably Dr. Seuss's
          </p>
        </motion.div>
        <div
          className="my-[5rem] hidden h-[75dvh] flex-row items-center justify-between gap-2 overflow-hidden text-clip md:flex"
          ref={imageContainerRef}
        >
          {hobbiesList.map((hobbies, i) => (
            <motion.div
              key={i}
              variants={hideAndShowVariant}
              initial="hide"
              whileInView="show"
              style={{ y: i % 2 == 0 ? yForward : yReverse }}
              viewport={{ once: true }}
              className={cn("flex flex-col gap-2")}
            >
              {hobbies.map((hobbie, j) => (
                <motion.div
                  key={j}
                  variants={hideAndShowAndScaleVariant}
                  initial="hide"
                  whileInView="show"
                  viewport={{ once: true }}
                  className=""
                >
                  <Image
                    src={hobbie.src}
                    alt={hobbie.title}
                    className="h-[400px] w-[300px] object-cover"
                    priority
                  />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
        <div
          className="my-[6rem] flex h-[70dvh] flex-row items-center justify-between gap-2 overflow-hidden text-clip md:hidden"
          ref={imageContainerRefMobile}
        >
          {hobbiesListMobile.map((hobbies, i) => (
            <motion.div
              key={i}
              variants={hideAndShowVariant}
              initial="hide"
              whileInView="show"
              style={{ y: i % 2 == 0 ? yForwardMobile : yReverseMobile }}
              viewport={{ once: true }}
              className={cn("flex flex-col gap-2")}
            >
              {hobbies.map((hobbie, j) => (
                <motion.div
                  key={j}
                  variants={hideAndShowAndScaleVariant}
                  initial="hide"
                  whileInView="show"
                  viewport={{ once: true }}
                  className=""
                >
                  <Image
                    src={hobbie.src}
                    alt={hobbie.title}
                    className="h-[400px] w-[300px] object-cover"
                    priority
                  />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
        <motion.div
          variants={hideAndShowVariant}
          initial="hide"
          whileInView="show"
          viewport={{ once: true }}
          className="m-auto mb-24 flex w-full text-center text-base font-medium leading-7 sm:text-xl lg:w-1/2"
        >
          <p>
            Apart from coding,
            <br />
            <br />
            You can usually find me{" "}
            <span className="text-white">petting doggos</span>,{" "}
            <span className="text-white">playing games</span>,{" "}
            <span className="text-white">travelling around</span>, chilling on
            the <span className="text-white">web</span>, binging on some{" "}
            <span className="text-white">netflix shows</span>, trying{" "}
            <span className="text-white">something new to eat</span>,{" "}
            <span className="text-white">painting</span>, or probably doing{" "}
            <span className="text-white">something stupid</span>.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
