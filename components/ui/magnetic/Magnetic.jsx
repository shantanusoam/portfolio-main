"use client";

import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./magnetic.module.css";
import {
  MAGNETIC_ATTRIBUTE,
  clamp,
  criticalDamping,
  integrateSpring,
  measureField,
  probeField,
} from "./magneticField";

/** Fraction of pointer offset from centre that the element leans by at full strength. */
const LEAN = 0.38;
/** How much lean relaxes as potential falls toward the release edge. */
const EDGE_RELIEF = 0.55;
const MAX_LEAN = 28;

// Critically damped while held — welded to the soft-capture target.
const HELD_SPRING = { stiffness: 720, damping: criticalDamping(720) };
// Slightly underdamped on release: one soft settle, not a bounce fight.
const RELEASE_SPRING = {
  stiffness: 380,
  damping: criticalDamping(380) * 0.72,
};

const SETTLED_OFFSET = 0.05;
const SETTLED_SPEED = 1.5;

export default function Magnetic({ children, className = "" }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const hostRef = useRef(null);
  const moverRef = useRef(null);

  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const target = useRef({ x: 0, y: 0 });
  const session = useRef({ held: false, geometry: null, stale: false });
  const runtime = useRef({ frame: 0, previousTime: 0, awake: false });

  useEffect(() => {
    const mover = moverRef.current;
    if (!mover || prefersReducedMotion) return;

    const state = runtime.current;

    function tick(now) {
      state.frame = requestAnimationFrame(tick);
      const dt = state.previousTime ? (now - state.previousTime) / 1000 : 1 / 60;
      state.previousTime = now;

      const value = motion.current;
      const spring = session.current.held ? HELD_SPRING : RELEASE_SPRING;
      integrateSpring(
        value,
        target.current.x,
        target.current.y,
        spring.stiffness,
        spring.damping,
        dt
      );

      mover.style.transform = `translate3d(${value.x.toFixed(
        2
      )}px, ${value.y.toFixed(2)}px, 0)`;

      const atRest =
        !session.current.held &&
        Math.hypot(value.x, value.y) < SETTLED_OFFSET &&
        Math.hypot(value.vx, value.vy) < SETTLED_SPEED;

      if (atRest) {
        value.x = 0;
        value.y = 0;
        value.vx = 0;
        value.vy = 0;
        mover.style.transform = "";
        cancelAnimationFrame(state.frame);
        state.frame = 0;
        state.awake = false;
      }
    }

    function wake() {
      if (state.awake) return;
      state.awake = true;
      state.previousTime = 0;
      state.frame = requestAnimationFrame(tick);
    }

    function invalidate() {
      if (session.current.held) session.current.stale = true;
    }

    // Reason: pointer handlers live outside this effect; publish wake on the
    // ref so they can start the loop without sharing React state.
    state.wake = wake;
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });

    return () => {
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      if (state.frame) cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.awake = false;
      state.wake = undefined;
      mover.style.transform = "";
      motion.current = { x: 0, y: 0, vx: 0, vy: 0 };
      target.current = { x: 0, y: 0 };
      session.current = { held: false, geometry: null, stale: false };
    };
  }, [prefersReducedMotion]);

  function handlePointerEnter() {
    if (prefersReducedMotion || !hostRef.current) return;
    session.current.held = true;
    session.current.geometry = measureField(hostRef.current);
    session.current.stale = false;
  }

  function handlePointerMove(event) {
    if (prefersReducedMotion || !hostRef.current) return;

    if (!session.current.geometry || session.current.stale) {
      session.current.geometry = measureField(hostRef.current);
      session.current.stale = false;
    }
    session.current.held = true;

    const probe = probeField(
      session.current.geometry,
      event.clientX,
      event.clientY
    );
    // Soft potential drives lean: strong at centre, fades toward the edge so
    // the icon never fights the cursor at the release boundary.
    const lean = LEAN * (1 - EDGE_RELIEF * (1 - probe.potential));

    target.current.x = clamp(probe.dx * lean, -MAX_LEAN, MAX_LEAN);
    target.current.y = clamp(probe.dy * lean, -MAX_LEAN, MAX_LEAN);
    runtime.current.wake?.();
  }

  function handlePointerLeave() {
    session.current.held = false;
    target.current.x = 0;
    target.current.y = 0;
    runtime.current.wake?.();
  }

  return (
    <div
      ref={hostRef}
      // Declares this subtree as a cursor target. The cursor resolves it from
      // the pointer event itself — no shared registry to keep in sync.
      {...{ [MAGNETIC_ATTRIBUTE]: "" }}
      className={
        className ? `${styles.host} MagneticHead ${className}` : `${styles.host} MagneticHead`
      }
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={moverRef} className={styles.mover}>
        {children}
      </div>
    </div>
  );
}
