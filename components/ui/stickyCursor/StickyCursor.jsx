import React, {
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
  const [isHovered, setIsHovered] = useState(false);
  const [cursorSize, setCursorSize] = useState(20);
  const cursor = useRef(null);
  const hoveredRef = useRef(false);
  const lastRectCheck = useRef(0);
  const cachedRects = useRef([]);
  const sizeRef = useRef(20);

  const displaySize = isHovered ? 60 : cursorSize;

  const mouse = {
    x: useMotionValue(-100),
    y: useMotionValue(-100),
  };

  const scale = {
    x: useMotionValue(1),
    y: useMotionValue(1),
  };

  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouse.x, smoothOptions),
    y: useSpring(mouse.y, smoothOptions),
  };

  const rotate = (distance) => {
    const angle = Math.atan2(distance.y, distance.x);
    animate(cursor.current, { rotate: `${angle}rad` }, { duration: 0 });
  };

  const refreshRects = useCallback(() => {
    if (!Array.isArray(stickyElement.current)) {
      cachedRects.current = [];
      return;
    }
    cachedRects.current = stickyElement.current
      .filter(Boolean)
      .map((ref) => {
        const { left, top, height, width } = ref.getBoundingClientRect();
        return {
          left,
          top,
          height,
          width,
          centerX: left + width / 2,
          centerY: top + height / 2,
        };
      });
  }, [stickyElement]);

  const manageMouseMove = useCallback(
    (e) => {
      const { clientX, clientY } = e;
      const now = performance.now();

      // Reason: elementFromPoint + getBoundingClientRect every mousemove
      // layout-thrashed during scroll. Cache rects ~every 100ms.
      if (now - lastRectCheck.current > 100) {
        lastRectCheck.current = now;
        refreshRects();

        const element = document.elementFromPoint(clientX, clientY);
        const nextSize =
          typeof element?.className === "string" &&
          element.className.includes("mouse-modal")
            ? 600
            : 20;
        if (nextSize !== sizeRef.current) {
          sizeRef.current = nextSize;
          setCursorSize(nextSize);
        }
      }

      let isHoveredTemp = false;

      for (const rect of cachedRects.current) {
        if (
          clientX >= rect.left &&
          clientX <= rect.left + rect.width &&
          clientY >= rect.top &&
          clientY <= rect.top + rect.height
        ) {
          isHoveredTemp = true;

          const distance = {
            x: clientX - rect.centerX,
            y: clientY - rect.centerY,
          };

          rotate(distance);

          const absDistance = Math.max(
            Math.abs(distance.x),
            Math.abs(distance.y)
          );

          scale.x.set(transform(absDistance, [0, rect.height / 2], [1, 1.3]));
          scale.y.set(transform(absDistance, [0, rect.width / 2], [1, 0.8]));

          mouse.x.set(rect.centerX + distance.x * 0.1);
          mouse.y.set(rect.centerY + distance.y * 0.1);
          break;
        }
      }

      if (isHoveredTemp !== hoveredRef.current) {
        hoveredRef.current = isHoveredTemp;
        setIsHovered(isHoveredTemp);
      }

      if (!isHoveredTemp) {
        mouse.x.set(clientX);
        mouse.y.set(clientY);
      }
    },
    [refreshRects]
  );

  const manageMouseOver = () => {
    hoveredRef.current = true;
    setIsHovered(true);
  };

  const manageMouseLeave = () => {
    hoveredRef.current = false;
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

    window.addEventListener("mousemove", manageMouseMove, { passive: true });
    window.addEventListener("scroll", refreshRects, { passive: true });

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
      window.removeEventListener("scroll", refreshRects);
    };
  }, [manageMouseMove, refreshRects, stickyElement]);

  const template = ({ rotate, scaleX, scaleY }) => {
    return `rotate(${rotate}) scaleX(${scaleX}) scaleY(${scaleY})`;
  };

  return (
    <div className={styles.cursorContainer}>
      <motion.div
        transformTemplate={template}
        style={{
          // Reason: left/top invalidate layout every frame; x/y stay on the compositor.
          x: smoothMouse.x,
          y: smoothMouse.y,
          scaleX: scale.x,
          scaleY: scale.y,
          width: displaySize,
          height: displaySize,
          marginLeft: -displaySize / 2,
          marginTop: -displaySize / 2,
        }}
        className={styles.cursor}
        ref={cursor}
      />
    </div>
  );
}
