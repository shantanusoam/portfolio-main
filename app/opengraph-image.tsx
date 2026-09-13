import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shantanu Soam — Useful software. Room to imagine.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 70px",
          color: "#e7edda",
          background: "#07110e",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #e7edda40",
            paddingBottom: 24,
            fontSize: 21,
          }}
        >
          <span>Shantanu Soam</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 16 }}>
            Creative Systems Engineer
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 83,
            letterSpacing: -3,
            lineHeight: 1.05,
          }}
        >
          <span>Useful software.</span>
          <div style={{ display: "flex" }}>
            <span>Room to</span>
            <span style={{ color: "#c8dba4", fontStyle: "italic", marginLeft: 18 }}>
              imagine.
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "sans-serif",
            fontSize: 17,
            borderTop: "1px solid #e7edda40",
            paddingTop: 24,
          }}
        >
          <span>Product engineering · Interactive systems · Field notes</span>
          <span>shantanusoam.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
