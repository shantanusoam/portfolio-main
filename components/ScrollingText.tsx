import React from "react";
import { motion } from "framer-motion";

const ScrollingText = ({ children }) => {
  const scrollVariants = {
    animate: {
      y: [-100, 200], // Adjust these values based on your text height and container
      transition: {
        y: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 8, // Adjust the duration to control the speed
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className="relative h-32 overflow-hidden  rounded-full">
      {/* Adjust height as needed */}
      <motion.div
        className="absolute bottom-0 h-96 w-96 text-clip rounded-full text-center text-lg font-bold"
        variants={scrollVariants}
        animate="animate"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ScrollingText;
