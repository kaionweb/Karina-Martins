---
name: project-story-10-1
description: Story 10.1 (Epic 10) — Home /home reconectada a XP/medalhas/trilhas reais, InReview, sem QA/push
metadata:
  type: project
---

Story 10.1 "Home real — XP, medalhas e trilhas em destaque" (Epic 10, pós-MVP informal como os Epics 6-9). Frontend puro, sem endpoint/schema novo: `apps/web/src/app/(app)/home/page.tsx` deixou de usar `jornadaMock.xpTotal`/`medalhas` e a lista mock `trilhas`, passando a buscar `GET /gamification/xp`, `GET /gamification/badges` e `GET /catalog/shows` (todos já existentes). Novo `apps/web/src/lib/ui/posterGradients.ts` (`POSTER_GRADIENTS` + `gradientForIndex`) gera o background dos cards de trilha (reaproveitável pela 10.3). Trilhas reais sem `levelTag` (Show não tem campo de nível — Artigo IV). `ranking`/`progressoXp`/`continueAprendendo`/`categorias` seguem mockados (cobertos por 10.2/10.3).

**Why:** usuário pediu para a Home refletir progresso e catálogo reais em vez de dados de demo.

**How to apply:** 10.2 (nível derivado + ranking entre perfis CHILD) e 10.3 ("continuar aprendendo", muda schema `LessonProgress`) dependem do XP total já buscado aqui — não reintroduzir a chamada. Status InReview; regressão completa passou (typecheck 7/7, 43 testes, build com `/home` estática). Verificação manual no navegador ficou para o usuário. Sem commit/push (decisão do usuário). Ver [[project-story-9-3]].
