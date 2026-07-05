import React from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeadingProps extends HTMLMotionProps<"h2"> {
  children: string;
  className?: string;
}

export default function Heading({
  children,
  className,
  ...props
}: HeadingProps): JSX.Element {
  return (
    <motion.h2
      {...props}
      variants={{
        hidden: {
          opacity: 0,
        },
        show: {
          opacity: 1,
          transition: {
            duration: 0.4,
          },
        },
      }}
      initial={"hidden"}
      whileInView={"show"}
      viewport={{ once: false }}
      className={cn(
        "flex items-center gap-2 text-[10px] md:text-xs text-gray uppercase underline underline-offset-4",
        className
      )}
    >
      {/* A small accent tick — the same "checkpoint" mark repeated at the
          top of every section, tying Trail Map's language to the whole site. */}
      <span className="inline-block h-[3px] w-[3px] rounded-full bg-primary" aria-hidden="true" />
      {children}
    </motion.h2>
  );
}
