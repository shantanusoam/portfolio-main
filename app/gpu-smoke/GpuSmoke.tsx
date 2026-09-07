"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import shader from "@/lib/living-canvas/gpu/signal-current.wgsl";
import { createFieldUniforms } from "@/lib/living-canvas/gpu/uniforms";

export default function GpuSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Initializing vGPU…");

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    async function start() {
      const { init, effect, frame, surface, target } = await import("vgpu");
      const gpu = await init({ powerPreference: "low-power" });
      if (disposed) {
        gpu.dispose();
        return;
      }
      cleanup = () => gpu.dispose();
      try {
        const params = createFieldUniforms();
        const pass = effect(gpu, shader, { set: { params } });
        const offscreen = target(gpu, { size: [2, 2], format: "rgba8unorm" });
        await pass.compile(offscreen);
        frame(gpu, (f) => f.pass(offscreen, pass));
        await gpu.settled();
        if (disposed || !canvasRef.current) {
          gpu.dispose();
          return;
        }
        const canvas = canvasRef.current;
        const screen = surface(gpu, canvas, {
          autoResize: false,
          size: [2, 2],
          dpr: 1,
          clearColor: [0, 0, 0, 0],
          alphaMode: "premultiplied",
        });
        const paint = () => {
          if (disposed) return;
          const rect = canvas.getBoundingClientRect();
          screen.resize([
            Math.max(1, Math.round(rect.width)),
            Math.max(1, Math.round(rect.height)),
          ]);
          params.viewport.set([screen.size[0], screen.size[1], 1, 0]);
          pass.set({ params });
          frame(gpu, (f) => f.pass(screen, pass));
        };
        const observer = new ResizeObserver(paint);
        observer.observe(canvasRef.current);
        paint();
        setStatus(
          "vGPU initialized · WGSL import resolved · fullscreen pass ready",
        );
        cleanup = () => {
          observer.disconnect();
          gpu.dispose();
        };
      } catch (error) {
        gpu.dispose();
        throw error;
      }
    }
    start().catch(() => {
      if (!disposed)
        setStatus(
          "WebGPU unavailable here. Portfolio fallbacks remain available.",
        );
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <main style={{ padding: "8rem 6vw", minHeight: "100vh" }}>
      <h1>GPU smoke test</h1>
      <p role="status">{status}</p>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          width: "100%",
          height: "55vh",
          display: "block",
          background: "#080a0b",
          pointerEvents: "none",
        }}
      />
      <Link href="/">Return to the portfolio</Link>
    </main>
  );
}
