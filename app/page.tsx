import type { Metadata, Viewport } from "next";
import AboutSection from "@/components/workshop/AboutSection";
import FieldNotes from "@/components/workshop/FieldNotes";
import SelectedWork from "@/components/workshop/SelectedWork";
import WorkshopContact from "@/components/workshop/WorkshopContact";
import WorkshopHero from "@/components/workshop/WorkshopHero";
import WorkshopNav from "@/components/workshop/WorkshopNav";
import WorkingSketch from "@/components/workshop/WorkingSketch";

/**
 * Tomorrow's Workshop — the six-scene homepage (brief §4).
 * Native scrolling, stable identity, one contained illustration, one
 * working sketch. Old hash destinations are preserved as zero-height
 * aliases so pre-redesign links keep working.
 */
export const metadata: Metadata = {
  title: "Shantanu Soam — Useful software. A future worth building.",
  description:
    "Full-stack engineer and creative technologist building business software, interactive tools and playful experiments. Selected work, a working sketch, field notes and a direct route to contact.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F3EEDC",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://shantanusoam.vercel.app/#person",
      name: "Shantanu Soam",
      url: "https://shantanusoam.vercel.app",
      jobTitle: "Full-stack Engineer & Creative Technologist",
      description:
        "Builds business software, interactive tools and playful experiments; keeps useful systems running and legible.",
      sameAs: [
        "https://github.com/shantanusoam",
        "https://www.linkedin.com/in/shantanu007/",
      ],
      knowsAbout: [
        "Next.js",
        "React",
        "TypeScript",
        "Interactive systems",
        "Procedural animation",
        "AI agents",
      ],
    },
    {
      "@type": "ProfilePage",
      name: "Shantanu Soam — Useful software. A future worth building.",
      url: "https://shantanusoam.vercel.app",
      mainEntity: { "@id": "https://shantanusoam.vercel.app/#person" },
    },
  ],
};

/** Zero-height alias for a pre-redesign hash link (brief §13). */
function AnchorAlias({ id }: { id: string }) {
  return <span id={id} aria-hidden="true" className="ws-anchor-alias" />;
}

export default function Home() {
  return (
    <div className="workshop-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Without JS, the reveal grammar must never hide content. */}
      <noscript>
        <style>{`.ws-reveal{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      <a href="#work" className="ws-skip-link">
        Skip to the work
      </a>
      <WorkshopNav />
      <main>
        <WorkshopHero />

        {/* old destinations → new scenes */}
        <AnchorAlias id="hero" />
        <AnchorAlias id="proof" />
        <AnchorAlias id="mission-select" />
        <AnchorAlias id="case-studies" />
        <SelectedWork />

        <AnchorAlias id="maker-lab" />
        <AnchorAlias id="living-index" />
        <AnchorAlias id="signal-room" />
        <WorkingSketch />

        <AnchorAlias id="field-notes" />
        <AnchorAlias id="latest-notes" />
        <FieldNotes />

        <AnchorAlias id="about" />
        <AnchorAlias id="trail-map" />
        <AnchorAlias id="pattern-library" />
        <AboutSection />

        <AnchorAlias id="contact" />
        <WorkshopContact />
      </main>
    </div>
  );
}
