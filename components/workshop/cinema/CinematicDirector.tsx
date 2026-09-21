"use client";
import { useEffect, useState } from "react";
import { frame, subscribe, timeOfDay, wake } from "./motion";
import Cursor from "./Cursor";
import GardenSound from "./GardenSound";
import styles from "./Cinema.module.css";

export default function CinematicDirector() {
  const [quiet, setQuiet] = useState(false);
  const [systemQuiet, setSystemQuiet] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemQuiet(media.matches);
    update();
    media.addEventListener("change", update);
    try {
      setQuiet(localStorage.getItem("portfolio-quiet") === "true");
    } catch {}
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".workshop-home");
    if (!root) return;
    let disposed = false;
    let cleanupMotion = () => {};
    let lastY = scrollY;
    let lastTime = performance.now();
    let targetVelocity = 0;
    const reduced =
      quiet ||
      systemQuiet ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    frame.enabled = !reduced;
    root.dataset.motion = reduced ? "quiet" : "full";
    const hud = root.querySelector("[data-clock]");
    const links = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]'),
    );
    let previousProgress = -1;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("main > section[id]"),
    );
    let bounds: { id: string; top: number }[] = [];
    let length = 1;
    const measure = () => {
      length = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      bounds = sections.map((el) => ({
        id: el.id,
        top: el.getBoundingClientRect().top + scrollY,
      }));
      wake();
    };
    const update = () => {
      frame.progress = Math.max(0, Math.min(1, scrollY / length));
      if (Math.abs(frame.progress - previousProgress) < 0.00001) return;
      previousProgress = frame.progress;
      const theme = timeOfDay(frame.progress);
      root.style.setProperty("--scene-bg", theme.background);
      root.style.setProperty("--scene-accent", theme.accent);
      root.style.setProperty("--journey", String(frame.progress));
      if (hud)
        hud.textContent = `${theme.name} / ${String(
          Math.round(frame.progress * 100),
        ).padStart(2, "0")}%`;
      const active =
        [...bounds]
          .reverse()
          .find((section) => scrollY + innerHeight * 0.4 >= section.top)?.id ||
        "top";
      links.forEach((link) => {
        if (link.hash === `#${active}`)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    const off = subscribe(() => {
      frame.velocity += (targetVelocity - frame.velocity) * 0.14;
      targetVelocity *= 0.84;
      if (Math.abs(frame.velocity) < 0.001) frame.velocity = 0;
      root.style.setProperty(
        "--velocity",
        reduced ? "0" : frame.velocity.toFixed(4),
      );
      update();
    });
    const scroll = () => {
      const now = performance.now();
      targetVelocity = Math.max(
        -1,
        Math.min(1, (scrollY - lastY) / Math.max(16, now - lastTime) / 4),
      );
      lastY = scrollY;
      lastTime = now;
      wake(900);
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced) return;
      frame.x = (event.clientX / innerWidth) * 2 - 1;
      frame.y = (event.clientY / innerHeight) * 2 - 1;
      root.style.setProperty("--pointer-x", `${frame.x * 9}px`);
      root.style.setProperty("--pointer-y", `${frame.y * 6}px`);
      wake();
    };
    const visibility = () => {
      if (!document.hidden) {
        measure();
        wake();
      }
    };
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("pointermove", pointer, { passive: true });
    addEventListener("resize", measure);
    document.addEventListener("visibilitychange", visibility);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    update();
    if (!reduced)
      void Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("@studio-freight/lenis"),
      ])
        .then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
          if (disposed) return;
          gsap.registerPlugin(ScrollTrigger);
          const desktop = matchMedia(
            "(min-width: 900px) and (pointer: fine)",
          ).matches;
          const lenis = desktop
            ? new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false })
            : null;
          const offLenis = subscribe(({ time }) => lenis?.raf(time));
          const wheel = () => wake(1800);
          addEventListener("wheel", wheel, { passive: true });
          const context = gsap.context(() => {
            gsap.from("[data-letter]", {
              yPercent: 65,
              rotateX: -15,
              stagger: 0.035,
              duration: 1.6,
              ease: "power4.out",
              clearProps: "transform",
              delay: 0.1,
            });
            gsap.to("[data-camera]", {
              yPercent: desktop ? 16 : 6,
              scale: 1.06,
              ease: "none",
              scrollTrigger: {
                trigger: "#top",
                start: "top top",
                end: "bottom top",
                scrub: 0.7,
              },
            });
            gsap.to("[data-hero-copy]", {
              y: desktop ? 90 : 25,
              ease: "none",
              scrollTrigger: {
                trigger: "#top",
                start: "top top",
                end: "bottom top",
                scrub: 0.5,
              },
            });
            root
              .querySelectorAll<HTMLElement>("[data-project]")
              .forEach((el) => {
                gsap.fromTo(
                  el.querySelector("[data-artifact]"),
                  { rotateY: desktop ? -7 : 0, scale: 0.94 },
                  {
                    rotateY: 0,
                    scale: 1,
                    ease: "none",
                    scrollTrigger: {
                      trigger: el,
                      start: "top 85%",
                      end: "top 20%",
                      scrub: 0.6,
                    },
                  },
                );
                gsap.fromTo(
                  el.querySelector("[data-district]"),
                  { xPercent: 10 },
                  {
                    xPercent: -5,
                    ease: "none",
                    scrollTrigger: {
                      trigger: el,
                      start: "top bottom",
                      end: "bottom top",
                      scrub: 1,
                    },
                  },
                );
              });
          }, root);
          cleanupMotion = () => {
            context.revert();
            offLenis();
            lenis?.destroy();
            removeEventListener("wheel", wheel);
          };
          ScrollTrigger.refresh();
        })
        .catch(() => {
          root.dataset.motion = "quiet";
          frame.enabled = false;
        });
    return () => {
      disposed = true;
      cleanupMotion();
      off();
      observer.disconnect();
      removeEventListener("scroll", scroll);
      removeEventListener("pointermove", pointer);
      removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", visibility);
      frame.enabled = false;
      frame.velocity = 0;
      root.style.setProperty("--pointer-x", "0px");
      root.style.setProperty("--pointer-y", "0px");
      root.style.setProperty("--velocity", "0");
    };
  }, [quiet, systemQuiet]);
  return (
    <>
      <Cursor />
      <div className={styles.journey}>
        <GardenSound />
        <span className={styles.signal} aria-hidden="true" />
        <span data-clock>Morning light / 00%</span>
        <button
          type="button"
          aria-pressed={quiet || systemQuiet}
          onClick={() => {
            const next = !quiet;
            setQuiet(next);
            try {
              localStorage.setItem("portfolio-quiet", String(next));
            } catch {}
          }}
          disabled={systemQuiet}
        >
          {systemQuiet ? "Reduced motion" : quiet ? "Motion off" : "Motion on"}
        </button>
        <div className={styles.progress} aria-hidden="true" />
      </div>
    </>
  );
}
