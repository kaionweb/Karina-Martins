---
name: project-sentence-repeat
description: Feature de repetição de frase (A-B repeat) nos players de vídeo/episódio, com Drill e velocidade
metadata:
  type: project
---

Feature "repetição de frase" (A-B repeat) implementada nos players de vídeo avulso (`/videos/[id]`) e episódio de série (`/series/[id]`). Lições ficaram de fora do escopo.

**O que foi feito:** modelo Prisma `TranscriptSentence` (youtubeVideoId solto, sem relation, serve Video e SeriesEpisode); schema zod `transcript.schema.ts` em @ipp/shared; módulo API `transcripts/` (service replace-em-transação + `AdminTranscriptsController` em `/admin/transcripts` com sources/get/put, importado por VideosModule e SeriesModule); rotas públicas `GET /videos/:id/transcript` (sem guard) e `GET /series/episodes/:episodeId/transcript` (JwtAuthGuard); `PlayerFacade` ganhou `seekTo`/`setPlaybackRate`; hook `useSentenceLoop`; componentes `SentencePlayerControls`/`SentenceCard`; página admin `/admin/transcripts` + link em Perfil. A série trocou o `<iframe videoseries>` por `PlayerFacade` com `episodio.videoId` (por isso `videoId` foi adicionado ao `seriesEpisodeSchema`).

**Why:** cliente pediu prática de shadowing/repetição por frase com tradução opcional (Drill).

**How to apply:** vídeos/episódios sem transcript cadastrado escondem a seção e continuam funcionando normal. Cor do estado "loop ativo" usa o literal `#DA233B` (vermelho da marca) — não há token cinema-* de vermelho.

**Status:** implementado nesta branch (rebrand/karina-martins), typecheck api+web OK, testes novos passam (useSentenceLoop 7/7, transcripts.service 5/5). Sem QA gate, sem commit, sem push. `prisma db push` aplicado no TiDB de dev. Ver [[feedback-no-lint-typecheck-gate]].

**Nota:** 14 testes web falham na branch por drift do rebrand (Login/Register/Home/SelectProfile/AdminPlaylists — placeholders/labels mudados), pré-existentes e não relacionados a esta feature.
