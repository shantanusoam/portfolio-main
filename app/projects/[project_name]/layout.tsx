import type { Metadata } from "next";
import type { ReactNode } from "react";
import { projects } from "@/constants/projects";

interface MetadataProps{
  params: { project_name: string };
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const project = projects.find((item) => item.id === params.project_name);
  const projectName = project?.title ?? params.project_name.slice(0,1).toUpperCase()+params.project_name.slice(1).replaceAll("_", " ");
  return {
    title: `${projectName} — Shantanu Soam`,
    description: project?.description ?? "A Shantanu Soam engineering case study.",
    alternates: { canonical: `/projects/${params.project_name}` },
    openGraph: { title: `${projectName} — Shantanu Soam`, description: project?.description ?? "Engineering case study", images: [`/projects/${params.project_name}/opengraph-image`] },
  };
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <main className="container overflow-hidden">{children}</main>;
}
