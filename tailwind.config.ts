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
        gold: "#c9a227",
        "gold-dark": "#9a7b1a",
        sky: "#1e6fd9",
        ivory: "#fffdf5",
        cream: "#fdf8ec",
      },
    },
  },
  plugins: [],
};
export default config;
