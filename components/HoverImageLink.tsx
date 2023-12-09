import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import React, { forwardRef, useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import Magnetic from "./ui/magnetic/Magnetic";



type LinkProps = {
  heading: string;
  imgSrc: string;
  subheading: string;
  href: string;
  onClick: () => void;
  arrowref: React.RefObject<never[]>; // Correct type for arrowref
};

const HoverImageLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ heading, imgSrc, subheading, href, onClick, arrowref }) => {
  const ref = useRef<HTMLAnchorElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
  const left = useTransform(mouseXSpring, [0.5, -0.5], ["60%", "70%"]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    const rect = ref.current!.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  return (
  
      <motion.a
      href={href}
      ref={ref}
      
      onClick={onClick}
      onMouseMove={handleMouseMove}
      initial="initial"
      whileHover="whileHover"
      className="group relative flex w-[90vw] items-center  justify-between border-b-2 border-neutral-700 py-1 transition-colors duration-500 hover:border-neutral-50 md:w-[60vw] md:py-4 xl:w-[45vw]"
    >
      <div>
        <motion.span
          variants={{
            initial: { x: 0 },
            whileHover: { x: -16 },
          }}
          transition={{
            type: "spring",
            staggerChildren: 0.075,
            delayChildren: 0.25,
          }}
          className="relative z-10 block text-2xl font-bold text-neutral-500 transition-colors duration-500 group-hover:text-neutral-50 md:text-4xl"
        >
          {heading.split("").map((l, i) => (
            <motion.span
              variants={{
                initial: { x: 0 },
                whileHover: { x: 16 },
              }}
              transition={{ type: "spring" }}
              className="inline-block"
              key={i}
            >
              {l}
            </motion.span>
          ))}
        </motion.span>
        <span className="relative z-10 mt-2 block text-base text-neutral-500 transition-colors duration-500 group-hover:text-neutral-50">
          {subheading}
        </span>
      </div>

      <motion.div
        style={{  
          top,
          left,
          translateX: "-50%",
          translateY: "-50%",
        }}
        variants={{
          initial: { scale: 0, rotate: "-12.5deg" },
          whileHover: { scale: 1, rotate: "12.5deg" },
        }}
        transition={{ type: "spring" }}
    
        className="absolute z-0 h-24 w-32 rounded-lg object-cover md:h-48 md:w-64"
      
      >
        <Image
        src={imgSrc}
                alt={`${subheading}`}
             
              className="absolute z-0 h-24  w-32  -rotate-6  rounded-lg object-cover sm:h-[170px] md:h-48 md:w-64"
            />
</motion.div>
<Magnetic>
      <motion.div
        variants={{
          initial: {
            x: "25%",
            opacity: 0,
          },
          whileHover: {
            x: "0%",
            opacity: 1,
          },
        }}
        ref={(el) => (arrowref.current.push(el))}
        transition={{ type: "spring" }}
        className="relative z-10 p-4"
      >
           <FiArrowRight  className="text-5xl text-neutral-50" />
     
      </motion.div>
      </Magnetic>
    </motion.a>
   
    
  );
});

HoverImageLink.displayName = 'HoverImageLink';
export default HoverImageLink;
