"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { SS_BLOCKS, SS_VIEWBOX, SSLogo } from "./SSLogo";
import styles from "./SSMotionLab.module.css";

const [VB_WIDTH, VB_HEIGHT] = SS_VIEWBOX.split(" ")
  .slice(2)
  .map((value) => Number(value));

const MODES = [
  {
    name: "Assemble",
    description: `${SS_BLOCKS.length} tiles find their exact modular coordinates.`,
  },
  {
    name: "Ripple",
    description: "A soft wave travels across both initials, block by block.",
  },
  {
    name: "Orbit",
    description: "The structure rotates out, then snaps back into its grid.",
  },
  {
    name: "Glitch",
    description: "Signal noise offsets the geometry without losing the mark.",
  },
  {
    name: "Magnet",
    description: "Move through the field and pull every tile toward you.",
  },
] as const;

type Mode = (typeof MODES)[number]["name"];

const MODE_COLORS: Record<Mode, string> = {
  Assemble: "#eee9df",
  Ripple: "#ff7448",
  Orbit: "#eee9df",
  Glitch: "#eee9df",
  Magnet: "#ff7448",
};

export function SSMotionLab() {
  const [modeIndex, setModeIndex] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5, active: false });
  const blockRefs = useRef<(SVGGElement | null)[]>([]);
  const scanRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const mode = MODES[modeIndex].name;

  useEffect(() => {
    if (!isAuto || shouldReduceMotion) return;
    const interval = window.setInterval(() => {
      setModeIndex((current) => (current + 1) % MODES.length);
    }, 3900);
    return () => window.clearInterval(interval);
  }, [isAuto, shouldReduceMotion]);

  useLayoutEffect(() => {
    if (shouldReduceMotion) return;
    const blocks = blockRefs.current.filter(Boolean);
    const context = gsap.context(() => {
      gsap.killTweensOf(blocks);
      gsap.set(blocks, { clearProps: "transform,opacity" });

      if (mode === "Assemble") {
        gsap.fromTo(
          blocks,
          {
            x: (index) => (index % 2 ? 1 : -1) * (34 + index * 3.5),
            y: (index) => ((index % 4) - 1.5) * 26,
            rotation: (index) => (index % 2 ? 28 : -28),
            opacity: 0,
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 1,
            duration: 1.05,
            ease: "expo.out",
            stagger: { each: 0.042, from: "center" },
          },
        );
      }

      if (mode === "Orbit") {
        gsap.fromTo(
          blocks,
          { rotation: (index) => (index % 2 ? -16 : 16), scale: 0.82 },
          {
            rotation: 0,
            scale: 1,
            duration: 1.15,
            ease: "elastic.out(1, 0.55)",
            stagger: { each: 0.035, from: "edges" },
          },
        );
      }

      if (mode === "Glitch") {
        gsap.fromTo(
          blocks,
          { x: (index) => (index % 2 ? -6 : 6), opacity: 0.45 },
          {
            x: 0,
            opacity: 1,
            duration: 0.075,
            ease: "steps(1)",
            stagger: 0.018,
            repeat: 4,
            yoyo: true,
          },
        );
      }

      if (scanRef.current) {
        gsap.fromTo(
          scanRef.current,
          { top: "0%" },
          { top: "100%", duration: 1.55, ease: "power2.inOut" },
        );
      }
    }, stageRef);

    return () => context.revert();
  }, [mode, shouldReduceMotion]);

  const triggerPulse = () => {
    setPulseCount((current) => current + 1);
    if (shouldReduceMotion) return;
    const blocks = blockRefs.current.filter(Boolean);
    gsap.fromTo(
      blocks,
      { scale: 1 },
      {
        scale: (index) => 0.78 + (index % 3) * 0.08,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        stagger: { each: 0.022, from: "center" },
        clearProps: "scale",
      },
    );
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      active: true,
    });
  };

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerPulse();
    }
    if (event.key === "ArrowRight") {
      setModeIndex((current) => (current + 1) % MODES.length);
    }
    if (event.key === "ArrowLeft") {
      setModeIndex((current) => (current - 1 + MODES.length) % MODES.length);
    }
  };

  return (
    <div className={styles.labShell}>
      <header className={styles.labHeader}>
        <div className={styles.brandLockup}>
          <SSLogo className={styles.headerGlyph} animated={false} decorative />
          <span>Shantanu Soam</span>
        </div>
        <span className={styles.headerIndex}>Identity system / 001</span>
        <div className={styles.liveState}>
          <span className={styles.liveDot} aria-hidden="true" />
          Motion online
        </div>
      </header>

      <main className={styles.labMain}>
        <section className={styles.introPanel} aria-labelledby="ss-lab-title">
          <p className={styles.eyebrow}>Kinetic monogram / SS</p>
          <h1 id="ss-lab-title" className={styles.pageTitle}>
            Structure,
            <br />
            <span>in motion.</span>
          </h1>
          <p className={styles.introCopy}>
            A modular identity built from {SS_BLOCKS.length} precise blocks.
            Familiar at rest, expressive in motion — designed for interfaces,
            openers, and digital signatures.
          </p>

          <nav className={styles.modeNav} aria-label="Motion styles">
            {MODES.map((item, index) => (
              <motion.button
                key={item.name}
                type="button"
                className={`${styles.modeButton} ${index === modeIndex ? styles.isActive : ""}`}
                onClick={() => {
                  setModeIndex(index);
                  setIsAuto(false);
                }}
                aria-pressed={index === modeIndex}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.985 }}
              >
                <span className={styles.modeNumber}>0{index + 1}</span>
                <span className={styles.modeName}>{item.name}</span>
                <span className={styles.modeMarker} aria-hidden="true" />
              </motion.button>
            ))}
          </nav>

          <div className={styles.specList} aria-label="Logo specifications">
            <div className={styles.specRow}>
              <span>Geometry</span>
              <strong>{SS_BLOCKS.length} modular blocks</strong>
            </div>
            <div className={styles.specRow}>
              <span>Palette</span>
              <strong>Surface / Bone / Signal</strong>
            </div>
            <div className={styles.specRow}>
              <span>Motion</span>
              <strong>Framer + GSAP</strong>
            </div>
          </div>
        </section>

        <section
          className={styles.stageColumn}
          aria-label="Interactive SS motion component"
        >
          <div
            ref={stageRef}
            className={styles.motionStage}
            role="button"
            tabIndex={0}
            aria-label={`Interactive SS logo. Current motion style: ${mode}. Press Enter to pulse.`}
            onClick={triggerPulse}
            onKeyDown={handleStageKeyDown}
            onPointerMove={handlePointerMove}
            onPointerLeave={() =>
              setPointer((current) => ({ ...current, active: false }))
            }
          >
            <div className={styles.stageTopline}>
              <span className={styles.stageMeta}>
                SS / Field {VB_WIDTH}×{VB_HEIGHT}
              </span>
              <span className={styles.stageHint}>Move / click / explore</span>
            </div>

            <div ref={scanRef} className={styles.scanLine} aria-hidden="true" />
            {mode === "Magnet" && pointer.active && (
              <motion.span
                className={styles.crosshair}
                style={{ left: `${pointer.x * 100}%`, top: `${pointer.y * 100}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                aria-hidden="true"
              />
            )}

            <div className={styles.logoWrap}>
              <motion.svg
                viewBox={SS_VIEWBOX}
                className={styles.kineticLogo}
                role="img"
                aria-label="Animated block SS monogram"
                animate={
                  mode === "Orbit" && !shouldReduceMotion
                    ? { rotateY: [0, -9, 9, 0], rotateX: [0, 5, -3, 0] }
                    : { rotateY: 0, rotateX: 0 }
                }
                transition={{ duration: 2.4, ease: "easeInOut" }}
              >
                <title>Animated Shantanu Soam SS monogram</title>
                {SS_BLOCKS.map((block, index) => (
                  <KineticBlock
                    key={block.id}
                    block={block}
                    index={index}
                    mode={mode}
                    pointer={pointer}
                    reducedMotion={Boolean(shouldReduceMotion)}
                    blockRef={(node) => {
                      blockRefs.current[index] = node;
                    }}
                  />
                ))}
              </motion.svg>
            </div>

            <span className={styles.cornerIndex}>
              Pulse / {String(pulseCount).padStart(2, "0")}
            </span>
          </div>

          <div className={styles.stageControls}>
            <div>
              <p className={styles.modeKicker}>
                Active behavior / {String(modeIndex + 1).padStart(2, "0")}
              </p>
              <p className={styles.modeDescription}>
                {MODES[modeIndex].description}
              </p>
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={`${styles.controlButton} ${isAuto ? styles.isOn : ""}`}
                onClick={() => setIsAuto((current) => !current)}
                aria-pressed={isAuto}
              >
                <span>{isAuto ? "Pause" : "Auto play"}</span>
              </button>
              <a className={styles.downloadButton} href="/logo.svg" download>
                SVG
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.footerNote} aria-hidden="true">
            <span>Interactive identity study / Shantanu Soam</span>
            <span>Keyboard: ← → / Enter</span>
          </div>
        </section>
      </main>
    </div>
  );
}

type KineticBlockProps = {
  block: (typeof SS_BLOCKS)[number];
  index: number;
  mode: Mode;
  pointer: { x: number; y: number; active: boolean };
  reducedMotion: boolean;
  blockRef: (node: SVGGElement | null) => void;
};

function KineticBlock({
  block,
  index,
  mode,
  pointer,
  reducedMotion,
  blockRef,
}: KineticBlockProps) {
  const magnet = useMemo(() => {
    if (mode !== "Magnet" || !pointer.active || reducedMotion) {
      return { x: 0, y: 0, scale: 1 };
    }
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    const cursorX = pointer.x * VB_WIDTH;
    const cursorY = pointer.y * VB_HEIGHT;
    const dx = cursorX - centerX;
    const dy = cursorY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const strength = Math.max(0, 1 - distance / 100);

    return {
      x: dx * strength * 0.16,
      y: dy * strength * 0.16,
      scale: 1 + strength * 0.1,
    };
  }, [block, mode, pointer, reducedMotion]);

  const rippleDelay = index * 0.055;
  const glitchOffset = index % 2 === 0 ? 5 : -5;

  const motionState = reducedMotion
    ? { x: 0, y: 0, scale: 1, rotate: 0 }
    : mode === "Magnet"
      ? magnet
      : mode === "Ripple"
        ? { y: [0, -9, 0, 7, 0], scale: [1, 1.03, 1, 0.98, 1] }
        : mode === "Orbit"
          ? { rotate: [0, 2.5, -2.5, 0], scale: [1, 0.96, 1.02, 1] }
          : mode === "Glitch"
            ? { x: [0, glitchOffset, 0, -glitchOffset * 0.55, 0] }
            : { x: 0, y: 0, scale: 1, rotate: 0 };

  return (
    <g ref={blockRef}>
      <motion.g
        animate={motionState}
        transition={
          mode === "Magnet"
            ? { type: "spring", stiffness: 230, damping: 22, mass: 0.5 }
            : mode === "Ripple"
              ? { duration: 2.3, repeat: Infinity, delay: rippleDelay, ease: "easeInOut" }
              : mode === "Glitch"
                ? { duration: 0.34, repeat: Infinity, repeatDelay: 1.15, delay: index * 0.012 }
                : { duration: 1.8, repeat: mode === "Orbit" ? Infinity : 0, delay: index * 0.025 }
        }
        style={{
          transformOrigin: `${block.x + block.width / 2}px ${block.y + block.height / 2}px`,
        }}
      >
        <motion.rect
          x={block.x}
          y={block.y}
          width={block.width}
          height={block.height}
          animate={{
            fill: MODE_COLORS[mode],
            opacity: mode === "Glitch" ? [1, 0.66, 1] : 1,
          }}
          transition={{ duration: mode === "Glitch" ? 0.18 : 0.45, delay: index * 0.018 }}
        />
      </motion.g>
    </g>
  );
}
