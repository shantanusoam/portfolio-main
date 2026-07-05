import { Github, Linkedin, ScrollText, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import resume_link from "@/constants/resume";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

// A single thread draws itself into a simple tied-off shape as you reach
// the bottom — a deliberate "the end," not a trail-off. Bookends the
// entrance wipe: the site opens with a brush gesture and closes with a knot.
function ClosingStitch() {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <svg
      width="60"
      height="24"
      viewBox="0 0 60 24"
      className="mx-auto"
      aria-hidden="true"
    >
      <motion.path
        d="M2 12 C 15 2, 25 22, 30 12 C 35 2, 45 22, 58 12"
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 0.6 : 0.4 }}
        whileInView={{ pathLength: 1, opacity: 0.6 }}
        viewport={{ once: true }}
        transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: "easeInOut" }}
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: "1.5rem" },
        show: {
          opacity: 1,
          y: "0",
          transition: { type: "spring", bounce: 0.3 },
        },
      }}
      initial="hidden"
      whileInView="show"
      id="footer"
      className="relative select-none sm:mx-[15%] flex flex-col items-center py-8 text-graytransparent gap-6 mt-[3rem]"
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
        viewport={{ once: true }}
        className="h-[1px] linegradient absolute top-0"
      ></motion.div>
      <ClosingStitch />
      <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <p className="hidden sm:block w-1/3 hover:text-primary transition-all duration-500">
          Shantanu soam
        </p>
        <svg
          width="28"
          height="28"
          viewBox="0 0 137 137"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="group scale-90 sm:scale-100"
        >
          <path
            d="M137 0H0V82.5H41.3223L61.6612 62.1612L79.3388 79.8388L51.6777 107.5H0V137H137V0Z"
            fill="var(--graytransparent)"
            className="group-hover:fill-primary transition-all duration-500"
          />
        </svg>
        <div className="flex flex-row items-center justify-center sm:justify-end transition-all z-[997] gap-4 w-1/3">
          <a
            href="https://www.linkedin.com/in/shantanu007/"
            target="_blank"
            className="p-2"
            aria-label="Link to my linkedin"
          >
            <Linkedin className="w-5 h-5 hover:text-primary" />
          </a>
          <div className="w-[2px] h-6 bg-darkgray rotate-12"></div>
          <a
            href="https://github.com/shantanusoam"
            target="_blank"
            className="p-2"
            aria-label="Link to my github"
          >
            <Github className="w-5 h-5 hover:text-primary" />
          </a>
          <div className="w-[2px] h-6 bg-darkgray rotate-12"></div>
          <a
            href="https://twitter.com/Shanntanusoam"
            target="_blank"
            className="p-2"
            aria-label="Link to my twitter"
          >
            <Twitter className="w-5 h-5 hover:text-primary" />
          </a>
          <div className="w-[2px] h-6 bg-darkgray rotate-12"></div>
          <a
            href={resume_link}
            target="_blank"
            className="p-2"
            aria-label="Link to view my resume"
          >
            <ScrollText className="w-5 h-5 hover:text-primary" />
          </a>
        </div>
      </div>
    </motion.section>
  );
}
