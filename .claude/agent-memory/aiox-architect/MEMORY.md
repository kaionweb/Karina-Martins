# Memory Index

- [XP idempotency concurrency bug class](project_xp_idempotency_concurrency_class.md) — recurring: upsert + XpEvent.create decided outside a tx → double/lost XP under concurrency (9.3 REL-001, 10.3 CONC-001). Check every XP-touching gate.
