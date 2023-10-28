import React,{useMemo} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const Zoom = ({ children, isActive, ExternalStyles }) => {
  const tooltip = useMemo(
    () => (
      <motion.div
        className={ExternalStyles.className}
        style={{
          ...ExternalStyles.inlineStyles,
        }}
        exit={{
          opacity: 0,
          scale: 0,
        }}
        initial={{
          opacity: 0,
          scale: 0.4,
        }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {children}
      </motion.div>
    ),
    [ExternalStyles.className, ExternalStyles.inlineStyles, children]
  );

  return <AnimatePresence className="absolute z-30">{isActive && tooltip}</AnimatePresence>;
};

export default Zoom;
