"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import MenuToggle from "./ui/MenuToggle";
import Socials from "./ui/Socials";
import { Button } from "./ui/Buttons";
import { ScrollText } from "lucide-react";
import resumeLink from "@/constants/resume";
import { OBSTACLE_INVALIDATE_EVENT } from "@/lib/mascot/interaction/DomObstacleRegistry";

import AboutmePic from "@/public/AboutMePic.jpg";
import contact from "@/public/Fluency Zoom Logo.png";
import hobbi from "@/public/3D Windows Developer Symbols.png";
import ai from "@/public/AI Isometric Lettering.png";
import programming from "@/public/Programmer coding laptop.png";
import skills from "@/public/Skills clipart gleam.png";
import HoverImageLink from "./HoverImageLink";
import { CommandPaletteTrigger } from "./command-palette/CommandPalette";
const navSections = [
  {
    title: "About",
    subHeading: `Something Not To be Told`,
    image: AboutmePic,
  },
  {
    title: "Experience",
    subHeading: `companies i worked for`,
    image: skills,
  },
  {
    title: "Projects",
    subHeading: `Things i give my commitment to`,
    image: programming,
  },
  {
    title: "Skills",
    subHeading: `You Don't see what's real`,
    image: ai,
  },
  {
    title: "Hobbies",
    subHeading: `loves to do`,
    image: hobbi,
  },
  {
    title: "Learning",
    subHeading: `what i'm building right now`,
    image: ai,
    href: "/learning",
  },
  {
    title: "Contact",
    subHeading: `Common I am here to help`,
    image: contact,
  },
  {
    title: "Archive",
    subHeading: `writing, references and rare questions`,
    image: programming,
    href: "/blog",
  },
];

const archiveLinks = [
  { href: "/blog", index: "01", label: "Blog" },
  { href: "/inspo", index: "02", label: "Inspo" },
  { href: "/worth-your-time", index: "03", label: "Worth your time" },
  { href: "/raq", index: "04", label: "RAQ" },
];
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // The full-screen mobile menu overlay mounts/unmounts obstacle-relevant
  // markup outside of resize/scroll, so tell the mascot's obstacle registry
  // to re-measure explicitly (spec: "a section opens or closes").
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(OBSTACLE_INVALIDATE_EVENT));
  }, [menuOpen]);

  const liHoverAnim = {
    color: "#fff",
    transition: { ease: "easeIn", duration: 0.3 },
  };
  const ulAnim = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const liAnim = {
    hidden: { opacity: 0, x: "1.5rem" },
    show: { opacity: 1, x: "0", transition: { type: "spring", bounce: 0.3 } },
  };

  return (
    <>
      <div
        data-mascot-obstacle="hard"
        className="fixed left-[3%] top-8 z-[1001] scale-90 select-none text-xs sm:scale-100 md:top-12"
      >
        <Link
          href={"/#hero"}
          className="group"
          onClick={() => setMenuOpen(false)}
          aria-label="Logo"
        >
          <motion.svg
            initial={{ opacity: 0, x: "-1.5rem" }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            width="24"
            height="24"
            viewBox="0 0 137 137"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M137 0H0V82.5H41.3223L61.6612 62.1612L79.3388 79.8388L51.6777 107.5H0V137H137V0Z"
              fill="var(--white)"
              className="transition-all duration-500 group-hover:fill-primary"
            />
          </motion.svg>
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeIn" }}
      >
        <Button className="absolute right-[calc(3%+24px+1.5rem)] top-[22px] z-[1000] select-none p-0 text-xs sm:text-sm md:top-[38px]">
          <a
            href={resumeLink}
            target="_blank"
            aria-label="View resume"
            className="flex items-center justify-center gap-2 p-2"
          >
            <ScrollText className="pointer-events-none w-[18px]" />
            View Resume
          </a>
        </Button>
      </motion.div>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        aria-label="Signal Archive"
        data-mascot-obstacle="hard"
        className="border-white/20 bg-black/80 fixed inset-x-[3%] top-[70px] z-[999] flex select-none items-stretch overflow-x-auto border backdrop-blur-xl md:top-[86px] lg:left-1/2 lg:right-auto lg:top-[30px] lg:-translate-x-1/2"
      >
        <span className="border-white/10 text-white/40 hidden items-center border-r px-3 font-data text-[7px] uppercase tracking-[0.18em] xl:flex">
          Signal archive
        </span>
        {archiveLinks.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className="border-white/10 hover:bg-primary/10 group flex min-w-max flex-1 items-center gap-2 border-r px-3 py-2.5 font-data uppercase transition-colors last:border-r-0 hover:text-primary lg:flex-none lg:px-4"
          >
            <span className="text-[7px] tracking-[0.12em] text-primary">
              {item.index}
            </span>
            <span className="text-white/70 text-[8px] tracking-[0.1em] transition-colors group-hover:text-primary sm:text-[9px]">
              {item.label}
            </span>
          </Link>
        ))}
        <CommandPaletteTrigger variant="home" />
      </motion.nav>
      <MenuToggle menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menuOverlay"
            initial={{
              opacity: 0,
              x: "100%",
            }}
            animate={{
              opacity: 1,
              x: "0%",
            }}
            exit={{
              opacity: 0,
              x: "100%",
            }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className="fixed left-0 top-0 z-[1000] h-[100dvh] w-screen bg-black px-[10%] sm:px-[15%]"
            data-mascot-obstacle="hard"
          >
            {/* <HoverImageLinks/> */}
            <div
              id="nav-container"
              className="flex h-[90vh] items-center justify-center md:h-[90vh]"
            >
              <motion.ul
                variants={ulAnim}
                initial="hidden"
                animate="show"
                className="flex flex-col items-center justify-center gap-1 text-xl font-medium uppercase tracking-widest text-graytransparent sm:text-2xl md:gap-6"
              >
                {navSections.map((navSection, i) => (
                  <motion.li
                    key={i}
                    variants={liAnim}
                    className="cursor-pointer"
                    whileHover={liHoverAnim}
                  >
                    <HoverImageLink
                      ageLink
                      heading={navSection.title}
                      subheading={navSection.subHeading}
                      imgSrc={navSection.image}
                      href={
                        ("href" in navSection && navSection.href) ||
                        `#${navSection.title.toLowerCase()}`
                      }
                      onClick={() => setMenuOpen(false)}
                    />
                  </motion.li>
                ))}
              </motion.ul>
              <Socials direction="horizontal" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
