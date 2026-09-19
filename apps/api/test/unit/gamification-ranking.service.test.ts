import { prisma } from "@ipp/database";
import { GamificationService } from "../../src/modules/gamification/gamification.service";

/**
 * Testa a lógica de ranking (getRanking) isolada do HTTP, contra o banco de
 * teste real (mesmo padrão de video-watch.service.test.ts — sem mocks).
 *
 * O banco de teste é compartilhado (seed + outros testes podem criar perfis
 * CHILD). Por isso as asserções são RELATIVAS entre os perfis criados aqui
 * (mais XP ⇒ posição menor; empate ⇒ createdAt asc ⇒ posição menor) e não
 * dependem de posições absolutas globais — exceto totalParticipants, que é
 * comparado com a contagem real de perfis CHILD no banco.
 */
describe("GamificationService.getRanking (Story 10.2)", () => {
  const runId = Date.now();
  const email = `unit-10.2-${runId}@test.local`;
  const service = new GamificationService();

  let highId: string;
  let midId: string;
  let lowId: string;
  let tieOldId: string;
  let tieNewId: string;
  let adultId: string;

  async function createChild(nickname: string, xp: number, createdAt?: Date): Promise<string> {
    const profile = await prisma.profile.create({
      data: {
        userId,
        nickname,
        type: "CHILD",
        ageRange: "4-6",
        ...(createdAt ? { createdAt } : {}),
      },
    });
    if (xp > 0) {
      await prisma.xpEvent.create({ data: { profileId: profile.id, amount: xp, source: "LESSON_COMPLETED" } });
    }
    return profile.id;
  }

  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: "hash-de-teste" } });
    userId = user.id;

    highId = await createChild("High", 500);
    midId = await createChild("Mid", 300);
    lowId = await createChild("Low", 100);

    // Empate em 250 XP: tieOld criado "antes" de tieNew (createdAt explícito) —
    // o desempate determinístico deve colocar tieOld na frente.
    tieOldId = await createChild("TieOld", 250, new Date("2020-01-01T00:00:00.000Z"));
    tieNewId = await createChild("TieNew", 250, new Date("2020-01-02T00:00:00.000Z"));

    const adult = await prisma.profile.create({
      data: { userId, nickname: "Grown", type: "ADULT" },
    });
    adultId = adult.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("ordena por XP total desc (mais XP ⇒ posição menor)", async () => {
    const [high, mid, low] = await Promise.all([
      service.getRanking(highId),
      service.getRanking(midId),
      service.getRanking(lowId),
    ]);

    expect(high.position).not.toBeNull();
    expect(mid.position).not.toBeNull();
    expect(low.position).not.toBeNull();
    expect(high.position!).toBeLessThan(mid.position!);
    expect(mid.position!).toBeLessThan(low.position!);
  });

  it("resolve empate por createdAt asc (perfil mais antigo fica na frente) de forma determinística", async () => {
    // Executa duas vezes: a posição relativa não pode variar entre execuções.
    const first = await Promise.all([service.getRanking(tieOldId), service.getRanking(tieNewId)]);
    const second = await Promise.all([service.getRanking(tieOldId), service.getRanking(tieNewId)]);

    expect(first[0].position!).toBeLessThan(first[1].position!);
    expect(second[0].position!).toBeLessThan(second[1].position!);
    expect(first[0].position).toBe(second[0].position);
    expect(first[1].position).toBe(second[1].position);
  });

  it("perfil ADULT não participa do ranking: position null, totalParticipants = contagem de CHILD", async () => {
    const res = await service.getRanking(adultId);
    const childCount = await prisma.profile.count({ where: { type: "CHILD" } });

    expect(res.position).toBeNull();
    expect(res.totalParticipants).toBe(childCount);
  });

  it("totalParticipants para um perfil CHILD também reflete a contagem real de CHILD", async () => {
    const res = await service.getRanking(highId);
    const childCount = await prisma.profile.count({ where: { type: "CHILD" } });
    expect(res.totalParticipants).toBe(childCount);
  });
});
