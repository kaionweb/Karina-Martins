# Revisão final de conformidade de domínio (Story 5.4)

Data: 2026-07-31
Responsável: Aria (@architect)

Checklist do AC1 da Story 5.4 — cada item revisado com evidência concreta antes da demo ao cliente.

## 1. Nenhum asset de terceiros no catálogo

**Veredito: PASS.**

- `packages/database/seed.ts`: os 2 shows ("Aventuras no Espaço", "Fazenda Divertida"), suas trilhas e as 5 lições de cada um têm título, sinopse e conteúdo 100% originais e genéricos — nenhum nome de personagem, obra ou franquia de terceiros.
- `thumbnailKey` de todo `Show` referencia um path do design system (`design-system/thumb-*`) — nunca um upload de imagem externa.
- Confirmado por busca no código-fonte que **nenhuma capacidade de upload de arquivo existe no projeto** (`multer`, `FileInterceptor` — não usados em nenhum controller; a única ocorrência de `multer` no `pnpm-lock.yaml` é uma dependência transitiva não utilizada diretamente).

## 2. Perfis CHILD sem dados excedentes

**Veredito: PASS**, com uma pendência correlata registrada abaixo.

- `model Profile` (`packages/database/prisma/schema.prisma`) só tem `nickname`/`ageRange` como dado pessoal — sem sobrenome, foto ou data de nascimento em nenhum lugar do schema.
- `RegisterSchema` (`packages/shared`) só aceita `email`/`password` — a criação de conta ADULT nunca coleta dado de criança.
- Teste automatizado novo (`apps/api/test/unit/domain-compliance.test.ts`) trava essa garantia: falha se qualquer um dos campos proibidos (`surname`/`sobrenome`, `birthDate`/`dataNascimento`, `photo`/`foto`) for adicionado ao `model Profile` no futuro.

**Pendência conhecida (fora do escopo desta story, decisão explícita do usuário durante a preparação):** nenhum endpoint `POST /profiles` (criação de perfil CHILD pela API) foi implementado desde a Story 1.4 — hoje a única forma de um perfil CHILD existir é via seed de demonstração (Story 5.3) ou inserção direta no banco em testes. Nenhum responsável real consegue adicionar um filho pela API/UI hoje. Registrado aqui para decisão futura; não corrigido nesta story por não ser uma AC da 5.4.

## 3. XP só via ledger

**Veredito: PASS.**

- `model Profile` não tem nenhuma coluna mutável de XP (`xpTotal` ou equivalente) — confirmado por leitura direta do schema.
- Toda leitura de XP no sistema (`GamificationService.getXpTotal`, `LessonsService.completeLesson`, `ParentService.getJourney`) sempre agrega `XpEvent` via `SUM(amount) WHERE profileId = X` — nunca lê um campo armazenado.
- Mesmo teste automatizado do item 2 trava a ausência de uma coluna `xpTotal` em `Profile` no futuro.

## 4. CORS restrito

**Veredito: PASS** (já coberto por teste automatizado existente, não duplicado aqui).

- `buildCorsOptions` (`apps/api/src/common/config/cors.config.ts`, Story 1.5) lança erro explícito se `WEB_URL` não estiver configurada — nunca reflete `"*"` nem aceita qualquer origin por omissão.
- Comportamento já validado por `apps/api/test/integration/cors.test.ts` (Story 1.5): origin fixa reflete `WEB_URL` exatamente; origin maliciosa nunca é refletida.

## 5. `ANTHROPIC_API_KEY` ausente de `apps/web`

**Veredito: PASS.**

- Confirmado por busca estrutural: nenhuma ocorrência de `ANTHROPIC_API_KEY` em `apps/web/src`.
- Mesma verificação já feita manualmente uma vez na Story 4.1 — agora automatizada permanentemente em `apps/api/test/unit/domain-compliance.test.ts`, para não depender de checagem manual repetida a cada story futura que toque `apps/web` ou `apps/api/src/modules/ai`.

## Resumo

| # | Item | Veredito |
|---|---|---|
| 1 | Nenhum asset de terceiros no catálogo | ✅ PASS |
| 2 | Perfis CHILD sem dados excedentes | ✅ PASS (pendência correlata registrada) |
| 3 | XP só via ledger | ✅ PASS |
| 4 | CORS restrito | ✅ PASS |
| 5 | `ANTHROPIC_API_KEY` ausente de `apps/web` | ✅ PASS |

**Nenhuma violação de domínio encontrada.** A plataforma está em conformidade com as regras de domínio do `CLAUDE.md` para a demo ao cliente.
