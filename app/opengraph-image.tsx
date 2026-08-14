import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shantanu Soam — Creative Systems Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "68px", color: "#eee9df", background: "radial-gradient(circle at 75% 25%, #35170f 0, #0a0908 43%, #050505 100%)", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 5, textTransform: "uppercase" }}><span style={{ color: "#ff5d2f" }}>SS / Signal Archive</span><span>Creative Systems Engineer</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 92, lineHeight: 0.92, letterSpacing: -5 }}>Strange interfaces.<br />Serious evidence.</div><div style={{ marginTop: 30, fontSize: 24, color: "#a9a39a" }}>Product systems · interactive tools · measurable outcomes</div></div>
      <div style={{ display: "flex", gap: 38, fontSize: 18, textTransform: "uppercase", letterSpacing: 3 }}><span>30%↓ latency</span><span>15+ fixes</span><span>10k+ rows</span></div>
    </div>,
    size,
  );
}
