import type { Metadata } from "next";
import GpuSmoke from "./GpuSmoke";

export const metadata: Metadata = {
  title: "GPU Smoke — Shantanu Soam",
  robots: { index: false, follow: false },
};

export default function GpuSmokePage() {
  return <GpuSmoke />;
}
