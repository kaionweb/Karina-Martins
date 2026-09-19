# Memory Index

- [Story 9.2 catálogo de vídeos](project_story_9_2.md) — listagem GET /videos + tela /videos implementada, InReview, sem QA/push
- [Story 9.3 detalhe/player/XP](project_story_9_3.md) — detalhe /videos/[id] + heartbeat + XP, InReview, fecha Epic 9, sem QA/push
- [Story 10.1 Home real](project_story_10_1.md) — /home reconectada a XP/medalhas/trilhas reais (frontend puro), InReview, sem QA/push
- [Story 10.2 nível+ranking](project_story_10_2.md) — GET /gamification/ranking (CHILD) + deriveLevel em shared + Home nível/ranking reais, InReview, sem QA/push
- [Story 10.3 continuar aprendendo](project_story_10_3.md) — LessonProgress.completed/lastAccessedAt + GET /lessons/continue-learning + Home card real, fecha Epic 10, Done gate PASS (CONC-001 corrigido via CAS em transação), sem push
- [Story 10.4 sessão sobrevive a reload](project_story_10_4.md) — profileId no refresh token + hint no useAuthGuard, InReview, web 58/58 + api 172/172, pendente verificação manual + gate architect, sem push
- [Repetição de frase (A-B repeat)](project_sentence_repeat.md) — feature de repetição/Drill/velocidade em /videos/[id] e /series/[id]; TranscriptSentence + admin; InReview, sem push
- [Catálogo de Filmes real](project_filmes_catalog.md) — model Filme + /filmes real + repetição de frase + capítulos (buildChapters) + admin/filmes; typecheck+testes OK, sem push
- [Sem lint; typecheck é o gate](feedback_no_lint_typecheck_gate.md) — nenhum pacote tem script lint; rodar testes/typecheck por pacote (lock de DLL do Prisma no Windows na raiz); rebuild @ipp/shared após editar schema
