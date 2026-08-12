import type { Metadata } from "next";
import { SSMotionLab } from "@/components/ss-logo/SSMotionLab";

export const metadata: Metadata = {
  title: "SS Motion Lab — Shantanu Soam",
  description:
    "An interactive kinetic monogram system for Shantanu Soam — fourteen modular blocks, five motion behaviors, built with Framer Motion and GSAP.",
};

export default function SSLabPage() {
  return <SSMotionLab />;
}
