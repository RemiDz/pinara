import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: "#0B0A2E",
          deep: "#0B0A2E",
        },
        pineal: {
          DEFAULT: "#E8B86D",
          gold: "#E8B86D",
        },
        lunar: {
          DEFAULT: "#C4CAD0",
          silver: "#C4CAD0",
        },
        chamber: "#000000",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        oracle: ["Cormorant Garamond", "Cormorant", "ui-serif", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        breathe: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
      transitionDuration: {
        breathe: "600ms",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        pulse_heart: {
          "0%, 100%": { transform: "scale(1)" },
          "12%": { transform: "scale(1.04)" },
          "20%": { transform: "scale(1)" },
          "32%": { transform: "scale(1.02)" },
          "40%": { transform: "scale(1)" },
        },
      },
      animation: {
        breathe: "breathe 5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite",
        heart: "pulse_heart 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
