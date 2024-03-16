"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React, { forwardRef, useRef, useState } from "react";
import MenuToggle from "./ui/MenuToggle";
import Socials from "./ui/Socials";
import { Button } from "./ui/Buttons";
import { ScrollText } from "lucide-react";
import resume_link from "@/constants/resume";

import AboutmePic from "@/public/AboutMePic.jpg";
import HoverImageLink from "./HoverImageLink";
const navSections = [
  {
    title: "About",
    subHeading: `Something Not To be Told`,
    image: AboutmePic,
  },
  {
    title: "Experience",
    subHeading: `companies i worked for`,
    image: AboutmePic,
  },
  {
    title: "Projects",
    subHeading: `Things i give my commitment to`,
    image: AboutmePic,
  },
  {
    title: "Skills",
    subHeading: `You Don't see what's real`,
    image: AboutmePic,
  },
  {
    title: "Hobbies",
    subHeading: `loves to do`,
    image: AboutmePic,
  },
  {
    title: "Contact",
    subHeading: `Common I am here to help`,
    image: AboutmePic,
  },
];
const Navbar = forwardRef<React.RefObject<never[]>, {}>((props, ref) => {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="fixed left-[3%] top-8 z-[1001] scale-90 select-none text-xs sm:scale-100 md:top-12">
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
            href={resume_link}
            target="_blank"
            aria-label="View resume"
            className="flex items-center justify-center gap-2 p-2"
          >
            <ScrollText className="pointer-events-none w-[18px]" />
            View Resume
          </a>
        </Button>
      </motion.div>
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
                      arrowref={ref}
                      heading={navSection.title}
                      subheading={navSection.subHeading}
                      imgSrc={navSection.image}
                      href={`#${navSection.title.toLowerCase()}`}
                      onClick={() => setMenuOpen(false)}
                    />
                  </motion.li>
                ))}
              </motion.ul>
              <Socials
                ref={{
                  ref2: ref,
                }}
                direction="horizontal"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

Navbar.displayName = "Navbar";
export default Navbar;
