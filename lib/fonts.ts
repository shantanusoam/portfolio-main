// eslint-disable-next-line camelcase
import { Anton, IBM_Plex_Mono, Newsreader } from "next/font/google";

// Bold impact headline face — legacy dark-theme routes only (not composed
// into the Tomorrow's Workshop homepage). Not preloaded: those routes fetch
// it on demand from the CSS variable.
export const displayFont = Anton({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-display",
});

// Archival typewriter mono — backs `font-mono`/`--font-mono` everywhere.
// IBM Plex Mono has the warm slab terminals the Crafted Systems Archive
// reference art uses for checkpoint labels, counters and company names.
// Two weights only: 400 for annotations, 600 for diagram emphasis.
export const dataFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-data",
});

// A quieter editorial face for long-form titles and reading surfaces. Anton
// remains the portfolio's impact voice; Newsreader makes the archive feel like
// a publication instead of another project section.
// Variable axis (no `weight`): one file per style covers 400–600, which the
// workshop CSS actually uses — no synthesized weights, no retired faces.
// Italic is required by the Tomorrow's Workshop homepage: the serif
// reserves italics for meaning (the hopeful clause), not decoration.
// Metric-adjusted fallback stays on — the headline must not reflow on swap.
export const editorialFont = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
});
