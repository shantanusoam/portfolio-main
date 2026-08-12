import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProofStrip from "@/components/home/ProofStrip";
import FlagshipCaseStudies from "@/components/home/FlagshipCaseStudies";
import SystemsLabPreview from "@/components/home/SystemsLabPreview";
import EvidenceExperience from "@/components/home/EvidenceExperience";
import LatestNotes from "@/components/home/LatestNotes";
import CredibilityPanel from "@/components/home/CredibilityPanel";
import ContactAvailability from "@/components/home/ContactAvailability";
import BuildInfoFooter from "@/components/home/BuildInfoFooter";
import HomeInteractiveLayer from "@/components/home/HomeInteractiveLayer";

export const metadata: Metadata = {
  title: "Shantanu Soam — Creative Systems Engineer",
  description: "Product engineering, interactive systems, measurable outcomes, and a playable lab of original interface experiments.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://shantanusoam.vercel.app/#person",
      name: "Shantanu Soam",
      url: "https://shantanusoam.vercel.app",
      jobTitle: "Creative Systems Engineer",
      sameAs: ["https://github.com/shantanusoam", "https://www.linkedin.com/in/shantanusoam/"],
      knowsAbout: ["Next.js", "React", "TypeScript", "Interactive systems", "AI agents", "Canvas animation"],
    },
    {
      "@type": "ProfilePage",
      name: "Shantanu Soam — Creative Systems Engineer",
      url: "https://shantanusoam.vercel.app",
      mainEntity: { "@id": "https://shantanusoam.vercel.app/#person" },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeInteractiveLayer />
      <Navbar />
      <main>
        <Hero masked={false} />
        <ProofStrip />
        <FlagshipCaseStudies />
        <SystemsLabPreview />
        <EvidenceExperience />
        <LatestNotes />
        <CredibilityPanel />
        <ContactAvailability />
      </main>
      <BuildInfoFooter />
    </>
  );
}
