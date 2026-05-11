import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d0f",
        surface: "#15181d",
        border: "#252a31",
        text: "#e8eaed",
        muted: "#9aa3ad",
        accent: "#7cc4a4",
        warn: "#e8b06b",
        danger: "#e87b6b",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
