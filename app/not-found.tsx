import dynamic from "next/dynamic";

const Break404 = dynamic(() => import("@/components/not-found-breaker/Break404"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[100dvh] w-[100dvw] items-center justify-center overflow-clip"
      style={{ background: "#080807", color: "rgba(238, 233, 223, 0.56)" }}
    >
      <p
        style={{
          fontFamily: "var(--font-data), monospace",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontSize: "0.75rem",
        }}
      >
        Loading the break…
      </p>
    </div>
  ),
});

export default function NotFoundPage() {
  return <Break404 />;
}
