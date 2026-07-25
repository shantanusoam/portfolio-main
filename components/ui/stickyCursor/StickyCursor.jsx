"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./style.module.scss";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import {
  MAGNETIC_SELECTOR,
  clamp,
  criticalDamping,
  integrateSpring,
  measureField,
  probeField,
  smootherstep,
} from "../magnetic/magneticField";

const CORE_SIZE = 10;
const FIELD_REST_SIZE = 36;
const FIELD_WRAP_PADDING = 14;
const FIELD_MAX_SIZE = 340;

// Core tracks the true pointer — near-critically damped so it never reads as lag.
const CORE_SPRING = {
  stiffness: 1800,
  damping: criticalDamping(1800) * 0.98,
};
// Free field trails with a little slack (underdamped enough to feel alive).
const FIELD_FREE_SPRING = {
  stiffness: 480,
  damping: criticalDamping(480) * 0.7,
};
// Held field is critically damped — welded to the soft-capture target.
const FIELD_HELD_SPRING = {
  stiffness: 1280,
  damping: criticalDamping(1280),
};

/**
 * How much of the pointer offset from centre the field is allowed to follow.
 * Soft potential drives this: near centre the field is trapped (low pull),
 * at the release boundary pull → 1 so position is continuous through exit.
 */
const CENTRE_PULL = 0.12;
const EDGE_PULL = 0.55;
const RELEASE_IMPULSE = 0.42;

const MAX_STRETCH = 0.38;
const STRETCH_PER_SPEED = 1 / 2200;
const DIRECTION_SPEED_FLOOR = 55;
const SETTLED_DISTANCE = 0.12;
const SETTLED_SPEED = 3;

function transformOf(x, y, angle, scaleX, scaleY) {
  // Innermost translate centres the box so rotate/scale pivot on the cursor;
  // the outer translate then places it in the viewport.
  return `translate3d(${x.toFixed(2)}px, ${y.toFixed(
    2
  )}px, 0) rotate(${angle.toFixed(2)}deg) scale(${scaleX.toFixed(
    4
  )}, ${scaleY.toFixed(4)}) translate(-50%, -50%)`;
}

export default function StickyCursor() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const coreRef = useRef(null);
  const fieldRef = useRef(null);

  const pointer = useRef({ x: -200, y: -200, vx: 0, vy: 0, time: 0 });
  const core = useRef({ x: -200, y: -200, vx: 0, vy: 0 });
  const field = useRef({ x: -200, y: -200, vx: 0, vy: 0 });
  const shape = useRef({
    dirX: 1,
    dirY: 0,
    stretch: 0,
    press: 0,
    pressTarget: 0,
    hold: 0,
    angle: 0,
  });
  const capture = useRef({ element: null, geometry: null, stale: false });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(query.matches);

    sync();
    if (query.addEventListener) {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    query.addListener(sync);
    return () => query.removeListener(sync);
  }, []);

  // Hide the native cursor while the custom one owns the pointer.
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-sticky-cursor");
    return () => {
      document.documentElement.classList.remove("has-sticky-cursor");
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const coreEl = coreRef.current;
    const fieldEl = fieldRef.current;
    if (!coreEl || !fieldEl) return;

    let frame = 0;
    let previousTime = 0;
    let awake = false;

    function wrapField(geometry) {
      const width = clamp(
        geometry.width + FIELD_WRAP_PADDING,
        FIELD_REST_SIZE,
        FIELD_MAX_SIZE
      );
      const height = clamp(
        geometry.height + FIELD_WRAP_PADDING,
        FIELD_REST_SIZE,
        FIELD_MAX_SIZE
      );
      fieldEl.style.setProperty("--field-width", `${width}px`);
      fieldEl.style.setProperty("--field-height", `${height}px`);
      fieldEl.style.setProperty(
        "--field-radius",
        `${Math.min(16, Math.min(width, height) / 2)}px`
      );
      fieldEl.dataset.held = "true";
    }

    function unwrapField() {
      fieldEl.style.removeProperty("--field-width");
      fieldEl.style.removeProperty("--field-height");
      fieldEl.style.removeProperty("--field-radius");
      fieldEl.dataset.held = "false";
    }

    function captureTarget(element) {
      const geometry = measureField(element);
      capture.current = { element, geometry, stale: false };
      if (!prefersReducedMotion) wrapField(geometry);
    }

    function releaseTarget(withImpulse) {
      if (!capture.current.element) return;
      capture.current = { element: null, geometry: null, stale: false };
      unwrapField();

      // Field is already at the release-boundary position (pull = 1), so this
      // only adds the flick — it never jumps.
      if (withImpulse && !prefersReducedMotion) {
        field.current.vx += pointer.current.vx * RELEASE_IMPULSE;
        field.current.vy += pointer.current.vy * RELEASE_IMPULSE;
      }
    }

    function wake() {
      if (awake) return;
      awake = true;
      previousTime = 0;
      frame = requestAnimationFrame(tick);
    }

    function handlePointerMove(event) {
      const { clientX, clientY, timeStamp } = event;
      const state = pointer.current;
      const gap = clamp((timeStamp - state.time) / 1000, 1 / 1000, 0.1);

      if (state.time !== 0) {
        // Exponential smoothing: raw per-event velocity spikes on the
        // sub-millisecond gaps coalesced pointer events produce.
        state.vx += ((clientX - state.x) / gap - state.vx) * 0.32;
        state.vy += ((clientY - state.y) / gap - state.vy) * 0.32;
      }
      state.x = clientX;
      state.y = clientY;
      state.time = timeStamp;

      const target =
        typeof event.target?.closest === "function"
          ? event.target.closest(MAGNETIC_SELECTOR)
          : null;

      if (target && target !== capture.current.element) {
        captureTarget(target);
      }

      wake();
    }

    function handlePointerDown() {
      shape.current.pressTarget = 1;
      wake();
    }

    function handlePointerUp() {
      shape.current.pressTarget = 0;
      wake();
    }

    function handlePointerOut(event) {
      if (event.relatedTarget === null) releaseTarget(false);
    }

    function invalidateGeometry() {
      if (capture.current.element) {
        capture.current.stale = true;
        wake();
      }
    }

    function tick(now) {
      frame = requestAnimationFrame(tick);
      const dt = previousTime ? (now - previousTime) / 1000 : 1 / 60;
      previousTime = now;

      const pointerState = pointer.current;
      const coreState = core.current;
      const fieldState = field.current;
      const shapeState = shape.current;

      if (capture.current.element && !capture.current.element.isConnected) {
        releaseTarget(false);
      }

      const held = capture.current;

      if (held.element && held.stale) {
        held.geometry = measureField(held.element);
        held.stale = false;
        if (!prefersReducedMotion) wrapField(held.geometry);
      }

      let fieldTargetX = pointerState.x;
      let fieldTargetY = pointerState.y;
      let holdTarget = 0;
      let spring = FIELD_FREE_SPRING;

      if (held.element && held.geometry && !prefersReducedMotion) {
        const probe = probeField(held.geometry, pointerState.x, pointerState.y);

        if (probe.escaped) {
          releaseTarget(true);
        } else {
          // Soft potential: 1 at centre → 0 at release. Pull rises with it so
          // the field is trapped near the centre and meets the pointer exactly
          // at the exit boundary (continuous position, no snap).
          const potential = probe.potential;
          const pull =
            CENTRE_PULL +
            (EDGE_PULL - CENTRE_PULL) * (1 - potential) +
            (1 - EDGE_PULL) * smootherstep(probe.escape);

          fieldTargetX = held.geometry.cx + probe.dx * pull;
          fieldTargetY = held.geometry.cy + probe.dy * pull;
          holdTarget = potential;
          spring = FIELD_HELD_SPRING;
        }
      }

      if (prefersReducedMotion) {
        coreState.x = pointerState.x;
        coreState.y = pointerState.y;
        coreState.vx = 0;
        coreState.vy = 0;
        fieldState.x = pointerState.x;
        fieldState.y = pointerState.y;
        fieldState.vx = 0;
        fieldState.vy = 0;
      } else {
        integrateSpring(
          coreState,
          pointerState.x,
          pointerState.y,
          CORE_SPRING.stiffness,
          CORE_SPRING.damping,
          dt
        );
        integrateSpring(
          fieldState,
          fieldTargetX,
          fieldTargetY,
          spring.stiffness,
          spring.damping,
          dt
        );
      }

      const ease = 1 - Math.exp(-dt / 0.055);
      const holdEase = 1 - Math.exp(-dt / 0.08);
      shapeState.hold += (holdTarget - shapeState.hold) * holdEase;
      shapeState.press +=
        (shapeState.pressTarget - shapeState.press) *
        (1 - Math.exp(-dt / 0.04));

      const speed = Math.hypot(fieldState.vx, fieldState.vy);
      // Reason: only update heading while free. Stretching/rotating a field
      // that has morphed to wrap a target is the angle glitch — held state
      // must stay axis-aligned with the wrapped bounds.
      const freeFactor = 1 - shapeState.hold;

      if (speed > DIRECTION_SPEED_FLOOR && freeFactor > 0.05) {
        // Interpolate the direction *vector*, not the angle: atan2 jumps by
        // 2π across the −x axis, which flipped the cursor mid-sweep before.
        const nextX = fieldState.vx / speed;
        const nextY = fieldState.vy / speed;
        shapeState.dirX += (nextX - shapeState.dirX) * ease;
        shapeState.dirY += (nextY - shapeState.dirY) * ease;
        const length = Math.hypot(shapeState.dirX, shapeState.dirY) || 1;
        shapeState.dirX /= length;
        shapeState.dirY /= length;
      }

      const stretchTarget = prefersReducedMotion
        ? 0
        : clamp(speed * STRETCH_PER_SPEED, 0, MAX_STRETCH) * freeFactor;
      shapeState.stretch += (stretchTarget - shapeState.stretch) * ease;

      const rawAngle =
        (Math.atan2(shapeState.dirY, shapeState.dirX) * 180) / Math.PI;
      // Lerp angle toward 0 while held so the wrap box never spins.
      shapeState.angle +=
        (rawAngle * freeFactor - shapeState.angle) * holdEase;
      const angle = shapeState.angle;

      const stretch = shapeState.stretch;
      // Area-preserving deformation: mass pulled along its path, not scaled up.
      const fieldScaleX = 1 + stretch;
      const fieldScaleY = 1 / (1 + stretch);
      const coreScale = 1 - 0.22 * shapeState.press - 0.14 * shapeState.hold;
      const coreStretch = stretch * 0.4;

      fieldEl.style.transform = transformOf(
        fieldState.x,
        fieldState.y,
        angle,
        fieldScaleX,
        fieldScaleY
      );
      coreEl.style.transform = transformOf(
        coreState.x,
        coreState.y,
        angle,
        coreScale * (1 + coreStretch),
        coreScale / (1 + coreStretch)
      );
      fieldEl.style.opacity = `${0.28 + 0.72 * shapeState.hold}`;

      const settled =
        !capture.current.element &&
        Math.hypot(
          pointerState.x - fieldState.x,
          pointerState.y - fieldState.y
        ) < SETTLED_DISTANCE &&
        Math.hypot(pointerState.x - coreState.x, pointerState.y - coreState.y) <
          SETTLED_DISTANCE &&
        speed < SETTLED_SPEED &&
        Math.hypot(coreState.vx, coreState.vy) < SETTLED_SPEED &&
        Math.abs(stretch) < 0.002 &&
        Math.abs(shapeState.press - shapeState.pressTarget) < 0.002;

      if (settled) {
        cancelAnimationFrame(frame);
        frame = 0;
        awake = false;
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("scroll", invalidateGeometry, { passive: true });
    window.addEventListener("resize", invalidateGeometry, { passive: true });

    wake();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("scroll", invalidateGeometry);
      window.removeEventListener("resize", invalidateGeometry);
    };
  }, [enabled, prefersReducedMotion]);

  if (!enabled) return null;

  // No positioned wrapper: a z-index parent would isolate mix-blend-mode.
  return (
    <>
      <div
        ref={fieldRef}
        aria-hidden="true"
        data-held="false"
        className={styles.field}
        style={{ "--field-rest": `${FIELD_REST_SIZE}px` }}
      />
      <div
        ref={coreRef}
        aria-hidden="true"
        className={styles.core}
        style={{ "--core-size": `${CORE_SIZE}px` }}
      />
    </>
  );
}
