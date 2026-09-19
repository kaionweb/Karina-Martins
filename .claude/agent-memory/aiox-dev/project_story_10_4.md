---
name: project-story-10-4
description: Story 10.4 — refresh token carrega profileId p/ sessão sobreviver a reload; InReview, testes verdes, pendente verificação manual + gate architect
metadata:
  type: project
---

Story 10.4 "Sessão sobrevive a reload — profileId no refresh token" (bug do Epic 10, fora do PRD original). Status **InReview**.

**O que faz:** backend passa a carregar `profileId` no refresh token (reemitido a cada `/profiles/:id/select`), e `POST /auth/refresh` devolve `profileId` no corpo. Frontend guarda esse `profileId` como "hint" em `token-store.ts` (`getProfileIdHint`/`setProfileIdHint`, sem Zustand em `lib/auth`); `useAuthGuard` usa o hint + `listProfiles()` pra repopular `useProfileStore.activeProfile` antes de redirecionar pra `/select-profile` após reload. Compatibilidade retroativa: refresh token legado `{ sub }` continua aceito. SEC-002 (Story 1.4) intocada — checagem roda antes de qualquer reemissão de cookie.

**Retomada (v1.1):** execução anterior parou no Task 5; o único gap real era `apps/web/tests/hooks/useAuthGuard.test.ts` com mocks desatualizados (faltava `getProfileIdHint`/`setProfileIdHint` no mock de `@/lib/auth` e `setActiveProfile` no mock de `useProfileStore`). Corrigido + 3 casos da Subtask 6.1. Regressão reexecutada: web 58/58, api 172/172, typecheck+build de código OK.

**Why:** bug descoberto no smoke test manual das Stories 10.1-10.3 — reload derrubava usuário logado pra `/select-profile`.

**How to apply:** Subtask 7.1 (verificação manual em browser: reload em `/home` + 1 rota `requireProfile:true`) permanece `[ ]` — precisa de humano. Falta gate do @architect. NÃO commitado/pushado. Detalhe de ambiente: `pnpm build`/`typecheck` na raiz falham em `@ipp/database#build` por lock de DLL do Prisma no Windows (`EPERM rename query_engine-windows.dll.node`), não é regressão — story não muda schema; `packages/database` tsc compila isolado. Relacionado: [[project-story-10-3]].
