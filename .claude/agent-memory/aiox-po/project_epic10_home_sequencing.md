---
name: project-epic10-home-sequencing
description: Epic 10 (Home real) stories 10.1/10.2/10.3 must run serially because all three edit the same two frontend files
metadata:
  type: project
---

Epic 10 ("Home real" — reconectar dados reais em `apps/web/src/app/(app)/home/page.tsx`) foi fatiado em 3 stories: 10.1 = reconexão trivial (XP/medalhas/trilhas), 10.2 = nível derivado + ranking CHILD-only, 10.3 = "continuar aprendendo" (schema `LessonProgress` + endpoint novo). Todas validadas GO (9/10) e movidas para Ready em 2026-08-09.

**Ordem correta: 10.1 → 10.2 → 10.3 (endossada na validação PO).**

**Why:** 10.1 é pré-requisito de arquivo real para 10.2 e 10.3 — ela cria `apps/web/src/lib/ui/posterGradients.ts` e `apps/web/tests/components/HomePage.test.tsx`, e estabelece o scaffold de fetch/loading/erro em `home/page.tsx`. 10.2 e 10.3 são independentes entre si na lógica (gamification vs lessons/schema; seções diferentes da Home), MAS ambas editam os MESMOS dois arquivos compartilhados (`home/page.tsx` e `HomePage.test.tsx`) — logo não podem rodar em paralelo sem conflito de merge; cada uma precisa rebasear na edição da anterior. 10.3 por último é o correto por ter a maior superfície de risco (migração de schema via `prisma db push`, quebra da suposição "existência de LessonProgress = concluída" que afeta `completeLesson` + `catalog.getLessonsForTrack` + seed).

**How to apply:** Se o dev/lead pedir para paralelizar 10.2 e 10.3, avisar do acoplamento em `home/page.tsx`/`HomePage.test.tsx`. 10.1 tem que fechar antes de qualquer uma das outras começar. Story 10.3 subtask 8.2 (rodar seed contra TiDB real) é User Action — precisa de credenciais reais, não roda no run autônomo do @dev.
