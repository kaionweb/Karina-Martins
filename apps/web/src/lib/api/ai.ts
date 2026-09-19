import { fetchWithAuth } from "@/lib/auth";

export class DailyLimitReachedError extends Error {}

async function postChat(path: string, body: unknown): Promise<{ reply: string }> {
  const res = await fetchWithAuth(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new DailyLimitReachedError("Limite diário de mensagens atingido");
  }

  if (!res.ok) {
    throw new Error("Não foi possível enviar a mensagem");
  }

  return res.json();
}

export function chatEn(
  target: { lessonId: string } | { scenario: string },
  message: string,
): Promise<{ reply: string }> {
  return postChat("/ai/chat/en", { ...target, message });
}

export function chatPt(message: string, lessonId?: string | null): Promise<{ reply: string }> {
  return postChat("/ai/chat/pt", { message, lessonId });
}
