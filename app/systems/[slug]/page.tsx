import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import RegistryTabs from "@/components/systems/RegistryTabs";
import { systemsRegistry } from "@/lib/portfolio/evidence";
import styles from "@/components/home/ProofFirstHome.module.css";

type Props = { params: { slug: string } };

export function generateStaticParams() { return systemsRegistry.map((entry) => ({ slug: entry.slug })); }

export function generateMetadata({ params }: Props): Metadata {
  const entry = systemsRegistry.find((item) => item.slug === params.slug);
  if (!entry) return {};
  return { title: `${entry.name} — Systems Lab`, description: entry.description, alternates: { canonical: `/systems/${entry.slug}` }, openGraph: { images: [entry.image] } };
}

export default function SystemDetailPage({ params }: Props) {
  const entry = systemsRegistry.find((item) => item.slug === params.slug);
  if (!entry) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "SoftwareSourceCode", name: entry.name, description: entry.description, codeRepository: entry.sourceHref, programmingLanguage: entry.tech, author: { "@type": "Person", name: "Shantanu Soam" } };
  return (
    <main className={styles.registryPage}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className={styles.registryHero}><span className={styles.eyebrow}>Systems Lab / {entry.status}</span><p><a className={styles.registryLink} href="/systems">← Back to registry</a></p></header>
      <article className={styles.registryDetail}>
        <div className={styles.registryDetailVisual}><Image alt={`${entry.name} conceptual system artifact`} fill priority sizes="(max-width: 980px) 100vw, 44vw" src={entry.image} /></div>
        <div className={styles.registryDetailCopy}><span className={styles.eyebrow}>{entry.tech.join(" / ")}</span><h1>{entry.name}</h1><p>{entry.description}</p><RegistryTabs entry={entry} /></div>
      </article>
    </main>
  );
}
