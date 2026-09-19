/**
 * Nível derivado do XP total (função pura, sem persistência nem schema).
 *
 * Regra de domínio (Story 10.2, decidida explicitamente no gate):
 * - 200 XP por nível: `level = Math.floor(xpTotal / 200) + 1`
 * - progresso dentro do nível atual: `(xpTotal % 200) / 200 * 100`
 *
 * Sem rótulo de faixa ("Básico"/"Intermediário"/"Avançado"): nenhuma fonte
 * define esses limites — incluí-los seria invenção (Constitution, Artigo IV).
 *
 * Centralizada em `@ipp/shared` para não duplicar a fórmula entre frontend e
 * backend (o backend pode reaproveitar no futuro sem nova chamada de API).
 */

export const LEVEL_XP_STEP = 200;

export interface LevelInfo {
  level: number;
  progressPercent: number;
}

export function deriveLevel(xpTotal: number): LevelInfo {
  // Entrada segura: nunca abaixo de 0, sempre inteira — protege contra valores
  // negativos ou fracionários inesperados que quebrariam a aritmética do nível.
  const safeXp = Math.max(0, Math.floor(xpTotal));

  return {
    level: Math.floor(safeXp / LEVEL_XP_STEP) + 1,
    progressPercent: ((safeXp % LEVEL_XP_STEP) / LEVEL_XP_STEP) * 100,
  };
}
