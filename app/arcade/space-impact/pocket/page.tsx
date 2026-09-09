import type { Metadata } from "next";
import PocketEdition from "@/components/space-impact/pocket/PocketEdition";

export const metadata: Metadata = {
  title: "Lost Signal: Pocket Edition",
  description:
    "A nostalgic LCD pocket receiver edition of Space Impact: authored pixel atlases, a softly lit green screen, and a transmission worth following.",
};

export default function PocketPage() {
  return <PocketEdition />;
}
