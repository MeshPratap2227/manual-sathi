import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f7f8fa",
        navy: "#173a59",
        line: "#e4e7ec",
        muted: "#667085",
      },
      boxShadow: {
        soft: "0 12px 35px rgba(16, 24, 40, 0.05)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
