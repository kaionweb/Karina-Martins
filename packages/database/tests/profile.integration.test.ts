import { prisma } from "../src/index";

describe("User + Profile (Story 1.1)", () => {
  const testEmail = `story-1.1-${Date.now()}@test.local`;
  let userId: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("cria um User e um Profile ADULT vinculado a ele", async () => {
    const user = await prisma.user.create({
      data: { email: testEmail, passwordHash: "hashed-password" },
    });
    userId = user.id;

    const adultProfile = await prisma.profile.create({
      data: { userId, nickname: "Responsável", type: "ADULT" },
    });

    expect(adultProfile.userId).toBe(userId);
    expect(adultProfile.type).toBe("ADULT");
  });

  it("cria um Profile CHILD com apenas apelido e faixa etária (AC2)", async () => {
    const childProfile = await prisma.profile.create({
      data: { userId, nickname: "Pequeno Explorador", type: "CHILD", ageRange: "4-6" },
    });

    expect(childProfile.nickname).toBe("Pequeno Explorador");
    expect(childProfile.ageRange).toBe("4-6");
    expect(childProfile.type).toBe("CHILD");

    // AC2: nenhum campo de sobrenome, foto ou data de nascimento existe no shape do Profile
    // (currentStreak/longestStreak/lastActiveDate adicionados na Story 3.3 — streak, não identidade)
    const allowedKeys = [
      "id",
      "userId",
      "nickname",
      "type",
      "ageRange",
      "currentStreak",
      "longestStreak",
      "lastActiveDate",
      "createdAt",
    ];
    expect(Object.keys(childProfile).sort()).toEqual(allowedKeys.sort());
  });

  it("lista os perfis de um User (relação 1:N)", async () => {
    const profiles = await prisma.profile.findMany({ where: { userId } });
    expect(profiles.length).toBeGreaterThanOrEqual(2);
    expect(profiles.map((p) => p.type).sort()).toEqual(["ADULT", "CHILD"]);
  });
});
