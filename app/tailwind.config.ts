import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Values are CSS custom properties (defined in globals.css) rather
      // than literal hex, so every class below is automatically light/dark
      // aware without touching component code.
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        accent2: "var(--accent-2)",
        ink: "var(--ink)",
        success: "var(--success)",
        successBg: "var(--success-bg)",
        warn: "var(--warn)",
        warnBg: "var(--warn-bg)",
        danger: "var(--danger)",
        dangerBg: "var(--danger-bg)",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
