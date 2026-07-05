"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, easeIn } from "framer-motion";
import { MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Magnetic from "@/components/ui/magnetic/Magnetic";
import { MissionType } from "@/@types/mission.type";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";

interface MissionCardProps {
  mission: MissionType;
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
}

// Same hover-flip mechanic as the original inline Projects.tsx card — reused,
// not reinvented — extended with Class/Special Moves/Impact fighter-profile
// framing and a placeholder state for missions with no real content yet.
const cardVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, delay: 0.4 } },
};

const child = {
  variantA: { bottom: 150, right: 0, rotate: 0 },
  variantB: { top: 120, left: -20, rotate: -2 },
};
const child2 = {
  variantA: { bottom: 0, right: 0, rotate: 0 },
  variantB: { top: 20, left: 20, rotate: 0 },
};

export default function MissionCard({ mission, stickyElement }: MissionCardProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  // See EntranceWipe.tsx for why this two-step (mounted, then check the
  // preference) gate matters: usePrefersReducedMotion defaults to `true`
  // during SSR but resolves synchronously on the client's first render,
  // so gating a structural (mount/unmount) decision on it directly makes
  // the client's first paint disagree with the server-rendered HTML and
  // fails hydration for the whole page, not just this card.
  const mounted = useMounted();
  const [isLaunching, setIsLaunching] = useState(false);

  // A fast (~180ms) impact-stamp beat on click before the route change —
  // real click feedback instead of an ordinary link transition. Skipped
  // entirely under reduced motion, which just navigates immediately.
  function handleLaunch(e: React.MouseEvent) {
    if (prefersReducedMotion) return;
    e.preventDefault();
    setIsLaunching(true);
    setTimeout(() => router.push(mission.url), 180);
  }

  return (
    <div className="overflow-hidden pb-[9px] pl-2">
      <motion.div
        whileHover="variantB"
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className={cn(
          "relative flex h-[170px] w-[240px] flex-col md:h-[200px] md:w-[268px]"
        )}
      >
        {(!mounted || !prefersReducedMotion) && (
          // Holo-card shimmer: one soft diagonal light sweep the first time
          // the card scrolls into view, like light catching a foil trading
          // card — reinforces the "fighter profile" collectible framing.
          <motion.div
            initial={{ x: "-150%" }}
            whileInView={{ x: "150%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: "easeInOut", delay: 0.5 }}
            className="pointer-events-none absolute inset-0 z-20 -skew-x-[20deg]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            }}
          />
        )}
        <AnimatePresence>
          {isLaunching && (
            <motion.div
              initial={{ opacity: 0, scale: 1.4, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/70"
            >
              <p className="font-display text-3xl tracking-wide text-primary md:text-4xl">
                MISSION START
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="gradientborder group z-20 h-full w-full border bg-black p-5 text-graytransparent sm:p-6 md:p-8">
          <div className="flex h-full flex-col items-start justify-center font-medium leading-7 tracking-wider">
            <motion.div
              variants={child2}
              className="absolute flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <p className="font-display text-lg tracking-wide text-white md:text-xl">
                  {mission.title}
                </p>
                {mission.isPlaceholder && (
                  <span className="rounded-sm border border-primary px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                    Classified
                  </span>
                )}
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                Class: {mission.class}
              </p>
              <ul className="w-4/5 text-sm font-light text-graytransparent transition-all group-hover:w-full">
                {mission.specialMoves.slice(0, 2).map((move, i) => (
                  <li key={i}>— {move}</li>
                ))}
              </ul>
              <div className="flex flex-row gap-4 group-hover:hidden">
                {mission.metadata?.map((meta, i) => (
                  <p
                    key={i}
                    className="font-mono text-xs uppercase text-darkgray"
                  >
                    {meta}
                  </p>
                ))}
              </div>
            </motion.div>
            <motion.div
              style={{
                width: "100%",
                height: "50%",
                borderRadius: "14px 14px 18px 14px",
                backgroundColor: "#fff",
                position: "absolute",
                bottom: -100,
                right: 0,
              }}
              variants={child}
              transition={{
                type: "spring",
                damping: 10,
                mass: 0.2,
                stiffness: 150,
                duration: 1.2,
                easeIn,
              }}
            >
              {mission.cover_image !== null ? (
                <Image
                  src={mission.cover_image}
                  alt={`${mission.description}`}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800 to-black">
                  <p className="px-2 text-center font-mono text-[10px] uppercase tracking-widest text-darkgray">
                    No public screenshot
                  </p>
                </div>
              )}
            </motion.div>
            <div className="absolute bottom-0 right-0 p-4">
              {mission.isPlaceholder ? (
                <span className="font-mono text-xs uppercase tracking-widest text-darkgray">
                  Locked
                </span>
              ) : (
                <Link
                  href={mission.url}
                  aria-label="Link to view the mission"
                  onClick={handleLaunch}
                  className="active:scale-90 transition-transform duration-150"
                >
                  <Magnetic>
                    <MoveRight className="w-5 text-gray transition-all duration-300 ease-in-out hover:text-primary" />
                    {stickyElement && (
                      <div
                        ref={(el) => stickyElement.current.push(el)}
                        className="bounds"
                      ></div>
                    )}
                  </Magnetic>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="gradientborder absolute left-[-2%] top-[3%] z-10 h-full w-full border bg-black"></div>
      </motion.div>
    </div>
  );
}
