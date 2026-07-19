"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Magnetic from "@/components/ui/magnetic/Magnetic";
import { MissionType } from "@/@types/mission.type";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import useMounted from "@/hooks/useMounted";

interface MissionCardProps {
  mission: MissionType;
  index?: number;
  stickyElement?: React.MutableRefObject<(HTMLElement | null)[]>;
}

// Fighter-select profile card: cover portrait on top, loadout data below.
// The previous hover-flip (absolutely-positioned image sliding over the
// text) left the unsized cover image stuck over card titles; this layout
// keeps everything in flow so nothing can clip or overlap, and spends the
// hover budget on polish (portrait zoom, border glow, arrow nudge) instead.
export default function MissionCard({
  mission,
  index = 0,
  stickyElement,
}: MissionCardProps) {
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

  const isLocked = mission.isPlaceholder;
  const isConfidential = mission.cover_image === null;

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
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.5,
              ease: [0.25, 1, 0.5, 1],
              // Reason: column-based stagger (not row) so cards in the same
              // viewport row cascade left-to-right as they scroll in.
              delay: 0.08 * (index % 3),
            },
          },
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        className="group relative flex h-[330px] w-[260px] flex-col md:h-[356px] md:w-[288px]"
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

        <div className="gradientborder relative z-20 flex h-full w-full flex-col border bg-black transition-shadow duration-300 group-hover:shadow-[0_0_24px_rgba(255,77,28,0.12)]">
          {/* Cover portrait — fixed-height, clipped, always visible */}
          <div className="relative h-[128px] shrink-0 overflow-hidden border-b border-white/10 md:h-[140px]">
            {mission.cover_image !== null ? (
              <Image
                src={mission.cover_image}
                alt={`Screenshot of ${mission.title}`}
                fill
                sizes="(min-width: 768px) 288px, 260px"
                className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            ) : (
              // Confidential missions (real client work, no public visuals):
              // deliberate "redacted dossier" treatment instead of a broken-
              // image look — diagonal hazard stripes + a stamped label.
              <div
                className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,77,28,0.05) 10px, rgba(255,77,28,0.05) 12px)",
                }}
              >
                <p className="rotate-[-4deg] border border-primary/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-primary/90">
                  Confidential build
                </p>
              </div>
            )}
            {/* Legibility scrim so the title zone below never fights the image */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent"
            />
            {mission.metadata && mission.metadata.length > 0 && (
              <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                {mission.metadata.map((meta, i) => (
                  <span
                    key={i}
                    className="border border-white/15 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-graytransparent backdrop-blur-sm"
                  >
                    {meta}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Loadout data. Reason: title/class/footer are shrink-0 so that
              when two-line special moves overflow the fixed card height, the
              moves list (overflow-hidden) truncates — otherwise flexbox
              collapses the class line (its line-clamp overflow:hidden makes
              it the only shrinkable child) to zero height. */}
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4 md:p-5">
            <div className="flex shrink-0 items-start gap-2">
              <h3 className="line-clamp-2 font-display text-xl leading-tight tracking-wide text-white transition-colors duration-300 group-hover:text-primary-light md:text-[22px]">
                {mission.title}
              </h3>
              {isLocked && (
                <span className="mt-1 shrink-0 rounded-sm border border-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary">
                  Classified
                </span>
              )}
            </div>
            <p className="line-clamp-1 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-primary md:text-[11px]">
              {mission.class}
            </p>
            <ul className="mt-1 min-h-0 space-y-1 overflow-hidden text-[13px] font-light leading-snug text-graytransparent">
              {mission.specialMoves.slice(0, 2).map((move, i) => (
                <li key={i} className="line-clamp-2 flex gap-1.5">
                  <span aria-hidden="true" className="text-primary/60">
                    —
                  </span>
                  <span>{move}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex shrink-0 items-center justify-between border-t border-white/10 pt-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-graytransparent">
                {isConfidential ? "Case study" : "Deployed"}
              </p>
              {isLocked ? (
                <span className="font-mono text-xs uppercase tracking-widest text-graytransparent">
                  Locked
                </span>
              ) : (
                <Link
                  href={mission.url}
                  aria-label={`Open ${mission.title} mission debrief`}
                  onClick={handleLaunch}
                  className="transition-transform duration-150 active:scale-90"
                >
                  <Magnetic>
                    <MoveRight className="w-5 text-gray transition-all duration-300 ease-in-out group-hover:translate-x-1 group-hover:text-primary motion-reduce:group-hover:translate-x-0" />
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
