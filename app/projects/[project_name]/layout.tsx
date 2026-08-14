import type { Metadata } from "next";
import type { ReactNode } from "react";
import { projects } from "@/constants/projects";

interface MetadataProps{
  params: Promise<{ project_name: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { project_name: projectId } = await params;
  const project = projects.find((item) => item.id === projectId);
  const projectName = project?.title ?? projectId.slice(0,1).toUpperCase()+projectId.slice(1).replaceAll("_", " ");
  return {
    title: `${projectName} — Shantanu Soam`,
    description: project?.description ?? "A Shantanu Soam engineering case study.",
    alternates: { canonical: `/projects/${projectId}` },
    openGraph: { title: `${projectName} — Shantanu Soam`, description: project?.description ?? "Engineering case study", images: [`/projects/${projectId}/opengraph-image`] },
  };
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <main className="container overflow-hidden">{children}</main>;
}
