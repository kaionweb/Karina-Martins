---
name: youtube-thumbnail-exception
description: Epic 9 video stories may use real YouTube thumbnails (i.ytimg.com via next/image) — gate-approved exception to the CLAUDE.md "own thumbnails only" rule
metadata:
  type: project
---

Epic 9 (curated YouTube videos) stories are allowed to render the **real YouTube thumbnail** (`i.ytimg.com` via `next/image`) in a dedicated `VideoCard`, instead of the tipographic `PosterCard` from `@ipp/ui`.

**Why:** The CLAUDE.md rule ("Thumbnails = artes próprias do design system... PROIBIDO imagens/pôsteres de terceiros") targets the **original catalog** (Shows/Lessons — 100% original content). It does not apply to officially embedded YouTube content, whose thumbnail is served by YouTube's own CDN, not hosted/copied by the platform. `PosterCard` is structurally CSS-only (renders a `background` gradient, has no `<img>`), so it physically cannot show an external thumbnail — a separate component is genuinely required, not a rule dodge. Decision approved at the feature's technical gate.

**How to apply:** When validating Epic 9 video stories, treat "real YouTube thumbnail via next/image + new VideoCard + next.config.ts images.remotePatterns for i.ytimg.com" as a documented, valid exception — not a CLAUDE.md violation. Still confirm it is scoped to embedded YouTube content only (never third-party movie/show posters used as decorative catalog art). Related: [[story-executor-schema-convention]].
