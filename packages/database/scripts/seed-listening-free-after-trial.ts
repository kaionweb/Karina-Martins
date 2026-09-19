// One-off: aplica a regra "a primeira playlist LISTENING cadastrada de cada
// nível nasce freeAfterTrial=true" (mesma regra de AdminPlaylistsService)
// nas playlists que já existiam em produção ANTES do campo freeAfterTrial
// existir. Só mexe em freeAfterTrial — não toca em channel/level/theme/etc.
// Mesmo espírito de scripts/seed-free-after-trial.ts (Series).
//
// Idempotente: só marca um nível se ele ainda não tem nenhuma playlist livre.
//
// Uso: pnpm --filter @ipp/database run seed:listening-free-after-trial
import { prisma } from "../src/index";

async function main() {
  const levels = ["INICIANTE", "INTERMEDIARIO", "AVANCADO"] as const;
  let marked = 0;

  for (const level of levels) {
    const hasFree = await prisma.curatedPlaylist.count({ where: { skill: "LISTENING", level, freeAfterTrial: true } });
    if (hasFree > 0) continue;

    const candidate = await prisma.curatedPlaylist.findFirst({
      where: { skill: "LISTENING", level },
      orderBy: { createdAt: "asc" },
    });
    if (candidate) {
      await prisma.curatedPlaylist.update({ where: { id: candidate.id }, data: { freeAfterTrial: true } });
      console.log(`  ${level}: playlist "${candidate.theme}" (${candidate.channel}) marcada como grátis-permanente.`);
      marked += 1;
    } else {
      console.log(`  ${level}: nenhuma playlist LISTENING cadastrada ainda, nada a marcar.`);
    }
  }

  console.log(`Concluído: ${marked} playlist(s) marcada(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
