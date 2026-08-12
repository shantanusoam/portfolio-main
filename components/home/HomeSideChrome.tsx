"use client";

import { useEffect } from "react";
import { useAnimate, useScroll, useVelocity } from "framer-motion";
import Socials from "@/components/ui/Socials";
import ScrollDown from "@/components/ui/ScrollDown";

export default function HomeSideChrome() {
  const [socialsRef, animateSocials] = useAnimate();
  const [scrollDownRef, animateScrollDown] = useAnimate();
  const { scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollYProgress);

  useEffect(() => {
    return scrollVelocity.on("change", (velocity) => {
      const socials = socialsRef.current;
      const scrollCue = scrollDownRef.current;
      if (
        !socials ||
        !scrollCue ||
        window.getComputedStyle(socials).display === "none"
      )
        return;

      const opacity = velocity > 0 ? 0 : 1;
      animateSocials(
        socials,
        { opacity },
        { duration: 0.1, ease: "easeInOut" },
      );
      animateScrollDown(
        scrollCue,
        { opacity },
        { duration: 0.1, ease: "easeInOut" },
      );
    });
  }, [
    animateScrollDown,
    animateSocials,
    scrollDownRef,
    scrollVelocity,
    socialsRef,
  ]);

  return (
    <>
      <Socials containerRef={socialsRef} />
      <ScrollDown ref={scrollDownRef} />
    </>
  );
}
