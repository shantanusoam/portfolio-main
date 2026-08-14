import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import PageScrollProgress from "@/components/ui/PageScrollProgress";
import { dataFont, displayFont, editorialFont } from "@/lib/fonts";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import PageAtmosphere from "@/components/ui/PageAtmosphere";
import ProceduralMascotLoader from "@/components/mascot/ProceduralMascotLoader";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";
import { createCommandIndex } from "@/lib/archive/command-index";
import { getPublicOrigin } from "@/lib/oauth/config";

const inter = Inter({ subsets: ["latin"] });
const commandEntries = createCommandIndex();
const publicOrigin = getPublicOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: "Shantanu Soam — Creative Systems Engineer",
  description:
    "A creative systems engineer building fast software, playful interfaces, AI tools, and hardware experiments.",
  alternates: { canonical: "/" },
  authors: [{ name: "Shantanu Soam", url: publicOrigin }],
  creator: "Shantanu Soam",
  publisher: "Shantanu Soam",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Shantanu Soam's Portfolio",
    title: "Shantanu Soam — Creative Systems Engineer",
    description:
      "A creative systems engineer building fast software, playful interfaces, AI tools, and hardware experiments.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Shantanu Soam — Creative Systems Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shantanu Soam — Creative Systems Engineer",
    description:
      "Product engineering, interactive systems, and a playable lab of original experiments.",
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
        <CommandPaletteProvider entries={commandEntries}>
          <PageAtmosphere />
          <PageScrollProgress />
          <ProceduralMascotLoader />
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
