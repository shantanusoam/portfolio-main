"use client";

import { useRef, useState } from "react";
import Heading from "./ui/Heading";
import { motion, useScroll } from "framer-motion";
import { RevealingTextContainer, RevealingTextItem } from "./ui/RevealingText";
import Image from "next/image";
import { useParallax } from "@/lib/utils";
import { categoryLabels, fieldNotesByCategory } from "@/constants/fieldNotes";
import { FieldNote, FieldNoteCategory } from "@/@types/fieldNote.type";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";

const hideAndShowVariant = {
  hide: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } },
};

const hideAndShowAndScaleVariant = {
  hide: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeInOut" } },
};

// A small, scoped-to-one-card easter egg: reward the person who actually
// reads captions — the "Cats" note already jokes about itself, so hovering
// it spawns a tiny paw-print trail instead of doing nothing.
function usePawTrail(enabled: boolean) {
  const [paws, setPaws] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastSpawn = useRef(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastSpawn.current < 180) return;
    lastSpawn.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    setPaws((prev) => [
      ...prev.slice(-4),
      { id: now, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
  }

  const trail = enabled
    ? paws.map((paw) => (
        <motion.span
          key={paw.id}
          initial={{ opacity: 0.8, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          onAnimationComplete={() =>
            setPaws((prev) => prev.filter((p) => p.id !== paw.id))
          }
          className="pointer-events-none absolute select-none text-lg"
          style={{ left: paw.x, top: paw.y, transform: "translate(-50%, -50%)" }}
        >
          🐾
        </motion.span>
      ))
    : null;

  return { handleMouseMove, trail };
}

// A loose thread following the cursor, only within Field Notes — ties
// directly to the crochet mention in the closing paragraph below, without
// being an omnipresent sitewide gimmick.
function useThreadTrail(enabled: boolean) {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const lastPoint = useRef(0);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastPoint.current < 35) return;
    lastPoint.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    setPoints((prev) => [
      ...prev.slice(-7),
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
  }

  function handleMouseLeave() {
    setPoints([]);
  }

  let d = "";
  if (points.length > 1) {
    d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y}, ${mx} ${my}`;
    }
  }

  const trail = enabled && d && (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
    </svg>
  );

  return { handleMouseMove, handleMouseLeave, trail };
}

function FieldNoteCard({
  note,
  showCategoryBadge,
}: {
  note: FieldNote;
  showCategoryBadge?: boolean;
}) {
  const { handleMouseMove, trail } = usePawTrail(note.id === "cat");

  return (
    <motion.div
      variants={hideAndShowAndScaleVariant}
      initial="hide"
      whileInView="show"
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      className="relative flex w-[220px] flex-col gap-2 overflow-hidden sm:w-[280px]"
    >
      {trail}
      {note.image !== null ? (
        <Image
          src={note.image}
          alt={note.title}
          className="h-[280px] w-full object-cover sm:h-[360px]"
        />
      ) : (
        <div className="flex h-[280px] w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black sm:h-[360px]">
          {note.isPlaceholder && (
            <span className="rounded-sm border border-primary px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
              Coming soon
            </span>
          )}
        </div>
      )}
      {showCategoryBadge && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          {categoryLabels[note.category]}
        </p>
      )}
      <p className="text-sm text-white">{note.title}</p>
      <p className="text-xs text-graytransparent">{note.caption}</p>
    </motion.div>
  );
}

function HikesRow() {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageContainerRef,
    offset: ["start end", "end start"],
  } as any);
  const yForward = useParallax(scrollYProgress, 300);
  const yReverse = useParallax(scrollYProgress, -150);
  const notes = fieldNotesByCategory("hikes");

  return (
    <div
      ref={imageContainerRef}
      className="flex flex-row flex-wrap items-start justify-center gap-6 overflow-hidden text-clip"
    >
      {notes.map((note, i) => (
        <motion.div key={note.id} style={{ y: i % 2 === 0 ? yForward : yReverse }}>
          <FieldNoteCard note={note} />
        </motion.div>
      ))}
    </div>
  );
}

// Design/Books/Hardware/Engineering each have only 1-3 notes — giving each
// its own heading + row (as Hikes gets, where there's enough content to
// justify it) wasted a huge amount of vertical space on nearly-empty rows.
// One shared grid with a small per-card category badge instead.
const MERGED_CATEGORIES: FieldNoteCategory[] = [
  "design",
  "books",
  "hardware",
  "engineering",
];

function MergedNotesGrid() {
  const notes = MERGED_CATEGORIES.flatMap((category) =>
    fieldNotesByCategory(category)
  );
  if (notes.length === 0) return null;

  return (
    <div className="flex flex-row flex-wrap justify-center gap-6">
      {notes.map((note) => (
        <FieldNoteCard key={note.id} note={note} showCategoryBadge />
      ))}
    </div>
  );
}

export default function Hobbies() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scrollYProgressRevealingText } = useScroll({
    target: targetRef,
    offset: ["start end", "end center"],
  } as any);
  const sectionRef = useRef(null);
  const sectionOpacity = useSectionExitFade(sectionRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { handleMouseMove, handleMouseLeave, trail } = useThreadTrail(!prefersReducedMotion);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity: sectionOpacity }}
      id="field-notes"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-[10%] my-[3rem] min-h-max select-none py-[6rem] sm:mx-[15%]"
    >
      {trail}
      <Heading>FIELD NOTES</Heading>
      <div className="mt-24 text-graytransparent">
        <motion.div
          variants={hideAndShowVariant}
          initial="hide"
          whileInView="show"
          className="m-auto flex w-max flex-col items-center justify-center text-center"
          ref={targetRef}
          viewport={{ once: true }}
        >
          <RevealingTextContainer scrollYProgress={scrollYProgressRevealingText}>
            {[
              `In the world of code, I'am the star,`,
              `Frontend wizard,taken it far.,`,
              `With lines so neat,`,
              "My websites are always a visual treat.",
            ].map((text, i) => (
              <RevealingTextItem index={i} key={i}>
                {text}
              </RevealingTextItem>
            ))}
          </RevealingTextContainer>
          <p className="mt-6 w-full text-center text-xs sm:text-sm">
            - Probably Dr. Seuss's
          </p>
        </motion.div>

        <div className="my-[5rem] flex flex-col gap-8">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            {categoryLabels.hikes}
          </p>
          <HikesRow />
        </div>

        <div className="my-[5rem] flex flex-col gap-8">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            More Notes
          </p>
          <MergedNotesGrid />
        </div>

        <motion.div
          variants={hideAndShowVariant}
          initial="hide"
          whileInView="show"
          viewport={{ once: true }}
          className="m-auto mb-24 flex w-full text-center text-base font-medium leading-7 sm:text-xl lg:w-1/2"
        >
          <p>
            Apart from coding,
            <br />
            <br />
            You can usually find me{" "}
            <span className="text-white">hiking with a camera</span>,{" "}
            <span className="text-white">deep in a book</span>,{" "}
            <span className="text-white">crocheting something slightly too ambitious</span>,{" "}
            <span className="text-white">
              prototyping an IoT gadget that half-works
            </span>
            , <span className="text-white">playing games</span> (currently
            obsessing over{" "}
            <span className="text-white">Street Fighter 6&apos;s presentation</span>
            ), <span className="text-white">petting doggos</span>, or probably
            doing <span className="text-white">something stupid</span>.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
