# Inglês para Pequenos (Karina Martins) Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Entregar uma plataforma web funcional de ensino de inglês para crianças via conteúdo audiovisual (shows/séries), organizado em trilhas e lições
- Permitir que responsáveis criem contas familiares com múltiplos perfis infantis, coletando apenas apelido + faixa etária (sem sobrenome/foto/data de nascimento)
- Gamificar o aprendizado via XP (derivado de um ledger de eventos, nunca escrito diretamente) e streak diário para engajamento contínuo
- Oferecer um tutor de IA conversacional em inglês (prática dentro do universo da lição) e um assistente em português para dúvidas, com limite diário de mensagens e filtro de conteúdo antes de persistir
- Disponibilizar uma demo funcional e apresentável a clientes, rodando inteiramente em infraestrutura gratuita (Vercel + Render/Koyeb + TiDB/Aiven Serverless), com caminho de migração claro para produção (Hostinger Business → VPS)
- Manter conformidade de propriedade intelectual no catálogo: apenas metadados factuais de obras + conteúdo 100% original (thumbnails próprias, sem pôsteres/imagens de terceiros, sem legendas ou letras transcritas)

### Background Context

Karina Martins / Inglês para Pequenos endereça o problema de ensinar inglês a crianças pequenas de forma segura, engajante e supervisionável pelos pais, usando como gancho pedagógico shows e séries que as crianças já gostam — mas sem infringir direitos autorais de terceiros (o catálogo é só metadados + conteúdo 100% original). O diferencial é combinar uma trilha de lições estruturada com gamificação (XP/streak) e um tutor de IA que conversa em inglês dentro do universo de cada lição, mantendo os pais no controle: transcrições visíveis ao responsável, perfis infantis com coleta mínima de dados, e filtro de conteúdo antes de qualquer persistência.

O ambiente atual é uma demo técnica para o cliente: precisa rodar 100% em free tier (Vercel Hobby / Render ou Koyeb / TiDB Serverless ou Aiven), com arquitetura pensada desde já para a migração futura a uma VPS na Hostinger sem retrabalho estrutural — mesmo fluxo de banco (`prisma db push`), mesma separação de auth cross-domain isolada em um único service de front-end.

### Change Log

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-07-29 | 0.1 | Criação inicial do PRD | Morgan (PM) |

## Requirements

### Functional

1. FR1: O sistema deve permitir que um responsável crie uma conta familiar e adicione um ou mais perfis de criança vinculados a essa conta.
2. FR2: Perfis de criança devem coletar apenas apelido e faixa etária — sem sobrenome, foto ou data de nascimento.
3. FR3: O sistema deve autenticar usuários via access token JWT (15 min, header `Authorization: Bearer`) e refresh token via cookie httpOnly `SameSite=None; Secure`, suportando front-end e API em domínios diferentes.
4. FR4: O catálogo deve exibir shows com trilhas e lições, usando apenas metadados factuais das obras e conteúdo 100% original (sem imagens/pôsteres/legendas/letras de terceiros); thumbnails são artes próprias do design system.
5. FR5: O catálogo de demonstração deve conter pelo menos 2 shows, cada um com 1 trilha e 5 lições.
6. FR6: O XP total do usuário deve ser calculado exclusivamente a partir de um ledger de eventos (`XpEvent`) — nunca por escrita direta de um campo `xpTotal`.
7. FR7: O sistema deve manter um streak diário, atualizado por um endpoint protegido (`POST /internal/cron/streak`) autenticado por header `X-Cron-Secret`, disparado por cron externo.
8. FR8: O sistema deve exibir badges conquistadas por perfil.
9. FR9: O sistema deve oferecer um chat de IA em inglês para prática conversacional dentro do universo da lição atual; para perfis CHILD, restrito ao tema da lição, com recusa/redirecionamento quando sair do tema.
10. FR10: O sistema deve oferecer um assistente de IA em português para dúvidas gerais, sujeito ao mesmo filtro de conteúdo e limite diário.
11. FR11: Toda mensagem de IA de um perfil CHILD deve passar por filtro de conteúdo antes de persistir, com transcrição completa visível ao responsável.
12. FR12: O sistema deve impor limite diário de mensagens de IA por perfil, configurável via `AI_DAILY_LIMIT` (default 20 em teste).
13. FR13: Cada interação de IA deve registrar tokens de entrada/saída em `AiSession`.
14. FR14: A API deve expor `GET /health` retornando 200 sem tocar o banco, para ping anti-cold-start/healthcheck.
15. FR15: O sistema deve suportar login via Google OAuth além de credenciais próprias.
16. FR16: O responsável deve visualizar jornada/progresso e ranking, populados a partir do seed de demonstração.

### Non Functional

1. NFR1: A API deve operar sem estado em memória entre requests (pode dormir/reiniciar no free tier) — todo estado relevante vive no banco.
2. NFR2: Uso de memória da API deve respeitar o limite de 512MB (free tier) — sem cache pesado em memória; pool Prisma limitado (`connection_limit=3`).
3. NFR3: CORS da API restrito à origin definida em `WEB_URL` — nunca `"*"` com credentials habilitadas.
4. NFR4: `ANTHROPIC_API_KEY` nunca deve existir no ambiente de `apps/web` — só `apps/api` chama a Anthropic API.
5. NFR5: Toda entrada da API deve ser validada com zod, usando schemas centralizados em `packages/shared`.
6. NFR6: O schema do banco deve se restringir a features suportadas por MySQL 8/MariaDB/TiDB (sem fulltext avançado, stored procedures, ou features exclusivas de Postgres).
7. NFR7: Deploys de schema usam `prisma db push` (nunca `migrate dev` em deploy) e `prisma generate` no postinstall.
8. NFR8: Conexão com o banco deve usar TLS (`sslaccept=strict` ou CA conforme provedor).
9. NFR9: O seed de demonstração deve sempre funcionar e popular dados suficientes para demo (1 conta familiar + perfil criança, 1 conta adulta, 2 shows/1 trilha/5 lições cada, badges, XpEvents).
10. NFR10: Modo de streaming de IA fica atrás de flag (`AI_STREAMING=false` por padrão); comportamento padrão é request → resposta completa → JSON.
11. NFR11: Estratégia de testes é Unit + Integration — testes unitários para lógica de negócio (XP ledger, cálculo de streak, filtro de conteúdo) e testes de integração para endpoints críticos da API (auth, IA, cron de streak). Sem E2E no MVP.

## User Interface Design Goals

### Overall UX Vision

Interface lúdica e colorida no fluxo da criança (seleção de perfil, trilhas, lições, chat de IA), com microanimações de feedback positivo (Framer Motion) ao concluir lições e ganhar XP. A área do responsável (dashboard, transcrições, configurações) é mais sóbria/administrativa. Tema claro/escuro nativo via tokens do `packages/ui`.

### Key Interaction Paradigms

Navegação por cards temáticos (shows → trilha → lição); gamificação visual constante (barra de XP, contador de streak, badges); formulários mínimos para reduzir fricção em telas usadas por crianças.

### Core Screens and Views

- Login/Cadastro (responsável) + Google OAuth
- Seleção de Perfil (qual criança está usando)
- Home/Dashboard (jornada, XP, streak, ranking)
- Catálogo de shows
- Trilha de um show (lições sequenciais)
- Tela de Lição (conteúdo + chat de IA em inglês)
- Chat de dúvidas em português
- Painel do Responsável (transcrições, perfis infantis, progresso)
- Tela de Badges/Conquistas

### Accessibility: WCAG AA

_(Assunção — produto infantil com supervisão parental; não estava especificado no CLAUDE.md)_

### Branding

Sem elementos de marcas de terceiros (proibido por regra de domínio); paleta e tokens 100% próprios do design system, com suporte a tema claro/escuro.

### Target Device and Platforms: Web Responsive

_(Assunção — crianças provavelmente acessam via tablet/celular do responsável, mas a stack é 100% web via Vercel)_

## Technical Assumptions

### Repository Structure: Monorepo

Turborepo + pnpm — já fixado no `CLAUDE.md`.

### Service Architecture

Dois serviços deployados separadamente dentro do monorepo — `apps/web` (Next.js, Vercel) e `apps/api` (NestJS, Render/Koyeb) — sem microsserviços internos; `packages/database`, `packages/shared`, `packages/ui` compartilhados entre eles.

### Testing Requirements

Unit + Integration — testes unitários para lógica de negócio (XP ledger, cálculo de streak, filtro de conteúdo) e testes de integração para endpoints críticos da API (auth, IA, cron de streak). Sem E2E no MVP.

### Additional Technical Assumptions and Requests

_(Todas já fixadas no CLAUDE.md, sem invenção)_

- `apps/web`: Next.js 15 App Router + Tailwind + shadcn/ui + Framer Motion
- `apps/api`: NestJS REST, lê `PORT` de env, `GET /health` sem tocar banco
- `packages/database`: Prisma, dialeto MySQL compatível com MariaDB/TiDB; `prisma db push` (nunca `migrate dev` em deploy) + `prisma generate` no postinstall
- Validação de entrada via zod, schemas em `packages/shared`
- Auth: JWT access (15min) + refresh via cookie httpOnly `SameSite=None; Secure`; CORS restrito a `WEB_URL`
- IA: somente `apps/api` chama Anthropic; `claude-haiku-4-5` (conversação EN) / `claude-sonnet-4-6` (dúvidas PT); modo sem streaming por padrão (flag `AI_STREAMING`)
- Deploy: Vercel Hobby (web) / Render ou Koyeb free tier (api) / TiDB Serverless ou Aiven (banco)
- Restrições de free tier: sem estado em memória na API, RAM 512MB, `connection_limit=3` no Prisma

## Epic List

| Epic | Objetivo (1 frase) |
|---|---|
| **Epic 1: Fundação & Autenticação** | Consolidar o monorepo (já em produção na Fase 0), implementar autenticação cross-domain (JWT + refresh cookie + Google OAuth) e criação de contas familiares com perfis de criança. |
| **Epic 2: Catálogo & Trilhas de Aprendizado** | Exibir shows, trilhas e lições com conteúdo 100% original, navegáveis do catálogo até a lição individual. |
| **Epic 3: Gamificação (XP, Streak, Badges)** | Implementar o ledger de XP, o job de streak diário via cron protegido, badges e ranking. |
| **Epic 4: Tutor de IA (Chat EN/PT)** | Chat de IA em inglês restrito ao universo da lição para perfis CHILD + assistente em português para dúvidas, com filtro de conteúdo, limite diário e auditoria de tokens (`AiSession`). |
| **Epic 5: Painel do Responsável & Demo** | Visão de jornada/progresso e transcrições para o responsável; seed de demonstração completo e pronto para apresentação ao cliente. |

**Racional:** Epic 1 absorve o trabalho da Fase 0 (scaffold, já publicado) e adiciona a primeira fatia de valor real: contas e login funcionando. Cada epic subsequente entrega uma fatia vertical completa e demonstrável, na ordem de dependência natural (não dá pra gamificar sem catálogo, não dá pra ter chat de IA sem lição pra contextualizar).

## Epic 1 Fundação & Autenticação

**Goal:** Sobre a fundação técnica já publicada (Fase 0), implementar o modelo de dados de contas familiares/perfis e todo o fluxo de autenticação cross-domain (web em domínio diferente da API), incluindo login social, para que qualquer família consiga criar conta, adicionar perfis de criança e acessar a plataforma com segurança.

### Story 1.1 Modelo de dados de contas familiares e perfis

Como responsável,
Eu quero que o sistema saiba distinguir minha conta de adulto dos perfis das crianças vinculadas a ela,
para que cada um tenha uma experiência e permissões apropriadas.

#### Acceptance Criteria

1: Schema Prisma expande os models `User`/`Profile` existentes para suportar tipo de perfil (ADULT/CHILD) e vínculo a uma conta familiar
2: Perfil CHILD armazena apenas apelido e faixa etária (sem sobrenome, foto, data de nascimento)
3: `prisma validate` e `prisma db push` executam sem erro no schema atualizado

### Story 1.2 Registro e login com JWT + refresh cookie

Como responsável,
Eu quero criar uma conta e fazer login,
para acessar a plataforma com segurança mesmo com web e API em domínios diferentes.

#### Acceptance Criteria

1: Endpoint de registro cria conta ADULT com senha (hash) e endpoint de login retorna access token JWT (expiração 15 min)
2: Refresh token é emitido como cookie httpOnly, `SameSite=None; Secure`
3: Toda lógica de auth do front está isolada em um service (`lib/auth`) conforme regra do domínio
4: Entradas validadas via zod (schemas em `packages/shared`)

### Story 1.3 Login social via Google

Como responsável,
Eu quero entrar com minha conta Google,
para não precisar criar outra senha.

#### Acceptance Criteria

1: Fluxo OAuth com `GOOGLE_CLIENT_ID`/`SECRET` cria ou associa conta ADULT existente
2: Conta criada via Google segue as mesmas regras de emissão de JWT/refresh cookie da Story 1.2

### Story 1.4 Seleção de perfil dentro da conta familiar

Como responsável,
Eu quero escolher qual perfil (eu ou uma das crianças) está usando a plataforma,
para que o conteúdo e as permissões sejam corretas para quem está de fato interagindo.

#### Acceptance Criteria

1: Após login, tela lista os perfis da conta familiar para seleção
2: Sessão ativa carrega o perfil selecionado (ADULT ou CHILD) para todas as chamadas subsequentes
3: Perfis CHILD não conseguem acessar configurações de conta ou dados de outros perfis

### Story 1.5 CORS e proteção cross-domain

Como mantenedor da plataforma,
Eu quero que a API só aceite requisições da origin do front-end oficial,
para reduzir risco de CSRF/CORS mal configurado.

#### Acceptance Criteria

1: CORS da API restrito à origin de `WEB_URL` (nunca `"*"` com credentials)
2: `GET /health` responde 200 sem tocar o banco, para healthcheck da plataforma de deploy

## Epic 2 Catálogo & Trilhas de Aprendizado

**Goal:** Modelar e expor o catálogo de shows/trilhas/lições com conteúdo 100% original, permitindo que a criança navegue do catálogo até uma lição específica.

### Story 2.1 Modelo de dados de shows, trilhas e lições

Como mantenedor,
Eu quero um schema que represente shows, trilhas e lições,
para estruturar o conteúdo educacional.

#### Acceptance Criteria

1: Models Prisma para `Show`, `Track` (trilha) e `Lesson`, com relações 1:N corretas
2: Campos do `Show` restritos a metadados factuais (nome, sinopse original, thumbnail própria) — sem campos para imagem/pôster de terceiros

### Story 2.2 Endpoint e UI de listagem do catálogo

Como criança (ou responsável navegando com ela),
Eu quero ver os shows disponíveis,
para escolher o que estudar.

#### Acceptance Criteria

1: Endpoint lista shows com metadados básicos
2: UI exibe cards com thumbnails próprias do design system (tema claro/escuro)

### Story 2.3 Navegação trilha → lição

Como criança,
Eu quero abrir uma trilha e ver suas lições em sequência,
para saber o que fazer a seguir.

#### Acceptance Criteria

1: Endpoint retorna lições de uma trilha em ordem
2: UI exibe conteúdo da lição (texto original, sem legendas/letras transcritas de terceiros)
3: Lições concluídas ficam marcadas visualmente

### Story 2.4 Seed de catálogo demo

Como responsável pela demo,
Eu quero dados de exemplo já populados,
para apresentar a plataforma funcionando.

#### Acceptance Criteria

1: `seed.ts` cria 2 shows, cada um com 1 trilha e 5 lições, conteúdo original
2: Seed roda sem erro via script de seed do pacote `database`

## Epic 3 Gamificação (XP, Streak, Badges)

**Goal:** Implementar o ledger de XP, o job de streak diário e o sistema de badges/ranking, dando à criança sinais visíveis de progresso.

### Story 3.1 Modelo de XpEvent e cálculo de XP derivado

Como mantenedor,
Eu quero que o XP nunca seja um campo editável diretamente,
para garantir auditabilidade e evitar inconsistência.

#### Acceptance Criteria

1: Model `XpEvent` (ledger) registra origem, quantidade e perfil
2: XP total do perfil é sempre a soma dos `XpEvent` — nenhuma escrita direta em `xpTotal`

### Story 3.2 Concessão de XP ao concluir lição

Como criança,
Eu quero ganhar XP ao terminar uma lição,
para ver meu progresso crescer.

#### Acceptance Criteria

1: Concluir uma lição cria um `XpEvent` correspondente
2: UI exibe animação de ganho de XP (Framer Motion) e XP total atualizado

### Story 3.3 Job de streak diário

Como criança,
Eu quero manter um streak de dias seguidos usando a plataforma,
para me sentir motivada a voltar todo dia.

#### Acceptance Criteria

1: `POST /internal/cron/streak` protegido por header `X-Cron-Secret` atualiza o streak de perfis ativos
2: Endpoint é idempotente e seguro para chamadas repetidas do cron externo

### Story 3.4 Sistema de badges

Como criança,
Eu quero ganhar badges por conquistas,
para ter mais motivos de orgulho no app.

#### Acceptance Criteria

1: Model de badges e regra de concessão (ex: baseada em XpEvents ou streak)
2: UI exibe badges conquistadas no perfil

### Story 3.5 Ranking entre perfis

Como criança,
Eu quero ver como estou em relação a outros perfis,
para me engajar com a plataforma.

#### Acceptance Criteria

1: Endpoint retorna ranking (ex: por XP total) respeitando privacidade (sem expor dados sensíveis de outros perfis CHILD)
2: UI exibe ranking na home

## Epic 4 Tutor de IA (Chat EN/PT)

**Goal:** Oferecer um tutor de IA em inglês contextualizado à lição para a criança praticar, e um assistente em português para dúvidas, respeitando limites diários, moderação de conteúdo e auditoria.

### Story 4.1 Integração básica com Anthropic API

Como mantenedor,
Eu quero uma camada única de acesso à Anthropic API dentro de `apps/api`,
para centralizar segurança e configuração.

#### Acceptance Criteria

1: Chamada request → resposta completa → JSON (sem streaming), atrás de flag `AI_STREAMING=false`
2: `ANTHROPIC_API_KEY` só existe no ambiente de `apps/api`

### Story 4.2 Chat de IA em inglês restrito à lição

Como criança,
Eu quero conversar em inglês sobre o tema da lição atual,
para praticar o idioma de forma guiada.

#### Acceptance Criteria

1: System prompt do chat é restrito ao universo/tema da lição ativa (para perfis CHILD)
2: IA recusa e redireciona educadamente para o tema quando a conversa foge do escopo
3: Usa modelo `claude-haiku-4-5`

### Story 4.3 Assistente de IA em português para dúvidas

Como responsável (ou criança),
Eu quero tirar dúvidas em português sobre a lição,
para entender melhor o conteúdo.

#### Acceptance Criteria

1: Endpoint dedicado usa `claude-sonnet-4-6`
2: Sujeito às mesmas regras de filtro de conteúdo e limite diário do chat em inglês

### Story 4.4 Filtro de conteúdo pré-persistência

Como responsável,
Eu quero ter certeza de que nenhuma mensagem inadequada é salva na conta da minha criança,
para manter a segurança dela.

#### Acceptance Criteria

1: Toda mensagem de um perfil CHILD passa por filtro de conteúdo antes de ser persistida
2: Mensagens reprovadas não são salvas e retornam resposta apropriada à idade

### Story 4.5 Limite diário e auditoria de tokens

Como mantenedor,
Eu quero limitar o uso diário de IA por perfil e registrar consumo de tokens,
para controlar custo e uso indevido.

#### Acceptance Criteria

1: Limite diário configurável via `AI_DAILY_LIMIT` (default 20) bloqueia novas mensagens ao ser atingido
2: Cada interação registra tokens de entrada/saída em `AiSession`

## Epic 5 Painel do Responsável & Demo

**Goal:** Dar visibilidade e controle ao responsável sobre o uso da plataforma pela criança, e garantir que a demo esteja completa e apresentável ao cliente.

### Story 5.1 Visão de jornada/progresso do responsável

Como responsável,
Eu quero ver o progresso da minha criança (lições concluídas, XP, streak, badges),
para acompanhar o aprendizado.

#### Acceptance Criteria

1: Painel do responsável exibe jornada consolidada por perfil CHILD da conta

### Story 5.2 Transcrições de chat visíveis ao responsável

Como responsável,
Eu quero ler as conversas de IA da minha criança,
para ter total transparência sobre o que ela está falando com a IA.

#### Acceptance Criteria

1: Painel do responsável lista transcrições de `AiSession` por perfil CHILD

### Story 5.3 Seed de demonstração completo

Como equipe de vendas,
Eu quero uma demo pronta para mostrar ao cliente,
para validar a proposta de valor da plataforma.

#### Acceptance Criteria

1: `seed.ts` popula: 1 conta familiar (pai + perfil criança), 1 conta adulta avulsa, 2 shows completos, badges e XpEvents suficientes para popular home/jornada/ranking
2: Seed roda de forma idempotente em ambiente limpo

### Story 5.4 Revisão final de conformidade de domínio

Como mantenedor,
Eu quero validar que nenhuma regra de domínio foi violada antes da demo,
para evitar problemas legais ou de UX com o cliente.

#### Acceptance Criteria

1: Checklist manual/automatizado confirma: nenhum asset de terceiros no catálogo, perfis CHILD sem dados excedentes, XP só via ledger, CORS restrito, `ANTHROPIC_API_KEY` ausente do `apps/web`

## Checklist Results Report

**Executive Summary**

- Completude geral do PRD: ~75%
- Adequação do escopo de MVP: Just Right para uma demo técnica de cliente (não é um lançamento comercial pleno — isso está refletido nas lacunas abaixo)
- Prontidão para fase de arquitetura: **Nearly Ready**
- Lacunas mais críticas: (1) ausência de seção explícita de "fora de escopo" / roadmap futuro; (2) ausência de métricas de sucesso e research de usuário formal (aceitável dado que este é um projeto de demo interno, não um produto validado por research); (3) Epic 1 não inclui a Fase 0 como story formal (decisão consciente, documentada).

**Category Statuses**

| Category | Status | Critical Issues |
|---|---|---|
| 1. Problem Definition & Context | PARTIAL | Sem quantificação de impacto do problema, sem análise competitiva, sem research formal de usuário (aceito — projeto é demo B2B, não produto validado por pesquisa) |
| 2. MVP Scope Definition | PARTIAL | Falta seção explícita "Fora de Escopo" e "Enhancements Futuros"; falta critério formal de "quando sair do MVP" |
| 3. User Experience Requirements | PARTIAL | Fluxos de usuário descritos via Core Screens, mas sem diagrama de fluxo/edge cases explícitos; performance percebida pelo usuário não quantificada |
| 4. Functional Requirements | PASS | — |
| 5. Non-Functional Requirements | PARTIAL | Sem metas explícitas de tempo de resposta; backup/recovery do banco não endereçado (aceitável — TiDB/Aiven gerenciam isso na camada de infra) |
| 6. Epic & Story Structure | PARTIAL | Epic 1 assume a Fase 0 (scaffold) como pré-existente em vez de incluí-la como story — decisão consciente e documentada, não um esquecimento |
| 7. Technical Guidance | PASS | — |
| 8. Cross-Functional Requirements | PARTIAL | Monitoramento/alerting não endereçado (aceitável para ambiente de demo free-tier) |
| 9. Clarity & Communication | PARTIAL | Processo de aprovação é informal (esta própria conversa); sem stakeholders adicionais identificados além do usuário atual |

**Top Issues by Priority**

- BLOCKERS: nenhum — nada impede o Architect de prosseguir
- HIGH: nenhum
- MEDIUM: adicionar seção "Fora de Escopo" (ex: pagamentos, múltiplos idiomas de UI, apps nativos) para deixar explícito o que NÃO está no MVP
- LOW: quantificar metas de performance percebida (ex: tempo de carregamento de lição); documentar critério de "sucesso da demo" (ex: cliente aprova avançar para produção)

**MVP Scope Assessment**

- Nada a cortar — todos os 5 epics endereçam necessidades centrais do produto (auth, conteúdo, gamificação, IA, transparência parental)
- Nenhuma funcionalidade essencial parece faltando para uma demo completa
- Complexidade: Epic 4 (IA) é o de maior risco técnico (moderação de conteúdo para crianças, dois modelos, limite diário) — mereceria atenção extra do Architect
- Timeline: não avaliável sem estimativas de esforço por story (fora do escopo do PM neste momento)

**Technical Readiness**

- Restrições técnicas claras e não-negociáveis (stack fixa do CLAUDE.md, free tier, dialeto MySQL-compatível)
- Risco técnico identificado: filtro de conteúdo para perfis CHILD (Epic 4, Story 4.4) precisa de definição arquitetural clara — é o ponto mais sensível do produto
- Área para investigação do Architect: estratégia de connection pooling do Prisma sob cold-start do Render/Koyeb (NFR1/NFR2)

**Recommendations**

- Adicionar seção "Fora de Escopo" ao PRD antes ou durante o *shard-prd (não bloqueante, pode ser feito em paralelo com a arquitetura)
- Architect deve tratar o filtro de conteúdo (Story 4.4) como decisão arquitetural explícita, não implementação incidental
- Prosseguir para @architect com este PRD

**Final Decision: READY FOR ARCHITECT** — o PRD e os epics estão suficientemente completos, bem estruturados e sem bloqueadores para o design arquitetural prosseguir. As lacunas identificadas são PARTIAL por ausência de elementos não-essenciais para um projeto de demo (research formal, métricas de negócio, fora-de-escopo explícito), não por erros ou inconsistências no conteúdo produzido.

## Next Steps

### UX Expert Prompt

Use este PRD (`docs/prd.md`) como entrada para desenhar a arquitetura de front-end e o design system do Epic 1-2 (telas de auth, seleção de perfil, catálogo). Priorize: tema claro/escuro via tokens de `packages/ui`, componentes shadcn/ui, microanimações Framer Motion para feedback de gamificação. Acessibilidade alvo: WCAG AA.

### Architect Prompt

Use este PRD (`docs/prd.md`) como entrada para a arquitetura técnica. Stack já fixada (não reabrir decisão): Turborepo+pnpm, Next.js 15/NestJS, Prisma+MySQL-compatível, JWT+refresh cookie cross-domain, Anthropic API isolada em `apps/api`. Foco da arquitetura: schema de dados para Epics 1-3 (contas/perfis, catálogo, XP ledger/streak/badges), contrato de API para o chat de IA (Epic 4), e estratégia de deploy free-tier (Vercel/Render-Koyeb/TiDB-Aiven) com caminho de migração para Hostinger/VPS.
