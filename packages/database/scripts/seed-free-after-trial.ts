// One-off: aplica a regra "a primeira série cadastrada de cada nível nasce
// freeAfterTrial=true" (mesma regra do AdminSeriesService.upsertSeries) nas
// séries que já existiam em produção ANTES do campo freeAfterTrial existir.
// Só mexe em freeAfterTrial — não toca em playlistId/emoji/level/etc, ao
// contrário de rodar o seed.ts inteiro de novo (que sobrescreveria séries já
// configuradas manualmente no admin).
//
// Idempotente: só marca um nível se ele ainda não tem nenhuma série livre.
//
// Uso: pnpm --filter @ipp/database run seed:free-after-trial
// Também reaproveitado por seed.ts (seedFreeAfterTrial), pra ambientes novos
// rodando o seed do zero ganharem o mesmo resultado automaticamente.
import { prisma } from "../src/index";

export async function markFirstSeriesPerLevelAsFree(): Promise<number> {
  const levels = ["BASICO", "INTERMEDIARIO", "AVANCADO"] as const;
  let marked = 0;

  for (const level of levels) {
    const hasFree = await prisma.series.count({ where: { level, freeAfterTrial: true } });
    if (hasFree > 0) continue;

    const candidate = await prisma.series.findFirst({ where: { level }, orderBy: { createdAt: "asc" } });
    if (candidate) {
      await prisma.series.update({ where: { id: candidate.id }, data: { freeAfterTrial: true } });
      console.log(`  ${level}: "${candidate.title}" marcada como grátis-permanente.`);
      marked += 1;
    } else {
      console.log(`  ${level}: nenhuma série cadastrada ainda, nada a marcar.`);
    }
  }

  return marked;
}

// Só executa como CLI quando rodado diretamente (tsx scripts/seed-free-after-trial.ts),
// não quando importado por seed.ts.
if (require.main === module) {
  markFirstSeriesPerLevelAsFree()
    .then((marked) => {
      console.log(`Concluído: ${marked} série(s) marcada(s).`);
      return prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
