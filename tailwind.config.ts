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
        midnight: { 950: "#04061a", 900: "#081026", 800: "#0b1230", 700: "#101b45" },
        ink: "#0a1128",
      },
      boxShadow: {
        glow: "0 0 24px rgba(251,191,36,0.25)",
        glass: "0 10px 30px rgba(2,6,23,0.45)",
      },
      animation: { float: "drift 16s ease-in-out infinite alternate" },
    },
  },
  plugins: [],
};
export default config;
