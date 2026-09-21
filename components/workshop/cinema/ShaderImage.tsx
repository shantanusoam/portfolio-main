"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { wake } from "./motion";
import styles from "./Cinema.module.css";
export default function ShaderImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const mode = useRef(0);
  const [grid, setGrid] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let disposed = false,
      visible = false,
      cleanup: (() => void) | undefined,
      generation = 0;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const reconcile = () => {
      const run = ++generation;
      cleanup?.();
      cleanup = undefined;
      el.style.opacity = "0";
      if (
        !visible ||
        media.matches ||
        connection?.saveData ||
        document
          .querySelector(".workshop-home")
          ?.getAttribute("data-motion") === "quiet"
      )
        return;
      void import("./shader")
        .then(({ mountShader }) => {
          if (!disposed && run === generation)
            cleanup = mountShader(el, src, () => mode.current);
        })
        .catch(() => {});
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        reconcile();
      },
      { rootMargin: "100px" },
    );
    observer.observe(el);
    media.addEventListener("change", reconcile);
    const motionObserver = new MutationObserver(reconcile);
    const root = document.querySelector(".workshop-home");
    if (root)
      motionObserver.observe(root, {
        attributes: true,
        attributeFilter: ["data-motion"],
      });
    return () => {
      disposed = true;
      generation++;
      observer.disconnect();
      motionObserver.disconnect();
      media.removeEventListener("change", reconcile);
      cleanup?.();
    };
  }, [src]);
  return (
    <figure className={styles.shaderStudy}>
      <div className={styles.shaderSurface}>
        <Image src={src} alt={alt} fill sizes="(max-width: 800px) 92vw, 65vw" />
        <canvas ref={canvas} aria-hidden="true" />
        <span className={styles.lensLabel}>A little light / Play gently</span>
      </div>
      <figcaption>
        <span>Touch the light. Let it settle.</span>
        <button
          type="button"
          aria-pressed={grid}
          onClick={() => {
            mode.current = grid ? 0 : 1;
            setGrid(!grid);
            wake();
          }}
        >
          {grid ? "Hide mesh" : "Reveal mesh"} ↗
        </button>
      </figcaption>
    </figure>
  );
}
