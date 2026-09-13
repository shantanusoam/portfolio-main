import type { Metadata } from "next";
import WorkshopHome from "@/components/workshop/WorkshopHome";

export const metadata: Metadata = {
  title: "Shantanu Soam — Creative Systems Engineer",
  description:
    "Useful software. A future worth building. Product engineering, interactive systems, and field notes by Shantanu Soam.",
  alternates: { canonical: "/" },
};
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: "Shantanu Soam — Creative Systems Engineer",
  url: "https://shantanusoam.vercel.app",
  mainEntity: {
    "@type": "Person",
    name: "Shantanu Soam",
    url: "https://shantanusoam.vercel.app",
    jobTitle: "Creative Systems Engineer",
    sameAs: [
      "https://github.com/shantanusoam",
      "https://www.linkedin.com/in/shantanu007/",
    ],
  },
};
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WorkshopHome />
    </>
  );
}
