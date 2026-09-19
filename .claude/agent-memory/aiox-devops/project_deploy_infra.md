---
name: project-deploy-infra
description: Production deploy mechanics for KaionWeb Inglês para Pequenos — Render (auto) vs Vercel (manual CLI), exact procedure and prod URLs
metadata:
  type: project
---

# Deploy Infrastructure — Inglês para Pequenos (KaionWeb)

Production URLs:
- Web (Vercel): `https://ingl-s-para-pequenos-web.vercel.app`
- API (Render): `https://ingles-para-pequenos-api.onrender.com` (GET /health → `{"status":"ok"}`)

## Render — auto-deploy CONFIRMED WORKING (2026-08-09)
Render auto-deploys `apps/api` on push to `origin/main`. Verified during Epic 10 deploy: new endpoints `/gamification/ranking` (Story 10.2) and `/lessons/continue-learning` (Story 10.3) returned 200 with real data in prod without any manual step.
**Why:** Prior sessions never confirmed Render auto-deploy either way — this closes that gap.
**How to apply:** After pushing API changes, verify the live version by hitting a *new* endpoint from the push (authenticated), not just /health. Don't assume; confirm the actual route responds.

## Vercel — Git integration fires but prod deploy gets BLOCKED; manual CLI deploy is the known-good path
UPDATE 2026-09-03 (PR #3 merge): the Vercel GitHub integration IS connected and DOES fire on push to `main` — the merge commit `d32c0b3` got a `Vercel` commit status. BUT the production deploy came back `state=failure`, description **"Deployment was blocked"** (a Vercel deployment-protection/plan block, not a code build error). Net effect: merging to main did NOT put the new brand live; the prod URL stayed on the old deploy. So "auto-deploy trigger exists" is TRUE, but it does not reliably ship — treat the manual CLI deploy below as the actual way to get web to prod. (Earlier note said auto-deploy doesn't fire at all / deployments carry no SHA — that's now corrected: it fires, it just gets blocked.)

Exact working procedure (manual CLI, still the reliable path):
1. From the **monorepo ROOT** (`D:\Inglês-para-Pequenos`), not `apps/web` (Root Directory `apps/web` is set on the Vercel project, relative to invocation).
2. `npx vercel link --yes --project=ingl-s-para-pequenos-web --scope=kaion1` (explicit `--project`/`--scope`, else CLI creates a wrong project from the dir name).
3. `npx vercel --prod --yes` → builds current local working tree; auto-aliases `ingl-s-para-pequenos-web.vercel.app` to the new deployment.
- CLI account: `kaionweb14-4670`; scope/team: `kaion1`.
- `vercel link` / `vercel env pull` append duplicate `.vercel` / `.env*` lines to `.gitignore` and create `.env.local` — revert the `.gitignore` change (`git checkout -- .gitignore`) to keep the tree clean; both are already ignored by commit 26de19a.
**How to apply:** Deploy fresh from a clean tree at the target commit rather than trusting an existing "Ready" deployment of unknown origin (they have no SHA to verify).

## Wiring
Vercel prod env `NEXT_PUBLIC_API_URL="https://ingles-para-pequenos-api.onrender.com"` — frontend talks to the Render API above. Same TiDB DB serves dev and prod (conscious reuse since Fase 2).

## E2E validation recipe (prod)
`POST /auth/login {email,password}` → accessToken → `GET /profiles` (Bearer) → `POST /profiles/{childId}/select` returns a profile-scoped accessToken (profileId embedded) → call profile-gated endpoints with that token. Demo: `familia.demo@kaionweb.com` / `Demo@1234`; CHILD profile "Theo" ageRange 6-8.
