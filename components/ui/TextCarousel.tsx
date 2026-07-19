"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextCarouselProps extends HTMLMotionProps<"h1"> {
  greetings: string[];
}

export default function TextCarousel({
  greetings,
  className,
  ...props
}: TextCarouselProps) {
  return (
    <>
      {greetings.map((greeting, i) => (
        <motion.h1
          {...props}
          key={i}
          initial={true}
          // Reason: animated blur on 6 looping headlines forced expensive
          // filter paints every frame across the whole Hero — opacity/scale/y only.
          animate={{
            scale: [0.6, 1, 1, 0.6],
            opacity: [0, 1, 1, 0],
            y: ["70%", "0%", "0%", "-70%"],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 1.8,
            repeatDelay: 8.2,
            times: [0, 0.2, 0.6, 0.8, 1],
          }}
          className={cn(
            "absolute text-[5rem] md:text-[7rem] text-clip whitespace-nowrap font-black select-none text-center z-[1] tracking-tight opacity-0",
            className
          )}
        >
          {greeting}
        </motion.h1>
      ))}
    </>
  );
}
