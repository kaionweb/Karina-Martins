---
name: project-epic10-home-reconnect
description: Epic 10 (post-MVP, informal like Epics 6-9) reconnects apps/web home page to real data; 3 stories drafted 2026-08-09, Status Draft, pending @po validation.
metadata:
  type: project
---

All 29 stories from PRD + Epics 6-9 are Done. Epic 10 is the first post-MVP initiative,
informal (no `docs/prd.md` epic doc, same pattern as Epics 6-9), approved by the user
directly via gate-first in root `CLAUDE.md`, conducted by `@aiox-master`.

**Goal:** `apps/web/src/app/(app)/home/page.tsx` (built in "Fase 1 · Design System", outside
the formal SDC) used 100% mocked data from `_mock/content.ts`. User asked to reconnect it to
real backend data, item by item, decided via AskUserQuestion in a prior gate-first session.

**Sliced into 3 stories** (`docs/stories/10.1.story.md`, `10.2.story.md`, `10.3.story.md`,
all Status: Draft as of 2026-08-09):
- **10.1** — trivial reconnection: XP total, badge count, "trilhas em destaque" — all via
  already-existing endpoints (`GET /gamification/xp`, `/badges`, `GET /catalog/shows`), no
  backend changes. Introduces `apps/web/src/lib/ui/posterGradients.ts` (fixed gradient
  palette for real Show cards, since `Show` has no level/genre field — reused by 10.3).
- **10.2** — new `GET /gamification/ranking` endpoint (ranking only among `ProfileType.CHILD`
  profiles, per explicit user decision — "colegas", not mixed with ADULT), plus a pure
  `deriveLevel(xpTotal)` helper centralized in `packages/shared/src/lib/level.ts`
  (`level = floor(xp/200)+1`, no schema, no persistence, no faixa label like
  "Intermediário" — that would be invention per Constitution Article IV).
- **10.3** — biggest slice: "continuar aprendendo" card. Requires a schema change to
  `LessonProgress` (`lastAccessedAt DateTime?` + `completed Boolean @default(false)` +
  `completedAt` becomes optional). This is a load-bearing decision: today "row exists" =
  "lesson completed" (`LessonsService.completeLesson`, `CatalogService.getLessonsForTrack`);
  making `GET /lessons/:id` touch the row on every view (to set `lastAccessedAt`) without an
  explicit `completed` flag would silently break completion tracking. New endpoint
  `GET /lessons/continue-learning` must be declared **before** `GET /lessons/:id` in the
  Nest controller (route-ordering gotcha — `:id` would otherwise swallow the literal path).
  Requires `prisma db push` (never `migrate dev`) against dev TiDB, and an update to
  `packages/database/seed.ts#completeLessonForProfile` so the demo seed doesn't regress.

**How to apply:** If asked to continue this epic (e.g. review/refine 10.x, or draft 10.4+),
read the three story files directly for full AC/task detail rather than relying on this
summary — it's a snapshot from drafting time. Check current story Status first (may have
progressed past Draft since this was written).
