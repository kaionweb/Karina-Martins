import type { FilmeSummary, TranscriptSentence } from "@ipp/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function listFilmes(): Promise<FilmeSummary[]> {
  const res = await fetch(`${API_URL}/filmes`);
  if (!res.ok) {
    throw new Error("Erro ao carregar o catálogo de filmes");
  }
  return res.json();
}

export async function getFilme(id: string): Promise<FilmeSummary> {
  const res = await fetch(`${API_URL}/filmes/${id}`);
  if (!res.ok) {
    throw new Error("Erro ao carregar o filme");
  }
  return res.json();
}

// Transcript do filme (feature de repetição de frase). Lista vazia = sem
// transcript cadastrado → a tela esconde a feature.
export async function getFilmeTranscript(id: string): Promise<TranscriptSentence[]> {
  const res = await fetch(`${API_URL}/filmes/${id}/transcript`);
  if (!res.ok) {
    throw new Error("Erro ao carregar o transcript do filme");
  }
  return res.json();
}
