import type {
  CompleteLessonResponse,
  ContinueLearningResponse,
  Lesson,
  LessonWithProgress,
  Show,
  Track,
} from "@ipp/shared";
import { fetchWithAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function listShows(): Promise<Show[]> {
  const res = await fetch(`${API_URL}/catalog/shows`);
  if (!res.ok) {
    throw new Error("Erro ao carregar o catálogo");
  }
  return res.json();
}

// Erro com o status HTTP anexado, para que callers possam distinguir casos
// específicos (ex.: 403 no painel admin, Story 10.5) sem quebrar quem só faz
// try/catch genérico e exibe uma mensagem única.
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message = "Erro ao carregar dados da trilha/lição",
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function authenticatedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(path, options);
  if (!res.ok) {
    throw new ApiRequestError(res.status);
  }
  return res.json();
}

export function getTracksForShow(showId: string): Promise<Track[]> {
  return authenticatedFetch(`/catalog/shows/${showId}/tracks`);
}

export function getLessonsForTrack(trackId: string): Promise<LessonWithProgress[]> {
  return authenticatedFetch(`/catalog/tracks/${trackId}/lessons`);
}

export function getLesson(lessonId: string): Promise<Lesson> {
  return authenticatedFetch(`/lessons/${lessonId}`);
}

export function completeLesson(lessonId: string): Promise<CompleteLessonResponse> {
  return authenticatedFetch(`/lessons/${lessonId}/complete`, { method: "POST" });
}

export function getContinueLearning(): Promise<ContinueLearningResponse> {
  return authenticatedFetch("/lessons/continue-learning");
}

// Não existe "GET show da trilha" nem "GET show da lição" — resolve a
// posição do show na lista real (mesma ordem que colore os cards na
// Home/Explorar) andando pelas trilhas de cada show até achar a que contém
// esse trackId. Usado só pra decidir a cor de acento da tela de lição —
// mantém a mesma cor da trilha em toda a jornada (lista → detalhe → lição).
export async function resolveShowIndexForTrack(trackId: string): Promise<number> {
  const shows = await listShows();

  for (let i = 0; i < shows.length; i++) {
    const tracks = await getTracksForShow(shows[i].id);
    if (tracks.some((track) => track.id === trackId)) {
      return i;
    }
  }

  return 0;
}
