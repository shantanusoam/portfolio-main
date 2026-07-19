import { RefObject } from 'react';
import { MotionValue, useMotionValue, useScroll, useTransform } from 'framer-motion';
import usePrefersReducedMotion from '@/hooks/usePreferedRedcedMotion';

/**
 * Fades a section's opacity to 0 as the user scrolls past its end.
 * Extracted from the identical `useScroll({offset:["end end","end start"]})` +
 * `useTransform(...,[1,0])` pair duplicated across Experience/Projects/Skills/
 * Hobbies/MakeAndBreak/Intro/Hero — only the input range varied between them.
 *
 * Under reduced motion, returns a constant 1 so nine large sections are not
 * all subscribed to scroll-driven opacity (each forces a big paint layer).
 */
export function useSectionExitFade(
  sectionRef: RefObject<HTMLElement | null>,
  range: [number, number] = [0.4, 0.8]
): MotionValue<number> {
  const prefersReducedMotion = usePrefersReducedMotion();
  const staticOpacity = useMotionValue(1);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['end end', 'end start'],
  } as any);
  const faded = useTransform(scrollYProgress, range, [1, 0]);
  return prefersReducedMotion ? staticOpacity : faded;
}

export default useSectionExitFade;
