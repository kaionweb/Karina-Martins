import type { Config } from "tailwindcss";
import cinemaPreset from "../../packages/ui/src/tailwind-preset";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [cinemaPreset as Config],
  theme: {
    extend: {
      keyframes: {
        twinkle: { "0%, 100%": { opacity: "0.2" }, "50%": { opacity: "0.9" } },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        orbit: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "orbit-reverse": { from: { transform: "rotate(360deg)" }, to: { transform: "rotate(0deg)" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        "float-delayed": { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-14px)" } },
        launch: {
          "0%, 100%": { transform: "translate(0, 0) rotate(-25deg)" },
          "50%": { transform: "translate(-4px, -6px) rotate(-25deg)" },
        },
        "shooting-star": {
          "0%": { transform: "translate(0, 0) scale(0)", opacity: "0" },
          "10%": { transform: "translate(-20px, 20px) scale(1)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "translate(-200px, 200px) scale(0.2)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 20px 60px -10px rgb(232 51 42 / 0.5), 0 0 0 0 rgb(232 51 42 / 0.3)" },
          "50%": { boxShadow: "0 20px 60px -10px rgb(232 51 42 / 0.7), 0 0 0 12px rgb(232 51 42 / 0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-14deg)" },
          "75%": { transform: "rotate(14deg)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgb(232 51 42 / 0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgb(232 51 42 / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(232 51 42 / 0)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(-6px) rotate(3deg)" },
        },
        "pop-check": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "match-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        "fade-in-sm": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        twinkle: "twinkle 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) backwards",
        "fade-in-up-lg": "fade-in-up 0.7s cubic-bezier(0.22,1,0.36,1) backwards",
        "fade-in": "fade-in 1s ease-out backwards",
        "orbit-medium": "orbit 20s linear infinite",
        "orbit-reverse": "orbit-reverse 25s linear infinite",
        "float-a": "float 4s ease-in-out infinite",
        "float-b": "float-delayed 5s ease-in-out infinite",
        launch: "launch 3s ease-in-out infinite",
        shooting: "shooting-star 6s ease-out infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        wave: "wave 0.6s ease-in-out",
        "pulse-ring": "pulse-ring 2s infinite",
        bob: "bob 3s ease-in-out infinite",
        "pop-check": "pop-check 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        "pop-in": "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        "match-pulse": "match-pulse 0.4s ease",
        "fade-in-sm": "fade-in-sm 0.3s ease",
      },
    },
  },
  plugins: [],
};

export default config;
