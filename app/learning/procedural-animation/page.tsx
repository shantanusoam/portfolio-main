import type { Metadata } from "next";
import ProceduralAnimationCourse from "./ProceduralAnimationCourse";

export const metadata: Metadata = {
  title: "Procedural Animation — Noob to Pro",
  description:
    "An interactive, psychology-aware course in steering, chains, constraints, soft motion and shippable procedural characters.",
};

export default function ProceduralAnimationPage() {
  return <ProceduralAnimationCourse />;
}
