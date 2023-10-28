import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const Fade = ({ children, isActive }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          exit={{ opacity: 0, y: -100 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Fade;
