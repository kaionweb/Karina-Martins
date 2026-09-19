/**
 * Tokens do tema "cinema" (Fase 1 · Design System), extraídos de
 * docs/prototipo/layout-app-ingles.jsx. Namespaced (`cinema*`) para não
 * colidir com os tokens shadcn existentes em ./colors.ts, ainda usados por
 * login/register/select-profile/dashboard/catalog.
 *
 * Valores em RGB (não hex) porque é o formato que o preset Tailwind
 * (../tailwind-preset.ts) espera para habilitar opacidade via `bg-cinema-primary/20`.
 * A fonte de verdade em CSS é ./cinema.css — mantenha os dois em sincronia.
 *
 * Branch rebrand/karina-martins: paleta clara do Colégio Karina Martins no
 * lugar do tema escuro/espacial original — ver REBRAND_BRIEF.md do cliente.
 */

export const cinemaColors = {
  bg: "247 249 252", // #F7F9FC
  surface: "255 255 255", // #FFFFFF
  surfaceAlt: "238 243 249", // #EEF3F9
  border: "229 234 242", // #E5EAF2
  text: "26 36 51", // #1A2433
  muted: "92 107 125", // #5C6B7D
  primary: "45 101 174", // #2D65AE
  primaryAlt: "71 153 193", // #4799C1
  amber: "251 198 7", // #FBC607
  blue: "30 74 133", // #1E4A85
  green: "62 207 142", // #3ECF8E (semântico de sucesso — mantido)
} as const;

export const cinemaRadius = {
  sm: "14px",
  md: "18px",
  lg: "20px",
  full: "999px",
} as const;

export const cinemaShadow = {
  glow: "0 6px 18px -6px rgb(45 101 174 / 0.35)",
  orb: "0 12px 26px -8px rgb(45 101 174 / 0.45)",
  elevated: "0 8px 20px rgb(0 0 0 / 0.08)",
} as const;
