import type { Config } from "tailwindcss";

// Tokens espelhados de virttus-lp_1.html — fonte única de verdade visual.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        deep: "#0B1B3A",
        "deep-700": "#152647",
        "deep-600": "#1E3358",
        blue: "#2563EB",
        "blue-600": "#1D4ED8",
        purple: "#7C3AED",
        "purple-600": "#6D28D9",
        bg: "#F6F8FC",
        surface: "#FFFFFF",
        muted: "#64748B",
        "muted-light": "#94A3B8",
        border: "#E7ECF3",
        "border-strong": "#D5DEEA",
        success: "#16A34A",
        "success-soft": "#DCFCE7",
        warn: "#D97706",
        "warn-soft": "#FEF3C7",
        danger: "#DC2626",
        "danger-soft": "#FEE2E2",
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        xl: "16px",
        sm: "12px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(11,27,58,0.05)",
        sm: "0 1px 3px rgba(11,27,58,0.06), 0 1px 2px rgba(11,27,58,0.04)",
        DEFAULT: "0 4px 16px rgba(11,27,58,0.08), 0 2px 6px rgba(11,27,58,0.04)",
        md: "0 8px 32px rgba(11,27,58,0.1), 0 4px 12px rgba(11,27,58,0.06)",
        lg: "0 20px 60px rgba(11,27,58,0.12), 0 8px 24px rgba(11,27,58,0.08)",
        glow: "0 0 40px rgba(124,58,237,0.15)",
        "glow-blue": "0 8px 24px rgba(37,99,235,0.25)",
      },
      backgroundImage: {
        grad: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        "grad-135": "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        "grad-deep": "linear-gradient(150deg, #0B1B3A 0%, #1E3358 60%, #2A2B6B 100%)",
        "grad-soft":
          "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)",
        "grad-mesh":
          "radial-gradient(60% 60% at 15% 10%, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 60%), radial-gradient(50% 50% at 90% 20%, rgba(124,58,237,0.10) 0%, rgba(124,58,237,0) 55%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
