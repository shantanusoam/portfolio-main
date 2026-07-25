"use client";

import resumeLink from "@/constants/resume";
import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { Github, Linkedin, ScrollText, Twitter } from "lucide-react";
import { Ref } from "react";
import Magnetic from "./magnetic/Magnetic";

interface SocialsProps extends HTMLMotionProps<"div"> {
  direction?: "vertical" | "horizontal";
  /** Framer `useAnimate` / container ref for opacity toggles on scroll. */
  containerRef?: Ref<HTMLDivElement>;
}

export default function Socials({
  direction = "vertical",
  containerRef,
  className,
  ...props
}: SocialsProps) {
  const ulAnim = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const socialsAnimSelector = {
    vertical: {
      hidden: { opacity: 0, x: "1.5rem" },
      show: {
        opacity: 1,
        x: "0",
        transition: { type: "spring", duration: 0.42, bounce: 0 },
      },
    },
    horizontal: {
      hidden: { opacity: 0, y: "1.5rem" },
      show: {
        opacity: 1,
        y: "0",
        transition: { type: "spring", duration: 0.42, bounce: 0 },
      },
    },
  };

  const socialsAnim = socialsAnimSelector[direction];

  return (
    <motion.div
      {...props}
      ref={containerRef}
      variants={ulAnim}
      initial="hidden"
      animate="show"
      className={cn(
        "fixed bottom-0 z-[997] my-8 ml-[2.5%] hidden flex-col items-center justify-start text-graytransparent transition-opacity sm:flex md:my-12",
        direction === "horizontal" && "flex-row ml-0 flex",
        className
      )}
    >
      <motion.a
        variants={socialsAnim}
        href="https://www.linkedin.com/in/shantanu007/"
        target="_blank"
        className="p-2"
        aria-label="Link to my linkedin"
      >
        <Magnetic>
          <Linkedin className="h-5 w-5 hover:text-primary" />
        </Magnetic>
      </motion.a>

      <motion.a
        variants={socialsAnim}
        href="https://github.com/shantanusoam"
        target="_blank"
        className="p-2"
        aria-label="Link to my github"
      >
        <Magnetic>
          <Github className="h-5 w-5 hover:text-primary" />
        </Magnetic>
      </motion.a>
      <motion.a
        variants={socialsAnim}
        href="https://twitter.com/Shanntanusoam"
        target="_blank"
        className="p-2"
        aria-label="Link to my twitter"
      >
        <Magnetic>
          <Twitter className="h-5 w-5 hover:text-primary" />
        </Magnetic>
      </motion.a>
      <motion.a
        variants={socialsAnim}
        href={resumeLink}
        target="_blank"
        className="p-2"
        aria-label="Link to view my resume"
      >
        <Magnetic>
          <ScrollText className="h-5 w-5 hover:text-primary" />
        </Magnetic>
      </motion.a>
    </motion.div>
  );
}
