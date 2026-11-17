import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0a2a5e",
        "navy-dark": "#071e45",
        ink: "#0a1128",
        gold: "#c9a227",
        "gold-dark": "#9a7b1a",
        champagne: "#e7cd7a",
        /* v7: champagne gold is the ONLY accent. The old "sky" blue scale is
           gone — the name is kept ONLY as a compatibility alias so legacy
           classes (in pages this pass does not own) still render gold,
           never blue. Nothing on the site renders blue any more. */
        sky: {
          DEFAULT: "#c9a227",
          dark: "#9a7b1a",
          50: "#fbf6e4",
          100: "#f6ecd0",
          200: "#eedd9f",
          500: "#c9a227",
          600: "#9a7b1a",
          700: "#7d6415",
          800: "#6b5512",
        },
        ivory: "#fffdf5",
        cream: "#fdf8ec",
      },
      fontFamily: {
        /* Fraunces — a warm, classic serif with character — for display
           headings only. Body stays a clean system sans. */
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(10,42,94,0.07), 0 6px 18px rgba(10,42,94,0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
