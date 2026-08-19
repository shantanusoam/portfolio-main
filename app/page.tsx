import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutStudioSection from "@/components/AboutStudioSection";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import PatternLibrary from "@/components/PatternLibrary";
import PretextCopyLab from "@/components/PretextCopyLab";
import ComboMeter from "@/components/ComboMeter";
import MakerLab from "@/components/MakerLab";
import Hobbies from "@/components/Hobbies";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ProofStrip from "@/components/home/ProofStrip";
import CurrentPosition from "@/components/home/CurrentPosition";
import FlagshipCaseStudies from "@/components/home/FlagshipCaseStudies";
import SystemsLabPreview from "@/components/home/SystemsLabPreview";
import LatestNotes from "@/components/home/LatestNotes";
import CredibilityPanel from "@/components/home/CredibilityPanel";
import ContactAvailability from "@/components/home/ContactAvailability";
import HomeInteractiveLayer from "@/components/home/HomeInteractiveLayer";
import HomeSideChrome from "@/components/home/HomeSideChrome";
import HomeSignalDivider from "@/components/home/HomeSignalDivider";
import BuildInfoFooter from "@/components/home/BuildInfoFooter";
import LivingIndex from "@/components/home/LivingIndex";
import ProofJourneyMotion from "@/components/home/ProofJourneyMotion";

export const metadata: Metadata = {
  title: "Shantanu Soam — Creative Systems Engineer",
  description:
    "A playful portfolio of product engineering, interactive systems, measurable outcomes, writing, and original experiments.",
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
      sameAs: [
        "https://github.com/shantanusoam",
        "https://www.linkedin.com/in/shantanu007/",
      ],
      knowsAbout: [
        "Next.js",
        "React",
        "TypeScript",
        "Interactive systems",
        "AI agents",
        "Canvas animation",
      ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeInteractiveLayer />
      <ProofJourneyMotion />
      <Navbar />
      <HomeSideChrome />

      <main className="text-clip">
        <div className="container">
          <Hero masked={false} />
        </div>

        <ProofStrip />

        <CurrentPosition />
        <LivingIndex />
        <FlagshipCaseStudies />

        <div className="container">
          <AboutStudioSection />
          <Experience />
          <Projects />
        </div>

        <div className="container">
          <PatternLibrary />
          <PretextCopyLab />
          <ComboMeter />
          <MakerLab />
        </div>

        <SystemsLabPreview />

        <div className="container">
          <Hobbies />
        </div>

        <LatestNotes />
        <CredibilityPanel />
        <HomeSignalDivider />
        <ContactAvailability />

        <div className="container">
          <Contact />
          <Footer />
        </div>

        <BuildInfoFooter />
      </main>
    </>
  );
}
