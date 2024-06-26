"use client";

import Experience from "@/components/Experience";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import MakeAndBreak from "@/components/MakeAndBreak";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimate,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import Socials from "@/components/ui/Socials";
import ScrollDown from "@/components/ui/ScrollDown";
import Hobbies from "@/components/Hobbies";
import Lenis from "@studio-freight/lenis";
import Navbar from "@/components/Navbar";
import Contact from "@/components/Contact";
import Image from "next/image";
import slanting_lines from "@/public/slanting_lines.svg";
import Footer from "@/components/Footer";
import { MousePosition } from "@uidotdev/usehooks";
import { useMousePosition } from "@/hooks/useMousePosition";
import StickyCursor from "@/components/ui/stickyCursor/StickyCursor";

function MaskedCopy() {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y } = useMousePosition();

  const size = isHovered ? 400 : 40;
  return (
    <motion.div
      className="Pointermask absolute inset-0  z-10"
      animate={{
        WebkitMaskPosition: `${x - size / 2}px ${y - size / 2}px`,

        WebkitMaskSize: `${size}px`,
      }}
      transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
    >
      <div className="container">
        <Hero masked={true} />
        <MakeAndBreak />
        <Intro />
        <Experience />
        <Projects />
        <Skills />
        <Hobbies />
      </div>
    </motion.div>
  );
}
export default function Home() {
  const [socialsRef, animateSocials] = useAnimate();
  const [scrollDownRef, animateScrollDown] = useAnimate();
  const { scrollYProgress } = useScroll();
  const xVelocity = useVelocity(scrollYProgress);
  const xTransform = useTransform(
    useSpring(scrollYProgress, {
      stiffness: 100,
      damping: 25,
      restDelta: 0.001,
    }),
    [0, 1],
    ["50%", "-50%"]
  );
  const stickyElement = useRef([]);
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  useEffect(() => {
    return xVelocity.on("change", (latestVelocity) => {
      if (window.getComputedStyle(socialsRef.current).display != "none") {
        if (latestVelocity > 0 && socialsRef.current.style.opacity != 0) {
          animateSocials(
            socialsRef.current,
            { opacity: 0 },
            { duration: 0.1, ease: "easeInOut" }
          );
          animateScrollDown(
            scrollDownRef.current,
            { opacity: 0 },
            { duration: 0.1, ease: "easeInOut" }
          );
        }

        if (latestVelocity < 0 && socialsRef.current.style.opacity != 1) {
          animateSocials(
            socialsRef.current,
            { opacity: 1 },
            { duration: 0.1, ease: "easeInOut" }
          );
          animateScrollDown(
            scrollDownRef.current,
            { opacity: 1 },
            { duration: 0.1, ease: "easeInOut" }
          );
        }
      }
    });
  }, []);

  return (
    <>
      <div className="relative">
        <StickyCursor stickyElement={stickyElement} />
        {/* <MaskedCopy /> */}
        <Navbar ref={stickyElement} />
        <Socials
          ref={{
            ref1: socialsRef,
            ref2: stickyElement,
          }}
        />
        <main className="text-clip">
          <div className="container">
            <Hero />
            <MakeAndBreak />
            <Intro />
            <Experience />
            <Projects stickyElement={stickyElement} />
            <Skills />
            <Hobbies />
          </div>
          <div className="overflow-x-hidden md:overflow-x-visible">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  duration: 0.6,
                  delay: 0.4,
                  ease: "easeInOut",
                },
              }}
              viewport={{ once: true }}
              style={{ x: xTransform }}
              className="mt-12 w-[200%] select-none "
            >
              <Image
                src={slanting_lines}
                alt="Slanting lines"
                className="h-[130px] w-full -rotate-6 object-cover sm:h-[170px]"
              />
            </motion.div>
          </div>

          <div className="container">
            <Contact />
            <Footer />
          </div>
        </main>
        <ScrollDown ref={scrollDownRef} />
      </div>
    </>
  );
}
