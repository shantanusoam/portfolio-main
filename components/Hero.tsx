"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import TextCarousel from "./ui/TextCarousel";
import { useRef } from "react";

interface HeroProps {
  masked: boolean;
}

export default function Hero({masked}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const path = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  } as any);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <motion.section
      id="hero"
      style={{ opacity }}
      ref={sectionRef}
      className="h-[100vh] max-h-[1080px] mx-[10%] sm:mx-[15%] flex flex-row items-center justify-center"
    >
      <div className='line'>
              <div  className='box'></div>
              <svg>
                <path ref={path}></path>
              </svg>
            </div>
      <div className="flex items-center justify-center z-[996]">
      {masked ? <TextCarousel
          greetings={["Hello", "नमस्ते", "你好", "Hola", "Bonjour","こんにちは"]}
        /> : <TextCarousel
        greetings={["Hello", "नमस्ते", "你好", "Hola", "Bonjour","こんにちは"]}
      />}
        
     
      </div>
    </motion.section>
  );
}
