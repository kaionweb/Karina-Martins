---
name: project-filmes-catalog
description: Catálogo de Filmes real (Prisma Filme) + repetição de frase + capítulos, substituindo o mock filmesMock
metadata:
  type: project
---

Catálogo de Filmes deixou de ser mock (`filmesMock` removido de `_mock/content.ts`) e virou dado real, reaproveitando a feature de repetição de frase (ver [[project-sentence-repeat]]).

**O que foi feito:**
- Prisma: `model Filme` (id, title, emoji, level `FilmeLevel` BASICO/INTERMEDIARIO/AVANCADO, ageRange, `videoId @unique`, durationSeconds, thumbnailUrl?, createdAt) — sem tracking de progresso/watch history (não pedido). `videoId` é o id do YouTube, chave do transcript (mesmo conceito de youtubeVideoId em TranscriptSentence).
- Shared: `filme.schema.ts` (`filmeSummarySchema` — inclui `videoId`, necessário pro player; `upsertFilmeSchema` com `videoUrlOrId` + `duration` string).
- API módulo `filmes/`: `FilmesService` (listFilmes ordena por title asc; getFilmeById throw NotFound); `FilmesController` público (`GET /filmes`, `/filmes/:id`, `/filmes/:id/transcript` via TranscriptsService); `AdminFilmesController` (`POST/GET/DELETE /admin/filmes`, guard JwtAuthGuard+AdminGuard); `AdminFilmesService` (upsert por videoId ordena admin por createdAt desc) com duas funções puras exportadas: `extractYoutubeVideoId` (watch?v=, youtu.be/, /embed/, id puro, fallback regex) e `parseDurationToSeconds` (segundos | mm:ss | hh:mm:ss, lança BadRequest). Módulo importa TranscriptsModule; registrado no AppModule.
- `admin-transcripts.controller` sources ganhou 3ª query (filmes) com `kind: "filme"`; union de `TranscriptSource.kind` agora `"video"|"episode"|"filme"`; dropdown admin mostra `[Filme]`.
- Front: `lib/api/filmes.ts`; `/filmes` reconectado a `listFilmes()` (filtros/busca mantidos, MovieCard navega); `/filmes/[id]` novo (espelha videos/[id], sem heartbeat/XP); `admin/filmes/page.tsx` novo (espelha admin/series, sem seasons/episódios); link "Filmes" no admin do Perfil.
- Capítulos: `components/videos/ChapterJumpList.tsx` com `buildChapters` puro (bloco de 60s por startTime, capítulo N = floor(startTime/60)); componente só plugado na tela de filme, entre SentencePlayerControls e SentenceCard, quando `transcript.length > 20`.

**Decisões não 100% especificadas:** duração no form admin = string flexível (segundos, mm:ss, hh:mm:ss), parse no service; listagem pública por título asc, admin por createdAt desc; FilmeSummary inclui `videoId` (o plano esqueceu, mas a tela de detalhe precisa — igual episódio de série já expõe); filme sem thumbnail usa `i.ytimg.com/vi/{videoId}/hqdefault.jpg` (mesmo domínio de vídeos/séries) porque PlayerFacade exige thumbnailUrl string.

**Status:** implementado nesta branch (rebrand/karina-martins). `prisma db push` aplicado no TiDB de dev (schema in sync; `prisma generate` bateu no lock de DLL do Windows mas o client TS já tinha `Filme` — ver [[no-lint-typecheck-gate]]). typecheck api+web OK; testes novos passam (filmes.service 20/20, ChapterJumpList/buildChapters 5/5). Filme sem transcript continua tocando normal (seção de repetição escondida quando `loop.total === 0`). Sem QA gate, sem commit, sem push.
