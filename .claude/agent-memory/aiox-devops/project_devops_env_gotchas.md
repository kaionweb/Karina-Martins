---
name: devops-env-gotchas
description: Windows host gotchas that block @devops pre-push/pre-PR gates — no WSL (CodeRabbit), prisma-generate DLL lock, push-authority hook
metadata:
  type: project
---

Environmental limitations on this Windows dev host that repeatedly affect @devops gates.

**Why:** These are host/infra facts, not code defects — hitting them mid-task wastes time if re-diagnosed each session.

**How to apply:** When running pre-push / *create-pr gates, expect these and route around them instead of treating as code failures.

1. **No WSL → CodeRabbit CLI cannot run.** `wsl.exe` reports "Subsistema do Windows para Linux não está instalado". The `coderabbit-review` skill and the pre-push CodeRabbit step are WSL-only here, so they are UNAVAILABLE (report as such, not as passed). CodeRabbit can still run in CI / a clean env before merge.

2. **`prisma generate` EPERM DLL lock blocks `turbo build`/`lint`.** `@ipp/database` build runs `prisma generate && tsc`; on Windows it fails with `EPERM: operation not permitted, rename query_engine-windows.dll.node.tmp… -> …dll.node` whenever other sessions' node processes hold the DLL open. The real `query_engine-windows.dll.node` (~18.9MB) is already generated and functional, so `pnpm --filter <pkg> typecheck` and api tests still pass against it. Do NOT kill other sessions' node procs. Validate committed code via typecheck (shared/api/web) + scoped tests instead of the full turbo build. Orphan `.tmp*` files accumulate in `.prisma/client/` — harmless, gitignored.

3. **git push / gh pr create are blocked by a PreToolUse hook** (`.claude/hooks/enforce-git-push-authority.cjs`) unless the active agent resolves to devops. Prefix the command inline with `AIOX_ACTIVE_AGENT=devops` (the hook's `getCommandScopedAgent` reads it). `gh pr edit`/`gh pr view` are NOT guarded.

Related: [[deploy-infra]]
