import type { Metadata } from "next";
import SpaceImpact from "@/components/space-impact/SpaceImpact";

export const metadata: Metadata = {
  title: "Lost Signal — Space Impact by Shantanu Soam",
  description:
    "A pocket space adventure. Five sectors, eight hidden signals, one small ship. Play with touch or keyboard.",
  alternates: { canonical: "/arcade/space-impact" },
};

export default function SpaceImpactPage() {
  return <SpaceImpact />;
}
