/**
 * Paleta de gradientes do design system "cinema" para os pôsteres de trilha.
 *
 * `Show.thumbnailKey` é uma chave textual (não uma cor/gradiente pronto) e o
 * `CLAUDE.md` exige "thumbnails = artes próprias do design system". Por isso o
 * visual de cada card é gerado a partir desta paleta local, ciclando por índice,
 * em vez de inventar uma interpretação de `thumbnailKey` (Artigo IV — No Invention).
 *
 * As três primeiras entradas reaproveitam os gradientes antes hardcoded em
 * `_mock/content.ts#trilhas`; as duas últimas são variações na mesma paleta.
 * Compartilhado para reuso pela Story 10.3 (card "Continuar aprendendo").
 */
export const POSTER_GRADIENTS: string[] = [
  "linear-gradient(160deg,#FBC607 0%,#DA233B 55%,#7A1424 100%)",
  "linear-gradient(160deg,#4799C1 0%,#2D65AE 60%,#0F2A4D 100%)",
  "linear-gradient(160deg,#4799C1 0%,#1E4A85 55%,#0B1F3A 100%)",
  "linear-gradient(160deg,#DA233B 0%,#1E4A85 55%,#12203D 100%)",
  "linear-gradient(160deg,#FBC607 0%,#4799C1 55%,#123B5C 100%)",
];

/**
 * Retorna um gradiente da paleta de forma determinística por índice,
 * ciclando quando a lista de trilhas é maior que a paleta.
 */
export function gradientForIndex(index: number): string {
  return POSTER_GRADIENTS[index % POSTER_GRADIENTS.length];
}

export interface TrailAccent {
  /** gradiente sólido pra ícone/estado "atual" (não o pôster de fundo) */
  solid: string;
  glow: string;
  tint: string;
  tint2: string;
  border: string;
  text: string;
  chipBg: string;
}

/**
 * Paleta de cores sólidas (glow/borda/chip) sincronizada por índice com
 * POSTER_GRADIENTS acima, pra que a tela de detalhe da trilha (hero, barra de
 * progresso, destaque da lição atual) use a mesma cor que já identifica
 * aquela trilha na Home/Explorar — em vez de fixar vermelho pra qualquer uma.
 */
const TRAIL_ACCENTS: TrailAccent[] = [
  {
    solid: "linear-gradient(135deg, #DA233B, #FBC607)",
    glow: "rgba(218,35,59,0.5)",
    tint: "rgba(218,35,59,0.15)",
    tint2: "rgba(251,198,7,0.1)",
    border: "rgba(218,35,59,0.35)",
    text: "#DA233B",
    chipBg: "rgba(218,35,59,0.2)",
  },
  {
    solid: "linear-gradient(135deg, #2D65AE, #4799C1)",
    glow: "rgba(45,101,174,0.5)",
    tint: "rgba(45,101,174,0.15)",
    tint2: "rgba(71,153,193,0.1)",
    border: "rgba(45,101,174,0.35)",
    text: "#2D65AE",
    chipBg: "rgba(45,101,174,0.2)",
  },
  {
    solid: "linear-gradient(135deg, #1E4A85, #DA233B)",
    glow: "rgba(30,74,133,0.5)",
    tint: "rgba(30,74,133,0.15)",
    tint2: "rgba(218,35,59,0.1)",
    border: "rgba(30,74,133,0.35)",
    text: "#1E4A85",
    chipBg: "rgba(30,74,133,0.2)",
  },
  {
    solid: "linear-gradient(135deg, #4799C1, #FBC607)",
    glow: "rgba(71,153,193,0.5)",
    tint: "rgba(71,153,193,0.15)",
    tint2: "rgba(251,198,7,0.1)",
    border: "rgba(71,153,193,0.35)",
    text: "#4799C1",
    chipBg: "rgba(71,153,193,0.2)",
  },
  {
    solid: "linear-gradient(135deg, #1E4A85, #4799C1)",
    glow: "rgba(30,74,133,0.5)",
    tint: "rgba(30,74,133,0.15)",
    tint2: "rgba(71,153,193,0.1)",
    border: "rgba(30,74,133,0.35)",
    text: "#1E4A85",
    chipBg: "rgba(30,74,133,0.2)",
  },
];

/** Mesmo ciclo por índice de gradientForIndex, mas pra tons sólidos (accent). */
export function accentForIndex(index: number): TrailAccent {
  return TRAIL_ACCENTS[index % TRAIL_ACCENTS.length];
}
