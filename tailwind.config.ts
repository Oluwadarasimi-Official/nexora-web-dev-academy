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
        sky: {
          DEFAULT: "#1e6fd9",
          dark: "#185cb5",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#1e6fd9",
          600: "#1a63c2",
          700: "#185cb5",
          800: "#144e9c",
        },
        ivory: "#fffdf5",
        cream: "#fdf8ec",
      },
      boxShadow: {
        card: "0 1px 3px rgba(10,42,94,0.07), 0 6px 18px rgba(10,42,94,0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
