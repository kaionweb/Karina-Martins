// Lógica de desbloqueio por nível, compartilhada entre Séries e Explorar
// (e qualquer outra tela que precise saber se Básico/Intermediário/Avançado
// está destravado pro perfil ativo).
//
// REGRA: um nível destrava quando TODAS as séries daquele nível que já têm
// conteúdo (episodesCount > 0) estão concluídas (`completed`, calculado no
// backend a partir de SeriesEpisodeProgress — ver series.service.ts).
//
// Esta é a ÚNICA fonte de verdade pra essa regra — Séries e Explorar
// importam este hook em vez de calcular cada um por conta própria, pra
// nunca haver divergência entre o que uma tela diz estar destravado e o
// que a outra diz.
import { useMemo } from "react";
import type { Nivel } from "@/lib/ui/levelStyles";

export const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

interface ProgressionItem {
  level: Nivel;
  hasContent: boolean;
  completed: boolean;
}

export type UnlockedLevels = Record<Nivel, boolean>;
export type ProgressByLevel = Record<Nivel, { completed: number; total: number }>;

// isAdmin: bypass total da trava para a conta administradora (ADMIN_EMAIL) —
// alunos (perfis CHILD) nunca passam `true` aqui, ver chamadas em
// series/page.tsx e explorar/page.tsx.
export function computeUnlockedLevels(items: ProgressionItem[], isAdmin = false): UnlockedLevels {
  if (isAdmin) {
    return { Básico: true, Intermediário: true, Avançado: true };
  }

  const unlocked: UnlockedLevels = { Básico: true, Intermediário: false, Avançado: false };

  const basicoComContent = items.filter((item) => item.level === "Básico" && item.hasContent);
  const basicoCompleto = basicoComContent.length > 0 && basicoComContent.every((item) => item.completed);
  unlocked.Intermediário = basicoCompleto;

  const intermediarioComContent = items.filter((item) => item.level === "Intermediário" && item.hasContent);
  const intermediarioCompleto =
    unlocked.Intermediário && intermediarioComContent.length > 0 && intermediarioComContent.every((item) => item.completed);
  unlocked.Avançado = intermediarioCompleto;

  return unlocked;
}

export function levelProgress(items: ProgressionItem[], level: Nivel): { completed: number; total: number } {
  const comContent = items.filter((item) => item.level === level && item.hasContent);
  const completed = comContent.filter((item) => item.completed).length;
  return { completed, total: comContent.length };
}

export function useContentProgression(
  items: ProgressionItem[],
  isAdmin = false,
): {
  unlocked: UnlockedLevels;
  progressByLevel: ProgressByLevel;
} {
  const unlocked = useMemo(() => computeUnlockedLevels(items, isAdmin), [items, isAdmin]);
  const progressByLevel = useMemo(
    () =>
      Object.fromEntries(LEVEL_ORDER.map((level) => [level, levelProgress(items, level)])) as ProgressByLevel,
    [items],
  );

  return { unlocked, progressByLevel };
}
