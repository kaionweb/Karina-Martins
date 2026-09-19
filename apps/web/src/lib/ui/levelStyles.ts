/**
 * Sistema de cor por nível (Básico/Intermediário/Avançado) — cada nível tem
 * paleta própria pra o olho aprender o código visual em vez de ler o texto.
 * Extraído do Explorar pra ser compartilhado com Séries e Filmes, que usam o
 * mesmo sistema (não uma variação própria).
 */
export type Nivel = "Básico" | "Intermediário" | "Avançado";

export interface LevelStyle {
  label: Nivel;
  chipBg: string;
  cardGradient: string;
  glow: string;
}

export const LEVEL_STYLES: Record<Nivel, LevelStyle> = {
  Básico: {
    label: "Básico",
    chipBg: "linear-gradient(135deg, #2D65AE, #4799C1)",
    cardGradient: "from-[#2D65AE] to-[#4799C1]",
    glow: "rgba(45,101,174,0.4)",
  },
  Intermediário: {
    label: "Intermediário",
    chipBg: "linear-gradient(135deg, #DA233B, #FBC607)",
    cardGradient: "from-[#DA233B] to-[#FBC607]",
    glow: "rgba(218,35,59,0.4)",
  },
  Avançado: {
    label: "Avançado",
    chipBg: "linear-gradient(135deg, #1E4A85, #DA233B)",
    cardGradient: "from-[#1E4A85] to-[#DA233B]",
    glow: "rgba(30,74,133,0.4)",
  },
};

export function levelStyle(nivel: string): LevelStyle {
  return LEVEL_STYLES[nivel as Nivel] ?? LEVEL_STYLES.Básico;
}
