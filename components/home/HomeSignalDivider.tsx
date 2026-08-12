"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import slantingLines from "@/public/slanting_lines.svg";

export default function HomeSignalDivider() {
  const { scrollYProgress } = useScroll();
  const easedProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 25,
    restDelta: 0.001,
  });
  const x = useTransform(easedProgress, [0, 1], ["50%", "-50%"]);

  return (
    <div className="overflow-x-hidden md:overflow-x-visible" aria-hidden="true">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ x }}
        className="mt-12 w-[200%] select-none"
      >
        <Image
          src={slantingLines}
          alt=""
          className="h-[130px] w-full -rotate-6 object-cover sm:h-[170px]"
        />
      </motion.div>
    </div>
  );
}
