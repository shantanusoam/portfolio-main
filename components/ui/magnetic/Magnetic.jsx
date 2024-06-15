import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Magnetic({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  return (
    <motion.div
      style={{ position: "relative" }}
      ref={ref}
      onMouseMove={handleMouse}
      className="MagneticHead"
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 850, damping: 0.2, mass: 15 }}
    >
      {children}
    </motion.div>
  );
}
