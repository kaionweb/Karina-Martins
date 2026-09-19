---
name: story-10-3
description: Story 10.3 — card "Continuar aprendendo" (última lição acessada) + schema LessonProgress.completed/lastAccessedAt; Done, gate PASS (CONC-001 corrigido), sem push
metadata:
  type: project
---

Story 10.3 (fecha o fatiamento do Epic 10, ver [[story-10-1]]/[[story-10-2]]) implementada em modo YOLO. Gate @architect **PASS** após fix pós-gate do CONC-001; **Status Done**, sem push.

**Fix CONC-001 (medium, gate 10.3):** a troca de `create`→`upsert` em `completeLesson` (necessária porque getLesson passou a criar a linha) tinha removido o fail-safe da unique constraint contra XP em dobro sob dois `POST /complete` concorrentes (idempotência decidida por findUnique FORA da transação). Corrigido com compare-and-swap dentro de um `$transaction` interativo: upsert garante a linha sem tocar `completed`; `updateMany({ where: { completed:false }, data: { completed:true, ... } })` serializa sob write-lock; XpEvent só se `count===1`; guarda P2002 para a corrida de criação. FIRST_LESSON também decidido dentro da transação. Teste de concorrência real adicionado em `gamification.test.ts` (dois completes via Promise.all → exatamente 1 XpEvent). Mesma classe do REL-001 da 9.3 (ver [[story-9-3]]). Precedente do padrão: `VideoWatchService.registerHeartbeat`.

Entregue:
- **Schema `LessonProgress`**: novo `completed Boolean @default(false)`, `lastAccessedAt DateTime?`, e `completedAt` passou a `DateTime?` (antes obrigatório). Aplicado via `prisma db push` real contra o TiDB de dev (sucesso) + `prisma generate`.
- **Backend**: `GET /lessons/:id` agora faz upsert/touch de `lastAccessedAt` (só toca `lastAccessedAt`, nunca `completed`). `completeLesson` passou a decidir conclusão pelo campo `completed` (não mais "linha existe"). Novo `GET /lessons/continue-learning` (declarado ANTES de `:id` no controller) → `{ hasProgress }` union com lessonPosition/totalLessonsInTrack/trackProgressPercent. `catalog.getLessonsForTrack` filtra `completed: true`.
- **Achado in-scope não previsto nas subtasks**: `parent.service.ts#getCompletedLessons` também tratava "linha existe = concluída" — quebrava o build (completedAt nullable) e mostraria lições só acessadas como concluídas na visão do responsável. Corrigido com `where completed:true` + guarda de nulo.
- **Seed** `completeLessonForProfile` e teste `lessons.test.ts` (setup) atualizados p/ `completed: true` explícito.
- **Frontend** `home/page.tsx`: card real com fallback `hasProgress:false` (Link p/ /explorar); botão "Continuar" decorativo.

**Why:** reconectar a Home a dados reais; a existência de uma linha `LessonProgress` deixou de significar "concluída" ao adicionar touch de acesso, então `completed` explícito virou obrigatório para não regredir badges/XP/catálogo silenciosamente.

**How to apply:** ao mexer em conclusão de lição, sempre filtrar `completed: true` — nunca assumir "linha existe = concluída". Para idempotência de escrita concorrente no ledger XpEvent (fonte única de XP), usar compare-and-swap dentro de `$transaction` (updateMany + count), nunca ler-fora-decidir-depois. Regressão validada: pnpm build/typecheck/test todos verdes (api 165 após o fix, database 15, web 54). Subtask 8.2 (rodar seed contra TiDB de DEMO real) deixada como refresh manual do responsável — não disparada p/ não mutar a demo; validada funcionalmente pelo seed.integration.test.
