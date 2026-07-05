import { RefObject } from 'react';
import { MotionValue, useScroll, useTransform } from 'framer-motion';

/**
 * Fades a section's opacity to 0 as the user scrolls past its end.
 * Extracted from the identical `useScroll({offset:["end end","end start"]})` +
 * `useTransform(...,[1,0])` pair duplicated across Experience/Projects/Skills/
 * Hobbies/MakeAndBreak/Intro/Hero — only the input range varied between them.
 */
export function useSectionExitFade(
  sectionRef: RefObject<HTMLElement | null>,
  range: [number, number] = [0.4, 0.8]
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['end end', 'end start'],
  } as any);
  return useTransform(scrollYProgress, range, [1, 0]);
}

export default useSectionExitFade;
