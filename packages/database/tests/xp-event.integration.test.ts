import { prisma } from "../src/index";

describe("XpEvent (Story 3.1)", () => {
  const testEmail = `story-3.1-${Date.now()}@test.local`;
  let userId: string;
  let profileId: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("cria um Profile e múltiplos XpEvents com fontes diferentes (AC1)", async () => {
    const user = await prisma.user.create({ data: { email: testEmail, passwordHash: "hashed-password" } });
    userId = user.id;

    const profile = await prisma.profile.create({
      data: { userId, nickname: "Pequeno Explorador", type: "CHILD", ageRange: "4-6" },
    });
    profileId = profile.id;

    await prisma.xpEvent.createMany({
      data: [
        { profileId, amount: 10, source: "LESSON_COMPLETED" },
        { profileId, amount: 5, source: "LESSON_COMPLETED" },
        { profileId, amount: 20, source: "STREAK_BONUS" },
        { profileId, amount: 50, source: "BADGE_AWARDED" },
      ],
    });

    const events = await prisma.xpEvent.findMany({ where: { profileId } });
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.source).sort()).toEqual(
      ["BADGE_AWARDED", "LESSON_COMPLETED", "LESSON_COMPLETED", "STREAK_BONUS"].sort(),
    );
  });

  it("XP total do perfil é sempre a soma dos XpEvent, calculada por agregação (AC2)", async () => {
    const result = await prisma.xpEvent.aggregate({
      _sum: { amount: true },
      where: { profileId },
    });

    // 10 + 5 + 20 + 50, exatamente os valores criados no teste anterior — nenhum
    // campo de XP total é lido ou escrito, só a soma agregada do ledger.
    expect(result._sum.amount).toBe(85);
  });

  it("apagar o Profile remove os XpEvents associados (cascade)", async () => {
    await prisma.profile.delete({ where: { id: profileId } });

    const remainingEvents = await prisma.xpEvent.findMany({ where: { profileId } });
    expect(remainingEvents).toHaveLength(0);
  });
});
