import { useEffect, useState } from "react";

/**
 * Mascote/gradiente por perfil CHILD, gerado deterministicamente a partir do
 * `id` (hash simples) sobre uma paleta fixa. `ProfileSummary` não tem campo de
 * emoji/cor — regra do projeto é perfil CHILD só coletar apelido + faixa
 * etária, sem foto (CLAUDE.md) — então o mascote é só decoração local,
 * estável entre sessões porque o `id` não muda.
 * Compartilhado entre o seletor de perfil e a Home pra manter o mesmo bicho
 * em ambas as telas.
 */
const CHILD_AVATARS = [
  { emoji: "🦊", gradient: "from-orange-400 to-cinema-primary" },
  { emoji: "🦁", gradient: "from-cinema-amber to-cinema-primary" },
  { emoji: "🐻", gradient: "from-amber-600 to-orange-800" },
  { emoji: "🐼", gradient: "from-slate-400 to-slate-600" },
  { emoji: "🐨", gradient: "from-cinema-blue to-purple-500" },
  { emoji: "🐰", gradient: "from-pink-400 to-cinema-primary" },
];

export function avatarForProfile(id: string) {
  const hash = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CHILD_AVATARS[hash % CHILD_AVATARS.length];
}

/**
 * Estado de "a foto do perfil ADULT carregou ou falhou", compartilhado entre
 * toda tela que renderiza o avatar (Perfil, Home, seletor de perfil) — evita
 * duplicar o mesmo `useState`/`onError` em cada uma. Passa `null`/`undefined`
 * pra perfis CHILD (que nunca têm `avatarUrl`, ver comentário acima).
 */
export function useAvatarPhoto(avatarUrl: string | null | undefined) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  return { hasPhoto: !!avatarUrl && !failed, onError: () => setFailed(true) };
}
