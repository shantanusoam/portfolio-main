import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import styles from "./style.module.scss";
import {
  motion,
  useMotionValue,
  useSpring,
  animate,
  transform,
} from "framer-motion";

export default function StickyCursor({ stickyElement }) {
  console.log(stickyElement);
  const [isHovered, setIsHovered] = useState(false);
  const cursor = useRef(null);
  const cursorSize = isHovered ? 60 : 30;

  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };

  const scale = {
    x: useMotionValue(1),
    y: useMotionValue(1),
  };

  // Smooth out the mouse values
  const smoothOptions = { damping: 40, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouse.x, smoothOptions),
    y: useSpring(mouse.y, smoothOptions),
  };

  const rotate = (distance) => {
    const angle = Math.atan2(distance.y, distance.x);
    animate(cursor.current, { rotate: `${angle}rad` }, { duration: 0 });
  };

  const manageMouseMove = useCallback((e) => {
    const { clientX, clientY } = e;

    if (Array.isArray(stickyElement.current)) {
      stickyElement.current.some((ref) => {
        if (ref) {
          const { left, top, height, width } = ref.getBoundingClientRect();
          const center = { x: left + width / 2, y: top + height / 2 };

          if (
            clientX >= left &&
            clientX <= left + width &&
            clientY >= top &&
            clientY <= top + height
          ) {
            setIsHovered(true);

            const distance = { x: clientX - center.x, y: clientY - center.y };

            rotate(distance);

            const absDistance = Math.max(
              Math.abs(distance.x),
              Math.abs(distance.y)
            );
            const newScaleX = transform(absDistance, [0, height / 2], [1, 1.3]);
            const newScaleY = transform(absDistance, [0, width / 2], [1, 0.8]);
            scale.x.set(newScaleX);
            scale.y.set(newScaleY);

            mouse.x.set(center.x - cursorSize / 2 + distance.x * 0.1);
            mouse.y.set(center.y - cursorSize / 2 + distance.y * 0.1);

            return true; // Break the loop if a match is found
          }
        }

        return false;
      });
    }

    if (!isHovered) {
      mouse.x.set(clientX - cursorSize / 2);
      mouse.y.set(clientY - cursorSize / 2);
    }
  }, []);

  const manageMouseOver = () => {
    setIsHovered(true);
  };

  const manageMouseLeave = () => {
    setIsHovered(false);
    animate(
      cursor.current,
      { scaleX: 1, scaleY: 1 },
      { duration: 0.1 },
      { type: "spring" }
    );
  };

  useLayoutEffect(() => {
    if (Array.isArray(stickyElement.current)) {
      stickyElement.current.forEach((ref) => {
        if (ref) {
          ref.addEventListener("mouseenter", manageMouseOver);
          ref.addEventListener("mouseleave", manageMouseLeave);
        }
      });
    }

    window.addEventListener("mousemove", manageMouseMove);

    return () => {
      if (Array.isArray(stickyElement.current)) {
        stickyElement.current.forEach((ref) => {
          if (ref) {
            ref.removeEventListener("mouseenter", manageMouseOver);
            ref.removeEventListener("mouseleave", manageMouseLeave);
          }
        });
      }

      window.removeEventListener("mousemove", manageMouseMove);
    };
  }, [isHovered, manageMouseMove, stickyElement]);

  const template = ({ rotate, scaleX, scaleY }) => {
    return `rotate(${rotate}) scaleX(${scaleX}) scaleY(${scaleY})`;
  };

  return (
    <div className={styles.cursorContainer}>
      <motion.div
        transformTemplate={template}
        style={{
          left: smoothMouse.x,
          top: smoothMouse.y,
          scaleX: scale.x,
          scaleY: scale.y,
        }}
        animate={{
          width: cursorSize,
          height: cursorSize,
        }}
        className={styles.cursor}
        ref={cursor}
      ></motion.div>
    </div>
  );
}
