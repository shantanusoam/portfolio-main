import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { dataFont, displayFont, editorialFont } from "@/lib/fonts";
import { createCommandIndex } from "@/lib/archive/command-index";
import { getPublicOrigin } from "@/lib/oauth/config";
import PortfolioRuntime from "@/components/providers/PortfolioRuntime";
import PortfolioAnalytics from "@/components/analytics/PortfolioAnalytics";

const inter = Inter({ subsets: ["latin"] });
const commandEntries = createCommandIndex();
const publicOrigin = getPublicOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: "Shantanu Soam — Staff Engineer | Full-Stack Systems & AI Voice",
  description:
    "Staff engineer building multi-tenant software, high-performance frontends, AI voice orchestration, and hardware-connected systems.",
  alternates: { canonical: "/" },
  authors: [{ name: "Shantanu Soam", url: publicOrigin }],
  creator: "Shantanu Soam",
  publisher: "Shantanu Soam",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Shantanu Soam's Portfolio",
    title: "Shantanu Soam — Staff Engineer | Full-Stack Systems & AI Voice",
    description:
      "Staff engineer building multi-tenant software, high-performance frontends, AI voice orchestration, and hardware-connected systems.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Shantanu Soam — Staff Engineer | Full-Stack Systems & AI Voice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shantanu Soam — Staff Engineer | Full-Stack Systems & AI Voice",
    description:
      "Full-stack architecture, AI voice systems, performance engineering, and interactive product experiments.",
    images: ["/opengraph-image"],
  },
  keywords: [
    "portfolio",
    "Shantanu",
    "soam",
    "Shantanu soam",
    "frontend",
    "react",
    "nextjs",
    "developer",
    "backend",
    "staff engineer",
    "system design",
    "AI voice",
    "realtime audio",
    "orchestration",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${displayFont.variable} ${dataFont.variable} ${editorialFont.variable}`}
      >
        <PortfolioAnalytics />
        <PortfolioRuntime entries={commandEntries}>{children}</PortfolioRuntime>
      </body>
    </html>
  );
}
