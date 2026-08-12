import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import PageScrollProgress from "@/components/ui/PageScrollProgress";
import { dataFont, displayFont, editorialFont } from "@/lib/fonts";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import PageAtmosphere from "@/components/ui/PageAtmosphere";
import ProceduralMascotLoader from "@/components/mascot/ProceduralMascotLoader";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";
import { createCommandIndex } from "@/lib/archive/command-index";

const inter = Inter({ subsets: ["latin"] });
const commandEntries = createCommandIndex();

export const metadata: Metadata = {
  metadataBase: new URL("https://shantanusoam.vercel.app"),
  title: "Shantanu Soam — Creative Systems Engineer",
  description:
    "A creative systems engineer building fast software, playful interfaces, AI tools, and hardware experiments.",
  openGraph: {
    type: "website",
    siteName: "Shantanu Soam's Portfolio",
    title: "Shantanu Soam — Creative Systems Engineer",
    description:
      "A creative systems engineer building fast software, playful interfaces, AI tools, and hardware experiments.",
    images: [
      {
        url: "https://portfolio-main-jkzj-git-main-shantanusoams-projects.vercel.app/logo.png",
      },
    ],
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
