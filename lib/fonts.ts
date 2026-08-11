// eslint-disable-next-line camelcase
import { Anton, IBM_Plex_Mono, Newsreader } from "next/font/google";

// Bold impact headline face — hero, mission card titles, checkpoint numerals.
export const displayFont = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

// Archival typewriter mono — backs `font-mono`/`--font-mono` everywhere.
// IBM Plex Mono has the warm slab terminals the Crafted Systems Archive
// reference art uses for checkpoint labels, counters and company names.
export const dataFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-data",
});

// A quieter editorial face for long-form titles and reading surfaces. Anton
// remains the portfolio's impact voice; Newsreader makes the archive feel like
// a publication instead of another project section.
export const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  adjustFontFallback: false,
  variable: "--font-editorial",
});
