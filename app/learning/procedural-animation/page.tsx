import type { Metadata } from "next";
import ProceduralAnimationCourse from "./ProceduralAnimationCourse";

export const metadata: Metadata = {
  title: "Procedural Animation — Noob to Pro",
  description:
    "A hands-on Canvas and TypeScript course with 30 code steps, live controls, runnable demos, debugging checks, steering, constraints, soft motion and production-safe procedural characters.",
};

export default function ProceduralAnimationPage() {
  return <ProceduralAnimationCourse />;
}
