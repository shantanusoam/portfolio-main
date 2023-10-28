import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const Slide = ({
  children,
  isActive,
  direction = 1,
  xdistance = 0,
  ydistance = 0,
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          exit={{
            opacity: 0,
            x: direction * -(xdistance * -1),
            y: direction * -(ydistance * -1),
          }}
          initial={{
            opacity: 0,
            x: direction * xdistance,
            y: direction * ydistance,
          }}
          animate={{ opacity: 1, x: 0, y: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Slide;
