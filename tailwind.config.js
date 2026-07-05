/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-light": "var(--primary-light)",
        "primary-dark": "var(--primary-dark)",
        black: "var(--black)",
        white: "var(--white)",
        gray: "var(--gray)",
        darkgray: "var(--darkgray)",
        graytransparent: "var(--graytransparent)",
        ink: "var(--ink)",
        paper: "var(--paper)",
        "combo-lit": "var(--combo-lit)",
        "combo-unlit": "var(--combo-unlit)"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        data: ["var(--font-data)", "monospace"],
        // Maps the already-in-use `font-mono` class (Skills.tsx, Projects.tsx)
        // onto the new data font instead of the browser's default monospace.
        mono: ["var(--font-data)", "monospace"]
      }
    },
  },
  plugins: [],
}
