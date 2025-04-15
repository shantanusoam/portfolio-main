"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface PageTransitionProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const PageTransition = ({
  href,
  children,
  className = "",
  ariaLabel = "Link with page transition",
}: PageTransitionProps) => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Variants for the overlay animation
  const overlayVariants = {
    initial: { y: "-100%", opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
    },
    exit: { 
      y: "100%", 
      opacity: 0,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    
    // Delay navigation to allow for animation
    setTimeout(() => {
      router.push(href);
    }, 600); // Slightly longer than animation duration to ensure smooth transition
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
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={overlayVariants}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { delay: 0.2, duration: 0.3 }
              }}
              className="text-white text-2xl font-bold"
            >
              Loading...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PageTransition;