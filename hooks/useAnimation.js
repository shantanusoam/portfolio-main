import { useState, useEffect, useRef } from 'react';

const useAnimation = ({
  startAnimation = false,
  delay = 0,
  duration = 1000,
  easing = 'ease',
  onStart = () => {},
  onComplete = () => {},
}) => {
  const [animate, setAnimate] = useState(startAnimation);
  const [animationStyle, setAnimationStyle] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (startAnimation) {
      setIsAnimating(true);
      onStart();

      const animationStart = performance.now();

      const animateFrame = (time) => {
        const elapsedTime = time - animationStart;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = easingFunctions[easing](progress);

        setAnimationStyle({
          transform: `translate3d(${easeProgress * 100}%, 0, 0)`,
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateFrame);
        } else {
          setIsAnimating(false);
          onComplete();
        }
      };

      if (delay > 0) {
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animateFrame);
        }, delay);
      } else {
        animationRef.current = requestAnimationFrame(animateFrame);
      }
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startAnimation]);

  return {
    animate,
    animationStyle,
    isAnimating,
    setAnimate,
  };
};

const easingFunctions = {
  linear: (progress) => progress,
  ease: (progress) => 0.5 - 0.5 * Math.cos(progress * Math.PI),
  easeIn: (progress) => progress * progress,
  easeOut: (progress) => 1 - (1 - progress) * (1 - progress),
  easeInOut: (progress) =>
    progress < 0.5
      ? 2 * progress * progress
      : 1 - 2 * (1 - progress) * (1 - progress),
};

export default useAnimation;
