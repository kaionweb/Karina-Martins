// High score por jogo, salvo no navegador (sem backend/XP — ver CLAUDE.md:
// XP só pode vir do ledger XpEvent, e não existe schema de jogo no Prisma).
// Cada mini-game em /games/* lê/grava aqui; a galeria em /games lê pra
// mostrar o melhor score real do jogador em vez de um número ilustrativo.
const STORAGE_PREFIX = "ipp:games:highscore:";

export function getHighScore(gameId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

// Retorna o novo high score (maior entre o salvo e o score da partida).
export function saveHighScoreIfBetter(gameId: string, score: number): number {
  const current = getHighScore(gameId);
  if (score <= current) return current;
  window.localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, String(score));
  return score;
}
