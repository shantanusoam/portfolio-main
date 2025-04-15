"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export type TransitionStyle = "slide" | "perspective" | "stairs" | "curve";

interface EnhancedPageTransitionProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  transitionStyle?: TransitionStyle;
  backgroundColor?: string;
}

const EnhancedPageTransition = ({
  href,
  children,
  className = "",
  ariaLabel = "Link with page transition",
  transitionStyle = "slide",
  backgroundColor = "#000",
}: EnhancedPageTransitionProps) => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Basic slide transition (original)
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

  // Perspective transition (inspired by Alex Tkachev)
  const perspectiveVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  const contentPerspectiveVariants = {
    initial: { scale: 1, y: 0, opacity: 1 },
    animate: {
      scale: 0.8,
      y: -100,
      opacity: 0,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
    },
    exit: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  // Stairs transition (inspired by K72)
  const stairsVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  // Curve transition (inspired by Denis Snellenberg)
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
          style={{ width: `${100 / count}%` }}
          initial={{ y: "-100%" }}
          animate={{ 
            y: 0,
            transition: { 
              duration: 0.5, 
              delay: i * 0.05, // Staggered delay for each column
              ease: [0.43, 0.13, 0.23, 0.96] 
            } 
          }}
          exit={{ 
            y: "100%",
            transition: { 
              duration: 0.5, 
              delay: (count - i - 1) * 0.05, // Reverse staggered delay for exit
              ease: [0.43, 0.13, 0.23, 0.96] 
            } 
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);

    // Delay navigation to allow for animation
    setTimeout(() => {
      router.push(href);
    }, 700); // Slightly longer than animation duration to ensure smooth transition
  };

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </Link>

      <AnimatePresence>
        {isTransitioning && (
          <>
            {/* Slide Transition */}
            {transitionStyle === "slide" && (
              <motion.div
                className="fixed inset-0  flex items-center justify-center"
                style={{ backgroundColor }}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={slideVariants}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { delay: 0.2, duration: 0.3 },
                  }}
                  className="text-white text-2xl font-bold"
                >
                  Loading...
                </motion.div>
              </motion.div>
            )}

            {/* Perspective Transition */}
            {transitionStyle === "perspective" && (
              <>
                <motion.div
                  className="fixed inset-0 z-40"
                  style={{ backgroundColor }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={perspectiveVariants}
                />
                <motion.div
                  className="fixed inset-0 z-40 flex items-center justify-center"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={contentPerspectiveVariants}
                >
                  <div className="text-white text-2xl font-bold">
                    Loading...
                  </div>
                </motion.div>
              </>
            )}

            {/* Stairs Transition */}
            {transitionStyle === "stairs" && (
              <motion.div
                className="fixed inset-0 z-40 flex flex-row items-stretch"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={stairsVariants}
              >
                {generateStairColumns()}
              </motion.div>
            )}

            {/* Curve Transition */}
            {transitionStyle === "curve" && (
              <motion.div
                className="fixed inset-0 z-40 flex items-center justify-center"
                style={{ backgroundColor }}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={curveVariants}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { delay: 0.2, duration: 0.3 },
                  }}
                  className="text-white text-2xl font-bold"
                >
                  Loading...
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedPageTransition;