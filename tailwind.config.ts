import type { Config } from "tailwindcss";

// Tokens espelhados de virttus-lp_1.html — fonte única de verdade visual.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        deep: "#0B1B3A",
        blue: "#2563EB",
        purple: "#7C3AED",
        bg: "#F8FAFC",
        muted: "#64748B",
        border: "#E2E8F0",
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        sm: "12px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(11,27,58,0.06), 0 1px 2px rgba(11,27,58,0.04)",
        DEFAULT: "0 4px 16px rgba(11,27,58,0.08), 0 2px 6px rgba(11,27,58,0.04)",
        md: "0 8px 32px rgba(11,27,58,0.1), 0 4px 12px rgba(11,27,58,0.06)",
        lg: "0 20px 60px rgba(11,27,58,0.12), 0 8px 24px rgba(11,27,58,0.08)",
        glow: "0 0 40px rgba(124,58,237,0.15)",
      },
      backgroundImage: {
        grad: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        "grad-soft":
          "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
