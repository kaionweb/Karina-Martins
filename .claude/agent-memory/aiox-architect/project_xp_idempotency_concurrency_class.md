---
name: xp-idempotency-concurrency-class
description: Recurring bug class in this project's gamification code — upsert + unconditional XpEvent.create decided from a read outside the transaction causes double-XP / lost-XP under concurrency. Check this in every gate touching XP.
metadata:
  type: project
---

Recurring reliability finding class in the gamification/XP paths of Inglês para Pequenos. Appeared twice so far:
- **Story 9.3 REL-001** (`VideoWatchService.registerHeartbeat`): upsert(completedAt) + XpEvent.create not in one transaction → if XpEvent failed after completedAt persisted, `alreadyCompleted` locked true forever = permanent lost XP. Fixed by wrapping in a single interactive `$transaction(async tx => ...)`.
- **Story 10.3 CONC-001** (`LessonsService.completeLesson`): idempotency decided from a `findUnique` OUTSIDE the transaction, then `upsert` + unconditional `xpEvent.create`. Two concurrent `POST /complete` → both read `completed:false` → double XP. Regression from switching `create` (which fail-safed on the `@@unique` constraint) to `upsert` (which absorbs the conflict). Documented as CONCERNS (medium; HIGH in prod), fix recommended not applied.

**Why:** `XpEvent` is the single source of truth for XP/level/ranking (CLAUDE.md domain rule). The `XpEvent` table has no unique constraint to dedupe, so idempotency must be enforced by the surrounding logic. Deciding "should I award XP?" from a read that happens before/outside the write transaction is a TOCTOU hole. `upsert` does NOT protect the XP insert the way a bare `create` on a unique key did.

**How to apply:** In any story touching XP/badges/streak, the gate MUST check that the "award once" decision is made atomically. Preferred pattern: compare-and-swap inside a transaction — `updateMany({ where: { ...id..., completed: false }, data: { completed: true, ... } })` then award XP only if `count === 1` (WHERE re-evaluated under the row write-lock serializes concurrent callers). Or the 9.3-style single interactive `$transaction`. Sequential tests (2nd call = 0 XP) do NOT cover this — look for a concurrency test (`Promise.all` of two awards, assert exactly 1 XpEvent). Relate: [[continue-learning-schema-semantics]].
