---
name: no-lint-typecheck-gate
description: This monorepo has NO lint script in any package; typecheck is the static gate. Run tests/typecheck per-package (Windows Prisma DLL lock on root).
metadata:
  type: feedback
---

Neste monorepo (Inglês para Pequenos), **nenhum pacote tem script `lint`** — nem `apps/api`, nem `apps/web`, nem os `packages/*`. O root `lint` é só `turbo run lint`, que não encontra tarefas. O gate estático real é o `typecheck` (`tsc --noEmit`), que existe em api e web.

**Why:** A Constitution/CLAUDE.md repete "ALWAYS run `npm run lint`", mas isso não se aplica aqui — tentar rodar lint só gera ruído/erro. Verificado na Story 10.5.

**How to apply:** Ao concluir uma story, o gate de qualidade estático é `pnpm --filter <pkg> typecheck` (não lint). Rode testes e typecheck **por pacote isolado** (`--filter`), nunca da raiz: há um lock transiente conhecido de DLL do Prisma no Windows (`EPERM: rename query_engine-windows.dll.node`) ao buildar `@ipp/database`/`prisma generate` da raiz — é ambiente, não código. Ver também [[project_phase2_real_deploy]] e [[feedback_story_executor_schema_convention]].

Nota adicional: `@ipp/shared` é resolvido por api (ts-jest) e web (vitest) via `main` do pacote (`dist/index.js`) — ao alterar um schema em `packages/shared/src`, rode `pnpm --filter @ipp/shared build` antes dos testes, senão os consumidores não enxergam o novo export.
