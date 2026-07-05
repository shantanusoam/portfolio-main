import { Anton, JetBrains_Mono } from 'next/font/google';

// Bold impact headline face — hero, mission card titles, checkpoint numerals.
export const displayFont = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

// Monospace data face — also backs the `font-mono` Tailwind class already used
// in Skills.tsx/Projects.tsx, which previously had no real mapping and fell
// back to the browser default monospace stack.
export const dataFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-data',
});
