"use client";

import { motion } from "framer-motion";
import TextCarousel from "./ui/TextCarousel";
import { useRef } from "react";
import String from "./IntrectiveComponents/String";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";

interface HeroProps {
  masked: boolean;
}

export default function Hero({ masked }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  // Reason: shared hook skips scroll-opacity under reduced motion; avoids a
  // second useScroll subscription pattern that differed from other sections.
  const opacity = useSectionExitFade(sectionRef, [0, 0.4]);

  return (
    <div>
      <motion.section
        id="hero"
        style={{ opacity }}
        ref={sectionRef}
        className="mx-[10%] flex h-[100vh] max-h-[1080px] flex-row items-center justify-center sm:mx-[15%]"
      >
        <div className="absolute z-[997] mt-4 hidden h-24 w-full  flex-col items-center  justify-center md:flex">
          <div className="my-6 w-[60vw]">
            <String volume={0.1} playbackRate={2} />
          </div>
          <div className="my-6  w-[71vw]">
            <String volume={0.1} playbackRate={1} />
          </div>
          <div className="my-6  w-[60vw]">
            <String volume={0.1} playbackRate={2} />
          </div>
        </div>

        {/* <div className="relative">
    <div className=" absolute"> </div>
  </div> */}

        <div className="z-[996] flex items-center justify-center">
          {masked ? (
            <TextCarousel
              greetings={[
                "Hello",
                "नमस्ते",
                "你好",
                "Hola",
                "Bonjour",
                "こんにちは",
              ]}
            />
          ) : (
            <TextCarousel
              greetings={[
                "Hello",
                "नमस्ते",
                "你好",
                "Hola",
                "Bonjour",
                "こんにちは",
              ]}
            />
          )}
        </div>
      </motion.section>
    </div>
  );
}
