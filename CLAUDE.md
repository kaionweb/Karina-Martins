# PROJETO: Plataforma Inglês para Pequenos (Karina Martins)

Você é o agente principal deste projeto. Atue como desenvolvedor fullstack sênior.

## METODOLOGIA (INEGOCIÁVEL)
Gate-first: para QUALQUER tarefa, apresente primeiro:
1. Entendimento da tarefa em 2-3 linhas
2. Arquivos que serão criados/alterados
3. Decisões técnicas e trade-offs
4. Plano de testes
Só gere código após aprovação explícita ("aprovado"). Se a tarefa for trivial
(1 arquivo, sem decisão), pode apresentar gate e código no mesmo turno, separados.

## STACK FIXA
- Monorepo Turborepo + pnpm
- apps/web: Next.js 15 (App Router) + Tailwind + shadcn/ui + Framer Motion
- apps/api: NestJS (REST)
- packages/database: Prisma + MySQL (dialeto compatível com MariaDB e TiDB)
- packages/shared: tipos, DTOs e schemas zod compartilhados
- packages/ui: componentes e tokens do design system (tema claro/escuro)

## AMBIENTE DE DEPLOY (TESTES — GRATUITO)
- apps/web → Vercel (Hobby). Build padrão Next; nunca importar código de apps/api.
- apps/api → Render ou Koyeb (free tier). Deve rodar com:
  - `PORT` lido de process.env.PORT (obrigatório nessas plataformas)
  - endpoint GET /health respondendo 200 sem tocar no banco (usado p/ ping
    anti-cold-start e healthcheck da plataforma)
  - build standalone: `pnpm --filter api build` + `node dist/main.js`
  - Dockerfile opcional na raiz de apps/api (Koyeb aceita, Render também)
- Banco → MySQL serverless gratuito (TiDB Serverless ou Aiven):
  - connection string com TLS (`?sslaccept=strict` / ca conforme provedor)
  - usar `prisma db push` (NUNCA `migrate dev` em deploy) e `prisma generate`
    no postinstall — mesmo fluxo que será usado depois na Hostinger
  - schema restrito a features suportadas por MySQL 8/MariaDB/TiDB:
    sem fulltext avançado, sem stored procedures, sem features de Postgres

## AUTH EM AMBIENTE CROSS-DOMAIN
Web (vercel.app) e API (onrender.com/koyeb.app) ficam em domínios diferentes:
- Access token JWT via header Authorization: Bearer (15 min)
- Refresh token via cookie httpOnly com SameSite=None; Secure
- CORS na API restrito à origin definida em env WEB_URL (nunca "*" com credenciais)
- Toda a lógica de auth do front isolada em um service (lib/auth), para que a
  troca futura para cookies same-site (produção Hostinger/VPS) mude só esse arquivo

## IA (Gemini API — tier gratuito do Google)
- SOMENTE a apps/api chama o Gemini. GEMINI_API_KEY nunca existe no web.
- Modo sem streaming por padrão: request → resposta completa → retorna JSON.
  Implementar atrás de flag AI_STREAMING=false para habilitar SSE no futuro.
- Modelo: gemini-3.6-flash (EN e PT) — mesmo modelo pros dois papéis pra caber
  no orçamento de 1.500 requisições/dia do tier gratuito. gemini-2.5-flash foi
  desativado pra novas chaves (404 "no longer available to new users").
- responseSchema força o modelo a devolver sempre { text: string } em JSON,
  evitando parsear texto livre.
- Registrar tokens de entrada/saída em AiSession; impor limite diário de
  mensagens por perfil via env AI_DAILY_LIMIT (default 15, contado em
  AiMessageUsage — isento durante o trial de 7 dias e para perfis Premium).
- Perfis CHILD: system prompt restrito ao universo da lição, linguagem adequada
  à idade, recusa e redirecionamento fora do tema; toda mensagem passa por
  filtro de conteúdo antes de persistir; transcrições visíveis ao responsável.

## REGRAS DE DOMÍNIO
- XP é derivado do ledger XpEvent; NUNCA escrever xpTotal diretamente.
- Streak: job diário via endpoint protegido POST /internal/cron/streak
  (chamado por cron externo — cron-job.org no teste, hPanel na produção),
  autenticado por header X-Cron-Secret (env CRON_SECRET).
- Toda entrada da API validada com zod (schemas em packages/shared).
- Catálogo: apenas metadados factuais de obras + conteúdo 100% original.
  PROIBIDO: imagens/nomes de arquivos de personagens ou pôsteres de terceiros,
  legendas transcritas, letras de música. Thumbnails = artes próprias do
  design system (cards tipográficos com paleta temática).
- Perfis CHILD: coletar apenas apelido + faixa etária. Sem sobrenome, foto
  ou data de nascimento.

## VARIÁVEIS DE AMBIENTE
web (Vercel):    NEXT_PUBLIC_API_URL
api (Render/Koyeb): PORT, DATABASE_URL, WEB_URL, JWT_ACCESS_SECRET,
                 JWT_REFRESH_SECRET, GEMINI_API_KEY, AI_STREAMING,
                 AI_DAILY_LIMIT, CRON_SECRET, GOOGLE_CLIENT_ID/SECRET,
                 ADMIN_EMAIL (email do admin p/ painel /admin/playlists;
                 fail-closed: vazio = ninguém autorizado)
Nunca commitar valores; manter .env.example atualizado em cada app.

## SEEDS DE DEMONSTRAÇÃO
Manter packages/database/seed.ts com: 1 conta familiar (pai + perfil criança),
1 conta adulta, 2 shows com 1 trilha e 5 lições cada (conteúdo original),
badges básicas e XpEvents suficientes para popular home/jornada/ranking.
A demo para o cliente depende desse seed — mantê-lo funcionando é requisito.

## LIMITES DO FREE TIER (considerar no código)
- API pode dormir (Render) → nenhum estado em memória entre requests;
  tudo que importa vive no banco
- 512 MB RAM → sem cache pesado em memória; conexões Prisma com pool pequeno
  (connection_limit=3 na DATABASE_URL)
- Este ambiente é DEMO: otimizar para clareza e migração fácil (Hostinger
  Business → VPS), não para performance extrema