---
name: project-story-9-2
description: Story 9.2 (catálogo de vídeos — listagem e filtros) implementada pelo @dev, status InReview
metadata:
  type: project
---

Story 9.2 "Catálogo de vídeos — listagem e filtros" implementada em 2026-08-07 na branch `feat/9.1-video-schema-sync`. Status: InReview (aguardando @qa; nada commitado/pushado pelo dev).

**Why:** Continuação do Epic 9 (vídeos YouTube); depende da 9.1 (schema `CuratedPlaylist`/`Video` já em main). Só listagem — `GET /videos/:id`, tela de detalhe e player ficam para a 9.3.

**How to apply:** Ao pegar a 9.3, o backend `GET /videos` (público, sem auth) e o módulo `VideosModule` estendido (VideosController/VideosService ao lado do YoutubeSync*) já existem. O `VideoCard` (thumbnail real `next/image` de `i.ytimg.com`, já em `next.config.ts` remotePatterns) e a tela `/videos` já linkam para `/videos/[id]` — a 9.3 só precisa criar a rota de destino/detalhe. Padrão de filtro: `GET /videos` só retorna `status: AVAILABLE`; tratar acesso direto a `UNAVAILABLE` é escopo da 9.3. Convenção confirmada: schema Prisma dentro de story de feature usa executor dev, não data-engineer.
