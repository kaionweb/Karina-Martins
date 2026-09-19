import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

/**
 * Contrato HTTP de GET /gamification/ranking (Story 10.2).
 *
 * O banco de teste é compartilhado; as posições absolutas dependem de todos os
 * perfis CHILD existentes. Por isso as asserções de posição são RELATIVAS entre
 * os 3 perfis criados aqui (mais XP ⇒ posição menor) e totalParticipants é
 * comparado com a contagem real de CHILD.
 */
describe("Ranking (Story 10.2)", () => {
  let app: INestApplication;
  const testEmail = `story-10.2-${Date.now()}@test.local`;
  const password = "senha-segura-123";

  let loginToken: string; // sem perfil ativo (antes do select) → 403
  let userId: string;

  let childHighId: string;
  let childMidId: string;
  let childLowId: string;

  async function scopedTokenFor(profileId: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post(`/profiles/${profileId}/select`)
      .set("Authorization", `Bearer ${loginToken}`)
      .expect(200);
    return res.body.accessToken;
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    loginToken = loginRes.body.accessToken;

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    userId = user.id;

    // 3 perfis CHILD sob o mesmo usuário, com XPs distintos.
    const high = await prisma.profile.create({
      data: { userId, nickname: "High", type: "CHILD", ageRange: "4-6" },
    });
    const mid = await prisma.profile.create({
      data: { userId, nickname: "Mid", type: "CHILD", ageRange: "4-6" },
    });
    const low = await prisma.profile.create({
      data: { userId, nickname: "Low", type: "CHILD", ageRange: "4-6" },
    });
    childHighId = high.id;
    childMidId = mid.id;
    childLowId = low.id;

    await prisma.xpEvent.createMany({
      data: [
        { profileId: childHighId, amount: 500, source: "LESSON_COMPLETED" },
        { profileId: childMidId, amount: 300, source: "LESSON_COMPLETED" },
        { profileId: childLowId, amount: 100, source: "LESSON_COMPLETED" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita GET /gamification/ranking sem token (401)", async () => {
    await request(app.getHttpServer()).get("/gamification/ranking").expect(401);
  });

  it("rejeita GET /gamification/ranking sem perfil ativo (403 NO_ACTIVE_PROFILE)", async () => {
    const res = await request(app.getHttpServer())
      .get("/gamification/ranking")
      .set("Authorization", `Bearer ${loginToken}`)
      .expect(403);
    expect(res.body.error?.code ?? res.body.code).toBe("NO_ACTIVE_PROFILE");
  });

  it("retorna posições relativas coerentes com o XP (mais XP ⇒ posição menor) e totalParticipants real", async () => {
    const tokenHigh = await scopedTokenFor(childHighId);
    const tokenMid = await scopedTokenFor(childMidId);
    const tokenLow = await scopedTokenFor(childLowId);

    const [resHigh, resMid, resLow] = await Promise.all([
      request(app.getHttpServer()).get("/gamification/ranking").set("Authorization", `Bearer ${tokenHigh}`).expect(200),
      request(app.getHttpServer()).get("/gamification/ranking").set("Authorization", `Bearer ${tokenMid}`).expect(200),
      request(app.getHttpServer()).get("/gamification/ranking").set("Authorization", `Bearer ${tokenLow}`).expect(200),
    ]);

    const childCount = await prisma.profile.count({ where: { type: "CHILD" } });

    for (const res of [resHigh, resMid, resLow]) {
      expect(res.body.position).not.toBeNull();
      expect(res.body.totalParticipants).toBe(childCount);
    }

    expect(resHigh.body.position).toBeLessThan(resMid.body.position);
    expect(resMid.body.position).toBeLessThan(resLow.body.position);
  });
});
