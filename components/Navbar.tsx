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
import { SSSignature } from "./ss-logo/SSSignature";
const navSections = [
  {
    title: "About",
    subHeading: `Something Not To be Told`,
    image: AboutmePic,
    href: "/#about",
  },
  {
    title: "Experience",
    subHeading: `companies i worked for`,
    image: skills,
    href: "/#trail-map",
  },
  {
    title: "Projects",
    subHeading: `Things i give my commitment to`,
    image: programming,
    href: "/#mission-select",
  },
  {
    title: "Skills",
    subHeading: `You Don't see what's real`,
    image: ai,
    href: "/#pattern-library",
  },
  {
    title: "Hobbies",
    subHeading: `loves to do`,
    image: hobbi,
    href: "/#field-notes",
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
    href: "/#contact",
  },
  {
    title: "Archive",
    subHeading: `writing, references and rare questions`,
    image: programming,
    href: "/blog",
  },
];

const archiveLinks = [
  { href: "/blog", index: "01", label: "Blog", compact: "Blog" },
  { href: "/inspo", index: "02", label: "Inspo", compact: "Inspo" },
  {
    href: "/worth-your-time",
    index: "03",
    label: "Worth your time",
    compact: "Worth",
  },
  { href: "/raq", index: "04", label: "RAQ", compact: "RAQ" },
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
        className="fixed left-[3%] top-5 z-[1001] scale-90 select-none text-xs sm:scale-100 md:top-8"
      >
        <Link
          href={"/#hero"}
          className="inline-block text-white transition-[color,filter] duration-500 hover:text-[#ff5d2f] hover:drop-shadow-[0_0_10px_rgba(255,93,47,0.5)]"
          onClick={() => setMenuOpen(false)}
          aria-label="Logo"
        >
          <SSSignature className="h-11 w-auto sm:h-14" aria-hidden />
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeIn" }}
      >
        <Button className="fixed right-[calc(3%+24px+1.25rem)] top-[14px] z-[1000] select-none p-0 text-[10px] sm:text-xs md:top-[25px]">
          <a
            href={resumeLink}
            target="_blank"
            aria-label="View resume"
            className="flex items-center justify-center gap-1.5 px-2.5 py-2"
          >
            <ScrollText className="pointer-events-none w-[15px]" />
            <span className="hidden min-[390px]:inline">View Resume</span>
            <span className="min-[390px]:hidden">CV</span>
          </a>
        </Button>
      </motion.div>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        aria-label="Signal Archive"
        data-mascot-obstacle="hard"
        className="border-white/20 bg-black/60 fixed inset-x-[3%] top-[58px] z-[999] flex select-none items-stretch overflow-x-auto border shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-md md:top-[72px] lg:left-1/2 lg:right-auto lg:top-[22px] lg:-translate-x-1/2"
      >
        <span className="border-white/10 text-white/40 hidden items-center border-r px-3 font-data text-[7px] uppercase tracking-[0.18em] xl:flex">
          Signal archive
        </span>
        {archiveLinks.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className="border-white/10 hover:bg-primary/10 group flex min-w-max flex-1 items-center justify-center gap-1.5 border-r p-2 font-data uppercase transition-colors last:border-r-0 hover:text-primary sm:gap-2 sm:px-3 lg:flex-none lg:px-4"
          >
            <span className="hidden text-[7px] tracking-[0.12em] text-primary sm:inline">
              {item.index}
            </span>
            <span className="text-white/70 text-[8px] tracking-[0.08em] transition-colors group-hover:text-primary sm:hidden">
              {item.compact}
            </span>
            <span className="text-white/70 hidden text-[9px] tracking-[0.1em] transition-colors group-hover:text-primary sm:inline">
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
                      href={navSection.href}
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
