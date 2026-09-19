---
name: project-story-10-2
description: Story 10.2 (Epic 10) — nível derivado do XP + ranking entre perfis CHILD, InReview, sem QA/push
metadata:
  type: project
---

Story 10.2 "Home real — Nível derivado e ranking entre perfis CHILD" (Epic 10, segunda fatia após [[project-story-10-1]]). Implementada em YOLO, Status InReview.

Entregue:
- `GET /gamification/ranking` (`JwtAuthGuard`, checagem manual `req.user.profileId` → 403 `NO_ACTIVE_PROFILE`): soma `XpEvent.amount` por perfil, só `ProfileType.CHILD`, ordena desc, desempate por `createdAt asc` (sort estável do V8). Retorna `{ position: number|null, totalParticipants }`. Perfil ADULT → `position: null`.
- `packages/shared/src/lib/level.ts`: `deriveLevel(xp) = { level: floor(xp/200)+1, progressPercent: (xp%200)/200*100 }`, `LEVEL_XP_STEP=200`. Sem rótulo de faixa (Artigo IV). Centralizado em shared p/ back reaproveitar no futuro.
- Home (`home/page.tsx`): "Nível N" real no header, `ProgressBar` do topo usa progressPercent, StatCard "Ranking" usa position real (fallback "—"). `getRanking` no mesmo `Promise.all` de XP/badges. Import `jornadaMock` removido.

**Why:** progresso relativo real sem inventar dados (faixas de nível não definidas em lugar nenhum).
**How to apply:** ranking é global (todos CHILD do banco). Testes contra TiDB compartilhado usam asserções RELATIVAS (mais XP ⇒ posição menor) + `totalParticipants` vs `prisma.profile.count({where:{type:"CHILD"}})`, nunca posições absolutas. Empate testado com `createdAt` explícito, rodado 2x p/ provar determinismo.

Regressão: build 4/4, typecheck 7/7, test API 155 + web 52 PASS. `pnpm lint` é no-op (nenhum pacote define script lint — gates reais = typecheck+build+test). Sem commit/push (lead cuida do git).
