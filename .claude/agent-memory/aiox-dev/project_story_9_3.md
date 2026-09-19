---
name: project-story-9-3
description: Story 9.3 (detalhe/player/heartbeat/XP) implementada, InReview, fecha Epic 9 — sem QA/push ainda
metadata:
  type: project
---

Story 9.3 "Detalhe do vídeo, player e gamificação (heartbeat + XP)" implementada em YOLO pelo @dev; Status InReview. Fecha o Epic 9 (9.1 dados, 9.2 catálogo, 9.3 detalhe/player).

**Why:** era a última fatia do Epic 9; entrega o player conforme + a mecânica de XP por vídeo assistido.

**How to apply:** próximo passo é @qa (`*review 9.3`) e depois @devops push — NÃO commitado nem pushado pelo @dev. Branch de trabalho: feat/9.1-video-schema-sync (mesma das 9.x).

Pontos-chave que valem para futuras stories de vídeo/gamificação:
- XP por vídeo = 10 (reaproveita `LESSON_COMPLETION_XP`); teto diário `VIDEO_XP_DAILY_CAP` (env, default 30) = SOMA de XP `VIDEO_COMPLETED` do dia, não contagem.
- Backend decide conclusão (>= 80% da duração) em `VideoWatchService.registerHeartbeat`; front só manda `positionSeconds`. `watchedSeconds` = `max(atual, recebido)`, nunca decresce.
- `GET /videos/:id` é público e retorna mesmo `UNAVAILABLE`; `POST /videos/:id/heartbeat` exige `JwtAuthGuard`. Dois controllers (`VideosController` público + `VideoWatchController` guarded) coexistem no prefixo `videos`.
- Suite ao fim: API 143 testes (23 suites) + Web 39 testes (16 arquivos), todos passando. Projeto NÃO tem script `lint` (pnpm lint é no-op) — gates reais são build/typecheck/test.
- Subtask 7.2 (verificação manual no navegador) ficou pendente de humano.

Ver também [[project-story-9-2]].
