"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { TransitionStyle } from "./EnhancedPageTransition";

interface PageTransitionWrapperProps {
  children: ReactNode;
  transitionStyle?: TransitionStyle;
  backgroundColor?: string;
}

const PageTransitionWrapper = ({
  children,
  transitionStyle = "slide",
  backgroundColor = "#000",
}: PageTransitionWrapperProps) => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Ensure we only run animations on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Slide transition variants
  const slideVariants = {
    initial: { y: "-100%", opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  // Perspective transition variants
  const perspectiveVariants = {
    initial: { scale: 0.8, y: 100, opacity: 0 },
    animate: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
    },
    exit: {
      scale: 0.8,
      y: -100,
      opacity: 0,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  // Curve transition variants
  const curveVariants = {
    initial: { clipPath: "circle(0% at 50% 50%)" },
    animate: {
      clipPath: "circle(100% at 50% 50%)",
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      clipPath: "circle(0% at 50% 50%)",
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
    },
  };

  // Generate columns for stairs effect
  const generateStairColumns = () => {
    const columns = [];
    const count = 10; // Number of columns

    for (let i = 0; i < count; i++) {
      columns.push(
        <motion.div
          key={i}
          className="h-full"
          initial={{ y: "-100%" }}
          animate={{
            y: 0,
            transition: {
              duration: 0.5,
              delay: i * 0.05, // Staggered delay for each column
              ease: [0.43, 0.13, 0.23, 0.96],
            },
          }}
          exit={{
            y: "100%",
            transition: {
              duration: 0.5,
              delay: (count - i - 1) * 0.05, // Reverse staggered delay for exit
              ease: [0.43, 0.13, 0.23, 0.96],
            },
          }}
          style={{
            width: `${100 / count}%`,
            backgroundColor,
          }}
        />
      );
    }

    return columns;
  };

  // Get the appropriate variants based on the selected transition style
  const getVariants = () => {
    switch (transitionStyle) {
      case "perspective":
        return perspectiveVariants;
      case "curve":
        return curveVariants;
      case "slide":
      default:
        return slideVariants;
    }
  };

  if (!isClient) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={transitionStyle !== "stairs" ? getVariants() : undefined}
        className="w-full"
      >
        {/* Special case for stairs transition */}
        {transitionStyle === "stairs" && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-row items-stretch pointer-events-none"
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {generateStairColumns()}
          </motion.div>
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransitionWrapper;