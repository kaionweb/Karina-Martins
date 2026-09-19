// Usado por Filmes, ChapterJumpList e outras telas que exibem duração de vídeo.
// O componente VideoCard (galeria /videos) foi removido — a rota não existe mais.
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
