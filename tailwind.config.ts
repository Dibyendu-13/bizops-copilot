import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#081018",
        panel: "#0f1b29",
        panel2: "#132235",
        line: "rgba(255,255,255,0.08)",
        accent: "#65d1ff",
        accent2: "#89f7a1",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(101,209,255,0.15), 0 20px 60px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
