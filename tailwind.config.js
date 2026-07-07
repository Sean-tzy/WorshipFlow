/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Geist", "Satoshi", "ui-sans-serif", "system-ui"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#09090B",
        panel: "#111113",
        line: "rgba(255,255,255,0.1)",
        violet: "#8B5CF6",
        azure: "#38BDF8",
        mint: "#34D399",
      },
      boxShadow: {
        glow: "0 0 60px rgba(139,92,246,0.26)",
        soft: "0 24px 80px rgba(0,0,0,0.42)",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};
