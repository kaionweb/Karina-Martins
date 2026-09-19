# syntax=docker/dockerfile:1
#
# Build context deve ser a RAIZ do monorepo:
#   docker build -f apps/api/Dockerfile .
# (necessario para acesso ao pnpm-lock.yaml e aos workspaces packages/*)

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# Usa o Turbo (nao "pnpm --filter api build" direto) para respeitar o
# dependsOn: ["^build"] do turbo.json - packages/shared e packages/database
# (dist/ gitignored, nunca existe num clone limpo) precisam ser compilados
# ANTES da api, senao "nest build" falha ("Cannot find module '@ipp/shared'
# or its corresponding type declarations") e, mesmo se passasse, o runtime
# quebraria (package.json aponta main/types para dist/ inexistente).
RUN pnpm exec turbo run build --filter=api...
RUN pnpm deploy --filter=api --prod /repo/out
# "pnpm deploy" reinstala node_modules em /repo/out e reexecuta o postinstall
# de @ipp/database (prisma generate) - mas o Prisma Client resultante nao fica
# consistente (validado localmente: "@prisma/client did not initialize yet"
# ao rodar node dist/main.js logo apos o deploy). Regenerar explicitamente
# contra a copia final elimina a ambiguidade.
RUN cd /repo/out/node_modules/@ipp/database && node_modules/.bin/prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/out/dist ./dist
COPY --from=build /repo/out/node_modules ./node_modules
COPY --from=build /repo/out/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/main.js"]
