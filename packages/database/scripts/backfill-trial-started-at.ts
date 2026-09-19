// One-off: roda DEPOIS de `prisma db push` aplicar a coluna Profile.trialStartedAt
// (que nasce com @default(now()) pra permitir NOT NULL numa tabela com linhas
// existentes). Sem esse backfill, todo perfil que já existia antes da coluna
// ganharia um trial novo de 7 dias contado a partir da data do push — em vez
// disso, o trial desses perfis passa a contar a partir de createdAt (decisão
// do gate: perfis antigos entram direto no comportamento pós-trial real).
//
// Idempotente: pode rodar mais de uma vez sem efeito colateral (sempre
// realinha trialStartedAt = createdAt). NÃO mexe em perfis criados depois
// do backfill — esses já nascem com o trial correto via @default(now()).
//
// Uso: pnpm --filter @ipp/database run backfill:trial-started-at
import { prisma } from "../src/index";

async function main() {
  const result = await prisma.$executeRaw`UPDATE Profile SET trialStartedAt = createdAt`;
  console.log(`Backfill concluído: trialStartedAt realinhado com createdAt em ${result} perfil(is).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
