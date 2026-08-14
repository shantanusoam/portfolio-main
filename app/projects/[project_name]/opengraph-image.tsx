import { ImageResponse } from "next/og";
import { projects } from "@/constants/projects";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProjectOpenGraphImage({ params }: { params: Promise<{ project_name: string }> }) {
  const { project_name: projectId } = await params;
  const project = projects.find((item) => item.id === projectId);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 68, flexDirection: "column", justifyContent: "space-between", color: "#eee9df", background: "linear-gradient(135deg,#060606 0%,#17100d 65%,#35160f 100%)", fontFamily: "sans-serif" }}>
      <div style={{ color: "#ff5d2f", fontSize: 18, letterSpacing: 5, textTransform: "uppercase" }}>Case study / {project?.metadata?.join(" · ") ?? "System"}</div>
      <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 100, lineHeight: 0.92, letterSpacing: -5 }}>{project?.title ?? "Project"}</div><div style={{ maxWidth: 900, marginTop: 26, color: "#aaa39a", fontSize: 24 }}>{project?.description ?? "A Shantanu Soam engineering case study."}</div></div>
      <div style={{ fontSize: 17, letterSpacing: 4, textTransform: "uppercase" }}>Problem · decision · shipped result · lesson</div>
    </div>,
    size,
  );
}
