import type { Config } from "tailwindcss";

/**
 * Preset Tailwind do tema "cinema" (Fase 1 · Design System).
 * Consumido por apps/web/tailwind.config.ts via `presets: [cinemaPreset]`.
 * As variáveis --cinema-* referenciadas aqui são definidas em
 * apps/web/src/app/globals.css (ver src/tokens/cinema.css para a fonte
 * de documentação) e --font-display/--font-body em apps/web/src/app/layout.tsx.
 */
const cinemaPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: "rgb(var(--cinema-bg) / <alpha-value>)",
          surface: "rgb(var(--cinema-surface) / <alpha-value>)",
          "surface-alt": "rgb(var(--cinema-surface-alt) / <alpha-value>)",
          border: "rgb(var(--cinema-border) / <alpha-value>)",
          text: "rgb(var(--cinema-text) / <alpha-value>)",
          muted: "rgb(var(--cinema-muted) / <alpha-value>)",
          primary: "rgb(var(--cinema-primary) / <alpha-value>)",
          "primary-alt": "rgb(var(--cinema-primary-alt) / <alpha-value>)",
          amber: "rgb(var(--cinema-amber) / <alpha-value>)",
          blue: "rgb(var(--cinema-blue) / <alpha-value>)",
          green: "rgb(var(--cinema-green) / <alpha-value>)",
        },
      },
      borderRadius: {
        "cinema-sm": "var(--cinema-radius-sm)",
        "cinema-md": "var(--cinema-radius-md)",
        "cinema-lg": "var(--cinema-radius-lg)",
        "cinema-full": "var(--cinema-radius-full)",
      },
      boxShadow: {
        "cinema-glow": "var(--cinema-shadow-glow)",
        "cinema-orb": "var(--cinema-shadow-orb)",
        "cinema-elevated": "var(--cinema-shadow-elevated)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
};

export default cinemaPreset;
