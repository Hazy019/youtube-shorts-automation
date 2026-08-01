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
        obsidian: "#0B0F17",
        surface: "#11161F",
        accent: {
          lime: "#AAFF5E",
          amber: "#F59E0B",
          violet: "#A855F7",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-syne)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      dropShadow: {
        glow: "0 0 12px rgba(170, 255, 94, 0.35)",
        "glow-lg": "0 0 30px rgba(170, 255, 94, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
